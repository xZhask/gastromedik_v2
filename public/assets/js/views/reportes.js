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
        <div class="gm-tabs" style="display:flex; gap:10px; width:100%; margin-bottom:12px;">
           <button class="gm-tab active" data-tab="tab-finanzas">Ingresos y Egresos</button>
           <button class="gm-tab" data-tab="tab-procedimientos">Procedimientos</button>
        </div>
      </div>
    </div>

    <!-- TAB: FINANZAS -->
    <div id="tab-finanzas" class="gm-tab-content active">
      <div class="toolbar" style="display:flex;align-items:flex-end;gap:14px;flex-wrap:wrap;margin-bottom:20px;margin-top:20px;">
        <div class="gm-seg" id="seg-tipo-mov">
          <button class="on" data-val="INGRESO">Ingresos</button>
          <button data-val="GASTO">Gastos</button>
        </div>
        <div class="cont-control" style="margin:0;"><label>Desde</label><input type="date" id="r-desde" value="${hoy}" /></div>
        <div class="cont-control" style="margin:0;"><label>Hasta</label><input type="date" id="r-hasta" value="${hoy}" /></div>
        <button class="btn-secundario" id="btn-generar" type="button">Generar</button>
        <div style="margin-left:auto;"></div>
        <a id="btn-pdf-rep" href="#" target="_blank" class="btn-secundario btndisabled">${icon('pdf')} PDF</a>
      </div>
      <div id="totales-rep" style="display:grid;grid-template-columns:1.4fr 1fr 1fr 1fr 1fr;gap:12px;margin-bottom:22px;"></div>
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
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      
      contents.forEach(c => c.style.display = 'none');
      document.getElementById(tab.dataset.tab).style.display = 'block';
    });
  });

  // Bind segmented toggle
  document.querySelectorAll('#seg-tipo-mov button').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#seg-tipo-mov button').forEach(b => b.classList.remove('on'));
      btn.classList.add('on');
      generarFinanzas();
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
  const tipo   = document.querySelector('#seg-tipo-mov button.on')?.dataset.val ?? 'INGRESO'
  const desde  = document.getElementById('r-desde')?.value ?? ''
  const hasta  = document.getElementById('r-hasta')?.value ?? ''
  const wrap   = document.getElementById('tabla-rep-wrap')
  wrap.innerHTML = skeletonTable(5, 7)

  try {
    const { data } = await api.get('/api/reportes/movimientos', { tipomovimientocaja: tipo, fecha1: desde, fecha2: hasta })

    let efectivo = 0, transf = 0, pos = 0, yape = 0
    let conteo = 0
    data.forEach(r => {
      if (r.anulado) return
      conteo++
      const m = parseFloat(r.monto ?? 0)
      if (r.tipopago === 'EFECTIVO')      efectivo += m
      if (r.tipopago === 'TRANSFERENCIA') transf   += m
      if (r.tipopago === 'POS')           pos      += m
      if (r.tipopago === 'YAPE')          yape     += m
    })
    const total = efectivo + transf + pos + yape
    const isIngreso = tipo === 'INGRESO'
    const thColor = isIngreso ? 'var(--verde)' : 'var(--rojo)'
    const thClass = isIngreso ? 'gm-stat--verde' : 'gm-stat--rojo'

    const mcard = (lbl, val, cls='') => `
      <div class="gm-stat ${cls}">
        <span class="gm-stat__label">${lbl}</span>
        <span class="gm-stat__value">S/ ${val.toFixed(2)}</span>
      </div>`

    if (data.length > 0) {
      document.getElementById('totales-rep').innerHTML = `
        <div class="gm-stat ${thClass}" style="background:var(--superficie); border-color:var(--borde-medio);">
          <span class="gm-stat__label">Total ${isIngreso ? 'ingresos' : 'gastos'}</span>
          <span class="gm-stat__value" style="color:${thColor}; font-size:24px;">S/ ${total.toFixed(2)}</span>
          <span style="font-size:12px;color:var(--texto-terciario);margin-top:4px;display:block;">${conteo} transacciones</span>
        </div>
        ${mcard('Efectivo', efectivo, efectivo===0?'gm-stat--cero':'')}
        ${mcard('Transfer.', transf, transf===0?'gm-stat--cero':'')}
        ${mcard('POS', pos, pos===0?'gm-stat--cero':'')}
        ${mcard('Yape', yape, yape===0?'gm-stat--cero':'')}
      `
      const pdf = document.getElementById('btn-pdf-rep')
      pdf.classList.remove('btndisabled')
      pdf.href = `/pdf/reportes/movimientos?fecha1=${desde}&fecha2=${hasta}&tipomovimiento=${tipo}`
    } else {
      document.getElementById('totales-rep').innerHTML = ''
      const pdf = document.getElementById('btn-pdf-rep')
      pdf.classList.add('btndisabled')
      pdf.removeAttribute('href')
    }

    wrap.innerHTML = wrapTable(renderTable({
      columns: [
        { key: 'fecha',       label: 'Fecha · Hora', render: r => {
            const f = r.fecha?.split(' ')[0] ?? ''; 
            const h = r.fecha?.split(' ')[1] ?? '';
            const dt = new Date(f + 'T' + h);
            if(isNaN(dt)) return r.fecha;
            const df = dt.toLocaleDateString('es-ES', {day:'numeric', month:'short'});
            const dh = dt.toLocaleTimeString('es-ES', {hour:'2-digit', minute:'2-digit'});
            return `<div style="font-variant-numeric:tabular-nums; color:var(--texto-secundario);">
                      <b style="display:block;color:var(--texto-primario);font-weight:500;">${df}</b>${dh}
                    </div>`
          } 
        },
        { key: 'paciente',    label: 'Paciente', render: r => `<span style="font-weight:500;">${r.paciente??'—'}</span>` },
        { key: 'descripcion', label: 'Descripción', render: r => `<span style="color:var(--texto-secundario);font-size:12px;">${r.descripcion??'—'}</span>` },
        { key: 'monto',       label: 'Monto',       align: 'right', render: r => `<span style="font-weight:600;font-variant-numeric:tabular-nums;">S/ ${parseFloat(r.monto).toFixed(2)}</span>` },
        { key: 'tipopago',    label: 'Tipo Pago',   align: 'center', render: r => `<span class="badge badge-azul" style="font-size:11px;padding:2px 9px;">${r.tipopago??'—'}</span>` },
        { key: 'nick',        label: 'Usuario',     align: 'center', render: r => `<span style="color:var(--texto-terciario);font-size:12px;">${r.nick??'—'}</span>` },
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
    
    const sorted = data.sort((a,b) => parseFloat(b.cantidad) - parseFloat(a.cantidad))
    const sum = sorted.reduce((acc, curr) => acc + parseFloat(curr.cantidad), 0)

    let html = `<div style="font-size:13px;font-weight:600;color:var(--texto-secundario);margin:20px 0 10px;text-transform:uppercase;letter-spacing:.5px;">Distribución de Procedimientos (${sum} en total)</div>`
    html += '<div class="proc">'
    sorted.forEach(r => {
      const q = parseFloat(r.cantidad)
      const p = sum > 0 ? (q / sum * 100).toFixed(1) : 0
      html += `
        <div class="prow">
          <div>
            <div class="pname">${r.tipo_atencion}</div>
            <div class="bar"><i style="width:${p}%"></i></div>
          </div>
          <div class="pqty">${q}</div>
        </div>
      `
    })
    html += '</div>'
    wrap.innerHTML = html

  } catch (err) {
    wrap.innerHTML = `<div class="state-error">${err.message}</div>`
  }
}
