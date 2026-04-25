/**
 * confirm.js — Diálogo de confirmación nativo sin dependencias externas.
 */

import { openModal, closeModal } from './modal.js'
import { icon } from '../utils/icons.js'

/**
 * Muestra un diálogo de confirmación y retorna una promesa que resuelve true/false.
 */
export function confirm({ title, text, confirmLabel = 'Confirmar', cancelLabel = 'Cancelar', danger = false }) {
  return new Promise((resolve) => {
    const html = `
      <div class="confirm-dialog">
        <div class="confirm-icon confirm-icon-${danger ? 'danger' : 'warn'}">
          ${icon('pending')}
        </div>
        <h3 class="confirm-title">${title}</h3>
        ${text ? `<p class="confirm-text">${text}</p>` : ''}
        <div class="confirm-actions">
          <button id="confirm-cancel" class="btn-secundario" type="button">${cancelLabel}</button>
          <button id="confirm-ok" class="btn-${danger ? 'peligro' : 'primario'}" type="button">${confirmLabel}</button>
        </div>
      </div>`

    openModal(html, {
      onClose: () => resolve(false),
    })

    document.getElementById('confirm-ok').addEventListener('click', () => {
      closeModal()
      resolve(true)
    }, { once: true })

    document.getElementById('confirm-cancel').addEventListener('click', () => {
      closeModal()
      resolve(false)
    }, { once: true })
  })
}
