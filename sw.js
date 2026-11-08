// Offline-Speicher. Bei jeder inhaltlichen Änderung VERSION erhöhen und APP_VERSION in index.html gleich setzen.
// Eigene Caches tragen das Präfix der App; nur diese (und die alten Namen «lf-v…» bis lf-v20) werden aufgeräumt,
// damit Caches anderer Anwendungen auf derselben Herkunft unberührt bleiben.
const PREFIX = 'lf-entsiegelung-';
const VERSION = PREFIX + 'lf-v23';
const DATEIEN = ['./', 'index.html', 'daten.js', 'i18n.js', 'daten-en.js', 'daten-fr.js', 'daten-it.js', 'lang-en.js', 'lang-fr.js', 'lang-it.js', 'erfassung.js', 'projekt.js', 'ablage.js', 'seitenleiste.js', 'schutz.js', 'sicherung.js', 'manifest.webmanifest', 'icon.svg', 'icon-180.png', 'icon-192.png', 'icon-512.png', 'icon-maskable-512.png', 'entscheidungsbaum.png', 'lib/pdf.min.js', 'lib/pdf.worker.min.js'];
const eigenerAlterCache = k => k !== VERSION && (k.startsWith(PREFIX) || /^lf-v\d+$/.test(k));

// Texterkennung, DOCX-Leser und Sprachdaten (zusammen rund 15 MB): werden ebenfalls vorgeladen, damit sie nach der Installation
// offline bereitstehen. Ein Fehler hier verhindert die Installation nicht (der Rest der App ist dann trotzdem offline nutzbar;
// diese Dateien werden beim ersten Gebrauch nachgeladen und gespeichert).
const OCR_DATEIEN = ['lib/mammoth.browser.min.js', 'lib/tesseract/tesseract.min.js', 'lib/tesseract/worker.min.js', 'lib/tesseract/core/tesseract-core-lstm.wasm.js', 'lib/tesseract/core/tesseract-core-simd-lstm.wasm.js', 'lib/tesseract/lang/deu.traineddata.gz', 'lib/tesseract/lang/eng.traineddata.gz', 'lib/tesseract/lang/fra.traineddata.gz', 'lib/tesseract/lang/ita.traineddata.gz'];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(DATEIEN).then(() => Promise.allSettled(OCR_DATEIEN.map(u => c.add(u))))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(eigenerAlterCache).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
// Online zuerst das Netz fragen, damit nie eine veraltete Fassung hängen bleibt. Ohne Verbindung oder bei einem
// Serverfehler (Status 500 bis 599) die gespeicherte Fassung liefern; Seitenaufrufe fallen auf die Apphülle zurück.
async function gespeichert(req) {
  return (await caches.match(req, { ignoreSearch: true })) || (req.mode === 'navigate' ? (await caches.match('index.html')) || caches.match('./') : undefined);
}
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== location.origin) return;
  e.respondWith((async () => {
    try {
      const r = await fetch(e.request, { cache: 'no-cache' });
      if (r.ok) { const kopie = r.clone(); caches.open(VERSION).then(c => c.put(e.request, kopie)); return r; }
      if (r.status >= 500) return (await gespeichert(e.request)) || r;
      return r;
    } catch (err) {
      return (await gespeichert(e.request)) || Response.error();
    }
  })());
});
