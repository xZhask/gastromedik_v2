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
  const t = new Date(Date.now() - new Date().getTimezoneOffset() * 60000)
  const hoy = t.toISOString().split('T')[0]
  t.setDate(1)
  const primeroMes = t.toISOString().split('T')[0]

  content().innerHTML = `
    <div class="citas-header">
      <div class="citas-header__top" style="flex-direction: column; align-items: flex-start; gap: 16px;">
        <div style="display: flex; justify-content: space-between; width: 100%; align-items: center; flex-wrap: wrap; gap: 12px;">
          <div class="citas-header__title">
            <h1>Procedimientos externos</h1>
            <span class="gm-page-header__sub" id="ext-sub"></span>
          </div>
          <div class="citas-header__actions" style="margin-top: 0;">
            <a id="btn-pdf-ext" href="#" target="_blank" class="btn-secundario btndisabled" style="background: transparent;">${icon('pdf')} PDF</a>
            <button class="btn-secundario" id="btn-nuevo-estab" type="button">N. Establecimiento</button>
            <button class="btn-primario" id="btn-nueva-ext"  type="button">${icon('plus')} Registrar cita externa</button>
          </div>
        </div>
      </div>
      <div class="citas-header__filters" style="width: 100%; padding-top: 14px; border-top: 1px solid var(--borde-sutil); margin-top: 6px;">
        <div class="toolbar" style="display:flex;align-items:center;gap:14px;flex-wrap:wrap;">
          <div class="cont-control" style="margin:0;display:flex;align-items:center;gap:8px;">
            <label style="margin:0; font-weight: 500;">De</label>
            <input type="date" id="ext-desde" value="${primeroMes}" class="form-control" style="width: 130px; height: 36px; padding: 0 10px;" />
          </div>
          <div class="cont-control" style="margin:0;display:flex;align-items:center;gap:8px;">
            <label style="margin:0; font-weight: 500;">a</label>
            <input type="date" id="ext-hasta" value="${hoy}" class="form-control" style="width: 130px; height: 36px; padding: 0 10px;" />
          </div>
          <div class="cont-control" style="margin:0; flex: 1; min-width: 250px; max-width: 350px;">
            <select id="ext-estab" class="form-control" style="height: 36px;"></select>
          </div>
        </div>
      </div>
    </div>
    <div id="lbl-total-ext" style="margin-bottom:22px;margin-top:12px;"></div>
    <div id="tabla-ext-wrap"></div>`

  try {
    const [re, rp] = await Promise.all([
      api.get('/api/establecimientos'),
      api.get('/api/procedimientos'),
    ])
    
    // Sanitize and sort ESTABLECIMIENTOS
    const est = re.data ?? []
    const cleanEst = est.map(e => ({ ...e, nombre: String(e.nombre ?? '').trim() }))
                        .filter(e => e.nombre !== '')
    cleanEst.sort((a, b) => a.nombre.localeCompare(b.nombre, 'es', { sensitivity: 'base' }))
    ESTABLECIMIENTOS = cleanEst

    PROCEDIMIENTOS = rp.data ?? []
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
    
    const pdfBtn = document.getElementById('btn-pdf-ext')
    if (data.length > 0) {
      document.getElementById('lbl-total-ext').innerHTML = `
        <div class="gm-stat gm-stat--verde" style="background:var(--superficie); border-color:var(--borde-medio); max-width: 300px;">
          <span class="gm-stat__label">Monto Total Recaudado</span>
          <span class="gm-stat__value" style="color:var(--verde); font-size:24px;">S/ ${total.toLocaleString('es-PE',{minimumFractionDigits:2, maximumFractionDigits:2})}</span>
        </div>`
      pdfBtn.classList.remove('btndisabled')
      pdfBtn.href = `/pdf/reportes/externos?fecha1=${params.fecha1}&fecha2=${params.fecha2}&establecimiento=${params.establecimiento}`
    } else {
      document.getElementById('lbl-total-ext').innerHTML = ''
      pdfBtn.classList.add('btndisabled')
      pdfBtn.removeAttribute('href')
    }

    if (!data.length) {
      wrap.innerHTML = `
        <div class="gm-empty" style="margin-top:20px;">
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
        { key: 'paciente',        label: 'Paciente',       render: r => `<span style="text-transform:capitalize;font-weight:500;">${String(r.paciente ?? '').toLowerCase()}</span>` },
        { key: 'establecimiento', label: 'Establecimiento',render: r => `<span style="text-transform:capitalize">${String(r.establecimiento ?? '').toLowerCase()}</span>` },
        { key: 'motivo',          label: 'Procedimiento' },
        { key: 'precio',          label: 'Precio', align: 'right', render: r => `<span style="font-variant-numeric:tabular-nums;font-weight:600;">S/ ${parseFloat(r.precio).toLocaleString('es-PE',{minimumFractionDigits:2, maximumFractionDigits:2})}</span>` },
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
      <div style="display:grid; grid-template-columns: 1.2fr 2fr; gap: 12px; margin-bottom: 12px;">
        <div class="cont-control" style="margin-bottom:0;"><label>DNI</label><input type="text" name="dni" maxlength="8" required /></div>
        <div class="cont-control" style="margin-bottom:0;"><label>Nombre del paciente</label><input type="text" name="nombre" required /></div>
      </div>
      <div class="cont-group" style="margin-bottom: 12px;">
        <div class="cont-control"><label>Establecimiento</label><select name="idhospital" required>${optsE}</select></div>
        <div class="cont-control"><label>Procedimiento</label><select name="idtipoatencion" id="sel-proc-ext">${optsP}</select></div>
      </div>
      <div style="display:grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; margin-bottom:12px;">
        <div class="cont-control" style="margin-bottom:0;"><label>Precio (S/.) <span style="font-weight:400;color:var(--texto-terciario);font-size:11px;">(Editable)</span></label><input type="number" name="precio" step="0.01" /></div>
        <div class="cont-control" style="margin-bottom:0;"><label>Fecha</label><input type="date" name="fecha" value="${hoy}" required /></div>
        <div class="cont-control" style="margin-bottom:0;"><label>Hora</label><input type="time" name="hora" required /></div>
      </div>
      <div style="display:flex;gap:8px;margin-top:16px;">
        <button type="submit" class="btn-primario">Registrar</button>
        <button type="button" class="btn-secundario btn-cancelar" id="btn-cancel-ext">Cancelar</button>
      </div>
    </form>`
  openModal(html)
  document.getElementById('btn-cancel-ext').addEventListener('click', closeModal)
  
  const selProc = document.getElementById('sel-proc-ext')
  const inputPrecio = document.querySelector('[name="precio"]')
  if (selProc && selProc.options.length > 0) {
     inputPrecio.value = selProc.options[0]?.dataset.precio ?? ''
  }
  selProc?.addEventListener('change', e => {
    inputPrecio.value = e.target.selectedOptions[0]?.dataset.precio ?? ''
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
      <div class="cont-control"><label>Nombre</label><input type="text" name="nombre" required autocomplete="off" /></div>
      <div style="display:flex;gap:8px;margin-top:12px;">
        <button type="submit" class="btn-primario">Registrar</button>
        <button type="button" class="btn-secundario btn-cancelar" id="btn-cancel-estab">Cancelar</button>
      </div>
    </form>`
  openModal(html)
  document.getElementById('btn-cancel-estab').addEventListener('click', closeModal)
  document.getElementById('form-estab').addEventListener('submit', async (e) => {
    e.preventDefault()
    let nombre = new FormData(e.target).get('nombre') ?? ''
    nombre = nombre.trim()
    if (!nombre) {
      toastError('El nombre no puede estar vacío.')
      return
    }
    const exists = ESTABLECIMIENTOS.some(est => est.nombre.toLowerCase() === nombre.toLowerCase())
    if (exists) {
      toastError('Ya existe un establecimiento con ese nombre.')
      return
    }

    try {
      await api.post('/api/establecimientos', { nombre })
      toastOk('Establecimiento registrado.')
      closeModal()
      ExternosView()
    } catch (err) { toastError(err.message) }
  })
}
