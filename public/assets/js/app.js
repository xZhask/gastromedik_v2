/**
 * app.js — Router SPA de Gastromedik.
 * Sin funciones globales. Navegación por data-route.
 * Cada vista es un módulo JS independiente con carga lazy.
 */

import { api }        from './utils/api.js'
import { toastError } from './utils/toast.js'
import { renderSidebar, setActiveRoute } from './components/sidebar.js'
import { initModal }  from './components/modal.js'

const CARGO  = parseInt(document.querySelector('meta[name="user-cargo"]')?.content ?? '0')
const IDUSER = document.querySelector('meta[name="user-id"]')?.content ?? ''

// ── Rutas lazy ────────────────────────────────────────────────────────────────

const V = window.__V__ ? `?v=${window.__V__}` : ''

const ROUTES = {
  hoy:           () => import(`./views/hoy.js${V}`).then(m => m.HoyView()),
  citas:         () => import(`./views/citas.js${V}`).then(m => m.CitasView()),
  pacientes:     () => import(`./views/pacientes.js${V}`).then(m => m.PacientesView()),
  atenciones:    () => import(`./views/atenciones.js${V}`).then(m => m.AtencionesView()),
  caja:          () => import(`./views/caja.js${V}`).then(m => m.CajaView()),
  procedimientos:() => import(`./views/procedimientos.js${V}`).then(m => m.ProcedimientosView()),
  reportproc:    () => import(`./views/reportproc.js${V}`).then(m => m.ReportProcView()),
  externos:      () => import(`./views/externos.js${V}`).then(m => m.ExternosView()),
  medicamentos:  () => import(`./views/medicamentos.js${V}`).then(m => m.MedicamentosView()),
  pendientes:    () => import(`./views/pendientes.js${V}`).then(m => m.PendientesView()),
  usuarios:      () => import(`./views/usuarios.js${V}`).then(m => m.UsuariosView()),
  reportes:      () => import(`./views/reportes.js${V}`).then(m => m.ReportesView()),
  cambiarpass:   () => import(`./views/cambiarpass.js${V}`).then(m => m.CambiarPassView(IDUSER)),
}

// ── Router ────────────────────────────────────────────────────────────────────

const contentEl = document.getElementById('app-content')
let currentRoute = null

export async function navigate(route) {
  if (!ROUTES[route]) route = 'hoy'
  if (route === currentRoute) return
  currentRoute = route
  setActiveRoute(route)
  contentEl.innerHTML = `<div class="state-loading"><div class="spinner"></div><p>Cargando...</p></div>`
  try {
    await ROUTES[route]()
  } catch (err) {
    console.error('[Router]', route, err)
    contentEl.innerHTML = `<div class="state-error"><p>Error al cargar la sección "${route}".</p><small>${err.message}</small></div>`
    toastError('Error al cargar la sección.')
  }
}

// ── Init ──────────────────────────────────────────────────────────────────────

function init() {
  initModal()
  renderSidebar(CARGO, navigate)

  document.getElementById('btn-toggle')?.addEventListener('click', () => {
    document.getElementById('app-sidebar').classList.toggle('activo')
  })

  document.getElementById('btn-logout')?.addEventListener('click', async () => {
    try { await api.post('/logout', {}) } finally { window.location.assign('/login') }
  })

  navigate('hoy')

  // Keep-alive cada 20 min si hay actividad
  let activo = false
  document.addEventListener('click',     () => { activo = true })
  document.addEventListener('keydown',   () => { activo = true })
  document.addEventListener('mousemove', () => { activo = true })
  setInterval(async () => {
    if (!activo) return
    activo = false
    try { await api.get('/check-session') } catch { /* api.js redirige */ }
  }, 20 * 60 * 1000)
}

init()
