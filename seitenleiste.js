'use strict';
// Seitenleiste «Dateiablage» (ab lf-v23): aktives Projekt, Suche, Ablagefläche, Ordner, Dateien, Dialoge.
// Alle Texte laufen über T(); Namen von Projekten, Ordnern und Dateien werden nie übersetzt.

const ablageUI = { offen: null, ordner: 'alle', suche: '', filter: { ordner: '', gruppe: '', sort: 'relevanz' }, ergebnis: null, lauf: 0, timer: null, filterSig: '', versionen: new Set() };
const ABLAGE_BREIT = 900;
function ablageStartzustand() {
  let gespeichert = null; try { gespeichert = localStorage.getItem('lf-ablage'); } catch (e) { /* Komfort */ }
  ablageUI.offen = innerWidth >= ABLAGE_BREIT ? gespeichert !== 'zu' : false;
}
function ablageSpeichern() { try { localStorage.setItem('lf-ablage', ablageUI.offen ? 'offen' : 'zu'); } catch (e) { /* Komfort */ } }
const schmal = () => innerWidth < ABLAGE_BREIT;

// ---------- Hilfen ----------
const SVG = {
  ordner: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z"/></svg>',
  eingang: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M4 13l2-7h12l2 7M4 13v5a1 1 0 001 1h14a1 1 0 001-1v-5M4 13h4l1 2h6l1-2h4"/></svg>',
  papierkorb: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a1 1 0 001 1h8a1 1 0 001-1l1-12M9 7V4h6v3"/></svg>',
  alle: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M7 3h7l5 5v13H7z"/><path d="M14 3v5h5"/></svg>',
  hoch: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M12 16V4M7 9l5-5 5 5M4 16v3a1 1 0 001 1h14a1 1 0 001-1v-3"/></svg>',
  mehr: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="5" cy="12" r="1.8"/><circle cx="12" cy="12" r="1.8"/><circle cx="19" cy="12" r="1.8"/></svg>',
  zahnrad: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 00.34 1.88l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.7 1.7 0 00-1.88-.34 1.7 1.7 0 00-1.03 1.56V21a2 2 0 11-4 0v-.09A1.7 1.7 0 009 19.4a1.7 1.7 0 00-1.88.34l-.06.06a2 2 0 11-2.83-2.83l.06-.06A1.7 1.7 0 004.6 15a1.7 1.7 0 00-1.56-1.03H3a2 2 0 110-4h.09A1.7 1.7 0 004.6 9a1.7 1.7 0 00-.34-1.88l-.06-.06a2 2 0 112.83-2.83l.06.06A1.7 1.7 0 009 4.6a1.7 1.7 0 001.03-1.56V3a2 2 0 114 0v.09A1.7 1.7 0 0015 4.6a1.7 1.7 0 001.88-.34l.06-.06a2 2 0 112.83 2.83l-.06.06A1.7 1.7 0 0019.4 9c.2.64.82 1.05 1.5 1.03H21a2 2 0 110 4h-.09c-.68-.02-1.3.39-1.51 1.03z"/></svg>'
};
const datumKurz = d => { try { return new Date(d.abgelegt || 0).getTime() ? new Date(d.abgelegt).toLocaleDateString(lokale()) : (d.datum || ''); } catch (e) { return d.datum || ''; } };
const gruppeName = g => String(GRUPPEN.find(x => x[0] === g)?.[1] ?? '');
function ordnerOptionen(p, gewaehlt, { ausser, mitOberste, obersteText } = {}) {
  const gesperrtIds = ausser ? new Set([ausser, ...ordnerNachfahren(p, ausser)]) : new Set();
  let h = mitOberste ? `<option value=""${!gewaehlt ? ' selected' : ''}>${esc(obersteText || T('Oberste Ebene'))}</option>` : '';
  for (const { o, tiefe } of ordnerBaum(p)) h += `<option value="${esc(o.id)}"${o.id === gewaehlt ? ' selected' : ''}${gesperrtIds.has(o.id) ? ' disabled' : ''}>${'  '.repeat(tiefe)}${esc(ordnerTitel(o))}</option>`;
  return h;
}
function dokOrtText(d) {
  const c = dokFinden(d.id); if (!c) return '';
  return ` · ${esc(T('Ordner: {0}', ordnerPfad(c.p, d.ordner).join(' › ')))}`;
}
function dokChips(d, c) {
  const ch = [];
  if (d.papierkorb) ch.push(['info', T('Im Papierkorb')]);
  if (d.fehltOriginal) ch.push(['no', T('Originaldatei fehlt auf diesem Gerät')]);
  else {
    const dur = durchsuchbar(d);
    if (dur === 'nein') ch.push(['info', d.textStatus === 'bild' ? T('Bild: Inhalt nicht durchsuchbar') : T('Inhalt nicht durchsuchbar')]);
    else if (dur === 'teil') ch.push(['offen', T('Nur teilweise durchsucht')]);
    else if (dur === 'offen' && d.gespeichert) ch.push(['info', T('Suchtext folgt …')]);
  }
  const oc = ocrChip(d); if (oc) ch.push(oc);
  if (c && eingangOrdner(c.p).id === d.ordner && !d.papierkorb) ch.push(['offen', T('Bitte zuordnen')]);
  return ch.map(([k, t]) => `<span class="tag ${k}">${esc(t)}</span>`).join(' ');
}
const aktionPaar = (act, id, text, extra = '') => `<button class="sec small" data-act="${act}" data-id="${esc(id)}"${extra}>${text}</button>`;

// ---------- Aufbau der Leiste ----------
function seitenleisteAufbauen() {
  const a = document.getElementById('ablage'); if (!a || a.dataset.aufgebaut) return;
  a.dataset.aufgebaut = '1';
  a.innerHTML = `
    <div class="ab-kopf"><h2 id="ab-titel"></h2><button class="icon-btn mini" data-act="ablageZu" id="ab-zu"></button></div>
    <section class="ab-block" id="ab-projekt" aria-label=""></section>
    <form class="ab-block ab-suche" role="search" onsubmit="return false">
      <label for="ab-suche" class="sr" id="ab-suche-l"></label>
      <div class="ab-sucheinput"><input type="search" id="ab-suche" autocomplete="off" spellcheck="false" oninput="sucheEingabe(this.value)" onkeydown="if(event.key==='Escape'){sucheLeeren()}"></div>
      <details class="mini ab-filter" id="ab-filter"><summary id="ab-filter-s"></summary>
        <label for="ab-f-ordner" id="ab-f-ordner-l"></label><select id="ab-f-ordner" onchange="filterSetzen('ordner',this.value)"></select>
        <label for="ab-f-gruppe" id="ab-f-gruppe-l"></label><select id="ab-f-gruppe" onchange="filterSetzen('gruppe',this.value)"></select>
        <label for="ab-f-sort" id="ab-f-sort-l"></label><select id="ab-f-sort" onchange="filterSetzen('sort',this.value)"></select>
      </details>
    </form>
    <div class="ab-block" id="ab-treffer" hidden></div>
    <div id="ab-inhalt">
      <div class="ab-block"><div class="dropzone ab-drop" id="ab-drop" role="button" tabindex="0" ondragenter="abDropOver(event)" ondragover="abDropOver(event)" ondragleave="dzLeave(event)" ondrop="abDropFiles(event)"
        onclick="document.getElementById('ab-datei').click()" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();document.getElementById('ab-datei').click()}">
        ${SVG.hoch}<b id="ab-drop-t"></b><span class="muted" id="ab-drop-s"></span>
        <input type="file" id="ab-datei" multiple accept="${DOC_ACCEPT}" hidden onclick="event.stopPropagation()" onchange="importStarten(this.files,{projektId:projektAktiv().id});this.value=''"></div>
        <button class="sec small ab-waehlen" id="ab-waehlen" data-act="dateienWaehlen"></button>
        <button class="small ab-foto" id="ab-foto" data-act="fotoErfassen"></button><p class="muted ab-kamerahinweis" id="ab-kamerahinweis" hidden></p></div>
      <div class="ab-block" id="ab-import" aria-live="polite"></div>
      <nav class="ab-block" id="ab-baum" aria-label=""></nav>
      <section class="ab-block" id="ab-dateien" aria-live="polite"></section>
      <p class="muted ab-fuss" id="ab-fuss"></p><p class="muted ab-speicher" id="ab-speicher" role="status"></p>
    </div>`;
}
let abFrame = 0;
function seitenleisteAktualisieren() {
  if (abFrame) return;
  abFrame = requestAnimationFrame(() => { abFrame = 0; seitenleisteZeichnen(); });
}
function seitenleisteLeeren() {
  const a = document.getElementById('ablage'); if (!a) return;
  a.hidden = true; a.innerHTML = ''; delete a.dataset.aufgebaut;
  document.getElementById('ablageDeck')?.setAttribute('hidden', '');
  ablageUI.ergebnis = null; ablageUI.suche = ''; ablageUI.ordner = 'alle'; ablageUI.versionen.clear(); ablageUI.filterSig = '';
}
function seitenleisteZeichnen() {
  const a = document.getElementById('ablage'), deck = document.getElementById('ablageDeck'), knopf = document.getElementById('ablageBtn');
  if (!a) return;
  const sichtbar = !gesperrt && ablageUI.offen && !startProblem;
  document.body.classList.toggle('mit-ablage', sichtbar);
  document.body.classList.toggle('ablage-schmal-offen', sichtbar && schmal());
  if (knopf) { knopf.setAttribute('aria-expanded', String(!!sichtbar)); knopf.classList.toggle('on', !!sichtbar); }
  if (deck) deck.hidden = !(sichtbar && schmal());
  if (gesperrt || !S?.projekte) { a.hidden = true; return; }
  a.hidden = !sichtbar;
  if (!sichtbar) return;
  seitenleisteAufbauen();
  const p = projektAktiv();
  if (ablageUI.ordner !== 'alle' && ablageUI.ordner !== 'papierkorb' && !ordnerSuchen(p, ablageUI.ordner)) ablageUI.ordner = 'alle';
  // Fokus über das Neuzeichnen hinweg halten
  const aktiv = document.activeElement, fid = aktiv && a.contains(aktiv) ? aktiv.dataset.fid : null;
  const set = (id, t) => { const el = document.getElementById(id); if (el) el.textContent = t; };
  set('ab-titel', T('Dateiablage'));
  const zu = document.getElementById('ab-zu'); zu.innerHTML = '‹'; zu.setAttribute('aria-label', T('Dateiablage einklappen')); zu.title = T('Dateiablage einklappen');
  a.setAttribute('aria-label', T('Dateiablage'));
  document.getElementById('ab-suche-l').textContent = T('Im Projekt suchen');
  const si = document.getElementById('ab-suche'); si.placeholder = T('Im Projekt suchen …');
  set('ab-filter-s', T('Filter und Sortierung'));
  set('ab-f-ordner-l', T('Ordner')); set('ab-f-gruppe-l', T('Dateityp')); set('ab-f-sort-l', T('Sortierung'));
  const sig = [sprache, p.id, p.ordner.map(o => o.id + o.name + o.eltern + o.pos).join()].join('|');
  if (sig !== ablageUI.filterSig) {
    ablageUI.filterSig = sig;
    document.getElementById('ab-f-ordner').innerHTML = ordnerOptionen(p, ablageUI.filter.ordner, { mitOberste: true, obersteText: T('Alle Ordner') });
    document.getElementById('ab-f-gruppe').innerHTML = `<option value="">${esc(T('Alle Dateitypen'))}</option>` + GRUPPEN.map(([g, n]) => `<option value="${g}"${ablageUI.filter.gruppe === g ? ' selected' : ''}>${esc(String(n))}</option>`).join('');
    document.getElementById('ab-f-sort').innerHTML = [['relevanz', T('Beste Treffer zuerst')], ['name', T('Name (A–Z)')], ['neu', T('Zuletzt abgelegt zuerst')]].map(([w, l]) => `<option value="${w}"${ablageUI.filter.sort === w ? ' selected' : ''}>${esc(l)}</option>`).join('');
  }
  set('ab-drop-t', T('Dateien hierher ziehen'));
  set('ab-drop-s', T('PDF, Fotos, Word, Excel, Text · bis 25 MB je Datei'));
  const w = document.getElementById('ab-waehlen'); w.textContent = T('Dateien auswählen …'); w.dataset.fid = 'ab-waehlen';
  const kf = document.getElementById('ab-foto'); kf.textContent = T('Dokument fotografieren'); kf.dataset.fid = 'ab-foto';
  const kh = document.getElementById('ab-kamerahinweis'); kh.hidden = kameraGeraet(); kh.textContent = T('Auf diesem Gerät öffnet «Dokument fotografieren» die normale Dateiauswahl. Wählen Sie dort ein vorhandenes Foto.');
  document.getElementById('ab-drop').setAttribute('aria-label', T('Dateien ablegen oder auswählen'));
  document.getElementById('ab-projekt').setAttribute('aria-label', T('Aktives Projekt'));
  document.getElementById('ab-baum').setAttribute('aria-label', T('Ordner'));
  document.getElementById('ab-projekt').innerHTML = abProjektHtml(p);
  document.getElementById('ab-import').innerHTML = abImportHtml(p);
  document.getElementById('ab-baum').innerHTML = abBaumHtml(p);
  document.getElementById('ab-dateien').innerHTML = abDateienHtml(p);
  set('ab-fuss', T('Die Ablage liegt nur auf diesem Gerät im Browser, nicht in einer Cloud. Erstellen Sie regelmässig eine Sicherung (Einstellungen › Sicherung), sonst gehen die Dateien beim Löschen der Browserdaten verloren.'));
  abTrefferZeichnen(p); abSpeicherZeigen();
  const imInhalt = !ablageUI.suche.trim();
  document.getElementById('ab-inhalt').hidden = !imInhalt;
  document.getElementById('ab-treffer').hidden = imInhalt;
  vorschauenLaden();
  if (fid) { const z = a.querySelector(`[data-fid="${CSS.escape(fid)}"]`); if (z && z !== document.activeElement) z.focus({ preventScroll: true }); }
}

// ---------- Speicherstand ----------
let speicherLetzte = 0;
async function abSpeicherZeigen() {
  if (Date.now() - speicherLetzte < 15000) return;
  speicherLetzte = Date.now();
  const b = await speicherBelegung(), el = document.getElementById('ab-speicher'); if (!el || !b) return;
  const quota = b.frei != null ? b.belegt + b.frei : null, voll = quota && b.belegt / quota > 0.8;
  el.innerHTML = esc(quota ? T('Belegter Speicher: {0} von etwa {1}.', mb(b.belegt), mb(quota)) : T('Belegter Speicher: {0}.', mb(b.belegt)))
    + (voll ? ` <span class="tag offen">${esc(T('Speicher fast voll'))}</span> ${esc(T('Erstellen Sie eine Sicherung und entfernen Sie nicht mehr benötigte Dateien.'))}` : '');
}

// ---------- Projekt ----------
function abProjektHtml(p) {
  const nF = flaechenVon(p).length, nD = projektDoks(p).filter(({ d }) => !d.papierkorb && !d.frueher).length;
  return `<span class="eyebrow">${T('Aktives Projekt')}</span>
    <div class="ab-projektzeile"><label for="ab-projekt-wahl" class="sr">${T('Projekt wechseln')}</label>
      <select id="ab-projekt-wahl" data-fid="ab-projekt-wahl" onchange="projektWechseln(this.value)">${S.projekte.map(x => `<option value="${esc(x.id)}"${x.id === p.id ? ' selected' : ''}>${esc(projektTitel(x))}</option>`).join('')}</select>
      <button class="sec small" data-act="projektDialog" data-fid="ab-projekte" aria-label="${T('Projekte verwalten')}" title="${T('Projekte verwalten')}">${SVG.mehr}</button></div>
    <p class="muted ab-projektinfo">${T('{0} Fläche(n) · {1} Datei(en)', nF, nD)}</p>`;
}
function projektWechseln(id) {
  if (!S.projekte.some(p => p.id === id) || id === S.aktivesProjekt) return;
  S.aktivesProjekt = id;
  ablageUI.ordner = 'alle'; ablageUI.filter.ordner = ''; ablageUI.filterSig = ''; ablageUI.ergebnis = null;
  if (view.id && F()?.projektId !== id) view = { tab: 'flaechen', id: null, schritt: 1 };
  save(); render();
  ansagen(T('Projekt «{0}» ist jetzt aktiv.', projektTitel(projektAktiv())));
  if (ablageUI.suche.trim()) sucheStarten();
}
function projektDialog() {
  const zeilen = S.projekte.map(p => {
    const nF = flaechenVon(p).length, nD = projektDoks(p).length, aktiv = p.id === S.aktivesProjekt;
    return `<li class="ab-pzeile"><div><b>${esc(projektTitel(p))}</b>${aktiv ? ` <span class="tag ok">${T('aktiv')}</span>` : ''}<br><span class="muted">${T('{0} Fläche(n) · {1} Datei(en)', nF, nD)}</span></div>
      <div class="row">${aktiv ? '' : aktionPaar('projektAktiv', p.id, T('Aktiv setzen'))}${aktionPaar('projektUmbenennen', p.id, T('Umbenennen …'))}${S.projekte.length > 1 ? `<button class="danger small" data-act="projektLoeschenDialog" data-id="${esc(p.id)}">${T('Löschen …')}</button>` : ''}</div></li>`;
  }).join('');
  dialogZeigen(T('Projekte'), `<p class="muted">${T('Ein Projekt umfasst mehrere Untersuchungsflächen und gemeinsame Projektunterlagen. Jedes Projekt hat eigene Ordner.')}</p><ul class="ab-pliste">${zeilen}</ul>
    <div class="row"><button data-act="projektNeu">${T('Neues Projekt …')}</button></div>`);
}
function projektNeuDialog() {
  formDialog({
    titel: T('Neues Projekt'), intro: `<p>${T('Das neue Projekt erhält die Standardordner Eingang / Zuordnen, Pläne, Dokumentation, Prüfberichte, Fotos und Korrespondenz.')}</p>`,
    felder: [{ id: 'name', art: 'text', label: T('Name des Projekts'), max: 200 }], knopf: T('Projekt anlegen'),
    handler: async (w, fehler) => {
      const n = w.name.trim();
      if (!n) return fehler(T('Bitte einen Namen eingeben.'));
      if (!projektNameFrei(n)) return fehler(T('Es gibt bereits ein Projekt mit diesem Namen.'));
      const p = projektNeu(n); S.projekte.push(p); S.aktivesProjekt = p.id;
      ablageUI.ordner = 'alle'; ablageUI.filterSig = ''; view = { tab: 'flaechen', id: null, schritt: 1 };
      if (!(await speichernOk())) { S.projekte.pop(); S.aktivesProjekt = projektAktiv().id; return fehler(T('Nicht gespeichert: {0}', speicherFehler || '')); }
      document.getElementById('dlg').close(); render(); ansagen(T('Projekt «{0}» angelegt.', n));
    }
  });
}
function projektUmbenennenDialog(id) {
  const p = S.projekte.find(x => x.id === id); if (!p) return;
  formDialog({
    titel: T('Projekt umbenennen'), felder: [{ id: 'name', art: 'text', label: T('Name des Projekts'), wert: projektTitel(p), max: 200 }], knopf: T('Speichern'),
    handler: async (w, fehler) => {
      const n = w.name.trim();
      if (!n) return fehler(T('Bitte einen Namen eingeben.'));
      if (!projektNameFrei(n, id)) return fehler(T('Es gibt bereits ein Projekt mit diesem Namen.'));
      const alt = [p.name, p.std]; p.name = n; p.std = null;
      if (!(await speichernOk())) { [p.name, p.std] = alt; return fehler(T('Nicht gespeichert: {0}', speicherFehler || '')); }
      document.getElementById('dlg').close(); render(); ansagen(T('Projekt umbenannt.'));
    }
  });
}
function projektLoeschenDialog(id) {
  const p = S.projekte.find(x => x.id === id); if (!p || S.projekte.length < 2) return;
  const nF = flaechenVon(p).length, nD = projektDoks(p).length;
  dialogZeigen(T('Projekt löschen?'), `<div class="warn"><b>${T('«{0}» wird mit allem Inhalt endgültig gelöscht.', esc(projektTitel(p)))}</b><br>${T('{0} Fläche(n) mit allen Angaben und {1} Datei(en) (auch im Papierkorb) gehen verloren. Das lässt sich nicht rückgängig machen. Erstellen Sie vorher eine Sicherung.', nF, nD)}</div>
    <div class="row"><button class="danger" data-act="projektLoeschen" data-id="${esc(p.id)}">${T('Endgültig löschen')}</button><button class="sec" onclick="projektDialog()">${T('Abbrechen')}</button></div>`);
}
async function projektLoeschen(id) {
  const p = S.projekte.find(x => x.id === id); if (!p || S.projekte.length < 2) return;
  const vorher = JSON.stringify(S), docs = projektDoks(p).map(x => x.d.id);
  S.flaechen = S.flaechen.filter(f => f.projektId !== id);
  S.projekte = S.projekte.filter(x => x.id !== id);
  if (S.aktivesProjekt === id) S.aktivesProjekt = S.projekte[0].id;
  view = { tab: 'flaechen', id: null, schritt: 1 }; ablageUI.ordner = 'alle'; ablageUI.filterSig = ''; ablageUI.ergebnis = null;
  if (!(await speichernOk())) { S = JSON.parse(vorher); document.getElementById('dlg').close(); render(); return ansagen(T('Nicht gelöscht: Der Stand konnte nicht gespeichert werden.')); }
  for (const d of docs) { await dateiLoeschen(d); await textLoeschen(d); vorschauFreigeben(d); }
  document.getElementById('dlg').close(); render(); ansagen(T('Projekt gelöscht.'));
}
// Speichert und wartet bei aktivem Schutz auf das Ergebnis des Hintergrundschreibens.
async function speichernOk() { if (schutz?.key) { save(); return speichernWarten(); } return save(); }

// ---------- Import-Anzeige ----------
const STATUS_TAG = { wartet: ['info', _('wartet')], arbeitet: ['info', _('in Arbeit')], ok: ['ok', _('abgelegt')], warn: ['offen', _('Hinweis')], fehler: ['no', _('nicht übernommen')], doppelt: ['info', _('schon vorhanden')], uebersprungen: ['info', _('übersprungen')], frage: ['offen', _('Entscheidung nötig')] };
function abImportHtml(p) {
  if (!importListe.length) return '';
  const aktiveProjekte = [...new Set(importListe.map(e => e.projektId))];
  const sichtbar = importListe.slice(-5).reverse(), versteckt = importListe.length - sichtbar.length;
  const zeilen = sichtbar.map(e => {
    const [k, t] = STATUS_TAG[e.status] || ['info', e.status];
    const anderes = e.projektId !== p.id ? ` <span class="tag info">${esc(T('Projekt: {0}', e.projektName))}</span>` : '';
    let akt = '';
    if (e.status === 'frage') akt = aktionPaar('konfliktDialog', e.id, T('Entscheiden …'));
    else if (e.status === 'doppelt' && e.file) akt = aktionPaar('importBehalten', e.id, T('Trotzdem ablegen'));
    else if ((e.status === 'ok' || e.status === 'warn') && e.docId) akt = aktionPaar('dokVerwalten', e.docId, e.auto ? T('Ordner korrigieren …') : T('Verwalten …'), ` data-fid="imp-${esc(e.id)}"`);
    else if (e.status === 'fehler' && e.speicherProblem) akt = `<button class="sec small" data-act="sicherungDialog">${T('Sicherung erstellen …')}</button>`;
    return `<li class="ab-imp"><span class="tag ${k}">${esc(String(t))}</span> <b class="ab-impname">${esc(e.name)}</b>${anderes}<br><span class="muted">${esc(e.meldung)}</span>${akt ? `<div class="row">${akt}</div>` : ''}</li>`;
  }).join('');
  const laufend = importListe.filter(e => e.status === 'wartet' || e.status === 'arbeitet').length;
  const nr = importListe.filter(e => e.status === 'ok' || e.status === 'warn').length;
  return `<div class="ab-impkopf"><b>${laufend ? T('Import läuft: {0} offen', laufend) : T('Import')}</b>${aktiveProjekte.length === 1 && aktiveProjekte[0] === p.id ? '' : ''}
    <button class="link" data-act="importLeeren" data-fid="imp-leeren">${T('Liste schliessen')}</button></div><ul class="ab-impliste">${zeilen}</ul>${versteckt > 0 ? `<p class="muted">${T('{0} ältere Einträge ausgeblendet.', versteckt)}</p>` : ''}${laufend ? '' : `<p class="muted">${T('{0} von {1} Datei(en) abgelegt.', nr, importListe.length)}</p>`}`;
}
function importAnzeigeAktualisieren() {
  // Fläche: Anzeige im Ablagebereich der Fläche
  const lauf = importListe.filter(e => e.status === 'wartet' || e.status === 'arbeitet');
  const t = lauf.length ? T('Verarbeite {0} Datei(en) …', lauf.length) : '';
  document.querySelectorAll('.dz-status').forEach(s => { if (t || !s.dataset.ende) s.textContent = t; });
}

// ---------- Ordnerbaum ----------
function abBaumHtml(p) {
  const sel = ablageUI.ordner;
  const lebend = projektDoks(p).filter(({ d }) => !d.papierkorb && !d.frueher);
  const papier = projektDoks(p).filter(({ d }) => d.papierkorb).length;
  const zeile = (id, icon, name, n, tiefe, menu, drop) => `<li class="ab-zeile${sel === id ? ' aktiv' : ''}" style="--tiefe:${tiefe}"${drop}>
      <button class="ab-ordner" data-act="ordnerWaehlen" data-id="${esc(id)}" data-fid="ord-${esc(id)}"${sel === id ? ' aria-current="true"' : ''}>${icon}<span class="ab-name">${esc(name)}</span><span class="ab-zahl" aria-label="${esc(T('{0} Datei(en)', n))}">${n}</span></button>${menu}</li>`;
  let h = `<ul class="ab-baum">`;
  h += zeile('alle', SVG.alle, T('Alle Dateien'), lebend.length, 0, '', '');
  for (const { o, tiefe } of ordnerBaum(p)) {
    const n = lebend.filter(({ d }) => d.ordner === o.id).length;
    const menu = `<button class="icon-btn mini" data-act="ordnerDialog" data-id="${esc(o.id)}" data-fid="menu-${esc(o.id)}" aria-label="${esc(T('Ordner «{0}» verwalten', ordnerTitel(o)))}" title="${esc(T('Ordner verwalten'))}">${SVG.mehr}</button>`;
    h += zeile(o.id, o.typ === 'eingang' ? SVG.eingang : SVG.ordner, ordnerTitel(o), n, tiefe, menu, ` ondragover="abOrdnerOver(event)" ondragleave="dzLeave(event)" ondrop="abOrdnerDrop(event,'${esc(o.id)}')"`);
  }
  h += zeile('papierkorb', SVG.papierkorb, T('Papierkorb'), papier, 0, '', ` ondragover="abOrdnerOver(event)" ondragleave="dzLeave(event)" ondrop="abOrdnerDrop(event,'papierkorb')"`);
  return h + `</ul><button class="sec small" data-act="ordnerNeu" data-fid="ab-ordner-neu">${T('Neuer Ordner …')}</button>`;
}
function ordnerWaehlen(id) { ablageUI.ordner = id; seitenleisteZeichnen(); }

// ---------- Dateiliste ----------
function dokZeile(d, c, opt = {}) {
  const art = dateiGruppe(d);
  const meta = [gruppeName(art), d.groesse ? mb(d.groesse) : '', datumKurz(d), c.flaeche ? T('Fläche: {0}', c.flaeche.name) : ''].filter(Boolean).join(' · ');
  const frueher = alleDoks().filter(x => x.ersetztDurch === d.id);
  const vorschau = art === 'bild' && d.gespeichert && !d.papierkorb ? `<img class="ab-thumb" data-doc="${esc(d.id)}" alt="">` : `<span class="ab-typ" aria-hidden="true">${esc((endung(d.name) || '·').toUpperCase().slice(0, 4))}</span>`;
  let h = `<li class="ab-datei" draggable="true" ondragstart="abDokZiehen(event,'${esc(d.id)}')" data-doc="${esc(d.id)}"><div class="ab-kopf-zeile">${vorschau}<div class="ab-text">
    <button class="ab-dname" data-act="dokOeffnen" data-id="${esc(d.id)}" data-fid="doc-${esc(d.id)}" ${d.gespeichert ? '' : 'disabled'}>${esc(d.name)}</button>
    <div class="muted ab-meta">${esc(meta)}</div></div></div>${dokChips(d, c) ? `<div class="ab-chips">${dokChips(d, c)}</div>` : ''}`;
  if (opt.papierkorb) h += `<div class="row">${aktionPaar('dokZurueck', d.id, T('Wiederherstellen'))}<button class="danger small" data-act="dokLoeschenDialog" data-id="${esc(d.id)}">${T('Endgültig löschen …')}</button></div>`;
  else h += `<div class="row">${aktionPaar('dokVerwalten', d.id, T('Verwalten …'))}<button class="danger small" data-act="dokEntfernen" data-id="${esc(d.id)}" aria-label="${esc(T('{0} in den Papierkorb legen', d.name))}">${T('Entfernen')}</button></div>`;
  if (!opt.papierkorb && frueher.length) h += `<details class="mini" data-vers="${esc(d.id)}"><summary>${T('Frühere Versionen ({0})', frueher.length)}</summary>${frueher.map(x => `<div class="ab-frueher"><span>${esc(x.name)}</span> <span class="muted">${esc(datumKurz(x))}</span><div class="row">${x.gespeichert ? `<button class="sec small" data-act="dokOeffnen" data-id="${esc(x.id)}">${T('Öffnen')}</button><button class="sec small" data-act="dokHerunterladen" data-id="${esc(x.id)}">${T('Herunterladen')}</button>` : ''}<button class="danger small" data-act="dokLoeschenDialog" data-id="${esc(x.id)}">${T('Löschen …')}</button></div></div>`).join('')}</details>`;
  return h + '</li>';
}
function abDateienHtml(p) {
  const sel = ablageUI.ordner;
  const alle = projektDoks(p);
  let liste, titel;
  if (sel === 'papierkorb') { liste = alle.filter(({ d }) => d.papierkorb); titel = T('Papierkorb'); }
  else {
    const lebend = alle.filter(({ d }) => !d.papierkorb && !d.frueher);
    if (sel === 'alle') { liste = lebend; titel = T('Alle Dateien'); }
    else { liste = lebend.filter(({ d }) => d.ordner === sel); titel = ordnerPfad(p, sel).join(' › '); }
  }
  liste = [...liste].sort((a, b) => String(b.d.abgelegt || '').localeCompare(String(a.d.abgelegt || '')) || a.d.name.localeCompare(b.d.name, lokale()));
  let h = `<h3 class="ab-liste-t">${esc(titel)} <span class="muted">(${liste.length})</span></h3>`;
  if (sel === 'papierkorb') h += `<p class="muted">${T('Gelöschte Dateien bleiben hier, bis Sie sie endgültig löschen. Sie zählen nicht als Quellen und erscheinen nicht in der Suche.')}</p>`;
  if (!liste.length) return h + `<p class="muted">${sel === 'papierkorb' ? T('Der Papierkorb ist leer.') : T('Noch keine Dateien in dieser Ansicht. Ziehen Sie Dateien in die Fläche oben.')}</p>`;
  return h + `<ul class="ab-dateiliste">${liste.map(({ d, flaeche }) => dokZeile(d, { p, flaeche }, { papierkorb: sel === 'papierkorb' })).join('')}</ul>`;
}

// ---------- Ziehen und Ablegen ----------
const hatDateien = e => [...(e.dataTransfer?.types || [])].includes('Files');
const hatDok = e => [...(e.dataTransfer?.types || [])].includes('text/lf-doc');
function abDropOver(e) { if (!hatDateien(e)) return; e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; e.currentTarget.classList.add('drag'); }
function abDropFiles(e) {
  e.preventDefault(); e.stopPropagation(); e.currentTarget.classList.remove('drag');
  if (hatDateien(e)) importStarten(e.dataTransfer.files, { projektId: projektAktiv().id });
}
function abOrdnerOver(e) { if (!hatDateien(e) && !hatDok(e)) return; e.preventDefault(); e.dataTransfer.dropEffect = hatDok(e) ? 'move' : 'copy'; e.currentTarget.classList.add('drag'); }
function abOrdnerDrop(e, id) {
  e.preventDefault(); e.stopPropagation(); e.currentTarget.classList.remove('drag');
  const p = projektAktiv();
  if (hatDok(e)) {
    const doc = e.dataTransfer.getData('text/lf-doc'), c = dokFinden(doc);
    if (!c || c.p.id !== p.id) return;
    if (id === 'papierkorb') { dokInPapierkorb(doc); save(); render(); return ansagen(T('«{0}» liegt jetzt im Papierkorb.', c.d.name)); }
    const r = dokOrdnerSetzen(doc, id); if (r.fehler) return ansagen(r.fehler);
    save(); seitenleisteZeichnen(); ansagen(T('«{0}» wurde nach «{1}» verschoben.', c.d.name, ordnerPfad(p, id).join(' › ')));
  } else if (hatDateien(e) && id !== 'papierkorb') importStarten(e.dataTransfer.files, { projektId: p.id, ordnerId: id });
}
function abDokZiehen(e, id) { e.dataTransfer.setData('text/lf-doc', id); e.dataTransfer.setData('text/plain', id); e.dataTransfer.effectAllowed = 'move'; }

// ---------- Ordner verwalten ----------
function ordnerNeuDialog(eltern) {
  const p = projektAktiv();
  formDialog({
    titel: T('Neuer Ordner'),
    felder: [{ id: 'name', art: 'text', label: T('Name des Ordners'), max: NAME_MAX }, { id: 'eltern', art: 'select', label: T('Anlegen in'), optionen: [['', T('Oberste Ebene'), !eltern], ...ordnerBaum(p).map(({ o, tiefe }) => [o.id, '  '.repeat(tiefe) + esc(ordnerTitel(o)), o.id === eltern])] }],
    knopf: T('Ordner anlegen'),
    handler: async (w, fehler) => {
      const r = ordnerAnlegen(p, w.name, w.eltern || null);
      if (r.fehler) return fehler(r.fehler);
      if (!(await speichernOk())) { p.ordner.splice(p.ordner.indexOf(r.ordner), 1); return fehler(T('Nicht gespeichert: {0}', speicherFehler || '')); }
      ablageUI.ordner = r.ordner.id; ablageUI.filterSig = '';
      document.getElementById('dlg').close(); seitenleisteZeichnen(); ansagen(T('Ordner «{0}» angelegt.', r.ordner.name));
    }
  });
}
function ordnerDialog(id) {
  const p = projektAktiv(), o = ordnerSuchen(p, id); if (!o) return;
  const fest = o.typ === 'eingang', n = ordnerAnzahl(p, id, false);
  const gesch = ordnerGeschwister(p, o.eltern), i = gesch.findIndex(x => x.id === id);
  dialogZeigen(T('Ordner «{0}»', ordnerTitel(o)), `
    <p class="muted">${esc(ordnerPfad(p, id).join(' › '))} · ${T('{0} Datei(en)', n)}${o.typ ? ' · ' + T('Standardordner') : ''}</p>
    ${fest ? `<p class="hint">${T('Der Eingang ist ein fester Bereich für alles, was nicht eindeutig zugeordnet werden konnte. Er lässt sich weder umbenennen noch entfernen.')}</p>` : ''}
    <div class="row">
      ${fest ? '' : aktionPaar('ordnerUmbenennen', id, T('Umbenennen …'))}
      ${aktionPaar('ordnerNeu', id, T('Unterordner anlegen …'))}
      ${aktionPaar('ordnerDateien', id, T('Dateien in diesen Ordner laden …'))}
    </div>
    ${fest ? '' : `<div class="row" style="margin-top:8px">
      <button class="sec small" data-act="ordnerHoch" data-id="${esc(id)}"${i <= 0 ? ' disabled' : ''}>${T('Nach oben')}</button>
      <button class="sec small" data-act="ordnerRunter" data-id="${esc(id)}"${i >= gesch.length - 1 ? ' disabled' : ''}>${T('Nach unten')}</button>
      ${aktionPaar('ordnerVerschieben', id, T('Verschieben nach …'))}
      <button class="danger small" data-act="ordnerEntfernenDialog" data-id="${esc(id)}">${T('Ordner entfernen …')}</button></div>`}`);
}
function ordnerUmbenennenDialog(id) {
  const p = projektAktiv(), o = ordnerSuchen(p, id); if (!o || o.typ === 'eingang') return;
  formDialog({
    titel: T('Ordner umbenennen'), intro: o.typ ? `<p class="muted">${T('Die Funktion des Standardordners bleibt erhalten, auch mit einem anderen Namen. Ein leeres Feld stellt den Standardnamen wieder her.')}</p>` : '',
    felder: [{ id: 'name', art: 'text', label: T('Neuer Name'), wert: ordnerTitel(o), max: NAME_MAX }], knopf: T('Speichern'),
    handler: async (w, fehler) => {
      const alt = o.name, r = ordnerUmbenennen(p, id, w.name);
      if (r.fehler) return fehler(r.fehler);
      if (!(await speichernOk())) { o.name = alt; return fehler(T('Nicht gespeichert: {0}', speicherFehler || '')); }
      ablageUI.filterSig = ''; document.getElementById('dlg').close(); render(); ansagen(T('Ordner umbenannt.'));
    }
  });
}
function ordnerVerschiebenDialog(id) {
  const p = projektAktiv(), o = ordnerSuchen(p, id); if (!o) return;
  formDialog({
    titel: T('Ordner «{0}» verschieben', ordnerTitel(o)),
    felder: [{ id: 'ziel', art: 'select', label: T('Neuer übergeordneter Ordner'), optionen: [['', T('Oberste Ebene'), !o.eltern], ...ordnerBaum(p).map(({ o: k, tiefe }) => [k.id, '  '.repeat(tiefe) + esc(ordnerTitel(k)), k.id === o.eltern])] }],
    knopf: T('Verschieben'),
    handler: async (w, fehler) => {
      const vorher = JSON.stringify(p.ordner), r = ordnerVerschieben(p, id, w.ziel || null);
      if (r.fehler) return fehler(r.fehler);
      if (!(await speichernOk())) { p.ordner = JSON.parse(vorher); return fehler(T('Nicht gespeichert: {0}', speicherFehler || '')); }
      ablageUI.filterSig = ''; document.getElementById('dlg').close(); seitenleisteZeichnen(); ansagen(T('Ordner verschoben.'));
    }
  });
}
async function ordnerReihenfolgeAendern(id, richtung) {
  const p = projektAktiv(), vorher = JSON.stringify(p.ordner), r = ordnerReihenfolge(p, id, richtung);
  if (r.fehler) return ansagen(r.fehler);
  if (!(await speichernOk())) { p.ordner = JSON.parse(vorher); return ansagen(T('Nicht gespeichert: {0}', speicherFehler || '')); }
  ablageUI.filterSig = ''; seitenleisteZeichnen(); ordnerDialog(id); ansagen(T('Reihenfolge geändert.'));
}
function ordnerEntfernenDialog(id) {
  const p = projektAktiv(), o = ordnerSuchen(p, id); if (!o || o.typ === 'eingang') return;
  const n = projektDoks(p).filter(({ d }) => d.ordner === id && !d.papierkorb).length, unter = p.ordner.filter(k => k.eltern === id).length;
  const ziele = ordnerBaum(p).filter(({ o: k }) => k.id !== id).map(({ o: k, tiefe }) => `<option value="${esc(k.id)}"${k.typ === 'eingang' ? ' selected' : ''}>${'  '.repeat(tiefe)}${esc(ordnerTitel(k))}</option>`).join('');
  dialogZeigen(T('Ordner «{0}» entfernen?', ordnerTitel(o)), `<form onsubmit="ordnerEntfernenSenden(event,'${esc(id)}');return false">
    ${unter ? `<p class="hint">${T('{0} Unterordner rücken eine Ebene nach oben. Ihr Inhalt bleibt erhalten.', unter)}</p>` : ''}
    ${n ? `<p><b>${T('Der Ordner enthält {0} Datei(en). Es geht nichts verloren. Was soll damit geschehen?', n)}</b></p>
      <label class="inline"><input type="radio" name="wahl" value="verschieben" checked> <span>${T('In einen anderen Ordner verschieben:')}</span></label>
      <select id="ent-ziel" aria-label="${T('Zielordner')}">${ziele}</select>
      <label class="inline"><input type="radio" name="wahl" value="papierkorb"> <span>${T('In den Papierkorb legen (wiederherstellbar)')}</span></label>` : `<p>${T('Der Ordner ist leer.')}</p>`}
    <p class="feldfehler" id="ent-fehler" role="alert"></p>
    <div class="row"><button type="submit" class="danger">${T('Ordner entfernen')}</button><button type="button" class="sec" onclick="dlg.close()">${T('Abbrechen')}</button></div></form>`);
}
async function ordnerEntfernenSenden(e, id) {
  e.preventDefault();
  const p = projektAktiv(), vorher = JSON.stringify(S), wahl = e.target.querySelector('input[name=wahl]:checked')?.value;
  const r = ordnerEntfernen(p, id, wahl === 'papierkorb' ? { art: 'papierkorb' } : { art: 'verschieben', ziel: document.getElementById('ent-ziel')?.value });
  if (r.fehler) { document.getElementById('ent-fehler').textContent = r.fehler; return; }
  if (!(await speichernOk())) { S = JSON.parse(vorher); document.getElementById('ent-fehler').textContent = T('Nicht gespeichert: {0}', speicherFehler || ''); return; }
  if (ablageUI.ordner === id) ablageUI.ordner = 'alle';
  ablageUI.filterSig = ''; document.getElementById('dlg').close(); render(); ansagen(T('Ordner entfernt.'));
}
function ordnerDateienWaehlen(id) {
  const inp = Object.assign(document.createElement('input'), { type: 'file', multiple: true, accept: DOC_ACCEPT });
  const pid = projektAktiv().id;
  inp.onchange = () => { if (inp.files.length) { document.getElementById('dlg').close(); importStarten(inp.files, { projektId: pid, ordnerId: id }); } };
  inp.click();
}

// ---------- Datei verwalten ----------
function dokDialog(id) {
  const c = dokFinden(id); if (!c) return;
  const { d, p } = c, flaechen = flaechenVon(p);
  formDialog({
    titel: d.name,
    intro: `<p class="muted">${esc([gruppeName(dateiGruppe(d)), d.groesse ? mb(d.groesse) : '', datumKurz(d)].filter(Boolean).join(' · '))}</p>
      ${d.ablage?.art === 'auto' ? `<p class="hint">${T('Diese Datei wurde automatisch abgelegt. Das ist ein Vorschlag zur Ordnung, keine fachliche Bestätigung. Sie können den Ordner hier ändern.')}</p>` : ''}
      ${dokHinweis(d) ? `<p class="muted">${esc(dokHinweis(d))}</p>` : ''}`,
    felder: [
      { id: 'ordner', art: 'select', label: T('Ordner'), optionen: ordnerBaum(p).map(({ o, tiefe }) => [o.id, '  '.repeat(tiefe) + esc(ordnerTitel(o)), o.id === d.ordner]) },
      { id: 'flaeche', art: 'select', label: T('Fläche (Quelle für deren Prüfpunkte)'), optionen: [['', T('Keine – gemeinsame Projektunterlage'), !c.flaeche], ...flaechen.map(f => [f.id, esc(f.name), c.flaeche?.id === f.id])] },
      { id: 'notiz', art: 'area', label: T('Notiz (wird mit durchsucht)'), wert: d.notiz || '' },
      { id: 'tags', art: 'text', label: T('Schlagwörter, durch Komma getrennt'), wert: d.tags || '', max: 300 }
    ],
    extra: `<p class="muted">${T('Ein anderer Ordner ändert nichts an den Prüfpunkten. Eine andere Fläche ändert die Quellen: Angaben aus der Datei werden dann bei der bisherigen Fläche zur erneuten Prüfung markiert und bei der neuen Fläche als Vorschlag übernommen.')}</p>
      <div class="row">${d.gespeichert ? `<button type="button" class="sec small" data-act="dokOeffnen" data-id="${esc(d.id)}">${T('Öffnen')}</button><button type="button" class="sec small" data-act="dokHerunterladen" data-id="${esc(d.id)}">${T('Herunterladen')}</button>` : ''}
      ${bildGruppe(d) && d.gespeichert ? `<button type="button" class="sec small" data-act="ocrStarten" data-id="${esc(d.id)}" onclick="dlg.close()">${T('Texterkennung (erneut) starten')}</button>` : ''}
      <button type="button" class="danger small" data-act="dokEntfernen" data-id="${esc(d.id)}" onclick="dlg.close()">${T('In den Papierkorb')}</button></div>`,
    knopf: T('Speichern'),
    handler: async (w, fehler) => {
      const vorher = JSON.stringify(S);
      const r1 = dokOrdnerSetzen(id, w.ordner);
      if (r1.fehler) return fehler(r1.fehler);
      const cc = dokFinden(id);
      cc.d.notiz = String(w.notiz || '').slice(0, 4000); cc.d.tags = String(w.tags || '').slice(0, 300);
      const r2 = dokZuordnen(id, w.flaeche || null);
      if (r2.fehler) { S = JSON.parse(vorher); return fehler(r2.fehler); }
      if (!(await speichernOk())) { S = JSON.parse(vorher); return fehler(T('Nicht gespeichert: {0}', speicherFehler || '')); }
      document.getElementById('dlg').close(); render(); ansagen(T('Gespeichert.'));
    }
  });
}
function dokLoeschenDialog(id) {
  const c = dokFinden(id); if (!c) return;
  const v = verknuepfungen(id);
  dialogZeigen(T('Endgültig löschen?'), `<div class="warn"><b>${T('«{0}» wird endgültig gelöscht.', esc(c.d.name))}</b><br>${T('Die Datei und ihr Suchtext werden vom Gerät entfernt. Das lässt sich nicht rückgängig machen.')}</div>
    ${v.length ? `<p><b>${T('Diese Verknüpfungen sind betroffen:')}</b></p><ul>${v.slice(0, 12).map(x => `<li>${esc(x.flaeche)}: ${esc(String(x.text))}</li>`).join('')}</ul>${v.length > 12 ? `<p class="muted">${T('… und {0} weitere.', v.length - 12)}</p>` : ''}<p class="muted">${T('Die Prüfpunkte bleiben als «erneut zu prüfen» markiert.')}</p>` : `<p class="muted">${T('Es bestehen keine Verknüpfungen zu Prüfpunkten.')}</p>`}
    <div class="row"><button class="danger" data-act="dokLoeschen" data-id="${esc(id)}">${T('Endgültig löschen')}</button><button class="sec" onclick="dlg.close()">${T('Abbrechen')}</button></div>`);
}
async function dokEndgueltig(id) {
  const vorher = JSON.stringify(S);
  const c = dokFinden(id); if (!c) return;
  await dokEndgueltigLoeschen(id);
  if (!(await speichernOk())) { S = JSON.parse(vorher); document.getElementById('dlg').close(); render(); return ansagen(T('Nicht gelöscht: Der Stand konnte nicht gespeichert werden.')); }
  document.getElementById('dlg').close(); render(); ansagen(T('Datei endgültig gelöscht.'));
}
async function dokZurueckholen(id) {
  const vorher = JSON.stringify(S);
  if (!dokWiederherstellen(id)) return;
  if (!(await speichernOk())) { S = JSON.parse(vorher); return ansagen(T('Nicht wiederhergestellt: Der Stand konnte nicht gespeichert werden.')); }
  render(); ansagen(T('Datei wiederhergestellt. Zugehörige Prüfpunkte bleiben zur erneuten Prüfung markiert.'));
}

// ---------- Konflikt beim Import ----------
function konfliktDialog(eintragId) {
  const e = importListe.find(x => x.id === eintragId && x.status === 'frage'); if (!e) return;
  const p = S.projekte.find(x => x.id === e.projektId), c = dokFinden(e.konflikt);
  const alt = c ? `${esc(c.d.name)} – ${esc([c.d.groesse ? mb(c.d.groesse) : '', datumKurz(c.d)].filter(Boolean).join(', '))}, ${esc(T('Ordner: {0}', ordnerPfad(c.p, c.d.ordner).join(' › ')))}${c.flaeche ? ', ' + esc(T('Fläche: {0}', c.flaeche.name)) : ''}` : '';
  const offen = importListe.filter(x => x.status === 'frage').length;
  dialogZeigen(T('Datei mit gleichem Namen'), `<p>${T('Im Projekt «{0}» gibt es schon «{1}», aber mit anderem Inhalt. Es wird nichts überschrieben.', esc(p ? projektTitel(p) : e.projektName), esc(e.name))}</p>
    <div class="hint"><b>${T('Bereits vorhanden')}</b><br>${alt}<br><b>${T('Neu')}</b><br>${esc(e.name)} – ${esc(mb(e.groesse))}</div>
    <div class="ab-wahl">
      <button data-act="importVersion" data-id="${esc(e.id)}">${T('Als neue Version übernehmen')}</button><p class="muted">${T('Die neue Datei ersetzt die alte bei den Quellen. Die alte bleibt als frühere Version erhalten. Prüfpunkte, die sich auf die alte stützten, sind erneut zu prüfen.')}</p>
      <button class="sec" data-act="importBehalten" data-id="${esc(e.id)}">${T('Zusätzlich behalten')}</button><p class="muted">${T('Beide Dateien bleiben nebeneinander bestehen.')}</p>
      <button class="sec" data-act="importUeberspringen" data-id="${esc(e.id)}">${T('Import überspringen')}</button><p class="muted">${T('Die neue Datei wird nicht abgelegt.')}</p></div>
    ${offen > 1 ? `<p class="muted">${T('Weitere Entscheidungen offen: {0}', offen - 1)}</p>` : ''}`);
}

// ---------- Suche ----------
function sucheEingabe(v) {
  ablageUI.suche = v;
  clearTimeout(ablageUI.timer);
  if (!v.trim()) { ablageUI.ergebnis = null; seitenleisteZeichnen(); return; }
  ablageUI.timer = setTimeout(sucheStarten, 160);
  document.getElementById('ab-inhalt').hidden = true; document.getElementById('ab-treffer').hidden = false;
}
function sucheLeeren() { const el = document.getElementById('ab-suche'); if (el) { el.value = ''; el.focus(); } sucheEingabe(''); }
function filterSetzen(k, v) { ablageUI.filter[k] = v; if (ablageUI.suche.trim()) sucheStarten(); }
async function sucheStarten() {
  if (gesperrt) return;
  const p = projektAktiv(), q = ablageUI.suche, lauf = ++ablageUI.lauf;
  if (!q.trim()) return;
  ablageUI.ergebnis = { lauf, projektId: p.id, wartet: true };
  abTrefferZeichnen(p);
  const r = await suchen(p, q, ablageUI.filter);
  if (lauf !== ablageUI.lauf || gesperrt || p.id !== S.aktivesProjekt) return;   // veraltetes Ergebnis oder inzwischen anderes Projekt
  ablageUI.ergebnis = { lauf, projektId: p.id, ...r, q };
  abTrefferZeichnen(p);
}
function abTrefferZeichnen(p) {
  const el = document.getElementById('ab-treffer'); if (!el) return;
  const q = ablageUI.suche.trim();
  if (!q) { el.innerHTML = ''; return; }
  const r = ablageUI.ergebnis;
  const kopf = `<div class="ab-trefferkopf"><span class="eyebrow">${esc(T('Suche im Projekt «{0}»', projektTitel(p)))}</span><button class="link" data-act="sucheLeeren" data-fid="suche-leeren">${T('Suche beenden')}</button></div>`;
  if (!r || r.wartet) return void (el.innerHTML = kopf + `<p class="muted" role="status">${T('Suche läuft …')}</p>`);
  const hinweise = [];
  if (r.nichtDurchsucht) hinweise.push(`<p class="hint" role="note">${T('{0} von {1} Datei(en) lassen sich nicht oder nur teilweise im Inhalt durchsuchen (Scans, Bilder, geschützte oder noch nicht gelesene Dateien). Dort wird nur nach Name, Ordner, Notiz und Schlagwörtern gesucht.', r.nichtDurchsucht, r.gesamt)}</p>`);
  if (indexOffen().length) hinweise.push(`<p class="muted" role="status">${T('Der Suchtext älterer Dateien wird noch aufgebaut ({0} offen). Die Ergebnisse können unvollständig sein.', indexOffen().length)}</p>`);
  const ARTEN = { name: T('Dateiname'), ordner: T('Ordner'), notiz: T('Notiz/Schlagwort'), flaeche: T('Fläche'), text: T('Inhalt') };
  const zeilen = r.treffer.map(t => `<li class="ab-treffer">
      <button class="ab-dname" data-act="treffer" data-id="${esc(t.d.id)}" data-seite="${t.seite || ''}" data-begriff="${esc(t.begriff)}" data-fid="tr-${esc(t.d.id)}" ${t.d.gespeichert ? '' : 'disabled'}>${esc(t.d.name)}</button>
      <div class="muted ab-meta">${esc(T('Projekt: {0}', projektTitel(p)))} · ${esc(t.pfad)}${t.flaeche ? ' · ' + esc(T('Fläche: {0}', t.flaeche.name)) : ''}</div>
      <div class="ab-chips">${t.art.map(a => `<span class="tag info">${esc(String(ARTEN[a]))}</span>`).join(' ')}${t.seite ? ` <span class="tag ok">${esc(T('Seite {0}', t.seite))}</span>` : ''} ${dokChips(t.d, { p })}</div>
      ${t.auszug ? `<p class="ab-auszug">${esc(t.auszug.vor)}<mark>${esc(t.auszug.treffer)}</mark>${esc(t.auszug.nach)}</p>` : ''}</li>`).join('');
  el.innerHTML = kopf + `<p class="muted" role="status">${r.treffer.length ? T('{0} Treffer', r.treffer.length) : T('Keine Treffer.')}</p>${hinweise.join('')}${zeilen ? `<ul class="ab-trefferliste">${zeilen}</ul>` : ''}`;
}

// ---------- Vorschau ----------
async function dokOeffnen(id, opt = {}) {
  const c = dokFinden(id); if (!c) return;
  let file = null; try { file = await dateiLaden(id); } catch (err) { file = null; }
  if (!file) return dialogZeigen(T('Datei nicht verfügbar'), `<p>${T('Die Datei ist auf diesem Gerät nicht mehr vorhanden.')}</p>`);
  vorschauFreigeben(id);
  const url = URL.createObjectURL(file); vorschauAktiv.set(id, url);
  const art = dateiArt(c.d), pfad = ordnerPfad(c.p, c.d.ordner).join(' › ');
  const frag = art === 'pdf' && (opt.seite || opt.begriff) ? '#' + [opt.seite ? 'page=' + opt.seite : '', opt.begriff ? 'search=' + encodeURIComponent(opt.begriff) : ''].filter(Boolean).join('&') : '';
  let body;
  if (art === 'pdf') body = `<iframe class="vorschau" src="${url}${frag}" title="${esc(c.d.name)}"></iframe>`;
  else if (art === 'bild') body = `<img class="vorschau-bild" src="${url}" alt="${esc(c.d.name)}" onerror="this.outerHTML='<p>${esc(T('Dieses Bildformat kann der Browser nicht anzeigen. Bitte herunterladen.'))}</p>'">`;
  else if (art === 'text') body = `<pre class="vorschau-text">${esc((await file.text()).slice(0, 20000))}</pre>`;
  else body = `<p>${T('Für dieses Format gibt es keine Vorschau. Bitte herunterladen und mit einem passenden Programm öffnen.')}</p>`;
  dialogZeigen(c.d.name, `<p class="muted">${esc(T('Projekt: {0}', projektTitel(c.p)))} · ${esc(pfad)}${c.flaeche ? ' · ' + esc(T('Fläche: {0}', c.flaeche.name)) : ''}</p>
    ${opt.seite ? `<p class="tag ok">${esc(T('Fundstelle: Seite {0}', opt.seite))}</p>` : ''}${body}
    <div class="row" style="margin-top:10px"><button class="sec small" data-act="dokHerunterladen" data-id="${esc(id)}">${T('Herunterladen')}</button>${art === 'pdf' ? `<button class="sec small" data-act="vorschauTab" data-id="${esc(id)}" data-seite="${opt.seite || ''}" data-begriff="${esc(opt.begriff || '')}">${T('In neuem Tab öffnen')}</button>` : ''}</div>`);
}
async function vorschauNeuerTab(id, seite, begriff) {
  const file = await dateiLaden(id).catch(() => null); if (!file) return;
  const url = URL.createObjectURL(file) + (seite || begriff ? '#' + [seite ? 'page=' + seite : '', begriff ? 'search=' + encodeURIComponent(begriff) : ''].filter(Boolean).join('&') : '');
  if (!window.open(url, '_blank')) dokHerunterladen(id);
  setTimeout(() => URL.revokeObjectURL(url.split('#')[0]), 120000);
}
document.getElementById('dlg').addEventListener('close', () => { if (!document.getElementById('dlg').open) vorschauFreigeben(); });

// ---------- Umschalten, Kopfzeile ----------
function ablageUmschalten(zu) {
  ablageUI.offen = zu === undefined ? !ablageUI.offen : !zu;
  ablageSpeichern(); seitenleisteZeichnen();
  if (ablageUI.offen) setTimeout(() => (document.getElementById('ab-suche') || document.getElementById('ablage'))?.focus?.({ preventScroll: true }), 0);
  else document.getElementById('ablageBtn')?.focus();
}
function einstellungenOeffnen() {
  if (gesperrt) return;
  if (view.tab !== 'einstellungen') view = { tab: 'einstellungen', id: null, schritt: 1, zurueck: { tab: view.tab, id: view.id, schritt: view.schritt } };
  render();
}
function einstellungenSchliessen() {
  const z = view.zurueck; view = z ? { tab: z.tab, id: z.id, schritt: z.schritt } : { tab: 'flaechen', id: null, schritt: 1 }; render();
}
function kopfhoehe() { const k = document.querySelector('header.top'); if (k) document.documentElement.style.setProperty('--kopf-h', k.offsetHeight + 'px'); }
addEventListener('resize', () => { kopfhoehe(); seitenleisteZeichnen(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape' && document.body.classList.contains('ablage-schmal-offen') && !document.getElementById('dlg').open) ablageUmschalten(true); });

const AKTIONEN_ABLAGE = {
  ablageZu: () => ablageUmschalten(true), ablageUmschalten: () => ablageUmschalten(), einstellungenOeffnen: () => einstellungenOeffnen(), einstellungenSchliessen: () => einstellungenSchliessen(),
  ordnerWaehlen: id => ordnerWaehlen(id), ordnerDialog: id => ordnerDialog(id), ordnerNeu: id => ordnerNeuDialog(id || null),
  ordnerUmbenennen: id => ordnerUmbenennenDialog(id), ordnerVerschieben: id => ordnerVerschiebenDialog(id), ordnerHoch: id => ordnerReihenfolgeAendern(id, -1), ordnerRunter: id => ordnerReihenfolgeAendern(id, 1),
  ordnerEntfernenDialog: id => ordnerEntfernenDialog(id), ordnerDateien: id => ordnerDateienWaehlen(id),
  dateienWaehlen: () => document.getElementById('ab-datei')?.click(),
  dokVerwalten: id => dokDialog(id), dokOeffnen: id => dokOeffnen(id), dokZurueck: id => dokZurueckholen(id), dokLoeschenDialog: id => dokLoeschenDialog(id), dokLoeschen: id => dokEndgueltig(id),
  treffer: (id, el) => dokOeffnen(id, { seite: el.dataset.seite ? +el.dataset.seite : null, begriff: el.dataset.begriff || '' }),
  vorschauTab: (id, el) => vorschauNeuerTab(id, el.dataset.seite ? +el.dataset.seite : null, el.dataset.begriff || ''),
  sucheLeeren: () => sucheLeeren(),
  projektDialog: () => projektDialog(), projektNeu: () => projektNeuDialog(), projektUmbenennen: id => projektUmbenennenDialog(id), projektAktiv: id => { projektWechseln(id); projektDialog(); },
  projektLoeschenDialog: id => projektLoeschenDialog(id), projektLoeschen: id => projektLoeschen(id),
  konfliktDialog: id => konfliktDialog(id), importVersion: id => { document.getElementById('dlg').close(); importEntscheiden(id, 'version'); },
  importBehalten: id => { document.getElementById('dlg').close(); importEntscheiden(id, 'behalten'); }, importUeberspringen: id => { document.getElementById('dlg').close(); importEntscheiden(id, 'ueberspringen'); },
  importLeeren: () => importListeLeeren(), originalZeigen: () => originalZeigen(), sicherungDialog: () => sicherungDialog()
};
