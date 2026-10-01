// Texte der Oberfläche in allen Sprachen. Neue Sprache = neuer Block mit denselben Schlüsseln.
// {name} im Text wird durch den gleichnamigen Wert ersetzt. Läuft im Browser und in Node.
const LANGS = {
  de: {
    label: 'DE',
    // Seite
    'page.sub': 'Deine Übung in jeder Tonart und Lage, als Tonleiter, Pentatonik oder Blues: Dreier, Vierer, Sprünge, 1-3-5 und 1-3-5-7, auf- und abwärts.',
    'ctl.type': 'Leiter', 'type.scale': 'Tonleiter', 'type.penta': 'Pentatonik', 'type.blues': 'Blues',
    'ctl.mode': 'Tongeschlecht', 'mode.minor': 'Moll', 'mode.major': 'Dur',
    'ctl.root': 'Grundton', 'ctl.system': 'Fingersatz', 'ctl.tuning': 'Stimmung',
    'ctl.pos': 'Lage auf dem Griffbrett', 'ctl.range': 'Umfang', 'range.root': 'ab Grundton', 'range.full': 'ganze Lage',
    'ctl.secs': 'Teile', 'ctl.lang': 'Sprache',
    'sys.pos.scale': 'Lage (2–3 pro Saite)', 'sys.pos.other': 'Lage (4 Bünde)',
    'sys.nps.scale': '3 pro Saite', 'sys.nps.penta': 'Boxen (2 pro Saite)', 'sys.nps.blues': 'Boxen + Blue Note',
    'fb.aria': 'Griffbild der gewählten Lage',
    'tip': '<b>Wechselschlag:</b> immer streng abwechselnd anschlagen, einmal mit Abschlag beginnend, einmal mit Aufschlag. <b>Guitar Pro:</b> „Für Guitar Pro speichern“ liefert eine .musicxml (im Claude-Artefakt als ZIP, die erst entpackt werden muss). In Guitar Pro über Datei › Importieren › MusicXML öffnen. Alternativ „MusicXML kopieren“, in einen Texteditor einfügen und als .musicxml speichern. Natürliches Moll nutzt dieselben Töne wie die parallele Dur-Tonart (e-Moll = G-Dur), nur der Grundton wechselt. Die Blue Note ist im Griffbild gestrichelt umrandet.',
    // Leiste
    'play': '▶ Abspielen', 'stop': '■ Stopp', 'tempo': 'Tempo', 'vol': 'Lautstärke', 'tone': 'Klang', 'tone.aria': 'Klang, dumpf bis hell',
    'click': 'Metronom', 'loop': 'Schleife', 'follow': 'mitscrollen',
    'dl': 'Für Guitar Pro speichern', 'copy': 'MusicXML kopieren', 'print': 'Drucken',
    // Auswahllisten und Anzeige
    'acc.none': 'keine Vorzeichen',
    'pos.opt': 'Bund {lo}–{hi} · beginnt mit {note} ({deg}. Stufe)', 'pos.best': ' · größter Umfang',
    'blue': ' (Blue Note)', 'blue.bflat': ' (= B♭, Blue Note)', 'relmajor': '  (Paralleltonart {key})',
    'sec.playOnly': '▶ nur diesen Teil', 'sec.none': 'Wähle oben mindestens einen Teil aus.',
    // Status
    'st.noAudio': 'Dieser Browser kann keinen Ton abspielen.',
    'st.blocked': 'Der Browser hat die Tonausgabe blockiert. Bitte nochmal auf Abspielen tippen.',
    'st.playing': 'Spielt: {title}', 'st.playingAll': 'Spielt alle gewählten Teile, mit vier Klicks Einzähler.',
    'st.saved': 'Gespeichert. ZIP entpacken und die .musicxml in Guitar Pro importieren.',
    'st.saveCancel': 'Speichern abgebrochen.', 'st.saveFail': 'Speichern ging hier nicht. Nutze „MusicXML kopieren“.',
    'st.copied': 'MusicXML kopiert. In einen Editor einfügen und als {file}.musicxml speichern.',
    'st.copyFail': 'Kopieren wurde vom Browser blockiert.',
    // Export
    'xml.title': 'Skalenübung {name}', 'file.prefix': 'Skalenuebung', 'file.fret': 'Bund', 'file.nps': '3proSaite', 'file.box': 'Box',
    // Übungsteile
    'sec.threes.title': 'Achteltriolen in Dreiergruppen', 'sec.threes.sub': 'Skala in Dreiergruppen auf- und abwärts',
    'sec.fours.title': 'Sechzehntel in Vierergruppen', 'sec.fours.sub': 'Skala in Vierergruppen auf- und abwärts',
    'sec.thirds.title': 'Sechzehntel in Terzen', 'sec.thirds.sub': 'Terzen auf jeder Stufe (1-3, 2-4, 3-5 …) auf- und abwärts',
    'sec.triads.title': 'Sechzehnteltriolen 1-3-5', 'sec.triads.sub': 'Dreiklänge auf jeder Stufe',
    'sec.sevenths.title': 'Sechzehntel 1-3-5-7', 'sec.sevenths.sub': 'Vierklänge auf jeder Stufe',
    'scl.penta': 'Pentatonik', 'scl.blues': 'Blues-Tonleiter',
    'secx.threes.sub': '{L} in Dreiergruppen auf- und abwärts',
    'secx.fours.sub': '{L} in Vierergruppen auf- und abwärts',
    'secx.thirds.title': 'Sechzehntel in Sprüngen', 'secx.thirds.sub': 'immer einen Leiterton überspringen (1-3, 2-4, 3-5 … der {L})', 'secx.thirds.penta': ', ergibt Terzen und Quarten',
    'secx.triads.title': 'Sechzehnteltriolen 1-3-5 der Leiter', 'secx.triads.sub': 'drei Töne im Abstand von je einem übersprungenen Leiterton, ab jeder Stufe (keine Dur-/Moll-Dreiklänge)',
    'secx.sevenths.title': 'Sechzehntel 1-3-5-7 der Leiter', 'secx.sevenths.sub': 'vier Töne im Abstand von je einem übersprungenen Leiterton, ab jeder Stufe'
  },
  en: {
    label: 'EN',
    'page.sub': 'Your exercise in every key and position, as a scale, pentatonic or blues: threes, fours, skips, 1-3-5 and 1-3-5-7, up and down.',
    'ctl.type': 'Scale', 'type.scale': 'Scale', 'type.penta': 'Pentatonic', 'type.blues': 'Blues',
    'ctl.mode': 'Mode', 'mode.minor': 'Minor', 'mode.major': 'Major',
    'ctl.root': 'Key', 'ctl.system': 'Fingering', 'ctl.tuning': 'Tuning',
    'ctl.pos': 'Fretboard position', 'ctl.range': 'Range', 'range.root': 'from root', 'range.full': 'whole position',
    'ctl.secs': 'Parts', 'ctl.lang': 'Language',
    'sys.pos.scale': 'Position (2–3 per string)', 'sys.pos.other': 'Position (4 frets)',
    'sys.nps.scale': '3 per string', 'sys.nps.penta': 'Boxes (2 per string)', 'sys.nps.blues': 'Boxes + blue note',
    'fb.aria': 'Fretboard diagram of the selected position',
    'tip': '<b>Alternate picking:</b> strictly alternate down- and upstrokes, once starting with a downstroke, once with an upstroke. <b>Guitar Pro:</b> “Save for Guitar Pro” delivers a .musicxml (as a ZIP inside the Claude artifact, unzip it first). In Guitar Pro open it via File › Import › MusicXML. Alternatively use “Copy MusicXML”, paste into a text editor and save as .musicxml. Natural minor uses the same notes as its relative major (E minor = G major), only the root changes. The blue note has a dashed outline in the fretboard diagram.',
    'play': '▶ Play', 'stop': '■ Stop', 'tempo': 'Tempo', 'vol': 'Volume', 'tone': 'Tone', 'tone.aria': 'Tone, dark to bright',
    'click': 'Metronome', 'loop': 'Loop', 'follow': 'follow',
    'dl': 'Save for Guitar Pro', 'copy': 'Copy MusicXML', 'print': 'Print',
    'acc.none': 'no accidentals',
    'pos.opt': 'Frets {lo}–{hi} · starts on {note} (degree {deg})', 'pos.best': ' · widest range',
    'blue': ' (blue note)', 'blue.bflat': ' (blue note)', 'relmajor': '  (relative major {key})',
    'sec.playOnly': '▶ play this part', 'sec.none': 'Select at least one part above.',
    'st.noAudio': 'This browser cannot play sound.',
    'st.blocked': 'The browser blocked audio output. Please tap Play again.',
    'st.playing': 'Playing: {title}', 'st.playingAll': 'Playing all selected parts, with a four-click count-in.',
    'st.saved': 'Saved. Unzip and import the .musicxml into Guitar Pro.',
    'st.saveCancel': 'Saving cancelled.', 'st.saveFail': 'Saving does not work here. Use “Copy MusicXML”.',
    'st.copied': 'MusicXML copied. Paste into an editor and save as {file}.musicxml.',
    'st.copyFail': 'The browser blocked copying.',
    'xml.title': 'Scale exercise {name}', 'file.prefix': 'Scale_exercise', 'file.fret': 'fret', 'file.nps': '3perString', 'file.box': 'box',
    'sec.threes.title': 'Eighth-note triplets in groups of three', 'sec.threes.sub': 'scale in groups of three, up and down',
    'sec.fours.title': 'Sixteenths in groups of four', 'sec.fours.sub': 'scale in groups of four, up and down',
    'sec.thirds.title': 'Sixteenths in thirds', 'sec.thirds.sub': 'thirds on every degree (1-3, 2-4, 3-5 …), up and down',
    'sec.triads.title': 'Sixteenth-note triplets 1-3-5', 'sec.triads.sub': 'triads on every degree',
    'sec.sevenths.title': 'Sixteenths 1-3-5-7', 'sec.sevenths.sub': 'seventh chords on every degree',
    'scl.penta': 'pentatonic', 'scl.blues': 'blues scale',
    'secx.threes.sub': '{L} in groups of three, up and down',
    'secx.fours.sub': '{L} in groups of four, up and down',
    'secx.thirds.title': 'Sixteenths in skips', 'secx.thirds.sub': 'always skip one scale note (1-3, 2-4, 3-5 … of the {L})', 'secx.thirds.penta': ', giving thirds and fourths',
    'secx.triads.title': 'Sixteenth-note triplets 1-3-5 of the scale', 'secx.triads.sub': 'three notes, each skipping one scale note, from every degree (not major/minor triads)',
    'secx.sevenths.title': 'Sixteenths 1-3-5-7 of the scale', 'secx.sevenths.sub': 'four notes, each skipping one scale note, from every degree'
  }
};
let LANG = 'de';
function setLang(l) { LANG = LANGS[l] ? l : 'de'; }
function t(key, vars) {
  let s = LANGS[LANG][key]; if (s == null) s = LANGS.de[key]; if (s == null) return key;
  return vars ? s.replace(/\{(\w+)\}/g, (m, k) => vars[k] != null ? vars[k] : m) : s;
}
// Notenname: Deutsch mit H/B, Englisch mit B/B♭
function noteName(letter, alter) {
  const L = 'CDEFGAB'[letter], acc = alter === 1 ? '♯' : alter === -1 ? '♭' : alter === 2 ? '𝄪' : alter === -2 ? '𝄫' : '';
  if (LANG === 'de' && L === 'B') return alter === 0 ? 'H' : alter === -1 ? 'B' : 'H' + acc;
  return L + acc;
}
// Tonartname, z. B. „e-Moll“ / „Fis-Dur“ bzw. „E minor“ / „F♯ major“
function keyName(name, mode) {
  if (LANG === 'en') {
    const letter = 'CDEFGAB'.indexOf(name[0]), alter = name[1] === '#' ? 1 : name[1] === 'b' ? -1 : 0;
    return noteName(letter, alter) + (mode === 'minor' ? ' minor' : ' major');
  }
  let n = name.replace('#', 'is');
  if (name === 'B') n = 'H';
  else if (name === 'Bb') n = 'B';
  else if (name === 'Eb') n = 'Es';
  else if (name === 'Ab') n = 'As';
  else if (name.endsWith('b')) n = name[0] + 'es';
  return mode === 'minor' ? n.toLowerCase() + '-Moll' : n + '-Dur';
}
function typeName(root, mode, type) {
  const k = keyName(root, mode);
  if (type === 'scale') return k;
  return LANG === 'en' ? k + (type === 'penta' ? ' pentatonic' : ' blues') : k + (type === 'penta' ? '-Pentatonik' : '-Blues');
}

if (typeof module !== 'undefined') module.exports = { LANGS, setLang, t, noteName, keyName, typeName };
