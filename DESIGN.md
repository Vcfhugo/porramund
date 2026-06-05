# Design System — Porra Mundial 2026
_Actualizado · Brasil 2014 · Tema claro editorial · Jun 2026_

## Filosofía
Terrace de verano en Brasil. Teléfonos en mano, WhatsApp con los amigos, el Mundial en la tele. Periódico deportivo latinoamericano de los 70s. Anti-patrones: dark theme corporativo, dashboard SaaS azul frío, glassmorphism, radios uniformes.

**Tema**: claro / editorial. El usuario revisa resultados bajo el sol, no en una sala oscura.

## Color Tokens

```css
/* ── Base — crema editorial, papel de periódico deportivo ── */
--ink:       #F4F0E6   /* app bg: crema cálida */
--ink-2:     #EAE5D8   /* sidebar, sheets, modales */
--surface:   #FDFCF8   /* cards: blanco con calor */
--surface-2: #EEE9DC   /* inputs, cards elevadas */
--surface-3: #E4DDD0   /* hover, activos */
--line:      rgba(51,111,27,.11)
--line-2:    rgba(51,111,27,.22)

/* ── Paleta Brasil 2014 ── */
--lime:      #336F1B   /* verde brasil — PRIMARY, CTAs, activo */
--lime-rgb:  51,111,27
--lime-deep: #1D4B0A   /* hover del botón verde */
--gold:      #FDD301   /* amarillo brasil — scores, contadores */
--gold-rgb:  253,211,1
--coral:     #D8131A   /* rojo vivo — live, peligro */
--coral-rgb: 216,19,26
--orange:    #F79516   /* naranja — alertas secundarias */
--orange-rgb:247,149,22
--green:     #ABCB2D   /* verde lima — positivo */
--green-rgb: 171,203,45
--navy:      #003469   /* azul editorial — headings, contraste */
--navy-rgb:  0,52,105

/* ── Texto editorial ── */
--text:    #003469   /* navy — lectura editorial */
--muted:   #4E6A5C   /* gray-green cálido */
--muted-2: #8EA898   /* subtle hints */

--accent:     var(--lime)   /* verde como primary */
--accent-ink: #fff
```

### Roles de color
| Color | Hex | Uso |
|-------|-----|-----|
| Verde brasil | `#336F1B` | Botones primary, tabs activos, selected states, focus rings |
| Amarillo brasil | `#FDD301` | Scores, contadores countdown, highlights de datos |
| Verde lima | `#ABCB2D` | Tags positivos, naturaleza, secundario |
| Navy | `#003469` | Texto editorial principal, headings |
| Rojo | `#D8131A` | Live, urgencia, peligro, alertas |
| Naranja | `#F79516` | Warnings, CTAs secundarios |

## Tipografía

| Rol | Familia | Origen | Tamaño típico |
|-----|---------|--------|---------------|
| **Poster/Display** | `Bebas Neue` | Google Fonts | 24–72px |
| **Body/UI** | `Barlow` | Google Fonts | 11–16px |
| **Marcadores/Scores** | `Brasil2014Numeros` | Local `fonts/brasil2014numeros.ttf` | 28–48px |
| **Datos/Tiempo** | `CopaEspanaData` | Local `fonts/copaespanadata.ttf` | 13–36px |
| **Mono/Códigos** | `Space Mono` | Google Fonts | 11–22px |

**Variables CSS:**
```css
--font-poster: 'Bebas Neue', 'Arial Narrow', Impact, sans-serif;
--font-body:   'Barlow', system-ui, sans-serif;
--font-data:   'Brasil2014Numeros', 'Barlow Condensed', 'Arial Narrow', sans-serif;
--font-score:  'CopaEspanaData', 'Brasil2014Numeros', 'Barlow Condensed', sans-serif;
--font-mono:   'Space Mono', 'Courier New', monospace;
```

**Usos por fuente:**

`Bebas Neue` (poster, display):
- `.appbar .title` — 32px navy
- `.sec-head h2` — 24px navy
- `.bk-col .rnd` — 13px etiquetas de ronda

`Brasil2014Numeros` (`--font-data`):
- `.bignum` — 40–72px, scores grandes, puntos totales
- `.lb-rank` — 22px posiciones del ranking
- `.rule-pts` — 17px badges de puntuación
- `.grp-pos` — 13px posición en grupos
- Fallback: Barlow Condensed si la fuente no carga

`CopaEspanaData` (`--font-score`):
- `.match .mid` — marcadores en vivo
- `.dl-num` countdown — 30px, color `--lime` / urgente: `--coral`
- Tiempos de partido (min), scores del bracket
- Fallback: Brasil2014Numeros → Barlow Condensed

`Barlow` (body, UI):
- Todo el texto de navegación, labels, botones, formularios

`Space Mono`:
- Códigos de porra (CRACK26), datos técnicos

## Elevation (tema claro)

| Nivel | Variable | Valor | Uso |
|-------|----------|-------|-----|
| 0 | `--ink` | #F4F0E6 | Fondo página/app |
| Modal | `--ink-2` | #EAE5D8 | Sidebar, sheets |
| 1 | `--surface` | #FDFCF8 | Cards, main |
| 2 | `--surface-2` | #EEE9DC | Inputs, cards elevadas |
| 3 | `--surface-3` | #E4DDD0 | Hover, activos |

## Border radius — VARIADO, no uniforme

```
6–8px    chips, badges, rule-pts
10–11px  player picks, lista items
12–14px  tabbar, team picks, lb-rows, fields
20px     cards principales (--r-lg)
28px     hero cards, sheets (--r-xl)
999px    pills, tags
```

## Bans absolutos

- **Sin border-left stripe** > 1px decorativo → usar background tint
- **Sin gradientes decorativos** → fondo plano en todos los containers
- **Sin backdrop-filter blur** en tabbar → sólido
- **Sin gradient text** (`background-clip: text`)
- **Sin hero-metric template** con big number + gradient
- **Sin texto oscuro sobre verde oscuro** sin suficiente contraste (WCAG AA)

## Componentes clave

### Botones
```
.btn-accent  →  bg var(--lime) #336F1B, color #fff, h 54px, r 12px, fw 800
.btn-ghost   →  bg --surface, border 1.5px --line-2, color --text
.btn-danger  →  bg coral 10%, border coral 25%, color --coral
```

### Section heads
```jsx
<div className="sec-head">
  <h2>EN DIRECTO</h2>   {/* Bebas Neue, navy automático */}
  <div className="spacer" />
  <span className="mut">Ver todos</span>
</div>
```

### Chips
```
.chip       →  bg --surface, border 1.5px --line-2, r 8px, h 34px, fw 700
.chip.on    →  bg --lime (verde), color #fff, border-color --lime
```

### Tags
```
.tag-pts   →  verde 13% bg + verde text + verde border (primary data)
.tag-live  →  coral 12% bg + coral text (live)
.tag-warn  →  orange 14% bg + orange text
.tag-green →  lima 18% bg + dark green text (positive)
```

### Tabbar
Sólido `--surface`, `border-top: 2px solid --line-2`. **Sin blur.** Tab activo `--lime` (verde).

### Cards
```
.card    →  bg --surface, border 1px --line-2, r 20px
```

### Field (inputs)
```
.field         →  bg --surface, border 1.5px --line-2, r 12px
.field:focus   →  border-color --lime, box-shadow 0 0 0 3px rgba(lime,.12)
```

## Motion

- Entry: `opacity 0→1 + translateY(8px→0)`, 200–250ms `cubic-bezier(.23,1,.32,1)`
- Hover: solo `background-color` y `border-color`, **sin** transform en layout
- Press/active: `scale(.97)`, 80ms
- Stagger team picks: 45ms por item
- Sin bounce, sin elastic, sin orquestaciones de entrada

```css
--ease-out:    cubic-bezier(0.23, 1, 0.32, 1)
--ease-in-out: cubic-bezier(0.77, 0, 0.175, 1)
```

## Web desktop

- Grid: `252px | 1fr | 296px` (colapsa: <960px oculta rail, <640px oculta sidebar)
- Sidebar/Rail: `--ink-2` plano (#EAE5D8), sin gradiente
- Brand icon: bg `--lime` (verde) con icono blanco
- Header h1: Bebas Neue 44px, color `--navy`
- Countdown rail: Barlow Condensed 28px fw 900, color `--lime` (verde) → `--coral` si urgente
