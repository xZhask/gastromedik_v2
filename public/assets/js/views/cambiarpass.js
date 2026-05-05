/**
 * views/cambiarpass.js — Cambio de contraseña del usuario actual.
 */
import { api }        from '../utils/api.js'
import { toastOk, toastError } from '../utils/toast.js'

const content = () => document.getElementById('app-content')

export async function CambiarPassView(iduser) {
  content().innerHTML = `
    <div class="citas-header">
      <div class="citas-header__top">
        <div class="citas-header__title">
          <h1>Cambiar contraseña</h1>
          <span class="gm-page-header__sub">Actualice la contraseña de su cuenta</span>
        </div>
      </div>
    </div>

    <div class="cambiarpass-card">
      <div class="gm-card" style="max-width: 460px;">
        <form id="form-pass" novalidate>
          <div class="cont-control">
            <label>Contraseña actual</label>
            <input type="password" name="actual" required autocomplete="current-password" />
          </div>
          <div class="cont-control">
            <label>Nueva contraseña</label>
            <input type="password" name="nueva" required autocomplete="new-password" />
            <span class="form-hint">Mínimo 6 caracteres.</span>
          </div>
          <div class="cont-control">
            <label>Confirmar nueva contraseña</label>
            <input type="password" name="confirma" required autocomplete="new-password" />
          </div>
          <div class="form-pac__actions">
            <button type="submit" class="btn-primario">Actualizar contraseña</button>
          </div>
        </form>
      </div>
    </div>`

  document.getElementById('form-pass').addEventListener('submit', async (e) => {
    e.preventDefault()
    const fd       = new FormData(e.target)
    const actual   = fd.get('actual')
    const nueva    = fd.get('nueva')
    const confirma = fd.get('confirma')
    if (nueva !== confirma) { toastError('Las nuevas contraseñas no coinciden.'); return }
    try {
      await api.post('/api/personal/cambiar-pass', { dni: iduser, pass_actual: actual, pass_nueva: nueva })
      toastOk('Contraseña actualizada correctamente.')
      e.target.reset()
    } catch (err) { toastError(err.message) }
  })
}
