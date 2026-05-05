/**
 * views/pendientes.js — Pagos pendientes (A CUENTA / POR PAGAR).
 */
import { api }        from '../utils/api.js'
import { toastOk, toastError } from '../utils/toast.js'
import { icon }       from '../utils/icons.js'
import { openModal, closeModal } from '../components/modal.js'
import { renderTable, wrapTable } from '../components/table.js'
import { skeletonTable } from '../components/skeleton.js'

const content = () => document.getElementById('app-content')

export async function PendientesView() {
  content().innerHTML = `
    <div class="citas-header">
      <div class="citas-header__top">
        <div class="citas-header__title">
          <h1>Pagos pendientes</h1>
          <span class="gm-page-header__sub" id="pend-sub"></span>
        </div>
      </div>
    </div>
    <div id="tabla-pend-wrap"></div>`
  await cargar()
  bindEventos()
}

async function cargar() {
  const wrap = document.getElementById('tabla-pend-wrap')
  if (!wrap) return
  wrap.innerHTML = skeletonTable(5, 6)
  try {
    const { data } = await api.get('/api/citas/pendientes')
    document.getElementById('pend-sub').textContent = `${data.length} pacientes con saldo`
    if (!data.length) {
      wrap.innerHTML = `
        <div class="gm-empty">
          <div class="gm-empty__icon">${icon('pending')}</div>
          <p class="gm-empty__text">No hay pagos pendientes.</p>
        </div>`
      return
    }
    wrap.innerHTML = wrapTable(renderTable({
      columns: [
        { key: 'fecha',    label: 'Fecha',    align: 'center' },
        { key: 'horario',  label: 'Hora',     align: 'center' },
        {
          label: 'Paciente',
          render: r => `
            <div class="pac-cell">
              <div class="gm-avatar">${(r.paciente || '·').split(' ').map(p => p[0]).slice(0,2).join('').toUpperCase()}</div>
              <div class="pac-cell__info">
                <span class="pac-cell__name">${r.paciente ?? '—'}</span>
                <span class="pac-cell__meta">${r.motivo ?? 'Sin motivo'}</span>
              </div>
            </div>`,
        },
        { key: 'telefono', label: 'Celular',  align: 'center' },
        {
          label: 'Pago', align: 'center',
          render: c => c.estado === 'A CUENTA'
            ? `<button class="link-btn lnk-Ambar" data-action="pagar" title="Registrar pago">A Cuenta</button>`
            : `<button class="link-btn lnk-red"   data-action="pagar" title="Registrar pago">Reg. Pago</button>`,
        },
      ],
      rows: data.map(c => ({ ...c, _id: c.idcita })),
    }))
  } catch (err) {
    wrap.innerHTML = `<div class="state-error">${err.message}</div>`
  }
}

function bindEventos() {
  content().addEventListener('click', async (e) => {
    const btn = e.target.closest('[data-action="pagar"]')
    if (!btn) return
    const tr     = btn.closest('tr')
    const idcita = parseInt(tr?.dataset.id)
    if (!idcita) return
    const cajaOk = await asegurarCajaAbierta()
    if (cajaOk) await abrirPago(idcita)
  })
}

async function asegurarCajaAbierta() {
  try {
    const r = await api.get('/api/caja/verificar')
    if (r.data?.abierta) return true
  } catch {
    toastError('No se pudo verificar el estado de la caja.')
    return false
  }

  return new Promise((resolve) => {
    const html = `
      <h2 class="modal-title">Caja cerrada</h2>
      <p style="margin-bottom:16px;color:var(--gris-dark);">
        La caja del día no está aperturada.<br/>
        ¿Desea aperturarla para registrar el pago?
      </p>
      <form id="form-aperturar-inline" novalidate>
        <div class="cont-group">
          <div class="cont-control">
            <label>Monto inicial (S/.)</label>
            <input type="number" name="monto_inicial" value="0" step="0.01" min="0" required />
          </div>
          <div class="cont-control">
            <label>Descripción</label>
            <input type="text" name="descripcion" value="Apertura de caja" />
          </div>
        </div>
        <div style="display:flex;gap:8px;margin-top:12px;">
          <button type="submit" class="btn-primario">Aperturar y continuar</button>
          <button type="button" class="btn-secundario" id="btn-cancel-ap-inline">Cancelar</button>
        </div>
      </form>`

    openModal(html)

    document.getElementById('btn-cancel-ap-inline').addEventListener('click', () => {
      closeModal()
      resolve(false)
    })

    document.getElementById('form-aperturar-inline').addEventListener('submit', async (e) => {
      e.preventDefault()
      const body = Object.fromEntries(new FormData(e.target).entries())
      try {
        await api.post('/api/caja/aperturar', body)
        toastOk('Caja aperturada.')
        closeModal()
        resolve(true)
      } catch (err) {
        toastError(err.message)
        resolve(false)
      }
    })
  })
}

async function abrirPago(idcita) {
  const tiposPago = window.__TIPOS_PAGO__ ?? []
  const { data: cita } = await api.get(`/api/citas/${idcita}`)
  const precioTotal = parseFloat(cita.precio ?? 0)
  let montoCuenta = 0
  try {
    const r = await api.get('/api/caja/movimiento-cuenta', { idcita })
    montoCuenta = parseFloat(r.data?.monto ?? 0)
  } catch { /* primer pago */ }
  const saldo = precioTotal - montoCuenta

  const optsTP = tiposPago.map(t => `<option value="${t.idtipopago}">${t.tipopago}</option>`).join('')
  const html = `
    <h2 class="modal-title">Registrar Pago</h2>
    <p style="margin-bottom:12px;color:var(--gris-dark);">
      Paciente: <strong>${cita.apellidospaciente}, ${cita.nombrepaciente}</strong><br/>
      Motivo: ${cita.motivo}
    </p>
    <form id="form-pago-pend" novalidate>
      <div class="cont-group">
        <div class="cont-control"><label>Tipo de Pago</label><select name="idtipopago">${optsTP}</select></div>
        <div class="cont-control"><label>Monto Total</label><input type="number" name="monto_total" value="${precioTotal}" readonly /></div>
        <div class="cont-control"><label>Monto Pagado</label><input type="number" value="${montoCuenta.toFixed(2)}" readonly /></div>
        <div class="cont-control"><label>Monto a Pagar (saldo)</label><input type="number" name="monto_pagado" value="${saldo.toFixed(2)}" step="0.01" min="0" required /></div>
      </div>
      <div style="display:flex;gap:8px;margin-top:12px;">
        <button type="submit" class="btn-primario">Registrar Pago</button>
        <button type="button" class="btn-secundario btn-cancelar" id="btn-cancel-pp">Cancelar</button>
      </div>
    </form>`

  openModal(html)
  document.getElementById('btn-cancel-pp').addEventListener('click', closeModal)
  document.getElementById('form-pago-pend').addEventListener('submit', async (e) => {
    e.preventDefault()
    const body = { ...Object.fromEntries(new FormData(e.target).entries()), idcita, motivo: cita.motivo }
    try {
      await api.post('/api/caja/pago', body)
      toastOk('Pago registrado.')
      closeModal()
      cargar()

      if (confirm('Pago registrado correctamente. ¿Deseas imprimir el ticket ahora?')) {
        try {
          await api.post(`/pos/ticket/${idcita}/print`, {})
          toastOk('Ticket impreso correctamente.')
        } catch (printErr) {
          toastError('No se pudo imprimir el ticket: ' + printErr.message)
        }
      }
    } catch (err) { toastError(err.message) }
  })
}
