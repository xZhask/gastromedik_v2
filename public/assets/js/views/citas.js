/**
 * views/citas.js
 * Vista Citas: lista por fecha, registro/edición, anulación y pago.
 * Los IDs viven en los datos JS — nunca en celdas ocultas del DOM.
 */

import { api }        from '../utils/api.js'
import { toastOk, toastError } from '../utils/toast.js'
import { icon, iconBtn } from '../utils/icons.js'
import { openModal, closeModal } from '../components/modal.js'
import { confirm }    from '../components/confirm.js'
import { renderTable, wrapTable } from '../components/table.js'

const content = () => document.getElementById('app-content')
const CARGO   = parseInt(document.querySelector('meta[name="user-cargo"]')?.content ?? '0')
let PROCEDIMIENTOS = []  // caché para autocomplete

// ── Punto de entrada ──────────────────────────────────────────────────────────

export async function CitasView() {
  const hoy = new Date().toISOString().split('T')[0]

  content().innerHTML = `
    <div class="cabecera">
      <h2>Citas</h2>
      <div class="cont-control">
        <input type="date" id="fecha-citas" value="${hoy}" />
      </div>
      <div class="cont-groupbotones">
        <button class="btn-secundario" id="btn-buscar-cita" type="button">Buscar Cita</button>
        <button class="btn-secundario" id="btn-nueva-cita" type="button">${icon('plus')} Nueva Cita</button>
      </div>
    </div>
    <div id="tabla-citas-wrap"></div>`

  // Cargar procedimientos para autocomplete (una vez)
  try {
    const r = await api.get('/api/procedimientos')
    PROCEDIMIENTOS = r.data ?? []
  } catch { /* continuar sin autocompletar */ }

  await cargarCitas()
  bindEventos()
}

// ── Carga de datos ────────────────────────────────────────────────────────────

async function cargarCitas() {
  const wrap  = document.getElementById('tabla-citas-wrap')
  if (!wrap) return
  wrap.innerHTML = `<div class="state-loading"><div class="spinner"></div></div>`

  const fecha = document.getElementById('fecha-citas')?.value ?? new Date().toISOString().split('T')[0]

  try {
    const res = await api.get('/api/citas', { fecha });
    const data = Array.isArray(res.data) ? res.data : [];

if (data.length === 0) {
      wrap.innerHTML = `<div class="state-empty">No hay citas para esta fecha.</div>`
      return
    }
    wrap.innerHTML = wrapTable(renderTable({
      columns:  buildColumns(CARGO),
      rows: data.map(c => ({
        _id: c.idcita,
        idcita: c.idcita,
        horario: c.horario,
        paciente: c.paciente,
        motivo: c.motivo,
        telefono: c.telefono,
        estado: c.estado,
        atencion_estado: c.atencion?.estado ?? null,
      })),
      rowClass: () => '',
    }))
  } catch (err) {
    wrap.innerHTML = `<div class="state-error">${err.message}</div>`
  }
}

function buildColumns(cargo) {
  return [
    { key: 'horario',  label: 'Hora',     align: 'center' },
    { key: 'paciente', label: 'Paciente' },
    { key: 'motivo',   label: 'Motivo de Consulta' },
    { key: 'telefono', label: 'Celular',  align: 'center' },
    {
      label: 'Pago', align: 'center',
      render: c => {
        if (c.estado === 'ANULADO') return `<span class="badge badge-rojo">Anulado</span>`
        if (c.estado === 'POR PAGAR') return `<button class="link-btn lnk-red" data-action="pagar" title="Registrar pago">Reg. Pago</button>`
        if (c.estado === 'A CUENTA')  return `<button class="link-btn lnk-Ambar" data-action="pagar" title="Registrar pago">A Cuenta</button>`
        return `<span class="badge badge-verde">${c.estado}</span>`
      },
    },
    {
      label: 'Editar', align: 'center',
      render: c => {
        if (c.atencion_estado === 'FINALIZADO') return `<span class="badge badge-verde">Finalizado</span>`
        if (c.estado === 'ANULADO')             return ''
        return iconBtn('sliders', 'editar', 'Editar cita', 'icon-edit')
      },
    },
    ...(cargo === 1 ? [{
      label: 'Anular', align: 'center',
      render: c => (c.estado === 'ANULADO' || c.atencion_estado === 'FINALIZADO') ? '' : iconBtn('cancel', 'anular', 'Anular cita', 'icon-danger'),
    }] : []),
    {
      label: 'Ticket', align: 'center',
      render: c => (c.estado === 'A CUENTA' || c.estado === 'PAGADO')
        ? iconBtn('print', 'ticket', 'Imprimir ticket', 'icon-info')
        : '',
    },
  ]
}

// ── Eventos ───────────────────────────────────────────────────────────────────

function bindEventos() {
  const el = content()

  el.querySelector('#fecha-citas')?.addEventListener('change', cargarCitas)
  el.querySelector('#btn-nueva-cita')?.addEventListener('click', () => abrirFormCita(null))
  el.querySelector('#btn-buscar-cita')?.addEventListener('click', () => abrirBusquedaCita())

  el.addEventListener('click', async (e) => {
    if (!e.target.closest('#tabla-citas-wrap')) return
    const btn = e.target.closest('[data-action]')
    if (!btn) return
    const tr     = btn.closest('tr')
    const idcita = parseInt(tr?.dataset.id)
    if (!idcita) return

    switch (btn.dataset.action) {
      case 'editar': await editarCita(idcita); break
      case 'anular': await anularCita(idcita, tr); break
      case 'pagar': {
        const cajaOk = await asegurarCajaAbierta()
        if (cajaOk) await abrirPago(idcita)
        break
      }
      case 'ticket': abrirTicket(idcita); break
    }
  })
}

// ── CRUD Cita ──────────────────────────────────────────────────────────────────

async function editarCita(idcita) {
  try {
    const res = await api.get(`/api/citas/${idcita}`)
    abrirFormCita(res.data)
  } catch (err) { toastError(err.message) }
}

async function anularCita(idcita, tr) {
  const ok = await confirm({
    title:        'Anular cita',
    text:         'Esta acción no se podrá revertir.',
    confirmLabel: 'Sí, anular',
    danger:       true,
  })
  if (!ok) return
  try {
    await api.delete(`/api/citas/${idcita}`)
    toastOk('Cita anulada.')
    await cargarCitas()
  } catch (err) { toastError(err.message) }
}

function abrirFormCita(cita) {
  const isEdit = cita !== null
  const hoy    = new Date().toISOString().split('T')[0]

  const optsProc = PROCEDIMIENTOS.map(p =>
    `<option value="${p.idtipoatencion}" data-precio="${p.precio}"
      ${cita?.idtipoatencion == p.idtipoatencion ? 'selected' : ''}>${p.nombre}</option>`
  ).join('')

  const html = `
    <h2 class="modal-title">${isEdit ? 'Editar Cita' : 'Nueva Cita'}</h2>
    <form id="form-cita" novalidate>
      <div class="cont-group">
        <div class="cont-control">
          <label>DNI del Paciente</label>
          ${isEdit
            ? `<input type="text" name="dni" value="${cita?.dni ?? ''}" readonly required maxlength="8" />`
            : `<div class="cont-busqueda">
                 <input type="text" name="dni" value="" required maxlength="8" autocomplete="off" placeholder="Ingrese DNI" />
                 <button type="button" id="btn-buscar-dni-cita" title="Buscar DNI">${icon('search')}</button>
               </div>`
          }
        </div>
        <div class="cont-control">
          <label>Nombre del Paciente</label>
          <input type="text" name="nombre" value="${cita?.nombrepaciente ?? ''}" ${isEdit ? '' : 'readonly'} />
        </div>
        <div class="cont-control">
          <label>Apellidos</label>
          <input type="text" name="apellidos" value="${cita?.apellidospaciente ?? ''}" ${isEdit ? '' : 'readonly'} />
        </div>
        <div class="cont-control">
          <label>Procedimiento / Motivo</label>
          <select name="idtipoatencion" id="sel-proc" required>
            <option value="">Seleccionar…</option>${optsProc}
          </select>
        </div>
        <div class="cont-control">
          <label>Precio</label>
          <input type="number" name="precio" value="${cita?.precio ?? ''}" step="0.01" />
        </div>
        <div class="cont-control">
          <label>Fecha</label>
          <input type="date" name="fecha" value="${cita?.fecha ?? hoy}" min="${hoy}" required />
        </div>
        <div class="cont-control">
          <label>Hora</label>
          <input type="time" name="horario" value="${cita?.horario ?? ''}" required />
        </div>
        <div class="cont-control">
          <label>Teléfono</label>
          <input type="text" name="telefono" value="${cita?.telefono ?? ''}" ${isEdit ? '' : 'readonly'} />
        </div>
        ${!isEdit ? `
        <div class="cont-control" id="wrap-fecha-nac" hidden>
          <label>Fecha de nacimiento</label>
          <input type="date" name="fecha_nac" value="" />
        </div>` : ''}
      </div>
      <div style="display:flex;gap:8px;margin-top:12px;">
        <button type="submit" class="btn-primario">${isEdit ? 'Actualizar' : 'Registrar'}</button>
        <button type="button" class="btn-secundario btn-cancelar" id="btn-cancel-cita">Cancelar</button>
      </div>
    </form>`

  openModal(html)

  // Precio automático al cambiar procedimiento
  document.getElementById('sel-proc')?.addEventListener('change', (e) => {
    const opt = e.target.selectedOptions[0]
    document.querySelector('[name="precio"]').value = opt?.dataset.precio ?? ''
  })

  // Autocompletar datos del paciente por DNI (BD local → API externa)
  if (!isEdit) {
    const inputDni  = document.querySelector('[name="dni"]')
    const btnBuscar = document.getElementById('btn-buscar-dni-cita')

    const mostrarFechaNac = () => {
      const wrap = document.getElementById('wrap-fecha-nac')
      if (wrap && wrap.hidden) {
        wrap.hidden = false
        wrap.classList.add('field-reveal')
      }
    }

    const habilitarCampos = (...names) => {
      names.forEach(n => {
        const el = document.querySelector(`[name="${n}"]`)
        if (el) el.removeAttribute('readonly')
      })
    }

    const buscarDni = async () => {
      const dni = inputDni.value.trim()
      if (dni.length !== 8) return

      // 1. Buscar en BD local → paciente ya registrado
      try {
        const res  = await api.get(`/api/pacientes/${dni}`)
        const data = res.data ?? {}
        if (data.nombre) {
          document.querySelector('[name="nombre"]').value    = data.nombre    ?? ''
          document.querySelector('[name="apellidos"]').value = data.apellidos ?? ''
          document.querySelector('[name="telefono"]').value  = data.telefono  ?? ''
          // fecha_nac queda oculto: paciente ya existe
          return
        }
      } catch { /* 404 → intentar API externa */ }

      // 2. Consultar RENIEC → nombre/apellidos disponibles, necesita fecha_nac
      try {
        const res = await api.get(`/api/personal/consulta-dni/${dni}`)
        const d   = res.data ?? {}
        if (d.nombres) {
          document.querySelector('[name="nombre"]').value    = d.nombres ?? ''
          document.querySelector('[name="apellidos"]').value = `${d.apellido_paterno ?? ''} ${d.apellido_materno ?? ''}`.trim()
          habilitarCampos('telefono')
          mostrarFechaNac()
          return
        }
      } catch { /* no encontrado en RENIEC */ }

      // 3. No encontrado en ninguna fuente → menor de edad, habilitar todo
      habilitarCampos('nombre', 'apellidos', 'telefono')
      mostrarFechaNac()
    }

    btnBuscar.addEventListener('click', buscarDni)
    inputDni.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); buscarDni() } })
  }

  document.getElementById('btn-cancel-cita').addEventListener('click', closeModal)

  document.getElementById('form-cita').addEventListener('submit', async (e) => {
    e.preventDefault()
    const body = Object.fromEntries(new FormData(e.target).entries())
    try {
      if (isEdit) {
        await api.put(`/api/citas/${cita.idcita}`, body)
        toastOk('Cita actualizada.')
        closeModal()
        cargarCitas()
      } else {
        const res = await api.post('/api/citas', body)
        const idcita = res.data?.idcita ?? res.idcita
        toastOk('Cita registrada.')
        closeModal()
        cargarCitas()
        await confirmarYPagar(idcita)
      }
    } catch (err) { toastError(err.message) }
  })
}

// ── Caja ─────────────────────────────────────────────────────────────────────

/**
 * Verifica si la caja está abierta.
 * Si está cerrada, muestra un modal para aperturarla.
 * Resuelve `true` si la caja quedó abierta, `false` si el usuario canceló.
 */
async function asegurarCajaAbierta() {
  try {
    const r = await api.get('/api/caja/verificar')
    if (r.data?.abierta) return true
  } catch {
    toastError('No se pudo verificar el estado de la caja.')
    return false
  }

  return new Promise((resolve) => {
    const html = `
      <h2 class="modal-title">Caja cerrada</h2>
      <p style="margin-bottom:16px;color:var(--gris-dark);">
        La caja del día no está aperturada.<br/>
        ¿Desea aperturarla para registrar el pago?
      </p>
      <form id="form-aperturar-inline" novalidate>
        <div class="cont-group">
          <div class="cont-control">
            <label>Monto inicial (S/.)</label>
            <input type="number" name="monto_inicial" value="0" step="0.01" min="0" required />
          </div>
          <div class="cont-control">
            <label>Descripción</label>
            <input type="text" name="descripcion" value="Apertura de caja" />
          </div>
        </div>
        <div style="display:flex;gap:8px;margin-top:12px;">
          <button type="submit" class="btn-primario">Aperturar y continuar</button>
          <button type="button" class="btn-secundario" id="btn-cancel-ap-inline">Cancelar</button>
        </div>
      </form>`

    openModal(html)

    document.getElementById('btn-cancel-ap-inline').addEventListener('click', () => {
      closeModal()
      resolve(false)
    })

    document.getElementById('form-aperturar-inline').addEventListener('submit', async (e) => {
      e.preventDefault()
      const body = Object.fromEntries(new FormData(e.target).entries())
      try {
        await api.post('/api/caja/aperturar', body)
        toastOk('Caja aperturada.')
        closeModal()
        resolve(true)
      } catch (err) {
        toastError(err.message)
        resolve(false)
      }
    })
  })
}

// ── Pago ──────────────────────────────────────────────────────────────────────

/**
 * Tras registrar una nueva cita: verifica caja y pregunta si registrar pago.
 * - Caja cerrada → aviso informativo (sin forzar apertura).
 * - Caja abierta → confirmación "¿registrar ahora?".
 */
async function confirmarYPagar(idcita) {
  let cajaAbierta = false
  try {
    const r = await api.get('/api/caja/verificar')
    cajaAbierta = r.data?.abierta === true
  } catch { /* ignorar */ }

  if (!cajaAbierta) {
    return new Promise((resolve) => {
      const html = `
        <h2 class="modal-title">Cita registrada</h2>
        <p style="margin-bottom:16px;color:var(--gris-dark);">
          La cita se guardó correctamente.<br/>
          Para registrar el pago debe aperturar la caja primero.
        </p>
        <div style="display:flex;gap:8px;margin-top:12px;">
          <button type="button" class="btn-primario" id="btn-info-ok">Entendido</button>
        </div>`
      openModal(html)
      document.getElementById('btn-info-ok').addEventListener('click', () => { closeModal(); resolve() })
    })
  }

  return new Promise((resolve) => {
    const html = `
      <h2 class="modal-title">Cita registrada</h2>
      <p style="margin-bottom:16px;color:var(--gris-dark);">
        ¿Desea registrar el pago ahora?
      </p>
      <div style="display:flex;gap:8px;margin-top:12px;">
        <button type="button" class="btn-primario" id="btn-pagar-ahora">Sí, registrar pago</button>
        <button type="button" class="btn-secundario" id="btn-pagar-despues">Más tarde</button>
      </div>`
    openModal(html)
    document.getElementById('btn-pagar-ahora').addEventListener('click', async () => {
      closeModal()
      await abrirPago(idcita)
      resolve()
    })
    document.getElementById('btn-pagar-despues').addEventListener('click', () => { closeModal(); resolve() })
  })
}

async function abrirPago(idcita) {
  const tiposPago = window.__TIPOS_PAGO__ ?? []
  let montoCuenta = 0
  try {
    const r = await api.get('/api/caja/movimiento-cuenta', { idcita })
    montoCuenta = parseFloat(r.data?.monto ?? 0)
  } catch { /* primer pago */ }

  const res = await api.get(`/api/citas/${idcita}`)
  const cita = res.data
  const precioTotal = parseFloat(cita.precio ?? 0)
  const saldo       = precioTotal - montoCuenta

  const optsTP = tiposPago.map(t =>
    `<option value="${t.idtipopago}">${t.tipopago}</option>`
  ).join('')

  const html = `
    <h2 class="modal-title">Registrar Pago</h2>
    <p style="margin-bottom:12px;color:var(--gris-dark);">
      Paciente: <strong>${cita.apellidospaciente}, ${cita.nombrepaciente}</strong><br/>
      Motivo: ${cita.motivo}
    </p>
    <form id="form-pago" novalidate>
      <div class="cont-group">
        <div class="cont-control">
          <label>Tipo de Pago</label>
          <select name="idtipopago">${optsTP}</select>
        </div>
        <div class="cont-control">
          <label>Monto Total</label>
          <input type="number" name="monto_total" value="${precioTotal}" step="0.01" readonly />
        </div>
        <div class="cont-control">
          <label>Monto Pagado</label>
          <input type="number" value="${montoCuenta.toFixed(2)}" readonly />
        </div>
        <div class="cont-control">
          <label>Monto a Pagar (saldo)</label>
          <input type="number" name="monto_pagado" value="${saldo.toFixed(2)}" step="0.01" min="0" required />
        </div>
      </div>
      <div style="display:flex;gap:8px;margin-top:12px;">
        <button type="submit" class="btn-primario">Registrar Pago</button>
        <button type="button" class="btn-secundario btn-cancelar" id="btn-cancel-pago">Cancelar</button>
      </div>
    </form>`

  openModal(html)
  document.getElementById('btn-cancel-pago').addEventListener('click', closeModal)

  document.getElementById('form-pago').addEventListener('submit', async (e) => {
    e.preventDefault()
    const body = { ...Object.fromEntries(new FormData(e.target).entries()), idcita, motivo: cita.motivo }
    try {
      const res = await api.post('/api/caja/pago', body)
      toastOk('Pago registrado.')
      closeModal()
      cargarCitas()
      abrirTicket(res.idcita)
    } catch (err) { toastError(err.message) }
  })
}

// ── Búsqueda de cita ──────────────────────────────────────────────────────────

function abrirBusquedaCita() {
  const html = `
    <h2 class="modal-title">Buscar Citas</h2>
    <div style="display:flex;gap:8px;margin-bottom:16px;">
      <input type="text" id="q-buscar-cita" placeholder="DNI del paciente" maxlength="8" style="flex:1" />
      <button class="btn-primario" id="btn-exec-buscar" type="button">${icon('search')} Buscar</button>
    </div>
    <div id="resultado-busqueda-cita"></div>`

  openModal(html, { wide: true })

  const ejecutar = async () => {
    const dni = document.getElementById('q-buscar-cita')?.value?.trim()
    if (!dni) return
    const wrap = document.getElementById('resultado-busqueda-cita')
    wrap.innerHTML = `<div class="state-loading"><div class="spinner"></div></div>`
    try {
      const res = await api.get('/api/citas/buscar', { dni })
      const data = Array.isArray(res.data) ? res.data : []
      wrap.innerHTML = wrapTable(renderTable({
        columns: [
          { key: 'fecha',   label: 'Fecha',   align: 'center' },
          { key: 'horario', label: 'Hora',    align: 'center' },
          { key: 'motivo',  label: 'Motivo' },
          { key: 'estado',  label: 'Estado',  align: 'center', render: c => estadoBadge(c.estado) },
          { key: 'atencion_estado', label: 'Atención', align: 'center',
            render: c => c.atencion_estado ? estadoBadge(c.atencion_estado) : '—' },
        ],
        rows:    data,
        emptyMsg: 'No se encontraron citas para este DNI.',
      }))
    } catch (err) { wrap.innerHTML = `<div class="state-error">${err.message}</div>` }
  }

  document.getElementById('btn-exec-buscar').addEventListener('click', ejecutar)
  document.getElementById('q-buscar-cita').addEventListener('keydown', e => { if (e.key === 'Enter') ejecutar() })
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function abrirTicket(idcita) {
  const w = 800, h = 700
  const x = Math.round(screen.width  / 2 - w / 2)
  const y = Math.round(screen.height / 2 - h / 2)
  window.open(`/pdf/ticket/${idcita}`, '_ticket',
    `left=${x},top=${y},width=${w},height=${h},scrollbars=yes,menubar=no`)
}

function estadoBadge(estado) {
  const mapa = {
    'PAGADO':    'badge-verde',
    'A CUENTA':  'badge-ambar',
    'POR PAGAR': 'badge-rojo',
    'ANULADO':   'badge-rojo',
    'FINALIZADO':'badge-verde',
    'INICIADO':  'badge-azul',
    'EN PROGR':  'badge-azul',
  }
  return `<span class="badge ${mapa[estado] ?? 'badge-gris'}">${estado}</span>`
}
