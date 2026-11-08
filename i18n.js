'use strict';
// Mehrsprachigkeit (ab lf-v23): Deutsch (Quelle), Französisch, Italienisch.
//
// Aufbau
// - Der deutsche Text steht im Code und ist zugleich der Schlüssel: T('Fläche anlegen').
//   Ausdrücke werden als {0}, {1} … eingesetzt: T('{0} von {1} Schritten erledigt', n, 4).
// - Die Wörterbücher lang-en.js, lang-fr.js und lang-it.js ordnen dem deutschen Text die Übersetzung zu (LANG.en / LANG.fr / LANG.it).
//   Fehlt ein Eintrag, erscheint der deutsche Text (nie ein leerer Platz, nie ein Schlüsselname).
// - _('…') ist dasselbe für Konstanten, die beim Laden entstehen: Der Text wird erst beim Anzeigen übersetzt,
//   damit ein Sprachwechsel sofort wirkt, ohne die Seite neu zu laden (wichtig bei aktivem Schutz).
// - Die fachlichen Leitfadentexte (daten.js) haben eigene Übersetzungen (daten-en.js, daten-fr.js, daten-it.js; LFT.en / LFT.fr / LFT.it);
//   der deutsche Originaltext bleibt als fachliche Referenz erhalten.
// - Eigene Namen (Projekte, Flächen, Ordner, Dateien) und Dokumentinhalte werden nie übersetzt.

const SPRACHEN = [['de', 'Deutsch'], ['en', 'English'], ['fr', 'Français'], ['it', 'Italiano']];
const LOCALE = { de: 'de-CH', en: 'en-GB', fr: 'fr-CH', it: 'it-CH' };
const LANG = { en: {}, fr: {}, it: {} };   // von lang-en.js, lang-fr.js und lang-it.js gefüllt
let sprache = 'de';
const spracheGueltig = c => SPRACHEN.some(s => s[0] === c);
function spracheSetzen(c) {
  sprache = spracheGueltig(c) ? c : 'de';
  document.documentElement.lang = LOCALE[sprache] || 'de-CH';
  fachSprache(sprache);
  return sprache;
}

// ---------- Fachtexte (Leitfaden, daten.js) ----------
// daten.js hält den deutschen Originaltext in LF (Rev. 6) und bleibt unverändert. LF_DE ist eine Kopie davon (fachliche Referenz).
// Für Französisch und Italienisch liegen vollständige Übersetzungen mit gleicher Struktur in daten-fr.js und daten-it.js (LFT).
// fachSprache() legt die gewählte Fassung in LF ab (am Ort, weil LF eine Konstante ist); Kennungen, Nummern und Links bleiben stets die des Originals.
const LFT = { en: null, fr: null, it: null };
const LF_DE = structuredClone(LF);
const FACH_FEST = new Set(['key', 'nr', 'link']);
const fachCache = {};
function fachMischen(orig, uebers) {
  if (typeof orig === 'string') return typeof uebers === 'string' ? uebers : orig;
  if (Array.isArray(orig)) return orig.map((o, i) => fachMischen(o, Array.isArray(uebers) ? uebers[i] : undefined));
  if (orig && typeof orig === 'object') {
    const r = {};
    for (const k of Object.keys(orig)) r[k] = FACH_FEST.has(k) ? orig[k] : fachMischen(orig[k], uebers && typeof uebers === 'object' ? uebers[k] : undefined);
    return r;
  }
  return orig;
}
function fachSprache(c) {
  const quelle = c === 'de' || !LFT[c] ? LF_DE : (fachCache[c] ??= fachMischen(LF_DE, LFT[c]));
  if (LF.__sprache === c) return;
  for (const k of Object.keys(LF)) delete LF[k];
  Object.assign(LF, quelle);
  Object.defineProperty(LF, '__sprache', { value: c, enumerable: false, configurable: true, writable: true });
}
const lokale = () => LOCALE[sprache] || 'de-CH';
function T(key, ...args) {
  let s = (sprache !== 'de' && LANG[sprache] && LANG[sprache][key]) || key;
  if (args.length) s = s.replace(/\{(\d+)\}/g, (m, i) => (+i < args.length ? String(args[+i] ?? '') : m));
  return s;
}
// TK('…') kennzeichnet einen Textschlüssel, der erst später mit T() angezeigt wird (z. B. Hinweise, die zusammen mit
// Unterlagen gespeichert werden). Die Funktion gibt den Text unverändert zurück; die Wörterbuch-Erstellung findet ihn an der Kennzeichnung.
const TK = s => s;
// Verzögert übersetzter Text für Konstanten (verhält sich in Vorlagen, Zeichenkettenmethoden und + wie ein String).
class LT extends String {
  toString() { return T(String.prototype.toString.call(this)); }
  valueOf() { return this.toString(); }
}
const _ = s => new LT(s);
