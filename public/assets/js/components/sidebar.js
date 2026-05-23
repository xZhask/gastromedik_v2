/**
 * sidebar.js — Renderiza la navegación lateral a partir de datos,
 * sin lógica de negocio. La activación de rutas es responsabilidad del router.
 */

import { icon } from '../utils/icons.js'

const NAV_ITEMS = [
  { route: 'dashboard',     label: 'Dashboard',               iconName: 'chart',     cargo: [1, 4] },
  { route: 'hoy',           label: 'Hoy',                     iconName: 'today',     cargo: [1, 2, 3, 4] },
  { route: 'citas',         label: 'Citas',                   iconName: 'clock',     cargo: [1, 4] },
  { route: 'calendario',    label: 'Calendario',              iconName: 'calendar',  cargo: [1, 4] },
  { route: 'pacientes',     label: 'Pacientes',               iconName: 'patient',   cargo: [1, 2, 3, 4] },
  { route: 'atenciones',    label: 'Atenciones',              iconName: 'heartbeat', cargo: [1, 2, 4] },
  { divider: true, cargo: [1, 4] },
  { route: 'caja',          label: 'Caja',                    iconName: 'cash',      cargo: [1, 4] },
  { route: 'procedimientos',label: 'Procedimientos',           iconName: 'procedure', cargo: [1, 4] },
  { divider: true, cargo: [1, 4] },
  { route: 'externos',      label: 'Proc. Externos',          iconName: 'external',  cargo: [1, 4] },
  { route: 'medicamentos',  label: 'Medicamentos e Insumos',  iconName: 'pill',      cargo: [1, 4] },
  { route: 'pendientes',    label: 'Pagos Pendientes',        iconName: 'pending',   cargo: [1, 4] },
  { divider: true, cargo: [1, 4] },
  { route: 'usuarios',      label: 'Usuarios',                iconName: 'users',     cargo: [1, 4] },
  { route: 'reportes',      label: 'Reportes',                iconName: 'report',    cargo: [1] },
  { divider: true, cargo: [1, 2, 3, 4] },
  { route: 'cambiarpass',   label: 'Cambiar Contraseña',      iconName: 'key',       cargo: [1, 2, 3, 4] },
]

export function renderSidebar(cargo, navigate) {
  const nav = document.getElementById('app-nav')
  if (!nav) return

  nav.innerHTML = NAV_ITEMS
    .filter(item => {
      if (!item.cargo) return true
      return item.cargo.includes(cargo)
    })
    .map(item => {
      if (item.divider) return `<div class="nav-divider"></div>`
      return `
        <button
          class="nav-item"
          data-route="${item.route}"
          type="button"
          aria-label="${item.label}"
        >
          <span class="nav-icon">${icon(item.iconName)}</span>
          <span class="nav-label">${item.label}</span>
        </button>`
    })
    .join('')

  // Delegación: un solo listener para toda la nav
  nav.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-route]')
    if (!btn) return
    navigate(btn.dataset.route)
  })
}

export function setActiveRoute(route) {
  document.querySelectorAll('#app-nav .nav-item').forEach(btn => {
    btn.classList.toggle('activo', btn.dataset.route === route)
    btn.setAttribute('aria-current', btn.dataset.route === route ? 'page' : 'false')
  })
}
