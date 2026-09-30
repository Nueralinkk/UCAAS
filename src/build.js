const fs = require('fs');
const path = require('path');
const juice = require('juice').default || require('juice');
const cheerio = require('cheerio');

const src = fs.readFileSync(path.join(__dirname, 'src.html'), 'utf8').replace(/\r\n/g, '\n');
const OUT = path.join(__dirname, '..', 'index.html');

/* ---------- icons ---------- */
const IC = {
  chev: '<path d="M6 9l6 6 6-6"/>',
  up: '<path d="M6 15l6-6 6 6"/>',
  pause: '<rect x="7" y="5" width="3.5" height="14" rx="1"/><rect x="13.5" y="5" width="3.5" height="14" rx="1"/>',
  list: '<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>',
  grid: '<path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>',
  upload: '<path d="M12 16V4M7 9l5-5 5 5M4 20h16"/>',
  pencil: '<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M13.5 6.5l4 4"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/>',
  x: '<path d="M6 6l12 12M18 6L6 18"/>',
  users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0M16 4.5a3.5 3.5 0 0 1 0 7M18 14a6.5 6.5 0 0 1 3.5 6"/>',
  download: '<path d="M12 4v11M7 10l5 5 5-5M4 20h16"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  home: '<path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
  dir: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="10" r="3"/><path d="M6.5 18.5a6.5 6.5 0 0 1 11 0"/>',
  phone: '<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2"/>',
  chart: '<path d="M5 20V10M10 20V4M15 20v-7M20 20v-4"/>',
  cog: '<circle cx="9" cy="8" r="3.5"/><path d="M3 20a6 6 0 0 1 9-5.2"/><circle cx="18" cy="17" r="2"/><path d="M18 13v1.5M18 19.5V21M14 17h1.5M20.5 17H22"/>',
  bell: '<path d="M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10 21a2 2 0 0 0 4 0"/>',
  moon: '<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  wallet: '<rect x="3" y="6" width="18" height="14" rx="2"/><path d="M3 10h18M16 15h2M6 6l10-3 1 3"/>',
  contacts: '<rect x="5.2" y="3" width="16.6" height="18" rx="3.6"/><path d="M2.8 8h2.4M2.8 12h2.4M2.8 16h2.4"/><path d="M10.6 8.2l1.5-.3 1.3 2.7-1 1a5.4 5.4 0 0 0 2.5 2.5l1-1 2.7 1.3-.3 1.5a1.8 1.8 0 0 1-1.8 1.4A8.4 8.4 0 0 1 9.3 10a1.8 1.8 0 0 1 1.3-1.8z"/>',
  groups: '<circle cx="9" cy="6.6" r="3.6"/><path d="M2.4 20.2v-1.6c0-2 1.6-3.6 3.6-3.6h6c2 0 3.6 1.6 3.6 3.6v1.6z"/><path d="M14.4 3.1a3.6 3.6 0 0 1 0 7.1 5.2 5.2 0 0 0 0-7.1z" fill="currentColor"/><path d="M17.2 14.9c2.3.3 4 1.8 4 3.7v1.6h-3.6c.1-1.7-.1-3.3-.4-5.3z" fill="currentColor"/>',
  userplus: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 11.6-4M19 8v6M16 11h6"/>',
  chevr: '<path d="M9 6l6 6-6 6"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>',
  alertc: '<circle cx="12" cy="12" r="9"/><path d="M12 7.5v5.5M12 16.5h.01"/>',
  warn: '<path d="M12 4l9.5 16.5h-19z"/><path d="M12 10v4.5M12 17.5h.01"/>',
  minus: '<path d="M5 12h14"/>',
  key: '<circle cx="8" cy="15.5" r="3.8"/><path d="M10.8 12.7L19 4.5M16 7.5l3 3"/>',
  triL: '<path d="M15 5l-8 7 8 7z" fill="currentColor" stroke="none"/>',
  triR: '<path d="M9 5l8 7-8 7z" fill="currentColor" stroke="none"/>',
  tick: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
  roles: '<circle cx="9" cy="7" r="3.5"/><path d="M3 20a6 6 0 0 1 9-5.2"/><circle cx="18" cy="17" r="2"/><path d="M18 13v1.5M18 19.5V21M14 17h1.5M20.5 17H22"/>',
  pin: '<path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>',
  star: '<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z"/>',
  block: '<circle cx="12" cy="6" r="3.6"/><path d="M14.6 13.6H7.4a3.9 3.9 0 0 0 0 7.8h5.6"/><circle cx="17.4" cy="17.5" r="4"/><path d="M14.6 20.3l5.6-5.6"/>',
  shield: '<path d="M12 3l8 3v6c0 4.5-3.2 7.5-8 9-4.8-1.5-8-4.5-8-9V6z"/>',
  logo: 'VB:0 0 28 30|<g stroke="#0d9bd7" fill="none" stroke-linecap="round"><path d="M5.6 1.4Q-4 11 5.6 20.6" stroke-width="1.9"/><path d="M8 4.2Q2.8 11.6 8 18.8" stroke-width="1.7"/><path d="M10.4 6.4Q5.4 11.2 10.4 16" stroke-width="1.7"/><path d="M22.8 1.4Q32.4 11 22.8 20.6" stroke-width="1.9"/><path d="M20.4 4.2Q25.6 11.6 20.4 18.8" stroke-width="1.7"/><path d="M18 6.4Q23 11.2 18 16" stroke-width="1.7"/></g><path d="M14 10.4L11.6 19.6H16.8Z" fill="#0d9bd7" stroke="none"/><g stroke="#0d9bd7" stroke-linecap="round"><path d="M11 22.2L18.2 21.4" stroke-width="1.1"/><path d="M9.8 25.2L19 24.2" stroke-width="1.6"/><path d="M9.8 27.9H19" stroke-width="1.7"/></g>',
  refresh: '<path d="M20 11a8 8 0 0 0-14.5-4.5L4 8M4 4v4h4M4 13a8 8 0 0 0 14.5 4.5L20 16M20 20v-4h-4"/>',
  mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/>',
  copy: '<rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V6a2 2 0 0 1 2-2h9"/>',
  trash: '<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>',
  undo: '<path d="M4 9h11a5 5 0 0 1 0 10H8M4 9l4-4M4 9l4 4"/>',
  msg: '<path d="M4 5h16v11H9l-5 4z"/>',
  dots: '<circle cx="5" cy="12" r="1.7" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.7" fill="currentColor" stroke="none"/><circle cx="19" cy="12" r="1.7" fill="currentColor" stroke="none"/>',
};

let html = src.replace(/<i data-ic="(\w+)"([^>]*)><\/i>/g, (m, name, attrs) => {
  if (!IC[name]) throw new Error('missing icon ' + name);
  const s = (attrs.match(/data-s="(\d+)"/) || [])[1];
  const fill = /data-fill="1"/.test(attrs);
  const style = s ? ` style="width:${s}px;height:${s}px"` : '';
  let body = IC[name], vb = '0 0 24 24';
  if (body.startsWith('VB:')) { const k = body.indexOf('|'); vb = body.slice(3, k); body = body.slice(k + 1); }
  const inner = fill ? `<g fill="currentColor">${body}</g>` : body;
  return `<svg viewBox="${vb}"${style}>${inner}</svg>`;
});

/* ---------- expand menu options ---------- */
let $ = cheerio.load(html, { decodeEntities: false });
$('[data-options]').each((_, el) => {
  const $el = $(el);
  $el.attr('data-options').split('|').forEach(v => {
    $el.append(`<button class="opt" data-opt="${v}"><span class="ck" data-ck>✓</span><span>${v}</span></button>`);
  });
  $el.removeAttr('data-options');
});

/* ---------- pull :hover / :focus-within rules out into data attributes ---------- */
let css = '';
$('style').each((_, el) => { css += $(el).html(); });
css = css.replace(/\/\*[\s\S]*?\*\//g, '');
const kept = [];
css.replace(/([^{}]+)\{([^{}]*)\}/g, (m, sel, body) => {
  sel = sel.trim();
  const isH = /:hover/.test(sel), isF = /:focus-within/.test(sel);
  if (!isH && !isF) { kept.push(`${sel}{${body}}`); return m; }
  const base = sel.replace(/:hover|:focus-within/g, '');
  const attr = isH ? 'data-h' : 'data-fo';
  const decl = body.trim().replace(/;?$/, ';');
  const found = $(base);
  if (!found.length) console.warn('no match for', base);
  found.each((_, el) => { $(el).attr(attr, ($(el).attr(attr) || '') + decl); });
  return m;
});
$('style').first().html(kept.join('\n'));
$('style').slice(1).remove();

/* ---------- inline everything ---------- */
let out = juice($.html(), { removeStyleTags: true, preserveMediaQueries: false, preservePseudos: false, applyStyleTags: true });
out = out.replace(/ class="[^"]*"/g, '');
if (/<style/.test(out)) throw new Error('style tag remains');
/* dark theme: injected after inlining, since it must stay a real stylesheet (it targets runtime attribute state) */
const dark = fs.readFileSync(path.join(__dirname, 'dark.css'), 'utf8');
/* motion: keyframes cannot be inlined, so dialog / menu / toast entrances live in a second small stylesheet */
const motion = fs.readFileSync(path.join(__dirname, 'motion.css'), 'utf8');
out = out.replace('</head>', '<style id="darkcss">' + dark + '</style><style id="motion">' + motion + '</style></head>');
fs.writeFileSync(OUT, out);
console.log('written', OUT, (out.length / 1024).toFixed(1) + ' KB');
