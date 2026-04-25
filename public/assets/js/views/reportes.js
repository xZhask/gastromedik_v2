/**
 * views/reportes.js — Reportes de movimientos de caja.
 */
import { api }        from '../utils/api.js'
import { toastError } from '../utils/toast.js'
import { icon }       from '../utils/icons.js'
import { renderTable, wrapTable } from '../components/table.js'

const content = () => document.getElementById('app-content')

export async function ReportesView() {
  const hoy = new Date().toISOString().split('T')[0]
  content().innerHTML = `
    <div class="cabecera"><h2>Reportes</h2></div>
    <div class="Controls-Reporte">
      <div class="radio"><input type="radio" name="tipo" id="r-ingreso" value="INGRESO" checked><label for="r-ingreso">Ingresos</label></div>
      <div class="radio"><input type="radio" name="tipo" id="r-gasto"   value="GASTO"><label for="r-gasto">Gastos</label></div>
      <div class="cont-control" style="margin:0;"><label>Desde</label><input type="date" id="r-desde" value="${hoy}" /></div>
      <div class="cont-control" style="margin:0;"><label>Hasta</label><input type="date" id="r-hasta" value="${hoy}" /></div>
      <button class="btn-secundario" id="btn-generar" type="button">Generar</button>
      <a id="btn-pdf-rep" href="#" target="_blank" class="btn-secundario" style="display:none;">${icon('pdf')} PDF</a>
    </div>
    <div id="totales-rep" class="cont-totales" style="margin-bottom:16px;display:none;">
      <div style="display:flex;gap:16px;flex-wrap:wrap;" id="totales-labels"></div>
    </div>
    <div id="tabla-rep-wrap"></div>`

  document.getElementById('btn-generar').addEventListener('click', generar)
}

async function generar() {
  const tipo   = document.querySelector('input[name="tipo"]:checked')?.value ?? 'INGRESO'
  const desde  = document.getElementById('r-desde')?.value ?? ''
  const hasta  = document.getElementById('r-hasta')?.value ?? ''
  const wrap   = document.getElementById('tabla-rep-wrap')
  wrap.innerHTML = `<div class="state-loading"><div class="spinner"></div></div>`

  try {
    const { data } = await api.get('/api/reportes/movimientos', { tipomovimientocaja: tipo, fecha1: desde, fecha2: hasta })

    let efectivo = 0, transf = 0, pos = 0, yape = 0
    data.forEach(r => {
      if (r.anulado) return
      const m = parseFloat(r.monto ?? 0)
      if (r.tipopago === 'EFECTIVO')      efectivo += m
      if (r.tipopago === 'TRANSFERENCIA') transf   += m
      if (r.tipopago === 'POS')           pos      += m
      if (r.tipopago === 'YAPE')          yape     += m
    })
    const total = efectivo + transf + pos + yape

    document.getElementById('totales-rep').style.display = 'flex'
    document.getElementById('totales-labels').innerHTML = [
      ['Total', total], ['Efectivo', efectivo], ['Transf.', transf], ['POS', pos], ['Yape', yape],
    ].map(([l,v]) => `<label class="lbltotales">${l}: S/. ${v.toFixed(2)}</label>`).join('')

    const pdf = document.getElementById('btn-pdf-rep')
    pdf.style.display = 'inline-flex'
    pdf.href = `/pdf/reportes/movimientos?fecha1=${desde}&fecha2=${hasta}&tipomovimiento=${tipo}`

    wrap.innerHTML = wrapTable(renderTable({
      columns: [
        { key: 'fecha',       label: 'Fecha',       align: 'center' },
        { key: 'paciente',    label: 'Paciente' },
        { key: 'descripcion', label: 'Descripción' },
        { key: 'monto',       label: 'Monto',       align: 'center', render: r => `S/. ${parseFloat(r.monto).toFixed(2)}` },
        { key: 'tipopago',    label: 'Tipo Pago',   align: 'center' },
        { key: 'nick',        label: 'Usuario',     align: 'center' },
        { key: 'anulado',     label: 'Estado',      align: 'center', render: r => r.anulado ? `<span class="badge badge-rojo">Anulado</span>` : '' },
      ],
      rows: data,
      emptyMsg: 'Sin movimientos en el período.',
    }))
  } catch (err) {
    wrap.innerHTML = `<div class="state-error">${err.message}</div>`
  }
}
