/**
 * views/pacientes.js
 * Vista Pacientes: tabla con bÃƒÂºsqueda, CRUD, historial, imÃƒÂ¡genes y PDFs.
 * Toda interacciÃƒÂ³n vÃƒÂ­a event delegation. Sin HTML en el controller PHP.
 */

import { api }        from '../utils/api.js'
import { toastOk, toastError } from '../utils/toast.js'
import { icon, iconBtn } from '../utils/icons.js'
import { openModal, closeModal } from '../components/modal.js'
import { confirm }    from '../components/confirm.js'
import { renderTable, wrapTable } from '../components/table.js'

const content  = () => document.getElementById('app-content')
const CARGO    = parseInt(document.querySelector('meta[name="user-cargo"]')?.content ?? '0')

// Ã¢â€â‚¬Ã¢â€â‚¬ Punto de entrada Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬

export async function PacientesView() {
  content().innerHTML = `
    <div class="cabecera">
      <h2>Pacientes</h2>
      <div class="cont-busqueda">
        <input type="text" id="q-paciente" placeholder="Buscar por nombre o DNIÃ¢â‚¬Â¦" autocomplete="off" />
        <button class="icon-btn" id="btn-buscar-pac" type="button" aria-label="Buscar">${icon('search')}</button>
      </div>
      ${[1,4].includes(CARGO) ? `<button class="btn-secundario" id="btn-nuevo-pac" type="button">${icon('plus')} Nuevo Paciente</button>` : ''}
    </div>
    <div id="tabla-pac-wrap"></div>`

  await cargarPacientes()
  bindEventos()
}

// Ã¢â€â‚¬Ã¢â€â‚¬ Carga de datos Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬

async function cargarPacientes() {
  const wrap = document.getElementById('tabla-pac-wrap')
  if (!wrap) return
  wrap.innerHTML = `<div class="state-loading"><div class="spinner"></div></div>`

  try {
    const q     = document.getElementById('q-paciente')?.value ?? ''
    const { data } = await api.get('/api/pacientes', q ? { q } : {})
    wrap.innerHTML  = wrapTable(renderTable({
      columns: buildColumns(),
      rows:    data.map(p => ({ ...p, _id: p.dni })),
      emptyMsg: 'No se encontraron pacientes.',
      rowClass: () => '',
    }))
  } catch (err) {
    wrap.innerHTML = `<div class="state-error">${err.message}</div>`
  }
}

function buildColumns() {
  const cols = [
    { key: 'dni',       label: 'DNI',      align: 'center' },
    { key: 'apellidos', label: 'Apellidos' },
    { key: 'nombre',    label: 'Nombres' },
    { key: 'edad',      label: 'Edad',     align: 'center', render: r => `${r.edad} aÃƒÂ±os` },
    { key: 'telefono',  label: 'TelÃƒÂ©fono', align: 'center' },
  ]
  if ([1,4].includes(CARGO)) {
    cols.push({ label: 'Editar',   align: 'center', render: r => iconBtn('edit',  'editar',   'Editar',   'icon-edit') })
    cols.push({ label: 'Eliminar', align: 'center', render: r => iconBtn('trash', 'eliminar', 'Eliminar', 'icon-danger') })
  }
  if ([1,2,4].includes(CARGO)) {
    cols.push({ label: 'Historial', align: 'center', render: r => iconBtn('history', 'historial', 'Ver historial', 'icon-info') })
  }
  cols.push({ label: 'ImÃƒÂ¡genes', align: 'center', render: r => iconBtn('image', 'imagenes', 'Ver imÃƒÂ¡genes', 'icon-ocre') })
  cols.push({ label: 'PDFs',     align: 'center', render: r => iconBtn('pdf',   'pdfs',     'Ver PDFs',      'icon-ocre') })
  return cols
}

// Ã¢â€â‚¬Ã¢â€â‚¬ Eventos (delegaciÃƒÂ³n) Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬

function bindEventos() {
  const el = content()

  // BÃƒÂºsqueda
  el.querySelector('#btn-buscar-pac')?.addEventListener('click', cargarPacientes)
  el.querySelector('#q-paciente')?.addEventListener('keydown', e => { if (e.key === 'Enter') cargarPacientes() })

  // Nuevo paciente
  el.querySelector('#btn-nuevo-pac')?.addEventListener('click', () => abrirFormPaciente(null))

  // Acciones en tabla (delegaciÃƒÂ³n por data-action)
  el.addEventListener('click', async (e) => {
    if (!e.target.closest('#tabla-pac-wrap')) return
    const btn = e.target.closest('[data-action]')
    if (!btn) return
    const tr  = btn.closest('tr')
    const dni = tr?.dataset.id
    if (!dni) return

    try {
      switch (btn.dataset.action) {
        case 'editar':    await editarPaciente(dni); break
        case 'eliminar':  await eliminarPaciente(dni, tr); break
        case 'historial': await abrirHistorial(dni); break
        case 'imagenes':  await abrirSubirImagenes(dni); break
        case 'pdfs':      await abrirSubirPdf(dni); break
      }
    } catch (err) {
      toastError(err.message ?? 'Error inesperado.')
    }
  })
}

// Ã¢â€â‚¬Ã¢â€â‚¬ Acciones CRUD Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬

async function editarPaciente(dni) {
  try {
    const { data } = await api.get(`/api/pacientes/${dni}`)
    abrirFormPaciente(data)
  } catch (err) {
    toastError(err.message)
  }
}

async function eliminarPaciente(dni, tr) {
  const ok = await confirm({
    title:        'Eliminar paciente',
    text:         'Esta acciÃƒÂ³n no se puede revertir.',
    confirmLabel: 'SÃƒÂ­, eliminar',
    danger:       true,
  })
  if (!ok) return

  try {
    await api.delete(`/api/pacientes/${dni}`)
    tr.remove()
    toastOk('Paciente eliminado.')
  } catch (err) {
    toastError(err.message)
  }
}

// Ã¢â€â‚¬Ã¢â€â‚¬ BÃƒÂºsqueda de DNI (BD local Ã¢â€ â€™ API externa) Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬

async function buscarDniPaciente(dni) {
  if (dni.length !== 8) return

  // 1. Buscar en base de datos local
  try {
    const res  = await api.get(`/api/pacientes/${dni}`)
    const data = res.data ?? {}
    if (data.nombre) {
      document.querySelector('[name="nombre"]').value    = data.nombre    ?? ''
      document.querySelector('[name="apellidos"]').value = data.apellidos ?? ''
      document.querySelector('[name="telefono"]').value  = data.telefono  ?? ''
      document.querySelector('[name="fecha_nac"]').value = data.fecha_nac ?? ''
      toastOk('Paciente encontrado en base de datos.')
      return
    }
  } catch { /* 404 Ã¢â€ â€™ continuar con API externa */ }

  // 2. Consultar RENIEC vÃƒÂ­a API externa
  try {
    const res = await api.get(`/api/personal/consulta-dni/${dni}`)
    const d   = res.data ?? {}
    if (d.nombres) {
      document.querySelector('[name="nombre"]').value    = d.nombres ?? ''
      document.querySelector('[name="apellidos"]').value = `${d.apellido_paterno ?? ''} ${d.apellido_materno ?? ''}`.trim()
      toastOk('Datos obtenidos de RENIEC.')
    }
  } catch { /* DNI no encontrado en ninguna fuente */ }
}

// Ã¢â€â‚¬Ã¢â€â‚¬ Formulario Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬

function abrirFormPaciente(pac) {
  const isEdit = pac !== null
  const html = `
    <h2 class="modal-title">${isEdit ? 'Editar Paciente' : 'Nuevo Paciente'}</h2>
    <form id="form-paciente" novalidate>
      <div class="cont-group">
        <div class="cont-control">
          <label>DNI / Doc.</label>
          ${isEdit
            ? `<input type="text" name="dni" value="${pac?.dni ?? ''}" readonly maxlength="8" required />`
            : `<div class="cont-busqueda">
                 <input type="text" name="dni" value="" maxlength="8" required autocomplete="off" placeholder="Ingrese DNI" />
                 <button type="button" id="btn-buscar-dni" title="Buscar DNI">${icon('search')}</button>
               </div>`
          }
        </div>
        <div class="cont-control">
          <label>Fecha de nacimiento</label>
          <input type="date" name="fecha_nac" value="${pac?.fecha_nac ?? ''}" required />
        </div>
        <div class="cont-control">
          <label>Nombres</label>
          <input type="text" name="nombre" value="${pac?.nombre ?? ''}" required />
        </div>
        <div class="cont-control">
          <label>Apellidos</label>
          <input type="text" name="apellidos" value="${pac?.apellidos ?? ''}" required />
        </div>
        <div class="cont-control">
          <label>TelÃƒÂ©fono</label>
          <input type="text" name="telefono" value="${pac?.telefono ?? ''}" />
        </div>
      </div>
      <div style="display:flex;gap:8px;margin-top:12px;">
        <button type="submit" class="btn-primario" id="btn-guardar-pac">${isEdit ? 'Actualizar' : 'Registrar'}</button>
        <button type="button" class="btn-secundario btn-cancelar" id="btn-cancel-pac">Cancelar</button>
      </div>
    </form>`

  openModal(html)

  if (!isEdit) {
    const inputDni = document.querySelector('[name="dni"]')
    const btnBuscar = document.getElementById('btn-buscar-dni')

    const ejecutarBusqueda = () => buscarDniPaciente(inputDni.value.trim())
    btnBuscar.addEventListener('click', ejecutarBusqueda)
    inputDni.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); ejecutarBusqueda() } })
  }

  document.getElementById('btn-cancel-pac').addEventListener('click', closeModal)

  document.getElementById('form-paciente').addEventListener('submit', async (e) => {
    e.preventDefault()
    const fd   = new FormData(e.target)
    const body = Object.fromEntries(fd.entries())

    try {
      if (isEdit) {
        await api.put(`/api/pacientes/${pac.dni}`, body)
        toastOk('Paciente actualizado.')
      } else {
        await api.post('/api/pacientes', body)
        toastOk('Paciente registrado.')
      }
      closeModal()
      cargarPacientes()
    } catch (err) {
      toastError(err.message)
    }
  })
}

// Ã¢â€â‚¬Ã¢â€â‚¬ Historial Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬

async function abrirHistorial(dni) {
  openModal(`<div class="state-loading"><div class="spinner"></div></div>`, { wide: true })
  try {
    const [{ data: paciente }, { data: atenciones }, { data: examenes }] = await Promise.all([
      api.get(`/api/pacientes/${dni}`),
      api.get('/api/atenciones/paciente', { dni }),
      api.get('/api/examenes', { dni }),
    ])

    const liAtenciones = atenciones.map(a =>
      `<li><button class="link-btn" data-type="${a.tipo}" data-id="${a.idatencion}">${a.fecha} Ã¢â‚¬â€ ${a.nombre}</button></li>`
    ).join('') || '<li class="muted">Sin atenciones registradas.</li>'

    const liExamenes = examenes.map(ex =>
      `<li><button class="link-btn" data-type="${ex.tipo.toLowerCase()}" data-id="${ex.idexamen}">${ex.fecha} Ã¢â‚¬â€ ${ex.nombre} (${ex.tipo})</button></li>`
    ).join('') || '<li class="muted">Sin exÃƒÂ¡menes registrados.</li>'

    const html = `
      <h2 class="modal-title">${paciente.apellidos}, ${paciente.nombre}</h2>
      <p class="modal-subtitle">DNI: ${paciente.dni} Ã‚Â· Nac.: ${paciente.fecha_nac}</p>
      <div class="historial-layout">
        <aside class="historial-aside">
          <h4>Consultas</h4><ul class="historial-list">${liAtenciones}</ul>
          <h4 style="margin-top:14px">ExÃƒÂ¡menes</h4><ul class="historial-list">${liExamenes}</ul>
        </aside>
        <div class="historial-panel" id="historial-panel">
          <p class="muted ta-center" style="padding:40px 0">Selecciona un registro de la lista.</p>
        </div>
      </div>`

    openModal(html, { wide: true })

    // DelegaciÃƒÂ³n en el modal
    document.getElementById('modal-content').addEventListener('click', async (e) => {
      const btn = e.target.closest('[data-type]')
      if (!btn) return
      const panel = document.getElementById('historial-panel')
      panel.innerHTML = `<div class="state-loading"><div class="spinner"></div></div>`

      try {
        if (btn.dataset.type === 'consulta') {
          const { data: a } = await api.get(`/api/atenciones/${btn.dataset.id}`)
          panel.innerHTML = renderPanelConsulta(a)
        } else if (btn.dataset.type === 'examen') {
          const { data } = await api.get(`/api/atenciones/${btn.dataset.id}/examen`)
          panel.innerHTML = `<iframe src="${data?.examen ?? ''}" width="100%" style="height:60vh;border:none;"></iframe>`
        } else if (btn.dataset.type === 'img') {
          const { data } = await api.get(`/api/examenes/${btn.dataset.id}/imagenes`)
          panel.innerHTML = data.map(d => `<div class="imagen"><img src="${d.archivo}" alt="" /></div>`).join('')
        } else if (btn.dataset.type === 'pdf') {
          const { data } = await api.get(`/api/examenes/${btn.dataset.id}`)
          panel.innerHTML = `
            <div class="cont-opciones-examenes">
              <button class="btndel" data-action="del-examen" data-id="${btn.dataset.id}" type="button">Eliminar examen</button>
            </div>
            <iframe src="${data[0]?.archivo ?? ''}" width="100%" style="height:60vh;border:none;"></iframe>`
        }
      } catch (err) {
        panel.innerHTML = `<p class="state-error">${err.message}</p>`
      }
    })

  } catch (err) {
    openModal(`<p class="state-error">${err.message}</p>`)
  }
}

function renderPanelConsulta(a) {
  const fila = (label, val) => val ? `<tr><td class="label-cell">${label}</td><td>${val}</td></tr>` : ''
  return `
    <table class="gm-table detail-table">
      <tbody>
        ${fila('Fecha', a.fechaatencion)}
        ${fila('FC', a.fr)} ${fila('PA', a.pa)} ${fila('TÃ‚Â°', a.temp)} ${fila('So2', a.so2)} ${fila('Peso', a.peso)}
        ${fila('Antecedente', a.antecedente)}
        ${fila('Molestia', a.motivoconsulta)}
        ${fila('Anamnesis', a.anamensis)}
        ${fila('Examen fÃƒÂ­sico', a.exfisico)}
        ${fila('DiagnÃƒÂ³stico', a.diagnostico)}
        ${fila('Tratamiento', a.tratamiento)}
      </tbody>
    </table>
    <div style="margin-top:10px;">
      <a href="/pdf/receta/${a.idatencion}" target="_blank" class="btn-secundario">
        ${icon('pdf')} Ver PDF
      </a>
    </div>`
}

// Ã¢â€â‚¬Ã¢â€â‚¬ ImÃƒÂ¡genes Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬

async function abrirSubirImagenes(dni) {
  const slots = Array.from({ length: 6 }, (_, i) => `
    <label class="img-slot" data-slot="${i + 1}" title="Imagen ${i + 1}">
      <input type="file" name="foto${i + 1}" accept="image/png,image/jpeg" style="display:none;" />
      <img class="img-preview" style="display:none;" alt="" />
      <span class="img-slot-label">+ Img ${i + 1}</span>
    </label>`).join('')

  const html = `
    <h2 class="modal-title">Cargar ImÃƒÂ¡genes</h2>
    <form id="form-imgs" novalidate>
      <div class="cont-control" style="margin-bottom:14px;">
        <label>Nombre del examen</label>
        <input type="text" name="nombreexamen" required placeholder="Ej: RadiografÃƒÂ­a de tÃƒÂ³rax" autocomplete="off" />
      </div>
      <div class="img-slots-grid">${slots}</div>
      <div style="display:flex;gap:8px;margin-top:16px;">
        <button type="submit" class="btn-primario">Subir imÃƒÂ¡genes</button>
        <button type="button" class="btn-secundario" id="btn-cancel-imgs">Cancelar</button>
      </div>
    </form>`

  openModal(html, { wide: true })

  // Vista previa al seleccionar archivo
  document.querySelectorAll('.img-slot input[type=file]').forEach(input => {
    input.addEventListener('change', () => {
      const file = input.files[0]
      if (!file) return
      const slot    = input.closest('.img-slot')
      const preview = slot.querySelector('.img-preview')
      const label   = slot.querySelector('.img-slot-label')
      const reader  = new FileReader()
      reader.onloadend = () => {
        preview.src          = reader.result
        preview.style.display = 'block'
        label.style.display   = 'none'
        slot.classList.add('img-slot--filled')
      }
      reader.readAsDataURL(file)
    })
  })

  document.getElementById('btn-cancel-imgs').addEventListener('click', closeModal)

  document.getElementById('form-imgs').addEventListener('submit', async (e) => {
    e.preventDefault()
    const nombre = e.target.querySelector('[name="nombreexamen"]').value.trim()
    if (!nombre) { toastError('Ingrese un nombre para el examen.'); return }

    const fd = new FormData(e.target)
    fd.append('idpaciente', dni)

    let hasImage = false
    for (let i = 1; i <= 6; i++) {
      const f = fd.get('foto' + i)
      if (f && f.size > 0) { hasImage = true; break }
    }
    if (!hasImage) { toastError('Seleccione al menos una imagen.'); return }

    try {
      const csrf = document.querySelector('meta[name="csrf-token"]')?.content ?? ''
      const res  = await fetch('/api/examenes/subir-imagenes', {
        method:  'POST',
        headers: { 'X-CSRF-Token': csrf },
        body:    fd,
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Error al subir imagenes.')
      const guardados = json.data?.guardados ?? json.guardados ?? 0
      toastOk(`${guardados} imagen${guardados !== 1 ? 'es' : ''} guardada${guardados !== 1 ? 's' : ''}.`)
      closeModal()
    } catch (err) {
      toastError(err.message)
    }
  })
}

// Ã¢â€â‚¬Ã¢â€â‚¬ PDFs Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬

async function abrirSubirPdf(dni) {
  const html = `
    <h2 class="modal-title">Cargar PDF</h2>
    <form id="form-pdf" novalidate>
      <div class="cont-control">
        <label>Nombre del examen</label>
        <input type="text" name="nombreexamen" required placeholder="Ej: Resultado de laboratorio" autocomplete="off" />
      </div>
      <div class="cont-control" style="margin-top:12px;">
        <label>Archivo PDF</label>
        <input type="file" name="mi-archivo" accept="application/pdf" required />
      </div>
      <div id="pdf-preview-wrap" style="margin-top:10px;display:none;">
        <p style="font-size:.82rem;color:var(--gris-dark);" id="pdf-filename"></p>
      </div>
      <div style="display:flex;gap:8px;margin-top:16px;">
        <button type="submit" class="btn-primario">Subir PDF</button>
        <button type="button" class="btn-secundario" id="btn-cancel-pdf">Cancelar</button>
      </div>
    </form>`

  openModal(html)

  const inputFile = document.querySelector('#form-pdf [name="mi-archivo"]')
  inputFile.addEventListener('change', () => {
    const file = inputFile.files[0]
    const wrap = document.getElementById('pdf-preview-wrap')
    const lbl  = document.getElementById('pdf-filename')
    if (file) {
      lbl.textContent = `Archivo seleccionado: ${file.name} (${(file.size / 1024).toFixed(1)} KB)`
      wrap.style.display = 'block'
    } else {
      wrap.style.display = 'none'
    }
  })

  document.getElementById('btn-cancel-pdf').addEventListener('click', closeModal)

  document.getElementById('form-pdf').addEventListener('submit', async (e) => {
    e.preventDefault()
    const nombre = e.target.querySelector('[name="nombreexamen"]').value.trim()
    if (!nombre) { toastError('Ingrese un nombre para el examen.'); return }

    const file = inputFile.files[0]
    if (!file || file.size === 0) { toastError('Seleccione un archivo PDF.'); return }

    const fd = new FormData(e.target)
    fd.append('idpaciente', dni)

    try {
      const csrf = document.querySelector('meta[name="csrf-token"]')?.content ?? ''
      const res  = await fetch('/api/examenes/subir-pdf', {
        method:  'POST',
        headers: { 'X-CSRF-Token': csrf },
        body:    fd,
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Error al subir imagenes.')
      toastOk('PDF subido correctamente.')
      closeModal()
    } catch (err) {
      toastError(err.message)
    }
  })
}

// Ã¢â€â‚¬Ã¢â€â‚¬ Helpers Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬

function abrirVentana(url) {
  const w = 1000, h = 800
  const x = Math.round(screen.width  / 2 - w / 2)
  const y = Math.round(screen.height / 2 - h / 2)
  window.open(url, '_blank', `left=${x},top=${y},width=${w},height=${h},scrollbars=yes,location=no,resizable=yes,menubar=no`)
}
