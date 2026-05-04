/**
 * modal.js — Sistema de modal global reutilizable.
 * El modal vive en el shell (#modal-overlay, #modal-box, #modal-content).
 * Nunca mezcla HTML de negocio: sólo gestiona apertura/cierre/contenido.
 */

const overlay  = () => document.getElementById('modal-overlay')
const box      = () => document.getElementById('modal-box')
const content  = () => document.getElementById('modal-content')
const closeBtn = () => document.getElementById('modal-close')

let _onClose = null

const SIZE_CLASS = { sm: 'modal-sm', md: null, lg: 'modal-wide', xl: 'modal-xl' }

function sanitize(s) {
  return String(s ?? '').replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]))
}

export function openModal(html, { wide = false, size = null, title = null, subtitle = null, onClose = null } = {}) {
  // Cabecera opcional
  let header = ''
  if (title != null) {
    header += `<h2 class="modal-title">${sanitize(title)}</h2>`
    if (subtitle != null) {
      header += `<p class="modal-subtitle">${sanitize(subtitle)}</p>`
    }
  }

  content().innerHTML = header + html

  // Clases de tamaño — size tiene prioridad sobre wide
  box().classList.remove('modal-sm', 'modal-wide', 'modal-xl')
  if (size && SIZE_CLASS[size]) {
    box().classList.add(SIZE_CLASS[size])
  } else if (wide) {
    box().classList.add('modal-wide')
  }

  overlay().hidden = false
  _onClose = onClose

  requestAnimationFrame(() => {
    const first = box().querySelector('input, select, textarea, button:not(#modal-close)')
    first?.focus()
  })
}

export function closeModal() {
  overlay().hidden = true
  content().innerHTML = ''
  box().classList.remove('modal-sm', 'modal-wide', 'modal-xl')
  if (typeof _onClose === 'function') _onClose()
  _onClose = null
}

export function initModal() {
  closeBtn().addEventListener('click', closeModal)
  overlay().addEventListener('click', (e) => {
    if (e.target === overlay()) closeModal()
  })
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !overlay().hidden) closeModal()
  })
}
