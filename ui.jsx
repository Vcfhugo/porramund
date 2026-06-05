/* ============================================================
   UI compartida — iconos + componentes
   Exporta a window
   ============================================================ */
const { useState, useEffect, useRef } = React;

/* ---------- Icon set (stroke, currentColor) ---------- */
function Icon({ name, size = 22, sw = 2, style }) {
  const p = {
    /* Navegación */
    home:       <path d="M3 10.5 12 3l9 7.5M5.5 9.5V20h13V9.5" />,
    calendar:   <><rect x="3" y="4.5" width="18" height="16" rx="3"/><path d="M3 9h18M8 2.5v4M16 2.5v4"/></>,
    bracket:    <path d="M4 5h5v6h5M4 19h5v-6M14 11h6M14 11v0M17 11v8"/>,
    chart:      <path d="M4 20V4M4 20h16M8 20v-6M13 20v-10M18 20v-4"/>,
    user:       <><circle cx="12" cy="8" r="4"/><path d="M4.5 20a7.5 7.5 0 0 1 15 0"/></>,
    users:      <><circle cx="9" cy="8" r="3.4"/><path d="M3.5 19a5.5 5.5 0 0 1 11 0M16 5.2a3.4 3.4 0 0 1 0 6.4M17.5 19a5.5 5.5 0 0 0-2.2-4.4"/></>,
    /* Acciones */
    bell:       <path d="M6 9a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6M10 20a2 2 0 0 0 4 0"/>,
    plus:       <path d="M12 5v14M5 12h14"/>,
    chevron:    <path d="M9 5l7 7-7 7"/>,
    chevdown:   <path d="M5 9l7 7 7-7"/>,
    search:     <><circle cx="11" cy="11" r="6.5"/><path d="M16 16l4 4"/></>,
    share:      <path d="M14 9V5l7 7-7 7v-4C9 12 5 14 3 19c0-7 4-10 11-10Z"/>,
    check:      <path d="M5 13l4 4L19 7"/>,
    lock:       <><rect x="5" y="10.5" width="14" height="10" rx="2.5"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5"/></>,
    settings:   <><circle cx="12" cy="12" r="3"/><path d="M12 2.5v3M12 18.5v3M21.5 12h-3M5.5 12h-3M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1M18.4 18.4l-2.1-2.1M7.7 7.7 5.6 5.6"/></>,
    arrowup:    <path d="M12 19V6M6 12l6-6 6 6"/>,
    qr:         <><rect x="4" y="4" width="6" height="6" rx="1"/><rect x="14" y="4" width="6" height="6" rx="1"/><rect x="4" y="14" width="6" height="6" rx="1"/><path d="M14 14h3v3M20 14v6M14 20h3"/></>,
    /* Sport & competition — estilo Brasil 2014, trazos gruesos */
    trophy:     <><path d="M7 4h10v5a5 5 0 0 1-10 0V4Z"/><path d="M7 6.5H4.5v1a2.5 2.5 0 0 0 2.5 2.5M17 6.5h2.5v1a2.5 2.5 0 0 1-2.5 2.5M9.5 15h5M12 13.5V15M9 20h6M10.5 17.5h3V20h-3z"/></>,
    ball:       <><circle cx="12" cy="12" r="9"/><path d="M12 7l3.2 2.3-1.2 3.8H10L8.8 9.3 12 7Z"/><path d="M12 3v4M3.5 8.5l3 2.2M20.5 8.5l-3 2.2M5.5 19l2.5-3.2M18.5 19l-2.5-3.2"/></>,
    coin:       <><circle cx="12" cy="12" r="8.5"/><path d="M12 7.5v9M10 9.5c0-1.1 1-1.5 2-1.5s2 .5 2 1.5c0 2.5-4 1-4 3.5 0 1.2 1 1.5 2 1.5s2-.4 2-1.5"/></>,
    fire:       <path d="M12 3c.8 2.5-1.5 4-1.5 6.5 0 1.2.8 2 1.5 2s1.5-.8 1.5-2c1.5 1 2.5 2.8 2.5 4.5a4 4 0 0 1-8 0c0-3.5 2.5-4.5 4-10.5Z"/>,
    target:     <><circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5"/></>,
    clock:      <><circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3.5 2"/></>,
    medal:      <><circle cx="12" cy="14" r="5.5"/><path d="M8.5 9.5 6.5 4M15.5 9.5 17.5 4M11 14.5l.8.8 1.7-2"/></>,
    crown:      <path d="M3 8.5l3.5 3.5L12 5l5.5 7L21 8.5 19 18H5L3 8.5ZM5 18h14"/>,
    shield:     <><path d="M12 3l7 3v5c0 5-3.5 7.5-7 9.5-3.5-2-7-4.5-7-9.5V6l7-3Z"/><path d="M9.5 12l2 2 4-4"/></>,
    sparkle:    <><path d="M12 3l1.5 5.5L19 10l-5.5 1.5L12 17l-1.5-5.5L5 10l5.5-1.5L12 3Z"/><path d="M19 17l.7 2 2 .7-2 .7-.7 2-.7-2-2-.7 2-.7.7-2Z"/></>,
    /* Temáticos grupos porra */
    globe:      <><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c-3.5 4-3.5 14 0 18M12 3c3.5 4 3.5 14 0 18M5.5 6.5c1.5 1 4 1.5 6.5 1.5s5-.5 6.5-1.5M5.5 17.5c1.5-1 4-1.5 6.5-1.5s5 .5 6.5 1.5"/></>,
    swords:     <><path d="M14.5 9.5l-10 10M5 19l-1.5 1.5M6.5 15.5l2 2M20 4l-6 6M14 10l-4 4"/><path d="M20 4l-2 .5-.5 2L14 10l1.5 1.5L20 4ZM5 19l2-2"/></>,
    dice:       <><rect x="3.5" y="3.5" width="17" height="17" rx="4"/><circle cx="8" cy="8" r="1.3" fill="currentColor" stroke="none"/><circle cx="16" cy="8" r="1.3" fill="currentColor" stroke="none"/><circle cx="8" cy="16" r="1.3" fill="currentColor" stroke="none"/><circle cx="16" cy="16" r="1.3" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.3" fill="currentColor" stroke="none"/></>,
    /* Comunicación */
    mail:       <><rect x="3" y="5.5" width="18" height="13" rx="2.5"/><path d="M3 8l9 6 9-6"/></>,
    /* Misc */
    bolt:       <path d="M13 3L6 14h6l-1 7 9-11h-6l2-7z" strokeLinejoin="round"/>,
  }[name];
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"
      style={style}>{p}</svg>
  );
}

/* ---------- Flag ---------- */
function Flag({ team, size = 26, ring = true }) {
  const t = typeof team === 'string' ? window.DB.T[team] : team;
  if (!t) return null;
  return (
    <img src={t.flag} alt={t.code}
      className={'flag' + (ring ? ' flag-ring' : '')}
      style={{ width: size, height: size * 0.7 }} />
  );
}

/* ---------- Team line (flag + name) ---------- */
function TeamLine({ team, reverse, size = 26, big }) {
  const t = window.DB.T[team];
  return (
    <div className={'side' + (reverse ? ' r' : '')}>
      <Flag team={t} size={size} />
      <span className="nm" style={big ? { fontSize: 16 } : null}>{t.name}</span>
    </div>
  );
}

/* ---------- Avatar initials ---------- */
function Av({ txt, col, size = 40, r = 13 }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: r, flex: 'none',
      background: col, color: '#0a0e18', fontWeight: 800,
      fontSize: size * 0.34, display: 'flex', alignItems: 'center', justifyContent: 'center',
      letterSpacing: '-.02em',
    }}>{txt}</div>
  );
}

/* ---------- Section heading ---------- */
function SecHead({ title, action, onAction }) {
  return (
    <div className="sec-head">
      <h2>{title}</h2>
      {action && <a onClick={onAction}>{action}</a>}
    </div>
  );
}

/* ---------- Status tag for a match ---------- */
function MatchTag({ m }) {
  if (m.status === 'live') return <span className="tag tag-live"><span className="blink" />EN VIVO {m.min}</span>;
  if (m.status === 'done') return <span className="tag tag-done">FINAL</span>;
  return <span className="tag tag-soon">{m.date} · {m.time}</span>;
}

/* ============================================================
   BrasilBand — banda decorativa carnaval Brasil 2014
   Círculos superpuestos en paleta Brasil, inspirado en el
   strip inferior del cartel oficial FIFA World Cup Brasil 2014
   ============================================================ */
function BrasilBand({ slim = false, flip = false }) {
  /* Banda delgada: 6 franjas de color (camiseta canarinha) */
  if (slim) return (
    <div style={{ height: 5, display: 'flex', flexShrink: 0, overflow: 'hidden' }}>
      {['#336F1B','#FDD301','#D8131A','#F79516','#ABCB2D','#003469'].map((c, i) => (
        <div key={i} style={{ flex: 1, background: c }} />
      ))}
    </div>
  );

  /* Banda completa: círculos orgánicos de carnaval */
  const h = 52;
  const circles = [
    { cx:0,   cy:h,    r:30, fill:'#336F1B' },
    { cx:42,  cy:0,    r:24, fill:'#FDD301' },
    { cx:82,  cy:h,    r:22, fill:'#D8131A' },
    { cx:120, cy:8,    r:20, fill:'#F79516' },
    { cx:158, cy:h,    r:26, fill:'#ABCB2D' },
    { cx:196, cy:4,    r:22, fill:'#003469' },
    { cx:234, cy:h,    r:24, fill:'#336F1B' },
    { cx:272, cy:6,    r:20, fill:'#FDD301' },
    { cx:310, cy:h,    r:22, fill:'#D8131A' },
    { cx:348, cy:2,    r:24, fill:'#F79516' },
    { cx:380, cy:h,    r:20, fill:'#ABCB2D' },
    /* pequeños de acento */
    { cx:22,  cy:14,   r:9,  fill:'#FDD301' },
    { cx:62,  cy:40,   r:8,  fill:'#ABCB2D' },
    { cx:102, cy:16,   r:9,  fill:'#336F1B' },
    { cx:140, cy:38,   r:7,  fill:'#003469' },
    { cx:178, cy:12,   r:8,  fill:'#F79516' },
    { cx:216, cy:38,   r:9,  fill:'#D8131A' },
    { cx:254, cy:10,   r:7,  fill:'#ABCB2D' },
    { cx:292, cy:38,   r:8,  fill:'#336F1B' },
    { cx:330, cy:14,   r:9,  fill:'#003469' },
    /* hojas / pétalos orgánicos entre círculos */
    { type:'leaf', x:38, y:22, fill:'#ABCB2D' },
    { type:'leaf', x:118, y:28, fill:'#FDD301' },
    { type:'leaf', x:200, y:26, fill:'#F79516' },
    { type:'leaf', x:270, y:24, fill:'#336F1B' },
    { type:'leaf', x:348, y:20, fill:'#FDD301' },
  ];

  const transform = flip ? `scale(1,-1) translate(0,-${h})` : undefined;

  return (
    <svg
      width="100%" height={h}
      viewBox={`0 0 360 ${h}`}
      preserveAspectRatio="xMidYMid slice"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display:'block', flexShrink:0 }}
    >
      <g transform={transform}>
        {circles.map((c, i) => {
          if (c.type === 'leaf') {
            return (
              <ellipse key={i}
                cx={c.x + 8} cy={c.y}
                rx={10} ry={6}
                transform={`rotate(-30,${c.x + 8},${c.y})`}
                fill={c.fill} opacity="0.9"
              />
            );
          }
          return <circle key={i} cx={c.cx} cy={c.cy} r={c.r} fill={c.fill} opacity="0.92" />;
        })}
      </g>
    </svg>
  );
}

/* ============================================================
   SunBurst — rayos de sol, motivo central Brasil 2014
   ============================================================ */
function SunBurst({ size = 80, color = '#FDD301', rays = 12, opacity = 0.18 }) {
  const r1 = size * 0.28, r2 = size * 0.48;
  const pts = Array.from({ length: rays }, (_, i) => {
    const a1 = (i / rays) * Math.PI * 2 - Math.PI / 2;
    const a2 = ((i + 0.5) / rays) * Math.PI * 2 - Math.PI / 2;
    return `${size/2 + r2*Math.cos(a1)},${size/2 + r2*Math.sin(a1)} ` +
           `${size/2 + r1*Math.cos(a2)},${size/2 + r1*Math.sin(a2)}`;
  }).join(' ');
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}
      xmlns="http://www.w3.org/2000/svg" style={{ display:'block' }}>
      <polygon points={pts} fill={color} opacity={opacity} />
      <circle cx={size/2} cy={size/2} r={r1 * 0.8} fill={color} opacity={opacity * 0.7} />
    </svg>
  );
}

/* ============================================================
   GeomCorner — ornamento geométrico de esquina (círculos concéntricos)
   ============================================================ */
function GeomCorner({ size = 80, color = '#336F1B', position = 'tr' }) {
  const cx = position.includes('r') ? size : 0;
  const cy = position.includes('b') ? size : 0;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}
      xmlns="http://www.w3.org/2000/svg"
      style={{ display:'block', position:'absolute',
        top: position.includes('t') ? 0 : undefined,
        bottom: position.includes('b') ? 0 : undefined,
        right: position.includes('r') ? 0 : undefined,
        left: position.includes('l') ? 0 : undefined,
        pointerEvents:'none' }}>
      {[0.85, 0.6, 0.38].map((f, i) => (
        <circle key={i} cx={cx} cy={cy} r={size * f}
          fill="none" stroke={color} strokeWidth="1.5"
          opacity={[0.18, 0.13, 0.09][i]} />
      ))}
    </svg>
  );
}

/* ============================================================
   SISTEMA DE FIGURAS GEOMÉTRICAS BRASIL 2014
   Director de arte: catálogo de 6 formas primarias.

   REGLAS DE COMBINACIÓN:
   — Max 2-3 figuras por composición
   — Una forma rellena + una en trazo o semitransparente
   — Paleta max 2 colores Brasil por composición
   — Tamaños: Hero (L 150-400px) · Card (M 50-120px) · Detail (S 16-44px)
   — Opacity primaria 80-100% · secundaria 25-45% · terciaria 10-18%
   — Sin simetría rígida: preferir diagonal, esquina o desequilibrio controlado
   ============================================================ */

/* ─── 1. TRIFLAG — Banderín triangular de esquina ───────────
   Uso: esquina de cards, announces, marco de titulares.
   Evoca: banderín de campo, cartel de torneo, estadio.
   Tamaño: S 24-48px · M 56-80px · L 100-140px
   ─────────────────────────────────────────────────────────── */
function TriFlag({ size = 52, color = '#FDD301', position = 'tr', opacity = 1, style }) {
  /* Points según posición: tr=esquina superior derecha, tl=superior izquierda, etc. */
  const pts = {
    tr: `0,0 ${size},0 ${size},${size}`,
    tl: `0,0 ${size},0 0,${size}`,
    br: `${size},0 ${size},${size} 0,${size}`,
    bl: `0,0 0,${size} ${size},${size}`,
  }[position] || `0,0 ${size},0 ${size},${size}`;

  const pos = {
    tr: { top: 0, right: 0 },
    tl: { top: 0, left: 0 },
    br: { bottom: 0, right: 0 },
    bl: { bottom: 0, left: 0 },
  }[position];

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}
      xmlns="http://www.w3.org/2000/svg"
      style={{ position: 'absolute', pointerEvents: 'none', display: 'block', ...pos, ...style }}>
      <polygon points={pts} fill={color} opacity={opacity} />
    </svg>
  );
}

/* ─── 2. ARCBAND — Arco de estadio, profundidad estructural ──
   Uso: fondos de hero, podio ranking, campeón bracket.
   Evoca: overhead shot del estadio, arco de entrada, copa.
   Tamaño: M 100-160px · L 200-320px · XL 400px+
   ─────────────────────────────────────────────────────────── */
function ArcBand({ size = 200, color = '#003469', thickness = 14,
                   opacity = 0.15, position = 'tr', filled = false }) {
  const halfSize = size;
  /* Arco de cuarto de círculo desde cada esquina */
  const paths = {
    tr: `M ${halfSize} 0 A ${halfSize} ${halfSize} 0 0 0 0 ${halfSize}`,
    tl: `M 0 0 A ${halfSize} ${halfSize} 0 0 1 ${halfSize} ${halfSize}`,
    br: `M ${halfSize} ${halfSize} A ${halfSize} ${halfSize} 0 0 1 0 0`,
    bl: `M 0 ${halfSize} A ${halfSize} ${halfSize} 0 0 1 ${halfSize} 0`,
  };
  const pos = {
    tr: { top: 0, right: 0 },
    tl: { top: 0, left: 0 },
    br: { bottom: 0, right: 0 },
    bl: { bottom: 0, left: 0 },
  }[position];

  return (
    <svg width={size} height={size} viewBox={`0 0 ${halfSize} ${halfSize}`}
      xmlns="http://www.w3.org/2000/svg"
      style={{ position: 'absolute', pointerEvents: 'none', display: 'block', ...pos }}>
      <path d={paths[position] || paths.tr}
        fill={filled ? color : 'none'}
        fillOpacity={filled ? opacity : 0}
        stroke={filled ? 'none' : color}
        strokeWidth={thickness}
        strokeLinecap="round"
        opacity={opacity} />
    </svg>
  );
}

/* ─── 3. DIAGBLOCK — Corte diagonal, movimiento y transición ─
   Uso: cabeceras de sección, transición hero→content, banners.
   Evoca: ángulo de cámara, gráfica broadcast TV, cartel deportivo.
   ─────────────────────────────────────────────────────────── */
function DiagBlock({ color = '#ABCB2D', height = 32, opacity = 0.18,
                     reverse = false, style }) {
  const skewPx = Math.round(height * 1.2);
  return (
    <div style={{ width: '100%', height, flexShrink: 0, pointerEvents: 'none',
      position: 'relative', overflow: 'hidden', ...style }}>
      <svg width="100%" height={height} viewBox={`0 0 400 ${height}`}
        preserveAspectRatio="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ position: 'absolute', inset: 0, display: 'block' }}>
        <polygon
          points={reverse
            ? `0,${skewPx} 400,0 400,${height} 0,${height}`
            : `0,0 400,${skewPx} 400,${height} 0,${height}`}
          fill={color} opacity={opacity} />
      </svg>
    </div>
  );
}

/* ─── 4. DOTRHYTHM — Grilla de puntos, rellena vacíos ────────
   Uso: fondos de empty state, detrás de badges, detrás de podio.
   Evoca: confeti, red del gol, mosaico del estadio.
   Regla: usa max 3 colores, tamaño punto 3-7px.
   ─────────────────────────────────────────────────────────── */
function DotRhythm({ cols = 8, rows = 4, dotSize = 4, gap = 13,
                     colors, opacity = 0.20 }) {
  const palette = colors || ['#336F1B','#FDD301','#D8131A','#F79516','#ABCB2D','#003469'];
  const w = cols * (dotSize + gap);
  const h = rows * (dotSize + gap);
  /* Variación de tamaño determinista: evita simetría rígida */
  const sz = (r, c) => {
    const v = (r * cols + c) % 5;
    return dotSize * [1, 0.7, 1.25, 0.85, 1.1][v];
  };
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}
      xmlns="http://www.w3.org/2000/svg" style={{ display: 'block' }}>
      {Array.from({ length: rows }, (_, r) =>
        Array.from({ length: cols }, (_, c) => (
          <circle key={`${r}-${c}`}
            cx={c * (dotSize + gap) + (dotSize + gap) / 2}
            cy={r * (dotSize + gap) + (dotSize + gap) / 2}
            r={sz(r, c) / 2}
            fill={palette[(r * cols + c) % palette.length]}
            opacity={opacity} />
        ))
      )}
    </svg>
  );
}

/* ─── 5. WAVEBAND — Cinta ondulada, separador de sección ─────
   Uso: entre sección y sección, bajo contadores, sobre tablas.
   Evoca: ola del Atlántico, cinta de llegada, trazo de marcador.
   Regla: siempre una sola línea. Opacity 0.4-0.7.
   ─────────────────────────────────────────────────────────── */
function WaveBand({ color = '#FDD301', height = 14, opacity = 0.55, thick = 2.5 }) {
  const a = height * 0.4; /* amplitud */
  const mid = height / 2;
  const path =
    `M0,${mid} C45,${mid - a} 90,${mid + a} 135,${mid} ` +
    `S225,${mid - a} 270,${mid} S360,${mid + a} 405,${mid}`;
  return (
    <svg width="100%" height={height} viewBox={`0 0 360 ${height}`}
      preserveAspectRatio="xMidYMid meet"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: 'block', flexShrink: 0, pointerEvents: 'none' }}>
      <path d={path} fill="none" stroke={color}
        strokeWidth={thick} strokeLinecap="round" opacity={opacity} />
    </svg>
  );
}

/* ─── 6. BARSTACK — Barras editoriales, acento periodístico ──
   Uso: junto a titulares de sección, detrás de rankings, intro card.
   Evoca: gráfica de TV deportiva, línea de tiempo, periódico AS.
   Regla: 3 barras, distintas longitudes (100%-70%-45%), gap uniforme.
   ─────────────────────────────────────────────────────────── */
function BarStack({ colors, widths, barH = 4, gap = 5,
                    opacity = 0.28, align = 'left' }) {
  const c = colors || ['#336F1B', '#FDD301', '#D8131A'];
  const w = widths || [100, 70, 46];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap,
      pointerEvents: 'none', flexShrink: 0 }}>
      {c.map((col, i) => (
        <div key={i} style={{
          height: barH, width: w[i] + '%',
          background: col, opacity,
          borderRadius: barH / 2,
          alignSelf: align === 'right' ? 'flex-end' : 'flex-start',
        }} />
      ))}
    </div>
  );
}

/* ─── COMPOSICIONES PREDEFINIDAS ────────────────────────────── */

/* HeroDecor — set completo para secciones hero (hero + landing) */
function HeroDecor({ accentColor = '#FDD301', size = 'lg' }) {
  const s = size === 'lg' ? { arc: 180, sun: 160, rays: 14 }
          : size === 'md' ? { arc: 120, sun: 100, rays: 12 }
          : { arc: 80, sun: 70, rays: 10 };
  return (
    <>
      <ArcBand size={s.arc} color={accentColor} thickness={Math.round(s.arc * 0.07)}
        opacity={0.20} position="tr" />
      <SunBurst size={s.sun} color={accentColor} rays={s.rays} opacity={0.20} />
      <GeomCorner size={Math.round(s.arc * 0.65)} color="#ABCB2D" position="bl" />
    </>
  );
}

/* CardDecor — decoración para cabecera de cards con color de acento */
function CardDecor({ color = '#FDD301', size = 44 }) {
  return (
    <>
      <TriFlag size={size} color={color} position="tr" opacity={1} />
      {/* Pequeño círculo de contraste */}
      <div style={{
        position: 'absolute', top: size * 0.6, right: size * 0.6,
        width: size * 0.22, height: size * 0.22, borderRadius: '50%',
        background: '#fff', opacity: 0.5, pointerEvents: 'none',
      }} />
    </>
  );
}

Object.assign(window, {
  Icon, Flag, TeamLine, Av, SecHead, MatchTag,
  BrasilBand, SunBurst, GeomCorner,
  TriFlag, ArcBand, DiagBlock, DotRhythm, WaveBand, BarStack,
  HeroDecor, CardDecor,
});
