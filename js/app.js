// Oberfläche, Tabulatur-Darstellung, Wiedergabe und Export.
(() => {
const $ = id => document.getElementById(id);
const STORE = 'skalenseq-v1';
let st = { type: 'scale', mode: 'minor', root: 'E', system: 'pos', fret: null, range: 'root', bpm: 90, sections: SECTIONS.map(s => s.id) };
try { const s = JSON.parse(localStorage.getItem(STORE) || 'null'); if (s) st = Object.assign(st, s); } catch (e) {}
if (st.system === '3nps') st.system = 'nps';
if (!TYPES[st.type]) st.type = 'scale';
const save = () => { try { localStorage.setItem(STORE, JSON.stringify(st)); } catch (e) {} };

function deNote(letter, alter) {
  const L = 'CDEFGAB'[letter];
  if (L === 'B') return alter === 0 ? 'H' : alter === -1 ? 'B' : 'H' + (alter > 0 ? '♯' : '♭');
  return L + (alter === 1 ? '♯' : alter === -1 ? '♭' : alter === 2 ? '𝄪' : alter === -2 ? '𝄫' : '');
}
function deRoot(n) { const p = { letter: 'CDEFGAB'.indexOf(n[0]), alter: n[1] === '#' ? 1 : n[1] === 'b' ? -1 : 0 }; return deNote(p.letter, p.alter); }
const DEG = ['1', '2', '3', '4', '5', '6', '7'];

let ex = null, noteEls = [];

function setSeg(id, v) { $(id).querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', b.dataset.v === v)); }
function fillRoots() {
  const list = ROOTS[st.mode];
  if (!list.some(r => r[0] === st.root)) st.root = list[0][0];
  $('root').innerHTML = list.map(r => `<option value="${r[0]}">${deRoot(r[0])}${st.mode === 'minor' ? '-Moll' : '-Dur'}  (${r[1] === 0 ? 'keine Vorzeichen' : Math.abs(r[1]) + (r[1] > 0 ? ' ♯' : ' ♭')})</option>`).join('');
  $('root').value = st.root;
}
function fillPositions() {
  const scale = buildScale(st.root, st.mode, st.type);
  const shapes = listShapes(scale, st.system);
  if (!shapes.some(s => s.f === st.fret)) st.fret = bestShape(shapes, st.range).f;
  const best = bestShape(shapes, st.range).f;
  $('pos').innerHTML = shapes.map(s => {
    const n0 = s.notes[0]; const d = scale[degreeOf(scale, n0.m)];
    const fs = s.notes.map(n => n.f), lo = Math.min(...fs), hi = Math.max(...fs);
    return `<option value="${s.f}">Bund ${lo}–${hi} · beginnt mit ${deNote(d.letter, d.alter)} (${d.degree + 1}. Stufe)${s.f === best ? ' · größter Umfang' : ''}</option>`;
  }).join('');
  $('pos').value = st.fret;
}
function fillSecs() {
  $('secs').innerHTML = SECTIONS.map(s => `<button class="chip" data-v="${s.id}" aria-pressed="${st.sections.includes(s.id)}">${sectionText(s, st.type).title}</button>`).join('');
}

// ---------- Griffbild ----------
function drawBoard() {
  const sh = ex.shape, fs = sh.notes.map(n => n.f).filter(f => f > 0);
  const hasOpen = sh.notes.some(n => n.f === 0);
  const lo = hasOpen ? 1 : Math.max(1, Math.min(...fs)), hi = Math.max(...fs, lo + 3);
  const nF = hi - lo + 1, fw = 38, sh_ = 18, ox = hasOpen ? 46 : 30, oy = 12;
  const W = ox + nF * fw + 8, H = oy + 5 * sh_ + 28;
  let s = '';
  for (let i = 0; i < 6; i++) { const y = oy + (5 - i) * sh_; s += `<line x1="${ox}" y1="${y}" x2="${ox + nF * fw}" y2="${y}" stroke="var(--staff)" stroke-width="${1 + (5 - i) * 0.25}"/><text x="${hasOpen ? 10 : ox - 16}" y="${y + 4}" fill="var(--muted)" text-anchor="middle">${STR_NAMES[i]}</text>`; }
  for (let c = 0; c <= nF; c++) { const x = ox + c * fw; s += `<line x1="${x}" y1="${oy}" x2="${x}" y2="${oy + 5 * sh_}" stroke="var(--fg)" stroke-opacity="${c === 0 && lo === 1 ? 0.9 : 0.35}" stroke-width="${c === 0 && lo === 1 ? 4 : 1}"/>`; }
  for (let f = lo; f <= hi; f++) { const mk = [3, 5, 7, 9, 12, 15, 17].includes(f); s += `<text x="${ox + (f - lo + 0.5) * fw}" y="${oy + 5 * sh_ + 20}" fill="var(--${mk ? 'fg' : 'muted'})" text-anchor="middle">${f}</text>`; }
  for (const n of sh.notes) {
    const d = ex.scale[degreeOf(ex.scale, n.m)];
    const x = n.f === 0 ? ox - 14 : ox + (n.f - lo + 0.5) * fw, y = oy + (5 - n.s) * sh_;
    const root = d.degree === 0;
    s += `<circle cx="${x}" cy="${y}" r="8.5" fill="${root ? 'var(--accent)' : 'var(--panel)'}" stroke="${root ? 'var(--accent)' : 'var(--fg)'}" stroke-width="1.2"${d.blue ? ' stroke-dasharray="2.5 2"' : ''}/>` +
      `<text x="${x}" y="${y + 3.6}" text-anchor="middle" fill="${root ? 'var(--accent-ink)' : 'var(--fg)'}">${deNote(d.letter, d.alter)}</text>`;
  }
  const svg = $('fb'); svg.setAttribute('viewBox', `0 0 ${W} ${H}`); svg.setAttribute('width', W); svg.setAttribute('height', H); svg.innerHTML = s;
}

// ---------- Tabulatur ----------
const LY = 16, LS = 12; // erste Linie, Linienabstand
function measureSvg(meas, S, num) {
  const u = S.unit, step = u.perBeat === 6 ? 15 : u.perBeat === 4 ? 20 : 26;
  const pad = 14, W = pad * 2 + (48 / u.dur) * step - step + 6, H = 122;
  const xAt = q => pad + 3 + (q / u.dur) * step; // q in Divisions
  let s = '';
  for (let i = 0; i < 6; i++) s += `<line class="ln" x1="0" x2="${W}" y1="${LY + i * LS}" y2="${LY + i * LS}"/>`;
  s += `<line class="bl" x1="${W - 0.6}" x2="${W - 0.6}" y1="${LY}" y2="${LY + 5 * LS}"/>`;
  s += `<text class="mn" x="3" y="10">${num}</text>`;
  let q = 0; const xs = [];
  const yStemTop = LY + 5 * LS + 9, yBeam = yStemTop + 18;
  meas.forEach((e, i) => {
    const x = xAt(q); xs.push(x);
    if (e.kind === 'note') {
      const y = LY + (5 - e.n.s) * LS, txt = String(e.n.f), w = txt.length * 7.6 + 3;
      s += `<g class="n" data-k="${e._k}"><rect class="bg" x="${x - w / 2}" y="${y - 7}" width="${w}" height="14" rx="3"/><text class="fr" x="${x}" y="${y + 4.2}" text-anchor="middle">${txt}</text></g>`;
      if (e.type !== 'quarter') s += `<line class="rh" x1="${x}" x2="${x}" y1="${yStemTop}" y2="${yBeam}"/>`;
    } else if (e.type === 'quarter') {
      const cx = x + 4, y0 = yStemTop;
      s += `<path class="rh" d="M${cx - 2} ${y0} l4 5 l-4 4 l4 5 c-4 -2 -6 1 -2 4"/>`;
    } else {
      s += `<path class="rh" d="M${x - 2} ${yStemTop + 4} q3 2 5 -2 l-4 11"/>`;
    }
    q += e.dur;
  });
  // Balken pro Schlag
  q = 0; let beat = [];
  const flush = () => {
    const ns = beat.filter(o => o.e.kind === 'note' && o.e.type !== 'quarter');
    if (ns.length > 1) {
      const x1 = ns[0].x, x2 = ns[ns.length - 1].x;
      s += `<rect class="bm" x="${x1 - .6}" y="${yBeam - 2.5}" width="${x2 - x1 + 1.2}" height="2.5"/>`;
      if (u.beams > 1) s += `<rect class="bm" x="${x1 - .6}" y="${yBeam - 7}" width="${x2 - x1 + 1.2}" height="2.5"/>`;
    } else if (ns.length === 1) {
      const x = ns[0].x; s += `<path class="rh" d="M${x} ${yBeam} q6 -3 6 -9"/>`;
    }
    if (u.tuplet && beat.length && beat.every(o => o.e.tuplet)) {
      const groups = u.perBeat === 3 ? [beat] : [beat.slice(0, 3), beat.slice(3, 6)];
      groups.forEach(g => { if (g.length < 3) return; const a = g[0].x, b = g[2].x, yy = yBeam + 7; s += `<path class="rh" d="M${a} ${yy - 3} v3 H${(a + b) / 2 - 5} M${(a + b) / 2 + 5} ${yy} H${b} v-3"/><text class="tu" x="${(a + b) / 2}" y="${yy + 3.5}" text-anchor="middle">3</text>`; });
    }
    beat = [];
  };
  meas.forEach((e, i) => { if (q > 0 && q % 12 === 0) flush(); beat.push({ e, x: xs[i] }); q += e.dur; });
  flush();
  return `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" aria-hidden="true">${s}</svg>`;
}

function render() {
  stop();
  $('sysPos').textContent = st.type === 'scale' ? 'Lage (2–3 pro Saite)' : st.type === 'penta' ? 'Lage (4 Bünde)' : 'Lage (4 Bünde)';
  $('sysNps').textContent = st.type === 'scale' ? '3 pro Saite' : st.type === 'penta' ? 'Boxen (2 pro Saite)' : 'Boxen + Blue Note';
  fillRoots(); fillPositions(); fillSecs(); setSeg('type', st.type); setSeg('mode', st.mode); setSeg('system', st.system); setSeg('range', st.range);
  $('bpm').value = st.bpm; $('bpmOut').value = st.bpm;
  ex = buildExercise({ type: st.type, root: st.root, mode: st.mode, system: st.system, fret: st.fret, range: st.range, sections: st.sections });
  const nm = typeName(st.root, st.mode, st.type);
  $('keyTitle').textContent = nm;
  $('keySub').textContent = ex.scale.map(d => deNote(d.letter, d.alter) + (d.blue ? (d.letter === 6 && d.alter === -1 ? ' (= B♭, Blue Note)' : ' (Blue Note)') : '')).join(' · ') + (st.mode === 'minor' ? `  (Paralleltonart ${deRoot(relMajor())}-Dur)` : '');
  drawBoard();
  noteEls = []; let k = 0, mno = 0, html = '';
  ex.sections.forEach((S, si) => {
    let svgs = '';
    S.measures.forEach(m => { m.forEach(e => { if (e.kind === 'note') e._k = k++; }); svgs += measureSvg(m, S, ++mno); });
    html += `<section class="sec"><div class="sec-head"><h3>${S.sec.title}</h3><p>${S.sec.sub}</p><button class="btn" data-play="${si}">▶ nur diesen Teil</button></div><div class="staff">${svgs}</div></section>`;
  });
  $('out').innerHTML = html || '<p class="status">Wähle oben mindestens einen Teil aus.</p>';
  document.querySelectorAll('#out g.n').forEach(g => noteEls[+g.dataset.k] = g);
  save();
}
function relMajor() { const sc = buildScale(st.root, st.mode, 'scale'); const d = sc[2]; return 'CDEFGAB'[d.letter] + (d.alter === 1 ? '#' : d.alter === -1 ? 'b' : ''); }

// ---------- Audio ----------
let master = null, ac = null, timer = null, playing = false, queue = [], qi = 0, nextT = 0, lastOn = null, loopIdx = null, rafId = 0;
const bufCache = new Map();
function ks(m) {
  if (bufCache.has(m)) return bufCache.get(m);
  const sr = ac.sampleRate, f = 440 * Math.pow(2, (m - 69) / 12), N = Math.round(sr / f), len = Math.floor(sr * 1.4);
  const b = ac.createBuffer(1, len, sr), y = b.getChannelData(0);
  for (let i = 0; i < N; i++) y[i] = Math.random() * 2 - 1;
  for (let i = 1; i < N; i++) y[i] = 0.5 * (y[i] + y[i - 1]);
  const damp = 0.4985 + Math.min(0.0012, m / 100000);
  for (let i = N; i < len; i++) y[i] = damp * (y[i - N] + y[i - N - 1 < 0 ? 0 : i - N - 1]);
  bufCache.set(m, b); return b;
}
function pluck(m, t, dur) {
  const src = ac.createBufferSource(); src.buffer = ks(m);
  const g = ac.createGain(); g.gain.setValueAtTime(0.55, t); g.gain.setTargetAtTime(0, t + Math.max(0.08, dur * 0.95), 0.03);
  src.connect(g).connect(master); src.start(t); src.stop(t + dur + 0.3);
}
function click(t, strong) {
  const o = ac.createOscillator(), g = ac.createGain(); o.frequency.value = strong ? 1600 : 1100;
  g.gain.setValueAtTime(strong ? 0.22 : 0.13, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.04);
  o.connect(g).connect(master); o.start(t); o.stop(t + 0.05);
}
function buildQueue(only) {
  const q = []; let pos = 0; // pos in Divisions
  // Einzähler: 4 Klicks
  for (let b = 0; b < 4; b++) q.push({ at: pos + b * 12, click: true, strong: b === 0, count: true });
  pos += 48;
  ex.sections.forEach((S, si) => {
    if (only != null && si !== only) return;
    S.measures.forEach(m => {
      for (let b = 0; b < 4; b++) q.push({ at: pos + b * 12, click: true, strong: b === 0 });
      let p = pos;
      m.forEach(e => { if (e.kind === 'note') q.push({ at: p, m: e.n.m, k: e._k, dur: e.dur }); p += e.dur; });
      pos += 48;
    });
  });
  q.sort((a, b) => a.at - b.at || (a.click ? -1 : 1));
  return { q, total: pos };
}
let shown = [];
function schedule() {
  const spd = 60 / st.bpm / 12; // Sekunden pro Division
  // Hing der Browser kurz (Tab im Hintergrund, Rechenlast), Zeitachse nachziehen statt Töne auf einmal abzufeuern
  if (playing && endAt == null && nextT < ac.currentTime) nextT = ac.currentTime + 0.05;
  while (playing && nextT < ac.currentTime + 0.25) {
    if (qi >= queue.q.length) {
      if ($('loop').checked) { const first = queue.q.find(e => !e.count); const gap = queue.total - curAt; qi = queue.q.indexOf(first); curAt = first.at - gap; continue; }
      // Ende: der Scheduler läuft weiter und beendet genau diesen Durchlauf, wenn der letzte Ton verklungen ist
      if (endAt == null) endAt = nextT + 0.6;
      if (ac.currentTime >= endAt) { stop(); $('status').textContent = ''; }
      break;
    }
    const ev = queue.q[qi];
    nextT += (ev.at - curAt) * spd; curAt = ev.at;
    if (ev.click) { if ($('click').checked || ev.count) click(nextT, ev.strong); }
    else { pluck(ev.m, nextT, ev.dur * spd); shown.push({ t: nextT, k: ev.k }); }
    qi++;
  }
}
let curAt = 0, endAt = null, runId = 0;
function frame() {
  if (!playing) return;
  const now = ac.currentTime;
  let cur = null;
  while (shown.length && shown[0].t <= now) cur = shown.shift();
  if (cur) {
    if (lastOn) lastOn.classList.remove('on');
    lastOn = noteEls[cur.k]; if (lastOn) {
      lastOn.classList.add('on');
      if ($('follow').checked) { const svg = lastOn.ownerSVGElement, r = svg.getBoundingClientRect(); if (Date.now() > userScrollUntil && (r.top < 20 || r.bottom > innerHeight - dockH() - 10)) svg.scrollIntoView({ block: 'center', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' }); }
    }
  }
  rafId = requestAnimationFrame(frame);
}
async function start(only) {
  if (!ex.sections.length) return;
  if (!ac) { const C = window.AudioContext || window.webkitAudioContext; if (!C) { $('status').textContent = 'Dieser Browser kann keinen Ton abspielen.'; return; } ac = new C(); }
  stop();
  const my = ++runId;
  playing = true; $('play').textContent = '■ Stopp';
  // Erst warten, bis die Audioausgabe wirklich läuft, dann die Zeitachse festlegen
  try { if (ac.state !== 'running') await ac.resume(); } catch (e) {}
  if (my !== runId || !playing) return;
  if (ac.state !== 'running') { stop(); $('status').textContent = 'Der Browser hat die Tonausgabe blockiert. Bitte nochmal auf Abspielen tippen.'; return; }
  queue = buildQueue(only);
  queue.q.forEach(e => { if (!e.click) ks(e.m); }); // Gitarrenklänge vorab berechnen
  master = ac.createGain(); master.connect(ac.destination);
  qi = 0; curAt = 0; endAt = null; nextT = ac.currentTime + 0.12; shown = [];
  timer = setInterval(schedule, 25); schedule(); frame();
  $('status').textContent = only != null ? `Spielt: ${ex.sections[only].sec.title}` : 'Spielt alle gewählten Teile, mit vier Klicks Einzähler.';
}
function stop() {
  runId++; endAt = null;
  playing = false; if (timer) clearInterval(timer); timer = null; cancelAnimationFrame(rafId);
  if (lastOn) lastOn.classList.remove('on'); lastOn = null;
  if ($('play')) $('play').textContent = '▶ Abspielen';
  if (master) { try { master.disconnect(); } catch (e) {} master = null; }
}

// Manuelles Scrollen pausiert das Mitscrollen für 4 Sekunden
let userScrollUntil = 0;
const pauseFollow = () => { if (playing) userScrollUntil = Date.now() + 4000; };
['wheel', 'touchmove'].forEach(t => addEventListener(t, pauseFollow, { passive: true }));
addEventListener('keydown', e => { if (['ArrowUp','ArrowDown','PageUp','PageDown','Home','End',' '].includes(e.key) && !e.target.closest('input,select,button')) pauseFollow(); });
const dock = document.querySelector('.dock');
function dockH() { return dock.offsetHeight; }
const setDockVar = () => document.documentElement.style.setProperty('--dock-h', dockH() + 'px');
new ResizeObserver(setDockVar).observe(dock); setDockVar();

// ---------- Export ----------
function fileBase() { return `Skalenuebung_${typeName(st.root, st.mode, st.type).replace(/[^A-Za-z0-9-]/g, '')}_Bund${ex.shape.f}${st.system === 'nps' ? (st.type === 'scale' ? '_3proSaite' : '_Box') : ''}`; }
function xml() { return toMusicXML(ex, { type: st.type, root: st.root, mode: st.mode, bpm: st.bpm }); }
let downloads = null;
(async () => { try { downloads = window.claude ? await window.claude.use('downloads') : null; } catch (e) { downloads = null; } $('dl').hidden = false; })();
$('dl').onclick = async () => {
  const base = fileBase();
  if (!downloads) {
    // Normaler Browser: MusicXML direkt herunterladen
    const url = URL.createObjectURL(new Blob([xml()], { type: 'application/vnd.recordare.musicxml+xml' }));
    const a = document.createElement('a'); a.href = url; a.download = base + '.musicxml'; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    $('status').textContent = 'Gespeichert. Die .musicxml in Guitar Pro über Datei › Importieren › MusicXML öffnen.';
    return;
  }
  try { await downloads.save({ filename: base + '.zip', data: new Blob([makeZip([{ name: base + '.musicxml', data: xml() }])]) }); $('status').textContent = 'Gespeichert. ZIP entpacken und die .musicxml in Guitar Pro importieren.'; }
  catch (e) { $('status').textContent = e && e.code === 'declined' ? 'Speichern abgebrochen.' : 'Speichern ging hier nicht. Nutze „MusicXML kopieren“.'; }
};
$('copy').onclick = () => {
  const t = xml();
  navigator.clipboard.writeText(t).then(() => { $('status').textContent = `MusicXML kopiert. In einen Editor einfügen und als ${fileBase()}.musicxml speichern.`; })
    .catch(() => { $('status').textContent = 'Kopieren wurde vom Browser blockiert.'; });
};

// ---------- Events ----------
$('mode').onclick = e => { const v = e.target.dataset.v; if (!v) return; if (v !== st.mode) { st.root = v === 'minor' ? (ROOTS.minor.find(r => r[1] === ROOTS.major.find(x => x[0] === st.root)?.[1])?.[0] || 'E') : (ROOTS.major.find(r => r[1] === ROOTS.minor.find(x => x[0] === st.root)?.[1])?.[0] || 'G'); st.fret = null; } st.mode = v; render(); };
$('type').onclick = e => { const v = e.target.dataset.v; if (!v || v === st.type) return; st.type = v; st.fret = null; render(); };
$('root').onchange = e => { st.root = e.target.value; st.fret = null; render(); };
$('system').onclick = e => { const v = e.target.dataset.v; if (!v) return; st.system = v; st.fret = null; render(); };
$('pos').onchange = e => { st.fret = +e.target.value; render(); };
$('range').onclick = e => { const v = e.target.dataset.v; if (!v) return; st.range = v; render(); };
$('secs').onclick = e => { const v = e.target.dataset.v; if (!v) return; st.sections = st.sections.includes(v) ? st.sections.filter(x => x !== v) : SECTIONS.map(s => s.id).filter(id => id === v || st.sections.includes(id)); fillSecs(); render(); };
$('bpm').oninput = e => { st.bpm = +e.target.value; $('bpmOut').value = st.bpm; save(); };
$('play').onclick = () => playing ? (stop(), $('status').textContent = '') : start(null);
$('out').onclick = e => { const b = e.target.closest('[data-play]'); if (b) start(+b.dataset.play); };

fillSecs(); render();
})();
