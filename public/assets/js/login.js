/**
 * login.js - Autenticacion via JSON API.
 */
document.getElementById('frmlogin')?.addEventListener('submit', async (e) => {
  e.preventDefault()
  const btn = e.target.querySelector('button[type="submit"]')
  btn.disabled = true
  btn.textContent = 'Ingresando...'

  const fd = new FormData(e.target)
  const body = { user: fd.get('user'), pass: fd.get('pass') }

  try {
    const res = await fetch('/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(body),
    })
    const data = await res.json()
    const status = data.data?.status ?? data.status

    if (res.ok && status === 'INICIO') {
      window.location.assign('/')
    } else if (res.status === 429) {
      mostrarError(data.error ?? 'Demasiados intentos. Intente mas tarde.')
    } else {
      mostrarError(data.error ?? 'Usuario o contrasena incorrectos.')
    }
  } catch {
    mostrarError('Error de conexion. Verifique su red.')
  } finally {
    btn.disabled = false
    btn.textContent = 'Ingresar'
  }
})

function mostrarError(msg) {
  let el = document.getElementById('login-error')
  if (!el) {
    el = document.createElement('p')
    el.id = 'login-error'
    el.style.cssText = 'color:var(--rojo);font-size:.85rem;text-align:center;margin-top:-8px;'
    document.getElementById('frmlogin').insertBefore(el, document.querySelector('.formlogin button'))
  }
  el.textContent = msg
}
