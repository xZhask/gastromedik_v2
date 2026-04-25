/**
 * modal.js — Sistema de modal global reutilizable.
 * El modal vive en el shell (#modal-overlay, #modal-box, #modal-content).
 * Nunca mezcla HTML de negocio: sólo gestiona apertura/cierre/contenido.
 */

const overlay = () => document.getElementById('modal-overlay')
const box     = () => document.getElementById('modal-box')
const content = () => document.getElementById('modal-content')
const closeBtn = () => document.getElementById('modal-close')

let _onClose = null

export function openModal(html, { wide = false, onClose = null } = {}) {
  content().innerHTML = html
  overlay().hidden = false
  box().classList.toggle('modal-wide', wide)
  _onClose = onClose

  // Foco accesible
  requestAnimationFrame(() => {
    const first = box().querySelector('input, select, textarea, button:not(#modal-close)')
    first?.focus()
  })
}

export function closeModal() {
  overlay().hidden = true
  content().innerHTML = ''
  box().classList.remove('modal-wide')
  if (typeof _onClose === 'function') _onClose()
  _onClose = null
}

// Inicializar: cerrar al click en overlay o botón cerrar
export function initModal() {
  closeBtn().addEventListener('click', closeModal)
  overlay().addEventListener('click', (e) => {
    if (e.target === overlay()) closeModal()
  })
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !overlay().hidden) closeModal()
  })
}
