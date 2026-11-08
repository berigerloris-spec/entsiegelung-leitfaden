'use strict';
// Sicherung und Wiederherstellung (ab lf-v23).
//
// Formate
// - Vollsicherung (.zip): sicherung.json (Projekte, Flächen, Ordner, Unterlagen-Angaben, Nachweise, Einstellungen, Liste der Dateien
//   mit Prüfsummen) und dateien/<Kennung> (die Originaldateien). Ohne Kompression, damit sich die Datei mit jedem ZIP-Programm öffnen lässt.
// - Mit Passwort: Jeder Inhalt (auch sicherung.json) wird einzeln mit AES-256-GCM verschlüsselt (Schlüssel aus dem Passwort,
//   PBKDF2-SHA-256). Im ZIP stehen dann nur Kennungen und Grössen; Namen, Notizen und Ordner liegen verschlüsselt in sicherung.json.
// - «Nur Daten» (.json): wie bisher, ohne Originaldateien (unverschlüsselt oder mit Passwort).
// - Ältere Sicherungen (Format 1 und 2, JSON) lassen sich weiterhin einlesen; sie werden geprüft und ins Projektmodell übernommen.

// ---------- ZIP ohne Kompression ----------
const CRC_TAB = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
function crc32(u8) { let c = 0xFFFFFFFF; for (let i = 0; i < u8.length; i++) c = CRC_TAB[(c ^ u8[i]) & 0xFF] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; }
const u16 = n => { const b = new Uint8Array(2); new DataView(b.buffer).setUint16(0, n, true); return b; };
const u32 = n => { const b = new Uint8Array(4); new DataView(b.buffer).setUint32(0, n >>> 0, true); return b; };
function dosZeit(d = new Date()) { return [((d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1)) & 0xFFFF, (((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate()) & 0xFFFF]; }
// eintraege: [{ name, daten: Uint8Array }] → Blob
function zipSchreiben(eintraege) {
  const teile = [], zentral = []; let pos = 0;
  const [zeit, datum] = dosZeit();
  for (const e of eintraege) {
    const name = te.encode(e.name), crc = crc32(e.daten), n = e.daten.length;
    if (n >= 0xFFFFFFFF || pos >= 0xFFFFFFFF) throw new Error(T('Die Sicherung wäre für das ZIP-Format zu gross.'));
    const kopf = [u32(0x04034b50), u16(20), u16(0x0800), u16(0), u16(zeit), u16(datum), u32(crc), u32(n), u32(n), u16(name.length), u16(0), name];
    teile.push(...kopf, e.daten);
    zentral.push([u32(0x02014b50), u16(20), u16(20), u16(0x0800), u16(0), u16(zeit), u16(datum), u32(crc), u32(n), u32(n), u16(name.length), u16(0), u16(0), u16(0), u16(0), u32(0), u32(pos), name]);
    pos += 30 + name.length + n;
  }
  const zStart = pos; let zGroesse = 0;
  for (const z of zentral) { teile.push(...z); zGroesse += z.reduce((s, x) => s + x.length, 0); }
  teile.push(u32(0x06054b50), u16(0), u16(0), u16(eintraege.length), u16(eintraege.length), u32(zGroesse), u32(zStart), u16(0));
  return new Blob(teile, { type: 'application/zip' });
}
// Liest das Inhaltsverzeichnis eines ZIP. Liefert { eintraege: Map(name → {…}), lesen(name) → Promise<Uint8Array> }.
async function zipLesen(blob) {
  const ende = Math.max(0, blob.size - 65557), tail = new Uint8Array(await blob.slice(ende).arrayBuffer());
  let i = tail.length - 22;
  while (i >= 0 && !(tail[i] === 0x50 && tail[i + 1] === 0x4B && tail[i + 2] === 5 && tail[i + 3] === 6)) i--;
  if (i < 0) throw new Error(T('Die Datei ist kein gültiges ZIP-Archiv.'));
  const dv = new DataView(tail.buffer, tail.byteOffset + i), anzahl = dv.getUint16(10, true), zGroesse = dv.getUint32(12, true), zStart = dv.getUint32(16, true);
  if (anzahl === 0xFFFF || zStart === 0xFFFFFFFF) throw new Error(T('ZIP64-Archive werden nicht unterstützt.'));
  const z = new Uint8Array(await blob.slice(zStart, zStart + zGroesse).arrayBuffer()), zv = new DataView(z.buffer);
  const eintraege = new Map(); let p = 0;
  for (let k = 0; k < anzahl; k++) {
    if (p + 46 > z.length || zv.getUint32(p, true) !== 0x02014b50) throw new Error(T('Das ZIP-Archiv ist beschädigt.'));
    const methode = zv.getUint16(p + 10, true), crc = zv.getUint32(p + 16, true), cg = zv.getUint32(p + 20, true), ug = zv.getUint32(p + 24, true), nl = zv.getUint16(p + 28, true), el = zv.getUint16(p + 30, true), kl = zv.getUint16(p + 32, true), off = zv.getUint32(p + 42, true);
    const name = td.decode(z.subarray(p + 46, p + 46 + nl));
    eintraege.set(name, { name, methode, crc, cg, ug, off });
    p += 46 + nl + el + kl;
  }
  const lesen = async name => {
    const e = eintraege.get(name); if (!e) throw new Error(T('Im Archiv fehlt «{0}».', name));
    const lk = new DataView(await blob.slice(e.off, e.off + 30).arrayBuffer());
    if (lk.getUint32(0, true) !== 0x04034b50) throw new Error(T('Das ZIP-Archiv ist beschädigt.'));
    const start = e.off + 30 + lk.getUint16(26, true) + lk.getUint16(28, true), roh = blob.slice(start, start + e.cg);
    let daten;
    if (e.methode === 0) daten = new Uint8Array(await roh.arrayBuffer());
    else if (e.methode === 8 && typeof DecompressionStream === 'function') daten = new Uint8Array(await new Response(roh.stream().pipeThrough(new DecompressionStream('deflate-raw'))).arrayBuffer());
    else throw new Error(T('Das ZIP-Archiv verwendet ein nicht unterstütztes Verfahren.'));
    if (daten.length !== e.ug || crc32(daten) !== e.crc) throw new Error(T('Der Inhalt von «{0}» ist beschädigt (Prüfsumme stimmt nicht).', name));
    return daten;
  };
  return { eintraege, lesen };
}

// ---------- Nur Daten (JSON) ----------
const sicherungsObjekt = () => ({ format: 'lf-entsiegelung', datenVersion: DATEN_VERSION, app: APP_VERSION, leitfaden: LF_DE.fassung, exportiert: new Date().toISOString(),
  hinweis: 'Enthält alle Projekte, Flächen, Ordner, Einstellungen und Angaben zu den Unterlagen, aber nicht die Originaldateien.', ...S });
const datumNamen = () => new Date().toISOString().slice(0, 10);
function blobAnbieten(blob, name) {
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 60000);
}
function exportieren() {
  dateiAnbieten(JSON.stringify(sicherungsObjekt(), null, 2), 'Entsiegelung_Sicherung_' + datumNamen() + '.json');
  sicherungVermerken(); ansagen(T('Sicherungsdatei erstellt.'));
}
async function exportierenVerschluesselt(pw) {
  const salt = zufall(16), key = await kekAusPasswort(pw, salt, PBKDF2_RUNDEN), iv = zufall(12);
  const ct = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv, additionalData: te.encode('lf-backup-v1') }, key, te.encode(JSON.stringify(sicherungsObjekt()))));
  const datei = { format: 'lf-entsiegelung-verschluesselt', v: 1, kdf: 'PBKDF2-SHA256', runden: PBKDF2_RUNDEN, salt: b64(salt), iv: b64(iv), ct: b64(ct), app: APP_VERSION, exportiert: new Date().toISOString(),
    hinweis: 'Verschlüsselte Sicherung der Leitfaden-App. Ohne das Passwort dieser Sicherung nicht lesbar.' };
  dateiAnbieten(JSON.stringify(datei, null, 2), 'Entsiegelung_Sicherung_verschluesselt_' + datumNamen() + '.json');
  sicherungVermerken();
}
function sicherungVermerken() { S.einstellungen.letzteSicherung = new Date().toISOString(); save(); }

// ---------- Vollsicherung ----------
const LIESMICH_SICHERUNG = `Vollsicherung der Leitfaden-App «Entsiegelung und Regenwasser»

Inhalt: sicherung.json (Projekte, Flächen, Ordner, Nachweise, Einstellungen) und der Ordner «dateien» mit den Originalunterlagen.
Wiederherstellen: In der App unter Einstellungen › Sicherung «Sicherung einlesen» wählen und diese Datei auswählen.
Wenn die Sicherung mit einem Passwort verschlüsselt wurde, ist der Inhalt ohne dieses Passwort nicht lesbar.
Diese Datei liegt nur bei Ihnen; die App sendet nichts ins Internet.
`;
// Baut die Vollsicherung. passwort = null: unverschlüsselt. fortschritt(text) meldet den Stand.
async function vollsicherungBauen({ passwort, mitDateien = true, fortschritt }) {
  const stand = JSON.parse(JSON.stringify(S));
  const docs = alleDoks(), eintraege = [], dateienListe = [], fehlend = [];
  let key = null, kopf = null;
  if (passwort) {
    const salt = zufall(16); key = await kekAusPasswort(passwort, salt, PBKDF2_RUNDEN);
    const pruef = await verschluesseln(key, 'lf-voll-ok', 'lf-voll-v1:pruef');
    kopf = { format: 'lf-entsiegelung-voll-verschluesselt', v: 1, kdf: 'PBKDF2-SHA256', runden: PBKDF2_RUNDEN, salt: b64(salt), pruef };
  }
  const ablegen = async (name, daten) => {
    if (!key) return eintraege.push({ name, daten });
    const iv = zufall(12), ct = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv, additionalData: te.encode('lf-voll-v1:' + name) }, key, daten));
    const aus = new Uint8Array(12 + ct.length); aus.set(iv); aus.set(ct, 12);
    eintraege.push({ name: name + '.enc', daten: aus });
  };
  let i = 0; const mitDatei = mitDateien ? docs.filter(d => d.gespeichert) : [];
  for (const d of mitDatei) {
    i++; fortschritt?.(T('Datei {0} von {1} wird gesichert …', i, mitDatei.length));
    const f = await dateiLaden(d.id).catch(() => null);
    if (!f) { fehlend.push(d.id); continue; }
    const buf = new Uint8Array(await f.arrayBuffer());
    dateienListe.push({ id: d.id, name: d.name, groesse: buf.length, typ: f.type || d.typ || '', sha256: hex(await crypto.subtle.digest('SHA-256', buf)) });
    await ablegen('dateien/' + d.id, buf);
  }
  const manifest = { format: 'lf-entsiegelung-voll', version: 1, datenVersion: DATEN_VERSION, app: APP_VERSION, leitfaden: LF_DE.fassung, erstellt: new Date().toISOString(), mitDateien, dateien: dateienListe, fehlend, stand };
  await ablegen('sicherung.json', te.encode(JSON.stringify(manifest)));
  if (kopf) eintraege.unshift({ name: 'schutz.json', daten: te.encode(JSON.stringify(kopf)) });
  eintraege.push({ name: 'LIESMICH.txt', daten: te.encode(LIESMICH_SICHERUNG) });
  fortschritt?.(T('Archiv wird geschrieben …'));
  return { blob: zipSchreiben(eintraege), dateien: dateienListe.length, fehlend: fehlend.length };
}

// ---------- Dialog «Sicherung erstellen» ----------
function sicherungDialog() {
  if (gesperrt) return;
  const nD = alleDoks().filter(d => d.gespeichert).length;
  dialogZeigen(T('Sicherung erstellen'), `<form onsubmit="sicherungSenden(event)" novalidate>
    <p>${T('Die Dateien und Angaben liegen nur auf diesem Gerät. Eine Sicherung ist die einzige Kopie ausserhalb des Browsers. Bewahren Sie sie getrennt vom Gerät auf, zum Beispiel auf einem USB-Stick oder im Netzlaufwerk der Gemeinde.')}</p>
    <fieldset class="optionen"><legend><b>${T('Umfang')}</b></legend>
      <label class="inline"><input type="radio" name="umfang" value="voll" checked> <span>${T('<b>Vollständig</b> (empfohlen): Projekte, Flächen, Ordner, Nachweise und alle {0} Originaldatei(en)', nD)}</span></label>
      <label class="inline"><input type="radio" name="umfang" value="daten"> <span>${T('<b>Nur Daten</b>: kleine Datei ohne Originaldateien')}</span></label></fieldset>
    <fieldset class="optionen" style="margin-top:10px"><legend><b>${T('Schutz der Sicherungsdatei')}</b></legend>
      <label class="inline"><input type="radio" name="schutz" value="pw" checked onchange="sicherungPwUmschalten()"> <span>${T('Mit Passwort verschlüsseln (empfohlen)')}</span></label>
      <label class="inline"><input type="radio" name="schutz" value="klar" onchange="sicherungPwUmschalten()"> <span>${T('Ohne Passwort: Jeder mit der Datei kann sie lesen')}</span></label></fieldset>
    <div id="sich-pw"><label for="sich-pw1">${T('Passwort der Sicherung (mindestens {0} Zeichen)', MIN_PW)}</label><input id="sich-pw1" type="password" data-pw autocomplete="new-password">
      <label for="sich-pw2">${T('Passwort wiederholen')}</label><input id="sich-pw2" type="password" data-pw autocomplete="new-password">
      <label class="inline"><input type="checkbox" onchange="pwZeigen(this)"> ${T('Passwort anzeigen')}</label>
      <p class="muted">${T('Das Passwort der Sicherung kann ein anderes sein als das der App. Es wird nirgends gespeichert; ohne Passwort lässt sich die Sicherung nicht öffnen.')}</p></div>
    <p class="feldfehler" id="sich-fehler" role="alert"></p><p class="muted" id="sich-status" role="status"></p>
    <div class="row"><button type="submit" id="sich-knopf">${T('Sicherung erstellen')}</button><button type="button" class="sec" onclick="dlg.close()">${T('Abbrechen')}</button></div></form>`);
}
function sicherungPwUmschalten() { const pw = document.querySelector('input[name=schutz]:checked')?.value === 'pw'; document.getElementById('sich-pw').hidden = !pw; }
async function sicherungSenden(e) {
  e.preventDefault();
  const umfang = document.querySelector('input[name=umfang]:checked').value, schutzWahl = document.querySelector('input[name=schutz]:checked').value;
  const fehler = document.getElementById('sich-fehler'), status = document.getElementById('sich-status'), knopf = document.getElementById('sich-knopf');
  let pw = null;
  if (schutzWahl === 'pw') {
    pw = document.getElementById('sich-pw1').value; const pf = pwFehler(pw, document.getElementById('sich-pw2').value);
    if (pf) { fehler.textContent = pf; return false; }
  }
  fehler.textContent = ''; knopf.disabled = true;
  try {
    if (umfang === 'daten') {
      status.textContent = T('Sicherung wird erstellt …');
      if (pw) await exportierenVerschluesselt(pw); else exportieren();
      document.getElementById('dlg').close(); ansagen(T('Sicherungsdatei erstellt.')); render();
      return false;
    }
    status.textContent = pw ? T('Schlüssel wird erzeugt (das dauert einen Moment) …') : T('Sicherung wird erstellt …');
    const r = await vollsicherungBauen({ passwort: pw, fortschritt: t => { status.textContent = t; } });
    blobAnbieten(r.blob, `Entsiegelung_Vollsicherung${pw ? '_verschluesselt' : ''}_${datumNamen()}.zip`);
    sicherungVermerken();
    document.getElementById('dlg').close(); render();
    ansagen(r.fehlend ? T('Sicherung erstellt. {0} Datei(en) fehlten auf diesem Gerät und sind nicht enthalten.', r.fehlend) : T('Vollsicherung mit {0} Datei(en) erstellt.', r.dateien));
    if (r.fehlend) dialogZeigen(T('Sicherung erstellt'), `<p>${T('Die Sicherung wurde erstellt, aber {0} Originaldatei(en) fehlten auf diesem Gerät und konnten nicht gesichert werden. Sie sind in der Ablage als «Originaldatei fehlt» gekennzeichnet.', r.fehlend)}</p>`);
  } catch (err) {
    fehler.textContent = T('Fehlgeschlagen: {0}', err?.message || err); status.textContent = ''; knopf.disabled = false;
  }
  return false;
}

// ---------- Einlesen ----------
let importKandidat = null;   // { stand, migriert, zip, key, manifest }
async function importieren(file) {
  if (!file || gesperrt) return;
  try {
    const kopf = new Uint8Array(await file.slice(0, 4).arrayBuffer());
    if (kopf[0] === 0x50 && kopf[1] === 0x4B) return await zipEinlesen(file);
    const text = await file.text();
    let roh; try { roh = JSON.parse(text); } catch (e) { return importFehler([T('Die Datei ist kein lesbares JSON.')]); }
    if (roh?.format === 'lf-entsiegelung-verschluesselt') return importPasswort(roh);
    importPruefen(roh);
  } catch (e) { importFehler([T('Die Datei konnte nicht gelesen werden: {0}', e.message)]); }
}
function importPasswort(datei) {
  importHuelle = datei;
  formDialog({
    titel: T('Verschlüsselte Sicherung öffnen'),
    intro: T('<p>Diese Sicherung ist verschlüsselt. Geben Sie das Passwort ein, das beim Erstellen der Sicherung gewählt wurde.</p>'),
    felder: [{ id: 'pw', label: T('Passwort der Sicherung'), auto: 'current-password' }], knopf: T('Öffnen'),
    handler: async (w, fehler) => {
      const h = importHuelle;
      if (!istObj(h) || h.kdf !== 'PBKDF2-SHA256' || !Number.isInteger(h.runden) || h.runden < 100000 || h.runden > 5000000 || !istText(h.salt) || !istText(h.iv) || !istText(h.ct)) return fehler(T('Die Datei ist beschädigt oder unvollständig.'));
      meldeStatus(T('Sicherung wird geöffnet …'));
      let text;
      try { text = td.decode(await crypto.subtle.decrypt({ name: 'AES-GCM', iv: unb64(h.iv), additionalData: te.encode('lf-backup-v1') }, await kekAusPasswort(w.pw, unb64(h.salt), h.runden), unb64(h.ct))); }
      catch (e) { return fehler(T('Das Passwort ist falsch, oder die Datei wurde verändert.')); }
      let roh; try { roh = JSON.parse(text); } catch (e) { return fehler(T('Die Sicherung enthält kein lesbares JSON.')); }
      importHuelle = null; document.getElementById('dlg').close(); importPruefen(roh);
    }
  });
}
async function zipEinlesen(file) {
  const zip = await zipLesen(file);
  if (zip.eintraege.has('schutz.json')) {
    let kopf; try { kopf = JSON.parse(td.decode(await zip.lesen('schutz.json'))); } catch (e) { return importFehler([T('Die Datei ist beschädigt oder unvollständig.')]); }
    if (kopf?.format !== 'lf-entsiegelung-voll-verschluesselt' || kopf.kdf !== 'PBKDF2-SHA256' || !Number.isInteger(kopf.runden) || kopf.runden < 100000 || kopf.runden > 5000000 || !istText(kopf.salt) || !istObj(kopf.pruef)) return importFehler([T('Die Datei ist beschädigt oder unvollständig.')]);
    importHuelle = { zip, kopf };
    return formDialog({
      titel: T('Verschlüsselte Sicherung öffnen'), intro: T('<p>Diese Sicherung ist verschlüsselt. Geben Sie das Passwort ein, das beim Erstellen der Sicherung gewählt wurde.</p>'),
      felder: [{ id: 'pw', label: T('Passwort der Sicherung'), auto: 'current-password' }], knopf: T('Öffnen'),
      handler: async (w, fehler) => {
        const { zip: z, kopf: k } = importHuelle;
        meldeStatus(T('Sicherung wird geöffnet …'));
        const key = await kekAusPasswort(w.pw, unb64(k.salt), k.runden);
        try { if (await entschluesseln(key, k.pruef, 'lf-voll-v1:pruef') !== 'lf-voll-ok') throw new Error('x'); } catch (e) { return fehler(T('Das Passwort ist falsch, oder die Datei wurde verändert.')); }
        let manifest;
        try { manifest = JSON.parse(td.decode(await zipEntschluesselt(z, key, 'sicherung.json'))); } catch (e) { return fehler(T('Das Passwort ist falsch, oder die Datei wurde verändert.')); }
        importHuelle = null; document.getElementById('dlg').close(); zipManifestPruefen(manifest, z, key);
      }
    });
  }
  let manifest; try { manifest = JSON.parse(td.decode(await zip.lesen('sicherung.json'))); } catch (e) { return importFehler([T('Die Datei enthält keine lesbare Sicherung der App.')]); }
  zipManifestPruefen(manifest, zip, null);
}
async function zipEntschluesselt(zip, key, name) {
  const roh = await zip.lesen(name + '.enc');
  return new Uint8Array(await crypto.subtle.decrypt({ name: 'AES-GCM', iv: roh.slice(0, 12), additionalData: te.encode('lf-voll-v1:' + name) }, key, roh.slice(12)));
}
function zipManifestPruefen(m, zip, key) {
  const f = [];
  if (!istObj(m) || m.format !== 'lf-entsiegelung-voll' || m.version !== 1) return importFehler([T('Unbekanntes Dateiformat.')]);
  if (typeof m.datenVersion === 'number' && m.datenVersion > DATEN_VERSION) return importFehler([T('Die Sicherung stammt aus einer neueren App-Version (Datenformat {0}).', m.datenVersion)]);
  if (!Array.isArray(m.dateien)) return importFehler([T('Die Datei enthält keine Liste der Originaldateien.')]);
  const r = standPruefen(m.stand);
  if (!r.stand) return importFehler(r.fehler);
  const ids = new Set(alleDoksVon(r.stand).map(d => d.id)), vorhanden = new Map();
  for (const x of m.dateien) {
    if (!istObj(x) || !istText(x.id) || !ID_MUSTER.test(x.id) || !ids.has(x.id) || !Number.isFinite(x.groesse) || !istText(x.sha256)) { f.push(T('Der Eintrag einer Originaldatei ist ungültig.')); break; }
    const e = zip.eintraege.get('dateien/' + x.id + (key ? '.enc' : ''));
    if (!e) { f.push(T('Im Archiv fehlt die Originaldatei «{0}».', String(x.name).slice(0, 60))); continue; }
    if (e.ug !== x.groesse + (key ? 28 : 0)) f.push(T('Die Originaldatei «{0}» hat nicht die erwartete Grösse.', String(x.name).slice(0, 60)));
    vorhanden.set(x.id, x);
  }
  if (f.length) return importFehler(f);
  importKandidat = { stand: r.stand, migriert: !!r.migriert, zip, key, manifest: m, dateien: vorhanden };
  importAuswahlZeigen();
}
const alleDoksVon = st => [...st.projekte.flatMap(p => p.dokumente), ...st.flaechen.flatMap(f => f.dokumente || [])];
function importPruefen(roh) {
  const r = standPruefen(roh);
  if (!r.stand) return importFehler(r.fehler);
  importKandidat = { stand: r.stand, migriert: !!r.migriert, zip: null, key: null, manifest: null, dateien: new Map() };
  importAuswahlZeigen();
}
function importAuswahlZeigen() {
  const kd = importKandidat, k = kd.stand;
  const gleich = k.flaechen.filter(x => S.flaechen.some(y => y.id === x.id)).length, dok = alleDoksVon(k).length;
  const mitDatei = kd.dateien.size;
  dialogZeigen(T('Sicherung einlesen'), `<p>${T('<b>Die Datei ist gültig.</b> Sie enthält {0} Projekt(e), {1} Fläche(n), {2} Unterlage(n) und die Einstellungen (Rangschwelle {3}).', k.projekte.length, k.flaechen.length, dok, k.einstellungen.schwelle)}</p>
      <p class="muted">${mitDatei ? T('{0} Originaldatei(en) sind enthalten.', mitDatei) : T('Originaldateien sind nicht enthalten; die Unterlagen werden als «Originaldatei fehlt» gekennzeichnet.')}${kd.migriert ? ' ' + T('Die Sicherung stammt aus einer früheren App-Version; ihre Flächen werden in ein Projekt übernommen.') : ''}</p>
      <h3>${T('Zusammenführen')}</h3><p class="muted">${T('Neue Projekte, Flächen und Unterlagen werden ergänzt. Einstellungen und bestehende Daten bleiben unverändert.{0}', gleich ? ` ${T('{0} Fläche(n) gibt es hier schon (gleiche Kennung).', gleich)}` : '')}</p>
      <div class="row"><button data-act="importWahl" data-id="neu">${T('Nur Neues ergänzen')}</button>${gleich ? `<button class="sec" data-act="importWahl" data-id="kopie">${T('Neues ergänzen, vorhandene Flächen als Kopie')}</button>` : ''}</div>
      <h3 style="margin-top:18px">${T('Vollständig wiederherstellen')}</h3><p class="muted">${T('Ersetzt alle Projekte, Flächen, Dateien und Einstellungen dieses Geräts durch die Sicherung. Der heutige Stand wird vorher als Datei angeboten.')}</p>
      <div class="row"><button class="danger" data-act="importWahl" data-id="ersetzen">${T('Heutigen Stand sichern und vollständig wiederherstellen')}</button></div>`);
}
function importFehler(fehler) {
  dialogZeigen(T('Sicherung nicht eingelesen'), `<div class="fehlerbox">${T('<b>Die Datei wurde abgewiesen.</b> Ihre vorhandenen Daten sind unverändert.')}</div>
    <ul>${fehler.slice(0, 12).map(x => `<li>${esc(x)}</li>`).join('')}</ul>${fehler.length > 12 ? `<p class="muted">${T('… und {0} weitere.', fehler.length - 12)}</p>` : ''}`);
}

// ---------- Wiederherstellen ----------
// Stellt eine Originaldatei aus dem Archiv her und prüft die Prüfsumme. Liefert true bei Erfolg.
async function dateiAusArchiv(kd, id) {
  const x = kd.dateien.get(id); if (!x) return false;
  try {
    const daten = kd.key ? await zipEntschluesselt(kd.zip, kd.key, 'dateien/' + id) : await kd.zip.lesen('dateien/' + id);
    if (hex(await crypto.subtle.digest('SHA-256', daten)) !== x.sha256) return false;
    await dateiSpeichern(id, new Blob([daten], { type: x.typ || '' }));
    return true;
  } catch (e) { return false; }
}
// Ordnerzuordnung beim Zusammenführen: Kennung im Import → Kennung im lokalen Projekt (fehlende Ordner werden ergänzt)
function ordnerKarte(lp, bp, nachTyp) {
  const karte = new Map();
  const rest = [...bp.ordner];
  for (const o of rest) {
    if (nachTyp ? ordnerTypSuchen(lp, o.typ) && o.typ : lp.ordner.some(x => x.id === o.id)) karte.set(o.id, nachTyp ? ordnerTypSuchen(lp, o.typ).id : o.id);
  }
  let weiter = true;
  while (weiter) {
    weiter = false;
    for (const o of rest) {
      if (karte.has(o.id)) continue;
      if (o.eltern && !karte.has(o.eltern)) continue;
      const eltern = o.eltern ? karte.get(o.eltern) : null;
      let name = o.name ?? ordnerTitel(o);
      while (ordnerNameFehler(lp, name, eltern)) name += ' (2)';
      const neu = ordnerNeu(null, name, eltern, ordnerGeschwister(lp, eltern).length);
      lp.ordner.push(neu); karte.set(o.id, neu.id); weiter = true;
    }
  }
  return karte;
}
function zusammenfuehren(kd, kopieren) {
  const k = kd.stand, aktiv = projektAktiv(), erg = { projekte: 0, flaechen: 0, neueDoks: [], kopien: [] };
  const dokIds = new Set(alleDoks().map(d => d.id)), flIds = new Set(S.flaechen.map(f => f.id));
  for (const bp of k.projekte) {
    let lp = kd.migriert ? aktiv : S.projekte.find(p => p.id === bp.id), karte;
    if (!lp) { S.projekte.push(bp); erg.projekte++; lp = bp; bp.dokumente = bp.dokumente.filter(d => !dokIds.has(d.id)); bp.dokumente.forEach(d => erg.neueDoks.push(d.id)); karte = new Map(bp.ordner.map(o => [o.id, o.id])); }
    else {
      karte = ordnerKarte(lp, bp, kd.migriert);
      for (const d of bp.dokumente) if (!dokIds.has(d.id)) { d.ordner = karte.get(d.ordner) || eingangOrdner(lp).id; lp.dokumente.push(d); erg.neueDoks.push(d.id); dokIds.add(d.id); }
    }
    for (const f of k.flaechen.filter(x => x.projektId === bp.id)) {
      const vorhanden = flIds.has(f.id);
      if (vorhanden && !kopieren) continue;
      f.projektId = lp.id;
      for (const d of f.dokumente || []) d.ordner = karte.get(d.ordner) || eingangOrdner(lp).id;
      if (vorhanden) flaecheAlsKopie(f, erg); else (f.dokumente || []).forEach(d => { if (!dokIds.has(d.id)) erg.neueDoks.push(d.id); });
      S.flaechen.push(f); erg.flaechen++; flIds.add(f.id);
    }
  }
  return erg;
}
// Eine Fläche mit bereits vorhandener Kennung als Kopie übernehmen: neue Kennungen für Fläche und Unterlagen, Verweise werden mitgeführt.
function flaecheAlsKopie(f, erg) {
  f.id = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  f.name += T(' (aus Sicherung)');
  const map = {};
  for (const d of f.dokumente || []) {
    const neu = 'd' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
    erg.kopien.push({ alt: d.id, neu }); map[d.id] = neu; d.id = neu; d.angewendet = [f.id];
  }
  const um = q => { if (q?.docId && map[q.docId]) q.docId = map[q.docId]; };
  Object.values(f.herkunft || {}).forEach(um);
  (f.vorschlaege || []).forEach(v => um(v.quelle));
  Object.values(f.nachweise || {}).forEach(n => { um(n.quelle); um(n.fach); });
}
async function importAusfuehren(wahl, kopieErstellt) {
  const kd = importKandidat; if (!kd || gesperrt) return;
  if (wahl === 'ersetzen' && !kopieErstellt) {
    // Der heutige Stand wird zuerst als Datei angeboten: mit Passwort verschlüsselt, wenn die App geschützt ist, sonst unverschlüsselt.
    if (schutz?.key) {
      return formDialog({
        titel: T('Heutigen Stand sichern'),
        intro: T('<p>Vor dem Ersetzen wird der heutige Stand als <b>verschlüsselte</b> Vollsicherung angeboten. Wählen Sie ein Passwort nur für diese Datei.</p>'),
        felder: pwPaar('pw1', 'pw2', T('Passwort der Sicherung')), knopf: T('Sichern und wiederherstellen'),
        handler: async (w, fehler) => {
          const pf = pwFehler(w.pw1, w.pw2); if (pf) return fehler(pf);
          const r = await vollsicherungBauen({ passwort: w.pw1, fortschritt: meldeStatus });
          blobAnbieten(r.blob, `Entsiegelung_Stand_vor_Wiederherstellung_verschluesselt_${datumNamen()}.zip`);
          document.getElementById('dlg').close(); importAusfuehren('ersetzen', true);
        }
      });
    }
    if (alleDoks().some(d => d.gespeichert)) { const r = await vollsicherungBauen({ passwort: null }); blobAnbieten(r.blob, `Entsiegelung_Stand_vor_Wiederherstellung_${datumNamen()}.zip`); }
    else dateiAnbieten(JSON.stringify(sicherungsObjekt(), null, 2), 'Entsiegelung_Stand_vor_Wiederherstellung_' + datumNamen() + '.json');
  }
  importKandidat = null; document.getElementById('dlg').close();
  const vorher = JSON.stringify(S), alteIds = alleDoks().map(d => d.id);
  let wiederhergestellt = 0, ohneDatei = 0, neueIds = [];
  const status = t => ansagen(t);
  try {
    if (wahl === 'ersetzen') {
      const neu = kd.stand;
      for (const d of alleDoksVon(neu)) { d.index = 0; delete d.textStatus; }
      for (const d of alleDoksVon(neu)) { if (kd.dateien.has(d.id)) { if (await dateiAusArchiv(kd, d.id)) { wiederhergestellt++; d.gespeichert = true; delete d.fehltOriginal; } else { ohneDatei++; d.gespeichert = false; d.fehltOriginal = true; } } else if (d.gespeichert) { ohneDatei++; d.gespeichert = false; d.fehltOriginal = true; } }
      S = neu; neueIds = alleDoks().map(d => d.id);
    } else {
      const erg = zusammenfuehren(kd, wahl === 'kopie');
      for (const d of alleDoks().filter(x => erg.neueDoks.includes(x.id) || erg.kopien.some(c => c.neu === x.id))) {
        d.index = 0; delete d.textStatus;
        const kopie = erg.kopien.find(c => c.neu === d.id), quellId = kopie ? kopie.alt : d.id;
        let ok = false;
        if (kd.dateien.has(quellId)) {
          if (kopie) { try { const daten = kd.key ? await zipEntschluesselt(kd.zip, kd.key, 'dateien/' + quellId) : await kd.zip.lesen('dateien/' + quellId); const x = kd.dateien.get(quellId); ok = hex(await crypto.subtle.digest('SHA-256', daten)) === x.sha256; if (ok) await dateiSpeichern(d.id, new Blob([daten], { type: x.typ || '' })); } catch (e) { ok = false; } }
          else ok = await dateiAusArchiv(kd, d.id);
        } else if (kopie) { const lokal = await dateiLaden(kopie.alt).catch(() => null); if (lokal) { await dateiSpeichern(d.id, lokal).catch(() => {}); ok = true; } }
        if (ok) { wiederhergestellt++; d.gespeichert = true; delete d.fehltOriginal; neueIds.push(d.id); } else { ohneDatei++; d.gespeichert = false; d.fehltOriginal = true; }
      }
    }
  } catch (err) {
    S = JSON.parse(vorher); render();
    return dialogZeigen(T('Sicherung nicht eingelesen'), `<div class="fehlerbox">${T('<b>Das Einlesen wurde abgebrochen.</b> Ihre bisherigen Daten sind unverändert. {0}', esc(err?.message || err))}</div>`);
  }
  const ok = schutz?.key ? (save(), await speichernWarten()) : save();
  if (!ok) {
    S = JSON.parse(vorher);
    for (const id of neueIds) if (!alteIds.includes(id)) await dateiLoeschen(id);
    render(); return dialogZeigen(T('Sicherung nicht eingelesen'), `<div class="fehlerbox">${T('<b>Der Stand konnte nicht gespeichert werden.</b> Ihre bisherigen Daten sind unverändert.')} ${esc(speicherFehler || '')}</div>`);
  }
  if (wahl === 'ersetzen') { for (const id of alteIds) if (!neueIds.includes(id)) { await dateiLoeschen(id); await textLoeschen(id); } suchCache.clear(); }
  ablageUI.ordner = 'alle'; ablageUI.filterSig = ''; ablageUI.ergebnis = null;
  view = { tab: 'flaechen', id: null, schritt: 1 }; sprachenAnwenden(); render();
  ansagen(`${T('Sicherung eingelesen{0}.', ohneDatei ? `${T('; {0} Originaldatei(en) fehlen auf diesem Gerät', ohneDatei)}` : '')}`);
  indexAufbauen();
}
// Prüft, ob die Originaldateien tatsächlich im Gerätespeicher liegen, statt dem Merkmal «gespeichert» zu vertrauen.
async function originalePruefen() {
  let fehlend = 0;
  for (const d of alleDoks()) {
    if (!d.gespeichert && !d.fehltOriginal) continue;
    const da = await dateiVorhanden(d.id).catch(() => null);
    if (da === null) continue;
    d.fehltOriginal = !da; d.gespeichert = da;
    if (!da) fehlend++;
  }
  if (fehlend) save();
  return fehlend;
}

// ---------- Anzeige in den Einstellungen ----------
async function speicherBelegung() {
  try { const e = await navigator.storage?.estimate?.(); if (e?.usage != null) return { belegt: e.usage, frei: e.quota != null ? e.quota - e.usage : null }; } catch (err) { /* keine Angabe */ }
  return null;
}
function vSicherungKarte() {
  const nD = alleDoks().filter(d => d.gespeichert).length, letzte = S.einstellungen.letzteSicherung;
  let zuletzt = letzte ? T('Letzte Sicherung: {0}', new Date(letzte).toLocaleString(lokale(), { dateStyle: 'medium', timeStyle: 'short' })) : T('Es wurde noch keine Sicherung erstellt.');
  return `<div class="card no-print" data-gruppe="sicherung"><h3>${T('Ablage und Sicherung')}</h3>
    <p>${T('Projekte, Flächen und Dateien werden <b>nur auf diesem Gerät</b> im Browser gespeichert. Es gibt keine Cloud und keine automatische Synchronisation mit anderen Geräten. Wenn die Browserdaten gelöscht werden oder das Gerät defekt ist, sind die Daten weg. Erstellen Sie deshalb regelmässig eine Sicherung.')}</p>
    <p class="muted">${T('Das ist die technische Sicherung der App-Daten (Datei .zip oder .json). Dokumente legen Sie nicht hier, sondern in der Dateiablage ab.')}</p>
    <p class="${letzte ? 'muted' : ''}" id="sich-stand">${letzte ? esc(zuletzt) : `<span class="tag offen">${esc(zuletzt)}</span>`}</p>
    <p class="muted" id="speicher-beleg"></p>
    <div class="row"><button data-act="sicherungDialog">${T('Sicherung erstellen …')}</button>
      <button class="sec" onclick="document.getElementById('importDatei').click()">${T('Sicherung einlesen …')}</button><input id="importDatei" type="file" accept=".zip,.json,application/zip,application/json" hidden onchange="importieren(this.files[0]);this.value=''"></div>
    <details style="margin-top:12px"><summary>${T('Was enthält eine Sicherung?')}</summary><ul class="muted">
      <li>${T('<b>Vollständig:</b> Projekte, Flächen, Ordnerstruktur, alle {0} Originaldatei(en), Zuordnungen und Nachweise.', nD)}</li>
      <li>${T('<b>Nur Daten:</b> wie bisher, ohne Originaldateien; sehr klein.')}</li>
      <li>${T('Sicherungen werden mit einem eigenen Passwort verschlüsselt; Klartext lässt sich ausdrücklich wählen.')}</li>
      <li>${T('Beim Einlesen wird die Datei vollständig geprüft. Ältere Sicherungsdateien lassen sich weiterhin einlesen.')}</li></ul></details></div>`;
}
function speicherBelegungAnzeigen() {
  const el = document.getElementById('speicher-beleg'); if (!el) return;
  speicherBelegung().then(b => { const e2 = document.getElementById('speicher-beleg'); if (e2 && b) e2.textContent = b.frei != null ? T('Belegter Speicher dieser App: {0}. Noch frei: etwa {1}.', mb(b.belegt), mb(b.frei)) : T('Belegter Speicher dieser App: {0}.', mb(b.belegt)); });
}
