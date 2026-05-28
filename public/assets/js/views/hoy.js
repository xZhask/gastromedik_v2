/**
 * views/hoy.js — Lista de atenciones del día (sala de espera).
 */

import { api }        from '../utils/api.js'
import { toastOk, toastError } from '../utils/toast.js'
import { icon, iconBtn } from '../utils/icons.js'
import { openModal, closeModal } from '../components/modal.js'
import { renderTable, wrapTable } from '../components/table.js'
import { skeletonTable } from '../components/skeleton.js'
import { abrirAdjuntos } from '../components/adjuntosModal.js'

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
    if (btn.dataset.action === 'archivo') {
      try {
        const r = await api.get(`/api/atenciones/${idatencion}`);
        const dni = r.data?.dni ?? '';
        const pac = r.data?.paciente ?? '';
        if (!dni) { toastError('No se encontró el DNI del paciente.'); return; }
        await abrirAdjuntos(dni, pac, { onDone: cargarHoy });
      } catch {
        toastError('No se pudo obtener los datos del paciente.');
      }
    }
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
            const mainAction = [];
            if ([1,2,4].includes(CARGO)) {
              mainAction.push(iconBtn('pdf', 'archivo', 'Adjuntar archivo', 'icon-ocre'));
            }
            if ([1,2].includes(CARGO)) {
              mainAction.push(iconBtn('calendar', 'atender', 'Registrar atención', 'icon-azul'));
            }
            return `<div class="pac-actions acciones-atencion" style="justify-content:center;display:flex;gap:6px;">${ticketBtn}${mainAction.join('')}</div>`;
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

  const soapCard = (name, title, hint, value, rows = 4) => {
    const val = (value && value !== '-') ? value : ''
    return `
      <div class="soap-edit-card" id="soap-${name}">
        <div class="soap-edit-card__head">
          <h4>${title}</h4>
          <span class="soap-edit-card__hint">${hint}</span>
        </div>
        <textarea name="${name}" rows="${rows}" placeholder="${hint}">${val}</textarea>
      </div>`
  }

  const signosHtml = ['fr','pa','temp','so2','peso']
    .map(k => {
      const labels = { fr:'FC', pa:'PA', temp:'T°', so2:'SO₂', peso:'Peso' }
      const units  = { fr:'lpm', pa:'mmHg', temp:'°C', so2:'%', peso:'kg' }
      const v = atencion?.[k]
      const tieneValor = v && v !== '-'
      return `
        <div class="signo-card">
          <span class="signo-card__label">${labels[k]}</span>
          <span class="signo-card__value">${tieneValor ? escapeHtmlLocal(v) : ''}<span class="signo-card__unit">${units[k]}</span></span>
        </div>`
    }).join('')

  const html = `
    <div class="aten-modal">
      <header class="aten-modal__head">
        <div class="gm-avatar gm-avatar--lg">${inicialesAten(atencion?.paciente)}</div>
        <div class="aten-modal__ident">
          <h2 class="aten-modal__name">${escapeHtmlLocal(atencion?.paciente ?? '')}</h2>
          <p class="aten-modal__meta">
            <span>DNI ${escapeHtmlLocal(atencion?.dni ?? '')}</span>
            <span class="aten-modal__dot"></span>
            <span>${atencion?.edad ?? ''} años</span>
          </p>
        </div>
        <button type="button" class="aten-modal__close" id="btn-close-aten" aria-label="Cerrar">
          <i class="ph ph-x"></i>
        </button>
      </header>

      <div class="modal-tabs" style="padding: 0 24px;">
        <button type="button" class="modal-tab active" data-tab="tab-aten">Atención</button>
        <button type="button" class="modal-tab" data-tab="tab-adj">Adjuntos <span class="badge badge-azul badge--solid" id="badge-adj" style="margin-left:6px">0</span></button>
        <button type="button" class="modal-tab" data-tab="tab-hist">Historial</button>
      </div>

      <div class="aten-modal__body" style="padding: 0 24px 16px;">

        <!-- Pestaña Atención -->
        <div id="tab-aten" class="tab-panel active">
          <form id="form-atencion" class="aten-modal__form" novalidate style="width: 100%;">
            <input type="hidden" name="idatencion" value="${idatencion}" />
            <input type="hidden" name="dni"        value="${atencion?.dni ?? ''}" />
            <input type="hidden" name="typeAction" value="REGISTRAR" />

            <section class="aten-section" id="soap-signos">
              <h3 class="aten-section__title" style="grid-column: 1 / -1; white-space: normal;">Signos vitales registrados</h3>
              <div class="signos-grid">${signosHtml}</div>
            </section>

              <section class="aten-section" id="soap-ant">
                <h3 class="aten-section__title">Antecedentes</h3>

                <div class="ant-grid">
                  <div class="cont-control">
                    <label>Enfermedades crónicas</label>
                    <div class="ant-chips">
                      ${chip('hta',   'HTA',       ant?.HTA)}
                      ${chip('dm',    'DM',        ant?.DM)}
                      ${chip('hiv',   'HIV',       ant?.HIV)}
                      ${chip('hep',   'Hepatitis', ant?.HEPATITIS)}
                      ${chip('covid', 'COVID',     ant?.COVID)}
                    </div>
                  </div>
                  <div class="cont-control">
                    <label>Alergias</label>
                    <input type="text" name="alergias" value="${ant?.ALERGIAS && ant.ALERGIAS !== '-' ? ant.ALERGIAS : ''}" placeholder="Alergias conocidas" />
                  </div>
                  <div class="cont-control">
                    <label>Cirugías</label>
                    <input type="text" name="cirugias" value="${ant?.CIRUGIAS && ant.CIRUGIAS !== '-' ? ant.CIRUGIAS : ''}" placeholder="Antecedentes quirúrgicos" />
                  </div>
                  <div class="cont-control">
                    <label>Endoscopías previas</label>
                    <input type="text" name="endoscopias" value="${ant?.ENDOSCOPIAS && ant.ENDOSCOPIAS !== '-' ? ant.ENDOSCOPIAS : ''}" placeholder="Endoscopías previas" />
                  </div>
                </div>
              </section>

              <section class="aten-section">
                <h3 class="aten-section__title">Consulta</h3>
                ${soapCard('molestia',     'Molestia principal',  'Síntoma o queja que motivó la consulta', atencion?.motivoconsulta, 3)}
                ${soapCard('antecedentes', 'Antecedentes (HEA)',  'Historia de la enfermedad actual',       atencion?.antecedente,    3)}
                ${soapCard('anamnesis',    'Anamnesis',           'Detalle del relato del paciente',         atencion?.anamensis,      4)}
                ${soapCard('examen_fisico','Examen físico',       'Hallazgos a la exploración',              atencion?.exfisico,       4)}
                ${soapCard('diagnostico',  'Diagnóstico',         'Impresión diagnóstica',                   atencion?.diagnostico,    4)}
                ${soapCard('tratamiento',  'Tratamiento',         'Plan terapéutico y recomendaciones',      atencion?.tratamiento,    4)}
              </section>
          </form>
        </div>

        <!-- Pestaña Adjuntos -->
        <div id="tab-adj" class="tab-panel">
          <div id="lista-adjuntos" style="display:flex;flex-direction:column;gap:8px;">
            <div class="state-loading"><div class="spinner"></div></div>
          </div>
        </div>

        <!-- Pestaña Historial -->
        <div id="tab-hist" class="tab-panel">
          <div id="lista-historial" style="display:flex;flex-direction:column;gap:10px;">
            <div class="state-loading"><div class="spinner"></div></div>
          </div>
        </div>

      </div>

      <footer class="aten-modal__foot">
        <button type="button" class="btn-secundario btn-cancelar" id="btn-cancel-aten">Cancelar</button>
        <button type="submit" form="form-atencion" class="btn-primario" id="btn-guardar-aten">Registrar atención</button>
      </footer>
    </div>`

  openModal(html, { size: 'xl' })

  // Pestañas
  const tabs = document.querySelectorAll('.modal-tab')
  const contents = document.querySelectorAll('.tab-panel')
  tabs.forEach(t => {
    t.addEventListener('click', () => {
      tabs.forEach(x => x.classList.remove('active'))
      contents.forEach(x => x.classList.remove('active'))
      t.classList.add('active')
      document.getElementById(t.dataset.tab).classList.add('active')
    })
  })



  document.querySelectorAll('.ant-chip input').forEach(inp => {
    inp.addEventListener('change', e => {
      e.target.closest('.ant-chip').classList.toggle('ant-chip--on', e.target.checked)
    })
  })

  document.getElementById('btn-close-aten')?.addEventListener('click', closeModal)
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

  // Cargar Adjuntos
  if (atencion?.dni) {
    api.get('/api/examenes', { dni: atencion.dni }).then(res => {
      const data = res.data || []
      const badge = document.getElementById('badge-adj')
      const wrap = document.getElementById('lista-adjuntos')
      
      badge.textContent = data.length
      if (data.length === 0) {
        wrap.innerHTML = `<div class="state-empty" style="padding:40px;">Sin archivos adjuntos.</div>`
        return
      }

      data.sort((a, b) => {
        const da = new Date(a.fecha).getTime()
        const db = new Date(b.fecha).getTime()
        const va = isNaN(da) ? 0 : da
        const vb = isNaN(db) ? 0 : db
        return vb - va
      })

      wrap.innerHTML = data.map(ex => {
        const d = ex.fecha ? new Date(ex.fecha) : null
        const df = d && !isNaN(d) ? d.toLocaleDateString('es-PE', { day:'numeric', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' }) : '—'
        const isPdf = ex.tipoexamen === 'PDF'
        const badgeEx = isPdf ? '<span class="badge badge-rojo">PDF</span>' : '<span class="badge badge-verde">IMG</span>'
        const type = isPdf ? 'pdf' : 'imgs'
        const url = `/uploads/${type}/${atencion.dni}/${encodeURIComponent(isPdf ? ex.archivo_pdf : ex.foto1)}`
        
        return `
          <div class="gm-card gm-card--flat" style="display:flex;align-items:center;justify-content:space-between;padding:12px 16px;">
            <div>
              <div style="font-weight:600;font-size:13px;text-transform:capitalize;">${escapeHtmlLocal(ex.nombreexamen)}</div>
              <div style="font-size:11px;color:var(--texto-terciario);font-variant-numeric:tabular-nums;">${df}</div>
            </div>
            <div style="display:flex;align-items:center;gap:10px;">
              ${badgeEx}
              <a href="${url}" target="_blank" class="btn-secundario" style="height:28px;padding:0 10px;font-size:12px;text-decoration:none;">Abrir</a>
            </div>
          </div>
        `
      }).join('')
    }).catch(() => {
      document.getElementById('lista-adjuntos').innerHTML = `<div class="state-error">Error al cargar adjuntos</div>`
    })
  }

  // Cargar Historial
  if (atencion?.dni) {
    api.get('/api/atenciones/paciente', { dni: atencion.dni }).then(res => {
      const data = res.data || []
      const wrap = document.getElementById('lista-historial')
      
      const filtrado = data.filter(a => a.estado === 'FINALIZADO' && a.idatencion !== idatencion)
      
      if (filtrado.length === 0) {
        wrap.innerHTML = `<div class="state-empty" style="padding:40px;">No hay atenciones finalizadas previas.</div>`
        return
      }

      filtrado.sort((a, b) => {
        const d_a = a.fecha || a.fechaatencion
        const d_b = b.fecha || b.fechaatencion
        const da = new Date(d_a).getTime()
        const db = new Date(d_b).getTime()
        return (isNaN(db) ? 0 : db) - (isNaN(da) ? 0 : da)
      })

      const mostrados = filtrado.slice(0, 5)

      wrap.innerHTML = mostrados.map((h, i) => {
        const d_str = h.fecha || h.fechaatencion
        const d = d_str ? new Date(d_str) : null
        const df = d && !isNaN(d) ? d.toLocaleDateString('es-PE', { day:'numeric', month:'short', year:'numeric' }) : '—'
        return `
          <div class="hist-item ${i === 0 ? 'open' : ''}">
            <div class="hist-head" onclick="this.parentElement.classList.toggle('open')">
              <span>${df}</span>
              <span style="font-size:12px;font-weight:500;color:var(--azul);">Ver detalles ▾</span>
            </div>
            <div class="hist-body">
              <div style="margin-bottom:8px;"><strong style="font-size:12px;color:var(--texto-terciario);text-transform:uppercase;">Motivo</strong><p style="font-size:13px;margin-top:2px;">${escapeHtmlLocal(h.motivoconsulta)}</p></div>
              <div style="margin-bottom:8px;"><strong style="font-size:12px;color:var(--texto-terciario);text-transform:uppercase;">Diagnóstico</strong><p style="font-size:13px;margin-top:2px;">${escapeHtmlLocal(h.diagnostico)}</p></div>
              <div><strong style="font-size:12px;color:var(--texto-terciario);text-transform:uppercase;">Tratamiento</strong><p style="font-size:13px;margin-top:2px;">${escapeHtmlLocal(h.tratamiento)}</p></div>
            </div>
          </div>
        `
      }).join('')
    }).catch(() => {
      document.getElementById('lista-historial').innerHTML = `<div class="state-error">Error al cargar historial</div>`
    })
  }
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



function abrirTicket(idcita) {
  const w = 800, h = 700
  const x = Math.round(screen.width  / 2 - w / 2)
  const y = Math.round(screen.height / 2 - h / 2)
  window.open(`/pdf/ticket/${idcita}`, '_ticket',
    `left=${x},top=${y},width=${w},height=${h},scrollbars=yes,menubar=no`)
}

