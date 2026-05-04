/**
 * login.js — Autenticación vía API JSON con UX cuidada:
 *  · Validación inline (sin alertas nativas)
 *  · Botón con estado de carga visual
 *  · Toggle mostrar/ocultar contraseña
 *  · Mensajes de error específicos según código HTTP
 */

const form        = document.getElementById('frmlogin')
const inputUser   = document.getElementById('user')
const inputPass   = document.getElementById('pass')
const btnSubmit   = document.getElementById('btn-login')
const btnTogglePw = document.getElementById('btn-toggle-pass')
const alertBox    = document.getElementById('login-alert')
const alertMsg    = document.getElementById('login-alert-msg')

// ── Toggle mostrar/ocultar contraseña ─────────────────────────────────────
btnTogglePw?.addEventListener('click', () => {
  const isPass = inputPass.type === 'password'
  inputPass.type = isPass ? 'text' : 'password'
  btnTogglePw.setAttribute('aria-label', isPass ? 'Ocultar contraseña' : 'Mostrar contraseña')
  btnTogglePw.classList.toggle('login-field__toggle--on', isPass)
})

// ── Limpiar error al volver a escribir ────────────────────────────────────
;[inputUser, inputPass].forEach(el => {
  el?.addEventListener('input', ocultarError)
})

// ── Submit ────────────────────────────────────────────────────────────────
form?.addEventListener('submit', async (e) => {
  e.preventDefault()
  ocultarError()

  const user = inputUser.value.trim()
  const pass = inputPass.value

  if (!user || !pass) {
    mostrarError('Ingrese usuario y contraseña.')
    ;(!user ? inputUser : inputPass).focus()
    return
  }

  setCargando(true)

  try {
    const res = await fetch('/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({ user, pass }),
    })
    const data   = await res.json().catch(() => ({}))
    const status = data.data?.status ?? data.status

    if (res.ok && status === 'INICIO') {
      btnSubmit.classList.add('login-submit--ok')
      setTimeout(() => window.location.assign('/'), 250)
      return
    }

    if (res.status === 429) {
      mostrarError(data.error ?? 'Demasiados intentos. Intente más tarde.')
    } else if (res.status === 401 || res.status === 403) {
      mostrarError(data.error ?? 'Usuario o contraseña incorrectos.')
      inputPass.select()
    } else {
      mostrarError(data.error ?? 'No se pudo iniciar sesión. Intente nuevamente.')
    }
  } catch {
    mostrarError('Error de conexión. Verifique su red e intente otra vez.')
  } finally {
    if (!btnSubmit.classList.contains('login-submit--ok')) setCargando(false)
  }
})

// ── Helpers ───────────────────────────────────────────────────────────────
function setCargando(on) {
  btnSubmit.disabled = on
  btnSubmit.classList.toggle('login-submit--loading', on)
}
function mostrarError(msg) {
  alertMsg.textContent = msg
  alertBox.hidden = false
}
function ocultarError() {
  alertBox.hidden = true
}
