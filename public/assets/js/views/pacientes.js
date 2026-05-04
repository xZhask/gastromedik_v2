/**
 * views/pacientes.js — Listado, CRUD, historial e imágenes/PDFs de pacientes.
 *
 * Mejoras UX/UI:
 *  · Cabecera estándar con búsqueda debounced y contador.
 *  · Skeleton de tabla durante la carga.
 *  · Estado vacío informativo (sin resultados / sin pacientes registrados).
 *  · Tabla con avatar de iniciales y acciones agrupadas.
 *  · Form de paciente con feedback de RENIEC integrado.
 *  · Historial estilo ficha clínica con secciones SOAP.
 */

import { api }                       from '../utils/api.js'
import { toastOk, toastError }       from '../utils/toast.js'
import { icon, iconBtn }             from '../utils/icons.js'
import { openModal, closeModal }     from '../components/modal.js'
import { confirm }                   from '../components/confirm.js'
import { renderTable, wrapTable }    from '../components/table.js'
import { pageHeader }                from '../components/pageHeader.js'
import { skeletonTable }             from '../components/skeleton.js'

const content = () => document.getElementById('app-content')
const CARGO   = parseInt(document.querySelector('meta[name="user-cargo"]')?.content ?? '0')

let _searchTimer = null
let _ultimaBusqueda = ''   // para mostrar el término en el empty state

// ── Punto de entrada ──────────────────────────────────────────────────────────

export async function PacientesView() {
  content().innerHTML = `
    ${pageHeader({
      title: 'Pacientes',
      subtitle: '',                 // se llena después con el contador real
      search: { id: 'q-paciente', placeholder: 'Buscar por nombre o DNI…' },
      actions: [1,4].includes(CARGO)
        ? `<button class="btn-primario" id="btn-nuevo-pac" type="button">${icon('plus')} Nuevo Paciente</button>`
        : '',
    })}
    <div id="tabla-pac-wrap"></div>`

  await cargarPacientes()
  bindEventos()
}

// ── Carga ─────────────────────────────────────────────────────────────────────

async function cargarPacientes() {
  const wrap = document.getElementById('tabla-pac-wrap')
  if (!wrap) return
  wrap.innerHTML = skeletonTable(6, 7)

  try {
    const q = document.getElementById('q-paciente')?.value.trim() ?? ''
    _ultimaBusqueda = q
    const { data } = await api.get('/api/pacientes', q ? { q } : {})

    actualizarContador(data.length, q)

    if (!data.length) {
      wrap.innerHTML = renderVacio(q)
      return
    }

    wrap.innerHTML = wrapTable(renderTable({
      columns: buildColumns(),
      rows:    data.map(p => ({ ...p, _id: p.dni })),
      emptyMsg: 'No se encontraron pacientes.',
    }))
  } catch (err) {
    wrap.innerHTML = `<div class="state-error">${err.message}</div>`
  }
}

function actualizarContador(total, q) {
  const sub = document.querySelector('.gm-page-header__sub')
  if (!sub) return
  if (q) {
    sub.textContent = total === 1
      ? `1 resultado para "${q}"`
      : `${total} resultados para "${q}"`
  } else {
    sub.textContent = total === 1 ? '1 paciente registrado' : `${total} pacientes registrados`
  }
}

function renderVacio(q) {
  if (q) {
    return `
      <div class="gm-empty">
        <div class="gm-empty__icon">${icon('search')}</div>
        <p class="gm-empty__text">
          No encontramos pacientes con <b>"${escapeHtml(q)}"</b>.<br/>
          Verifica el nombre o el DNI, o registra un paciente nuevo.
        </p>
      </div>`
  }
  return `
    <div class="gm-empty">
      <div class="gm-empty__icon">${icon('patient')}</div>
      <p class="gm-empty__text">Aún no hay pacientes registrados. Crea el primero con el botón "Nuevo Paciente".</p>
    </div>`
}

// ── Columnas ──────────────────────────────────────────────────────────────────

function buildColumns() {
  const cols = [
    {
      label: 'Paciente',
      render: r => `
        <div class="pac-cell">
          <div class="gm-avatar">${iniciales(r.nombre, r.apellidos)}</div>
          <div class="pac-cell__info">
            <span class="pac-cell__name">${escapeHtml(r.apellidos)}, ${escapeHtml(r.nombre)}</span>
            <span class="pac-cell__meta">DNI ${escapeHtml(r.dni)} · ${r.edad} años</span>
          </div>
        </div>`,
    },
    {
      key: 'telefono',
      label: 'Teléfono',
      align: 'center',
      render: r => r.telefono
        ? `<a href="tel:${r.telefono}" class="link-tel">${r.telefono}</a>`
        : '<span class="muted">—</span>',
    },
    {
      label: 'Acciones',
      align: 'right',
      render: r => `
        <div class="pac-actions">
          ${[1,2,4].includes(CARGO) ? iconBtn('history','historial','Ver historial','icon-info') : ''}
          ${iconBtn('image','imagenes','Ver imágenes','icon-ocre')}
          ${iconBtn('pdf','pdfs','Ver PDFs','icon-ocre')}
          ${[1,4].includes(CARGO) ? iconBtn('edit','editar','Editar','icon-edit') : ''}
          ${[1,4].includes(CARGO) ? iconBtn('trash','eliminar','Eliminar','icon-danger') : ''}
        </div>`,
    },
  ]
  return cols
}

function iniciales(nombre = '', apellidos = '') {
  const n = (nombre || '').trim().split(/\s+/)[0]?.[0] ?? ''
  const a = (apellidos || '').trim().split(/\s+/)[0]?.[0] ?? ''
  return (n + a).toUpperCase() || '·'
}

function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, c => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  }[c]))
}

// ── Eventos ───────────────────────────────────────────────────────────────────

function bindEventos() {
  const el = content()

  // Búsqueda con debounce — sin botón explícito
  const inputBuscar = el.querySelector('#q-paciente')
  inputBuscar?.addEventListener('input', () => {
    clearTimeout(_searchTimer)
    _searchTimer = setTimeout(cargarPacientes, 350)
  })
  inputBuscar?.addEventListener('keydown', e => {
    if (e.key === 'Enter') { clearTimeout(_searchTimer); cargarPacientes() }
  })

  el.querySelector('#btn-nuevo-pac')?.addEventListener('click', () => abrirFormPaciente(null))

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
    } catch (err) { toastError(err.message) }
  })
}

// ── CRUD ──────────────────────────────────────────────────────────────────────

async function editarPaciente(dni) {
  try {
    const { data } = await api.get(`/api/pacientes/${dni}`)
    abrirFormPaciente(data)
  } catch (err) { toastError(err.message) }
}

async function eliminarPaciente(dni, tr) {
  const ok = await confirm({
    title: 'Eliminar paciente',
    text:  '¿Está seguro? Se eliminará el paciente y todo su historial. Esta acción no se puede revertir.',
    confirmLabel: 'Sí, eliminar',
    danger: true,
  })
  if (!ok) return
  try {
    await api.delete(`/api/pacientes/${dni}`)
    toastOk('Paciente eliminado.')
    tr.remove()
  } catch (err) { toastError(err.message) }
}

// ── Formulario ────────────────────────────────────────────────────────────────

async function buscarDniPaciente(dni) {
  if (dni.length !== 8) return
  const card = document.getElementById('form-pac-card')
  card?.classList.add('form-busy')

  try {
    // 1. BD local
    try {
      const res  = await api.get(`/api/pacientes/${dni}`)
      const data = res.data ?? {}
      if (data.nombre) {
        document.querySelector('[name="nombre"]').value    = data.nombre    ?? ''
        document.querySelector('[name="apellidos"]').value = data.apellidos ?? ''
        document.querySelector('[name="telefono"]').value  = data.telefono  ?? ''
        document.querySelector('[name="fecha_nac"]').value = data.fecha_nac ?? ''
        actualizarAvatarForm()
        toastOk('Paciente encontrado en base de datos.')
        return
      }
    } catch { /* 404 → seguir */ }

    // 2. RENIEC
    try {
      const res = await api.get(`/api/personal/consulta-dni/${dni}`)
      const d   = res.data ?? {}
      if (d.nombres) {
        document.querySelector('[name="nombre"]').value    = d.nombres ?? ''
        document.querySelector('[name="apellidos"]').value = `${d.apellido_paterno ?? ''} ${d.apellido_materno ?? ''}`.trim()
        actualizarAvatarForm()
        toastOk('Datos obtenidos de RENIEC.')
      }
    } catch { /* no encontrado */ }
  } finally {
    card?.classList.remove('form-busy')
  }
}

function abrirFormPaciente(pac) {
  const isEdit = pac !== null
  const html = `
    <div id="form-pac-card" class="form-pac">
      <div class="form-pac__avatar-wrap">
        <div class="gm-avatar gm-avatar--lg" id="form-pac-avatar">${isEdit ? iniciales(pac.nombre, pac.apellidos) : '·'}</div>
        <div>
          <h2 class="modal-title" style="border:none;margin:0;padding:0;">${isEdit ? 'Editar paciente' : 'Nuevo paciente'}</h2>
          <p class="muted" style="font-size:.82rem;margin-top:2px;">${isEdit ? `DNI ${pac.dni}` : 'Complete los datos del paciente'}</p>
        </div>
      </div>

      <form id="form-paciente" novalidate>
        <div class="cont-group">
          <div class="cont-control">
            <label>DNI / Documento</label>
            ${isEdit
              ? `<input type="text" name="dni" value="${pac?.dni ?? ''}" readonly maxlength="8" required />`
              : `<div class="input-with-action">
                   <input type="text" name="dni" value="" maxlength="8" required autocomplete="off" placeholder="8 dígitos" />
                   <button type="button" id="btn-buscar-dni" class="btn-action" title="Consultar RENIEC">${icon('search')}</button>
                 </div>
                 <span class="form-hint">Consultaremos automáticamente RENIEC al buscar.</span>`
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
            <label>Teléfono</label>
            <input type="text" name="telefono" value="${pac?.telefono ?? ''}" placeholder="9 dígitos" />
          </div>
        </div>

        <div class="form-pac__actions">
          <button type="button" class="btn-secundario btn-cancelar" id="btn-cancel-pac">Cancelar</button>
          <button type="submit" class="btn-primario" id="btn-guardar-pac">${isEdit ? 'Actualizar paciente' : 'Registrar paciente'}</button>
        </div>
      </form>

      <div class="form-busy-overlay">
        <div class="spinner"></div>
        <p>Consultando RENIEC...</p>
      </div>
    </div>`

  openModal(html)

  // Avatar dinámico al escribir nombre/apellidos
  ;['nombre','apellidos'].forEach(name => {
    document.querySelector(`[name="${name}"]`)?.addEventListener('input', actualizarAvatarForm)
  })

  if (!isEdit) {
    const inputDni  = document.querySelector('[name="dni"]')
    const btnBuscar = document.getElementById('btn-buscar-dni')
    const ejecutar  = () => buscarDniPaciente(inputDni.value.trim())
    btnBuscar.addEventListener('click', ejecutar)
    inputDni.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); ejecutar() } })
    inputDni.addEventListener('blur', ejecutar)   // también busca al perder foco
  }

  document.getElementById('btn-cancel-pac').addEventListener('click', closeModal)

  document.getElementById('form-paciente').addEventListener('submit', async (e) => {
    e.preventDefault()
    const btn  = document.getElementById('btn-guardar-pac')
    btn.disabled = true
    const body = Object.fromEntries(new FormData(e.target).entries())
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
      btn.disabled = false
    }
  })
}

function actualizarAvatarForm() {
  const nom = document.querySelector('[name="nombre"]')?.value ?? ''
  const ape = document.querySelector('[name="apellidos"]')?.value ?? ''
  const av  = document.getElementById('form-pac-avatar')
  if (av) av.textContent = iniciales(nom, ape)
}

// ── Historial ─────────────────────────────────────────────────────────────────

async function abrirHistorial(dni) {
  openModal(`<div class="state-loading"><div class="spinner"></div></div>`, { wide: true })

  try {
    const [{ data: paciente }, { data: atenciones }, { data: examenes }] = await Promise.all([
      api.get(`/api/pacientes/${dni}`),
      api.get('/api/atenciones/paciente', { dni }),
      api.get('/api/examenes', { dni }),
    ])

    const liAtenciones = atenciones.length
      ? atenciones.map(a => `
          <li>
            <button class="hist-item" data-type="${a.tipo}" data-id="${a.idatencion}">
              <span class="hist-item__date">${a.fecha}</span>
              <span class="hist-item__title">${escapeHtml(a.nombre)}</span>
            </button>
          </li>`).join('')
      : '<li class="hist-empty">Sin atenciones registradas.</li>'

    const liExamenes = examenes.length
      ? examenes.map(ex => `
          <li>
            <button class="hist-item" data-type="${ex.tipo.toLowerCase()}" data-id="${ex.idexamen}">
              <span class="hist-item__date">${ex.fecha}</span>
              <span class="hist-item__title">${escapeHtml(ex.nombre)} <span class="badge badge-gris" style="margin-left:6px;">${ex.tipo}</span></span>
            </button>
          </li>`).join('')
      : '<li class="hist-empty">Sin exámenes registrados.</li>'

    const html = `
      <div class="hist-head">
        <div class="gm-avatar gm-avatar--lg">${iniciales(paciente.nombre, paciente.apellidos)}</div>
        <div>
          <h2 class="hist-head__name">${escapeHtml(paciente.apellidos)}, ${escapeHtml(paciente.nombre)}</h2>
          <p class="hist-head__meta">DNI ${escapeHtml(paciente.dni)} · ${paciente.edad ?? '—'} años · Nac. ${paciente.fecha_nac ?? '—'}</p>
        </div>
      </div>

      <div class="historial-layout">
        <aside class="historial-aside">
          <h4>Consultas</h4>
          <ul class="hist-list">${liAtenciones}</ul>
          <h4 style="margin-top:18px">Exámenes</h4>
          <ul class="hist-list">${liExamenes}</ul>
        </aside>
        <div class="historial-panel" id="historial-panel">
          <div class="gm-empty">
            <div class="gm-empty__icon">${icon('history')}</div>
            <p class="gm-empty__text">Selecciona un registro de la lista para ver su detalle.</p>
          </div>
        </div>
      </div>`

    openModal(html, { wide: true })

    document.getElementById('modal-content').addEventListener('click', async (e) => {
      // Eliminar examen
      const delBtn = e.target.closest('[data-action="del-examen"]')
      if (delBtn) {
        const idExamen = parseInt(delBtn.dataset.id ?? '0')
        if (!idExamen) return
        const ok = await confirm({
          title: 'Eliminar examen',
          text: 'Esta acción no se puede revertir.',
          confirmLabel: 'Sí, eliminar',
          danger: true,
        })
        if (!ok) return
        try {
          await api.delete(`/api/examenes/${idExamen}`)
          toastOk('Examen eliminado.')
          await abrirHistorial(dni)
        } catch (err) { toastError(err.message) }
        return
      }

      // Cargar detalle
      const btn = e.target.closest('[data-type]')
      if (!btn) return
      const panel = document.getElementById('historial-panel')
      panel.innerHTML = `<div class="state-loading"><div class="spinner"></div></div>`

      try {
        if (btn.dataset.type === 'consulta') {
          const { data: a } = await api.get(`/api/atenciones/${btn.dataset.id}`)
          panel.innerHTML = renderConsultaSOAP(a)
        } else if (btn.dataset.type === 'img') {
          const { data } = await api.get(`/api/examenes/${btn.dataset.id}/imagenes`)
          panel.innerHTML = data.length
            ? `<div class="examen-imgs-grid">${data.map(d => `<div class="examen-img"><img src="${d.archivo}" alt="" loading="lazy" /></div>`).join('')}</div>`
            : '<p class="muted">No hay imágenes asociadas.</p>'
        } else if (btn.dataset.type === 'pdf') {
          const { data } = await api.get(`/api/examenes/${btn.dataset.id}`)
          panel.innerHTML = `
            <div class="examen-pdf-actions">
              <button class="btn-peligro" data-action="del-examen" data-id="${btn.dataset.id}" type="button">Eliminar examen</button>
            </div>
            <iframe src="${data[0]?.archivo ?? ''}" class="examen-pdf-frame"></iframe>`
        }
      } catch (err) {
        panel.innerHTML = `<div class="state-error">${err.message}</div>`
      }
    })
  } catch (err) {
    openModal(`<div class="state-error">${err.message}</div>`)
  }
}

function renderConsultaSOAP(a) {
  // Tarjetas de signos vitales
  const signos = [
    { label: 'FC',   value: a.fr,   unit: 'lpm' },
    { label: 'PA',   value: a.pa,   unit: 'mmHg' },
    { label: 'T°',   value: a.temp, unit: '°C' },
    { label: 'SO₂',  value: a.so2,  unit: '%' },
    { label: 'Peso', value: a.peso, unit: 'kg' },
  ].filter(s => s.value && s.value !== '-')

  const signosHtml = signos.length
    ? `<div class="signos-grid">
         ${signos.map(s => `
           <div class="signo-card">
             <div class="signo-card__label">${s.label}</div>
             <div class="signo-card__value">${escapeHtml(s.value)}<span class="signo-card__unit">${s.unit}</span></div>
           </div>`).join('')}
       </div>`
    : ''

  const seccion = (titulo, contenido) =>
    contenido && contenido !== '-' && contenido.trim()
      ? `<section class="soap-section">
           <h4>${titulo}</h4>
           <p>${escapeHtml(contenido).replace(/\n/g, '<br/>')}</p>
         </section>`
      : ''

  return `
    <div class="consulta-detalle">
      <header class="consulta-detalle__head">
        <span class="consulta-detalle__date">${a.fechaatencion ?? ''}</span>
        <a href="/pdf/receta/${a.idatencion}" target="_blank" class="btn-secundario btn-sm">${icon('pdf')} Ver receta</a>
      </header>

      ${signosHtml}

      ${seccion('Antecedente',        a.antecedente)}
      ${seccion('Motivo de consulta', a.motivoconsulta)}
      ${seccion('Anamnesis',          a.anamensis)}
      ${seccion('Examen físico',      a.exfisico)}
      ${seccion('Diagnóstico',        a.diagnostico)}
      ${seccion('Tratamiento',        a.tratamiento)}
    </div>`
}

// ── Imágenes ──────────────────────────────────────────────────────────────────

async function abrirSubirImagenes(dni) {
  const slots = Array.from({ length: 6 }, (_, i) => `
    <label class="img-slot" data-slot="${i + 1}" title="Imagen ${i + 1}">
      <input type="file" name="foto${i + 1}" accept="image/png,image/jpeg" style="display:none;" />
      <img class="img-preview" style="display:none;" alt="" />
      <span class="img-slot-label">+ Img ${i + 1}</span>
    </label>`).join('')

  const html = `
    <h2 class="modal-title">Cargar Imágenes</h2>
    <form id="form-imgs" novalidate>
      <div class="cont-control" style="margin-bottom:14px;">
        <label>Nombre del examen</label>
        <input type="text" name="nombreexamen" required placeholder="Ej: Radiografía de tórax" autocomplete="off" />
      </div>
      <div class="img-slots-grid">${slots}</div>
      <div style="display:flex;gap:8px;margin-top:16px;">
        <button type="submit" class="btn-primario">Subir imágenes</button>
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
        preview.src           = reader.result
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

// ── PDFs ──────────────────────────────────────────────────────────────────────

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
