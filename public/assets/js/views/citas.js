/**
 * views/citas.js — Agenda diaria con navegador de fecha, contadores y CRUD.
 *
 * Mejoras UX/UI fase 3:
 *  · Cabecera con navegador ← Hoy → en lugar de input date suelto.
 *  · Tira de contadores por estado.
 *  · Columnas: hora prominente, paciente con avatar, estado unificado.
 *  · Form de cita en dos secciones: Paciente / Cita.
 *  · Empty state contextual con CTA.
 */

import { api }                       from '../utils/api.js'
import { toastOk, toastError }       from '../utils/toast.js'
import { icon, iconBtn }             from '../utils/icons.js'
import { openModal, closeModal }     from '../components/modal.js'
import { confirm }                   from '../components/confirm.js'
import { renderTable, wrapTable }    from '../components/table.js'
import { skeletonTable }             from '../components/skeleton.js'

const content = () => document.getElementById('app-content')
const CARGO   = parseInt(document.querySelector('meta[name="user-cargo"]')?.content ?? '0')

let PROCEDIMIENTOS = []
let CITAS_CACHE    = []

// ── Punto de entrada ──────────────────────────────────────────────────────────

export async function CitasView() {
  const hoy = new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0]

  content().innerHTML = `
    <div class="citas-header">
      <div class="citas-header__top">
        <div class="citas-header__title">
          <h1>Citas</h1>
          <span class="gm-page-header__sub" id="citas-fecha-label"></span>
        </div>

        <div class="citas-header__nav">
          <button class="icon-btn" id="btn-fecha-prev" aria-label="Día anterior">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
          <button class="btn-secundario btn-sm" id="btn-fecha-hoy" type="button">Hoy</button>
          <button class="icon-btn" id="btn-fecha-next" aria-label="Día siguiente">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
          </button>
          <input type="date" id="fecha-citas" value="${hoy}" />
        </div>

        <div class="citas-header__actions">
          <button class="btn-secundario" id="btn-buscar-cita" type="button">${icon('search')} Buscar</button>
          <button class="btn-primario"   id="btn-nueva-cita"  type="button">${icon('plus')} Nueva cita</button>
        </div>
      </div>

      <div class="citas-stats" id="citas-stats" hidden style="display:flex; gap:16px; margin-top:16px; margin-bottom:-8px;">
        <div class="gm-stat gm-stat--verde" id="stat-card-pagadas" style="flex:1; transition: opacity 0.2s, padding 0.2s;">
          <span class="gm-stat__label">Pagadas</span>
          <span class="gm-stat__value" id="stat-pagadas">0</span>
        </div>
        <div class="gm-stat gm-stat--rojo" id="stat-card-por-pagar" style="flex:1; transition: opacity 0.2s, padding 0.2s;">
          <span class="gm-stat__label">Por pagar</span>
          <span class="gm-stat__value" id="stat-por-pagar">0</span>
        </div>
        <div class="gm-stat gm-stat--ambar" id="stat-card-cuenta" style="flex:1; transition: opacity 0.2s, padding 0.2s;">
          <span class="gm-stat__label">A cuenta</span>
          <span class="gm-stat__value" id="stat-cuenta">0</span>
        </div>
        <div class="gm-stat" id="stat-card-anuladas" style="flex:1; transition: opacity 0.2s, padding 0.2s;">
          <span class="gm-stat__label">Anuladas</span>
          <span class="gm-stat__value" id="stat-anuladas" style="color: var(--gris);">0</span>
        </div>
      </div>
    </div>

    <div id="tabla-citas-wrap"></div>`

  try {
    const r = await api.get('/api/procedimientos')
    PROCEDIMIENTOS = r.data ?? []
  } catch { /* continuar sin autocompletar */ }

  await cargarCitas()
  bindEventos()
}

// ── Carga ─────────────────────────────────────────────────────────────────────

async function cargarCitas() {
  const wrap = document.getElementById('tabla-citas-wrap')
  if (!wrap) return
  wrap.innerHTML = skeletonTable(6, 5)

  const fecha = document.getElementById('fecha-citas')?.value ?? new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0]
  actualizarLabelFecha(fecha)

  try {
    const res  = await api.get('/api/citas', { fecha })
    const data = Array.isArray(res.data) ? res.data : []
    CITAS_CACHE = data

    actualizarContadores(data)

    if (!data.length) {
      wrap.innerHTML = renderVacio(fecha)
      document.getElementById('btn-vacio-nueva')?.addEventListener('click', () => abrirFormCita(null))
      return
    }

    wrap.innerHTML = wrapTable(renderTable({
      columns: buildColumns(CARGO),
      rows: data.map(c => ({
        _id:            c.idcita,
        idcita:         c.idcita,
        horario:        c.horario,
        paciente:       c.paciente,
        motivo:         c.motivo,
        telefono:       c.telefono,
        estado:         c.estado,
        atencion_estado: c.atencion?.estado ?? null,
      })),
    }))
  } catch (err) {
    wrap.innerHTML = `<div class="state-error">${err.message}</div>`
  }
}

function actualizarLabelFecha(fecha) {
  const el = document.getElementById('citas-fecha-label')
  if (!el) return
  const d = new Date(fecha + 'T00:00:00')
  const opts = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }
  el.textContent = d.toLocaleDateString('es-PE', opts)
}

function actualizarContadores(data) {
  const stats = document.getElementById('citas-stats')
  if (!data.length) { stats.hidden = true; return }
  stats.hidden = false

  const c = { pagadas: 0, porPagar: 0, cuenta: 0, anuladas: 0 }
  data.forEach(x => {
    if      (x.estado === 'ANULADO')   c.anuladas++
    else if (x.estado === 'POR PAGAR') c.porPagar++
    else if (x.estado === 'A CUENTA')  c.cuenta++
    else                               c.pagadas++
  })
  document.getElementById('stat-pagadas').textContent   = c.pagadas
  document.getElementById('stat-por-pagar').textContent = c.porPagar
  document.getElementById('stat-cuenta').textContent    = c.cuenta
  document.getElementById('stat-anuladas').textContent  = c.anuladas

  document.getElementById('stat-card-pagadas').classList.toggle('gm-stat--cero', c.pagadas === 0)
  document.getElementById('stat-card-por-pagar').classList.toggle('gm-stat--cero', c.porPagar === 0)
  document.getElementById('stat-card-cuenta').classList.toggle('gm-stat--cero', c.cuenta === 0)
  document.getElementById('stat-card-anuladas').classList.toggle('gm-stat--cero', c.anuladas === 0)
}

function renderVacio(fecha) {
  const d = new Date(fecha + 'T00:00:00')
  const human = d.toLocaleDateString('es-PE', { day: 'numeric', month: 'long' })
  return `
    <div class="gm-empty">
      <div class="gm-empty__icon">${icon('clock')}</div>
      <p class="gm-empty__text">No hay citas registradas para el <b>${human}</b>.</p>
      <button class="btn-primario" id="btn-vacio-nueva" style="margin-top:10px;">${icon('plus')} Crear cita para este día</button>
    </div>`
}

// ── Columnas ──────────────────────────────────────────────────────────────────

function buildColumns(cargo) {
  return [
    {
      label: 'Hora',
      align: 'center',
      render: c => `<span class="cita-hora">${formatearHora(c.horario)}</span>`,
    },
    {
      label: 'Paciente',
      render: c => `
        <div class="pac-cell">
          <div class="gm-avatar gm-avatar--ocre">${iniciales(c.paciente)}</div>
          <div class="pac-cell__info">
            <span class="pac-cell__name">${escapeHtml(c.paciente)}</span>
            <span class="pac-cell__meta">${escapeHtml(c.motivo ?? 'Sin motivo')}</span>
          </div>
        </div>`,
    },
    {
      key: 'telefono',
      label: 'Teléfono',
      align: 'center',
      render: c => c.telefono
        ? `<a href="tel:${c.telefono}" class="link-tel">${c.telefono}</a>`
        : '<span class="muted">—</span>',
    },
    {
      label: 'Estado',
      align: 'center',
      render: c => renderEstadoCelda(c),
    },
    {
      label: 'Acciones',
      align: 'right',
      render: c => renderAccionesCelda(c, cargo),
    },
  ]
}

function renderEstadoCelda(c) {
  if (c.estado === 'ANULADO') {
    return `<span class="badge badge-rojo">Anulada</span>`
  }
  if (c.atencion_estado === 'FINALIZADO') {
    return `<span class="badge badge-verde">Atendida</span>`
  }
  if (c.atencion_estado === 'EN PROGR' || c.atencion_estado === 'INICIADO') {
    return `<span class="badge badge-azul">En atención</span>`
  }
  if (c.estado === 'POR PAGAR') {
    return `<button class="badge badge-rojo cita-badge-link" data-action="pagar">Por pagar</button>`
  }
  if (c.estado === 'A CUENTA') {
    return `<button class="badge badge-ambar cita-badge-link" data-action="pagar">A cuenta</button>`
  }
  if (c.estado === 'PAGADO') {
    return `<span class="badge badge-verde">Pagada</span>`
  }
  return `<span class="badge badge-gris">${escapeHtml(c.estado ?? '—')}</span>`
}

function renderAccionesCelda(c, cargo) {
  const finalizada = c.atencion_estado === 'FINALIZADO'
  const anulada    = c.estado === 'ANULADO'

  if (anulada || finalizada) {
    if (c.estado === 'PAGADO' || c.estado === 'A CUENTA') {
      return `<div class="pac-actions">${iconBtn('print', 'ticket', 'Imprimir ticket', 'icon-info')}</div>`
    }
    return `<span class="muted">—</span>`
  }

  const ticketBtn = (c.estado === 'A CUENTA' || c.estado === 'PAGADO')
    ? iconBtn('print', 'ticket', 'Imprimir ticket', 'icon-info')
    : ''
  const editarBtn = iconBtn('sliders', 'editar', 'Editar cita', 'icon-edit')
  const anularBtn = cargo === 1
    ? iconBtn('cancel', 'anular', 'Anular cita', 'icon-danger')
    : ''

  return `<div class="pac-actions">${ticketBtn}${editarBtn}${anularBtn}</div>`
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatearHora(h) {
  if (!h) return '—'
  return h.slice(0, 5)
}

function iniciales(nombreCompleto = '') {
  const partes = nombreCompleto.trim().split(/\s+/)
  const a = partes[0]?.[0] ?? ''
  const b = partes[1]?.[0] ?? ''
  return (a + b).toUpperCase() || '·'
}

function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]))
}

// ── Eventos ───────────────────────────────────────────────────────────────────

function bindEventos() {
  const el = content()

  el.querySelector('#fecha-citas')?.addEventListener('change', cargarCitas)
  el.querySelector('#btn-fecha-prev')?.addEventListener('click', () => cambiarFecha(-1))
  el.querySelector('#btn-fecha-next')?.addEventListener('click', () => cambiarFecha(+1))
  el.querySelector('#btn-fecha-hoy')?.addEventListener('click', () => {
    document.getElementById('fecha-citas').value = new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0]
    cargarCitas()
  })

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

function cambiarFecha(dias) {
  const input = document.getElementById('fecha-citas')
  if (!input) return
  const d = new Date(input.value + 'T00:00:00')
  d.setDate(d.getDate() + dias)
  input.value = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().split('T')[0]
  cargarCitas()
}

// ── CRUD ──────────────────────────────────────────────────────────────────────

export async function editarCita(idcita, onSaved = null) {
  try {
    const res = await api.get(`/api/citas/${idcita}`)
    abrirFormCita(res.data, null, onSaved)
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

export async function abrirFormCita(cita = null, fechaDefecto = null, onSaved = null) {
  if (PROCEDIMIENTOS.length === 0) {
    const res = await api.get('/api/procedimientos')
    PROCEDIMIENTOS = res.data
  }

  const isEdit = cita !== null
  const hoy    = fechaDefecto || new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0]

  const optsProc = PROCEDIMIENTOS.map(p =>
    `<option value="${p.idtipoatencion}" data-precio="${p.precio}"
      ${cita?.idtipoatencion == p.idtipoatencion ? 'selected' : ''}>${p.nombre}</option>`
  ).join('')

  const html = `
    <h2 class="modal-title">${isEdit ? 'Editar cita' : 'Nueva cita'}</h2>
    <form id="form-cita" novalidate>

      <section class="cita-form-section">
        <h3 class="cita-form-section__title">Paciente</h3>

        ${!isEdit ? `
        <div class="cont-group" id="wrap-buscador" style="margin-bottom:12px;">
          <div class="cont-control" style="grid-column: 1 / -1;">
            <label>Buscar Paciente (DNI o Nombres)</label>
            <div style="position:relative;">
              <input type="text" id="input-buscar-pac" autocomplete="off" placeholder="Ej. 12345678 o Juan Perez..." />
              <div id="dd-buscar-pac" class="gm-autocomplete" style="display:none; position:absolute; top:calc(100% + 4px); left:0; right:0; background:var(--superficie); border:1px solid var(--borde-medio); border-radius:8px; max-height:240px; overflow-y:auto; z-index:100; box-shadow:0 10px 25px rgba(0,0,0,0.1);"></div>
            </div>
          </div>
        </div>` : ''}

        <div class="cont-group" id="wrap-datos-paciente" ${!isEdit ? 'style="display:none;"' : ''}>
          ${isEdit ? `
          <div class="cont-control" style="grid-column: 1 / -1;">
            <label>Paciente Seleccionado</label>
            <div style="background: var(--superficie-2); border: 1px solid var(--borde-sutil); border-radius: 8px; padding: 12px 16px; margin-top: 4px;">
              <div style="font-weight: 600; color: var(--texto-primario); font-size: 15px; margin-bottom: 6px;">
                ${cita?.apellidospaciente ?? ''}, ${cita?.nombrepaciente ?? ''}
              </div>
              <div style="display: flex; flex-wrap: wrap; gap: 16px; color: var(--texto-secundario); font-size: 13px;">
                <span><strong style="color:var(--texto-primario); font-weight:600;">DNI:</strong> ${cita?.dni ?? ''}</span>
                <span><strong style="color:var(--texto-primario); font-weight:600;">Edad:</strong> ${cita?.edad ?? '-'} años</span>
                <span><strong style="color:var(--texto-primario); font-weight:600;">Teléfono:</strong> ${cita?.telefono ?? '-'}</span>
              </div>
            </div>
            <input type="hidden" name="dni" value="${cita?.dni ?? ''}" />
            <input type="hidden" name="nombre" value="${cita?.nombrepaciente ?? ''}" />
            <input type="hidden" name="apellidos" value="${cita?.apellidospaciente ?? ''}" />
          </div>
          ` : `
          <div class="cont-control" id="ctrl-dni-paciente">
            <label>DNI del Paciente</label>
            <div class="cont-busqueda">
               <input type="text" name="dni" value="" required maxlength="8" autocomplete="off" placeholder="Ingrese DNI" />
               <button type="button" id="btn-buscar-dni-cita" title="Buscar DNI">${icon('search')}</button>
             </div>
          </div>
          <div class="cont-control">
            <label>Nombre</label>
            <input type="text" name="nombre" value="" readonly />
          </div>
          <div class="cont-control">
            <label>Apellidos</label>
            <input type="text" name="apellidos" value="" readonly />
          </div>
          <div class="cont-control">
            <label>Teléfono</label>
            <input type="text" name="telefono" value="" readonly />
          </div>
          <div class="cont-control">
            <label>Fecha de Nacimiento</label>
            <input type="date" name="fecha_nac" value="" />
          </div>
          `}
        </div>

        ${!isEdit ? `
        <div id="reniec-not-found-hint" hidden style="margin-bottom:12px;">
          <div class="cita-fecha-nac-hint">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;margin-top:1px"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            <span>Paciente no encontrado en RENIEC. Complete los datos manualmente.</span>
          </div>
        </div>` : ''}
      </section>

      <section class="cita-form-section">
        <h3 class="cita-form-section__title">Cita</h3>

        <div class="cont-group">
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
        </div>
      </section>

      <div class="form-pac__actions">
        <button type="button" class="btn-secundario btn-cancelar" id="btn-cancel-cita">Cancelar</button>
        <button type="submit" class="btn-primario">${isEdit ? 'Actualizar' : 'Registrar'}</button>
      </div>
    </form>`

  openModal(html)

  document.getElementById('sel-proc')?.addEventListener('change', (e) => {
    const opt = e.target.selectedOptions[0]
    document.querySelector('[name="precio"]').value = opt?.dataset.precio ?? ''
  })

  if (!isEdit) {
    const inputDni  = document.querySelector('[name="dni"]')
    const btnBuscar = document.getElementById('btn-buscar-dni-cita')
    const wrapDatos = document.getElementById('wrap-datos-paciente')
    const inputBuscar = document.getElementById('input-buscar-pac')
    const ddBuscar = document.getElementById('dd-buscar-pac')
    const hintReniec = document.getElementById('reniec-not-found-hint')

    const mostrarHintReniec = () => {
      if (hintReniec && hintReniec.hidden) {
        hintReniec.hidden = false
        hintReniec.classList.add('field-reveal')
      }
    }

    const ocultarHintReniec = () => {
      if (hintReniec) hintReniec.hidden = true
    }

    const habilitarCampos = (...names) => {
      names.forEach(n => {
        const el = document.querySelector(`[name="${n}"]`)
        if (el) el.removeAttribute('readonly')
      })
    }

    const setCampos = (dni, nombre, apell, tel, fnac = '') => {
      inputDni.value = dni
      document.querySelector('[name="nombre"]').value = nombre
      document.querySelector('[name="apellidos"]').value = apell
      document.querySelector('[name="telefono"]').value = tel
      const elFnac = document.querySelector('[name="fecha_nac"]')
      if (elFnac) elFnac.value = fnac
    }

    const setReadonly = (readonly) => {
      ['nombre', 'apellidos', 'telefono', 'fecha_nac'].forEach(n => {
        const el = document.querySelector(`[name="${n}"]`)
        if (el) {
          if (readonly) el.setAttribute('readonly', 'true')
          else el.removeAttribute('readonly')
        }
      })
      if (readonly) inputDni.setAttribute('readonly', 'true')
      else inputDni.removeAttribute('readonly')
      
      if (btnBuscar) {
        btnBuscar.style.display = readonly ? 'none' : ''
      }
    }

    // ── Autocompletado ──
    let timeoutId
    inputBuscar?.addEventListener('input', (e) => {
      clearTimeout(timeoutId)
      const val = e.target.value.trim()
      if (val.length < 2) {
        ddBuscar.style.display = 'none'
        return
      }
      timeoutId = setTimeout(async () => {
        try {
          const res = await api.get('/api/pacientes', { q: val })
          const pacientes = Array.isArray(res.data) ? res.data : []
          
          let html = pacientes.map(p => `
            <div class="gm-autocomplete-item" data-dni="${p.dni}" data-nombre="${escapeHtml(p.nombre)}" data-apellidos="${escapeHtml(p.apellidos)}" data-tel="${escapeHtml(p.telefono)}" data-fnac="${p.fecha_nac ?? ''}">
              <div style="font-weight:600; color:var(--texto-primario); font-size:14px;">${escapeHtml(p.apellidos)}, ${escapeHtml(p.nombre)}</div>
              <div style="font-size:12px; color:var(--texto-terciario); font-variant-numeric:tabular-nums;">DNI: ${p.dni}</div>
            </div>
          `).join('')
          
          if (pacientes.length === 0) {
            html = `<div style="padding:12px 16px; font-size:13px; color:var(--texto-terciario); text-align:center;">No se encontraron coincidencias.</div>`
          }
          
          html += `
            <div class="gm-autocomplete-action" id="btn-registrar-nuevo-pac" style="padding:12px 16px; border-top:1px solid var(--borde-sutil); cursor:pointer; color:var(--azul); font-weight:600; text-align:center; transition:background 0.2s;">
              + Registrar nuevo paciente
            </div>
          `
          ddBuscar.innerHTML = html
          ddBuscar.style.display = 'block'
          
          // Eventos de selección
          ddBuscar.querySelectorAll('.gm-autocomplete-item').forEach(item => {
            item.addEventListener('click', () => {
              setCampos(item.dataset.dni, item.dataset.nombre, item.dataset.apellidos, item.dataset.tel, item.dataset.fnac)
              setReadonly(true)
              ocultarHintReniec()
              wrapDatos.style.display = ''
              ddBuscar.style.display = 'none'
              inputBuscar.value = item.dataset.dni + ' - ' + item.dataset.nombre
            })
          })
          
          document.getElementById('btn-registrar-nuevo-pac').addEventListener('click', () => {
            setCampos('', '', '', '', '')
            setReadonly(false)
            ocultarHintReniec()
            inputDni.value = val.replace(/\D/g, '').slice(0, 8) // intentar poner lo que escribió si son números
            wrapDatos.style.display = ''
            ddBuscar.style.display = 'none'
            inputBuscar.value = ''
            inputDni.focus()
          })
          
        } catch (e) {
          ddBuscar.style.display = 'none'
        }
      }, 300)
    })
    
    // Cerrar dropdown al hacer click fuera
    document.addEventListener('click', (e) => {
      if (ddBuscar && !ddBuscar.contains(e.target) && e.target !== inputBuscar) {
        ddBuscar.style.display = 'none'
      }
    })

    // ── Original RENIEC / DB fallback ──
    const buscarDni = async () => {
      const dni = inputDni.value.trim()
      if (dni.length !== 8) return

      ocultarHintReniec()

      // 1. Buscar en BD local → paciente ya registrado
      try {
        const res  = await api.get(`/api/pacientes/${dni}`)
        const data = res.data ?? {}
        if (data.nombre) {
          document.querySelector('[name="nombre"]').value    = data.nombre    ?? ''
          document.querySelector('[name="apellidos"]').value = data.apellidos ?? ''
          document.querySelector('[name="telefono"]').value  = data.telefono  ?? ''
          const elFnac = document.querySelector('[name="fecha_nac"]')
          if (elFnac) elFnac.value = data.fecha_nac ?? ''
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
          habilitarCampos('telefono', 'fecha_nac')
          return
        }
      } catch { /* no encontrado en RENIEC */ }

      // 3. No encontrado en ninguna fuente → menor de edad, habilitar todo
      habilitarCampos('nombre', 'apellidos', 'telefono', 'fecha_nac')
      mostrarHintReniec()
    }

    if (btnBuscar) btnBuscar.addEventListener('click', buscarDni)
    inputDni.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); buscarDni() } })
  }

  document.getElementById('btn-cancel-cita').addEventListener('click', closeModal)

  document.getElementById('form-cita').addEventListener('submit', async (e) => {
    e.preventDefault()
    const btn = e.submitter || e.target.querySelector('button[type="submit"]')
    if (btn) btn.classList.add('btn-loading')
    const body = Object.fromEntries(new FormData(e.target).entries())
    try {
      if (isEdit) {
        await api.put(`/api/citas/${cita.idcita}`, body)
        toastOk('Cita actualizada.')
        closeModal()
        if (typeof onSaved === 'function') await onSaved()
        else cargarCitas()
      } else {
        const res    = await api.post('/api/citas', body)
        const idcita = res.data?.idcita ?? res.idcita
        toastOk('Cita registrada.')
        closeModal()
        if (typeof onSaved === 'function') await onSaved()
        else cargarCitas()
        await confirmarYPagar(idcita)
      }
    } catch (err) { toastError(err.message) }
    finally { if (btn) btn.classList.remove('btn-loading') }
  })
}

// ── Caja ──────────────────────────────────────────────────────────────────────

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
      const btn = e.submitter || e.target.querySelector('button[type="submit"]')
      if (btn) btn.classList.add('btn-loading')
      const body = Object.fromEntries(new FormData(e.target).entries())
      try {
        await api.post('/api/caja/aperturar', body)
        toastOk('Caja aperturada.')
        closeModal()
        resolve(true)
      } catch (err) {
        toastError(err.message)
        resolve(false)
      } finally {
        if (btn) btn.classList.remove('btn-loading')
      }
    })
  })
}

// ── Pago ──────────────────────────────────────────────────────────────────────

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
    <div style="display:flex; gap:12px; margin-bottom:20px; background:var(--superficie-2); padding:14px; border-radius:var(--radius); border:1px solid var(--borde-sutil);">
      <div style="flex:1;">
        <div style="font-size:11px; color:var(--texto-terciario); text-transform:uppercase; letter-spacing:0.5px; margin-bottom:4px; font-weight:600;">Total</div>
        <div style="font-weight:600; font-size:17px; color:var(--texto-primario); font-variant-numeric:tabular-nums;">S/ ${precioTotal.toFixed(2)}</div>
      </div>
      <div style="flex:1;">
        <div style="font-size:11px; color:var(--texto-terciario); text-transform:uppercase; letter-spacing:0.5px; margin-bottom:4px; font-weight:600;">Pagado</div>
        <div style="font-weight:600; font-size:17px; color:var(--ambar); font-variant-numeric:tabular-nums;">S/ ${montoCuenta.toFixed(2)}</div>
      </div>
      <div style="flex:1;">
        <div style="font-size:11px; color:var(--texto-terciario); text-transform:uppercase; letter-spacing:0.5px; margin-bottom:4px; font-weight:600;">Saldo pendiente</div>
        <div style="font-weight:700; font-size:17px; color:var(--rojo); font-variant-numeric:tabular-nums;">S/ ${saldo.toFixed(2)}</div>
      </div>
    </div>
    <form id="form-pago" novalidate>
      <input type="hidden" name="monto_total" value="${precioTotal}" />
      <div class="cont-group">
        <div class="cont-control" style="flex:2;">
          <label>Tipo de Pago</label>
          <select name="idtipopago">${optsTP}</select>
        </div>
        <div class="cont-control" style="flex:1;">
          <label>Monto a Pagar</label>
          <input type="number" name="monto_pagado" value="${saldo.toFixed(2)}" step="0.01" min="0" required />
        </div>
      </div>
      <div style="display:flex;gap:8px;margin-top:16px;">
        <button type="submit" class="btn-primario">Registrar Pago</button>
        <button type="button" class="btn-secundario btn-cancelar" id="btn-cancel-pago">Cancelar</button>
      </div>
    </form>`

  openModal(html)
  document.getElementById('btn-cancel-pago').addEventListener('click', closeModal)

  document.getElementById('form-pago').addEventListener('submit', async (e) => {
    e.preventDefault()
    const btn = e.submitter || e.target.querySelector('button[type="submit"]')
    if (btn) btn.classList.add('btn-loading')
    const body = { ...Object.fromEntries(new FormData(e.target).entries()), idcita, motivo: cita.motivo }
    try {
      const res = await api.post('/api/caja/pago', body)
      toastOk('Pago registrado.')
      closeModal()
      cargarCitas()
      abrirTicket(res.idcita)
    } catch (err) { toastError(err.message) }
    finally { if (btn) btn.classList.remove('btn-loading') }
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
      const res  = await api.get('/api/citas/buscar', { dni })
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
        rows:     data,
        emptyMsg: 'No se encontraron citas para este DNI.',
      }))
    } catch (err) { wrap.innerHTML = `<div class="state-error">${err.message}</div>` }
  }

  document.getElementById('btn-exec-buscar').addEventListener('click', ejecutar)
  document.getElementById('q-buscar-cita').addEventListener('keydown', e => { if (e.key === 'Enter') ejecutar() })
}

// ── Ticket ────────────────────────────────────────────────────────────────────

function abrirTicket(idcita) {
  const w = 800, h = 700
  const x = Math.round(screen.width  / 2 - w / 2)
  const y = Math.round(screen.height / 2 - h / 2)
  window.open(`/pdf/ticket/${idcita}`, '_ticket',
    `left=${x},top=${y},width=${w},height=${h},scrollbars=yes,menubar=no`)
}

function estadoBadge(estado) {
  const mapa = {
    'PAGADO':     'badge-verde',
    'A CUENTA':   'badge-ambar',
    'POR PAGAR':  'badge-rojo',
    'ANULADO':    'badge-rojo',
    'FINALIZADO': 'badge-verde',
    'INICIADO':   'badge-azul',
    'EN PROGR':   'badge-azul',
  }
  return `<span class="badge ${mapa[estado] ?? 'badge-gris'}">${estado}</span>`
}
