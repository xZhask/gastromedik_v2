/**
 * skeleton.js — Helpers para placeholders de carga.
 * Devuelven HTML como string; la vista decide dónde inyectarlo.
 */

export function skeletonLines(count = 3) {
  return Array.from({ length: count }, () =>
    `<div class="gm-skeleton gm-skeleton--text" style="width:${60 + Math.random() * 35}%"></div>`
  ).join('')
}

export function skeletonTable(rows = 5) {
  const head = `<div class="gm-skeleton gm-skeleton--title"></div>`
  const body = Array.from({ length: rows }, () =>
    `<div class="gm-skeleton gm-skeleton--row"></div>`
  ).join('')
  return `<div class="cont-tabla" style="padding:16px">${head}${body}</div>`
}

export function skeletonCard() {
  return `
    <div class="gm-card">
      <div class="gm-skeleton gm-skeleton--title"></div>
      ${skeletonLines(4)}
    </div>`
}
