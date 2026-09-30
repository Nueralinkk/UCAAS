/* Generates dark.css: every inline colour in the app is matched by its role via attribute-substring
   selectors (hex as written by the build, hex as written by JS templates, and the rgb() form Chrome
   serialises after any JS style write), and overridden with !important under html[data-theme="dark"]. */
const fs = require('fs');
const rgb = h => { h = h.replace('#', ''); if (h.length === 3) h = h.split('').map(c => c + c).join(''); const n = parseInt(h, 16); return `rgb(${n >> 16}, ${(n >> 8) & 255}, ${n & 255})`; };

const SURF = '#121a2b', SUB = '#0f172a', MUTED = '#1e293b', PAGE = '#0b1220', BORDER = '#283548';
const BG = {
  '#fff': SURF, '#f5f7fb': PAGE,
  '#fafbfd': SUB, '#f8fafc': SUB, '#f4f7fb': SUB, '#f8fbff': SUB, '#f1f4f8': SUB,
  '#f1f5f9': MUTED, '#eef2f6': MUTED, '#eef2f7': MUTED, '#eef1f6': MUTED, '#eef1f8': MUTED, '#e8eef7': MUTED, '#e6ebf2': MUTED, '#dbe3ec': MUTED, '#e2e8f0': BORDER, '#cbd5e1': '#334155', '#eef1f5': MUTED,
  '#eff6ff': '#172640', '#eaf1ff': '#172640', '#eaf2ff': '#172640', '#e8f0fe': '#172640', '#f3f7ff': '#172640', '#f7faff': '#141e33', '#e0ebff': '#1b2f52', '#d5e4ff': '#1f3661', '#eef4ff': '#172640', '#eaf1fd': '#172640', '#dbeafe': '#1e3a8a',
  '#dcfce7': '#0f3d2e', '#f0fdfa': '#0f3d2e', '#d1fae5': '#0f3d2e', '#bbf7d0': '#166534',
  '#fef3c7': '#3b2a06', '#fffbeb': '#3b2a06', '#fefce8': '#3b2a06', '#fdf6d8': '#3b2f0b',
  '#fee2e2': '#3f1414', '#fef2f2': '#3f1414', '#fff7f7': '#3f1414', '#fff7ed': '#3f1f0f',
  '#ede9fe': '#2e1065', '#ddd6fe': '#3b2a7a', '#f3e8e8': '#3a2c2c',
  '#0f172a': '#334155'
};
const TEXT = {
  '#0f172a': '#e5eaf3', '#1e293b': '#e5eaf3', '#334155': '#cbd5e1', '#475569': '#b4c0d0', '#64748b': '#94a3b8', '#94a3b8': '#7b8aa1', '#cbd5e1': '#64748b', '#44403c': '#d6d3d1',
  '#2563eb': '#60a5fa', '#1d4ed8': '#93c5fd', '#1e3a8a': '#bfdbfe',
  '#dc2626': '#f87171', '#b91c1c': '#fca5a5', '#991b1b': '#fca5a5', '#7f1d1d': '#fca5a5',
  '#b45309': '#fbbf24', '#92400e': '#fbbf24', '#78350f': '#fcd34d', '#a16207': '#fbbf24', '#c2410c': '#fb923c',
  '#15803d': '#4ade80', '#047857': '#4ade80', '#059669': '#4ade80', '#0f766e': '#2dd4bf', '#6d28d9': '#c4b5fd'
};
const BORD = {
  '#eef1f5': BORDER, '#e8ecf3': BORDER, '#e2e8f0': BORDER, '#e5e9f0': BORDER, '#dbe3ee': BORDER, '#d5dde8': BORDER, '#f1f5f9': BORDER, '#cbd5e1': '#334155', '#eef1f6': BORDER, '#dbe3ec': BORDER, '#fff': SURF,
  '#bfdbfe': '#1e40af', '#ddd6fe': '#4c1d95', '#c4b5fd': '#6d28d9', '#86efac': '#166534', '#fcd34d': '#92400e', '#93b4f5': '#2563eb', '#dbeafe': '#1e40af', '#bbf7d0': '#166534', '#fde68a': '#92400e', '#fecaca': '#7f1d1d', '#fca5a5': '#7f1d1d', '#fdba74': '#9a3412'
};
const STROKE = { '#6d28d9': '#c4b5fd', '#64748b': '#94a3b8', '#475569': '#b4c0d0', '#94a3b8': '#7b8aa1', '#2563eb': '#60a5fa', '#1d4ed8': '#93c5fd', '#15803d': '#4ade80', '#b45309': '#fbbf24', '#dc2626': '#f87171', '#c2410c': '#fb923c', '#0f172a': '#e5eaf3', '#334155': '#cbd5e1', '#1e293b': '#e5eaf3' };

const D = 'html[data-theme="dark"] ';
const forms = (prop, h) => [`${prop}:${h}`, `${prop}: ${h}`, `${prop}:${rgb(h)}`, `${prop}: ${rgb(h)}`];
const sel = arr => arr.map(f => `${D}[style*="${f.replace(/"/g, '\\"')}"]`).join(',');
/* "color:" must not match inside "border-color:" / "accent-color:", so anchor it to the attribute start or a preceding ";" */
const selColor = h => [h, rgb(h)].map(v => [`[style^="color:${v}"]`, `[style^="color: ${v}"]`, `[style*=";color:${v}"]`, `[style*="; color:${v}"]`, `[style*=";color: ${v}"]`, `[style*="; color: ${v}"]`].map(x => D + x).join(',')).join(',');
let css = `${D.trim()}{color-scheme:dark;background:${PAGE}}\n`;
/* #fff first so the 6-char colours that start with "fff" override it */
const order = Object.keys(BG).sort((a, b) => (a === '#fff' ? -1 : b === '#fff' ? 1 : 0));
order.forEach(h => { css += `${sel(forms('background', h))}{background:${BG[h]} !important}\n`; });
Object.keys(TEXT).forEach(h => { css += `${selColor(h)}{color:${TEXT[h]} !important}\n`; });
Object.keys(BORD).forEach(h => { css += `${sel([`solid ${h}`, `solid ${rgb(h)}`, `dashed ${h}`, `dashed ${rgb(h)}`, `border-color:${h}`, `border-color: ${h}`, `border-color:${rgb(h)}`, `border-color: ${rgb(h)}`])}{border-color:${BORD[h]} !important}\n`; });
Object.keys(STROKE).forEach(h => { css += `${sel(forms('stroke', h))}{stroke:${STROKE[h]} !important}\n`; });
/* one-offs: focus ring, manager gradient, tooltip stays legible, inputs, placeholders, avatar-ring gap, scrollbars */
css += `${sel(['3px #dbeafe', `3px ${rgb('#dbeafe')}`])}{box-shadow:0 0 0 3px #1e3a8a !important}\n`;
css += `${D}[style*="linear-gradient"]{background:linear-gradient(90deg,#172640,${SURF} 65%) !important}\n`;
css += `${D}input:not([type="checkbox"]):not([type="radio"]),${D}select,${D}textarea{background:${SUB} !important;color:#e5eaf3 !important;border-color:${BORDER} !important}\n`;
css += `${D}::placeholder{color:#7b8aa1 !important}\n`;
css += `${D.trim()}{--gap:${SURF}}\n`;
css += `${D}[style*="0 0 0 2px #fff"],${D}[style*="0 0 0 2px ${rgb('#fff')}"]{--gap:${SURF}}\n`;
fs.writeFileSync(__dirname + '/dark.css', css);
console.log('dark.css', (css.length / 1024).toFixed(1) + ' KB,', css.split('\n').length, 'rules');
