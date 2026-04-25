/**
 * views/hoy.js â€” Lista de atenciones del dÃ­a (sala de espera).
 */

import { api }        from '../utils/api.js'
import { toastOk, toastError } from '../utils/toast.js'
import { icon, iconBtn } from '../utils/icons.js'
import { openModal, closeModal } from '../components/modal.js'
import { renderTable, wrapTable } from '../components/table.js'

const content = () => document.getElementById('app-content')
const CARGO   = parseInt(document.querySelector('meta[name="user-cargo"]')?.content ?? '0')

export async function HoyView() {
  content().innerHTML = `
    <div class="cabecera">
      <h2>Atenciones de Hoy</h2>
      <button class="btn-secundario" id="btn-refresh-hoy" type="button">${icon('search')} Actualizar</button>
    </div>
    <div id="tabla-hoy-wrap"></div>`

  await cargarHoy()

  content().querySelector('#btn-refresh-hoy')?.addEventListener('click', cargarHoy)

  content().addEventListener('click', async (e) => {
    const btn = e.target.closest('[data-action]')
    if (!btn) return
    const tr         = btn.closest('tr')
    const idatencion = parseInt(tr?.dataset.id)
    const idcita     = parseInt(tr?.dataset.cita ?? '0')

    if (btn.dataset.action === 'signos')   await abrirSignos(idatencion)
    if (btn.dataset.action === 'atender')  await abrirAtencion(idatencion)
    if (btn.dataset.action === 'archivo')  await abrirSubirPdf(idatencion)
  })
}

async function cargarHoy() {
  const wrap = document.getElementById('tabla-hoy-wrap')
  if (!wrap) return
  wrap.innerHTML = `<div class="state-loading"><div class="spinner"></div></div>`

  try {
    const { data } = await api.get('/api/citas/confirmadas')

    if (!data.length) {
      wrap.innerHTML = `<div class="state-empty">No hay atenciones confirmadas para hoy.</div>`
      return
    }

    const rows = data.map(r => ({ ...r, _id: r.idatencion, 'data-cita': r.idcita }))

    wrap.innerHTML = wrapTable(renderTable({
      columns: [
        { key: 'horario',  label: 'Horario',    align: 'center' },
        { key: 'paciente', label: 'Paciente' },
        { key: 'motivo',   label: 'Motivo' },
        {
          label: 'Signos Vitales', align: 'center',
          render: () => iconBtn('heartbeat', 'signos', 'Registrar signos vitales', 'icon-verde'),
        },
        ...([1,2].includes(CARGO) ? [{
          label: 'AtenciÃ³n', align: 'center',
          render: r => r.es_consulta || r.atencion_estado === 'EN PROGR'
            ? iconBtn('calendar', 'atender', 'Registrar atenciÃ³n', 'icon-azul')
            : iconBtn('pdf', 'archivo', 'Subir archivo', 'icon-ocre'),
        }] : []),
      ],
      rows,
      rowClass: r => r.tiene_pendientes ? 'tr-pendiente' : '',
      emptyMsg: 'No hay atenciones pendientes.',
    }))
  } catch (err) {
    wrap.innerHTML = `<div class="state-error">${err.message}</div>`
  }
}

// â”€â”€ Signos Vitales â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

async function abrirSignos(idatencion) {
  let signos = null
  try {
    const r = await api.get(`/api/atenciones/${idatencion}/signos`)
    signos = r.data
  } catch { /* sin signos previos */ }

  const html = `
    <h2 class="modal-title">Signos Vitales</h2>
    <form id="form-signos" novalidate>
      <div class="cont-group cols3">
        <div class="cont-control"><label>FC (frec. cardÃ­aca)</label>
          <input type="text" name="fc"   value="${signos?.fr   ?? ''}" /></div>
        <div class="cont-control"><label>PA (presiÃ³n arterial)</label>
          <input type="text" name="pa"   value="${signos?.pa   ?? ''}" /></div>
        <div class="cont-control"><label>TÂ° (temperatura)</label>
          <input type="text" name="temp" value="${signos?.temp ?? ''}" /></div>
        <div class="cont-control"><label>So2 (saturaciÃ³n)</label>
          <input type="text" name="so2"  value="${signos?.so2  ?? ''}" /></div>
        <div class="cont-control"><label>Peso (kg)</label>
          <input type="text" name="peso" value="${signos?.peso ?? ''}" /></div>
      </div>
      <input type="hidden" name="idatencion" value="${idatencion}" />
      <div style="display:flex;gap:8px;margin-top:12px;">
        <button type="submit" class="btn-primario">${signos ? 'Actualizar' : 'Registrar'} Signos</button>
        <button type="button" class="btn-secundario btn-cancelar" id="btn-cancel-signos">Cancelar</button>
      </div>
    </form>`

  openModal(html)
  document.getElementById('btn-cancel-signos').addEventListener('click', closeModal)

  document.getElementById('form-signos').addEventListener('submit', async (e) => {
    e.preventDefault()
    const body = Object.fromEntries(new FormData(e.target).entries())
    try {
      await api.post('/api/atenciones/signos', body)
      toastOk('Signos vitales registrados.')
      closeModal()
    } catch (err) { toastError(err.message) }
  })
}

// â”€â”€ Registro de AtenciÃ³n â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

async function abrirAtencion(idatencion) {
  let atencion = null
  let ant      = null
  try {
    const [ra, rn] = await Promise.all([
      api.get(`/api/atenciones/${idatencion}`),
      api.get('/api/atenciones/antecedentes', { dni: '' }), // se actualizarÃ¡ con el dni
    ])
    atencion = ra.data
    if (atencion?.dni) {
      const rAnt = await api.get('/api/atenciones/antecedentes', { dni: atencion.dni })
      ant = rAnt.data
    }
  } catch { /* continuar sin datos previos */ }

  const checks = (name, label, val) => `
    <div class="group-radios">
      <label>${label}:</label>
      <div class="radio"><input type="radio" name="${name}" value="SI" ${val === 'SI' ? 'checked' : ''}><label>SI</label></div>
      <div class="radio"><input type="radio" name="${name}" value="NO" ${val !== 'SI' ? 'checked' : ''}><label>NO</label></div>
    </div>`

  const html = `
    <div id="nombre-atencion" style="font-weight:700;padding:10px 14px;background:var(--gris-light);border-radius:6px;border-left:3px solid var(--azul);margin-bottom:16px;">
      ${atencion?.paciente ?? 'â€”'}<br/>
      <span style="font-size:.8rem;font-weight:400;color:var(--gris-dark)">DNI: ${atencion?.dni ?? 'â€”'} | Edad: ${atencion?.edad ?? 'â€”'} aÃ±os</span>
    </div>
    <form id="form-atencion" novalidate>
      <input type="hidden" name="idatencion" value="${idatencion}" />
      <input type="hidden" name="dni"        value="${atencion?.dni ?? ''}" />
      <input type="hidden" name="typeAction" value="REGISTRAR" />

      <fieldset><legend>Signos vitales (solo lectura)</legend>
        <div class="cont-group cols3" style="gap:8px;">
          ${['fr','pa','temp','so2','peso'].map(k => `<div style="font-size:.85rem;padding:6px;background:var(--gris-light);border-radius:4px;text-align:center;"><b>${k.toUpperCase()}</b><br/>${atencion?.[k] ?? 'â€”'}</div>`).join('')}
        </div>
      </fieldset>

      <fieldset><legend>Antecedentes generales</legend>
        ${checks('hta','HTA',    ant?.HTA)}
        ${checks('dm', 'DM',     ant?.DM)}
        ${checks('hiv','HIV',    ant?.HIV)}
        ${checks('hep','Hepatitis', ant?.HEPATITIS)}
        <div class="cont-control"><label>Alergias</label>
          <input type="text" name="alergias" value="${ant?.ALERGIAS ?? '-'}" /></div>
        <div class="cont-group">
          <div class="cont-control"><label>CirugÃ­as</label>
            <input type="text" name="cirugias" value="${ant?.CIRUGIAS ?? '-'}" /></div>
          <div class="cont-control"><label>EndoscopÃ­as</label>
            <input type="text" name="endoscopias" value="${ant?.ENDOSCOPIAS ?? '-'}" /></div>
        </div>
        ${checks('covid','COVID', ant?.COVID)}
      </fieldset>

      <fieldset><legend>Consulta</legend>
        <div class="cont-group">
          <div class="cont-control"><label>Molestia Principal</label>
            <textarea name="molestia" rows="3">${atencion?.motivoconsulta ?? ''}</textarea></div>
          <div class="cont-control"><label>Antecedentes</label>
            <textarea name="antecedentes" rows="3">${atencion?.antecedente ?? ''}</textarea></div>
        </div>
        <div class="cont-group">
          <div class="cont-control"><label>Anamnesis</label>
            <textarea name="anamnesis" rows="5">${atencion?.anamensis ?? ''}</textarea></div>
          <div class="cont-control"><label>Examen FÃ­sico</label>
            <textarea name="examen_fisico" rows="5">${atencion?.exfisico ?? ''}</textarea></div>
          <div class="cont-control"><label>DiagnÃ³stico</label>
            <textarea name="diagnostico" rows="5">${atencion?.diagnostico ?? ''}</textarea></div>
          <div class="cont-control"><label>Tratamiento</label>
            <textarea name="tratamiento" rows="5">${atencion?.tratamiento ?? ''}</textarea></div>
        </div>
      </fieldset>

      <div style="display:flex;gap:8px;margin-top:12px;">
        <button type="submit" class="btn-primario" id="btn-guardar-aten">Registrar AtenciÃ³n</button>
        <button type="button" class="btn-secundario btn-cancelar" id="btn-cancel-aten">Cancelar</button>
      </div>
    </form>`

  openModal(html, { wide: true })
  document.getElementById('btn-cancel-aten').addEventListener('click', closeModal)

  document.getElementById('form-atencion').addEventListener('submit', async (e) => {
    e.preventDefault()
    const btn  = document.getElementById('btn-guardar-aten')
    btn.disabled = true
    const body = Object.fromEntries(new FormData(e.target).entries())
    try {
      await api.post('/api/atenciones/guardar', body)
      toastOk('AtenciÃ³n registrada.')
      closeModal()
      cargarHoy()
    } catch (err) {
      toastError(err.message)
      btn.disabled = false
    }
  })
}

async function abrirSubirPdf(idatencion) {
  // Obtener DNI del paciente desde la atenciÃ³n
  let dni = ''
  try {
    const r = await api.get(`/api/atenciones/${idatencion}`)
    dni = r.data?.dni ?? ''
  } catch {
    toastError('No se pudo obtener los datos del paciente.')
    return
  }
  if (!dni) { toastError('No se encontrÃ³ el DNI del paciente.'); return }

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
      if (!res.ok) throw new Error(json.error ?? 'Error al subir el PDF.')
      toastOk('PDF subido correctamente.')
      closeModal()
    } catch (err) {
      toastError(err.message)
    }
  })
}
