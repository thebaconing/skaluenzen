// Kernlogik: Leitern, Fingersätze, Sequenzen, MusicXML- und ZIP-Export.
// Läuft im Browser und in Node (für die Tests).
// ===== Kernlogik: Skalen, Lagen, Sequenzen, MusicXML, ZIP =====
const LETTERS = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
const NAT_PC = [0, 2, 4, 5, 7, 9, 11];
// Stimmungen: Leersaiten von der tiefsten zur höchsten Saite in wissenschaftlicher Notation (klingend, E2 = tiefe E-Saite).
// Neue Stimmung = neuer Eintrag hier, mehr ist nicht nötig. Vorzeichen als '#' oder 'b', z. B. 'Eb2'.
const TUNINGS = {
  standard: { label: 'Standard', strings: ['E2', 'A2', 'D3', 'G3', 'B3', 'E4'] },
  dropd: { label: 'Drop D', strings: ['D2', 'A2', 'D3', 'G3', 'B3', 'E4'] }
};
function parseTuningNote(t) {
  const m = /^([A-G])([#b]?)(-?\d)$/.exec(t);
  const letter = LETTERS.indexOf(m[1]), alter = m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0, octave = +m[3];
  return { step: m[1], letter, alter, octave, midi: (octave + 1) * 12 + NAT_PC[letter] + alter };
}
// Leersaiten als MIDI-Nummern, Index 0 = tiefste Saite
function tuningOpen(id) { return (TUNINGS[id] || TUNINGS.standard).strings.map(t => parseTuningNote(t).midi); }
const OPEN = tuningOpen('standard');
const MODES = {
  major: { label: 'Dur', iv: [0, 2, 4, 5, 7, 9, 11], xml: 'major' },
  minor: { label: 'Moll (natürlich)', iv: [0, 2, 3, 5, 7, 8, 10], xml: 'minor' }
};
// Leitertypen: Halbtonabstände und Buchstabenschritte je Modus, blue = Index der Blue Note
const TYPES = {
  scale: { label: 'Tonleiter', major: { iv: [0, 2, 4, 5, 7, 9, 11], st: [0, 1, 2, 3, 4, 5, 6] }, minor: { iv: [0, 2, 3, 5, 7, 8, 10], st: [0, 1, 2, 3, 4, 5, 6] } },
  penta: { label: 'Pentatonik', major: { iv: [0, 2, 4, 7, 9], st: [0, 1, 2, 4, 5] }, minor: { iv: [0, 3, 5, 7, 10], st: [0, 2, 3, 4, 6] } },
  blues: { label: 'Blues', major: { iv: [0, 2, 3, 4, 7, 9], st: [0, 1, 2, 2, 4, 5], blue: 2 }, minor: { iv: [0, 3, 5, 6, 7, 10], st: [0, 2, 3, 4, 4, 6], blue: 3 } }
};
// Grundtöne je Modus mit Vorzeichen-Zahl (fifths)
const ROOTS = {
  major: [['C', 0], ['G', 1], ['D', 2], ['A', 3], ['E', 4], ['B', 5], ['F#', 6], ['F', -1], ['Bb', -2], ['Eb', -3], ['Ab', -4], ['Db', -5]],
  minor: [['A', 0], ['E', 1], ['B', 2], ['F#', 3], ['C#', 4], ['G#', 5], ['D#', 6], ['D', -1], ['G', -2], ['C', -3], ['F', -4], ['Bb', -5], ['Eb', -6]]
};

function parseName(n) {
  const letter = LETTERS.indexOf(n[0]);
  const alter = n.slice(1) === '#' ? 1 : n.slice(1) === 'b' ? -1 : 0;
  return { letter, alter, pc: (NAT_PC[letter] + alter + 12) % 12 };
}
function displayName(letter, alter) {
  return LETTERS[letter] + (alter === 1 ? '♯' : alter === -1 ? '♭' : alter === 2 ? '𝄪' : alter === -2 ? '𝄫' : '');
}
function germanName(name, mode) {
  // Deutsche Schreibweise: B -> H, Bb -> B
  let n = name.replace('#', 'is');
  if (name === 'B') n = 'H';
  else if (name === 'Bb') n = 'B';
  else if (name === 'Eb') n = 'Es';
  else if (name === 'Ab') n = 'As';
  else if (name === 'Db') n = 'Des';
  else if (name.endsWith('b')) n = name[0] + 'es';
  return mode === 'minor' ? n.toLowerCase() + '-Moll' : n + '-Dur';
}

// Skala: 7 Stufen mit Schreibweise
function buildScale(rootName, mode, type = 'scale') {
  const r = parseName(rootName);
  const T = TYPES[type][mode], iv = T.iv;
  const sc = iv.map((s, d) => {
    const letter = (r.letter + T.st[d]) % 7;
    const pc = (r.pc + s) % 12;
    let alter = pc - NAT_PC[letter];
    if (alter > 6) alter -= 12;
    if (alter < -6) alter += 12;
    return { degree: d, letter, alter, pc, blue: d === T.blue };
  });
  sc.root = rootName; sc.mode = mode; sc.type = type;
  return sc;
}
function isBlue(scale, midi) { const d = degreeOf(scale, midi); return d >= 0 && scale[d].blue; }
function degreeOf(scale, midi) {
  const pc = ((midi % 12) + 12) % 12;
  return scale.findIndex(s => s.pc === pc);
}

// --- Fingersätze ---
// "pos": Lage mit 4-Bund-Fenster [f, f+3], Streckung auf f+4 nur wenn sonst ein Skalenton fehlt.
// Bei anderen Stimmungen wird das Fenster je Saite um die Abweichung zur Standardstimmung verschoben
// (Drop D: tiefe Saite 2 Bünde höher), damit das Griffbild gleich bleibt.
const posOff = open => open.map((m, s) => OPEN[s] - m);
function shapePosition(scale, f, open = OPEN) {
  const notes = [], off = posOff(open);
  let last = -1;
  for (let s = 0; s < 6; s++) {
    for (let fr = f + off[s]; fr <= f + off[s] + 4; fr++) {
      const m = open[s] + fr;
      if (m <= last || degreeOf(scale, m) < 0) continue;
      if (fr === f + off[s] + 4 && s < 5) {
        // nur nehmen, wenn die nächste Saite den Ton nicht im Fenster hat
        const nf = m - open[s + 1];
        if (nf >= f + off[s + 1] && nf <= f + off[s + 1] + 3) continue;
      }
      if (fr === f + off[s] + 4 && s === 5) continue;
      notes.push({ s, f: fr, m });
      last = m;
    }
  }
  return notes;
}
// "3nps": drei Töne pro Saite, beginnend bei Bund f auf der tiefen E-Saite
function shape3nps(scale, f, open = OPEN) {
  const notes = [];
  let m = open[0] + f;
  for (let s = 0; s < 6; s++) {
    for (let k = 0; k < 3; k++) {
      notes.push({ s, f: m - open[s], m });
      // nächster Skalenton
      do { m++; } while (degreeOf(scale, m) < 0);
    }
  }
  return notes;
}
// n Töne pro Saite (Tonleiter 3, Pentatonik 2)
function shapeNps(scale, f, per, open = OPEN) {
  const notes = [];
  let m = open[0] + f;
  for (let s = 0; s < 6; s++) for (let k = 0; k < per; k++) {
    notes.push({ s, f: m - open[s], m });
    do { m++; } while (degreeOf(scale, m) < 0);
  }
  return notes;
}
// Blues-Box: Pentatonik-Box (2 pro Saite) plus Blue Note an der nächstgelegenen Stelle
function shapeBluesBox(scale, f, open = OPEN) {
  const pent = buildScale(scale.root, scale.mode, 'penta');
  const box = shapeNps(pent, f, 2, open), out = [];
  const fr = box.map(n => n.f).filter(x => x > 0), lo = Math.min(...fr, f), hi = Math.max(...fr);
  box.forEach((a, i) => {
    out.push(a);
    const b = box[i + 1]; if (!b) return;
    for (let m = a.m + 1; m < b.m; m++) {
      if (!isBlue(scale, m)) continue;
      // Kandidaten: gleiche Saite wie der Ton davor oder nächste Saite; nimm den, der am wenigsten aus der Box ragt
      const out1 = x => x < lo ? lo - x : x > hi ? x - hi : 0;
      const fa = a.f + (m - a.m), fb = b.f - (b.m - m);
      if (a.s !== b.s && fb >= 0 && out1(fb) < out1(fa)) out.push({ s: b.s, f: fb, m });
      else out.push({ s: a.s, f: fa, m });
    }
  });
  return out;
}
function listShapes(scale, system, open = OPEN) {
  const out = [];
  for (let f = 0; f <= 12; f++) {
    const m0 = open[0] + f + (system === 'pos' ? posOff(open)[0] : 0); // erster Ton der Lage
    if (degreeOf(scale, m0) < 0 || isBlue(scale, m0)) continue;
    const notes = system === 'pos' ? shapePosition(scale, f, open) : scale.type === 'blues' ? shapeBluesBox(scale, f, open) : shapeNps(scale, f, scale.type === 'penta' ? 2 : 3, open);
    if (notes.some(n => n.f < 0 || n.f > 22)) continue;
    const r = notes.findIndex(n => degreeOf(scale, n.m) === 0);
    out.push({ f, notes, rootIdx: r, span: notes.length - 1 - r, type: scale.type });
  }
  return out.sort((a, b) => a.f - b.f);
}

// --- Übungsteile ---
const SECTIONS = [
  { id: 'threes', title: 'Achteltriolen in Dreiergruppen', sub: 'Skala in Dreiergruppen auf- und abwärts', pat: [0, 1, 2], unit: 'tri8' },
  { id: 'fours', title: 'Sechzehntel in Vierergruppen', sub: 'Skala in Vierergruppen auf- und abwärts', pat: [0, 1, 2, 3], unit: 's16' },
  { id: 'thirds', title: 'Sechzehntel in Terzen', sub: 'Terzen auf jeder Stufe (1-3, 2-4, 3-5 …) auf- und abwärts', pat: [0, 2], unit: 's16' },
  { id: 'triads', title: 'Sechzehnteltriolen 1-3-5', sub: 'Dreiklänge auf jeder Stufe', pat: [0, 2, 4], unit: 'tri16' },
  { id: 'sevenths', title: 'Sechzehntel 1-3-5-7', sub: 'Vierklänge auf jeder Stufe', pat: [0, 2, 4, 6], unit: 's16' }
];
// Dauer in Divisions (12 pro Viertel)
const UNITS = {
  tri8: { dur: 4, type: 'eighth', tuplet: true, perBeat: 3, beams: 1 },
  s16: { dur: 3, type: '16th', tuplet: false, perBeat: 4, beams: 2 },
  tri16: { dur: 2, type: '16th', tuplet: true, perBeat: 6, beams: 2 }
};
const DIV = 12, MEASURE = 48;
// Texte je Leitertyp (bei Pentatonik/Blues sind 1-3-5 Leiterstufen, keine Akkorde)
function sectionText(sec, type) {
  if (type === 'scale') return { title: sec.title, sub: sec.sub };
  const L = type === 'penta' ? 'Pentatonik' : 'Blues-Tonleiter';
  return {
    threes: { title: sec.title, sub: `${L} in Dreiergruppen auf- und abwärts` },
    fours: { title: sec.title, sub: `${L} in Vierergruppen auf- und abwärts` },
    thirds: { title: 'Sechzehntel in Sprüngen', sub: `immer einen Leiterton überspringen (1-3, 2-4, 3-5 … der ${L})` + (type === 'penta' ? ', ergibt Terzen und Quarten' : '') },
    triads: { title: 'Sechzehnteltriolen 1-3-5 der Leiter', sub: 'drei Töne im Abstand von je einem übersprungenen Leiterton, ab jeder Stufe (keine Dur-/Moll-Dreiklänge)' },
    sevenths: { title: 'Sechzehntel 1-3-5-7 der Leiter', sub: 'vier Töne im Abstand von je einem übersprungenen Leiterton, ab jeder Stufe' }
  }[sec.id];
}
function typeName(root, mode, type) { return germanName(root, mode) + (type === 'penta' ? '-Pentatonik' : type === 'blues' ? '-Blues' : ''); }

function sequenceIdx(pat, lo, hi) {
  const span = pat[pat.length - 1];
  const seq = [];
  for (let i = lo; i + span <= hi; i++) pat.forEach(p => seq.push(i + p));
  for (let i = hi; i - span >= lo; i--) pat.forEach(p => seq.push(i - p));
  if (seq[seq.length - 1] !== lo) seq.push(lo);
  return seq;
}

// Erzeugt Takte: [{events:[{kind:'note'|'rest', n, dur, type, tuplet, slot}]}]
function buildSection(sec, shape, range) {
  const lo = range === 'full' ? 0 : shape.rootIdx;
  const hi = shape.notes.length - 1;
  const idx = sequenceIdx(sec.pat, lo, hi);
  const u = UNITS[sec.unit];
  const perMeasure = MEASURE / u.dur;
  const events = idx.map((i, k) => ({ kind: 'note', n: shape.notes[i], dur: u.dur, type: u.type, tuplet: u.tuplet, slot: k }));
  // Auffüllen: Rest des Schlags mit Einheitspausen, dann Viertelpausen
  let pos = events.length * u.dur;
  let slot = events.length;
  while (pos % DIV !== 0) { events.push({ kind: 'rest', dur: u.dur, type: u.type, tuplet: u.tuplet, slot: slot++ }); pos += u.dur; }
  while (pos % MEASURE !== 0) { events.push({ kind: 'rest', dur: DIV, type: 'quarter', tuplet: false, slot: -1 }); pos += DIV; }
  const measures = [];
  let cur = [], acc = 0;
  for (const e of events) {
    cur.push(e); acc += e.dur;
    if (acc >= MEASURE) { measures.push(cur); cur = []; acc = 0; }
  }
  return { sec: Object.assign({}, sec, sectionText(sec, shape.type || 'scale')), unit: u, perMeasure, measures, count: idx.length };
}

function buildExercise(opts) {
  const scale = buildScale(opts.root, opts.mode, opts.type || 'scale');
  const tuning = TUNINGS[opts.tuning] ? opts.tuning : 'standard', open = tuningOpen(tuning);
  const shapes = listShapes(scale, opts.system, open);
  let shape = shapes.find(s => s.f === opts.fret);
  if (!shape) shape = bestShape(shapes, opts.range);
  const sections = SECTIONS.filter(s => opts.sections.includes(s.id)).map(s => buildSection(s, shape, opts.range));
  return { scale, shapes, shape, sections, tuning, open };
}
function bestShape(shapes, range) {
  return shapes.slice().sort((a, b) => (range === 'full' ? 0 : b.span - a.span) || (b.notes.length - a.notes.length) || a.f - b.f)[0];
}

// --- MusicXML ---
function xmlEsc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
function pitchXml(scale, midi) {
  const d = scale[degreeOf(scale, midi)];
  const written = midi + 12; // Gitarre klingt eine Oktave tiefer als notiert
  const oct = Math.floor((written - d.alter) / 12) - 1;
  return `<pitch><step>${LETTERS[d.letter]}</step>${d.alter ? `<alter>${d.alter}</alter>` : ''}<octave>${oct}</octave></pitch>`;
}
function beamInfo(measure) {
  // Balken innerhalb eines Schlags zwischen Noten
  const res = new Array(measure.length).fill(null);
  let pos = 0, beat = [], beatStart = 0;
  const flush = () => {
    const notes = beat.filter(i => measure[i].kind === 'note' && measure[i].type !== 'quarter');
    if (notes.length > 1) notes.forEach((i, k) => res[i] = k === 0 ? 'begin' : k === notes.length - 1 ? 'end' : 'continue');
    beat = [];
  };
  measure.forEach((e, i) => {
    if (pos >= beatStart + DIV) { flush(); beatStart += DIV * Math.floor((pos - beatStart) / DIV); }
    beat.push(i); pos += e.dur;
  });
  flush();
  return res;
}
function toMusicXML(ex, opts) {
  const title = `Skalenübung ${typeName(opts.root, opts.mode, opts.type || 'scale')}`;
  const fifths = ROOTS[opts.mode].find(r => r[0] === opts.root)[1];
  let mno = 0, out = '';
  ex.sections.forEach((S, si) => {
    S.measures.forEach((meas, mi) => {
      mno++;
      out += `<measure number="${mno}">`;
      if (mno === 1) {
        out += `<attributes><divisions>${DIV}</divisions><key><fifths>${fifths}</fifths><mode>${MODES[opts.mode].xml}</mode></key><time><beats>4</beats><beat-type>4</beat-type></time>` +
          `<clef><sign>G</sign><line>2</line><clef-octave-change>-1</clef-octave-change></clef>` +
          `<staff-details><staff-lines>6</staff-lines>` +
          TUNINGS[ex.tuning || 'standard'].strings.map(parseTuningNote).map((t, i) => `<staff-tuning line="${i + 1}"><tuning-step>${t.step}</tuning-step>${t.alter ? `<tuning-alter>${t.alter}</tuning-alter>` : ''}<tuning-octave>${t.octave}</tuning-octave></staff-tuning>`).join('') +
          `</staff-details><transpose><diatonic>0</diatonic><chromatic>0</chromatic><octave-change>-1</octave-change></transpose></attributes>`;
        out += `<direction placement="above"><direction-type><metronome><beat-unit>quarter</beat-unit><per-minute>${opts.bpm}</per-minute></metronome></direction-type><sound tempo="${opts.bpm}"/></direction>`;
      }
      if (mi === 0) {
        out += `<direction placement="above"><direction-type><words font-style="italic">${xmlEsc(S.sec.title)}</words></direction-type></direction>`;
        if (si > 0) out += `<direction placement="above"><direction-type><rehearsal>${si + 1}</rehearsal></direction-type></direction>`;
      }
      const beams = beamInfo(meas);
      meas.forEach((e, i) => {
        out += '<note>';
        out += e.kind === 'rest' ? '<rest/>' : pitchXml(ex.scale, e.n.m);
        out += `<duration>${e.dur}</duration><voice>1</voice><type>${e.type}</type>`;
        if (e.tuplet) out += `<time-modification><actual-notes>3</actual-notes><normal-notes>2</normal-notes></time-modification>`;
        if (e.kind === 'note') out += '<stem>up</stem>';
        if (beams[i]) {
          const lv = S.unit.beams;
          for (let l = 1; l <= lv; l++) out += `<beam number="${l}">${beams[i]}</beam>`;
        }
        let nots = '';
        if (e.tuplet && e.slot >= 0) {
          if (e.slot % 3 === 0) nots += '<tuplet type="start" bracket="yes"/>';
          if (e.slot % 3 === 2) nots += '<tuplet type="stop"/>';
        }
        if (e.kind === 'note') nots += `<technical><string>${6 - e.n.s}</string><fret>${e.n.f}</fret></technical>`;
        if (nots) out += `<notations>${nots.replace(/(<technical>.*<\/technical>)/, '$1')}</notations>`;
        out += '</note>';
      });
      if (mi === S.measures.length - 1) out += '<barline location="right"><bar-style>light-light</bar-style></barline>';
      if (si === ex.sections.length - 1 && mi === S.measures.length - 1) out = out.replace(/light-light<\/bar-style><\/barline>$/, 'light-heavy</bar-style></barline>');
      out += '</measure>';
    });
  });
  return `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<!DOCTYPE score-partwise PUBLIC "-//Recordare//DTD MusicXML 4.0 Partwise//EN" "http://www.musicxml.org/dtds/partwise.dtd">
<score-partwise version="4.0"><work><work-title>${xmlEsc(title)}</work-title></work>` +
    `<identification><encoding><software>Skalenübung Generator</software></encoding></identification>` +
    `<part-list><score-part id="P1"><part-name>Gitarre</part-name><score-instrument id="P1-I1"><instrument-name>Guitar</instrument-name></score-instrument><midi-instrument id="P1-I1"><midi-channel>1</midi-channel><midi-program>26</midi-program></midi-instrument></score-part></part-list>` +
    `<part id="P1">${out}</part></score-partwise>`;
}

// --- ZIP (ohne Kompression) ---
const CRC_T = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
function crc32(b) { let c = 0xFFFFFFFF; for (let i = 0; i < b.length; i++) c = CRC_T[(c ^ b[i]) & 0xFF] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; }
function makeZip(files) {
  const enc = new TextEncoder();
  const parts = [], central = [];
  let offset = 0;
  for (const f of files) {
    const name = enc.encode(f.name), data = typeof f.data === 'string' ? enc.encode(f.data) : f.data;
    const crc = crc32(data);
    const lh = new DataView(new ArrayBuffer(30));
    lh.setUint32(0, 0x04034b50, true); lh.setUint16(4, 20, true); lh.setUint16(6, 0x0800, true); lh.setUint16(8, 0, true);
    lh.setUint16(10, 0, true); lh.setUint16(12, 0x21, true); lh.setUint32(14, crc, true); lh.setUint32(18, data.length, true);
    lh.setUint32(22, data.length, true); lh.setUint16(26, name.length, true); lh.setUint16(28, 0, true);
    parts.push(new Uint8Array(lh.buffer), name, data);
    const ch = new DataView(new ArrayBuffer(46));
    ch.setUint32(0, 0x02014b50, true); ch.setUint16(4, 20, true); ch.setUint16(6, 20, true); ch.setUint16(8, 0x0800, true);
    ch.setUint16(10, 0, true); ch.setUint16(12, 0, true); ch.setUint16(14, 0x21, true); ch.setUint32(16, crc, true);
    ch.setUint32(20, data.length, true); ch.setUint32(24, data.length, true); ch.setUint16(28, name.length, true);
    ch.setUint32(42, offset, true);
    central.push(new Uint8Array(ch.buffer), name);
    offset += 30 + name.length + data.length;
  }
  const cSize = central.reduce((a, b) => a + b.length, 0);
  const end = new DataView(new ArrayBuffer(22));
  end.setUint32(0, 0x06054b50, true); end.setUint16(8, files.length, true); end.setUint16(10, files.length, true);
  end.setUint32(12, cSize, true); end.setUint32(16, offset, true);
  const all = [...parts, ...central, new Uint8Array(end.buffer)];
  const out = new Uint8Array(all.reduce((a, b) => a + b.length, 0));
  let p = 0; for (const a of all) { out.set(a, p); p += a.length; }
  return out;
}

if (typeof module !== 'undefined') module.exports = { TYPES, TUNINGS, tuningOpen, parseTuningNote, sectionText, OPEN, ROOTS, MODES, SECTIONS, UNITS, buildScale, listShapes, buildExercise, toMusicXML, makeZip, germanName, displayName, degreeOf, bestShape };
