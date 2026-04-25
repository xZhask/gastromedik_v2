/**
 * views/cambiarpass.js — Cambio de contraseña del usuario actual.
 */
import { api }        from '../utils/api.js'
import { toastOk, toastError } from '../utils/toast.js'

const content = () => document.getElementById('app-content')

export async function CambiarPassView(iduser) {
  content().innerHTML = `
    <div class="cabecera"><h2>Cambiar Contraseña</h2></div>
    <div style="max-width:400px;">
      <form id="form-cambiar-pass" novalidate>
        <div class="cont-control"><label>Nueva contraseña</label><input type="password" name="pass"  required /></div>
        <div class="cont-control"><label>Confirmar</label><input type="password" name="pass2" required /></div>
        <div style="margin-top:12px;">
          <button type="submit" class="btn-primario">Actualizar Contraseña</button>
        </div>
      </form>
    </div>`

  document.getElementById('form-cambiar-pass').addEventListener('submit', async (e) => {
    e.preventDefault()
    const fd    = new FormData(e.target)
    const pass  = fd.get('pass')
    const pass2 = fd.get('pass2')
    if (!pass || pass !== pass2) { toastError('Las contraseñas no coinciden.'); return }
    try {
      await api.post('/api/personal/cambiar-pass', { dni: iduser, pass })
      toastOk('Contraseña actualizada correctamente.')
      e.target.reset()
    } catch (err) { toastError(err.message) }
  })
}
