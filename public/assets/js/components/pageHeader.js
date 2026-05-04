/**
 * pageHeader.js — Cabecera estándar de cada vista.
 * Devuelve HTML listo para inyectar al inicio del contenido.
 *
 * Uso:
 *   pageHeader({
 *     title: 'Pacientes',
 *     subtitle: '128 registrados',
 *     actions: `<button class="btn-primario" id="btn-nuevo">Nuevo</button>`,
 *     search: { id: 'q-paciente', placeholder: 'Buscar por nombre o DNI…' }
 *   })
 */
import { icon } from '../utils/icons.js'

export function pageHeader({ title, subtitle = '', actions = '', search = null } = {}) {
  const searchHtml = search
    ? `<div class="cont-busqueda">
         <span class="cont-busqueda__icon">${icon('search')}</span>
         <input type="text" id="${search.id}" placeholder="${escape(search.placeholder ?? 'Buscar…')}" autocomplete="off" />
       </div>`
    : ''

  return `
    <div class="gm-page-header">
      <div class="gm-page-header__title">
        <h1>${escape(title)}</h1>
        ${subtitle ? `<span class="gm-page-header__sub">${escape(subtitle)}</span>` : ''}
      </div>
      <div class="gm-page-header__actions">
        ${searchHtml}
        ${actions}
      </div>
    </div>`
}

function escape(s) {
  return String(s ?? '').replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]))
}
