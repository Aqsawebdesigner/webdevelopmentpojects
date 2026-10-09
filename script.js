const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const winBox = $('#windows'), start = $('#start'), tasks = $('#tasks');
let z = 10, count = 0;

/* ---------- App definitions ---------- */
const apps = {
  notepad: { title: 'Notepad', icon: '📝', w: 520, h: 360,
    html: () => '<textarea placeholder="Start typing..."></textarea>' },
  about: { title: 'This PC', icon: '💻', w: 380, h: 260,
    html: () => `<div class="about"><h3>Windows 11 Web</h3>
      <p>Browser: ${navigator.userAgent.split(') ')[0].slice(0, 40)})</p>
      <p>Screen: ${screen.width} × ${screen.height}</p>
      <p>Language: ${navigator.language}</p></div>` },
  calc: { title: 'Calculator', icon: '🧮', w: 300, h: 400,
    html: () => {
      const keys = ['C','⌫','%','/','7','8','9','*','4','5','6','-','1','2','3','+','±','0','.','='];
      return `<div class="calc"><output>0</output>${keys.map(k =>
        `<button class="${k === '=' ? 'eq' : ''}" data-k="${k}">${k}</button>`).join('')}</div>`;
    },
    init: initCalc }
};

/* ---------- Open / manage windows ---------- */
function openApp(name) {
  const app = apps[name]; if (!app) return;
  const id = 'w' + (++count), off = (count % 6) * 28;
  const win = document.createElement('div');
  win.className = 'win'; win.id = id;
  Object.assign(win.style, { width: app.w + 'px', height: app.h + 'px', left: 120 + off + 'px', top: 50 + off + 'px' });
  win.innerHTML = `<div class="title"><span>${app.icon}&nbsp;</span><b>${app.title}</b>
    <button class="min" title="Minimize">─</button>
    <button class="mx" title="Maximize">☐</button>
    <button class="close" title="Close">✕</button></div>
    <div class="body">${app.html()}</div>`;
  winBox.append(win);
  app.init?.(win);

  const btn = document.createElement('button');
  btn.textContent = app.icon; btn.title = app.title; btn.className = 'open'; btn.dataset.win = id;
  btn.onclick = () => win.classList.contains('min') || win.style.zIndex == z ? toggleMin(win) : focus(win);
  tasks.append(btn);

  win.addEventListener('mousedown', () => focus(win));
  $('.min', win).onclick = () => toggleMin(win);
  $('.mx', win).onclick = () => win.classList.toggle('max');
  $('.close', win).onclick = () => { win.remove(); btn.remove(); };
  $('.title', win).ondblclick = () => win.classList.toggle('max');
  drag(win);
  focus(win);
  start.classList.add('hidden');
}

function focus(win) {
  win.classList.remove('min');
  win.style.zIndex = ++z;
  $$('#tasks button').forEach(b => b.classList.toggle('active', b.dataset.win === win.id));
}
function toggleMin(win) {
  win.classList.toggle('min');
  if (!win.classList.contains('min')) focus(win);
  else $$('#tasks button').forEach(b => b.classList.remove('active'));
}

/* ---------- Drag by title bar ---------- */
function drag(win) {
  const bar = $('.title', win);
  bar.addEventListener('pointerdown', e => {
    if (e.target.closest('button') || win.classList.contains('max')) return;
    const dx = e.clientX - win.offsetLeft, dy = e.clientY - win.offsetTop;
    bar.setPointerCapture(e.pointerId);
    const move = ev => {
      win.style.left = ev.clientX - dx + 'px';
      win.style.top = Math.max(0, ev.clientY - dy) + 'px';
    };
    bar.addEventListener('pointermove', move);
    bar.addEventListener('pointerup', () => bar.removeEventListener('pointermove', move), { once: true });
  });
}

/* ---------- Calculator logic ---------- */
function initCalc(win) {
  const out = $('output', win); let expr = '';
  const show = () => out.textContent = expr || '0';
  win.addEventListener('click', e => {
    const k = e.target.dataset?.k; if (!k) return;
    if (k === 'C') expr = '';
    else if (k === '⌫') expr = expr.slice(0, -1);
    else if (k === '±') expr = expr.startsWith('-') ? expr.slice(1) : expr && '-' + expr;
    else if (k === '=') {
      try {
        if (!/^[\d+\-*/%.() ]+$/.test(expr)) throw 0;
        expr = String(Function('"use strict";return (' + expr + ')')());
      } catch { expr = ''; out.textContent = 'Error'; return; }
    } else expr += k;
    show();
  });
}

/* ---------- Events: icons, start menu, taskbar ---------- */
$$('.icon').forEach(i => i.ondblclick = () => openApp(i.dataset.app));
$$('[data-app]').forEach(b => { if (!b.classList.contains('icon')) b.onclick = () => openApp(b.dataset.app); });
$('#startBtn').onclick = e => { e.stopPropagation(); start.classList.toggle('hidden'); };
document.addEventListener('click', e => { if (!start.contains(e.target)) start.classList.add('hidden'); });
$('#power').onclick = () => { document.body.innerHTML = '<div style="background:#000;height:100vh"></div>'; };

/* Search filter */
$('#start input').oninput = e => {
  const q = e.target.value.toLowerCase();
  $$('.pinned button').forEach(b => b.style.display = b.textContent.toLowerCase().includes(q) ? '' : 'none');
};

/* ---------- Clock ---------- */
function tick() {
  const d = new Date();
  $('#clock').innerHTML = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) +
    '<br>' + d.toLocaleDateString();
}
tick(); setInterval(tick, 1000);
