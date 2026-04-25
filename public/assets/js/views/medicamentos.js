/**
 * views/medicamentos.js — Medicamentos e Insumos + Kardex.
 */

import { api }        from '../utils/api.js'
import { toastOk, toastError } from '../utils/toast.js'
import { icon, iconBtn } from '../utils/icons.js'
import { openModal, closeModal } from '../components/modal.js'
import { confirm }    from '../components/confirm.js'
import { renderTable, wrapTable } from '../components/table.js'

const content = () => document.getElementById('app-content')

export async function MedicamentosView() {
  content().innerHTML = `
    <div class="cabecera">
      <h2>Medicamentos e Insumos</h2>
      <div class="cont-groupbotones">
        <button class="btn-secundario" id="btn-movimiento" type="button">Reg. Movimiento</button>
        <button class="btn-secundario" id="btn-kardex"    type="button">Kardex</button>
      </div>
    </div>
    <div class="cont-medicamentos">
      <div class="cont-tabla cont-tb-med" id="tabla-med-wrap">
        <div style="padding:10px 14px;border-bottom:1px solid var(--gris-border);">
          <input type="text" id="q-med" placeholder="Buscar medicamento o insumo..." style="width:100%;border:none;outline:none;font-size:.88rem;background:transparent;" />
        </div>
        <div id="tabla-med-body"></div>
      </div>
      <div id="form-med-wrap"></div>
    </div>`

  await cargar()
  renderFormRegistro(null)
  bindEventos()
}

async function cargar() {
  const wrap = document.getElementById('tabla-med-body')
  if (!wrap) return
  wrap.innerHTML = `<div class="state-loading"><div class="spinner"></div></div>`
  try {
    const q = document.getElementById('q-med')?.value ?? ''
    const { data } = await api.get('/api/medicamentos', q ? { q } : {})
    wrap.innerHTML = renderTable({
      columns: [
        { key: 'idmedicina', label: 'Código',   align: 'center' },
        { key: 'nombre',     label: 'Nombre' },
        { key: 'stock',      label: 'Stock',    align: 'center' },
        { key: 'tipoinsumo', label: 'Tipo',     align: 'center' },
        { label: 'Editar',   align: 'center',   render: () => iconBtn('edit',  'editar',   'Editar',   'icon-edit') },
        { label: 'Eliminar', align: 'center',   render: () => iconBtn('trash', 'eliminar', 'Eliminar', 'icon-danger') },
      ],
      rows: data.map(m => ({ ...m, _id: m.idmedicina })),
      emptyMsg: 'Sin registros.',
    })
  } catch (err) {
    wrap.innerHTML = `<div class="state-error">${err.message}</div>`
  }
}

function renderFormRegistro(med) {
  const isEdit = med !== null
  const wrap   = document.getElementById('form-med-wrap')
  if (!wrap) return
  wrap.innerHTML = `
    <form id="form-med" style="background:var(--blanco);border:1px solid var(--gris-border);border-radius:var(--radius);padding:20px;flex-shrink:0;width:300px;">
      <h2 style="font-size:1rem;font-weight:700;margin-bottom:16px;">${isEdit ? 'Editar' : 'Registrar'} Medicam./Insumo</h2>
      <input type="hidden" id="id-med-edit" value="${med?.idmedicina ?? ''}" />
      <div class="cont-control">
        <label>Nombre</label>
        <input type="text" name="nombre" value="${med?.nombre ?? ''}" required />
      </div>
      <div class="cont-control">
        <label>Cantidad inicial</label>
        <input type="number" name="cantidad_inicial" value="${med ? '' : '0'}" min="0" ${isEdit ? 'disabled' : ''} />
      </div>
      <div class="cont-control">
        <label>Tipo</label>
        <select name="tipoinsumo">
          <option value="MEDICAM" ${med?.tipoinsumo === 'MEDICAM' ? 'selected' : ''}>Medicamento</option>
          <option value="INSUMO"  ${med?.tipoinsumo === 'INSUMO'  ? 'selected' : ''}>Insumo</option>
        </select>
      </div>
      <div style="display:flex;gap:8px;margin-top:10px;">
        <button type="submit" class="btn-primario" style="flex:1;">${isEdit ? 'Actualizar' : 'Registrar'}</button>
        ${isEdit ? `<button type="button" class="btn-secundario btn-cancelar" id="btn-cancelar-med">Cancelar</button>` : ''}
      </div>
    </form>`

  document.getElementById('btn-cancelar-med')?.addEventListener('click', () => renderFormRegistro(null))

  document.getElementById('form-med').addEventListener('submit', async (e) => {
    e.preventDefault()
    const body = Object.fromEntries(new FormData(e.target).entries())
    try {
      if (isEdit) {
        await api.put(`/api/medicamentos/${med.idmedicina}`, body)
        toastOk('Medicamento actualizado.')
      } else {
        await api.post('/api/medicamentos', body)
        toastOk('Medicamento registrado.')
      }
      renderFormRegistro(null)
      cargar()
    } catch (err) { toastError(err.message) }
  })
}

function bindEventos() {
  const el = content()

  el.querySelector('#q-med')?.addEventListener('keyup', cargar)
  el.querySelector('#btn-movimiento')?.addEventListener('click', abrirMovimiento)
  el.querySelector('#btn-kardex')?.addEventListener('click', abrirKardex)

  el.addEventListener('click', async (e) => {
    if (!e.target.closest('#tabla-med-wrap')) return
    const btn = e.target.closest('[data-action]')
    if (!btn) return
    const tr = btn.closest('tr')
    const id = parseInt(tr?.dataset.id)
    if (!id) return

    if (btn.dataset.action === 'editar') {
      const cells = tr.querySelectorAll('td')
      renderFormRegistro({
        idmedicina: id,
        nombre:     cells[1]?.textContent ?? '',
        tipoinsumo: cells[3]?.textContent?.toUpperCase().includes('INSUMO') ? 'INSUMO' : 'MEDICAM',
      })
    }
    if (btn.dataset.action === 'eliminar') {
      const ok = await confirm({ title: 'Eliminar medicamento', confirmLabel: 'Sí, eliminar', danger: true })
      if (!ok) return
      try {
        await api.delete(`/api/medicamentos/${id}`)
        tr.remove()
        toastOk('Eliminado.')
      } catch (err) { toastError(err.message) }
    }
  })
}

function abrirMovimiento() {
  const html = `
    <h2 class="modal-title">Registrar Movimiento de Almacén</h2>
    <form id="form-movimiento" novalidate>
      <div class="cont-control">
        <label>Tipo de movimiento</label>
        <select name="tipomovimiento">
          <option value="I">Ingreso</option>
          <option value="S">Salida</option>
        </select>
      </div>
      <div class="cont-control">
        <label>Producto/Medicamento</label>
        <input type="text" id="inp-prod-mov" placeholder="Buscar por nombre..." autocomplete="off" />
        <input type="hidden" name="idmedicina" id="hid-prod-mov" />
      </div>
      <div id="sug-prod-mov" class="autocomplete-list"></div>
      <div class="cont-control">
        <label>Cantidad</label>
        <input type="number" name="cantidad" min="1" value="1" required />
      </div>
      <div class="cont-control">
        <label>Descripción</label>
        <input type="text" name="descripcion" value="Movimiento de almacén" />
      </div>
      <div style="display:flex;gap:8px;margin-top:12px;">
        <button type="submit" class="btn-primario">Registrar</button>
        <button type="button" class="btn-secundario btn-cancelar" id="btn-cancel-mov">Cancelar</button>
      </div>
    </form>`

  openModal(html)
  document.getElementById('btn-cancel-mov').addEventListener('click', closeModal)
  initAutocomplete('inp-prod-mov', 'hid-prod-mov', 'sug-prod-mov')

  document.getElementById('form-movimiento').addEventListener('submit', async (e) => {
    e.preventDefault()
    const body = Object.fromEntries(new FormData(e.target).entries())
    if (!body.idmedicina) { toastError('Selecciona un producto.'); return }
    try {
      await api.post('/api/medicamentos/movimiento', body)
      toastOk('Movimiento registrado.')
      closeModal()
      cargar()
    } catch (err) { toastError(err.message) }
  })
}

async function abrirKardex() {
  const hoy = new Date().toISOString().split('T')[0]
  const html = `
    <h2 class="modal-title">Kardex de Producto</h2>
    <div style="display:flex;gap:10px;align-items:flex-end;margin-bottom:16px;flex-wrap:wrap;">
      <div class="cont-control" style="margin:0;flex:1;">
        <label>Producto</label>
        <input type="text" id="inp-prod-kx" placeholder="Buscar por nombre..." />
        <input type="hidden" id="hid-prod-kx" />
      </div>
      <div id="sug-prod-kx" class="autocomplete-list"></div>
      <div class="cont-control" style="margin:0;">
        <label>Desde</label>
        <input type="date" id="kx-desde" value="${hoy}" />
      </div>
      <div class="cont-control" style="margin:0;">
        <label>Hasta</label>
        <input type="date" id="kx-hasta" value="${hoy}" />
      </div>
      <button class="btn-primario" id="btn-gen-kx" type="button">${icon('search')} Generar</button>
    </div>
    <div id="tabla-kardex-wrap"></div>`

  openModal(html, { wide: true })
  initAutocomplete('inp-prod-kx', 'hid-prod-kx', 'sug-prod-kx')

  document.getElementById('btn-gen-kx').addEventListener('click', async () => {
    const id    = document.getElementById('hid-prod-kx')?.value
    const desde = document.getElementById('kx-desde')?.value
    const hasta = document.getElementById('kx-hasta')?.value
    if (!id) { toastError('Selecciona un producto.'); return }
    const wrap = document.getElementById('tabla-kardex-wrap')
    wrap.innerHTML = `<div class="state-loading"><div class="spinner"></div></div>`
    try {
      const { data } = await api.get('/api/reportes/kardex', { idproducto: id, fecha1: desde, fecha2: hasta })
      wrap.innerHTML = wrapTable(renderTable({
        columns: [
          { key: 'fecha',       label: 'Fecha' },
          { key: 'descripcion', label: 'Descripción' },
          { key: 'nick',        label: 'Usuario',    align: 'center' },
          { key: 'ingreso',     label: 'Ingreso',    align: 'center', render: r => r.ingreso  != null ? `<span class="td-lleno">${r.ingreso}</span>`  : '—' },
          { key: 'salida',      label: 'Salida',     align: 'center', render: r => r.salida   != null ? `<span class="td-lleno">${r.salida}</span>`   : '—' },
          { key: 'saldo',       label: 'Saldo',      align: 'center', render: r => `<strong>${r.saldo}</strong>` },
        ],
        rows: data,
        emptyMsg: 'Sin movimientos en el período.',
      }))
    } catch (err) { wrap.innerHTML = `<div class="state-error">${err.message}</div>` }
  })
}

async function initAutocomplete(inputId, hiddenId, sugId) {
  let productos = []
  try {
    const { data } = await api.get('/api/medicamentos/nombres')
    productos = data
  } catch { return }

  const inp = document.getElementById(inputId)
  const hid = document.getElementById(hiddenId)
  const sug = document.getElementById(sugId)
  if (!inp) return

  inp.addEventListener('input', () => {
    const q = inp.value.toLowerCase()
    const matches = q ? productos.filter(p => p.nombre.toLowerCase().includes(q)).slice(0, 8) : []
    sug.innerHTML = matches.map(p =>
      `<div class="autocomplete-item" data-id="${p.idmedicina}" data-nombre="${p.nombre}">${p.nombre} (stock: ${p.stock})</div>`
    ).join('')
    sug.style.display = matches.length ? 'block' : 'none'
  })

  sug.addEventListener('click', (e) => {
    const item = e.target.closest('.autocomplete-item')
    if (!item) return
    inp.value = item.dataset.nombre
    hid.value = item.dataset.id
    sug.style.display = 'none'
    sug.innerHTML = ''
  })

  document.addEventListener('click', (e) => {
    if (!sug.contains(e.target) && e.target !== inp) sug.style.display = 'none'
  }, { once: false })
}
