# Petición para Claude Code — Rediseño del modal "Registrar atención" (Gastro-Medik)

Mejora estética y de densidad del modal de registro de atención. Todos los cambios son de UI/CSS y markup; **no toques la lógica JS de tabs, submit ni fetch**. Archivos a editar:

- `public/assets/css/estilos.css`
- `public/assets/js/views/hoy.js`

---

## 1. Signos vitales: tarjeta compacta de dos pisos (label con fondo de color)

**1a. En `hoy.js`**, reemplaza el bloque `signosHtml` (la función `.map()` que arma las tarjetas de signos vitales, ~línea 259) por esta versión. El label va dentro de `signo-card__label` y el valor dentro de `signo-card__value`; **no añadas estilos inline**, todo el estilo va en CSS:

```js
const signosHtml = ['fr','pa','temp','so2','peso']
  .map(k => {
    const labels = { fr:'FC', pa:'PA', temp:'T°', so2:'SO₂', peso:'Peso' }
    const units  = { fr:'lpm', pa:'mmHg', temp:'°C', so2:'%', peso:'kg' }
    const v = atencion?.[k]
    return `
      <div class="signo-card">
        <div class="signo-card__label">${labels[k]}</div>
        <div class="signo-card__value">${v && v !== '-' ? escapeHtmlLocal(v) : '—'}<span class="signo-card__unit">${units[k]}</span></div>
      </div>`
  }).join('')
```

(La estructura del HTML casi no cambia; el rediseño se hace en CSS abajo.)

**1b. En `estilos.css`**, reemplaza por completo las reglas `.signo-card`, `.signo-card__label`, `.signo-card__value` y `.signo-card__unit` (~líneas 1292–1318) por estas. La clave: la tarjeta es de dos pisos, el label lleva fondo `--azul-light` y el valor va sobre fondo de input normal (`--superficie`):

```css
.signo-card {
  border: 1px solid var(--gris-border);
  border-radius: var(--radius-sm);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}
.signo-card__label {
  font-size: .68rem;
  font-weight: 700;
  letter-spacing: .5px;
  text-transform: uppercase;
  color: var(--azul-dark);
  background: var(--azul-light);
  padding: 5px 8px;
  text-align: center;
}
.signo-card__value {
  background: var(--superficie);
  padding: 9px 8px;
  text-align: center;
  font-size: 1rem;
  font-weight: 700;
  color: var(--texto-primario);
  font-variant-numeric: tabular-nums;
}
.signo-card__unit {
  font-size: .7rem;
  font-weight: 500;
  color: var(--texto-terciario);
  margin-left: 3px;
}
```

**1c.** En `.signos-grid` (~línea 1286 y duplicada ~línea 2211), forzar 5 columnas en una sola línea y reducir margen inferior:

```css
.signos-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 8px;
  margin-bottom: 18px;
}
@media (max-width: 560px) {
  .signos-grid { grid-template-columns: repeat(2, 1fr); }
}
```

---

## 2. Arreglar el borde superior "escalonado" del modal

El problema: `.modal-box.modal-xl` tiene `border` + `border-radius` + `overflow:hidden`, y `.aten-modal__head` es `sticky` con fondo propio, por lo que al hacer scroll la cabecera tapa la curva y deja ver una línea recta del borde sobre el redondeo.

**2a.** En `estilos.css`, en la regla `.modal-box.modal-xl` (~línea 1574), **quita el `border`** y deja que el `box-shadow` defina el contorno:

```css
.modal-box.modal-xl {
  padding: 0;
  overflow: hidden;
  border: none;
}
```

**2b.** En `.aten-modal__head` (~línea 1579), añade redondeo explícito a las esquinas superiores para que coincida con el `border-radius: 16px` del modal-box:

```css
.aten-modal__head {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 20px;
  border-bottom: 1px solid var(--borde-sutil);
  background: var(--superficie);
  position: sticky;
  top: 0;
  z-index: 2;
  border-top-left-radius: 16px;
  border-top-right-radius: 16px;
}
```

**2c. En `hoy.js`**, en la cabecera del modal (`<header class="aten-modal__head" style="...">`, ~línea 274) **elimina el atributo `style` inline completo** (ya está cubierto por el CSS de 2b). Debe quedar simplemente:

```html
<header class="aten-modal__head">
```

---

## 3. Reducir el scroll (menos alto vertical)

**3a.** En `estilos.css`, baja el margen de las secciones, `.aten-section` (~línea 1639):

```css
.aten-section { margin-bottom: 18px; scroll-margin-top: 80px; }
```

**3b.** En `hoy.js`, reduce las filas de los `soapCard` más altos. En las llamadas a `soapCard(...)` (~líneas 343–348), cambia el último parámetro (rows):

- `anamnesis`: `5` → `4`
- `examen_fisico`: `5` → `4`
- `tratamiento`: `5` → `4`

Deja `molestia`, `antecedentes` y `diagnostico` como están.

---

## 4. Botón de cierre (×) en la cabecera

**4a. En `hoy.js`**, dentro del `<header class="aten-modal__head">`, después del bloque del nombre/DNI, añade un botón de cierre:

```html
<button type="button" class="aten-modal__close" id="btn-close-aten" aria-label="Cerrar">
  <i class="ph ph-x"></i>
</button>
```

> Usa el set de iconos que ya emplee el proyecto (Phosphor/Tabler/etc.). Si no hay webfont de iconos disponible, usa el carácter `×` dentro del botón.

**4b. En `hoy.js`**, junto al listener de `btn-cancel-aten` (~línea 389), añade el listener de cierre:

```js
document.getElementById('btn-close-aten')?.addEventListener('click', closeModal)
```

**4c. En `estilos.css`**, añade la regla del botón (colócala junto a `.aten-modal__head`):

```css
.aten-modal__close {
  margin-left: auto;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: transparent;
  color: var(--texto-terciario);
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-size: 1.1rem;
  transition: var(--transition);
}
.aten-modal__close:hover {
  background: var(--gris-light);
  color: var(--texto-primario);
}
```

---

## 5. Footer con fondo sutil

En `estilos.css`, en `.aten-modal__foot` (~línea 1627), cambia el fondo de `var(--superficie)` a `var(--superficie-3)` y redondea las esquinas inferiores:

```css
.aten-modal__foot {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 12px 20px;
  border-top: 1px solid var(--borde-sutil);
  background: var(--superficie-3);
  position: sticky;
  bottom: 0;
  z-index: 2;
  border-bottom-left-radius: 16px;
  border-bottom-right-radius: 16px;
}
```

---

## Verificación final

1. Abre el modal "Registrar atención" desde la vista **Hoy** y confirma que los 5 signos vitales caen en **una sola fila**, con el código sobre fondo azul claro y el valor sobre fondo blanco.
2. Haz **scroll dentro del modal** y verifica que las esquinas superiores ya **no muestran el borde recto/escalonado**.
3. Comprueba que el botón **×** cierra el modal.
4. Verifica que **modo claro y modo oscuro** se vean correctos (todas las reglas usan variables existentes: `--azul-light`, `--azul-dark`, `--superficie`, `--superficie-3`, `--texto-primario`, `--texto-terciario`, `--gris-border`, `--gris-light`).
5. Confirma que **no se rompió** la lógica de tabs (Atención / Adjuntos / Historial) ni el submit del formulario.
