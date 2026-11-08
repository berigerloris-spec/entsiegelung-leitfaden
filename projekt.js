'use strict';
// Projekte, Ordner und Zuordnung der Unterlagen (ab lf-v23, Datenformat 3).
//
// Modell
// - Ein Projekt enthält mehrere Untersuchungsflächen (S.flaechen mit projektId), gemeinsame Projektunterlagen
//   (projekt.dokumente) und eine Ordnerstruktur (projekt.ordner). Eine Fläche ist nicht dasselbe wie ein Projekt.
// - Jede Unterlage liegt in genau einem Ordner (dokument.ordner). Sie gehört entweder zu einer Fläche
//   (fläche.dokumente: nur diese Unterlagen gelten als Quellen der Prüfpunkte) oder zum Projekt (projekt.dokumente).
//   Der Ordner allein macht eine Unterlage nie zur Quelle und erfüllt keinen Prüfpunkt.
// - Ordner und Unterlagen haben stabile Kennungen. Umbenennen, Verschieben und Sprachwechsel ändern keine Kennung.
// - Standardordner tragen ihre Funktion in «typ» und speichern keinen Namen (name = null): angezeigt wird die
//   Bezeichnung der gewählten Sprache. Erst ein eigener Name wird gespeichert; die Funktion bleibt erhalten.
// - Der Ordner «Eingang / Zuordnen» ist der verlässliche Auffangbereich: er lässt sich weder entfernen noch umbenennen.
// - Papierkorb: Unterlagen werden nur markiert (dokument.papierkorb), bis sie endgültig gelöscht werden.

const STD_ORDNER = [
  { typ: 'eingang', titel: _('Eingang / Zuordnen') },
  { typ: 'plaene', titel: _('Pläne') },
  { typ: 'doku', titel: _('Dokumentation') },
  { typ: 'berichte', titel: _('Prüfberichte') },
  { typ: 'fotos', titel: _('Fotos') },
  { typ: 'korr', titel: _('Korrespondenz') }
];
const ORDNER_TYPEN = STD_ORDNER.map(o => o.typ);
const ORDNER_TIEFE = 5, NAME_MAX = 80;
const neueId = p => p + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
// Vergleichsform für Suche und Namensprüfung: ohne Gross-/Kleinschreibung und Akzente, ä/ö/ü wie ae/oe/ue.
const suchNorm = s => String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ß/g, 'ss').toLowerCase().replace(/ae/g, 'a').replace(/oe/g, 'o').replace(/ue/g, 'u');

// ---------- Projekte ----------
function ordnerNeu(typ, name, eltern, pos) { return { id: neueId('o'), typ: typ || null, name: name ?? null, eltern: eltern || null, pos }; }
function stdOrdner() { return STD_ORDNER.map((s, i) => ordnerNeu(s.typ, null, null, i)); }
// name = null: Standardbezeichnung der gewählten Sprache (std = 'mein' | 'bisher'); ein eigener Name wird nie übersetzt.
function projektNeu(name, std) { return { id: neueId('p'), name: name ?? null, std: name == null ? (std || 'mein') : null, erstellt: new Date().toISOString(), ordner: stdOrdner(), dokumente: [] }; }
const projektTitel = p => (p.name != null && p.name !== '' ? p.name : p.std === 'bisher' ? T('Bisheriges Projekt') : T('Mein Projekt'));
function projektAktiv() { return S.projekte.find(p => p.id === S.aktivesProjekt) || S.projekte[0]; }
const projektVon = f => S.projekte.find(p => p.id === f.projektId) || S.projekte[0];
const flaechenVon = p => S.flaechen.filter(f => f.projektId === p.id);
// Alle Unterlagen eines Projekts mit ihrem Zusammenhang: { d, flaeche } (flaeche = null bei Projektunterlagen).
function projektDoks(p) {
  return [...p.dokumente.map(d => ({ d, flaeche: null })), ...flaechenVon(p).flatMap(f => (f.dokumente || []).map(d => ({ d, flaeche: f })))];
}
const projektNameFrei = (name, ausser) => {
  const n = suchNorm(name.trim());
  return !S.projekte.some(p => p.id !== ausser && suchNorm(projektTitel(p).trim()) === n);
};

// ---------- Ordner ----------
const ordnerTitel = o => (o.name != null && o.name !== '' ? o.name : String(STD_ORDNER.find(s => s.typ === o.typ)?.titel ?? ''));
const ordnerSuchen = (p, id) => p.ordner.find(o => o.id === id) || null;
const ordnerTypSuchen = (p, typ) => p.ordner.find(o => o.typ === typ) || null;
const eingangOrdner = p => ordnerTypSuchen(p, 'eingang');
const ordnerGeschwister = (p, eltern) => p.ordner.filter(o => (o.eltern || null) === (eltern || null)).sort((a, b) => a.pos - b.pos || (a.id < b.id ? -1 : 1));
function ordnerNachfahren(p, id) {
  const aus = new Set(); const stapel = [id];
  while (stapel.length) { const x = stapel.pop(); for (const o of p.ordner) if (o.eltern === x && !aus.has(o.id)) { aus.add(o.id); stapel.push(o.id); } }
  return aus;
}
function ordnerTiefe(p, id) { let n = 0, o = ordnerSuchen(p, id); while (o && o.eltern && n < 50) { n++; o = ordnerSuchen(p, o.eltern); } return n; }
// Pfad als Namensliste vom obersten Ordner abwärts.
function ordnerPfad(p, id) {
  const liste = []; let o = ordnerSuchen(p, id), n = 0;
  while (o && n++ < 50) { liste.unshift(ordnerTitel(o)); o = o.eltern ? ordnerSuchen(p, o.eltern) : null; }
  return liste;
}
// Geordnete Liste für Anzeige und Auswahlfelder: { o, tiefe }.
function ordnerBaum(p) {
  const aus = [];
  const gehe = (eltern, tiefe) => ordnerGeschwister(p, eltern).forEach(o => { aus.push({ o, tiefe }); gehe(o.id, tiefe + 1); });
  gehe(null, 0);
  return aus;
}
function ordnerNameFehler(p, name, eltern, ausser) {
  const n = String(name ?? '').trim();
  if (!n) return T('Bitte einen Namen eingeben.');
  if (n.length > NAME_MAX) return T('Der Name ist zu lang (höchstens {0} Zeichen).', NAME_MAX);
  if (/[\u0000-\u001f<>]/.test(n)) return T('Der Name enthält unzulässige Zeichen.');
  const nn = suchNorm(n);
  if (ordnerGeschwister(p, eltern).some(o => o.id !== ausser && suchNorm(ordnerTitel(o)) === nn)) return T('Auf dieser Ebene gibt es bereits einen Ordner mit diesem Namen.');
  return null;
}
function ordnerAnlegen(p, name, eltern) {
  eltern = eltern || null;
  if (eltern && !ordnerSuchen(p, eltern)) return { fehler: T('Der übergeordnete Ordner existiert nicht mehr.') };
  if (eltern && ordnerTiefe(p, eltern) + 1 >= ORDNER_TIEFE) return { fehler: T('Die Ordner sind höchstens {0} Ebenen tief verschachtelbar.', ORDNER_TIEFE) };
  const fehler = ordnerNameFehler(p, name, eltern); if (fehler) return { fehler };
  const pos = ordnerGeschwister(p, eltern).length;
  const o = ordnerNeu(null, name.trim(), eltern, pos);
  p.ordner.push(o);
  return { ordner: o };
}
function ordnerUmbenennen(p, id, name) {
  const o = ordnerSuchen(p, id); if (!o) return { fehler: T('Der Ordner existiert nicht mehr.') };
  if (o.typ === 'eingang') return { fehler: T('Der Eingang ist ein fester Bereich und lässt sich nicht umbenennen.') };
  if (o.typ && !String(name).trim()) { o.name = null; return { ordner: o }; }   // Standardbezeichnung wiederherstellen
  const fehler = ordnerNameFehler(p, name, o.eltern, id); if (fehler) return { fehler };
  o.name = name.trim();
  return { ordner: o };
}
function ordnerNeuNummerieren(p, eltern) { ordnerGeschwister(p, eltern).forEach((o, i) => { o.pos = i; }); }
function ordnerVerschieben(p, id, neuerEltern) {
  const o = ordnerSuchen(p, id); if (!o) return { fehler: T('Der Ordner existiert nicht mehr.') };
  neuerEltern = neuerEltern || null;
  if (o.typ === 'eingang') return { fehler: T('Der Eingang bleibt an seinem Platz.') };
  if (neuerEltern && (neuerEltern === id || ordnerNachfahren(p, id).has(neuerEltern))) return { fehler: T('Ein Ordner lässt sich nicht in sich selbst verschieben.') };
  if (neuerEltern && !ordnerSuchen(p, neuerEltern)) return { fehler: T('Der Zielordner existiert nicht mehr.') };
  const hoehe = Math.max(0, ...[...ordnerNachfahren(p, id)].map(k => ordnerTiefe(p, k) - ordnerTiefe(p, id)));
  if ((neuerEltern ? ordnerTiefe(p, neuerEltern) + 1 : 0) + hoehe >= ORDNER_TIEFE) return { fehler: T('Die Ordner sind höchstens {0} Ebenen tief verschachtelbar.', ORDNER_TIEFE) };
  const fehler = ordnerNameFehler(p, ordnerTitel(o), neuerEltern, id); if (fehler) return { fehler: T('Am Ziel gibt es bereits einen Ordner mit diesem Namen.') };
  const alt = o.eltern || null;
  o.eltern = neuerEltern; o.pos = 1e6;
  ordnerNeuNummerieren(p, alt); ordnerNeuNummerieren(p, neuerEltern);
  return { ordner: o };
}
// richtung: -1 = nach oben, +1 = nach unten (unter Geschwistern).
function ordnerReihenfolge(p, id, richtung) {
  const o = ordnerSuchen(p, id); if (!o) return { fehler: T('Der Ordner existiert nicht mehr.') };
  const liste = ordnerGeschwister(p, o.eltern), i = liste.findIndex(x => x.id === id), j = i + richtung;
  if (j < 0 || j >= liste.length) return { ordner: o, unveraendert: true };
  [liste[i], liste[j]] = [liste[j], liste[i]];
  liste.forEach((x, k) => { x.pos = k; });
  return { ordner: o };
}
// Anzahl Unterlagen im Ordner (ohne Papierkorb, ohne frühere Versionen); rekursiv = mit Unterordnern.
function ordnerAnzahl(p, id, rekursiv) {
  const ids = new Set([id]); if (rekursiv) ordnerNachfahren(p, id).forEach(k => ids.add(k));
  return projektDoks(p).filter(({ d }) => ids.has(d.ordner) && !d.papierkorb && !d.frueher).length;
}

// ---------- Prüfung und Übernahme des Projektmodells (Datenformat 3) ----------
// Wird nach der Prüfung der einzelnen Flächen aufgerufen. Ältere Stände (Format 1 und 2) erhalten genau ein Projekt
// mit allen bisherigen Flächen; bisherige Unterlagen ohne Fläche liegen danach im Eingang. Nichts wird gelöscht.
function dokV3(d, p, herkunft) {
  d.ordner = typeof d.ordner === 'string' ? d.ordner : null;
  if (d.notiz === undefined || d.notiz === null) d.notiz = '';
  if (d.tags === undefined || d.tags === null) d.tags = '';
  if (!istObj(d.ablage)) d.ablage = { art: herkunft || 'nutzer' };
}
function modellPruefen(d, fehler) {
  const fe = t => fehler.push(t);
  let migriert = false;
  if (d.projekte === undefined) {
    // Übernahme aus Format 1 oder 2
    const p = projektNeu(null, 'bisher');
    const eing = eingangOrdner(p);
    d.projekte = [p]; d.aktivesProjekt = p.id; migriert = true;
    for (const f of d.flaechen) {
      if (!f) continue;
      f.projektId = p.id;
      for (const x of f.dokumente || []) {
        dokV3(x, p, 'migration');
        const k = typeof dokKlassifizieren === 'function' ? dokKlassifizieren({ name: x.name, typ: x.typ }) : null;
        const ziel = k?.sicher ? ordnerTypSuchen(p, k.typ) : null;
        x.ordner = (ziel || eing).id;
        x.ablage = { art: 'migration', typ: k?.sicher ? k.typ : null };
      }
    }
    for (const x of d.eingang || []) { dokV3(x, p, 'migration'); x.ordner = eing.id; x.ablage = { art: 'migration', typ: null }; p.dokumente.push(x); }
    delete d.eingang;
  } else if (d.eingang !== undefined) { fe(T('Der Stand enthält sowohl Projekte als auch eine alte Ablage ohne Projekt.')); }
  if (!Array.isArray(d.projekte) || !d.projekte.length) { fe(T('Es fehlt mindestens ein Projekt.')); return migriert; }
  const pIds = new Set(), oIds = new Set();
  d.projekte.forEach((p, i) => {
    const wo = T('Projekt {0}', i + 1);
    if (!istObj(p)) return fe(`${wo}: ${T('ist kein Datensatz')}`);
    if (!istText(p.id) || !ID_MUSTER.test(p.id)) return fe(`${wo}: ${T('ungültige oder fehlende Kennung (nur Buchstaben, Ziffern, - und _ erlaubt)')}`);
    if (pIds.has(p.id)) return fe(`${wo}: ${T('Kennung kommt doppelt vor.')}`);
    pIds.add(p.id);
    if (p.name === undefined) p.name = null;
    if (p.name === null ? !['mein', 'bisher'].includes(p.std) : (!istText(p.name) || !p.name.trim() || p.name.length > 200)) fe(`${wo}: ${T('fehlender oder ungültiger Name')}`);
    if (p.erstellt !== undefined && !istText(p.erstellt)) fe(`${wo}: ${T('Feld «{0}» ist kein Text', 'erstellt')}`);
    p.erstellt ??= new Date().toISOString();
    if (!Array.isArray(p.ordner)) return fe(`${wo}: ${T('Die Ordnerliste ist ungültig.')}`);
    const lokal = new Set();
    for (const o of p.ordner) {
      if (!istObj(o) || !istText(o.id) || !ID_MUSTER.test(o.id) || oIds.has(o.id)) { fe(`${wo}: ${T('Ein Ordner hat eine ungültige oder doppelte Kennung.')}`); continue; }
      oIds.add(o.id); lokal.add(o.id);
      if (o.typ !== null && o.typ !== undefined && !ORDNER_TYPEN.includes(o.typ)) fe(`${wo}: ${T('Ein Ordner hat einen unbekannten Typ.')}`);
      o.typ ??= null;
      if (o.name !== null && o.name !== undefined && (!istText(o.name) || o.name.length > 200)) fe(`${wo}: ${T('Ein Ordner hat einen ungültigen Namen.')}`);
      o.name ??= null;
      if (!o.typ && !o.name) fe(`${wo}: ${T('Ein Ordner hat keinen Namen.')}`);
      if (o.eltern !== null && o.eltern !== undefined && !istText(o.eltern)) fe(`${wo}: ${T('Ein Ordner hat einen ungültigen übergeordneten Ordner.')}`);
      o.eltern ??= null;
      if (typeof o.pos !== 'number' || !Number.isFinite(o.pos)) o.pos = 0;
    }
    for (const o of p.ordner) if (istObj(o) && o.eltern && !lokal.has(o.eltern)) fe(`${wo}: ${T('Ein Ordner verweist auf einen fehlenden übergeordneten Ordner.')}`);
    for (const o of p.ordner) {   // keine Schleifen
      let x = o, n = 0; while (x && x.eltern && n++ < 100) x = p.ordner.find(y => y.id === x.eltern);
      if (n >= 100) { fe(`${wo}: ${T('Die Ordnerstruktur enthält eine Schleife.')}`); break; }
    }
    // Der Eingang gehört dazu: fehlt er (z. B. von Hand bearbeitet), wird er ergänzt, nie ein Fehler.
    if (!p.ordner.some(o => o.typ === 'eingang')) p.ordner.unshift(ordnerNeu('eingang', null, null, -1));
    p.dokumente = Array.isArray(p.dokumente) ? p.dokumente : (p.dokumente === undefined ? [] : (fe(`${wo}: ${T('Unterlagenliste ist ungültig')}`), []));
    p.dokumente.forEach((x, k) => dokumentNormalisieren(x, fehler, `${wo}, ${T('Projektunterlage {0}', k + 1)}`));
  });
  if (fehler.length) return migriert;
  // Flächen und Unterlagen den Projekten und Ordnern zuordnen (fehlende Zuordnungen werden dem Eingang zugewiesen, nie verworfen)
  const erstes = d.projekte[0];
  const pInfo = id => d.projekte.find(p => p.id === id);
  for (const f of d.flaechen) {
    if (!f) continue;
    if (!istText(f.projektId) || !pInfo(f.projektId)) f.projektId = erstes.id;
    const p = pInfo(f.projektId);
    for (const x of f.dokumente || []) zuordnenOrdner(x, p);
  }
  for (const p of d.projekte) for (const x of p.dokumente) zuordnenOrdner(x, p);
  if (!istText(d.aktivesProjekt) || !pInfo(d.aktivesProjekt)) d.aktivesProjekt = erstes.id;
  return migriert;
}
function zuordnenOrdner(x, p) {
  dokV3(x, p);
  if (!istText(x.notiz)) x.notiz = '';
  if (!istText(x.tags)) x.tags = '';
  if (!p.ordner.some(o => o.id === x.ordner)) x.ordner = eingangOrdner(p).id;
  if (x.papierkorb !== undefined && !(istObj(x.papierkorb) && istText(x.papierkorb.zeit))) delete x.papierkorb;
}
