import { api } from '../utils/api.js'
import { icon } from '../utils/icons.js'
import { toastError } from '../utils/toast.js'

export async function DashboardView() {
  const contentEl = document.getElementById('app-content')
  contentEl.innerHTML = `<div class="state-loading"><div class="spinner"></div><p>Cargando Dashboard...</p></div>`

  try {
    // 1. Obtener datos en paralelo
    const [resKpis, resFinanzas, resProc] = await Promise.all([
      api.get('/api/dashboard/kpis'),
      api.get('/api/dashboard/finanzas?dias=7'),
      api.get('/api/dashboard/procedimientos')
    ])

    const kpis = resKpis.data || {}
    const finanzas = resFinanzas.data || []
    const proc = resProc.data || []

    // 2. Renderizar esqueleto HTML
    contentEl.innerHTML = `
      <div class="vista-header">
        <h2>Dashboard Gerencial</h2>
        <p>Resumen de indicadores y rendimiento financiero</p>
      </div>

      <!-- Tarjetas KPI -->
      <div class="dash-kpis">
        <div class="dash-kpi" style="${(kpis.pacientes_mes || 0) == 0 ? 'opacity:0.4;' : ''}">
          <div class="dash-kpi__icon bg-azul">${icon('users')}</div>
          <div class="dash-kpi__info">
            <span class="dash-kpi__label">Pacientes Registrados</span>
            <span class="dash-kpi__value">${kpis.pacientes_mes || 0}</span>
          </div>
        </div>
        
        <div class="dash-kpi" style="${(kpis.citas_hoy || 0) == 0 ? 'opacity:0.4;' : ''}">
          <div class="dash-kpi__icon bg-ambar">${icon('clock')}</div>
          <div class="dash-kpi__info">
            <span class="dash-kpi__label">Citas de Hoy</span>
            <span class="dash-kpi__value">${kpis.citas_hoy || 0}</span>
          </div>
        </div>

        <div class="dash-kpi" style="${(kpis.ingresos_hoy || 0) == 0 ? 'opacity:0.4;' : ''}">
          <div class="dash-kpi__icon bg-verde">${icon('cash')}</div>
          <div class="dash-kpi__info">
            <span class="dash-kpi__label">Ingresos del Día</span>
            <span class="dash-kpi__value">S/ ${parseFloat(kpis.ingresos_hoy || 0).toFixed(2)}</span>
          </div>
        </div>

        <div class="dash-kpi" style="${(kpis.atenciones_hoy || 0) == 0 ? 'opacity:0.4;' : ''}">
          <div class="dash-kpi__icon bg-rojo">${icon('heartbeat')}</div>
          <div class="dash-kpi__info">
            <span class="dash-kpi__label">Atenciones Completadas</span>
            <span class="dash-kpi__value">${kpis.atenciones_hoy || 0}</span>
          </div>
        </div>
      </div>

      <!-- Gráficos -->
      <div class="dash-charts">
        <div class="dash-card">
          <div class="dash-card__header">
            <div class="dash-card__title">${icon('chart')} Ingresos vs Egresos (Últimos 7 días)</div>
          </div>
          <div class="dash-card__content">
            <canvas id="chartFinanzas" height="300"></canvas>
          </div>
        </div>

        <div class="dash-card">
          <div class="dash-card__header">
            <div class="dash-card__title">${icon('procedure')} Top Procedimientos (Mes)</div>
          </div>
          <div class="dash-card__content">
            <canvas id="chartProcedimientos" height="300"></canvas>
          </div>
        </div>
      </div>
    `

    // 3. Inicializar Gráficos (Chart.js debe estar cargado en shell.php)
    if (typeof Chart !== 'undefined') {
      const estiloBody = getComputedStyle(document.documentElement);
      const colorTexto = estiloBody.getPropertyValue('--gris-dark').trim() || '#888';
      const colorBorde = 'rgba(150, 150, 150, 0.1)'; // Líneas sutiles transparentes que funcionan en ambos temas
      
      Chart.defaults.color = colorTexto;
      Chart.defaults.scale.grid.color = colorBorde;
      Chart.defaults.scale.grid.borderColor = colorBorde;

      initChartFinanzas(finanzas)
      initChartProcedimientos(proc)
    } else {
      console.warn('Chart.js no está cargado.')
    }

  } catch (err) {
    console.error(err)
    toastError('Error al cargar datos del dashboard')
    contentEl.innerHTML = `<div class="state-error"><p>No se pudo cargar el dashboard.</p><button onclick="window.location.reload()" class="btn-primario" style="margin-top:10px;">Reintentar</button></div>`
  }
}

function initChartFinanzas(data) {
  const ctx = document.getElementById('chartFinanzas')
  if (!ctx) return

  const labels = data.map(d => formatearFechaCorta(d.fecha))
  const ingresos = data.map(d => parseFloat(d.ingresos))
  const egresos = data.map(d => parseFloat(d.egresos))

  new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'Ingresos (S/)',
          data: ingresos,
          borderColor: '#20bf6b',
          backgroundColor: 'rgba(32, 191, 107, 0.1)',
          borderWidth: 2,
          tension: 0.3,
          fill: true
        },
        {
          label: 'Egresos (S/)',
          data: egresos,
          borderColor: '#fc5c65',
          backgroundColor: 'rgba(252, 92, 101, 0.1)',
          borderWidth: 2,
          tension: 0.3,
          fill: true
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'top' },
        tooltip: {
          mode: 'index',
          intersect: false,
        }
      },
      scales: {
        y: { beginAtZero: true }
      }
    }
  })
}

function initChartProcedimientos(data) {
  const ctx = document.getElementById('chartProcedimientos')
  if (!ctx) return

  const labels = data.map(d => d.procedimiento)
  const values = data.map(d => parseInt(d.cantidad, 10))

  new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: labels,
      datasets: [{
        data: values,
        backgroundColor: [
          '#3867d6', '#f7b731', '#20bf6b', '#eb3b5a', '#a55eea', '#4b7bec'
        ],
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'bottom' }
      },
      cutout: '65%'
    }
  })
}

function formatearFechaCorta(fechaStr) {
  if (!fechaStr) return ''
  const partes = fechaStr.split('-') // YYYY-MM-DD
  if (partes.length !== 3) return fechaStr
  return `${partes[2]}/${partes[1]}`
}
