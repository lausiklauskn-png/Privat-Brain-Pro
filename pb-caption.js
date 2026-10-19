/* Private Brain — optionaler LOKALER Bild-Beschreiber (Stufe 3b).
 *
 * NICHT im Service-Worker-SHELL, NICHT per Default geladen. Wird nur eingebunden,
 * wenn der Nutzer in den Einstellungen „Lokalen Bild-Beschreiber aktivieren" wählt.
 * Definiert window.PB_CAPTION(blob) -> beschreibt, was auf einem Bild zu sehen ist
 * (image-to-text via transformers.js). describeImage() in index.html ruft diese Funktion
 * fail-soft: fehlt sie oder wirft sie, bleibt alles andere (Datum/Ort/Kamera/OCR).
 *
 * ECHTES OFFLINE: das Modell wird ZUERST vom EIGENEN Server geladen
 * (<origin>/models/<MODEL>/…). Liegt es dort nicht, Rückfall auf den transformers.js-
 * Default (HuggingFace) — nur dann geht etwas ins Netz. Klaus' Weg: App + models/ aus
 * Termux servieren -> alles same-origin, nie ins Netz.
 *
 * Der Modell-Lauf selbst ist am Tablet zu prüfen (RAM/Rechenzeit) — headless nicht beweisbar.
 */
(function () {
  "use strict";
  var CFG = {
    transformersCdn: "https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.2",
    model: "Xenova/vit-gpt2-image-captioning", // leicht, WASM-tauglich (kein WebGPU nötig)
    localRoot: "/models/",
    baseUrl: "",          // optionale eigene Modell-Adresse (z. B. Hetzner) — braucht CORS am Server
    task: "image-to-text"
  };
  var T = null, pipePromise = null, lastStatus = "";

  function setStatus(s) { lastStatus = s; try { window.dispatchEvent(new CustomEvent("pb:caption-status", { detail: s })); } catch (e) {} }
  function emitProgress(d) { try { window.dispatchEvent(new CustomEvent("pb:caption-progress", { detail: d })); } catch (e) {} }

  // Effektive Modell-Wurzel: eigener Server (baseUrl, z. B. Hetzner) hat Vorrang, sonst same-origin.
  function modelRoot() {
    var b = (CFG.baseUrl || "").trim();
    if (b) return b.charAt(b.length - 1) === "/" ? b : b + "/";
    return CFG.localRoot;
  }

  async function probeAt(root, model) {
    // Body-Probe: liegt das Modell dort wirklich? (Ein SPA-Server liefert für fehlende
    // Pfade die index.html mit 200 — deshalb Inhalt prüfen, nicht nur den Status.)
    try {
      var r = await fetch(root + model + "/config.json", { method: "GET" });
      if (!r.ok) return false;
      var txt = await r.text();
      JSON.parse(txt); // echtes JSON? dann ist es das Modell, nicht die HTML-Seite
      return true;
    } catch (e) { return false; }
  }

  async function loadTransformers() {
    if (T) return T;
    // dynamischer Import; scheitert offline ohne lokale Kopie -> fail-soft (Aufrufer fängt)
    T = await import(/* @vite-ignore */ CFG.transformersCdn);
    return T;
  }

  async function getPipe() {
    if (pipePromise) return pipePromise;
    pipePromise = (async function () {
      setStatus("lade Bibliothek …");
      var lib = await loadTransformers();
      var env = lib.env;
      var root = modelRoot();
      var here = await probeAt(root, CFG.model);
      if (here) {
        // Modell liegt am eigenen Server (Hetzner) oder same-origin -> von dort, kein fremder Anbieter.
        env.allowLocalModels = true; env.localModelPath = root; env.allowRemoteModels = false;
        setStatus(CFG.baseUrl ? "lade Modell von deinem Server …" : "lade Modell (lokal, offline) …");
      } else {
        env.allowLocalModels = false; env.allowRemoteModels = true;
        setStatus("Modell nicht auf deinem Server gefunden — Rückfall auf Anbieter (einmalig, Netz) …");
      }
      var pipe = await lib.pipeline(CFG.task, CFG.model, {
        // Fortschritt pro Datei (transformers.js): {status, file, progress, loaded, total}
        progress_callback: function (d) { emitProgress(d || {}); }
      });
      emitProgress({ status: "ready" });
      setStatus("bereit");
      return pipe;
    })();
    return pipePromise;
  }

  window.PBCaption = {
    _cfg: CFG,
    status: function () { return lastStatus; },
    isReady: function () { return lastStatus === "bereit"; },
    // Modell bewusst vorladen (Fortschritt läuft über pb:caption-progress) — Signieren
    // wartet NIE darauf; der Nachbeschreiber (captionBackfill) ruft das hier auf.
    warmup: function () { return getPipe(); },
    configure: function (o) { if (o) { for (var k in o) if (o.hasOwnProperty(k)) CFG[k] = o[k]; } pipePromise = null; },
    reset: function () { pipePromise = null; T = null; },
    caption: async function (blob) {
      var pipe = await getPipe();
      var url = URL.createObjectURL(blob);
      try {
        var out = await pipe(url);
        var txt = Array.isArray(out) ? (out[0] && (out[0].generated_text || out[0].text)) : (out && (out.generated_text || out.text));
        return (txt || "").trim();
      } finally { URL.revokeObjectURL(url); }
    }
  };

  // Der Haken, den describeImage() in index.html abfragt:
  window.PB_CAPTION = async function (blob) {
    try { return (await window.PBCaption.caption(blob)) || ""; }
    catch (e) { setStatus("nicht verfügbar (" + (e && e.message ? e.message : e) + ")"); return ""; }
  };
})();
