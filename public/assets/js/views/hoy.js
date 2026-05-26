/**
 * views/hoy.js — Lista de atenciones del día (sala de espera).
 */

import { api }        from '../utils/api.js'
import { toastOk, toastError } from '../utils/toast.js'
import { icon, iconBtn } from '../utils/icons.js'
import { openModal, closeModal } from '../components/modal.js'
import { renderTable, wrapTable } from '../components/table.js'
import { skeletonTable } from '../components/skeleton.js'

const content = () => document.getElementById('app-content')
const CARGO   = parseInt(document.querySelector('meta[name="user-cargo"]')?.content ?? '0')

export async function HoyView() {
  content().innerHTML = `
    <div class="citas-header">
      <div class="citas-header__top">
        <div class="citas-header__title">
          <h1>Sala de espera</h1>
          <span class="gm-page-header__sub" id="hoy-fecha-label"></span>
        </div>
        <div class="citas-header__actions">
          <button class="btn-secundario" id="btn-refresh-hoy" type="button">${icon('search')} Actualizar</button>
        </div>
      </div>
      <div class="citas-stats" id="hoy-stats" hidden>
        <div class="gm-stat gm-stat--azul">
          <span class="gm-stat__label">En espera</span>
          <span class="gm-stat__value" id="hoy-stat-espera">0</span>
        </div>
        <div class="gm-stat gm-stat--ambar">
          <span class="gm-stat__label">En atención</span>
          <span class="gm-stat__value" id="hoy-stat-atendiendo">0</span>
        </div>
        <div class="gm-stat gm-stat--verde">
          <span class="gm-stat__label">Atendidas</span>
          <span class="gm-stat__value" id="hoy-stat-atendidas">0</span>
        </div>
      </div>
    </div>
    <div id="tabla-hoy-wrap"></div>`

  document.getElementById('hoy-fecha-label').textContent =
    new Date().toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

  await cargarHoy()
  content().querySelector('#btn-refresh-hoy').onclick = cargarHoy

  content().onclick = async (e) => {
    const btn = e.target.closest('[data-action]')
    if (!btn) return
    const tr         = btn.closest('tr')
    const idatencion = parseInt(tr?.dataset.id)
    if (!idatencion) return

    if (btn.dataset.action === 'signos')   await abrirSignos(idatencion)
    if (btn.dataset.action === 'atender')  await abrirAtencion(idatencion)
    if (btn.dataset.action === 'archivo')  await abrirSubirPdf(idatencion)
    if (btn.dataset.action === 'ticket') {
      const idcita = parseInt(tr?.dataset.idcita)
      if (idcita) abrirTicket(idcita)
    }
  }
}

async function cargarHoy() {
  const wrap = document.getElementById('tabla-hoy-wrap')
  if (!wrap) return
  wrap.innerHTML = skeletonTable(5, 5)

  try {
    const { data } = await api.get('/api/citas/confirmadas')

    // Stats
    const stats = document.getElementById('hoy-stats')
    if (data.length) {
      stats.hidden = false
      let espera = 0, prog = 0, fin = 0
      data.forEach(r => {
        if (r.atencion_estado === 'FINALIZADO') fin++
        else if (r.atencion_estado === 'EN PROGR' || r.atencion_estado === 'INICIADO') prog++
        else espera++
      })
      document.getElementById('hoy-stat-espera').textContent      = espera
      document.getElementById('hoy-stat-atendiendo').textContent  = prog
      document.getElementById('hoy-stat-atendidas').textContent   = fin
    } else {
      stats.hidden = true
    }

    if (!data.length) {
      wrap.innerHTML = `
        <div class="gm-empty" style="padding: 80px 20px;">
          <div class="gm-empty__icon" style="width:64px;height:64px;margin-bottom:12px;">${icon('today')}</div>
          <p class="gm-empty__text" style="font-size:1.05rem;font-weight:500;color:var(--texto-primario);margin-bottom:4px;">No hay pacientes en sala de espera.</p>
          <p class="gm-empty__text" style="margin-bottom:20px;">Las atenciones de hoy aparecerán aquí conforme lleguen.</p>
          <button type="button" class="btn-secundario" onclick="document.querySelector('.nav-item[data-route=citas]')?.click()">
            Revisar agenda de citas
          </button>
        </div>`
      return
    }

    const rows = data.map(r => ({ ...r, _id: r.idatencion }))

    wrap.innerHTML = wrapTable(renderTable({
      columns: [
        { label: 'Hora', align: 'center', render: r => `<span class="cita-hora">${(r.horario || '').slice(0, 5)}</span>` },
        {
          label: 'Paciente',
          render: r => `
            <div class="pac-cell">
              <div class="gm-avatar">${(r.paciente || '·').split(' ').map(p => p[0]).slice(0,2).join('').toUpperCase()}</div>
              <div class="pac-cell__info">
                <span class="pac-cell__name">${r.paciente ?? '—'}</span>
                <span class="pac-cell__meta">${r.motivo ?? 'Sin motivo'}</span>
              </div>
            </div>`,
        },
        {
          label: 'Estado', align: 'center',
          render: r => {
            if (r.atencion_estado === 'FINALIZADO') return '<span class="badge badge-verde">Atendido</span>'
            if (r.atencion_estado === 'EN PROGR' || r.atencion_estado === 'INICIADO') return '<span class="badge badge-azul">En atención</span>'
            return '<span class="badge badge-gris">En espera</span>'
          },
        },
        {
          label: 'Signos',
          align: 'center',
          render: () => iconBtn('heartbeat', 'signos', 'Registrar signos vitales', 'icon-verde'),
        },
        {
          label: 'Acciones', align: 'center',
          render: r => {
            const ticketBtn = (r.estado === 'A CUENTA' || r.estado === 'PAGADO')
              ? iconBtn('print', 'ticket', 'Imprimir ticket', 'icon-info')
              : '';
            const mainAction = ([1,2].includes(CARGO))
              ? (r.es_consulta || r.atencion_estado === 'EN PROGR'
                  ? iconBtn('calendar', 'atender', 'Registrar atención', 'icon-azul')
                  : iconBtn('pdf', 'archivo', 'Subir archivo', 'icon-ocre'))
              : '';
            return `<div class="pac-actions" style="justify-content:center;">${ticketBtn}${mainAction}</div>`;
          }
        }
      ],
      rows,
      rowClass: r => r.tiene_pendientes ? 'tr-pendiente' : '',
    }))
    
    // Asignar dataset idcita a los tr
    document.querySelectorAll('#tabla-hoy-wrap tbody tr').forEach((tr, i) => {
      if (rows[i]) tr.dataset.idcita = rows[i].idcita ?? rows[i].id;
    })
  } catch (err) {
    wrap.innerHTML = `<div class="state-error">${err.message}</div>`
  }
}

// ── Signos Vitales ────────────────────────────────────────────────────────────

async function abrirSignos(idatencion) {
  let signos = null
  try {
    const r = await api.get(`/api/atenciones/${idatencion}/signos`)
    signos = r.data
  } catch { /* sin signos previos */ }

  const campo = (name, label, unit, value) => `
    <div class="signo-edit-card">
      <div class="signo-edit-card__label">${label}</div>
      <input type="text" name="${name}" value="${value ?? ''}" class="signo-edit-card__input" autocomplete="off" />
      <div class="signo-edit-card__unit">${unit}</div>
    </div>`

  const html = `
    <h2 class="modal-title">Signos vitales</h2>
    <p class="muted" style="margin-top:-12px;margin-bottom:18px;font-size:.82rem;">
      Registre los valores tomados al ingreso del paciente.
    </p>
    <form id="form-signos" novalidate>
      <div class="signos-edit-grid">
        ${campo('fc',   'FC',   'lpm',   signos?.fr)}
        ${campo('pa',   'PA',   'mmHg',  signos?.pa)}
        ${campo('temp', 'T°',   '°C',    signos?.temp)}
        ${campo('so2',  'SO₂',  '%',     signos?.so2)}
        ${campo('peso', 'Peso', 'kg',    signos?.peso)}
      </div>
      <input type="hidden" name="idatencion" value="${idatencion}" />
      <div class="form-pac__actions">
        <button type="button" class="btn-secundario btn-cancelar" id="btn-cancel-signos">Cancelar</button>
        <button type="submit" class="btn-primario">${signos ? 'Actualizar signos' : 'Registrar signos'}</button>
      </div>
    </form>`

  openModal(html)
  document.getElementById('btn-cancel-signos').addEventListener('click', closeModal)

  document.getElementById('form-signos').addEventListener('submit', async (e) => {
    e.preventDefault()
    const btn = e.submitter || e.target.querySelector('button[type="submit"]')
    if (btn) btn.classList.add('btn-loading')
    const body = Object.fromEntries(new FormData(e.target).entries())
    try {
      await api.post('/api/atenciones/signos', body)
      toastOk('Signos vitales registrados.')
      closeModal()
    } catch (err) { toastError(err.message) }
    finally { if (btn) btn.classList.remove('btn-loading') }
  })
}

// ── Registro de Atención ──────────────────────────────────────────────────────

async function abrirAtencion(idatencion) {
  let atencion = null
  let ant      = null
  try {
    const ra = await api.get(`/api/atenciones/${idatencion}`)
    atencion = ra.data
    if (atencion?.dni) {
      const rAnt = await api.get('/api/atenciones/antecedentes', { dni: atencion.dni })
      ant = rAnt.data
    }
  } catch { /* continuar sin datos previos */ }

  const chip = (name, label, current) => `
    <label class="ant-chip ${current === 'SI' ? 'ant-chip--on' : ''}">
      <input type="checkbox" name="${name}" value="SI" ${current === 'SI' ? 'checked' : ''} />
      <span class="ant-chip__icon">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
      </span>
      <span>${label}</span>
    </label>`

  const soapCard = (name, title, hint, value, rows = 4) => `
    <div class="soap-edit-card" id="soap-${name}">
      <div class="soap-edit-card__head">
        <h4>${title}</h4>
        <span class="soap-edit-card__hint">${hint}</span>
      </div>
      <textarea name="${name}" rows="${rows}" placeholder="${hint}">${value ?? ''}</textarea>
    </div>`

  const signosHtml = ['fr','pa','temp','so2','peso']
    .map(k => {
      const labels = { fr:'FC', pa:'PA', temp:'T°', so2:'SO₂', peso:'Peso' }
      const units  = { fr:'lpm', pa:'mmHg', temp:'°C', so2:'%', peso:'kg' }
      const v = atencion?.[k]
      return `
        <div class="signo-card">
          <div class="signo-card__label">${labels[k]}</div>
          <div class="signo-card__value">${v && v !== '-' ? escapeHtmlLocal(v) : '—'}<span class="signo-card__unit">${units[k]}</span></div>
        </div>`
    }).join('')

  const html = `
    <div class="aten-modal">
      <header class="aten-modal__head">
        <div class="gm-avatar gm-avatar--lg">${inicialesAten(atencion?.paciente)}</div>
        <div>
          <h2 class="hist-head__name">${escapeHtmlLocal(atencion?.paciente ?? '—')}</h2>
          <p class="hist-head__meta">DNI ${escapeHtmlLocal(atencion?.dni ?? '—')} · ${atencion?.edad ?? '—'} años</p>
        </div>
      </header>

      <div class="aten-modal__body">

        <aside class="aten-modal__nav">
          <a href="#soap-signos">Signos vitales</a>
          <a href="#soap-ant">Antecedentes</a>
          <a href="#soap-molestia">Consulta</a>
        </aside>

        <form id="form-atencion" class="aten-modal__form" novalidate>
          <input type="hidden" name="idatencion" value="${idatencion}" />
          <input type="hidden" name="dni"        value="${atencion?.dni ?? ''}" />
          <input type="hidden" name="typeAction" value="REGISTRAR" />

          <section class="aten-section" id="soap-signos">
            <h3 class="aten-section__title">Signos vitales registrados</h3>
            <div class="signos-grid">${signosHtml}</div>
          </section>

          <section class="aten-section" id="soap-ant">
            <h3 class="aten-section__title">Antecedentes</h3>

            <div class="ant-chips">
              ${chip('hta',   'HTA',       ant?.HTA)}
              ${chip('dm',    'DM',        ant?.DM)}
              ${chip('hiv',   'HIV',       ant?.HIV)}
              ${chip('hep',   'Hepatitis', ant?.HEPATITIS)}
              ${chip('covid', 'COVID',     ant?.COVID)}
            </div>

            <div class="cont-group">
              <div class="cont-control">
                <label>Alergias</label>
                <input type="text" name="alergias" value="${ant?.ALERGIAS ?? '-'}" />
              </div>
              <div class="cont-control">
                <label>Cirugías</label>
                <input type="text" name="cirugias" value="${ant?.CIRUGIAS ?? '-'}" />
              </div>
              <div class="cont-control" style="grid-column: 1 / -1;">
                <label>Endoscopías previas</label>
                <input type="text" name="endoscopias" value="${ant?.ENDOSCOPIAS ?? '-'}" />
              </div>
            </div>
          </section>

          <section class="aten-section">
            <h3 class="aten-section__title">Consulta</h3>
            ${soapCard('molestia',     'Molestia principal',  'Síntoma o queja que motivó la consulta', atencion?.motivoconsulta, 3)}
            ${soapCard('antecedentes', 'Antecedentes (HEA)',  'Historia de la enfermedad actual',       atencion?.antecedente,    3)}
            ${soapCard('anamnesis',    'Anamnesis',           'Detalle del relato del paciente',         atencion?.anamensis,      5)}
            ${soapCard('examen_fisico','Examen físico',       'Hallazgos a la exploración',              atencion?.exfisico,       5)}
            ${soapCard('diagnostico',  'Diagnóstico',         'Impresión diagnóstica',                   atencion?.diagnostico,    4)}
            ${soapCard('tratamiento',  'Tratamiento',         'Plan terapéutico y recomendaciones',      atencion?.tratamiento,    5)}
          </section>

        </form>
      </div>

      <footer class="aten-modal__foot">
        <button type="button" class="btn-secundario btn-cancelar" id="btn-cancel-aten">Cancelar</button>
        <button type="submit" form="form-atencion" class="btn-primario" id="btn-guardar-aten">Registrar atención</button>
      </footer>
    </div>`

  openModal(html, { size: 'xl' })

  document.querySelectorAll('.aten-modal__nav a').forEach(a => {
    a.addEventListener('click', e => {
      e.preventDefault()
      const target = document.querySelector(a.getAttribute('href'))
      if (target) target.scrollIntoView({ behavior: 'smooth' })
    })
  })

  document.querySelectorAll('.ant-chip input').forEach(inp => {
    inp.addEventListener('change', e => {
      e.target.closest('.ant-chip').classList.toggle('ant-chip--on', e.target.checked)
    })
  })

  document.getElementById('btn-cancel-aten').addEventListener('click', closeModal)

  document.getElementById('form-atencion').addEventListener('submit', async (e) => {
    e.preventDefault()
    const btn  = document.getElementById('btn-guardar-aten')
    btn.disabled = true
    btn.classList.add('btn-loading')

    const fd = new FormData(e.target)
    const body = Object.fromEntries(fd.entries())
    ;['hta','dm','hiv','hep','covid'].forEach(k => {
      body[k] = fd.get(k) === 'SI' ? 'SI' : 'NO'
    })

    try {
      await api.post('/api/atenciones/guardar', body)
      toastOk('Atención registrada.')
      closeModal()
      cargarHoy()
    } catch (err) {
      toastError(err.message)
    } finally {
      btn.disabled = false
      btn.classList.remove('btn-loading')
    }
  })
}

function inicialesAten(nombreCompleto = '') {
  const p = (nombreCompleto || '').trim().split(/\s+/)
  return ((p[0]?.[0] ?? '') + (p[1]?.[0] ?? '')).toUpperCase() || '·'
}

function escapeHtmlLocal(s) {
  return String(s ?? '').replace(/[&<>"']/g, c => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  }[c]))
}

async function abrirSubirPdf(idatencion) {
  // Obtener DNI del paciente desde la atención
  let dni = ''
  try {
    const r = await api.get(`/api/atenciones/${idatencion}`)
    dni = r.data?.dni ?? ''
  } catch {
    toastError('No se pudo obtener los datos del paciente.')
    return
  }
  if (!dni) { toastError('No se encontró el DNI del paciente.'); return }

  const html = `
    <h2 class="modal-title">Cargar PDF</h2>
    <form id="form-pdf-hoy" novalidate>
      <div class="cont-control">
        <label>Nombre del examen</label>
        <input type="text" name="nombreexamen" required placeholder="Ej: Resultado de laboratorio" autocomplete="off" />
      </div>
      <div class="cont-control" style="margin-top:12px;">
        <label>Archivo PDF</label>
        <input type="file" name="mi-archivo" accept="application/pdf" required />
      </div>
      <div id="pdf-hoy-preview-wrap" style="margin-top:10px;display:none;">
        <p style="font-size:.82rem;color:var(--gris-dark);" id="pdf-hoy-filename"></p>
      </div>
      <div style="display:flex;gap:8px;margin-top:16px;">
        <button type="submit" class="btn-primario">Subir PDF</button>
        <button type="button" class="btn-secundario" id="btn-cancel-pdf-hoy">Cancelar</button>
      </div>
    </form>`

  openModal(html)

  const inputFile = document.querySelector('#form-pdf-hoy [name="mi-archivo"]')
  inputFile.addEventListener('change', () => {
    const file = inputFile.files[0]
    const wrap = document.getElementById('pdf-hoy-preview-wrap')
    const lbl  = document.getElementById('pdf-hoy-filename')
    if (file) {
      lbl.textContent = `Archivo seleccionado: ${file.name} (${(file.size / 1024).toFixed(1)} KB)`
      wrap.style.display = 'block'
    } else {
      wrap.style.display = 'none'
    }
  })

  document.getElementById('btn-cancel-pdf-hoy').addEventListener('click', closeModal)

  document.getElementById('form-pdf-hoy').addEventListener('submit', async (e) => {
    e.preventDefault()
    const btn = e.submitter || e.target.querySelector('button[type="submit"]')
    const nombre = e.target.querySelector('[name="nombreexamen"]').value.trim()
    if (!nombre) { toastError('Ingrese un nombre para el examen.'); return }

    const file = inputFile.files[0]
    if (!file || file.size === 0) { toastError('Seleccione un archivo PDF.'); return }

    if (btn) btn.classList.add('btn-loading')
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
      if (!res.ok) throw new Error(json.error ?? 'Error al subir el PDF.')
      toastOk('PDF subido correctamente.')
      closeModal()
    } catch (err) {
      toastError(err.message)
    } finally {
      if (btn) btn.classList.remove('btn-loading')
    }
  })
}

function abrirTicket(idcita) {
  const w = 800, h = 700
  const x = Math.round(screen.width  / 2 - w / 2)
  const y = Math.round(screen.height / 2 - h / 2)
  window.open(`/pdf/ticket/${idcita}`, '_ticket',
    `left=${x},top=${y},width=${w},height=${h},scrollbars=yes,menubar=no`)
}

