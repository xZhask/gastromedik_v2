import { api }        from '../utils/api.js'
import { toastError } from '../utils/toast.js'
import { icon }       from '../utils/icons.js'
import { renderTable, wrapTable } from '../components/table.js'
import { skeletonTable } from '../components/skeleton.js'

const content = () => document.getElementById('app-content')

export async function ReportesView() {
  const hoy = new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0]
  
  content().innerHTML = `
    <div class="citas-header">
      <div class="citas-header__top" style="flex-direction: column; align-items: flex-start; gap: 16px;">
        <div class="citas-header__title">
          <h1>Reportes Generales</h1>
        </div>
        <div class="gm-tabs" style="display:flex; gap:10px; border-bottom: 2px solid var(--superficie-2); width:100%;">
           <button class="gm-tab active" data-tab="tab-finanzas" style="background:none; border:none; padding:10px 16px; font-weight:600; color:var(--azul); border-bottom: 2px solid var(--azul); cursor:pointer; margin-bottom:-2px;">Ingresos y Egresos</button>
           <button class="gm-tab" data-tab="tab-procedimientos" style="background:none; border:none; padding:10px 16px; font-weight:500; color:var(--texto-secundario); cursor:pointer; margin-bottom:-2px;">Procedimientos</button>
        </div>
      </div>
    </div>

    <!-- TAB: FINANZAS -->
    <div id="tab-finanzas" class="gm-tab-content active">
      <div class="Controls-Reporte" style="margin-top: 20px;">
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
      <div id="tabla-rep-wrap"></div>
    </div>

    <!-- TAB: PROCEDIMIENTOS -->
    <div id="tab-procedimientos" class="gm-tab-content" style="display:none;">
      <div class="Controls-Reporte" style="margin-top: 20px;">
        <div class="cont-control" style="margin:0;"><label>Desde</label><input type="date" id="rp-desde" value="${hoy}" /></div>
        <div class="cont-control" style="margin:0;"><label>Hasta</label><input type="date" id="rp-hasta" value="${hoy}" /></div>
        <div class="cont-control" style="margin:0;"><label>Tipo de Atención</label><select id="rp-tipo"><option value="0">Cargando...</option></select></div>
        <button class="btn-secundario" id="btn-gen-rp" type="button">Generar</button>
      </div>
      <div id="tabla-rp-wrap"></div>
    </div>
  `

  // Bind tabs
  const tabs = document.querySelectorAll('.gm-tab');
  const contents = document.querySelectorAll('.gm-tab-content');
  
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => {
        t.classList.remove('active');
        t.style.fontWeight = '500';
        t.style.color = 'var(--texto-secundario)';
        t.style.borderBottom = 'none';
      });
      tab.classList.add('active');
      tab.style.fontWeight = '600';
      tab.style.color = 'var(--azul)';
      tab.style.borderBottom = '2px solid var(--azul)';
      
      contents.forEach(c => c.style.display = 'none');
      document.getElementById(tab.dataset.tab).style.display = 'block';
    });
  });

  // Bind generation events
  document.getElementById('btn-generar').addEventListener('click', generarFinanzas);
  document.getElementById('btn-gen-rp').addEventListener('click', generarProcedimientos);

  // Load tipos de atencion for procedimientos tab
  try {
    const { data } = await api.get('/api/establecimientos/tipo-atenciones')
    const sel = document.getElementById('rp-tipo')
    sel.innerHTML = '<option value="0">Todos</option>' +
      data.map(t => `<option value="${t.idtipoatencion}">${t.nombre}</option>`).join('')
  } catch { /* sin tipos */ }

  // Initial load
  generarFinanzas();
  generarProcedimientos();
}

async function generarFinanzas() {
  const tipo   = document.querySelector('input[name="tipo"]:checked')?.value ?? 'INGRESO'
  const desde  = document.getElementById('r-desde')?.value ?? ''
  const hasta  = document.getElementById('r-hasta')?.value ?? ''
  const wrap   = document.getElementById('tabla-rep-wrap')
  wrap.innerHTML = skeletonTable(5, 7)

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

    if (data.length > 0) {
        document.getElementById('totales-rep').style.display = 'flex'
        document.getElementById('totales-labels').innerHTML = [
        ['Total', total], ['Efectivo', efectivo], ['Transf.', transf], ['POS', pos], ['Yape', yape],
        ].map(([l,v]) => `<label class="lbltotales">${l}: S/. ${v.toFixed(2)}</label>`).join('')

        const pdf = document.getElementById('btn-pdf-rep')
        pdf.style.display = 'inline-flex'
        pdf.href = `/pdf/reportes/movimientos?fecha1=${desde}&fecha2=${hasta}&tipomovimiento=${tipo}`
    } else {
        document.getElementById('totales-rep').style.display = 'none'
        document.getElementById('btn-pdf-rep').style.display = 'none'
    }

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
      emptyMsg: 'Sin movimientos en el período seleccionado.',
    }))
  } catch (err) {
    wrap.innerHTML = `<div class="state-error">${err.message}</div>`
  }
}

async function generarProcedimientos() {
  const wrap = document.getElementById('tabla-rp-wrap')
  wrap.innerHTML = skeletonTable(5, 2)
  const params = {
    fecha1:        document.getElementById('rp-desde')?.value ?? '',
    fecha2:        document.getElementById('rp-hasta')?.value ?? '',
    tipoAtencion:  document.getElementById('rp-tipo')?.value ?? '0',
  }
  try {
    const { data } = await api.get('/api/citas/reporte-atenciones', params)
    if (!data.length) {
      wrap.innerHTML = `
        <div class="gm-empty" style="margin-top:20px;">
          <div class="gm-empty__icon">${icon('chart')}</div>
          <p class="gm-empty__text">Sin atenciones en el período seleccionado.</p>
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
