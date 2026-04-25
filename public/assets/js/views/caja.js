/**
 * views/caja.js — Caja diaria: apertura, cierre, ingresos, gastos, totales.
 */

import { api }        from '../utils/api.js'
import { toastOk, toastError } from '../utils/toast.js'
import { icon }       from '../utils/icons.js'
import { openModal, closeModal } from '../components/modal.js'
import { renderTable, wrapTable } from '../components/table.js'

const content = () => document.getElementById('app-content')
let CAJA_ACTIVA = null

export async function CajaView() {
  content().innerHTML = `
    <div class="cabecera">
      <h2>Caja</h2>
      <div class="cont-groupbotones controls-caja">
        <button class="btn-secundario" id="btn-aperturar" type="button">Aperturar Caja</button>
        <button class="btn-secundario" id="btn-cerrar" type="button" disabled>Cerrar Caja</button>
      </div>
      <p id="lbl-fecha-caja" style="font-size:.85rem;color:var(--gris-dark);"></p>
    </div>
    <div id="caja-cerrada" class="state-empty" hidden>
      <p>La caja está cerrada. Apertura para comenzar a registrar movimientos.</p>
    </div>
    <div id="caja-abierta" hidden>
      <div class="cont-caja" style="display:flex;gap:24px;align-items:flex-start;">
        <div style="flex:2;display:flex;flex-direction:column;gap:20px;">
          <div class="cont-tabla" id="tabla-ingresos-wrap">
            <div class="tabla-header">Últimos ingresos <button class="btn-secundario" id="btn-gasto" type="button" style="float:right;height:26px;font-size:.8rem;">${icon('plus')} Gasto</button></div>
            <div id="tabla-ingresos-body"></div>
          </div>
          <div class="cont-tabla">
            <div class="tabla-header">Gastos</div>
            <div id="tabla-gastos-body"></div>
          </div>
        </div>
        <div class="cont-tabla" style="flex:1;">
          <div class="tabla-header">Montos Totales</div>
          <div id="tabla-montos-body"></div>
        </div>
      </div>
    </div>`

  await verificarCaja()
  bindEventos()
}

async function verificarCaja() {
  try {
    const r = await api.get('/api/caja/verificar')
    if (r.data?.abierta) {
      CAJA_ACTIVA = r.data
      mostrarCajaAbierta()
    } else {
      mostrarCajaCerrada()
    }
  } catch { mostrarCajaCerrada() }
}

function mostrarCajaCerrada() {
  CAJA_ACTIVA = null
  document.getElementById('caja-cerrada').hidden = false
  document.getElementById('caja-abierta').hidden = true
  document.getElementById('btn-aperturar').disabled = false
  document.getElementById('btn-cerrar').disabled    = true
  document.getElementById('lbl-fecha-caja').textContent = ''
}

function mostrarCajaAbierta() {
  document.getElementById('caja-cerrada').hidden = true
  document.getElementById('caja-abierta').hidden = false
  document.getElementById('btn-aperturar').disabled = true
  document.getElementById('btn-cerrar').disabled    = false
  document.getElementById('lbl-fecha-caja').textContent = `Apertura: ${CAJA_ACTIVA?.fecha_apertura ?? ''}`
  cargarIngresos()
  cargarGastos()
  cargarMontos()
}

async function cargarIngresos() {
  if (!CAJA_ACTIVA) return
  const wrap = document.getElementById('tabla-ingresos-body')
  try {
    const { data } = await api.get('/api/caja/ultimos-ingresos', { idcajadiaria: CAJA_ACTIVA.idcajadiaria })
    wrap.innerHTML = renderTable({
      columns: [
        { key: 'fecha',       label: 'Hora',      align: 'center' },
        { key: 'descripcion', label: 'Descripción' },
        { key: 'monto',       label: 'Total',     align: 'center', render: r => `S/. ${parseFloat(r.monto).toFixed(2)}` },
        { key: 'nick',        label: 'Usuario',   align: 'center' },
        { key: 'tipopago',    label: 'Tipo Pago', align: 'center', render: r => `<span class="badge badge-azul">${r.tipopago}</span>` },
      ],
      rows: data,
      emptyMsg: 'Sin ingresos aún.',
    })
  } catch (err) { wrap.innerHTML = `<div class="state-error">${err.message}</div>` }
}

async function cargarGastos() {
  if (!CAJA_ACTIVA) return
  const wrap = document.getElementById('tabla-gastos-body')
  try {
    const { data } = await api.get('/api/caja/gastos', { idcajadiaria: CAJA_ACTIVA.idcajadiaria })
    wrap.innerHTML = renderTable({
      columns: [
        { key: 'fecha',       label: 'Hora',      align: 'center' },
        { key: 'descripcion', label: 'Descripción' },
        { key: 'monto',       label: 'Total',     align: 'center', render: r => `S/. ${parseFloat(r.monto).toFixed(2)}` },
        { key: 'nick',        label: 'Usuario',   align: 'center' },
      ],
      rows: data,
      emptyMsg: 'Sin gastos aún.',
    })
  } catch (err) { wrap.innerHTML = `<div class="state-error">${err.message}</div>` }
}

async function cargarMontos() {
  if (!CAJA_ACTIVA) return
  const wrap = document.getElementById('tabla-montos-body')
  try {
    const { data } = await api.get('/api/caja/montos', { idcajadiaria: CAJA_ACTIVA.idcajadiaria })
    const filas = [
      { desc: 'Efectivo',      monto: data.efectivo },
      ...data.otros_ingresos.map(o => ({ desc: o.tipopago, monto: o.suma })),
      { desc: 'Apertura caja', monto: data.monto_apertura },
      { desc: 'Gastos',        monto: data.gastos },
      { desc: 'Total en Caja', monto: data.total_caja,     bold: true },
      { desc: 'Total Utilidad',monto: data.total_utilidad, bold: true },
    ]
    wrap.innerHTML = renderTable({
      columns: [
        { key: 'desc',  label: 'Descripción', render: r => r.bold ? `<strong>${r.desc}</strong>` : r.desc },
        { key: 'monto', label: 'Monto', align: 'center',
          render: r => `${r.bold ? '<strong>' : ''}S/. ${parseFloat(r.monto ?? 0).toFixed(2)}${r.bold ? '</strong>' : ''}` },
      ],
      rows: filas,
      emptyMsg: 'Sin datos.',
    })
  } catch (err) { wrap.innerHTML = `<div class="state-error">${err.message}</div>` }
}

function bindEventos() {
  const el = content()

  el.querySelector('#btn-aperturar')?.addEventListener('click', async () => {
    const html = `
      <h2 class="modal-title">Aperturar Caja</h2>
      <form id="form-aperturar" novalidate>
        <div class="cont-control">
          <label>Monto inicial (S/.)</label>
          <input type="number" name="monto_inicial" value="0" step="0.01" min="0" required />
        </div>
        <div class="cont-control">
          <label>Descripción</label>
          <input type="text" name="descripcion" value="Apertura de caja" />
        </div>
        <div style="display:flex;gap:8px;margin-top:12px;">
          <button type="submit" class="btn-primario">Aperturar</button>
          <button type="button" class="btn-secundario btn-cancelar" id="btn-cancel-ap">Cancelar</button>
        </div>
      </form>`
    openModal(html)
    document.getElementById('btn-cancel-ap').addEventListener('click', closeModal)
    document.getElementById('form-aperturar').addEventListener('submit', async (e) => {
      e.preventDefault()
      const body = Object.fromEntries(new FormData(e.target).entries())
      try {
        const r = await api.post('/api/caja/aperturar', body)
        CAJA_ACTIVA = r.data
        toastOk('Caja aperturada.')
        closeModal()
        mostrarCajaAbierta()
      } catch (err) { toastError(err.message) }
    })
  })

  el.querySelector('#btn-cerrar')?.addEventListener('click', async () => {
    const html = `
      <h2 class="modal-title">Cerrar Caja</h2>
      <p style="margin-bottom:16px;color:var(--gris-dark);">
        El monto de cierre se calculará automáticamente (ingresos en efectivo + apertura − gastos).<br/>
        ¿Confirma el cierre de caja?
      </p>
      <div style="display:flex;gap:8px;margin-top:12px;">
        <button type="button" class="btn-primario btn-peligro" id="btn-confirm-cie">Cerrar Caja</button>
        <button type="button" class="btn-secundario" id="btn-cancel-cie">Cancelar</button>
      </div>`
    openModal(html)
    document.getElementById('btn-cancel-cie').addEventListener('click', closeModal)
    document.getElementById('btn-confirm-cie').addEventListener('click', async () => {
      try {
        await api.post('/api/caja/cerrar', { idcajadiaria: CAJA_ACTIVA.idcajadiaria })
        toastOk('Caja cerrada.')
        closeModal()
        mostrarCajaCerrada()
      } catch (err) { toastError(err.message) }
    })
  })

  el.querySelector('#btn-gasto')?.addEventListener('click', () => {
    const html = `
      <h2 class="modal-title">Registrar Gasto</h2>
      <form id="form-gasto" novalidate>
        <div class="cont-control"><label>Descripción</label><input type="text" name="descripcion" required /></div>
        <div class="cont-control"><label>Monto (S/.)</label><input type="number" name="monto" step="0.01" min="0.01" required /></div>
        <div style="display:flex;gap:8px;margin-top:12px;">
          <button type="submit" class="btn-primario">Registrar</button>
          <button type="button" class="btn-secundario btn-cancelar" id="btn-cancel-gasto">Cancelar</button>
        </div>
      </form>`
    openModal(html)
    document.getElementById('btn-cancel-gasto').addEventListener('click', closeModal)
    document.getElementById('form-gasto').addEventListener('submit', async (e) => {
      e.preventDefault()
      const body = Object.fromEntries(new FormData(e.target).entries())
      try {
        await api.post('/api/caja/gasto', body)
        toastOk('Gasto registrado.')
        closeModal()
        cargarGastos()
        cargarMontos()
      } catch (err) { toastError(err.message) }
    })
  })
}
