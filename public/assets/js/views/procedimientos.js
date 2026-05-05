/**
 * views/procedimientos.js — CRUD de procedimientos/tipos de atención.
 */

import { api }        from '../utils/api.js'
import { toastOk, toastError } from '../utils/toast.js'
import { icon, iconBtn } from '../utils/icons.js'
import { openModal, closeModal } from '../components/modal.js'
import { confirm }    from '../components/confirm.js'
import { renderTable, wrapTable } from '../components/table.js'
import { skeletonTable } from '../components/skeleton.js'

const content = () => document.getElementById('app-content')

export async function ProcedimientosView() {
  content().innerHTML = `
    <div class="citas-header">
      <div class="citas-header__top">
        <div class="citas-header__title">
          <h1>Procedimientos</h1>
          <span class="gm-page-header__sub" id="proc-sub"></span>
        </div>
        <div class="citas-header__actions">
          <div class="cont-busqueda">
            <input type="text" id="q-proc" placeholder="Buscar procedimiento..." autocomplete="off" />
            <button class="icon-btn" id="btn-buscar-proc" type="button">${icon('search')}</button>
          </div>
          <button class="btn-secundario" id="btn-nuevo-proc" type="button">${icon('plus')} Nuevo</button>
        </div>
      </div>
    </div>
    <div id="tabla-proc-wrap"></div>`

  await cargar()
  bindEventos()
}

async function cargar() {
  const wrap = document.getElementById('tabla-proc-wrap')
  if (!wrap) return
  wrap.innerHTML = skeletonTable(5, 5)
  try {
    const q = document.getElementById('q-proc')?.value ?? ''
    const { data } = await api.get('/api/procedimientos', q ? { q } : {})
    document.getElementById('proc-sub').textContent = `${data.length} procedimientos definidos`
    if (!data.length) {
      wrap.innerHTML = `
        <div class="gm-empty">
          <div class="gm-empty__icon">${icon('procedure')}</div>
          <p class="gm-empty__text">No se encontraron procedimientos.</p>
        </div>`
      return
    }
    wrap.innerHTML = wrapTable(renderTable({
      columns: [
        { key: 'idtipoatencion', label: 'Código',    align: 'center' },
        { key: 'nombre',         label: 'Nombre' },
        { key: 'precio',         label: 'Precio',    align: 'center', render: r => `S/. ${parseFloat(r.precio).toFixed(2)}` },
        { label: 'Editar',       align: 'center',    render: () => iconBtn('edit',  'editar',   'Editar',   'icon-edit') },
        { label: 'Eliminar',     align: 'center',    render: () => iconBtn('trash', 'eliminar', 'Eliminar', 'icon-danger') },
      ],
      rows: data.map(p => ({ ...p, _id: p.idtipoatencion })),
    }))
  } catch (err) {
    wrap.innerHTML = `<div class="state-error">${err.message}</div>`
  }
}

function bindEventos() {
  const el = content()
  el.querySelector('#btn-buscar-proc')?.addEventListener('click', cargar)
  el.querySelector('#q-proc')?.addEventListener('keydown', e => { if (e.key === 'Enter') cargar() })
  el.querySelector('#btn-nuevo-proc')?.addEventListener('click', () => abrirForm(null))

  el.addEventListener('click', async (e) => {
    if (!e.target.closest('#tabla-proc-wrap')) return
    const btn = e.target.closest('[data-action]')
    if (!btn) return
    const tr = btn.closest('tr')
    const id = parseInt(tr?.dataset.id)
    if (!id) return
    if (btn.dataset.action === 'editar')   await editarProc(id, tr)
    if (btn.dataset.action === 'eliminar') await eliminarProc(id, tr)
  })
}

async function editarProc(id, tr) {
  const nombre = tr.querySelectorAll('td')[1]?.textContent ?? ''
  const precio = tr.querySelectorAll('td')[2]?.textContent?.replace('S/. ', '') ?? ''
  abrirForm({ idtipoatencion: id, nombre, precio })
}

async function eliminarProc(id, tr) {
  const ok = await confirm({ title: 'Eliminar procedimiento', text: 'Esta acción no se puede revertir.', confirmLabel: 'Sí, eliminar', danger: true })
  if (!ok) return
  try {
    await api.delete(`/api/procedimientos/${id}`)
    tr.remove()
    toastOk('Procedimiento eliminado.')
  } catch (err) { toastError(err.message) }
}

function abrirForm(proc) {
  const isEdit = proc !== null
  const html = `
    <h2 class="modal-title">${isEdit ? 'Editar' : 'Nuevo'} Procedimiento</h2>
    <form id="form-proc" novalidate>
      <div class="cont-control">
        <label>Nombre</label>
        <input type="text" name="nombre" value="${proc?.nombre ?? ''}" required />
      </div>
      <div class="cont-control">
        <label>Precio (S/.)</label>
        <input type="number" name="precio" value="${proc?.precio ?? ''}" step="0.01" min="0" required />
      </div>
      <div style="display:flex;gap:8px;margin-top:12px;">
        <button type="submit" class="btn-primario">${isEdit ? 'Actualizar' : 'Registrar'}</button>
        <button type="button" class="btn-secundario btn-cancelar" id="btn-cancel-proc">Cancelar</button>
      </div>
    </form>`

  openModal(html)
  document.getElementById('btn-cancel-proc').addEventListener('click', closeModal)
  document.getElementById('form-proc').addEventListener('submit', async (e) => {
    e.preventDefault()
    const body = Object.fromEntries(new FormData(e.target).entries())
    try {
      if (isEdit) { await api.put(`/api/procedimientos/${proc.idtipoatencion}`, body); toastOk('Procedimiento actualizado.') }
      else        { await api.post('/api/procedimientos', body); toastOk('Procedimiento registrado.') }
      closeModal(); cargar()
    } catch (err) { toastError(err.message) }
  })
}
