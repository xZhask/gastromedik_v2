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
  dashboard:     () => import(`./views/dashboard.js${V}`).then(m => m.DashboardView()),
  hoy:           () => import(`./views/hoy.js${V}`).then(m => m.HoyView()),
  citas:         () => import(`./views/citas.js${V}`).then(m => m.CitasView()),
  calendario:    () => import(`./views/calendario.js${V}`).then(m => m.CalendarioView()),
  pacientes:     () => import(`./views/pacientes.js${V}`).then(m => m.PacientesView()),
  atenciones:    () => import(`./views/atenciones.js${V}`).then(m => m.AtencionesView()),
  caja:          () => import(`./views/caja.js${V}`).then(m => m.CajaView()),
  procedimientos:() => import(`./views/procedimientos.js${V}`).then(m => m.ProcedimientosView()),
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

export async function navigate(route, pushState = true) {
  if (!ROUTES[route]) {
    // Si no tiene ruta válida, intentar dashboard para admins, hoy para el resto
    if (CARGO === 1 || CARGO === 4) {
      route = 'dashboard'
    } else {
      route = 'hoy'
    }
  }
  if (route === currentRoute) return
  currentRoute = route
  
  if (pushState && window.location.hash !== `#${route}`) {
    window.history.pushState(null, '', `#${route}`)
  }
  
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

  // ── Modo Oscuro ─────────────────────────────────────────────────────────────
  const btnTheme = document.getElementById('btn-theme-toggle')
  const iconMoon = document.getElementById('icon-moon')
  const iconSun  = document.getElementById('icon-sun')
  
  function applyTheme(theme) {
    if (theme === 'dark') {
      document.body.dataset.theme = 'dark'
      if (iconMoon) iconMoon.style.display = 'none'
      if (iconSun) iconSun.style.display = 'block'
    } else {
      delete document.body.dataset.theme
      if (iconMoon) iconMoon.style.display = 'block'
      if (iconSun) iconSun.style.display = 'none'
    }
  }

  const savedTheme = localStorage.getItem('gm-theme')
  if (savedTheme) applyTheme(savedTheme)

  btnTheme?.addEventListener('click', () => {
    const isDark = document.body.dataset.theme === 'dark'
    const newTheme = isDark ? 'light' : 'dark'
    localStorage.setItem('gm-theme', newTheme)
    applyTheme(newTheme)
  })

  // ── Validación global de formularios ──────────────────────────────────────────
  document.addEventListener('invalid', (e) => {
    e.preventDefault()
    const field = e.target
    field.classList.add('is-invalid')
    let feedback = field.nextElementSibling
    if (!feedback || !feedback.classList.contains('invalid-feedback')) {
      feedback = document.createElement('div')
      feedback.classList.add('invalid-feedback')
      field.parentNode.insertBefore(feedback, field.nextSibling)
    }
    feedback.textContent = field.validationMessage
    feedback.style.display = 'block'
    
    // Enfocar el primer elemento inválido
    const form = field.closest('form')
    if (form) {
      const firstInvalid = form.querySelector('.is-invalid')
      if (firstInvalid === field) field.focus()
    }
  }, true)

  document.addEventListener('input', (e) => {
    const field = e.target
    if (field.classList?.contains('is-invalid')) {
      field.classList.remove('is-invalid')
      const feedback = field.nextElementSibling
      if (feedback && feedback.classList.contains('invalid-feedback')) {
        feedback.style.display = 'none'
      }
    }
  })

  window.addEventListener('hashchange', () => {
    const route = window.location.hash.slice(1)
    navigate(route || 'hoy', false)
  })

  const initialRoute = window.location.hash.slice(1)
  if (initialRoute) {
    navigate(initialRoute, false)
  } else {
    navigate('hoy')
  }

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
