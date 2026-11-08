'use strict';
// Schutz der Daten auf dem Gerät (ab lf-v22): App-Sperre mit Verschlüsselung.
//
// Aufbau
// - Ein zufälliger Datenschlüssel (256 Bit) verschlüsselt den Arbeitsstand und jede Originalunterlage (AES-256-GCM).
// - Der Datenschlüssel liegt nur «umhüllt» im Speicher: einmal mit einem Schlüssel aus dem Passwort (PBKDF2-SHA-256,
//   600 000 Runden), einmal mit einem Schlüssel aus dem Wiederherstellungscode (160 Bit Zufall, HKDF).
// - Im Browser liegt unter KEY entweder der Klartext-Stand (kein Schutz) oder ein Block {enc, schutz, iv, ct}.
//   Schutzdaten und verschlüsselter Stand stehen im selben Eintrag und werden in einem Schritt geschrieben;
//   dadurch gibt es nie einen Zustand mit verschlüsselten Daten ohne Schlüsselhülle.
// - Passwort, Code und Datenschlüssel werden nie gespeichert. Beim Sperren verschwindet der Schlüssel aus dem Speicher.
// - Originalunterlagen (IndexedDB) werden einzeln verschlüsselt und an ihre Kennung gebunden (AAD).
// - Es gibt keine Konten und keinen Server: Wer Passwort und Code verliert, kann die Daten nicht mehr lesen.

const PBKDF2_RUNDEN = 600000, MIN_PW = 12, SPERRE_WAHL = [5, 15, 30, 60, 0];
const te = new TextEncoder(), td = new TextDecoder();
const b64 = u8 => { let s = ''; for (let i = 0; i < u8.length; i += 0x8000) s += String.fromCharCode.apply(null, u8.subarray(i, i + 0x8000)); return btoa(s); };
const unb64 = s => Uint8Array.from(atob(s), c => c.charCodeAt(0));
const zufall = n => crypto.getRandomValues(new Uint8Array(n));

let schutz = null;                 // { key, rec } solange entsperrt und geschützt
let gesperrt = false, huelle = null; // verschlüsselter Stand und Schutzdaten, solange gesperrt
let letzteAktivitaet = Date.now(), sperrTimer = null, ausstehend = 0, schreibKette = Promise.resolve();
let entwurf = null, dlgHandler = null, fehlversuche = 0, sperreBis = 0, importHuelle = null;

// ---------- Kryptografie ----------
async function kekAusPasswort(pw, salt, runden) {
  const basis = await crypto.subtle.importKey('raw', te.encode(String(pw).normalize('NFKC')), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations: runden }, basis, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
}
async function kekAusCode(code, salt) {
  const basis = await crypto.subtle.importKey('raw', te.encode(code), 'HKDF', false, ['deriveKey']);
  return crypto.subtle.deriveKey({ name: 'HKDF', hash: 'SHA-256', salt, info: te.encode('lf-recovery-v1') }, basis, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
}
async function umhuellen(kek, raw) {
  const iv = zufall(12);
  const ct = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv, additionalData: te.encode('lf-dek-v1') }, kek, raw));
  return { iv: b64(iv), ct: b64(ct) };
}
async function enthuellen(kek, w) {
  return new Uint8Array(await crypto.subtle.decrypt({ name: 'AES-GCM', iv: unb64(w.iv), additionalData: te.encode('lf-dek-v1') }, kek, unb64(w.ct)));
}
const dekImportieren = raw => crypto.subtle.importKey('raw', raw, 'AES-GCM', false, ['encrypt', 'decrypt']);
async function verschluesseln(key, text, aad = 'lf-state-v1') {
  const iv = zufall(12);
  const ct = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv, additionalData: te.encode(aad) }, key, te.encode(text)));
  return { iv: b64(iv), ct: b64(ct) };
}
async function entschluesseln(key, h, aad = 'lf-state-v1') {
  return td.decode(await crypto.subtle.decrypt({ name: 'AES-GCM', iv: unb64(h.iv), additionalData: te.encode(aad) }, key, unb64(h.ct)));
}
const huelleBauen = async (key, rec, text) => ({ enc: 1, v: 1, schutz: rec, ...(await verschluesseln(key, text)) });
async function blobVerschluesseln(key, id, file) {
  const iv = zufall(12);
  const data = await crypto.subtle.encrypt({ name: 'AES-GCM', iv, additionalData: te.encode('lf-blob-v1:' + id) }, key, await file.arrayBuffer());
  return { enc: 1, v: 1, iv, data, typ: file.type || '' };
}
async function blobEntschluesseln(key, id, rec) {
  const buf = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: rec.iv, additionalData: te.encode('lf-blob-v1:' + id) }, key, rec.data);
  return new Blob([buf], { type: rec.typ || '' });
}
// Wiederherstellungscode: 160 Bit Zufall, Base32 (ohne I, L, O, U), in Vierergruppen.
const B32 = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
function codeErzeugen() {
  let bits = 0, v = 0, out = '';
  for (const b of zufall(20)) { v = ((v << 8) | b) & 0xFFF; bits += 8; while (bits >= 5) { out += B32[(v >>> (bits - 5)) & 31]; bits -= 5; } }
  return out;
}
const codeAnzeige = c => c.match(/.{4}/g).join('-');
const codeNormalisieren = s => String(s).toUpperCase().replace(/[\s-]/g, '').replace(/O/g, '0').replace(/[IL]/g, '1');
const codeGueltig = c => c.length === 32 && [...c].every(z => B32.includes(z));
function pwFehler(pw, pw2) {
  if (pw.length < MIN_PW) return `${T('Das Passwort braucht mindestens {0} Zeichen (aktuell {1}).', MIN_PW, pw.length)}`;
  if (/^(.)\1+$/.test(pw)) return T('Das Passwort darf nicht nur aus demselben Zeichen bestehen.');
  if (pw2 !== undefined && pw !== pw2) return T('Die beiden Passwörter stimmen nicht überein.');
  return null;
}
// Prüft die Schutzdaten eines gespeicherten Blocks, bevor sie verwendet werden.
function recPruefen(r) {
  const w = x => istObj(x) && istText(x.iv) && istText(x.ct);
  if (!istObj(r) || r.v !== 1 || r.kdf !== 'PBKDF2-SHA256' || !Number.isInteger(r.runden) || r.runden < 100000 || r.runden > 5000000) return null;
  if (!istText(r.salt) || !w(r.wrapPw) || !w(r.wrapCode) || !istText(r.wrapCode.salt)) return null;
  if (!SPERRE_WAHL.includes(r.sperreMin) || !['offen', 'fertig'].includes(r.migration)) return null;
  return r;
}
function speicherFehlerText(e) {
  return e?.name === 'QuotaExceededError' || /quota/i.test(e?.message || '') ? T('Der Gerätespeicher ist voll.') : T('Speichern nicht möglich ({0}).', e?.message || e);
}

// ---------- Schreiben des geschützten Stands ----------
// Läuft nacheinander im Hintergrund; ein Fehler bleibt sichtbar (speicherFehler), bis wieder gespeichert wurde.
function schreibenVerschluesselt() {
  const { key, rec } = schutz, text = JSON.stringify(S);
  const anzeige = JSON.stringify({ thema: S.einstellungen.thema, sprache: S.einstellungen.sprache });
  ausstehend++;
  schreibKette = schreibKette.then(async () => {
    localStorage.setItem(KEY, JSON.stringify(await huelleBauen(key, rec, text)));
    try { localStorage.setItem('lf-anzeige', anzeige); } catch (e) { /* nur Komfort */ }
    speicherFehler = null;
  }).catch(e => { speicherFehler = speicherFehlerText(e); }).finally(() => { ausstehend--; speicherAnzeige(); });
}
const speichernWarten = () => schreibKette.then(() => !speicherFehler);
function anzeigeLaden() {
  try {
    const a = JSON.parse(localStorage.getItem('lf-anzeige'));
    if (['hell', 'dunkel', 'system'].includes(a?.thema)) S.einstellungen.thema = a.thema;
    if (spracheGueltig(a?.sprache)) S.einstellungen.sprache = a.sprache;
  } catch (e) { /* Standard */ }
}

// ---------- Originalunterlagen verschlüsseln oder wieder öffnen ----------
async function blobsUmstellen(nachVerschluesselt, key, fortschritt) {
  const ids = await idb('readonly', s => s.getAllKeys());
  let i = 0;
  for (const id of ids) {
    const r = await idb('readonly', s => s.get(id));
    i++;
    if (nachVerschluesselt && r instanceof Blob) { const rec = await blobVerschluesseln(key, id, r); await idb('readwrite', s => s.put(rec, id)); }
    else if (!nachVerschluesselt && r && !(r instanceof Blob) && r.enc) { const b = await blobEntschluesseln(key, id, r); await idb('readwrite', s => s.put(b, id)); }
    fortschritt?.(i, ids.length);
  }
  // Suchtexte werden mit den Dateien umgestellt
  const tids = await idb('readonly', s => s.getAllKeys(), 'texte');
  for (const id of tids) {
    const r = await idb('readonly', s => s.get(id), 'texte');
    if (nachVerschluesselt && r && !r.enc) { const rec = await blobVerschluesseln(key, 'txt:' + id, new Blob([JSON.stringify(r)], { type: 'application/json' })); await idb('readwrite', s => s.put(rec, id), 'texte'); }
    else if (!nachVerschluesselt && r && r.enc) { const b = await blobEntschluesseln(key, 'txt:' + id, r), klar = JSON.parse(await b.text()); await idb('readwrite', s => s.put(klar, id), 'texte'); }
  }
  suchCache.clear();
}

// ---------- Sperren und Entsperren ----------
async function sperren(grund) {
  if (!schutz?.key || gesperrt) return;
  try { await dzArbeit.catch(() => {}); } catch (e) { /* kein Import aktiv */ }
  await speichernWarten();
  // Der Stand wird aus dem Arbeitsspeicher neu verschlüsselt: Auch nicht gespeicherte Änderungen bleiben bis zum Entsperren erhalten.
  const { key, rec } = schutz, einst = S.einstellungen, defekt = startProblem?.art === 'defekt';
  // War der entschlüsselte Stand beschädigt, bleibt der gespeicherte Block unberührt (sonst würde ein leerer Stand ihn ersetzen).
  let gespeichert = null; if (defekt) { try { gespeichert = JSON.parse(localStorage.getItem(KEY)); } catch (e) { /* unten */ } }
  huelle = gespeichert?.enc === 1 ? gespeichert : JSON.parse(JSON.stringify(await huelleBauen(key, rec, JSON.stringify(S))));
  if (defekt) startProblem = null;
  schutz = null; entwurf = null; dlgHandler = null; importKandidat = null; importHuelle = null; fehlversuche = 0;
  S = leererStand(); S.einstellungen.thema = einst.thema; S.einstellungen.sprache = einst.sprache;
  for (const u of vorschauUrls.values()) URL.revokeObjectURL(u);
  vorschauUrls.clear();
  vorschauFreigeben(); suchCache.clear(); importListe = []; ocrBeenden(true); seitenleisteLeeren();   // keine Suchtreffer, Vorschauen oder Dateinamen im gesperrten Zustand
  const d = document.getElementById('dlg'); if (d.open) d.close();
  document.getElementById('dlgC').innerHTML = '';
  document.getElementById('fehlerbanner')?.remove(); document.getElementById('speicherwarnung')?.remove();
  sperrUhrStoppen(); gesperrt = true; view = { tab: 'flaechen', id: null, schritt: 1 }; letzteAnsicht = null;
  render(); ansagen(grund || T('App gesperrt.'));
}
// Entfernt den Datenschlüssel nie aus dem Speicher ausser beim Sperren; hier wird er aus der Hülle freigegeben.
async function freigeben(raw, rec) {
  const key = await dekImportieren(raw);
  let text;
  try { text = await entschluesseln(key, huelle); } catch (e) { return 'defekt'; }
  let d = null; try { d = JSON.parse(text); } catch (e) { /* unten */ }
  const r = d ? standPruefen(d) : { fehler: [T('Der entschlüsselte Stand ist kein lesbares JSON.')] };
  schutz = { key, rec }; gesperrt = false; huelle = null; fehlversuche = 0;
  if (r.stand) { S = r.stand; flaechenMigrieren(S.flaechen); }
  else { startProblem = { art: 'defekt', roh: text, fehler: r.fehler, entschluesselt: true }; S = leererStand(); }
  letzteAktivitaet = Date.now(); sperrUhrStarten();
  view = { tab: 'flaechen', id: null, schritt: 1 }; letzteAnsicht = null;
  render(); ansagen(T('Entsperrt.'));
  const h2 = app.querySelector('h2'); if (h2) { h2.tabIndex = -1; h2.focus({ preventScroll: true }); }   // Fokus nicht ins Leere fallen lassen
  if (r.stand) {
    if (rec.migration === 'offen') blobsUmstellen(true, key).then(() => { rec.migration = 'fertig'; save(); }).catch(e => fehlerZeigen(T('Unterlagen konnten nicht vollständig verschlüsselt werden: {0}', e.message)));
    save(); nachStart();
  }
  return 'ok';
}
async function entsperrenSenden(e) {
  e.preventDefault();
  const feld = document.getElementById('pw'), meld = document.getElementById('pw-fehler'), knopf = document.getElementById('pw-knopf');
  const warten = Math.ceil((sperreBis - Date.now()) / 1000);
  if (warten > 0) { meld.textContent = `${T('Zu viele Versuche. Bitte in {0} Sekunden erneut versuchen.', warten)}`; return false; }
  if (!feld.value) { meld.textContent = T('Bitte das Passwort eingeben.'); feld.focus(); return false; }
  knopf.disabled = true; meld.textContent = T('Passwort wird geprüft …');
  const rec = huelle.schutz;
  let raw = null;
  try { raw = await enthuellen(await kekAusPasswort(feld.value, unb64(rec.salt), rec.runden), rec.wrapPw); } catch (err) { raw = null; }
  if (!raw) {
    fehlversuche++; if (fehlversuche >= 3) sperreBis = Date.now() + Math.min(60000, 2000 * 2 ** (fehlversuche - 3));
    meld.textContent = T('Das Passwort ist falsch.'); knopf.disabled = false; feld.select(); return false;
  }
  const r = await freigeben(raw, rec);
  if (r !== 'ok' && r !== undefined) { meld.textContent = T('Die gespeicherten Daten konnten nicht entschlüsselt werden (beschädigt).'); knopf.disabled = false; }
  return false;
}
async function codeSenden(e) {
  e.preventDefault();
  const meld = document.getElementById('rc-fehler'), knopf = document.getElementById('rc-knopf');
  const code = codeNormalisieren(document.getElementById('rc').value), p1 = document.getElementById('rpw1').value, p2 = document.getElementById('rpw2').value;
  if (!codeGueltig(code)) { meld.textContent = T('Der Wiederherstellungscode hat 32 Zeichen (Ziffern und Buchstaben, in Vierergruppen).'); return false; }
  const pf = pwFehler(p1, p2); if (pf) { meld.textContent = pf; return false; }
  knopf.disabled = true; meld.textContent = T('Code wird geprüft …');
  const rec = huelle.schutz;
  let raw = null;
  try { raw = await enthuellen(await kekAusCode(code, unb64(rec.wrapCode.salt)), rec.wrapCode); } catch (err) { raw = null; }
  if (!raw) { meld.textContent = T('Der Wiederherstellungscode ist falsch.'); knopf.disabled = false; return false; }
  const salt = zufall(16);
  const neuRec = { ...rec, salt: b64(salt), runden: PBKDF2_RUNDEN, wrapPw: await umhuellen(await kekAusPasswort(p1, salt, PBKDF2_RUNDEN), raw) };
  const r = await freigeben(raw, neuRec);   // übernimmt neuRec erst, wenn die Daten entschlüsselt werden konnten
  await speichernWarten();
  if (r !== 'ok' && r !== undefined) { meld.textContent = T('Die gespeicherten Daten konnten nicht entschlüsselt werden (beschädigt).'); knopf.disabled = false; }
  else ansagen(T('Entsperrt. Das neue Passwort gilt ab jetzt.'));
  return false;
}
async function allesLoeschen() {
  if (!confirm(T('Alle Flächen und Unterlagen auf diesem Gerät unwiderruflich löschen? Das ist nur sinnvoll, wenn Passwort und Wiederherstellungscode verloren sind.'))) return;
  try {
    const d = await db().catch(() => null); d?.close(); dbPromise = null;
    await new Promise(r => { const q = indexedDB.deleteDatabase('lf-unterlagen'); q.onsuccess = q.onerror = q.onblocked = () => r(); });
  } catch (e) { /* weiter */ }
  try { Object.keys(localStorage).filter(k => k === KEY || k.startsWith(KEY + '-') || k === 'lf-anzeige').forEach(k => localStorage.removeItem(k)); } catch (e) { /* weiter */ }
  location.reload();
}
function pwZeigen(cb) { cb.closest('form').querySelectorAll('input[data-pw]').forEach(i => { i.type = cb.checked ? 'text' : 'password'; }); }
function vSperre() {
  return `<div class="card sperre"><h2 id="sperreT" tabindex="-1">${T('App gesperrt')}</h2>
    <p>${T('Die Flächen und Unterlagen auf diesem Gerät sind verschlüsselt. Geben Sie Ihr Passwort ein, um fortzufahren.')}</p>
    <form onsubmit="return entsperrenSenden(event)" novalidate>
      <label for="pw">${T('Passwort')}</label>
      <input id="pw" data-pw type="password" autocomplete="current-password" aria-describedby="pw-fehler">
      <p class="feldfehler" id="pw-fehler" role="alert"></p>
      <label class="inline"><input type="checkbox" onchange="pwZeigen(this)"> ${T('Passwort anzeigen')}</label>
      <div class="row"><button type="submit" id="pw-knopf">${T('Entsperren')}</button></div>
    </form>
    <details style="margin-top:18px"><summary>${T('Passwort vergessen?')}</summary>
      <form onsubmit="return codeSenden(event)" novalidate>
        <p class="muted">${T('Mit dem Wiederherstellungscode aus der Einrichtung setzen Sie ein neues Passwort. Die Daten bleiben erhalten.')}</p>
        <label for="rc">${T('Wiederherstellungscode')}</label><input id="rc" type="text" autocomplete="off" spellcheck="false" placeholder="${'XXXX-XXXX-XXXX-XXXX-XXXX-XXXX-XXXX-XXXX'}">
        <label for="rpw1">${T('Neues Passwort (mindestens {0} Zeichen)', MIN_PW)}</label><input id="rpw1" data-pw type="password" autocomplete="new-password">
        <label for="rpw2">${T('Neues Passwort wiederholen')}</label><input id="rpw2" data-pw type="password" autocomplete="new-password">
        <p class="feldfehler" id="rc-fehler" role="alert"></p>
        <button type="submit" id="rc-knopf" class="sec">${T('Mit Code entsperren')}</button>
      </form>
      <p class="muted" style="margin-top:16px">${T('Weder Passwort noch Code vorhanden? Dann sind die Daten nicht mehr lesbar. Sie können alles auf diesem Gerät löschen und neu beginnen.')}</p>
      <button type="button" class="danger small" onclick="allesLoeschen()">${T('Alles auf diesem Gerät löschen …')}</button>
    </details></div>`;
}
// Aufgerufen von render(), solange gesperrt.
function sperrbildschirm() {
  document.getElementById('titel').textContent = T('Entsiegelung und Regenwasser');
  document.getElementById('untertitel').textContent = T('Gesperrt');
  document.getElementById('zurueck').hidden = true;
  if (!document.getElementById('pw')) { app.innerHTML = vSperre(); window.scrollTo(0, 0); }
  letzteAnsicht = null;
  if (!app.contains(document.activeElement) || document.activeElement === document.body) document.getElementById('pw')?.focus();
}

// ---------- Automatische Sperre ----------
function sperrUhrStarten() { sperrUhrStoppen(); if (schutz?.rec.sperreMin) sperrTimer = setInterval(sperrPruefen, 10000); }
function sperrUhrStoppen() { if (sperrTimer) clearInterval(sperrTimer); sperrTimer = null; }
function sperrPruefen() {
  const min = schutz?.rec.sperreMin;
  if (min && Date.now() - letzteAktivitaet > min * 60000) sperren(T('Automatisch gesperrt nach {0} Minuten ohne Eingabe.', min));
}
['pointerdown', 'keydown', 'touchstart', 'wheel'].forEach(t => addEventListener(t, () => { letzteAktivitaet = Date.now(); }, { passive: true, capture: true }));
document.addEventListener('visibilitychange', () => { if (!document.hidden) sperrPruefen(); });
function sperreMinSetzen(v) { if (!schutz) return; schutz.rec.sperreMin = +v; save(); letzteAktivitaet = Date.now(); sperrUhrStarten(); ansagen(T('Automatische Sperre geändert.')); }

// ---------- Dialoge ----------
// Ein Formular im Dialog. handler(werte, fehler) läuft beim Absenden; fehler(text) zeigt eine Meldung.
function formDialog({ titel, intro = '', felder = [], knopf = T('Weiter'), handler, extra = '' }) {
  dlgHandler = handler;
  const pw = felder.some(x => !['select', 'text', 'area'].includes(x.art));
  const f = felder.map(x => x.art === 'select'
    ? `<label for="df-${x.id}">${x.label}</label><select id="df-${x.id}" data-feld="${x.id}">${x.optionen.map(([w, l, s]) => `<option value="${w}"${s ? ' selected' : ''}>${l}</option>`).join('')}</select>`
    : x.art === 'area'
      ? `<label for="df-${x.id}">${x.label}</label><textarea id="df-${x.id}" data-feld="${x.id}" maxlength="4000">${esc(x.wert ?? '')}</textarea>`
    : x.art === 'text'
      ? `<label for="df-${x.id}">${x.label}</label><input id="df-${x.id}" data-feld="${x.id}" type="text" autocomplete="off" spellcheck="false" value="${esc(x.wert ?? '')}"${x.max ? ` maxlength="${x.max}"` : ''}>`
      : `<label for="df-${x.id}">${x.label}</label><input id="df-${x.id}" data-feld="${x.id}" data-pw type="password" autocomplete="${x.auto || 'off'}" aria-describedby="df-fehler">`).join('');
  dialogZeigen(titel, `<form onsubmit="return formSenden(event)" novalidate>${intro}${f}${pw ? T('<label class="inline"><input type="checkbox" onchange="pwZeigen(this)"> Passwort anzeigen</label>') : ''}
    <p class="feldfehler" id="df-fehler" role="alert"></p>${extra}
    <div class="row"><button type="submit" id="df-knopf">${knopf}</button><button type="button" class="sec" onclick="dlg.close()">${T('Abbrechen')}</button></div></form>`);
  document.getElementById('dlgC').querySelector('input, select')?.focus();
}
async function formSenden(e) {
  e.preventDefault();
  const w = {}; e.target.querySelectorAll('[data-feld]').forEach(i => { w[i.dataset.feld] = i.value; });
  const knopf = document.getElementById('df-knopf'); knopf.disabled = true;
  const fehler = t => { const el = document.getElementById('df-fehler'); if (el) el.textContent = t; knopf.disabled = false; };
  try { await dlgHandler(w, fehler); } catch (err) { fehler(T('Fehler: {0}', err?.message || err)); }
  return false;
}
// Das close-Ereignis kommt verzögert: nur leeren, wenn der Dialog inzwischen nicht schon wieder offen ist (Folgedialog).
document.getElementById('dlg').addEventListener('close', () => { if (document.getElementById('dlg').open) return; document.getElementById('dlgC').innerHTML = ''; entwurf = null; dlgHandler = null; });
const meldeStatus = t => { const el = document.getElementById('df-fehler'); if (el) { el.className = 'muted'; el.textContent = t; } };
const sperreOptionen = (aktuell = 15) => ({ id: 'sperreMin', art: 'select', label: T('Automatisch sperren nach'), optionen: SPERRE_WAHL.map(m => [m, m ? T('{0} Minuten ohne Eingabe', m) : T('nie (nicht empfohlen)'), m === aktuell]) });
const pwPaar = (a = 'pw1', b = 'pw2', l = T('Neues Passwort')) => [{ id: a, label: `${T('{0} (mindestens {1} Zeichen)', l, MIN_PW)}`, auto: 'new-password' }, { id: b, label: `${l} wiederholen`, auto: 'new-password' }];
// Prüft das aktuelle Passwort und liefert den Datenschlüssel (roh) oder null.
async function passwortPruefen(pw) {
  const rec = schutz.rec;
  try { return await enthuellen(await kekAusPasswort(pw, unb64(rec.salt), rec.runden), rec.wrapPw); } catch (e) { return null; }
}

// Einrichten: Schritt 1 Passwort, Schritt 2 Wiederherstellungscode, dann erst Verschlüsselung.
function schutzDialog() {
  if (schutz?.key || gesperrt) return;
  formDialog({
    titel: T('Schutz mit Passwort einrichten'),
    intro: `<p>${T('Die App verschlüsselt Flächen, Angaben und Originalunterlagen auf diesem Gerät. Das Passwort wird nirgends gespeichert und kann <b>nicht zurückgesetzt</b> werden. Im nächsten Schritt erhalten Sie einen Wiederherstellungscode als Reserve.')}</p>`,
    felder: [...pwPaar(), sperreOptionen()], knopf: T('Weiter'),
    handler: async (w, fehler) => {
      const pf = pwFehler(w.pw1, w.pw2); if (pf) return fehler(pf);
      meldeStatus(T('Schlüssel wird erzeugt (das dauert einen Moment) …'));
      const raw = zufall(32), salt = zufall(16), code = codeErzeugen(), csalt = zufall(16);
      const rec = { v: 1, kdf: 'PBKDF2-SHA256', runden: PBKDF2_RUNDEN, salt: b64(salt), wrapPw: await umhuellen(await kekAusPasswort(w.pw1, salt, PBKDF2_RUNDEN), raw),
        wrapCode: { salt: b64(csalt), ...(await umhuellen(await kekAusCode(code, csalt), raw)) }, sperreMin: +w.sperreMin, migration: 'offen', erstellt: new Date().toISOString() };
      entwurf = { art: 'einrichten', raw, rec, code };
      codeSchritt(T('Schutz aktivieren'));
    }
  });
}
function codeSchritt(knopf) {
  document.getElementById('dlgT').textContent = T('Wiederherstellungscode sichern');
  document.getElementById('dlgC').innerHTML = `<p>${T('Mit diesem Code kommen Sie an Ihre Daten, falls Sie das Passwort vergessen. <b>Er wird nur jetzt angezeigt.</b> Bewahren Sie ihn getrennt vom Gerät auf, zum Beispiel ausgedruckt oder im Passwortmanager.')}</p>
    <p class="codebox" id="codeAnzeige" tabindex="0" aria-label="${T('Wiederherstellungscode')}">${esc(codeAnzeige(entwurf.code))}</p>
    <div class="row"><button type="button" class="sec small" data-act="codeKopieren">${T('Kopieren')}</button><button type="button" class="sec small" data-act="codeSpeichern">${T('Als Textdatei speichern')}</button></div>
    <label class="inline" style="margin-top:14px"><input type="checkbox" id="codeBestaetigt" onchange="document.getElementById('codeFertig').disabled=!this.checked"> ${T('Ich habe den Code an einem sicheren Ort gespeichert.')}</label>
    <p class="feldfehler" id="df-fehler" role="alert"></p>
    <div class="row"><button type="button" id="codeFertig" data-act="codeFertig" disabled>${knopf}</button><button type="button" class="sec" onclick="dlg.close()">${T('Abbrechen')}</button></div>`;
  document.getElementById('codeAnzeige').focus();
}
async function codeKopieren() { try { await navigator.clipboard.writeText(codeAnzeige(entwurf.code)); ansagen(T('Code kopiert.')); } catch (e) { ansagen(T('Kopieren nicht möglich. Bitte den Code abschreiben.')); } }
function codeSpeichern() {
  const t = `Wiederherstellungscode der Leitfaden-App «Entsiegelung und Regenwasser»\nErstellt am ${new Date().toLocaleDateString(lokale())}\n\n${codeAnzeige(entwurf.code)}\n\nMit diesem Code können Sie ein neues Passwort setzen, falls Sie das Passwort vergessen. Wer den Code kennt, kann die Daten dieses Geräts lesen: nicht weitergeben.\n`;
  const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(new Blob([t], { type: 'text/plain' })), download: 'Wiederherstellungscode_Leitfaden-App.txt' });
  document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000);
}
async function codeFertig() {
  if (!entwurf) return;
  const knopf = document.getElementById('codeFertig'), meld = text => { const el = document.getElementById('df-fehler'); if (el) { el.className = 'muted'; el.textContent = text; } };
  knopf.disabled = true;
  const { art, raw, rec } = entwurf;
  try {
    if (art === 'einrichten') {
      meld(T('Daten werden verschlüsselt …'));
      const key = await dekImportieren(raw), text = JSON.stringify(S);
      const h = await huelleBauen(key, rec, text);
      if (await entschluesseln(key, h) !== text) throw new Error('Gegenprobe der Verschlüsselung fehlgeschlagen.');
      localStorage.setItem(KEY, JSON.stringify(h));          // ein Schritt: verschlüsselter Stand samt Schlüsselhülle
      schutz = { key, rec }; entwurf = null; letzteAktivitaet = Date.now();
      try { localStorage.setItem('lf-anzeige', JSON.stringify({ thema: S.einstellungen.thema, sprache: S.einstellungen.sprache })); } catch (e) { /* Komfort */ }
      sperrUhrStarten(); render();
      try {
        await blobsUmstellen(true, key, (i, n) => meld(`${T('Unterlagen werden verschlüsselt ({0} von {1}) …', i, n)}`));
        rec.migration = 'fertig'; save(); await speichernWarten();
      } catch (e) { fehlerZeigen(T('Nicht alle Unterlagen konnten verschlüsselt werden; die App versucht es beim nächsten Entsperren erneut. {0}', e.message)); }
      document.getElementById('dlg').close(); render(); ansagen(rec.sperreMin ? T('Schutz aktiviert. Die App sperrt sich nach {0} Minuten ohne Eingabe.', rec.sperreMin) : T('Schutz aktiviert. Die App sperrt sich nicht automatisch.'));
    } else if (art === 'codeNeu') {
      schutz.rec.wrapCode = rec.wrapCode; save(); await speichernWarten(); entwurf = null;
      document.getElementById('dlg').close(); ansagen(T('Neuer Wiederherstellungscode gilt. Der alte ist ungültig.'));
    }
  } catch (e) { const el = document.getElementById('df-fehler'); if (el) { el.className = 'feldfehler'; el.textContent = T('Fehlgeschlagen: {0}', e.message) + (art === 'einrichten' && !schutz ? T(' Es wurde nichts verändert.') : ''); } knopf.disabled = false; }
}
function pwDialog() {
  if (!schutz?.key) return;
  formDialog({
    titel: T('Passwort ändern'),
    felder: [{ id: 'alt', label: T('Aktuelles Passwort'), auto: 'current-password' }, ...pwPaar('pw1', 'pw2', T('Neues Passwort'))], knopf: T('Passwort ändern'),
    handler: async (w, fehler) => {
      const pf = pwFehler(w.pw1, w.pw2); if (pf) return fehler(pf);
      meldeStatus(T('Passwort wird geprüft …'));
      const raw = await passwortPruefen(w.alt); if (!raw) return fehler(T('Das aktuelle Passwort ist falsch.'));
      const alt = { salt: schutz.rec.salt, runden: schutz.rec.runden, wrapPw: schutz.rec.wrapPw }, salt = zufall(16);
      Object.assign(schutz.rec, { salt: b64(salt), runden: PBKDF2_RUNDEN, wrapPw: await umhuellen(await kekAusPasswort(w.pw1, salt, PBKDF2_RUNDEN), raw) });
      save();
      if (!(await speichernWarten())) { Object.assign(schutz.rec, alt); return fehler(T('Nicht gespeichert: {0} Das alte Passwort gilt weiter.', speicherFehler)); }
      document.getElementById('dlg').close(); ansagen(T('Passwort geändert.'));
    }
  });
}
function codeDialog() {
  if (!schutz?.key) return;
  formDialog({
    titel: T('Neuen Wiederherstellungscode erzeugen'),
    intro: T('<p>Der bisherige Code wird damit <b>ungültig</b>. Zur Sicherheit wird das Passwort erneut abgefragt.</p>'),
    felder: [{ id: 'alt', label: T('Aktuelles Passwort'), auto: 'current-password' }], knopf: T('Code erzeugen'),
    handler: async (w, fehler) => {
      meldeStatus(T('Passwort wird geprüft …'));
      const raw = await passwortPruefen(w.alt); if (!raw) return fehler(T('Das Passwort ist falsch.'));
      const code = codeErzeugen(), csalt = zufall(16);
      entwurf = { art: 'codeNeu', code, rec: { wrapCode: { salt: b64(csalt), ...(await umhuellen(await kekAusCode(code, csalt), raw)) } } };
      codeSchritt(T('Neuen Code übernehmen'));
    }
  });
}
function ausDialog() {
  if (!schutz?.key) return;
  formDialog({
    titel: T('Schutz ausschalten'),
    intro: T('<div class="warn"><b>Danach liegen alle Flächen und Unterlagen wieder unverschlüsselt im Browserspeicher dieses Geräts.</b></div>'),
    felder: [{ id: 'alt', label: T('Aktuelles Passwort'), auto: 'current-password' }], knopf: T('Schutz ausschalten'),
    handler: async (w, fehler) => {
      meldeStatus(T('Passwort wird geprüft …'));
      const raw = await passwortPruefen(w.alt); if (!raw) return fehler(T('Das Passwort ist falsch.'));
      meldeStatus(T('Unterlagen werden wieder geöffnet …'));
      await speichernWarten();
      await blobsUmstellen(false, schutz.key, (i, n) => meldeStatus(`${T('Unterlagen werden geöffnet ({0} von {1}) …', i, n)}`));
      localStorage.setItem(KEY, JSON.stringify(S));          // ein Schritt: Klartext-Stand ersetzt die Hülle
      try { localStorage.removeItem('lf-anzeige'); } catch (e) { /* weiter */ }
      schutz = null; sperrUhrStoppen(); speicherFehler = null;
      document.getElementById('dlg').close(); render(); ansagen(T('Schutz ausgeschaltet.'));
    }
  });
}

// ---------- Anzeige in den Einstellungen ----------
function vSchutzKarte() {
  if (!schutz?.key) return `<div class="card no-print"><h3>${T('Datenschutz')}</h3><p>${T('<span class="tag offen">nicht verschlüsselt</span>')}</p>
    <p>${T('Flächen und Unterlagen liegen unverschlüsselt im Speicher dieses Browsers. Wer Zugriff auf dieses Gerät und Benutzerkonto hat, kann sie lesen. Die App selbst sendet nichts ins Internet.')}</p>
    <p class="muted">${T('Mit der App-Sperre werden Flächen, Angaben und Originalunterlagen mit einem Schlüssel aus Ihrem Passwort verschlüsselt (AES-256-GCM, PBKDF2 mit 600 000 Runden). Es gibt keine Konten und keinen Server.')}</p>
    <button data-act="schutzDialog">${T('Schutz mit Passwort einrichten')}</button></div>`;
  return `<div class="card no-print"><h3>${T('Datenschutz')}</h3><p>${T('<span class="tag ok">verschlüsselt</span>')}</p>
    <p>${T('Flächen und Unterlagen sind auf diesem Gerät verschlüsselt. Ohne Passwort oder Wiederherstellungscode sind sie nicht lesbar; ein vergessenes Passwort kann niemand zurücksetzen.')}</p>
    <label for="sperreMin">${T('Automatisch sperren nach')}</label>
    <select id="sperreMin" onchange="sperreMinSetzen(this.value)">${SPERRE_WAHL.map(m => `<option value="${m}"${m === schutz.rec.sperreMin ? ' selected' : ''}>${m ? T('{0} Minuten ohne Eingabe', m) : T('nie (nicht empfohlen)')}</option>`).join('')}</select>
    <div class="row" style="margin-top:14px"><button data-act="sperren">${T('Jetzt sperren')}</button><button class="sec" data-act="pwDialog">${T('Passwort ändern')}</button><button class="sec" data-act="codeDialog">${T('Neuer Wiederherstellungscode')}</button><button class="danger" data-act="ausDialog">${T('Schutz ausschalten')}</button></div>
    <details style="margin-top:12px"><summary>${T('Was der Schutz leistet und was nicht')}</summary><ul class="muted">
      <li>${T('Er schützt die Daten im Browserspeicher dieses Geräts, wenn jemand Zugriff auf das Gerät oder Benutzerkonto erhält.')}</li>
      <li>${T('Er schützt nicht vor Schadsoftware auf dem Gerät und nicht vor Personen, die Ihr Passwort kennen.')}</li>
      <li>${T('Heruntergeladene Originalunterlagen, ausgedruckte Berichte und Klartext-Sicherungen sind nicht verschlüsselt.')}</li>
      <li>${T('Die Gerätesperre (Windows-Anmeldung, BitLocker, Handy-PIN) bleibt wichtig.')}</li></ul></details></div>`;
}
const schutzHinweis = () => (schutz?.key || gesperrt) ? '' : `<p class="muted no-print">${T('Unterlagen sind auf diesem Gerät noch <b>nicht verschlüsselt</b>.')} <button class="link" data-act="schutzDialog">${T('Schutz einrichten')}</button></p>`;
