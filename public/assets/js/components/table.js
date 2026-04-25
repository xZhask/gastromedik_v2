/**
 * table.js — Renderizador de tablas reutilizable.
 * Recibe columnas + datos y produce HTML; sin lógica de negocio.
 */

export function renderTable({ columns, rows, emptyMsg = 'Sin resultados', rowClass = null }) {
  const thead = `<thead><tr>${columns.map(c =>
    `<th class="${c.align ? 'ta-' + c.align : ''}">${c.label}</th>`
  ).join('')}</tr></thead>`

  if (!rows.length) {
    return `<table class="gm-table">${thead}
      <tbody><tr><td colspan="${columns.length}" class="ta-center state-empty-cell">${emptyMsg}</td></tr></tbody>
    </table>`
  }

  const tbody = rows.map(row => {
    const cls = rowClass ? rowClass(row) : ''
    const cells = columns.map(col => {
      const val = typeof col.render === 'function' ? col.render(row) : (row[col.key] ?? '')
      return `<td class="${col.align ? 'ta-' + col.align : ''}">${val}</td>`
    }).join('')
    return `<tr class="${cls}" data-id="${row._id ?? ''}">${cells}</tr>`
  }).join('')

  return `<table class="gm-table">${thead}<tbody>${tbody}</tbody></table>`
}

export function wrapTable(tableHTML) {
  return `<div class="cont-tabla">${tableHTML}</div>`
}
