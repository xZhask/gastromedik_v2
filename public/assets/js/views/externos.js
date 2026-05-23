/**
 * views/externos.js — Citas externas / procedimientos externos.
 */
import { api }        from '../utils/api.js'
import { toastOk, toastError } from '../utils/toast.js'
import { icon, iconBtn } from '../utils/icons.js'
import { openModal, closeModal } from '../components/modal.js'
import { confirm }    from '../components/confirm.js'
import { renderTable, wrapTable } from '../components/table.js'
import { skeletonTable } from '../components/skeleton.js'

const content = () => document.getElementById('app-content')
let ESTABLECIMIENTOS = []
let PROCEDIMIENTOS   = []

export async function ExternosView() {
  const hoy = new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0]
  content().innerHTML = `
    <div class="citas-header">
      <div class="citas-header__top">
        <div class="citas-header__title">
          <h1>Procedimientos externos</h1>
          <span class="gm-page-header__sub" id="ext-sub"></span>
        </div>
        <div class="citas-header__actions">
          <button class="btn-secundario" id="btn-nueva-ext"  type="button">Nueva Cita</button>
          <button class="btn-secundario" id="btn-nuevo-estab" type="button">N. Establecimiento</button>
          <a id="btn-pdf-ext" href="#" target="_blank" class="btn-secundario">${icon('pdf')} PDF</a>
        </div>
      </div>
      <div class="citas-header__filters">
        <div class="cont-groupbotones controls-externos">
          <div class="cont-control" style="margin:0;display:flex;align-items:center;gap:6px;">
            <label style="white-space:nowrap; font-weight: 500;">De:</label>
            <input type="date" id="ext-desde" value="${hoy}" style="border: 1px solid var(--borde-sutil); border-radius: 6px; padding: 0 12px; height: 36px; background: var(--blanco); outline: none; font-family: inherit;" />
          </div>
          <div class="cont-control" style="margin:0;display:flex;align-items:center;gap:6px;">
            <label style="white-space:nowrap; font-weight: 500;">a:</label>
            <input type="date" id="ext-hasta" value="${hoy}" style="border: 1px solid var(--borde-sutil); border-radius: 6px; padding: 0 12px; height: 36px; background: var(--blanco); outline: none; font-family: inherit;" />
          </div>
          <div class="cont-control" style="margin:0;">
            <select id="ext-estab"></select>
          </div>
        </div>
      </div>
    </div>
    <div id="lbl-total-ext" class="cont-totales" style="margin-bottom:12px;"></div>
    <div id="tabla-ext-wrap"></div>`

  try {
    const [re, rp] = await Promise.all([
      api.get('/api/establecimientos'),
      api.get('/api/procedimientos'),
    ])
    ESTABLECIMIENTOS = re.data ?? []
    PROCEDIMIENTOS   = rp.data ?? []
    const sel = document.getElementById('ext-estab')
    sel.innerHTML = `<option value="0">Todos los establecimientos</option>` +
      ESTABLECIMIENTOS.map(e => `<option value="${e.idhospital}">${e.nombre}</option>`).join('')
  } catch { /* continuar */ }

  await cargar()
  bindEventos()
}

async function cargar() {
  const wrap  = document.getElementById('tabla-ext-wrap')
  wrap.innerHTML = skeletonTable(5, 7)
  const params = {
    fecha1:          document.getElementById('ext-desde')?.value ?? '',
    fecha2:          document.getElementById('ext-hasta')?.value ?? '',
    establecimiento: document.getElementById('ext-estab')?.value ?? '0',
  }
  try {
    const { data } = await api.get('/api/citas/externas', params)
    const total = data.filter(r => r.estado !== 'ANULADO').reduce((s, r) => s + parseFloat(r.precio ?? 0), 0)
    document.getElementById('ext-sub').textContent = `${params.fecha1} - ${params.fecha2}`
    document.getElementById('lbl-total-ext').innerHTML =
      `<span class="lbltotales">Monto Total: S/. ${total.toFixed(2)}</span>` +
      `<a href="/pdf/reportes/externos?fecha1=${params.fecha1}&fecha2=${params.fecha2}&establecimiento=${params.establecimiento}" target="_blank" class="btn-exportar">${icon('pdf')}</a>`

    if (!data.length) {
      wrap.innerHTML = `
        <div class="gm-empty">
          <div class="gm-empty__icon">${icon('external')}</div>
          <p class="gm-empty__text">Sin citas externas en el período.</p>
          <button class="btn-primario" id="btn-vacio-ext" style="margin-top:12px;">${icon('plus')} Registrar cita externa</button>
        </div>`
      document.getElementById('btn-vacio-ext')?.addEventListener('click', abrirFormCitaExt)
      return
    }

    wrap.innerHTML = wrapTable(renderTable({
      columns: [
        { key: 'hora',            label: 'Horario',        align: 'center' },
        { key: 'fecha',           label: 'Fecha',          align: 'center' },
        { key: 'paciente',        label: 'Paciente' },
        { key: 'establecimiento', label: 'Establecimiento' },
        { key: 'motivo',          label: 'Procedimiento' },
        { key: 'precio',          label: 'Precio', align: 'center', render: r => `S/. ${parseFloat(r.precio).toFixed(2)}` },
        {
          label: 'Estado', align: 'center',
          render: r => r.estado === 'PENDIENTE'
            ? iconBtn('cancel', 'anular', 'Anular cita', 'icon-danger')
            : `<span class="badge badge-verde">${r.estado}</span>`,
        },
      ],
      rows: data.map(r => ({ ...r, _id: r.idtrabajoexterno })),
    }))
  } catch (err) {
    wrap.innerHTML = `<div class="state-error">${err.message}</div>`
  }
}

function bindEventos() {
  const el = content()
  el.querySelector('#ext-desde')?.addEventListener('change', cargar)
  el.querySelector('#ext-hasta')?.addEventListener('change', cargar)
  el.querySelector('#ext-estab')?.addEventListener('change', cargar)
  el.querySelector('#btn-nueva-ext')?.addEventListener('click', () => abrirFormCitaExt())
  el.querySelector('#btn-nuevo-estab')?.addEventListener('click', () => abrirFormEstab())

  el.addEventListener('click', async (e) => {
    if (!e.target.closest('#tabla-ext-wrap')) return
    const btn = e.target.closest('[data-action="anular"]')
    if (!btn) return
    const id = parseInt(btn.closest('tr')?.dataset.id)
    const ok = await confirm({ title: 'Anular cita externa', confirmLabel: 'Sí, anular', danger: true })
    if (!ok) return
    try {
      await api.delete(`/api/citas/externas/${id}`)
      toastOk('Cita anulada.')
      cargar()
    } catch (err) { toastError(err.message) }
  })
}

function abrirFormCitaExt() {
  const hoy   = new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0]
  const optsE = ESTABLECIMIENTOS.map(e => `<option value="${e.idhospital}">${e.nombre}</option>`).join('')
  const optsP = PROCEDIMIENTOS.map(p => `<option value="${p.idtipoatencion}" data-precio="${p.precio}">${p.nombre}</option>`).join('')

  const html = `
    <h2 class="modal-title">Nueva Cita Externa</h2>
    <form id="form-ext" novalidate>
      <div class="cont-group">
        <div class="cont-control"><label>DNI</label><input type="text" name="dni" maxlength="8" required /></div>
        <div class="cont-control"><label>Nombre del paciente</label><input type="text" name="nombre" required /></div>
        <div class="cont-control"><label>Establecimiento</label><select name="idhospital" required>${optsE}</select></div>
        <div class="cont-control"><label>Procedimiento</label><select name="idtipoatencion" id="sel-proc-ext">${optsP}</select></div>
        <div class="cont-control"><label>Precio (S/.)</label><input type="number" name="precio" step="0.01" /></div>
        <div class="cont-control"><label>Fecha</label><input type="date" name="fecha" value="${hoy}" required /></div>
        <div class="cont-control"><label>Hora</label><input type="time" name="hora" required /></div>
      </div>
      <div style="display:flex;gap:8px;margin-top:12px;">
        <button type="submit" class="btn-primario">Registrar</button>
        <button type="button" class="btn-secundario btn-cancelar" id="btn-cancel-ext">Cancelar</button>
      </div>
    </form>`
  openModal(html)
  document.getElementById('btn-cancel-ext').addEventListener('click', closeModal)
  document.getElementById('sel-proc-ext')?.addEventListener('change', e => {
    document.querySelector('[name="precio"]').value = e.target.selectedOptions[0]?.dataset.precio ?? ''
  })
  document.getElementById('form-ext').addEventListener('submit', async (e) => {
    e.preventDefault()
    const body = Object.fromEntries(new FormData(e.target).entries())
    try {
      await api.post('/api/citas/externas', body)
      toastOk('Cita externa registrada.')
      closeModal(); cargar()
    } catch (err) { toastError(err.message) }
  })
}

function abrirFormEstab() {
  const html = `
    <h2 class="modal-title">Nuevo Establecimiento</h2>
    <form id="form-estab" novalidate>
      <div class="cont-control"><label>Nombre</label><input type="text" name="nombre" required /></div>
      <div style="display:flex;gap:8px;margin-top:12px;">
        <button type="submit" class="btn-primario">Registrar</button>
        <button type="button" class="btn-secundario btn-cancelar" id="btn-cancel-estab">Cancelar</button>
      </div>
    </form>`
  openModal(html)
  document.getElementById('btn-cancel-estab').addEventListener('click', closeModal)
  document.getElementById('form-estab').addEventListener('submit', async (e) => {
    e.preventDefault()
    const body = Object.fromEntries(new FormData(e.target).entries())
    try {
      await api.post('/api/establecimientos', body)
      toastOk('Establecimiento registrado.')
      closeModal()
    } catch (err) { toastError(err.message) }
  })
}
