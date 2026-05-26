/**
 * views/atenciones.js — Historial de atenciones por fecha.
 *
 * Mejoras fase 4:
 *  · Cabecera con navegador de fecha (igual a citas).
 *  · Filas con avatar y dos líneas (paciente + motivo).
 *  · Modal de historial reutiliza el mismo diseño SOAP de pacientes.
 */

import { api }                       from '../utils/api.js'
import { toastError }                from '../utils/toast.js'
import { icon, iconBtn }             from '../utils/icons.js'
import { openModal }                 from '../components/modal.js'
import { renderTable, wrapTable }    from '../components/table.js'
import { skeletonTable }             from '../components/skeleton.js'

const content = () => document.getElementById('app-content')
const CARGO   = parseInt(document.querySelector('meta[name="user-cargo"]')?.content ?? '0')

export async function AtencionesView() {
  const hoy = new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0]

  content().innerHTML = `
    <div class="citas-header">
      <div class="citas-header__top">
        <div class="citas-header__title">
          <h1>Atenciones</h1>
          <span class="gm-page-header__sub" id="aten-fecha-label"></span>
        </div>
        <div class="citas-header__nav">
          <button class="icon-btn" id="btn-aten-prev" aria-label="Día anterior">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
          <button class="btn-secundario btn-sm" id="btn-aten-hoy" type="button">Hoy</button>
          <button class="icon-btn" id="btn-aten-next" aria-label="Día siguiente">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
          </button>
          <input type="date" id="fecha-aten" value="${hoy}" />
        </div>
      </div>
    </div>
    <div id="tabla-aten-wrap"></div>`

  await cargar()
  bindEventos()
}

function bindEventos() {
  const el = content()
  el.querySelector('#fecha-aten')?.addEventListener('change', cargar)
  el.querySelector('#btn-aten-prev')?.addEventListener('click', () => cambiarFecha(-1))
  el.querySelector('#btn-aten-next')?.addEventListener('click', () => cambiarFecha(+1))
  el.querySelector('#btn-aten-hoy')?.addEventListener('click', () => {
    document.getElementById('fecha-aten').value = new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0]
    cargar()
  })

  el.addEventListener('click', async (e) => {
    const btn = e.target.closest('[data-action="ver"]')
    if (!btn) return
    const tr         = btn.closest('tr')
    const idatencion = parseInt(tr?.dataset.id)
    const dni        = tr?.dataset.dni ?? ''
    if (!idatencion) return
    await abrirHistorial(idatencion, dni)
  })
}

function cambiarFecha(dias) {
  const input = document.getElementById('fecha-aten')
  if (!input) return
  const d = new Date(input.value + 'T00:00:00')
  d.setDate(d.getDate() + dias)
  input.value = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().split('T')[0]
  cargar()
}

async function cargar() {
  const wrap  = document.getElementById('tabla-aten-wrap')
  if (!wrap) return
  wrap.innerHTML = skeletonTable(5, 4)

  const fecha = document.getElementById('fecha-aten')?.value ?? new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0]
  actualizarLabelFecha(fecha)

  try {
    const { data } = await api.get('/api/atenciones', { fecha })

    if (!data.length) {
      wrap.innerHTML = `
        <div class="gm-empty">
          <div class="gm-empty__icon">${icon('heartbeat')}</div>
          <p class="gm-empty__text">No hay atenciones registradas para esta fecha.</p>
        </div>`
      return
    }

    wrap.innerHTML = wrapTable(renderTable({
      columns: [
        { label: 'Hora', align: 'center', render: r => `<span class="cita-hora">${(r.fechaatencion || '').slice(11, 16) || '—'}</span>` },
        {
          label: 'Paciente',
          render: r => `
            <div class="pac-cell">
              <div class="gm-avatar">${iniciales(r.paciente)}</div>
              <div class="pac-cell__info">
                <span class="pac-cell__name">${escapeHtml(r.paciente)}</span>
                <span class="pac-cell__meta">${escapeHtml(r.motivo ?? 'Sin motivo')}</span>
              </div>
            </div>`,
        },
        ...(CARGO === 1 ? [{
          label: 'Acciones', align: 'right',
          render: () => `<div class="pac-actions">${iconBtn('eye', 'ver', 'Ver historial', 'icon-info')}</div>`,
        }] : []),
      ],
      rows: data.map(r => ({ ...r, _id: r.idatencion })),
    }))

    document.querySelectorAll('#tabla-aten-wrap tbody tr').forEach((tr, i) => {
      if (data[i]) tr.dataset.dni = data[i].dni
    })
  } catch (err) {
    wrap.innerHTML = `<div class="state-error">${err.message}</div>`
  }
}

function actualizarLabelFecha(fecha) {
  const el = document.getElementById('aten-fecha-label')
  if (!el) return
  const d = new Date(fecha + 'T00:00:00')
  el.textContent = d.toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}

async function abrirHistorial(idatencion, dni) {
  openModal(`<div class="state-loading"><div class="spinner"></div></div>`, { wide: true })

  try {
    const [{ data: a }, { data: pac }, { data: lista }] = await Promise.all([
      api.get(`/api/atenciones/${idatencion}`),
      dni ? api.get(`/api/pacientes/${dni}`) : Promise.resolve({ data: {} }),
      dni ? api.get('/api/atenciones/paciente', { dni }) : Promise.resolve({ data: [] }),
    ])

    const liItems = lista.length
      ? lista.map(at => {
          const isPending = !at.fecha || at.fecha === 'null' || !at.nombre || at.nombre === 'null';
          const dateStr = (at.fecha && at.fecha !== 'null') ? at.fecha : (at.fechacita || 'Fecha pendiente');
          const titleStr = (at.nombre && at.nombre !== 'null') ? escapeHtml(at.nombre) : '-';
          const badge = isPending ? ` <span class="hc-pend-tag">Sin atender</span>` : '';
          return `
          <button class="hc-item ${isPending ? 'pend' : ''}" data-idaten="${at.idatencion}">
            <div class="d">${dateStr}${badge}</div>
            <div class="t">${titleStr}</div>
          </button>`
        }).join('')
      : '<div class="hc-empty">Sin más registros.</div>'

    const html = `
      <div class="hc">
        <div class="hc-head">
          <div class="hc-av">${iniciales(`${pac.nombre ?? ''} ${pac.apellidos ?? ''}`)}</div>
          <div style="flex:1;">
            <div class="hc-head-name">${escapeHtml(pac.apellidos ?? '')}, ${escapeHtml(pac.nombre ?? '')}</div>
            <div class="hc-head-meta">DNI ${escapeHtml(pac.dni ?? dni)} · ${pac.edad && pac.edad !== '0' && pac.edad !== '0000-00-00' ? pac.edad : '—'} años</div>
          </div>
        </div>
        <div class="hc-body">
          <div class="hc-aside">
            <h4>Historial</h4>
            ${liItems}
          </div>
          <div class="hc-panel" id="hist-panel">${renderConsultaSOAP(a)}</div>
        </div>
      </div>`

    openModal(html, { wide: true })

    document.getElementById('modal-content').addEventListener('click', async (e) => {
      const btn = e.target.closest('[data-idaten]')
      if (!btn) return
      
      document.querySelectorAll('.hc-item').forEach(el => el.classList.remove('on'))
      btn.classList.add('on')
      
      const panel = document.getElementById('hist-panel')
      panel.innerHTML = `<div class="state-loading"><div class="spinner"></div></div>`
      try {
        const { data: at } = await api.get(`/api/atenciones/${btn.dataset.idaten}`)
        panel.innerHTML = renderConsultaSOAP(at)
      } catch (err) {
        panel.innerHTML = `<div class="state-error">${err.message}</div>`
      }
    })
  } catch (err) {
    openModal(`<div class="state-error">${err.message}</div>`)
  }
}

// ── Render SOAP ──────────────────────────────────────────────────────────────

function renderConsultaSOAP(a) {
  if (!a) return '<p class="muted">Sin datos.</p>'

  const signos = [
    { label: 'FC',   value: a.fr,   unit: 'lpm' },
    { label: 'PA',   value: a.pa,   unit: 'mmHg' },
    { label: 'T°',   value: a.temp, unit: '°C' },
    { label: 'SO₂',  value: a.so2,  unit: '%' },
    { label: 'Peso', value: a.peso, unit: 'kg' },
  ].filter(s => s.value && s.value !== '-' && s.value !== 'null' && String(s.value).trim() !== '')

  const signosHtml = signos.length
    ? `<div class="hc-vitals">
         ${signos.map(s => `
           <div class="hc-vital">
             <div class="l">${s.label}</div>
             <div class="v">${escapeHtml(s.value)} <small>${s.unit}</small></div>
           </div>`).join('')}
       </div>`
    : ''

  const seccion = (titulo, contenido, iconName) =>
    contenido && contenido !== '-' && contenido !== 'null' && String(contenido).trim()
      ? `<div class="hc-sec">
           <h5>${icon(iconName)} ${titulo}</h5>
           <p>${escapeHtml(contenido).replace(/\n/g, '<br/>')}</p>
         </div>`
      : ''

  return `
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
      <h3 style="font-size:14px; margin:0; color:var(--texto-primario);">Consulta del ${a.fechaatencion?.split(' ')[0] ?? ''}</h3>
      <a href="/pdf/receta/${a.idatencion}" target="_blank" class="btn-secundario btn-sm" style="border-radius: 99px;">
        ${icon('pdf')} Ver receta
      </a>
    </div>

    ${signosHtml}

    <div>
      ${seccion('Antecedente',        a.antecedente,    'history')}
      ${seccion('Motivo de consulta', a.motivoconsulta, 'report')}
      ${seccion('Anamnesis',          a.anamensis,      'chart')}
      ${seccion('Examen físico',      a.exfisico,       'patient')}
      ${seccion('Diagnóstico',        a.diagnostico,    'heartbeat')}
      ${seccion('Tratamiento',        a.tratamiento,    'pill')}
    </div>`
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function iniciales(nombreCompleto = '') {
  const partes = (nombreCompleto || '').trim().split(/\s+/)
  return ((partes[0]?.[0] ?? '') + (partes[1]?.[0] ?? '')).toUpperCase() || '·'
}

function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, c => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  }[c]))
}
