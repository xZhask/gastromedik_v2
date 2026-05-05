/**
 * views/reportproc.js — Reporte de cantidad de procedimientos por período.
 */
import { api }        from '../utils/api.js'
import { icon }       from '../utils/icons.js'
import { renderTable, wrapTable } from '../components/table.js'
import { skeletonTable } from '../components/skeleton.js'

const content = () => document.getElementById('app-content')

export async function ReportProcView() {
  const hoy = new Date().toISOString().split('T')[0]
  content().innerHTML = `
    <div class="citas-header">
      <div class="citas-header__top">
        <div class="citas-header__title">
          <h1>Reporte de procedimientos</h1>
          <span class="gm-page-header__sub" id="rp-sub"></span>
        </div>
        <div class="citas-header__actions">
          <button class="btn-secundario" id="btn-gen-rp" type="button">Generar</button>
        </div>
      </div>
      <div class="citas-header__filters">
        <div class="Controls-Reporte">
          <div class="cont-control" style="margin:0;"><label>Desde</label><input type="date" id="rp-desde" value="${hoy}" /></div>
          <div class="cont-control" style="margin:0;"><label>Hasta</label><input type="date" id="rp-hasta" value="${hoy}" /></div>
          <div class="cont-control" style="margin:0;"><label>Tipo de Atención</label><select id="rp-tipo"></select></div>
        </div>
      </div>
    </div>
    <div id="tabla-rp-wrap"></div>`

  // Cargar tipos
  try {
    const { data } = await api.get('/api/establecimientos/tipo-atenciones')
    const sel = document.getElementById('rp-tipo')
    sel.innerHTML = '<option value="0">Todos</option>' +
      data.map(t => `<option value="${t.idtipoatencion}">${t.nombre}</option>`).join('')
  } catch { /* sin tipos */ }

  document.getElementById('btn-gen-rp').addEventListener('click', generar)
  generar()
}

async function generar() {
  const wrap = document.getElementById('tabla-rp-wrap')
  wrap.innerHTML = skeletonTable(5, 2)
  const params = {
    fecha1:        document.getElementById('rp-desde')?.value ?? '',
    fecha2:        document.getElementById('rp-hasta')?.value ?? '',
    tipoAtencion:  document.getElementById('rp-tipo')?.value ?? '0',
  }
  try {
    const { data } = await api.get('/api/citas/reporte-atenciones', params)
    const mes = new Date(params.fecha1).toLocaleDateString('es-PE', { month: 'long', year: 'numeric' })
    document.getElementById('rp-sub').textContent = mes
    if (!data.length) {
      wrap.innerHTML = `
        <div class="gm-empty">
          <div class="gm-empty__icon">${icon('chart')}</div>
          <p class="gm-empty__text">Sin atenciones en el período.</p>
        </div>`
      return
    }
    wrap.innerHTML = wrapTable(renderTable({
      columns: [
        { key: 'tipo_atencion', label: 'Procedimiento' },
        { key: 'cantidad',      label: 'Cantidad', align: 'center' },
      ],
      rows: data,
    }))
  } catch (err) {
    wrap.innerHTML = `<div class="state-error">${err.message}</div>`
  }
}
