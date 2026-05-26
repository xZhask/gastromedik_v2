/**
 * views/pendientes.js — Pagos pendientes (A CUENTA / POR PAGAR).
 */
import { api }        from '../utils/api.js'
import { toastOk, toastError } from '../utils/toast.js'
import { icon }       from '../utils/icons.js'
import { confirm }    from '../components/confirm.js'
import { openModal, closeModal } from '../components/modal.js'
import { renderTable, wrapTable } from '../components/table.js'
import { skeletonTable } from '../components/skeleton.js'

const content = () => document.getElementById('app-content')

export async function PendientesView() {
  content().innerHTML = `
    <div class="citas-header">
      <div class="citas-header__top">
        <div class="citas-header__title" style="display:flex; align-items:baseline; gap:12px; flex-direction:row;">
          <h1 style="margin:0;">Pagos pendientes</h1>
          <span class="gm-page-header__sub" id="pend-sub" style="margin:0; color:var(--texto-terciario);"></span>
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
    let saldoTotal = 0
    let aCuenta = 0
    let porPagar = 0

    data.forEach(c => {
      const saldo = c.precio - c.abonado
      saldoTotal += saldo
      if (c.estado === 'A CUENTA') aCuenta++
      if (c.estado === 'POR PAGAR') porPagar++
    })

    const titleCase = str => str.toLowerCase().replace(/\b\w/g, ch => ch.toUpperCase())
    const formatFechaCorto = isoDate => {
      const dt = new Date(isoDate + 'T00:00:00')
      return dt.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }).replace('.', '')
    }

    const summaryHtml = `
      <div style="display:flex; gap:10px; margin-bottom:16px;">
        <div class="gm-stat" style="flex:1;">
          <span class="gm-stat__label">Saldo total pendiente</span>
          <span class="gm-stat__value" style="color:var(--rojo);">S/ ${saldoTotal.toFixed(2)}</span>
        </div>
        <div class="gm-stat" style="flex:1;">
          <span class="gm-stat__label">A cuenta</span>
          <span class="gm-stat__value" style="color:var(--ambar);">${aCuenta}</span>
        </div>
        <div class="gm-stat" style="flex:1;">
          <span class="gm-stat__label">Por pagar completo</span>
          <span class="gm-stat__value" style="color:var(--rojo);">${porPagar}</span>
        </div>
      </div>`

    const tableHtml = wrapTable(renderTable({
      columns: [
        {
          label: 'Fecha · Hora',
          render: r => `
            <div style="font-variant-numeric:tabular-nums; line-height:1.4;">
              <strong style="display:block; color:var(--texto-primario); font-size:13px; font-weight:500;">${formatFechaCorto(r.fecha)}</strong>
              <span style="color:var(--texto-secundario); font-size:12px;">${r.horario.substring(0, 5)}</span>
            </div>`
        },
        {
          label: 'Paciente',
          render: r => {
            const isCuenta = r.estado === 'A CUENTA'
            const badgeClass = isCuenta ? 'badge-ambar' : 'badge-rojo'
            const badgeText = isCuenta ? 'A cuenta' : 'Por pagar'
            const name = titleCase(r.paciente ?? '—')
            return `
            <div class="pac-cell">
              <div class="gm-avatar">${(r.paciente || '·').split(' ').map(p => p[0]).slice(0,2).join('').toUpperCase()}</div>
              <div class="pac-cell__info" style="min-width:0;">
                <span class="pac-cell__name" style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${name} <span class="badge ${badgeClass}" style="margin-left:6px;font-size:0.75em;padding:2px 6px;">${badgeText}</span></span>
                <span class="pac-cell__meta" style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${r.motivo ?? 'Sin motivo'} · <span style="font-variant-numeric:tabular-nums;color:var(--azul);">${r.telefono ?? 'Sin celular'}</span></span>
              </div>
            </div>`
          }
        },
        {
          label: 'Saldo', align: 'right',
          render: r => {
            const saldo = r.precio - r.abonado
            return `<div style="font-variant-numeric:tabular-nums; font-weight:600; color:var(--texto-primario); font-size:13px;">S/ ${saldo.toFixed(2)}</div>`
          }
        },
        {
          label: 'Pago', align: 'right',
          render: c => c.estado === 'A CUENTA'
            ? `<button class="btn-secundario btn-sm" data-action="pagar" style="color:var(--ambar);border-color:rgba(247,183,49,.4);background:rgba(247,183,49,.1);" title="Registrar pago"><i class="ti ti-cash"></i> Abonar</button>`
            : `<button class="btn-secundario btn-sm" data-action="pagar" style="color:var(--rojo);border-color:rgba(255,107,94,.4);background:rgba(255,107,94,.1);" title="Registrar pago"><i class="ti ti-cash"></i> Cobrar</button>`,
        },
      ],
      rows: data.map(c => ({ ...c, _id: c.idcita })),
    }))

    wrap.innerHTML = summaryHtml + tableHtml
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
    <div style="display:flex; gap:12px; margin-bottom:20px; background:var(--superficie-2); padding:14px; border-radius:var(--radius); border:1px solid var(--borde-sutil);">
      <div style="flex:1;">
        <div style="font-size:11px; color:var(--texto-terciario); text-transform:uppercase; letter-spacing:0.5px; margin-bottom:4px; font-weight:600;">Total</div>
        <div style="font-weight:600; font-size:17px; color:var(--texto-primario); font-variant-numeric:tabular-nums;">S/ ${precioTotal.toFixed(2)}</div>
      </div>
      <div style="flex:1;">
        <div style="font-size:11px; color:var(--texto-terciario); text-transform:uppercase; letter-spacing:0.5px; margin-bottom:4px; font-weight:600;">Pagado</div>
        <div style="font-weight:600; font-size:17px; color:var(--ambar); font-variant-numeric:tabular-nums;">S/ ${montoCuenta.toFixed(2)}</div>
      </div>
      <div style="flex:1;">
        <div style="font-size:11px; color:var(--texto-terciario); text-transform:uppercase; letter-spacing:0.5px; margin-bottom:4px; font-weight:600;">Saldo pendiente</div>
        <div style="font-weight:700; font-size:17px; color:var(--rojo); font-variant-numeric:tabular-nums;">S/ ${saldo.toFixed(2)}</div>
      </div>
    </div>
    <form id="form-pago-pend" novalidate>
      <input type="hidden" name="monto_total" value="${precioTotal}" />
      <div class="cont-group">
        <div class="cont-control" style="flex:2;">
          <label>Tipo de Pago</label>
          <select name="idtipopago">${optsTP}</select>
        </div>
        <div class="cont-control" style="flex:1;">
          <label>Monto a Pagar</label>
          <input type="number" name="monto_pagado" value="${saldo.toFixed(2)}" step="0.01" min="0" required />
        </div>
      </div>
      <div style="display:flex;gap:8px;margin-top:16px;">
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

      const successHtml = `
        <h2 class="modal-title">Pago registrado</h2>
        <p style="margin-bottom:16px;color:var(--texto-secundario);">
          El pago se guardó correctamente. ¿Deseas imprimir el ticket ahora?
        </p>
        <div style="display:flex;gap:8px;margin-top:12px;">
          <button type="button" class="btn-primario" id="btn-print-now">Sí, imprimir</button>
          <button type="button" class="btn-secundario" id="btn-print-later">Más tarde</button>
        </div>`
      
      openModal(successHtml)

      document.getElementById('btn-print-now').addEventListener('click', () => {
        const w = 800, h = 700
        const x = Math.round(screen.width  / 2 - w / 2)
        const y = Math.round(screen.height / 2 - h / 2)
        window.open(`/pdf/ticket/${idcita}`, '_ticket', `left=${x},top=${y},width=${w},height=${h},scrollbars=yes,menubar=no`)
        closeModal()
      })

      document.getElementById('btn-print-later').addEventListener('click', () => {
        closeModal()
      })
    } catch (err) { toastError(err.message) }
  })
}
