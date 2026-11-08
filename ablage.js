'use strict';
// Dateiablage (ab lf-v23): automatische Zuordnung, Import, Duplikate und Versionen, Suchindex, Suche, Papierkorb.
//
// Grundsätze
// - Alles bleibt auf dem Gerät. Dateien, Texte und Suchbegriffe werden nie an einen Dienst gesendet.
// - Eine automatische Zuordnung ist ein Vorschlag zur Ablage, keine fachliche Bestätigung: Ein Dokument im Ordner
//   «Prüfberichte» erfüllt keinen Prüfpunkt. Nur Unterlagen einer Fläche zählen als Quellen (siehe projekt.js).
// - Unklare oder widersprüchliche Hinweise ergeben keine scheinbar sichere Zuordnung: Die Datei kommt in den Eingang.
// - Eine Ablage wird nur gemeldet, wenn die Datei und der Stand wirklich gespeichert sind; sonst bleibt alles wie vorher.

// ---------- Automatische Zuordnung ----------
// Schlüsselwörter in vereinfachter Schreibweise (ohne Akzente, ä = a). Vorsilben: «$» = Wortende, «=» = ganzes Wort.
const KLASSEN = {
  plaene: {
    stark: ['situationsplan', 'werkleitungsplan', 'werkleitungskataster', 'leitungskataster', 'grundriss', 'lageplan', 'ubersichtsplan', 'umgebungsplan', 'katasterplan', 'entwasserungsplan', 'kanalisationsplan', 'bauplan', '$plan', '=schnitt', 'plan de situation', 'piano di situazione', 'planimetria'],
    schwach: ['=karte', '=skizze'], ext: ['dwg', 'dxf']
  },
  berichte: {
    stark: ['sickertest', 'sickerversuch', 'versickerungsversuch', 'versickerungstest', 'infiltrationsversuch', 'untersuchungsbericht', 'prufbericht', 'prufprotokoll', 'baugrund', 'geotechn', 'gutachten', 'laborbericht', 'analysebericht', 'bodenuntersuchung', 'bodenanalyse', 'altlast', 'messprotokoll', 'rapport d essai', 'essai d infiltration', 'rapporto di prova', 'prova di infiltrazione', 'rapport d analyse'],
    schwach: ['bericht', 'protokoll', '=analyse', '=test', '=versuch', 'untersuchung', '=rapport', '=rapporto'], ext: []
  },
  doku: {
    stark: ['projektbeschreibung', 'projektbeschrieb', 'grundlagen', 'dokumentation', 'entwasserungskonzept', 'erlauterungsbericht', 'technischer bericht', 'sanierungsprogramm', 'projektbericht', 'vorstudie', 'baugesuch', '=beschrieb', 'description du projet', 'documentation', 'descrizione del progetto', 'documentazione', '=konzept'],
    schwach: ['beschreibung', '=projekt', 'bericht'], ext: []
  },
  fotos: {
    stark: ['=foto', '=fotos', '=photo', '=photos', 'fotografie'],
    schwach: ['=bild', '=img', '=dsc', '=pxl', 'whatsapp image', 'screenshot', 'bildschirmfoto', '=immagine'], ext: []
  },
  korr: {
    stark: ['korrespondenz', '=schreiben', '=brief', 'stellungnahme', '=email', 'courrier', '=lettre', '=lettera', 'correspondance'],
    schwach: ['=mail', '=antwort', '=einladung'], ext: ['eml', 'msg']
  }
};
const PLAN_AUSNAHMEN = /^(zeit|termin|finanz|massnahmen|arbeits|kosten|stunden|bauzeit)plan$/;
const BILD_ENDUNGEN = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'bmp', 'heic', 'heif'];
// Liefert die Treffer einer Wortliste. Jedes Wort des Dateinamens zählt höchstens einmal (auch wenn mehrere Schlüsselwörter darauf passen).
function schluesselTreffer(norm, tokens, liste, orig) {
  const aus = [], belegt = new Set();
  for (const k of liste) {
    let hit = null;
    if (k.startsWith('$')) hit = tokens.find(t => t.endsWith(k.slice(1)) && !PLAN_AUSNAHMEN.test(t));
    else if (k.startsWith('=')) hit = tokens.find(t => t === k.slice(1));
    else if (k.includes(' ')) hit = norm.includes(k) ? k : null;
    else hit = tokens.find(t => t.includes(k));
    if (hit && !belegt.has(hit)) { belegt.add(hit); const i = tokens.indexOf(hit); aus.push(orig && i >= 0 ? orig[i] : k.replace(/^[$=]/, '')); }   // Anzeige mit dem Wort, wie es im Dateinamen steht
  }
  return aus;
}
// Liefert { typ, sicher, scores, gruende } für eine Datei. «sicher» nur bei klarem Abstand zum zweitbesten Ergebnis.
function dokKlassifizieren({ name, typ, text }) {
  const stamm = String(name || '').replace(/\.[A-Za-z0-9]{1,5}$/, ''), x = (String(name || '').match(/\.([a-z0-9]+)$/i)?.[1] || '').toLowerCase();   // ohne endung(): läuft schon beim Laden des Stands
  const ot = stamm.split(/[^\p{L}\p{N}]+/u).filter(Boolean), nt = ot.map(suchNorm), nn = nt.join(' ');
  const probe = suchNorm(String(text || '').slice(0, 1500)), pt = probe.split(/[^a-z0-9]+/).filter(Boolean);
  const bild = BILD_ENDUNGEN.includes(x) || String(typ || '').startsWith('image/');
  const scores = {}, gruende = [];
  for (const [k, def] of Object.entries(KLASSEN)) {
    let s = 0;
    const st = schluesselTreffer(nn, nt, def.stark, ot), sw = schluesselTreffer(nn, nt, def.schwach, ot);
    s += Math.min(st.length, 2) * 3 + Math.min(sw.length, 2) * 2;
    st.forEach(w => gruende.push({ typ: k, quelle: 'name', wort: w })); sw.forEach(w => gruende.push({ typ: k, quelle: 'name', wort: w }));
    if (def.ext.includes(x)) { s += 3; gruende.push({ typ: k, quelle: 'endung', wort: x }); }
    if (k === 'fotos' && bild) { s += 3; gruende.push({ typ: k, quelle: 'bild', wort: x }); }
    if (probe) {
      const tt = schluesselTreffer(probe, pt, def.stark), tw = schluesselTreffer(probe, pt, def.schwach);
      s += Math.min(tt.length, 2) * 2 + Math.min(tw.length, 2) * 0.5;
      tt.forEach(w => gruende.push({ typ: k, quelle: 'text', wort: w }));
    }
    scores[k] = s;
  }
  const rang = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  const [best, zweit] = [rang[0], rang[1]];
  const sicher = best[1] >= 3 && best[1] - zweit[1] >= 1.5;
  return { typ: sicher ? best[0] : null, sicher, scores, gruende: gruende.filter(g => g.typ === best[0]) };
}
function klassGrundText(kl) {
  const g = kl.gruende[0]; if (!g) return '';
  if (g.quelle === 'name') return T('Der Dateiname enthält «{0}».', g.wort);
  if (g.quelle === 'text') return T('Der Anfang des Dokuments enthält «{0}».', g.wort);
  if (g.quelle === 'bild') return T('Es ist ein Bild.');
  return T('Dateityp «{0}».', g.wort);
}

// ---------- Textindex (IndexedDB «texte») ----------
// Pro Unterlage der ausgelesene Text, seitenweise. Mit App-Sperre liegt auch der Text verschlüsselt (wie die Dateien).
const suchCache = new Map();
async function textSpeichern(id, rec) {
  if (gesperrt) throw new Error('Die App ist gesperrt.');
  const wert = schutz?.key ? await blobVerschluesseln(schutz.key, 'txt:' + id, new Blob([JSON.stringify(rec)], { type: 'application/json' })) : rec;
  await idb('readwrite', s => s.put(wert, id), 'texte');
  suchCache.set(id, rec);
}
async function textLaden(id) {
  if (suchCache.has(id)) return suchCache.get(id);
  const r = await idb('readonly', s => s.get(id), 'texte');
  if (!r) return null;
  let rec = r;
  if (r.enc) { if (!schutz?.key) throw new Error('Die App ist gesperrt.'); rec = JSON.parse(await (await blobEntschluesseln(schutz.key, 'txt:' + id, r)).text()); }
  suchCache.set(id, rec);
  return rec;
}
const textLoeschen = id => { suchCache.delete(id); return idb('readwrite', s => s.delete(id), 'texte').catch(() => {}); };

// ---------- Verknüpfungen und Papierkorb ----------
function dokFinden(id) {
  for (const p of S.projekte) {
    const i = p.dokumente.findIndex(d => d.id === id);
    if (i >= 0) return { d: p.dokumente[i], p, flaeche: null, liste: p.dokumente };
    for (const f of flaechenVon(p)) { const k = (f.dokumente || []).findIndex(d => d.id === id); if (k >= 0) return { d: f.dokumente[k], p, flaeche: f, liste: f.dokumente }; }
  }
  return null;
}
const fDoks = f => (f.dokumente || []).filter(d => !d.papierkorb);
function alleDoks() { return S.projekte.flatMap(p => projektDoks(p).map(x => x.d)); }
// Angaben aus einer Unterlage, die nicht mehr als Quelle gilt, bleiben nicht stillschweigend gültig:
// sie werden zur erneuten Prüfung markiert (bestehende Regel), offene Vorschläge daraus verworfen.
function quelleEntfernt(id) {
  S.flaechen.forEach(f => {
    const pfade = Object.keys(f.herkunft || {}).filter(p => f.herkunft[p]?.docId === id);
    if (pfade.length) f.veraltet = [...new Set([...(f.veraltet || []), ...pfade])];
    f.vorschlaege = (f.vorschlaege || []).filter(v => v.quelle?.docId !== id);
    Object.values(f.nachweise || {}).forEach(n => { if (n.quelle?.docId === id || n.fach?.docId === id) n.veraltet = true; });
  });
}
// Wo wird die Unterlage als Quelle verwendet? Für die Anzeige vor dem endgültigen Löschen.
function verknuepfungen(id) {
  const aus = [];
  for (const f of S.flaechen) {
    for (const [pfad, h] of Object.entries(f.herkunft || {})) if (h?.docId === id) aus.push({ flaeche: f.name, text: pfad.startsWith('stufen.') ? T('Belastungsstufe «{0}»', pfad.slice(7)) : pfad.startsWith('abkl.') ? T('Abklärung «{0}»', pfad.slice(5)) : T('Angabe «{0}»', pfad) });
    for (const [nk, n] of Object.entries(f.nachweise || {})) if (n?.quelle?.docId === id || n?.fach?.docId === id) aus.push({ flaeche: f.name, text: T('Prüfpunkt: {0}', String(NACHWEISE[nk]?.t ?? nk)) });
    for (const v of f.vorschlaege || []) if (v.quelle?.docId === id) aus.push({ flaeche: f.name, text: T('Offener Vorschlag für «{0}»', v.pfad) });
  }
  return aus;
}
function dokInPapierkorb(id) {
  const c = dokFinden(id); if (!c || c.d.papierkorb) return false;
  c.d.papierkorb = { zeit: new Date().toISOString(), ordner: c.d.ordner };
  quelleEntfernt(id);
  vorschauFreigeben(id);
  return true;
}
function dokWiederherstellen(id) {
  const c = dokFinden(id); if (!c || !c.d.papierkorb) return false;
  if (!ordnerSuchen(c.p, c.d.ordner)) c.d.ordner = eingangOrdner(c.p).id;   // Ordner wurde inzwischen entfernt
  delete c.d.papierkorb;
  return true;
}
async function dokEndgueltigLoeschen(id) {
  const c = dokFinden(id); if (!c) return false;
  c.liste.splice(c.liste.indexOf(c.d), 1);
  // Frühere Versionen verweisen nicht mehr auf eine fehlende Nachfolgerin
  alleDoks().forEach(x => { if (x.ersetztDurch === id) delete x.ersetztDurch; if (x.versionVon === id) delete x.versionVon; });
  quelleEntfernt(id);
  vorschauFreigeben(id);
  await dateiLoeschen(id); await textLoeschen(id);
  return true;
}
// Unterlage zwischen Fläche und Projekt verschieben. Das ändert die Quellen der Prüfpunkte (anders als Ordnerwechsel).
function dokZuordnen(id, flaecheId) {
  const c = dokFinden(id); if (!c) return { fehler: T('Die Unterlage existiert nicht mehr.') };
  const ziel = flaecheId ? S.flaechen.find(f => f.id === flaecheId && f.projektId === c.p.id) : null;
  if (flaecheId && !ziel) return { fehler: T('Die Fläche existiert nicht mehr.') };
  if ((c.flaeche?.id || null) === (ziel?.id || null)) return { unveraendert: true };
  c.liste.splice(c.liste.indexOf(c.d), 1);
  if (c.flaeche) quelleEntfernt(id);
  if (ziel) { (ziel.dokumente ??= []).unshift(c.d); c.d.angewendet = []; vorausfuellen(ziel, c.d); }
  else c.p.dokumente.unshift(c.d);
  return { ok: true };
}
function dokOrdnerSetzen(id, ordnerId) {
  const c = dokFinden(id); if (!c) return { fehler: T('Die Unterlage existiert nicht mehr.') };
  if (!ordnerSuchen(c.p, ordnerId)) return { fehler: T('Der Zielordner existiert nicht mehr.') };
  c.d.ordner = ordnerId; c.d.ablage = { art: 'nutzer' };
  return { ok: true };
}
// Entfernt einen Ordner. Unterordner rücken eine Ebene hoch. Unterlagen im Ordner werden verschoben oder in den Papierkorb gelegt.
// wahl: { art: 'verschieben', ziel: ordnerId } | { art: 'papierkorb' }
function ordnerEntfernen(p, id, wahl) {
  const o = ordnerSuchen(p, id); if (!o) return { fehler: T('Der Ordner existiert nicht mehr.') };
  if (o.typ === 'eingang') return { fehler: T('Der Eingang ist ein fester Bereich und lässt sich nicht entfernen.') };
  const docs = projektDoks(p).filter(({ d }) => d.ordner === id);
  if (docs.length) {
    if (wahl?.art === 'verschieben') {
      const ziel = ordnerSuchen(p, wahl.ziel);
      if (!ziel || ziel.id === id) return { fehler: T('Bitte einen anderen Zielordner wählen.') };
      docs.forEach(({ d }) => { d.ordner = ziel.id; });
    } else if (wahl?.art === 'papierkorb') docs.forEach(({ d }) => { if (!d.papierkorb) dokInPapierkorb(d.id); d.ordner = eingangOrdner(p).id; if (d.papierkorb) d.papierkorb.ordner = id; });
    else return { fehler: T('Der Ordner enthält Dateien. Bitte wählen, was damit geschehen soll.') };
  }
  const eltern = o.eltern || null;
  p.ordner.filter(k => k.eltern === id).forEach(k => { k.eltern = eltern; k.pos = 1e6; });
  p.ordner.splice(p.ordner.indexOf(o), 1);
  ordnerNeuNummerieren(p, eltern);
  // Namenskollisionen nach dem Hochrücken auflösen, ohne etwas zu löschen
  ordnerGeschwister(p, eltern).forEach((k, i, l) => { if (l.findIndex(y => suchNorm(ordnerTitel(y)) === suchNorm(ordnerTitel(k))) < i) k.name = `${ordnerTitel(k)} (2)`; });
  return { ok: true };
}

// ---------- Import ----------
// Jeder Eintrag merkt sich Projekt und Ziel zum Zeitpunkt des Ziehens. Ein Projektwechsel während des Imports
// ändert deshalb nichts an der Zuordnung bereits begonnener Dateien.
let importListe = [], importZaehler = 0;
const hex = buf => [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
function importStarten(dateien, ziel = {}) {
  const files = [...(dateien || [])];
  if (!files.length || gesperrt) return dzArbeit;
  let p, fl = null;
  if (ziel.flaecheId) { fl = S.flaechen.find(f => f.id === ziel.flaecheId); p = fl ? projektVon(fl) : null; }
  else p = ziel.projektId ? S.projekte.find(x => x.id === ziel.projektId) : projektAktiv();
  if (!p) return dzArbeit;
  navigator.storage?.persist?.().catch(() => {});
  const lauf = ++importZaehler, eintraege = files.map(file => ({
    id: `i${lauf}-${++importZaehler}`, lauf, file, name: file.name || T('Einfügung'), groesse: file.size, status: 'wartet', meldung: T('wartet …'),
    projektId: p.id, projektName: p.name, flaecheId: fl?.id || null, ordnerExplizit: ziel.ordnerId || null, entscheid: null
  }));
  importListe.push(...eintraege);
  importListe = importListe.slice(-60);
  seitenleisteAktualisieren();
  // Nacheinander, damit sich gleichzeitige Ablagen nicht überholen; ein Fehler hält die Kette nicht an.
  dzArbeit = dzArbeit.catch(() => {}).then(async () => {
    for (const e of eintraege) {
      if (gesperrt) break;
      try { await eintragVerarbeiten(e); } catch (err) { eintragEnde(e, 'fehler', T('Unerwarteter Fehler: {0}', err?.message || err)); }
    }
    importAbschluss(eintraege);
  });
  return dzArbeit;
}
function eintragEnde(e, status, meldung, extra = {}) {
  Object.assign(e, { status, meldung }, extra);
  if (status !== 'frage') e.file = null;
  seitenleisteAktualisieren();
}
function importAbschluss(eintraege) {
  const n = s => eintraege.filter(e => e.status === s).length;
  const ok = n('ok'), warn = n('warn'), fehler = n('fehler'), dopp = n('doppelt') + n('uebersprungen'), frage = n('frage');
  if (!gesperrt) {
    render();
    ansagen(T('Import beendet: {0} abgelegt, {1} mit Hinweis, {2} nicht übernommen, {3} übersprungen.', ok, warn, fehler, dopp) + (frage ? ' ' + T('{0} Datei(en) warten auf Ihre Entscheidung.', frage) : ''));
  }
  const offene = eintraege.filter(e => e.status === 'frage');
  if (offene.length && !gesperrt) konfliktDialog(offene[0].id);
}
function speicherMeldung(err) {
  return err?.name === 'QuotaExceededError' || /quota/i.test(err?.message || '')
    ? T('Der Gerätespeicher ist voll. Erstellen Sie eine Sicherung, entfernen Sie nicht mehr benötigte Dateien oder geben Sie auf dem Gerät Platz frei.')
    : T('Speichern nicht möglich ({0}).', err?.message || err);
}
async function eintragVerarbeiten(e) {
  const p = S.projekte.find(x => x.id === e.projektId);
  const fl = e.flaecheId ? S.flaechen.find(f => f.id === e.flaecheId && projektVon(f).id === e.projektId) : null;
  if (!p || (e.flaecheId && !fl)) return eintragEnde(e, 'fehler', T('Das Ziel (Projekt oder Fläche) existiert nicht mehr. Die Datei wurde nicht übernommen.'));
  const file = e.file;
  e.status = 'arbeitet'; e.meldung = T('wird gelesen …'); seitenleisteAktualisieren();
  if (file.size > DOC_MAX) return eintragEnde(e, 'fehler', T('Nicht übernommen: Die Datei ist {0} gross, erlaubt sind {1}.', mb(file.size), mb(DOC_MAX)));
  if (file.size === 0) return eintragEnde(e, 'fehler', T('Nicht übernommen: Die Datei ist leer.'));
  let buf;
  try { buf = await file.arrayBuffer(); } catch (err) { return eintragEnde(e, 'fehler', T('Nicht übernommen: Die Datei konnte nicht gelesen werden.')); }
  let hash = null;
  try { hash = hex(await crypto.subtle.digest('SHA-256', buf)); } catch (err) { /* ohne Prüfsumme: kein Duplikatvergleich */ }
  // Duplikate: gleicher Inhalt = übersprungen (mit Möglichkeit, trotzdem abzulegen); gleicher Name, anderer Inhalt = Entscheidung
  // Bei einer Fläche zählen nur deren eigene Unterlagen: Jede Fläche hat ihre eigenen Quellen, dieselbe Datei darf bei mehreren Flächen liegen.
  // Bei der Projektablage zählt das ganze Projekt.
  const alle = fl ? (fl.dokumente || []) : projektDoks(p).map(x => x.d);
  let alt = null;
  if (!e.entscheid) {
    const gleich = hash && alle.find(d => d.hash === hash);
    if (gleich) {
      const pfad = ordnerPfad(p, gleich.ordner).join(' › ');
      return eintragEnde(e, 'doppelt', gleich.papierkorb ? T('Identische Datei liegt bereits im Papierkorb: «{0}».', gleich.name) : T('Identische Datei ist schon vorhanden: «{0}» in «{1}».', gleich.name, pfad), { vorhanden: gleich.id, hash });
    }
    const gleichName = alle.find(d => !d.frueher && !d.papierkorb && suchNorm(d.name) === suchNorm(e.name));
    if (gleichName) return eintragEnde(e, 'frage', T('Es gibt schon eine Datei mit diesem Namen, aber anderem Inhalt.'), { konflikt: gleichName.id, hash });
  } else if (e.entscheid === 'ueberspringen') return eintragEnde(e, 'uebersprungen', T('Übersprungen. Es wurde nichts verändert.'));
  else if (e.entscheid === 'version') alt = alle.find(d => d.id === e.konflikt && !d.frueher) || null;
  // Auswerten, bevor etwas gespeichert wird: eine beschädigte Datei wird nicht als erfolgreich abgelegt.
  e.meldung = T('wird ausgewertet …'); seitenleisteAktualisieren();
  const d = { id: 'd' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7), name: e.name, typ: file.type || '', groesse: file.size, datum: new Date().toLocaleString('de-CH', { dateStyle: 'short', timeStyle: 'short' }), abgelegt: new Date().toISOString(), funde: [], hinweis: '', gespeichert: false, hash };
  const art = dateiArt(d), info = {};
  let text = null, textStatus = art === 'bild' ? 'bild' : 'format', warnung = null;
  if (art !== 'bild') {
    try {
      text = await dateiText(file, art, info);
      if (text !== null) {
        if (text.replace(/\s/g, '').length < 20) { textStatus = 'keinText'; warnung = art === 'pdf' ? [TK('Das PDF enthält keinen lesbaren Text (vermutlich ein Scan). Der Inhalt ist nicht durchsuchbar; Name, Ordner und Notizen bleiben auffindbar.')] : [TK('Es wurde kein auswertbarer Text gefunden. Name, Ordner und Notizen bleiben auffindbar.')]; text = null; }
        else if (info.seitenGesamt && info.seitenGelesen < info.seitenGesamt) { textStatus = 'teil'; warnung = [TK('Nur die Seiten 1 bis {0} von {1} wurden durchsucht.'), info.seitenGelesen, info.seitenGesamt]; }
        else textStatus = 'ok';
      }
    } catch (err) {
      if (err.art === 'passwort') { textStatus = 'passwort'; warnung = [TK('Das PDF ist passwortgeschützt. Es ist abgelegt, aber der Inhalt ist nicht durchsuchbar.')]; }
      else if (art === 'pdf') return eintragEnde(e, 'fehler', T('Nicht übernommen: Das PDF ist beschädigt oder nicht lesbar.'));
      else { textStatus = 'fehler'; warnung = [TK('Der Text konnte nicht ausgelesen werden ({0}). Die Datei ist abgelegt; Name, Ordner und Notizen bleiben auffindbar.'), err?.message || String(err)]; }
    }
  }
  // Zuordnung: ausdrückliche Wahl vor automatischer Ablage; ohne klaren Befund der Eingang.
  const eing = eingangOrdner(p);
  let ordner = eing, auto = false, grund = '', hinweisOrdner = '';
  const kl = dokKlassifizieren({ name: e.name, typ: file.type, text });
  if (alt) ordner = ordnerSuchen(p, alt.ordner) || eing;
  else if (e.ordnerExplizit && ordnerSuchen(p, e.ordnerExplizit)) ordner = ordnerSuchen(p, e.ordnerExplizit);
  else if (kl.sicher) {
    const z = ordnerTypSuchen(p, kl.typ);
    if (z) { ordner = z; auto = true; grund = klassGrundText(kl); }
    else hinweisOrdner = T('Der Standardordner «{0}» wurde entfernt, deshalb liegt die Datei im Eingang.', String(STD_ORDNER.find(s => s.typ === kl.typ).titel));
  } else grund = T('Die Hinweise sind unklar oder widersprüchlich.');
  d.ordner = ordner.id; d.notiz = ''; d.tags = '';
  d.ablage = alt ? { art: 'version' } : e.ordnerExplizit ? { art: 'nutzer' } : auto ? { art: 'auto', typ: kl.typ } : { art: 'offen' };
  d.textStatus = textStatus;
  if (alt) d.versionVon = alt.id;
  // Speichern der Datei
  try { await dateiSpeichern(d.id, file); d.gespeichert = true; } catch (err) { return eintragEnde(e, 'fehler', T('Nicht übernommen: {0}', speicherMeldung(err)), { speicherProblem: true }); }
  // Angaben für Prüfpunkte (nur Vorschläge; keine Bestätigung) und Hinweistext zur Unterlage
  if (text) auswertungUebernehmen(d, text, info, art);
  const teile = [];
  if (textStatus === 'bild') teile.push([typeof ocrEinstellung === 'function' && ocrEinstellung().an ? TK('Foto oder Scan gespeichert. Der Text wird auf diesem Gerät per Texterkennung gelesen; das Ergebnis ist nur ein Hinweis, bitte selbst prüfen.') : TK('Foto oder Scan gespeichert. Text in Bildern wird nicht automatisch ausgelesen; bitte selbst prüfen.')]);
  else if (textStatus === 'format') teile.push([TK('Für dieses Format gibt es keine automatische Vorprüfung; bitte selbst prüfen.')]);
  if (warnung) teile.push(warnung);
  if (text && !d.funde.length) teile.push([TK('Durchsucht, aber keine der Prüfkategorien gefunden. Bitte selbst prüfen.')]);
  if (teile.length) { d.hinweisT = teile; d.hinweis = hinweisDeutsch(d); }
  // Stand ändern und speichern; bei Misserfolg wird der Stand vollständig zurückgesetzt
  const vorher = JSON.stringify(S);
  let ziel = fl ? (fl.dokumente ??= []) : p.dokumente, vorherige = null;
  if (alt) {
    const c = dokFinden(alt.id);
    if (c?.flaeche) { ziel = c.flaeche.dokumente; vorherige = c.flaeche; }
    alt.frueher = true; alt.ersetztDurch = d.id;
    if (c?.flaeche) { c.liste.splice(c.liste.indexOf(alt), 1); p.dokumente.push(alt); }
    quelleEntfernt(alt.id);   // Angaben aus der früheren Version werden zur erneuten Prüfung markiert
  }
  ziel.unshift(d);
  const zielFlaeche = vorherige || fl;
  if (zielFlaeche) { d.angewendet = []; vorausfuellen(zielFlaeche, d); }
  const ok = schutz?.key ? (save(), await speichernWarten()) : save();
  if (!ok) {
    const meldungFehler = speicherFehler || '';
    S = JSON.parse(vorher);
    await dateiLoeschen(d.id);
    save();
    return eintragEnde(e, 'fehler', T('Nicht übernommen: Der Stand konnte nicht gespeichert werden. {0}', meldungFehler), { speicherProblem: true });
  }
  // Suchindex (ein Fehler hier macht die Ablage nicht ungültig; der Index wird später nachgeholt)
  if (text) { try { await textSpeichern(d.id, { v: 1, seiten: text.split('\f'), art }); d.index = 1; } catch (err) { d.index = 0; } }
  else d.index = 1;
  save();
  if (art === 'bild') ocrEinreihen(d.id);   // lokale Texterkennung im Hintergrund (nur Hinweise)
  const pfad = ordnerPfad(p, ordner.id).join(' › ');
  let meldung = alt ? T('Als neue Version abgelegt in «{0}»; die frühere Version bleibt erhalten.', pfad)
    : e.ordnerExplizit ? T('Abgelegt in «{0}».', pfad)
    : auto ? T('Automatisch abgelegt in «{0}». {1}', pfad, grund)
    : T('In den Eingang gelegt. {0} Bitte ordnen Sie die Datei zu.', hinweisOrdner || grund);
  if (warnung) meldung += ' ' + T(...warnung);
  eintragEnde(e, warnung ? 'warn' : 'ok', meldung, { docId: d.id, ordnerId: ordner.id, auto, version: !!alt });
}
// Entscheidung bei gleichem Namen: 'version' | 'behalten' | 'ueberspringen'; bei identischem Inhalt: 'behalten' (trotzdem ablegen).
function importEntscheiden(id, wahl) {
  const e = importListe.find(x => x.id === id);
  if (!e || !e.file || gesperrt) return;
  e.entscheid = wahl; e.status = 'wartet'; e.meldung = T('wartet …');
  seitenleisteAktualisieren();
  dzArbeit = dzArbeit.catch(() => {}).then(async () => {
    try { await eintragVerarbeiten(e); } catch (err) { eintragEnde(e, 'fehler', T('Unerwarteter Fehler: {0}', err?.message || err)); }
    importAbschluss([e]);
  });
  return dzArbeit;
}
function importListeLeeren() { importListe = importListe.filter(e => e.status === 'frage' || e.status === 'wartet' || e.status === 'arbeitet'); seitenleisteAktualisieren(); }

// ---------- Suchindex für ältere Unterlagen ----------
// Unterlagen aus früheren Versionen haben noch keinen durchsuchbaren Text. Er wird im Hintergrund aus der gespeicherten
// Datei nachgeholt (lokal, ohne Übertragung). Die Prüfpunkt-Auswertung der Unterlage bleibt dabei unberührt.
let indexLaeuft = false;
const indexOffen = () => alleDoks().filter(d => d.gespeichert && !d.index && !d.papierkorb && !d.fehltOriginal);
async function indexAufbauen() {
  if (indexLaeuft || gesperrt) return;
  indexLaeuft = true;
  let seitSpeichern = 0;
  try {
    for (let d; (d = indexOffen()[0]) && !gesperrt;) {
      try {
        const file = await dateiLaden(d.id);
        if (!file) { d.index = 1; d.textStatus = 'fehler'; }
        else {
          const art = dateiArt(d), info = {};
          let text = null, st = art === 'bild' ? 'bild' : 'format';
          if (art !== 'bild') {
            try {
              text = await dateiText(file, art, info);
              if (text !== null) {
                if (text.replace(/\s/g, '').length < 20) { st = 'keinText'; text = null; }
                else st = info.seitenGesamt && info.seitenGelesen < info.seitenGesamt ? 'teil' : 'ok';
              }
            } catch (err) { st = err.art === 'passwort' ? 'passwort' : 'fehler'; }
          }
          if (text) await textSpeichern(d.id, { v: 1, seiten: text.split('\f'), art });
          d.textStatus = st;
          if (info.seitenGesamt != null) { d.seiten ??= info.seitenGesamt; d.seitenGelesen ??= info.seitenGelesen; }
          d.index = 1;
        }
      } catch (err) { d.index = 1; d.textStatus = 'fehler'; }
      if (++seitSpeichern % 5 === 0) save();
      seitenleisteAktualisieren();
    }
  } finally { indexLaeuft = false; if (seitSpeichern) save(); seitenleisteAktualisieren(); }
}

// ---------- Suche ----------
const foldPlain = s => String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const tokenVarianten = t => [...new Set([t, t.replace(/ae/g, 'a').replace(/oe/g, 'o').replace(/ue/g, 'u')])];
function dateiGruppe(d) {
  const a = dateiArt(d), x = endung(d.name);
  if (a === 'pdf') return 'pdf';
  if (a === 'bild') return 'bild';
  if (a === 'docx' || a === 'odt' || ['doc', 'rtf'].includes(x)) return 'word';
  if (a === 'xlsx' || a === 'ods' || x === 'xls') return 'excel';
  if (a === 'pptx' || a === 'odp' || x === 'ppt') return 'praesentation';
  if (a === 'text') return 'text';
  return 'andere';
}
const GRUPPEN = [['pdf', _('PDF')], ['bild', _('Bilder')], ['word', _('Word / Text-Dokumente')], ['excel', _('Excel / Tabellen')], ['praesentation', _('Präsentationen')], ['text', _('Textdateien')], ['andere', _('Andere')]];
// Kann der Inhalt dieser Unterlage durchsucht werden? 'ja' | 'teil' | 'nein' | 'offen'
function durchsuchbar(d) {
  if (!d.index) return 'offen';
  if (d.textStatus === 'ok' || d.textStatus === 'ocr') return 'ja';
  if (d.textStatus === 'teil') return 'teil';
  return 'nein';
}
// Sucht im aktiven Projekt (Dateiname, Ordner, Fläche, Notizen, Schlagwörter, ausgelesener Text).
// filter: { ordner: id|'' (mit Unterordnern), gruppe: ''|…, sort: 'relevanz'|'name'|'neu' }
async function suchen(p, q, filter = {}) {
  const tokens = foldPlain(q).split(/\s+/).filter(Boolean).map(tokenVarianten);
  if (!tokens.length) return { treffer: [], tokens: [], nichtDurchsucht: 0, gesamt: 0 };
  const ordnerIds = filter.ordner ? new Set([filter.ordner, ...ordnerNachfahren(p, filter.ordner)]) : null;
  let kandidaten = projektDoks(p).filter(({ d }) => !d.papierkorb && !d.frueher && (!ordnerIds || ordnerIds.has(d.ordner)) && (!filter.gruppe || dateiGruppe(d) === filter.gruppe));
  const gesamt = kandidaten.length, treffer = [];
  let nichtDurchsucht = 0;
  for (const { d, flaeche } of kandidaten) {
    const dur = durchsuchbar(d); if (dur !== 'ja') nichtDurchsucht++;
    const pfad = ordnerPfad(p, d.ordner).join(' › ');
    const felder = { name: foldPlain(d.name), ordner: foldPlain(pfad), notiz: foldPlain(`${d.notiz || ''} ${d.tags || ''}`), flaeche: foldPlain(flaeche?.name || '') };
    let rec = null;
    const haben = tokens.map(vs => {
      const f = Object.keys(felder).filter(k => vs.some(v => felder[k].includes(v)));
      return { vs, felder: f, text: false };
    });
    if (haben.some(h => !h.felder.length)) {   // nur dann lohnt sich der Blick in den Text
      try { rec = await textLaden(d.id); } catch (err) { rec = null; }
      if (rec) {
        const seiten = rec.seiten.map(foldPlain);
        for (const h of haben) if (!h.felder.length) { const i = seiten.findIndex(s => h.vs.some(v => s.includes(v))); if (i >= 0) { h.text = true; h.seite = i; } }
        rec._folded = seiten;
      }
    }
    if (haben.some(h => !h.felder.length && !h.text)) continue;
    let score = 0; const art = new Set();
    for (const h of haben) {
      if (h.felder.includes('name')) { score += 10; art.add('name'); }
      if (h.felder.includes('notiz')) { score += 6; art.add('notiz'); }
      if (h.felder.includes('ordner')) { score += 4; art.add('ordner'); }
      if (h.felder.includes('flaeche')) { score += 3; art.add('flaeche'); }
      if (h.text) { score += 2; art.add('text'); }
    }
    let auszug = null, seite = null;
    const th = haben.find(h => h.text);
    if (th) {
      const orig = rec.seiten[th.seite], fz = rec._folded[th.seite];
      let best = -1, blen = 0;
      for (const v of th.vs) { const i = fz.indexOf(v); if (i >= 0 && (best < 0 || i < best)) { best = i; blen = v.length; } }
      if (best >= 0 && fz.length === orig.length) {
        const a = Math.max(0, best - 70), b = Math.min(orig.length, best + blen + 90);
        auszug = { vor: (a > 0 ? '… ' : '') + orig.slice(a, best), treffer: orig.slice(best, best + blen), nach: orig.slice(best + blen, b) + (b < orig.length ? ' …' : '') };
      } else if (best >= 0) {
        const a = Math.max(0, best - 70); auszug = { vor: (a > 0 ? '… ' : '') + orig.slice(a, best), treffer: orig.slice(best, best + blen), nach: orig.slice(best + blen, best + blen + 90) + ' …' };
      }
      seite = rec.seiten.length > 1 ? th.seite + 1 : null;
    }
    treffer.push({ d, flaeche, pfad, score, art: [...art], auszug, seite, begriff: auszug?.treffer || q.trim().split(/\s+/)[0] });
  }
  const sort = filter.sort || 'relevanz';
  treffer.sort((a, b) => sort === 'name' ? a.d.name.localeCompare(b.d.name, lokale()) : sort === 'neu' ? String(b.d.abgelegt || '').localeCompare(String(a.d.abgelegt || '')) || a.d.name.localeCompare(b.d.name, lokale()) : b.score - a.score || a.d.name.localeCompare(b.d.name, lokale()));
  return { treffer, tokens, nichtDurchsucht, gesamt };
}

// ---------- Vorschau ----------
const vorschauAktiv = new Map();   // docId → blob-URL der geöffneten Vorschau
function vorschauFreigeben(id) {
  if (id === undefined) { for (const u of vorschauAktiv.values()) URL.revokeObjectURL(u); vorschauAktiv.clear(); return; }
  if (vorschauAktiv.has(id)) { URL.revokeObjectURL(vorschauAktiv.get(id)); vorschauAktiv.delete(id); }
}
