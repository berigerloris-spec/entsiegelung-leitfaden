'use strict';
// Foto erfassen (Kamera), lokale Texterkennung (OCR), DOCX-Leser und unverbindliche Hinweise (ab lf-v23).
//
// Grundsätze
// - Alles läuft auf dem Gerät. Tesseract.js, Mammoth und pdf.js liegen im Ordner lib/ (keine CDN-Abhängigkeit).
//   Es werden keine Bilder, Dateien oder Texte an einen externen Dienst gesendet.
// - Die Texterkennung liefert nur Hinweise. Sie setzt nie eine Zulässigkeit, eine Massnahme, einen Status oder einen
//   Prüfpunkt: Ergebnisse stehen im Suchtext und in der Liste «Hinweise aus Texterkennung (unverbindlich)».
// - «Als Hinweis übernehmen» ergänzt ausschliesslich eine Notiz.
// - «Foto erfassen» liefert ein Foto mit Drehung und Zuschnitt, keinen echten Scan (keine automatische Kantenerkennung
//   oder Entzerrung).

// ---------- Bibliotheken nachladen ----------
const skriptGeladen = {};
function skriptLaden(pfad) {
  return skriptGeladen[pfad] ??= new Promise((res, rej) => {
    const s = document.createElement('script'); s.src = pfad;
    s.onload = () => res(); s.onerror = () => { delete skriptGeladen[pfad]; rej(new Error(T('Die Komponente «{0}» konnte nicht geladen werden.', pfad))); };
    document.head.appendChild(s);
  });
}
const mammothLaden = () => skriptLaden('lib/mammoth.browser.min.js').then(() => window.mammoth);
const tesseractLaden = () => skriptLaden('lib/tesseract/tesseract.min.js').then(() => window.Tesseract);
const OCR_SPRACHEN = [['deu', _('Deutsch')], ['fra', _('Français')], ['ita', _('Italiano')], ['eng', _('English')]];
const ocrEinstellung = () => (istObj(S?.einstellungen?.ocr) ? S.einstellungen.ocr : { an: true, sprache: 'deu' });

// ---------- Texterkennung (OCR) ----------
let ocrWorker = null, ocrSprache = null, ocrLaeuft = false, ocrAbbruch = false, ocrFortschrittProzent = 0;
const ocrWarteschlange = [];
const bildGruppe = d => typeof dateiArt === 'function' && dateiArt(d) === 'bild';
async function ocrWorkerHolen(sprache) {
  if (ocrWorker && ocrSprache === sprache) return ocrWorker;
  await ocrBeenden(false);
  const TS = await tesseractLaden();
  const basis = new URL('lib/tesseract/', location.href).href;
  ocrWorker = await TS.createWorker(sprache, 1, {
    workerPath: basis + 'worker.min.js', corePath: basis + 'core/', langPath: basis + 'lang',
    workerBlobURL: false, cacheMethod: 'none', gzip: true,
    logger: m => { if (m && m.status === 'recognizing text') { ocrFortschrittProzent = Math.round((m.progress || 0) * 100); seitenleisteAktualisieren(); } }
  });
  ocrSprache = sprache;
  return ocrWorker;
}
async function ocrBeenden(leeren = true) {
  if (leeren) { ocrWarteschlange.length = 0; ocrAbbruch = true; }
  const w = ocrWorker; ocrWorker = null; ocrSprache = null;
  try { await w?.terminate(); } catch (e) { /* schon beendet */ }
}
// Verkleinert ein Foto für die Erkennung (längste Seite höchstens 2600 Pixel) und gibt eine Zeichenfläche zurück.
async function bildFuerOcr(file) {
  const bmp = await createImageBitmap(file);
  const f = Math.min(1, 2600 / Math.max(bmp.width, bmp.height)), w = Math.max(1, Math.round(bmp.width * f)), h = Math.max(1, Math.round(bmp.height * f));
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const g = c.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, w, h); g.drawImage(bmp, 0, 0, w, h);
  bmp.close?.();
  return c;
}
function ocrEinreihen(id) {
  if (!ocrEinstellung().an || gesperrt) return;
  const c = dokFinden(id); if (!c || !bildGruppe(c.d) || !c.d.gespeichert) return;
  if (ocrWarteschlange.includes(id) || c.d.ocrStatus === 'laeuft') return;
  c.d.ocrStatus = 'wartet'; ocrWarteschlange.push(id);
  seitenleisteAktualisieren();
  ocrLosLaufen();
}
async function ocrLosLaufen() {
  if (ocrLaeuft) return;
  ocrLaeuft = true; ocrAbbruch = false;
  try {
    while (ocrWarteschlange.length && !gesperrt && !ocrAbbruch) {
      const id = ocrWarteschlange.shift();
      await ocrAusfuehren(id);
    }
  } finally { ocrLaeuft = false; seitenleisteAktualisieren(); }
}
async function ocrAusfuehren(id) {
  let c = dokFinden(id); if (!c || c.d.papierkorb) return;
  const sprache = ocrEinstellung().sprache;
  c.d.ocrStatus = 'laeuft'; ocrFortschrittProzent = 0; seitenleisteAktualisieren();
  try {
    const file = await dateiLaden(id);
    if (!file) throw new Error(T('Die Datei ist auf diesem Gerät nicht mehr vorhanden.'));
    const cnv = await bildFuerOcr(file);
    const w = await ocrWorkerHolen(sprache);
    const r = await w.recognize(cnv);
    if (gesperrt || ocrAbbruch) return;
    c = dokFinden(id); if (!c) return;
    const text = String(r.data?.text || '').replace(/\r/g, '').replace(/[ \t]+\n/g, '\n').trim();
    const d = c.d;
    if (text.replace(/\s/g, '').length < 20) { d.ocrStatus = 'keinText'; d.textStatus = 'keinText'; d.index = 1; delete d.ocrHinweise; await textLoeschen(id); }
    else {
      await textSpeichern(id, { v: 1, seiten: [text], art: 'ocr' });
      d.textStatus = 'ocr'; d.index = 1; d.ocrStatus = 'fertig';
      d.ocr = { sprache, konfidenz: Math.round(r.data?.confidence ?? 0), zeit: new Date().toISOString() };
      d.ocrHinweise = fundstellen(text);   // nur Hinweise: werden weder als Fundstellen (d.funde) noch als erkannte Werte oder Nachweise geführt
    }
    bildHinweisBereinigen(d);
    save();
  } catch (e) {
    c = dokFinden(id); if (c) { c.d.ocrStatus = 'fehler'; c.d.ocrFehler = String(e?.message || e).slice(0, 200); save(); }
  }
}
// Der Importhinweis «Text in Bildern wird nicht (oder noch nicht) gelesen» ist nach der Texterkennung überholt und wird entfernt.
function bildHinweisBereinigen(d) {
  if (!Array.isArray(d.hinweisT)) return;
  const rest = d.hinweisT.filter(t => !String(t[0]).startsWith('Foto oder Scan gespeichert.'));
  if (rest.length === d.hinweisT.length) return;
  if (rest.length) { d.hinweisT = rest; d.hinweis = hinweisDeutsch(d); } else { delete d.hinweisT; delete d.hinweis; }
}
// Anzeige: [Art, Text] oder null
function ocrChip(d) {
  if (!d || !bildGruppe(d)) return null;
  const s = d.ocrStatus;
  if (s === 'laeuft') return ['info', ocrFortschrittProzent ? T('Texterkennung läuft ({0} %)', ocrFortschrittProzent) : T('Texterkennung läuft …')];
  if (s === 'wartet') return ['info', T('Texterkennung wartet')];
  if (s === 'fertig') return ['info', T('Text per Texterkennung (kann Fehler enthalten)')];
  if (s === 'keinText') return ['offen', T('Kein Text erkannt')];
  if (s === 'fehler') return ['no', T('Texterkennung fehlgeschlagen')];
  return null;
}

// ---------- Unverbindliche Hinweise ----------
// Zielfeld der Notiz für ein Thema der Dokumentprüfung. Es wird nie ein Status gesetzt.
const HINWEIS_ZIEL = { gws: 'abkl.gws.notiz', untergrund: 'abkl.untergrund.notiz', wasser: 'abkl.wasser.notiz', quelle: 'abkl.quelle.notiz', schutz: 'abkl.schutz.notiz', anlass: 'anlass.notiz' };
let hinweisRegister = new Map(), hinweisZaehler = 0;
function hinweisAnmelden(ziel, text, quelle, seite) { const id = String(++hinweisZaehler); hinweisRegister.set(id, { ziel, text, quelle, seite }); return id; }
// Ergänzt nur eine Notiz. Dieselbe Zeile wird nie zweimal eingetragen.
function hinweisUebernehmen(id) {
  const h = hinweisRegister.get(String(id)), f = F(); if (!h || !f) return;
  const zeile = T('Hinweis aus «{0}»{1} (unverbindlich): {2}', h.quelle, h.seite ? ', ' + T('Seite {0}', h.seite) : '', h.text);
  const ks = h.ziel.split('.'); let o = f;
  ks.slice(0, -1).forEach(k => o = o[k] ??= {});
  const feld = ks.at(-1), alt = String(o[feld] || '');
  if (alt.includes(h.text)) { ansagen(T('Dieser Hinweis steht schon in der Notiz.')); return; }
  o[feld] = alt ? alt + '\n' + zeile : zeile;
  rerender();
  ansagen(T('Hinweis in die Notiz übernommen. Es wurde kein Status geändert.'));
}
// Knopf «Als Hinweis übernehmen» neben einer Fundstelle in den Unterlagen: ergänzt nur eine Notiz.
function hinweisKnopf(f, keys, x) {
  const d = quellenListe(f)[x.nr - 1]; if (!d) return '';
  const ziel = HINWEIS_ZIEL[keys.find(k => HINWEIS_ZIEL[k])] || 'notiz';
  const id = hinweisAnmelden(ziel, x.text, d.name, x.seite);
  return ` <button type="button" class="link no-print" data-act="hinweisUebernehmen" data-id="${id}">${T('Als Hinweis übernehmen')}</button>`;
}
// Liste der Hinweise aus Texterkennung zu den Themen (keys). Reine Anzeige mit Knopf «Als Hinweis übernehmen».
function vOcrHinweise(f, keys) {
  const zeilen = [];
  quellenListe(f).forEach((d, i) => (d.ocrHinweise || []).forEach(x => {
    if (!keys.includes(x.key)) return;
    zeilen.push({ text: x.auszug, nr: i + 1, name: d.name, seite: x.seite, key: x.key });
  }));
  if (!zeilen.length) return '';
  return `<div class="beleg ocr-hinweis"><div class="beleg-inhalt"><span class="beleg-titel">${T('Hinweise aus Texterkennung (unverbindlich, kann Fehler enthalten)')}</span>
    ${zeilen.slice(0, 3).map(x => { const ziel = HINWEIS_ZIEL[x.key] || 'notiz', id = hinweisAnmelden(ziel, x.text, x.name, x.seite); return `<p>${esc(x.text)} <span class="quelle">[${x.nr}${x.seite ? ', ' + T('Seite {0}', x.seite) : ''}]</span> <button type="button" class="link no-print" data-act="hinweisUebernehmen" data-id="${id}">${T('Als Hinweis übernehmen')}</button></p>`; }).join('')}</div></div>`;
}

// ---------- Foto erfassen ----------
const fotoUI = { bmp: null, drehung: 0, rand: { o: 0, u: 0, l: 0, r: 0 }, name: '', quelle: null, warteschlange: [], weiter: false };
const kameraGeraet = () => /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent) || (navigator.maxTouchPoints > 1 && /Macintosh/.test(navigator.userAgent));
function fotoErfassenStarten() {
  const inp = document.getElementById('foto-eingabe'); if (!inp || gesperrt) return;
  inp.value = ''; inp.click();
}
function fotoGewaehlt(inp) {
  const files = [...(inp.files || [])]; inp.value = '';
  if (!files.length) return;
  fotoUI.warteschlange = files;
  fotoNaechstes();
}
function fotoNaechstes() {
  const file = fotoUI.warteschlange.shift(); if (!file) return;
  fotoDialog(file);
}
const fotoDatum = () => { const d = new Date(), p = n => String(n).padStart(2, '0'); return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}_${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`; };
async function fotoDialog(file) {
  if (gesperrt) return;
  if (!/^image\//.test(file.type) && !/\.(jpe?g|png|webp|gif|bmp|heic|heif)$/i.test(file.name || '')) {
    return dialogZeigen(T('Foto erfassen'), `<div class="fehlerbox">${T('Diese Datei ist kein Foto. Bitte ein Bild (JPG, PNG) wählen oder die Datei über «Dateien auswählen» ablegen.')}</div>`);
  }
  if (file.size > DOC_MAX) return dialogZeigen(T('Foto erfassen'), `<div class="fehlerbox">${T('Nicht übernommen: Die Datei ist {0} gross, erlaubt sind {1}.', mb(file.size), mb(DOC_MAX))}</div>`);
  let bmp = null;
  try { bmp = await createImageBitmap(file); } catch (e) { bmp = null; }
  const p = projektAktiv(), fl = flaechenVon(p), ausgewaehlt = view.id && fl.some(f => f.id === view.id) ? view.id : '';
  const ziele = `<option value=""${ausgewaehlt ? '' : ' selected'}>${esc(T('Eingang / Zuordnen (Projekt «{0}»)', projektTitel(p)))}</option>` + fl.map(f => `<option value="${esc(f.id)}"${f.id === ausgewaehlt ? ' selected' : ''}>${esc(T('Fläche «{0}»', f.name))}</option>`).join('');
  if (!bmp) {
    // Format nicht darstellbar (z. B. HEIC in einem Browser ohne Unterstützung): ohne Bearbeitung ablegen anbieten
    fotoUI.quelle = file; fotoUI.bmp = null;
    return dialogZeigen(T('Foto erfassen'), `<div class="warn">${T('Dieses Bildformat kann hier nicht angezeigt oder zugeschnitten werden. Sie können die Datei trotzdem unverändert ablegen.')}</div>
      <label for="foto-ziel">${T('Ablegen bei')}</label><select id="foto-ziel">${ziele}</select>
      <div class="row" style="margin-top:12px"><button type="button" data-act="fotoOhneBearbeitung">${T('Unverändert ablegen')}</button><button type="button" class="sec" onclick="dlg.close()">${T('Abbrechen')}</button></div>`);
  }
  Object.assign(fotoUI, { bmp, drehung: 0, rand: { o: 0, u: 0, l: 0, r: 0 }, name: `Foto_${fotoDatum()}.jpg`, quelle: file });
  const regler = (k, l) => `<label for="foto-r-${k}" class="foto-regler"><span>${l}</span><input type="range" id="foto-r-${k}" min="0" max="45" value="0" step="1" oninput="fotoRand('${k}', this.value)" aria-valuetext="0 %"><output id="foto-o-${k}">0 %</output></label>`;
  dialogZeigen(T('Foto erfassen'), `<p class="muted">${T('Prüfen Sie das Foto vor dem Speichern: Mit «Drehen» richten Sie es aus, mit den Reglern schneiden Sie Ränder weg. Das ist ein Foto, kein automatischer Scan.')}</p>
    <div class="foto-feld"><canvas id="foto-cnv" role="img" aria-label="${T('Vorschau des Fotos')}"></canvas></div>
    <div class="row" style="margin:10px 0"><button type="button" class="sec small" data-act="fotoDrehen" data-id="-1">${T('↺ Nach links drehen')}</button><button type="button" class="sec small" data-act="fotoDrehen" data-id="1">${T('↻ Nach rechts drehen')}</button><button type="button" class="sec small" data-act="fotoZuschnittZurueck">${T('Zuschnitt zurücksetzen')}</button></div>
    <fieldset class="optionen"><legend><b>${T('Zuschneiden (Rand wegschneiden)')}</b></legend>${regler('o', T('Oben'))}${regler('u', T('Unten'))}${regler('l', T('Links'))}${regler('r', T('Rechts'))}</fieldset>
    <label for="foto-name">${T('Dateiname')}</label><input type="text" id="foto-name" value="${esc(fotoUI.name)}" maxlength="120" autocomplete="off">
    <label for="foto-ziel">${T('Ablegen bei')}</label><select id="foto-ziel">${ziele}</select>
    <p class="feldfehler" id="foto-fehler" role="alert"></p>
    <div class="row"><button type="button" data-act="fotoSpeichern" id="foto-speichern">${T('Foto speichern')}</button><button type="button" class="sec" data-act="fotoSpeichernWeiter">${T('Speichern und weiteres Foto')}</button><button type="button" class="sec" onclick="dlg.close()">${T('Abbrechen')}</button></div>`);
  fotoZeichnen();
}
function fotoRand(k, v) {
  fotoUI.rand[k] = +v;
  // gegenüberliegende Ränder dürfen sich nicht überschneiden: es bleibt immer mindestens ein Viertel stehen
  if (fotoUI.rand.o + fotoUI.rand.u > 75) { fotoUI.rand[k === 'o' ? 'u' : 'o'] = 75 - fotoUI.rand[k]; }
  if (fotoUI.rand.l + fotoUI.rand.r > 75) { fotoUI.rand[k === 'l' ? 'r' : 'l'] = 75 - fotoUI.rand[k]; }
  for (const x of ['o', 'u', 'l', 'r']) { const el = document.getElementById('foto-r-' + x); if (el) { el.value = fotoUI.rand[x]; el.setAttribute('aria-valuetext', fotoUI.rand[x] + ' %'); document.getElementById('foto-o-' + x).textContent = fotoUI.rand[x] + ' %'; } }
  fotoZeichnen();
}
function fotoDrehen(r) { fotoUI.drehung = (fotoUI.drehung + (+r) + 4) % 4; fotoZeichnen(); }
function fotoZuschnittZurueck() { fotoUI.rand = { o: 0, u: 0, l: 0, r: 0 }; fotoRand('o', 0); }
// Zeichnet das gedrehte Bild auf die Fläche cnv (Breite/Höhe vorgegeben).
function fotoRendern(cnv, breite, hoehe) {
  const { bmp, drehung } = fotoUI, quer = drehung % 2 === 1;
  cnv.width = breite; cnv.height = hoehe;
  const g = cnv.getContext('2d'); g.save(); g.fillStyle = '#fff'; g.fillRect(0, 0, breite, hoehe);
  g.translate(breite / 2, hoehe / 2); g.rotate(drehung * Math.PI / 2);
  const dw = quer ? hoehe : breite, dh = quer ? breite : hoehe;
  g.drawImage(bmp, -dw / 2, -dh / 2, dw, dh); g.restore();
}
function fotoMasse(maxSeite) {
  const quer = fotoUI.drehung % 2 === 1, w = quer ? fotoUI.bmp.height : fotoUI.bmp.width, h = quer ? fotoUI.bmp.width : fotoUI.bmp.height, f = Math.min(1, maxSeite / Math.max(w, h));
  return { w: Math.max(1, Math.round(w * f)), h: Math.max(1, Math.round(h * f)) };
}
function fotoZeichnen() {
  const cnv = document.getElementById('foto-cnv'); if (!cnv || !fotoUI.bmp) return;
  const { w, h } = fotoMasse(900); fotoRendern(cnv, w, h);
  const g = cnv.getContext('2d'), r = fotoUI.rand;
  const x0 = w * r.l / 100, x1 = w * (1 - r.r / 100), y0 = h * r.o / 100, y1 = h * (1 - r.u / 100);
  g.fillStyle = 'rgba(17, 23, 28, .55)';
  g.fillRect(0, 0, w, y0); g.fillRect(0, y1, w, h - y1); g.fillRect(0, y0, x0, y1 - y0); g.fillRect(x1, y0, w - x1, y1 - y0);
  g.strokeStyle = '#5EC4B3'; g.lineWidth = 3; g.setLineDash([10, 6]); g.strokeRect(x0 + 1.5, y0 + 1.5, Math.max(1, x1 - x0 - 3), Math.max(1, y1 - y0 - 3));
}
// Erzeugt die Datei aus Drehung und Zuschnitt (längste Seite höchstens 3200 Pixel, JPEG).
async function fotoDatei(name) {
  const { w, h } = fotoMasse(3200), voll = document.createElement('canvas');
  fotoRendern(voll, w, h);
  const r = fotoUI.rand, sx = Math.round(w * r.l / 100), sy = Math.round(h * r.o / 100), sw = Math.max(1, Math.round(w * (1 - (r.l + r.r) / 100))), sh = Math.max(1, Math.round(h * (1 - (r.o + r.u) / 100)));
  const aus = document.createElement('canvas'); aus.width = sw; aus.height = sh;
  aus.getContext('2d').drawImage(voll, sx, sy, sw, sh, 0, 0, sw, sh);
  const blob = await new Promise(res => aus.toBlob(res, 'image/jpeg', 0.88));
  if (!blob) throw new Error(T('Das Foto konnte nicht erzeugt werden.'));
  return new File([blob], /\.jpe?g$/i.test(name) ? name : name.replace(/\.[A-Za-z0-9]{1,5}$/, '') + '.jpg', { type: 'image/jpeg' });
}
const fotoZielWahl = () => { const id = document.getElementById('foto-ziel')?.value || ''; return id ? { flaecheId: id } : { projektId: projektAktiv().id, ordnerId: eingangOrdner(projektAktiv()).id }; };
async function fotoSpeichern(weiter) {
  const fehler = document.getElementById('foto-fehler'), knopf = document.getElementById('foto-speichern');
  const name = (document.getElementById('foto-name')?.value || '').trim().replace(/[\\/:*?"<>|]/g, '_').slice(0, 120);
  if (!name) { if (fehler) fehler.textContent = T('Bitte einen Dateinamen eingeben.'); return; }
  if (knopf) knopf.disabled = true;
  try {
    const file = await fotoDatei(name), ziel = fotoZielWahl();
    document.getElementById('dlg').close();
    fotoUI.bmp?.close?.(); fotoUI.bmp = null;
    await importStarten([file], ziel);
    if (weiter) fotoErfassenStarten(); else if (fotoUI.warteschlange.length) fotoNaechstes();
  } catch (e) { if (fehler) fehler.textContent = T('Fehlgeschlagen: {0}', e.message || e); if (knopf) knopf.disabled = false; }
}
async function fotoOhneBearbeitung() {
  const ziel = fotoZielWahl(), file = fotoUI.quelle; document.getElementById('dlg').close();
  if (file) await importStarten([file], ziel);
  if (fotoUI.warteschlange.length) fotoNaechstes();
}
document.getElementById('dlg').addEventListener('close', () => { if (!document.getElementById('dlg').open && fotoUI.bmp) { fotoUI.bmp.close?.(); fotoUI.bmp = null; } });

// Aktionen
Object.assign(AKTIONEN_ABLAGE, {
  fotoErfassen: () => fotoErfassenStarten(), fotoDrehen: id => fotoDrehen(id), fotoZuschnittZurueck: () => fotoZuschnittZurueck(),
  fotoSpeichern: () => fotoSpeichern(false), fotoSpeichernWeiter: () => fotoSpeichern(true), fotoOhneBearbeitung: () => fotoOhneBearbeitung(),
  hinweisUebernehmen: id => hinweisUebernehmen(id), ocrStarten: id => { const c = dokFinden(id); if (c) { c.d.ocrStatus = undefined; ocrEinreihen(id); } },
  ocrEinAus: () => { const o = { ...ocrEinstellung() }; o.an = !o.an; S.einstellungen.ocr = o; if (!o.an) ocrBeenden(true); rerender(); },
  dateienFlaeche: () => { const inp = document.getElementById('flaechen-datei'); inp?.click(); }
});
function ocrSpracheSetzen(v) { if (!OCR_SPRACHEN.some(s => s[0] === v)) return; S.einstellungen.ocr = { ...ocrEinstellung(), sprache: v }; ocrBeenden(false); rerender(); }
// Karte der Einstellungen
function vOcrKarte() {
  const o = ocrEinstellung();
  return `<div class="card no-print" data-gruppe="ocr"><h3>${T('Fotos und Texterkennung')}</h3>
    <p>${T('Fotos und Bilder werden auf diesem Gerät nach Text durchsucht (Texterkennung, OCR). Dafür wird nichts an einen Dienst gesendet. Das Ergebnis dient nur als Hinweis und kann Fehler enthalten; es setzt nie eine Zulässigkeit, eine Massnahme oder einen Status.')}</p>
    <label class="inline"><input type="checkbox" data-fid="ocr-an" ${o.an ? 'checked' : ''} onchange="AKTIONEN_ABLAGE.ocrEinAus()"> <span>${T('Texterkennung für neue Fotos und Bilder einschalten')}</span></label>
    <label for="ocr-sprache">${T('Sprache der Dokumente auf den Fotos')}</label>
    <select id="ocr-sprache" data-fid="ocr-sprache" onchange="ocrSpracheSetzen(this.value)">${OCR_SPRACHEN.map(([c, n]) => `<option value="${c}"${o.sprache === c ? ' selected' : ''}>${esc(String(n))}</option>`).join('')}</select>
    <p class="muted">${T('Die Texterkennung braucht auf Smartphones einige Sekunden bis Minuten je Foto und läuft im Hintergrund. Pläne und handgeschriebene Notizen werden oft nur teilweise erkannt.')}</p></div>`;
}
