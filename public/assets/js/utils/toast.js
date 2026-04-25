const container = () => document.getElementById('toast-container')

export function toast(msg, type = 'success', duration = 3500) {
  const el = document.createElement('div')
  el.className = `toast toast-${type}`
  el.textContent = msg
  container().appendChild(el)
  requestAnimationFrame(() => el.classList.add('show'))
  setTimeout(() => {
    el.classList.remove('show')
    el.addEventListener('transitionend', () => el.remove(), { once: true })
  }, duration)
}

export const toastOk    = (msg) => toast(msg, 'success')
export const toastError = (msg) => toast(msg, 'error')
export const toastWarn  = (msg) => toast(msg, 'warning')
