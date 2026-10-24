/* Local OCR for search and the unchanged attachment checker. One lazy worker,
   one analysis at a time, no network/provider fallback. Original bytes stay as
   supplied. The cache is session-only and contains text, never original files. */
(() => {
  'use strict';
  if (window.PBOCR) return;
  const BASE = 'vendor/tesseract/', PDFJS = 'vendor/pdfjs/';
  const LANGUAGES = Object.freeze(['deu', 'eng', 'rus', 'pol']);
  const ENGINE = 'tesseract-7.0.0-lstm-deu-eng-rus-pol-native-v1';
  const LIMIT = 64 * 1048576, RAW_PIXELS = 40000000, CANVAS_PIXELS = 9000000;
  const DEADLINE = 90000, IDLE_MS = 30000, CACHE_SIZE = 4, CACHE_CHARS = 1500000;
  const MARKER = 'pb_ocr_in_progress_v1';
  const words = {
    de: {title:'Texterkennung', installed:'Integriert · lokal · Deutsch, Englisch, Russisch und Polnisch',
      help:'Text aus Bildern und Scan-PDFs wird beim Hinzufügen gelesen und für Suche und Prüfung verwendet. Unsichere Stellen bleiben als ungeprüft markiert. Höchstens 10 Scan-Seiten je PDF; große Dateien werden begrenzt. Die Originale bleiben unverändert.',
      preparing:'Texterkennung wird lokal vorbereitet …', reading:'Texterkennung · Lesedurchgang {n}', cancel:'Abbrechen',
      interrupted:'Die letzte Texterkennung wurde unterbrochen. Starte sie bei Bedarf erneut; es läuft kein automatischer Wiederholungsversuch.',
      resume:'Texterkennung erneut freigeben', stopped:'Texterkennung abgebrochen.', partial:'Lokale Texterkennung · teilweise',
      local:'Lokale Texterkennung', failed:'Text konnte lokal nicht vollständig gelesen werden.',
      memory:'Das Bild überschreitet die Speichergrenze der lokalen Texterkennung (40 Millionen Bildpunkte / 16.000 Pixel Kante).',
      storage:'Die Absicherung gegen einen unterbrochenen OCR-Lauf konnte nicht gespeichert werden.',
      ready:'Wird bei der nächsten Bild- oder Scan-Datei gestartet.'},
    en: {title:'Text recognition', installed:'Built in · local · German, English, Russian and Polish',
      help:'Images and scanned PDFs are read when added, for search and checks. Uncertain text stays marked as unchecked. At most 10 scanned pages per PDF; large files are limited. Originals stay unchanged.',
      preparing:'Preparing local text recognition …', reading:'Text recognition · pass {n}', cancel:'Cancel',
      interrupted:'The last text recognition was interrupted. Enable it again when needed; it will not retry automatically.',
      resume:'Enable text recognition again', stopped:'Text recognition cancelled.', partial:'Local text recognition · partial',
      local:'Local text recognition', failed:'Text could not be fully read locally.', memory:'The image exceeds the memory limit for local text recognition (40 million pixels / 16,000 pixels on one side).',
      storage:'The interrupted-OCR safeguard could not be saved.', ready:'Starts when the next image or scanned document is added.'},
    ru: {title:'Распознавание текста', installed:'Встроено · локально · немецкий, английский, русский и польский',
      help:'Текст изображений и сканов PDF читается при добавлении для поиска и проверки. Неуверенно прочитанное остаётся непроверенным. Не более 10 страниц сканов на PDF; размер ограничен. Оригиналы не меняются.',
      preparing:'Подготовка локального распознавания …', reading:'Распознавание · проход {n}', cancel:'Отмена',
      interrupted:'Предыдущее распознавание прервано. При необходимости разрешите повторный запуск; автоматических повторов нет.',
      resume:'Снова разрешить распознавание', stopped:'Распознавание отменено.', partial:'Локальное распознавание · частично',
      local:'Локальное распознавание', failed:'Текст локально прочитан не полностью.', memory:'Изображение превышает предел памяти для распознавания (40 миллионов пикселей / 16 000 по стороне).',
      storage:'Не удалось сохранить защиту от повторного запуска после сбоя.', ready:'Запустится при добавлении следующего изображения или скана.'},
    pl: {title:'Rozpoznawanie tekstu', installed:'Wbudowane · lokalnie · niemiecki, angielski, rosyjski i polski',
      help:'Tekst obrazów i skanów PDF jest odczytywany przy dodawaniu do wyszukiwania i kontroli. Niepewny tekst pozostaje niesprawdzony. Maksymalnie 10 stron skanu na PDF; duże pliki są ograniczone. Oryginały nie zmieniają się.',
      preparing:'Przygotowanie lokalnego rozpoznawania …', reading:'Rozpoznawanie · przebieg {n}', cancel:'Anuluj',
      interrupted:'Ostatnie rozpoznawanie przerwano. W razie potrzeby włącz je ponownie; nie będzie automatycznych powtórzeń.',
      resume:'Ponownie włącz rozpoznawanie', stopped:'Anulowano rozpoznawanie.', partial:'Lokalne rozpoznawanie · częściowo',
      local:'Lokalne rozpoznawanie', failed:'Nie udało się odczytać całego tekstu lokalnie.', memory:'Obraz przekracza limit pamięci rozpoznawania (40 milionów pikseli / 16 000 na jednym boku).',
      storage:'Nie udało się zapisać zabezpieczenia przed ponawianiem po awarii.', ready:'Uruchomi się po dodaniu następnego obrazu lub skanu.'}
  };
  const copy = () => words[String(document.documentElement.lang || 'de').slice(0, 2)] || words.de;
  const reason = error => String(error?.message || error || '').slice(0, 180);
  const aborted = () => new DOMException(copy().stopped, 'AbortError');
  let interrupted = false, storageProblem = false;
  try { interrupted = Boolean(localStorage.getItem(MARKER)); } catch { storageProblem = true; }
  let library = null, loading = null, worker = null, starting = null, workerEpoch = 0, idle = 0, recognitionAbort = null;
  // Tesseract's createWorker promise resolves only after WASM/language init.
  // Keep the underlying dedicated Worker as soon as it is constructed, so a
  // cancellation during that initialization can terminate it immediately too.
  const dedicatedWorkers = new Set(), NativeWorker = window.Worker;
  if (typeof NativeWorker === 'function') window.Worker = new Proxy(NativeWorker, {construct(target, args, newTarget) {
    const created = Reflect.construct(target, args, newTarget);
    try { if (new URL(String(args[0]), location.href).href === new URL(BASE + 'worker.min.js', location.href).href) dedicatedWorkers.add(created); } catch {}
    return created;
  }});
  let active = null, nextId = 0, cancelEpoch = 0, statusRow = null, statusText = null, statusCancel = null;
  const queue = [], cache = new Map();

  function announce(job, stage, progress) {
    if (!job || active !== job) return;
    job.stage = stage;
    job.progress = typeof progress === 'number' && Number.isFinite(progress) ? Math.max(0, Math.min(1, progress)) : null;
    updateStatus();
    window.dispatchEvent(new CustomEvent('pb:ocr-progress', {detail:{state:job.cancelled ? 'stopping' : 'running',
      stage, progress:job.progress, passes:job.passes}}));
  }
  function label(job) {
    if (!job) return '';
    if (job.cancelled) return copy().stopped;
    if (job.stage !== 'recognizing text') return copy().preparing;
    return copy().reading.replace('{n}', String(job.passes)) + (job.progress == null ? ' …' : ' · ' + Math.round(job.progress * 100) + ' %');
  }
  function updateStatus() {
    if (!statusRow) {
      statusRow = document.createElement('div'); statusRow.id = 'pb-ocr-status'; statusRow.className = 'pb-ocr-status';
      statusText = document.createElement('span'); statusText.setAttribute('role', 'status'); statusText.setAttribute('aria-live', 'polite');
      statusCancel = document.createElement('button'); statusCancel.type = 'button'; statusCancel.className = 'ghost';
      statusCancel.addEventListener('click', () => cancel()); statusRow.append(statusText, statusCancel);
    }
    const host = document.querySelector('.wrap') || document.body;
    const activity = document.getElementById('pb-activity');
    const anchor = activity?.parentElement === host ? activity : host.querySelector(':scope > .native-toolbar-row') || host.querySelector(':scope > header.top');
    if (anchor) { if (anchor.nextElementSibling !== statusRow) anchor.after(statusRow); }
    else if (statusRow.parentElement !== host) host.prepend(statusRow);
    statusRow.hidden = !active?.ocrStarted;
    const text = label(active); if (statusText.textContent !== text) statusText.textContent = text;
    if (statusCancel.textContent !== copy().cancel) statusCancel.textContent = copy().cancel;
    statusCancel.disabled = Boolean(active?.cancelled);
  }
  function clearMarker(job) {
    if (!job?.marked) return;
    try { if (localStorage.getItem(MARKER) === job.marker) localStorage.removeItem(MARKER); }
    catch { storageProblem = true; }
    job.marked = false;
  }
  function mark(job) {
    if (job.marked) return;
    if (interrupted) throw new Error(copy().interrupted);
    if (storageProblem) throw new Error(copy().storage);
    job.marker = 'ocr-' + job.id + '-' + Date.now();
    try {
      localStorage.setItem(MARKER, job.marker);
      if (localStorage.getItem(MARKER) !== job.marker) throw new Error('not saved');
      job.marked = true;
    } catch { storageProblem = true; throw new Error(copy().storage); }
  }
  function stopWorker(error = new Error('Die lokale Texterkennung wurde beendet.')) {
    clearTimeout(idle); idle = 0; workerEpoch++;
    const rejectRecognition = recognitionAbort; recognitionAbort = null; rejectRecognition?.(error);
    const old = worker; worker = null; starting = null;
    for (const dedicated of dedicatedWorkers) { try { dedicated.terminate(); } catch {} }
    dedicatedWorkers.clear();
    try { old?.terminate(); } catch { /* already stopped */ }
  }
  function scheduleIdle() {
    clearTimeout(idle); idle = setTimeout(stopWorker, IDLE_MS);
  }
  async function loadLibrary() {
    if (library) return library;
    if (!loading) loading = new Promise((resolve, reject) => {
      const script = document.createElement('script'); script.src = BASE + 'tesseract.min.js';
      const timer = setTimeout(() => reject(new Error('Lokale Texterkennung konnte nicht geladen werden.')), 30000);
      script.onload = () => {
        clearTimeout(timer); const actual = window.Tesseract; window.Tesseract = facade;
        if (!actual || actual === facade || typeof actual.createWorker !== 'function') reject(new Error('Lokale Texterkennung fehlt.'));
        else { library = actual; resolve(actual); }
      };
      script.onerror = () => { clearTimeout(timer); reject(new Error('Lokale Texterkennung fehlt.')); };
      document.head.append(script);
    }).catch(error => { loading = null; throw error; });
    return loading;
  }
  async function getWorker(job) {
    clearTimeout(idle);
    if (worker) return worker;
    if (!starting) {
      const epoch = workerEpoch;
      starting = (async () => {
        const T = await loadLibrary();
        if (job.cancelled || epoch !== workerEpoch) throw aborted();
        const created = await T.createWorker([...LANGUAGES], 1, {
          workerPath:new URL(BASE + 'worker.min.js', location.href).href,
          corePath:new URL(BASE, location.href).href,
          langPath:new URL(BASE + 'lang/', location.href).href,
          gzip:false, cacheMethod:'none', workerBlobURL:false,
          logger:message => { if (epoch === workerEpoch) announce(active, message.status || 'preparing', message.status === 'recognizing text' ? message.progress : null); },
          errorHandler:error => { if (epoch === workerEpoch && active) active.errors.push(reason(error)); }
        });
        if (job.cancelled || epoch !== workerEpoch) { try { await created.terminate(); } catch {} throw aborted(); }
        worker = created; return created;
      })().catch(error => { if (epoch === workerEpoch) starting = null; throw error; });
    }
    return starting;
  }
  function linesOf(result) {
    const lines = [];
    for (const block of result?.data?.blocks || []) for (const paragraph of block.paragraphs || []) for (const line of paragraph.lines || []) {
      if (/[\p{L}\p{N}]/u.test(String(line.text || ''))) lines.push(line);
    }
    return lines;
  }
  async function recognize(source, parameters, output) {
    const job = active;
    if (!job || job.cancelled) throw aborted();
    let timer;
    try {
      if (source?.width > 3000 || source?.height > 3000 || source?.width * source?.height > CANVAS_PIXELS)
        throw new Error('Die Arbeitskopie ist zu groß für die lokale Texterkennung.');
      mark(job); job.ocrStarted = true; job.passes++;
      if (!job.activity) job.activity = window.PBActivity?.start({label:() => label(job)});
      announce(job, 'preparing'); await job.activity?.ready;
      const stopped = new Promise((_, reject) => { recognitionAbort = reject; });
      const timeout = new Promise((_, reject) => { timer = setTimeout(() => {
        const error = new Error('Zeit abgelaufen (90 s).'); stopWorker(error); reject(error);
      }, DEADLINE); });
      const result = await Promise.race([(async () => {
        const w = await getWorker(job);
        if (job.cancelled) throw aborted();
        announce(job, 'recognizing text', 0);
        return w.recognize(source, parameters || {}, {...output, blocks:true});
      })(), timeout, job.stopPromise, stopped]);
      if (job.cancelled) throw aborted();
      const lines = linesOf(result), uncertain = lines.filter(line => !(Number(line.confidence) >= 60));
      job.lines += lines.length - uncertain.length; job.uncertainLines += uncertain.length;
      job.completedPasses++;
      return result;
    } catch (error) {
      job.errors.push(reason(error)); stopWorker(); throw error;
    } finally { clearTimeout(timer); recognitionAbort = null; if (!job.cancelled && worker) scheduleIdle(); }
  }
  // The immutable checker remembers this light facade. Its worker can be
  // terminated/recreated after idle, cancellation or a deadline without leaving
  // a stale terminated worker inside the core's private promise.
  const sharedWorker = Object.freeze({recognize, terminate:async () => stopWorker()});
  const facade = Object.freeze({createWorker:async () => sharedWorker});
  window.Tesseract = facade;

  function dimensions(bytes, art) {
    const b = bytes, be16 = n => b[n] * 256 + b[n + 1], be32 = n => new DataView(b.buffer, b.byteOffset, b.byteLength).getUint32(n);
    if (art === 'png' && b.length >= 24) return [be32(16), be32(20)];
    if (art === 'gif' && b.length >= 10) return [b[6] + b[7] * 256, b[8] + b[9] * 256];
    if (art === 'jpeg') {
      for (let i = 2; i + 8 < b.length;) {
        if (b[i] !== 255) break;
        const type = b[i + 1]; if (type === 217 || type === 218) break;
        if (type === 255) { i++; continue; }
        if (type === 216 || (type >= 208 && type <= 215)) { i += 2; continue; }
        const len = be16(i + 2); if (len < 2) break;
        if ([192,193,194,195,197,198,199,201,202,203,205,206,207].includes(type)) return [be16(i + 7), be16(i + 5)];
        i += 2 + len;
      }
    }
    if (art === 'webp' && b.length >= 30) {
      const kind = String.fromCharCode(...b.slice(12, 16));
      if (kind === 'VP8X') return [1 + b[24] + b[25] * 256 + b[26] * 65536, 1 + b[27] + b[28] * 256 + b[29] * 65536];
      if (kind === 'VP8 ') return [(b[26] + b[27] * 256) & 16383, (b[28] + b[29] * 256) & 16383];
      if (kind === 'VP8L' && b[20] === 47) return [1 + b[21] + ((b[22] & 63) << 8), 1 + (b[22] >> 6) + (b[23] << 2) + ((b[24] & 15) << 10)];
    }
    return null;
  }
  function coverage(result, job) {
    const notes = result.hinweise || [];
    const explicitGap = notes.some(note => /ungeprüft|NICHT gelesen|nicht gegengelesen|nicht geprüft/i.test(note));
    const partial = Boolean(result.bildUngeprueft || result.textUngeprueft || explicitGap || job.uncertainLines || job.errors.length);
    if (partial) result.textUngeprueft = true;
    if (job.uncertainLines && !notes.some(note => /OCR-Lesedurchgängen/.test(note)))
      notes.push(job.uncertainLines + ' unsichere Zeile(n) in den OCR-Lesedurchgängen (unter 60 %) — diese Stellen bleiben ungeprüft.');
    result.hinweise = notes;
    const expected = /^(png|jpeg|webp|gif|pdf)$/.test(result.art) || /\.(?:bmp|tiff?)$/i.test(job.name);
    result.ocr = {engine:ENGINE, languages:[...LANGUAGES], state:!expected ? 'not-needed' :
      partial ? 'partial' : job.completedPasses ? 'read' : 'not-read', passes:job.completedPasses,
      lines:job.lines, uncertainLines:job.uncertainLines, errors:[...new Set(job.errors)].slice(0, 4),
      scanPages:(result.seiten || []).filter(page => page.bild).map(page => page.seite),
      scanPageLimit:10, textPageLimit:100, confidenceThreshold:60, resourceLimited:Boolean(result.ocrResourceLimited)};
    return result;
  }
  function limited(art, why) {
    return {art, artName:art, befunde:[], text:null, textQuelle:null, seiten:null,
      hinweise:[why], bildUngeprueft:true, textUngeprueft:true, ungeprueftSatz:why, sicher:false, ocrResourceLimited:true};
  }
  async function digest(bytes) {
    const hash = await crypto.subtle.digest('SHA-256', bytes);
    return Array.from(new Uint8Array(hash), value => value.toString(16).padStart(2, '0')).join('');
  }
  const clone = value => typeof structuredClone === 'function' ? structuredClone(value) : JSON.parse(JSON.stringify(value));
  function cacheResult(key, result) {
    const size = JSON.stringify(result).length;
    if (size > CACHE_CHARS) return;
    cache.delete(key); cache.set(key, {result:clone(result), size});
    let total = [...cache.values()].reduce((sum, entry) => sum + entry.size, 0);
    while (cache.size > CACHE_SIZE || total > CACHE_CHARS) { const first = cache.keys().next().value; total -= cache.get(first).size; cache.delete(first); }
  }
  async function pump() {
    if (active || !queue.length) return;
    const job = active = queue.shift();
    try {
      if (job.cancelled) throw aborted();
      const A = window.PrueferAnhang;
      if (!A) throw new Error('checker missing');
      A.pfade({pdfjs:PDFJS, tesseract:BASE});
      const art = A.artVon(job.bytes), size = dimensions(job.bytes, art);
      let result;
      if (job.bytes.byteLength > LIMIT) result = limited(art, 'Die Datei überschreitet die Grenze von 64 MB — nicht geprüft.');
      else if (size && (size[0] > 16000 || size[1] > 16000 || size[0] * size[1] > RAW_PIXELS)) result = limited(art, copy().memory);
      else result = await A.pruefe(job.name, job.bytes);
      if (job.cancelled) throw aborted();
      result = coverage(result, job); cacheResult(job.key, result); job.resolve(clone(result));
    } catch (error) { job.reject(error); }
    finally {
      clearMarker(job); job.activity?.finish(); job.signal?.removeEventListener('abort', job.onAbort);
      active = null; updateStatus(); mountSettings();
      window.dispatchEvent(new CustomEvent('pb:ocr-progress', {detail:{state:job.cancelled ? 'cancelled' : 'idle'}}));
      if (queue.length) setTimeout(pump, 0);
    }
  }
  async function analyze(name, input, options = {}) {
    if (options.signal?.aborted) throw aborted();
    const epoch = cancelEpoch;
    const bytes = input instanceof Uint8Array ? input : new Uint8Array(input);
    const key = ENGINE + '|' + String(name) + '|' + await digest(bytes);
    if (options.signal?.aborted || epoch !== cancelEpoch) throw aborted();
    if (!options.force && cache.has(key)) { const hit = cache.get(key); cache.delete(key); cache.set(key, hit); return clone(hit.result); }
    return new Promise((resolve, reject) => {
      let stop;
      const job = {id:++nextId, key, name:String(name || ''), bytes, resolve, reject, signal:options.signal,
        cancelled:false, ocrStarted:false, passes:0, completedPasses:0, lines:0, uncertainLines:0, errors:[],
        stopPromise:new Promise((_, no) => { stop = no; })};
      // A pending cancellation promise must not create an unhandled rejection
      // when cancellation happens before this job reaches its first OCR call.
      job.stopPromise.catch(() => {});
      job.onAbort = () => {
        job.cancelled = true; const error = aborted(); stop(error); reject(error);
        if (active === job) { stopWorker(); updateStatus(); }
        else { const index = queue.indexOf(job); if (index >= 0) queue.splice(index, 1); job.signal?.removeEventListener('abort', job.onAbort); }
      };
      job.signal?.addEventListener('abort', job.onAbort, {once:true});
      queue.push(job); pump();
    });
  }
  function cancel() {
    cancelEpoch++;
    for (const job of [...queue]) job.onAbort();
    active?.onAbort();
  }
  function resume() {
    try { localStorage.removeItem(MARKER); interrupted = false; storageProblem = false; cache.clear(); }
    catch { storageProblem = true; }
    mountSettings(); return !interrupted && !storageProblem;
  }
  function reindex(record, result, bytes) {
    // Called only by an explicit re-check. A failed/blank OCR must preserve the
    // earlier searchable text, rather than replacing it with an empty result.
    if (!record || !result?.ocr?.passes || !String(result.text || '').trim()) return false;
    const parts = [String(result.text)];
    if (/^(png|jpeg|webp|gif)$/.test(result.art) && typeof window.readExif === 'function') {
      try {
        const ex = window.readExif(bytes);
        if (ex?.dateTaken) parts.push('Aufgenommen am ' + ex.dateTaken);
        if (ex?.make || ex?.model) parts.push('Kamera ' + [ex.make, ex.model].filter(Boolean).join(' '));
        if (ex?.lat != null && ex?.lon != null) parts.push('Aufnahmeort ' + ex.lat.toFixed(4) + ', ' + ex.lon.toFixed(4));
        const settings = ex && window.exifSettingsText?.(ex); if (settings?.line) parts.push('Foto-Einstellungen: ' + settings.line);
      } catch { /* OCR text remains useful if EXIF is malformed */ }
    }
    const text = typeof window.cleanText === 'function' ? window.cleanText(parts.join('\n')) : parts.join('\n');
    const snippet = text.slice(0, typeof SNIPPET_LEN === 'number' ? SNIPPET_LEN : 12000);
    const changed = record.snippet !== snippet;
    const tokens = window.tokens((record.name + ' ').repeat(2) + ' ' + text);
    const vector = window.buildVector(tokens), tf = window.termFreq(tokens), summary = window.summarize(text);
    Object.assign(record, {snippet, vector, tf, summary,
      via:(result.art === 'pdf' ? 'PDF · ' : 'Bild · ') + (result.ocr.state === 'read' ? copy().local : copy().partial),
      ocrIndexed:{engine:ENGINE, zeit:Date.now(), state:result.ocr.state}});
    if (changed) record.evec = null;
    return changed;
  }

  // Preserve the existing EXIF and explicitly enabled caption route, while
  // feeding it the full-size, locally checked OCR result instead of doing a
  // second, lower-resolution OCR pass on the 1024px caption thumbnail.
  const images = new WeakMap(), thumbnails = new WeakMap(), guardedImages = new WeakSet();
  const originalShrink = window.shrinkImage, originalRead = window.readContent;
  const originalThumbnail = window.imgDataUrl;
  if (typeof originalThumbnail === 'function') window.imgDataUrl = async function(file) {
    if (guardedImages.has(file)) return null;
    return originalThumbnail.apply(this, arguments);
  };
  if (typeof originalShrink === 'function') window.shrinkImage = async function(file) {
    const small = await originalShrink.apply(this, arguments), result = images.get(file);
    if (result && small && typeof small === 'object') thumbnails.set(small, result);
    return small;
  };
  window.ocrImage = async function(blob) {
    try {
      const extension = {'image/jpeg':'jpg', 'image/png':'png', 'image/webp':'webp', 'image/gif':'gif'}[blob.type] || 'img';
      const result = await (thumbnails.get(blob) || images.get(blob) || analyze(blob.name || 'Bild.' + extension, new Uint8Array(await blob.arrayBuffer())));
      return {text:result.text || '', via:result.ocr.state === 'read' ? copy().local : copy().partial, ocr:result.ocr};
    } catch (error) {
      if (error?.name === 'AbortError') throw error;
      return {text:'', via:copy().partial, error:reason(error)};
    }
  };
  if (typeof originalRead === 'function') window.readContent = async function(file, buffer) {
    const ext = String(file.name || '').split('.').pop().toLowerCase();
    const image = /^(png|jpe?g|webp|gif|bmp|tiff?)$/.test(ext) || String(file.type || '').startsWith('image/');
    if (ext !== 'pdf' && file.type !== 'application/pdf' && !image) return originalRead.apply(this, arguments);
    const promise = analyze(file.name, new Uint8Array(buffer));
    // The original image reader catches OCR failures for its EXIF/caption
    // fallback; keep the same promise observed even before it reaches OCR.
    promise.catch(() => {});
    if (image) images.set(file, promise);
    try {
      if (image) {
        const analysis = await promise;
        if (analysis.ocr.resourceLimited) {
          guardedImages.add(file);
          return {text:'', via:copy().partial, ocr:analysis.ocr};
        }
        const result = await originalRead.apply(this, arguments);
        return {...result, ocr:analysis.ocr};
      }
      const result = await promise;
      return {text:result.text || '', via:result.ocr.state === 'read' ? 'PDF · ' + copy().local : 'PDF · ' + copy().partial, ocr:result.ocr};
    } catch (error) {
      if (error?.name === 'AbortError') throw error;
      return {text:'', via:copy().partial, ocr:{engine:ENGINE, state:'partial', errors:[reason(error)]}};
    } finally { if (image) images.delete(file); }
  };
  window.extractPdf = async function(bytes) { return (await analyze('Dokument.pdf', bytes)).text || ''; };
  // The established import stop button also terminates a currently running
  // local OCR worker. It does not wait for a 90-second recognition deadline.
  document.getElementById('cancelSign')?.addEventListener('click', cancel);

  function mountSettings() {
    const host = document.getElementById('panel-settings'); if (!host) return;
    let card = document.getElementById('pb-ocr-settings');
    if (!card) {
      card = document.createElement('section'); card.id = 'pb-ocr-settings'; card.className = 'card pb-ocr-settings';
      const heading = document.createElement('h2'); heading.dataset.ocr = 'title';
      const state = document.createElement('p'); state.dataset.ocr = 'installed';
      const help = document.createElement('details'), summary = document.createElement('summary'), body = document.createElement('p');
      summary.textContent = '?'; summary.setAttribute('aria-label', copy().title); body.dataset.ocr = 'help'; help.append(summary, body);
      const info = document.createElement('p'); info.dataset.ocr = 'state'; info.className = 'hint';
      const button = document.createElement('button'); button.type = 'button'; button.dataset.ocr = 'resume'; button.addEventListener('click', resume);
      const legal = document.createElement('a'); legal.href = 'ocr-notices.html'; legal.textContent = 'Tesseract · Apache-2.0';
      legal.className = 'hint'; legal.setAttribute('aria-label', 'Tesseract OCR · Apache-2.0');
      card.append(heading, state, help, info, button, legal); host.append(card);
    }
    const w = copy();
    for (const key of ['title','installed','help','resume']) { const element = card.querySelector('[data-ocr="' + key + '"]'); if (element.textContent !== w[key]) element.textContent = w[key]; }
    const state = interrupted ? w.interrupted : storageProblem ? w.storage : w.ready;
    const info = card.querySelector('[data-ocr="state"]'); if (info.textContent !== state) info.textContent = state;
    card.querySelector('[data-ocr="resume"]').hidden = !interrupted && !storageProblem;
    const flag = document.getElementById('ocrFlag');
    if (flag) {
      if (flag.textContent !== w.installed) flag.textContent = w.installed;
      flag.className = 'flag ok';
      if (flag.parentElement?.childNodes.length !== 1) flag.parentElement?.replaceChildren(flag);
    }
  }
  window.renderOcrFlag = mountSettings;
  window.PBOCR = Object.freeze({analyze, cancel, resume, reindex, engine:ENGINE, languages:LANGUAGES,
    getState:() => ({active:Boolean(active), queued:queue.length, interrupted, storageProblem, workerReady:Boolean(worker), cached:cache.size}),
    clearCache:() => cache.clear()});
  new MutationObserver(() => { updateStatus(); mountSettings(); }).observe(document.documentElement,
    {attributes:true, attributeFilter:['lang']});
  mountSettings();
})();
