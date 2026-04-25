/**
 * views/atenciones.js — Historial de atenciones por fecha.
 */
import { api }        from '../utils/api.js'
import { toastError } from '../utils/toast.js'
import { icon, iconBtn } from '../utils/icons.js'
import { openModal, closeModal } from '../components/modal.js'
import { renderTable, wrapTable } from '../components/table.js'

const content = () => document.getElementById('app-content')
const CARGO   = parseInt(document.querySelector('meta[name="user-cargo"]')?.content ?? '0')

export async function AtencionesView() {
  const hoy = new Date().toISOString().split('T')[0]
  content().innerHTML = `
    <div class="cabecera">
      <h2>Atenciones</h2>
      <div class="cont-control">
        <input type="date" id="fecha-aten" value="${hoy}" />
      </div>
    </div>
    <div id="tabla-aten-wrap"></div>`

  await cargar()
  document.getElementById('fecha-aten')?.addEventListener('change', cargar)

  content().addEventListener('click', async (e) => {
    const btn = e.target.closest('[data-action="ver"]')
    if (!btn) return
    const tr        = btn.closest('tr')
    const idatencion = parseInt(tr?.dataset.id)
    const dni        = tr?.dataset.dni ?? ''
    if (!idatencion) return
    await abrirHistorial(idatencion, dni)
  })
}

async function cargar() {
  const wrap  = document.getElementById('tabla-aten-wrap')
  if (!wrap) return
  wrap.innerHTML = `<div class="state-loading"><div class="spinner"></div></div>`
  const fecha = document.getElementById('fecha-aten')?.value ?? new Date().toISOString().split('T')[0]
  try {
    const { data } = await api.get('/api/atenciones', { fecha })
    wrap.innerHTML = wrapTable(renderTable({
      columns: [
        { key: 'fechaatencion', label: 'Fecha',    align: 'center' },
        { key: 'paciente',      label: 'Paciente' },
        { key: 'motivo',        label: 'Motivo de Consulta' },
        ...(CARGO === 1 ? [{ label: 'Ver', align: 'center', render: () => iconBtn('eye', 'ver', 'Ver historial', 'icon-info') }] : []),
      ],
      rows: data.map(r => ({ ...r, _id: r.idatencion, 'data-dni': r.dni })),
      emptyMsg: 'No hay atenciones para esta fecha.',
    }))
    // Inyectar data-dni en los <tr>
    document.querySelectorAll('#tabla-aten-wrap tbody tr').forEach((tr, i) => {
      if (data[i]) tr.dataset.dni = data[i].dni
    })
  } catch (err) {
    wrap.innerHTML = `<div class="state-error">${err.message}</div>`
  }
}

async function abrirHistorial(idatencion, dni) {
  openModal(`<div class="state-loading"><div class="spinner"></div></div>`, { wide: true })
  try {
    const [{ data: a }, { data: pac }, { data: atLista }] = await Promise.all([
      api.get(`/api/atenciones/${idatencion}`),
      dni ? api.get(`/api/pacientes/${dni}`) : Promise.resolve({ data: {} }),
      dni ? api.get('/api/atenciones/paciente', { dni }) : Promise.resolve({ data: [] }),
    ])

    const lista = atLista.map(at =>
      `<li><button class="link-btn" data-idaten="${at.idatencion}" data-tipo="${at.tipo}">${at.fecha} — ${at.nombre}</button></li>`
    ).join('') || '<li class="muted">Sin historial.</li>'

    const html = `
      <h2 class="modal-title">${pac.apellidos ?? ''}, ${pac.nombre ?? ''}</h2>
      <p class="modal-subtitle">DNI: ${pac.dni ?? dni}</p>
      <div class="historial-layout">
        <aside class="historial-aside"><ul class="historial-list">${lista}</ul></aside>
        <div class="historial-panel" id="hist-panel">${renderAtencion(a)}</div>
      </div>`

    openModal(html, { wide: true })

    document.getElementById('modal-content').addEventListener('click', async (e) => {
      const btn = e.target.closest('[data-idaten]')
      if (!btn) return
      const panel = document.getElementById('hist-panel')
      panel.innerHTML = `<div class="state-loading"><div class="spinner"></div></div>`
      try {
        const { data: at } = await api.get(`/api/atenciones/${btn.dataset.idaten}`)
        panel.innerHTML = renderAtencion(at)
      } catch (err) { panel.innerHTML = `<div class="state-error">${err.message}</div>` }
    })
  } catch (err) {
    openModal(`<div class="state-error">${err.message}</div>`)
  }
}

function renderAtencion(a) {
  if (!a) return '<p class="muted">Sin datos.</p>'
  const fila = (l, v) => v && v !== '-' ? `<tr><td class="label-cell">${l}</td><td>${v}</td></tr>` : ''
  return `
    <table class="gm-table detail-table"><tbody>
      ${fila('Fecha',        a.fechaatencion)}
      ${fila('FC',           a.fr)} ${fila('PA', a.pa)} ${fila('T°', a.temp)} ${fila('So2', a.so2)} ${fila('Peso', a.peso)}
      ${fila('Antecedente',  a.antecedente)}
      ${fila('Molestia',     a.motivoconsulta)}
      ${fila('Anamnesis',    a.anamensis)}
      ${fila('Examen físico',a.exfisico)}
      ${fila('Diagnóstico',  a.diagnostico)}
      ${fila('Tratamiento',  a.tratamiento)}
    </tbody></table>
    <div style="margin-top:10px;">
      <a href="/pdf/receta/${a.idatencion}" target="_blank" class="btn-secundario">${icon('pdf')} Ver PDF</a>
    </div>`
}
