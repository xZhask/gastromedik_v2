/**
 * views/usuarios.js — Gestión de usuarios del sistema.
 */

import { api }        from '../utils/api.js'
import { toastOk, toastError } from '../utils/toast.js'
import { icon, iconBtn } from '../utils/icons.js'
import { openModal, closeModal } from '../components/modal.js'
import { renderTable, wrapTable } from '../components/table.js'

const content = () => document.getElementById('app-content')
const CARGO   = parseInt(document.querySelector('meta[name="user-cargo"]')?.content ?? '0')
let CARGOS_LISTA = []

export async function UsuariosView() {
  content().innerHTML = `
    <div class="cabecera">
      <h2>Usuarios</h2>
      <div class="cont-busqueda">
        <input type="text" id="q-usr" placeholder="Buscar usuario..." autocomplete="off" />
        <button class="icon-btn" id="btn-buscar-usr" type="button">${icon('search')}</button>
      </div>
      ${CARGO === 1 ? `
        <div class="cont-groupbotones">
          <button class="btn-secundario" id="btn-nuevo-usr"   type="button">${icon('plus')} Nuevo Usuario</button>
          <button class="btn-secundario" id="btn-nuevo-cargo" type="button">${icon('plus')} Cargo</button>
        </div>` : ''}
    </div>
    <div id="tabla-usr-wrap"></div>`

  try {
    const r = await api.get('/api/personal/cargos')
    CARGOS_LISTA = r.data ?? []
  } catch { /* sin cargos */ }

  await cargar()
  bindEventos()
}

async function cargar() {
  const wrap = document.getElementById('tabla-usr-wrap')
  if (!wrap) return
  wrap.innerHTML = `<div class="state-loading"><div class="spinner"></div></div>`
  try {
    const { data } = await api.get('/api/personal')
    wrap.innerHTML = wrapTable(renderTable({
      columns: [
        { key: 'dni',    label: 'DNI',     align: 'center' },
        { key: 'nombre', label: 'Nombres' },
        { key: 'nick',   label: 'Usuario', align: 'center' },
        { key: 'cargo',  label: 'Cargo',   align: 'center' },
        ...(CARGO === 1 ? [
          { key: 'estado', label: 'Estado', align: 'center',
            render: r => `<span class="badge ${r.estado === 'ACTIVO' ? 'badge-verde' : 'badge-gris'}">${r.estado}</span>` },
          { label: 'Editar',     align: 'center', render: () => iconBtn('edit',   'editar',   'Editar',         'icon-edit') },
          { label: 'Contraseña', align: 'center', render: () => iconBtn('unlock', 'password', 'Cambiar contraseña', 'icon-info') },
        ] : []),
      ],
      rows: data.map(u => ({ ...u, _id: u.dni })),
      emptyMsg: 'Sin usuarios registrados.',
    }))
  } catch (err) {
    wrap.innerHTML = `<div class="state-error">${err.message}</div>`
  }
}

function bindEventos() {
  const el = content()
  el.querySelector('#btn-buscar-usr')?.addEventListener('click', cargar)
  el.querySelector('#q-usr')?.addEventListener('keydown', e => { if (e.key === 'Enter') cargar() })
  el.querySelector('#btn-nuevo-usr')?.addEventListener('click', () => abrirFormUsuario(null))
  el.querySelector('#btn-nuevo-cargo')?.addEventListener('click', () => abrirFormCargo())

  el.addEventListener('click', async (e) => {
    if (!e.target.closest('#tabla-usr-wrap')) return
    const btn = e.target.closest('[data-action]')
    if (!btn) return
    const tr  = btn.closest('tr')
    const dni = tr?.dataset.id
    if (!dni) return
    if (btn.dataset.action === 'editar')   await editarUsuario(dni)
    if (btn.dataset.action === 'password') abrirFormPassword(dni)
  })
}

async function editarUsuario(dni) {
  try {
    const { data } = await api.get(`/api/personal/${dni}`)
    abrirFormUsuario(data)
  } catch (err) { toastError(err.message) }
}

function abrirFormUsuario(usr) {
  const isEdit = usr !== null
  const optsC  = CARGOS_LISTA.map(c => `<option value="${c.idcargo}" ${usr?.idcargo == c.idcargo ? 'selected' : ''}>${c.nombre}</option>`).join('')

  const html = `
    <h2 class="modal-title">${isEdit ? 'Editar' : 'Nuevo'} Usuario</h2>
    <form id="form-usr" novalidate>
      <div class="cont-group">
        <div class="cont-control">
          <label>DNI</label>
          <input type="text" name="dni" value="${usr?.dni ?? ''}" ${isEdit ? 'readonly' : ''} maxlength="8" required />
        </div>
        <div class="cont-control">
          <label>Nombres</label>
          <input type="text" name="nombre" value="${usr?.nombre ?? ''}" required />
        </div>
        <div class="cont-control">
          <label>Apellidos</label>
          <input type="text" name="apellidos" value="${usr?.apellidos ?? ''}" required />
        </div>
        <div class="cont-control">
          <label>Usuario (nick)</label>
          <input type="text" name="nick" value="${usr?.nick ?? ''}" required />
        </div>
        ${!isEdit ? `<div class="cont-control"><label>Contraseña</label><input type="password" name="pass" required /></div>` : ''}
        <div class="cont-control">
          <label>Cargo</label>
          <select name="idcargo" required>${optsC}</select>
        </div>
        <div class="cont-control">
          <label>Estado</label>
          <select name="estado">
            <option value="ACTIVO"   ${usr?.estado === 'ACTIVO'   ? 'selected' : ''}>Activo</option>
            <option value="INACTIVO" ${usr?.estado === 'INACTIVO' ? 'selected' : ''}>Inactivo</option>
          </select>
        </div>
      </div>
      <div style="display:flex;gap:8px;margin-top:12px;">
        <button type="submit" class="btn-primario">${isEdit ? 'Actualizar' : 'Registrar'}</button>
        <button type="button" class="btn-secundario btn-cancelar" id="btn-cancel-usr">Cancelar</button>
      </div>
    </form>`

  openModal(html)
  document.getElementById('btn-cancel-usr').addEventListener('click', closeModal)
  document.getElementById('form-usr').addEventListener('submit', async (e) => {
    e.preventDefault()
    const body = Object.fromEntries(new FormData(e.target).entries())
    try {
      if (isEdit) { await api.put(`/api/personal/${usr.dni}`, body); toastOk('Usuario actualizado.') }
      else        { await api.post('/api/personal', body);            toastOk('Usuario registrado.') }
      closeModal(); cargar()
    } catch (err) { toastError(err.message) }
  })
}

function abrirFormPassword(dni) {
  const html = `
    <h2 class="modal-title">Cambiar Contraseña</h2>
    <form id="form-pass" novalidate>
      <div class="cont-control"><label>Nueva contraseña</label><input type="password" name="pass"  required /></div>
      <div class="cont-control"><label>Confirmar</label><input type="password" name="pass2" required /></div>
      <div style="display:flex;gap:8px;margin-top:12px;">
        <button type="submit" class="btn-primario">Cambiar</button>
        <button type="button" class="btn-secundario btn-cancelar" id="btn-cancel-pass">Cancelar</button>
      </div>
    </form>`
  openModal(html)
  document.getElementById('btn-cancel-pass').addEventListener('click', closeModal)
  document.getElementById('form-pass').addEventListener('submit', async (e) => {
    e.preventDefault()
    const fd   = new FormData(e.target)
    const pass  = fd.get('pass')
    const pass2 = fd.get('pass2')
    if (pass !== pass2) { toastError('Las contraseñas no coinciden.'); return }
    try {
      await api.post('/api/personal/cambiar-pass', { dni, pass })
      toastOk('Contraseña actualizada.')
      closeModal()
    } catch (err) { toastError(err.message) }
  })
}

function abrirFormCargo() {
  const html = `
    <h2 class="modal-title">Nuevo Cargo</h2>
    <form id="form-cargo" novalidate>
      <div class="cont-control"><label>Nombre del cargo</label><input type="text" name="nombre" required /></div>
      <div style="display:flex;gap:8px;margin-top:12px;">
        <button type="submit" class="btn-primario">Registrar</button>
        <button type="button" class="btn-secundario btn-cancelar" id="btn-cancel-cargo">Cancelar</button>
      </div>
    </form>`
  openModal(html)
  document.getElementById('btn-cancel-cargo').addEventListener('click', closeModal)
  document.getElementById('form-cargo').addEventListener('submit', async (e) => {
    e.preventDefault()
    const body = Object.fromEntries(new FormData(e.target).entries())
    try {
      await api.post('/api/personal/cargos', body)
      toastOk('Cargo registrado.')
      closeModal()
    } catch (err) { toastError(err.message) }
  })
}


