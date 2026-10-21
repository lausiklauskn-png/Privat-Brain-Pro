/*
 * Private Brain — Rendezvous-Init (Modul 23, Modus A + Identitäts-Erzeuger).
 *
 * App-eigener Klebstoff (NICHT byte-kopiert) nach dem Rezept des Skills
 * `saubere-netz-anmeldung`. Die Bedien-Oberfläche (Verbinden/Wer ist im Raum?/
 * Fragen/Briefkasten/KI-Richter) ist seit 2026-10-21 das Mycel-Fenster des Kanons,
 * `modules/23_rendezvous_ui.js` (byte-1:1). Es dockt seine 🌐-Pille in den Platz
 * `[data-sbkim-mycel-platz]` der Kopfleiste, lässt sich herausziehen, zur Pille
 * minimieren und mit ✕ bis zum Neuladen ausblenden. Das frühere app-eigene
 * `net-widget.js` ist damit abgelöst.
 *
 *   - Modus A (SbkimRendezvous.init … ensureIdentity:true): sanft, automatisch
 *     beim Mount, idempotent, NICHT zerstörend, KEINE Netz-Aktion — sichert die
 *     eigene Schublade `sbkim_privatbrain` + eine stabile Identität.
 *   - createIdentity: erzeugt (nur bei Bedarf, im Verbinden-Fluss) die Spore aus
 *     Modul 02/03 mit Modell-Ladebalken (dispatcht `sbkim:embedding-progress`,
 *     die das Netz-Werkzeug anzeigt).
 *   - prepareCorpus: der Katalog beantwortet Fragen von Freunden (enableAnswering).
 *   - Gerätename: frei wählbarer Anzeige-Name (nur Anzeige, NICHT in die Spore) —
 *     der Raum-/Karten-Name wird „App · Gerätename", die signierte Identität
 *     behält CFG.nodeName.
 *
 * Verfassungstreu: alles nutzer-ausgelöst, kein Dauer-Piepser, `init()` baut
 * nichts ins Netz auf (Empfangsmodus). Fail-soft: fehlt ein Modul/Netz, bleibt
 * die App voll nutzbar — nur der Netz-Knopf meldet ehrlich, was fehlt.
 */
(function () {
  "use strict";

  var DB_SUFFIX = "privatbrain";
  var CFG = {
    nodeName: "Private Brain",
    domain: "Privates Daten-Gehirn",
    endpoint: "https://lausiklauskn-png.github.io/Privat-Brain/",
    nodeType: "hybrid",
    domainDescription: "Private Brain — dein privates zweites Gehirn: durchsucht deine eigenen Daten (Mails, Dokumente, Fotos, Notizen) nach Bedeutung, offline, ohne dass Originale bewegt werden. Es liest jede Datei einmal, behält nur einen winzigen Bedeutungs-Katalog aus Vektor, Steckbrief und Zeiger aufs Original und lässt die Originale unangetastet — liest nur, schlägt vor, bewegt nichts. Diese App ist zugleich ein eigenständiger Knoten im SBKIM-Mycel: Semantisches Bidirektionales KI-Matching nach der offenen Spezifikation aus dem Sage-Protokol. Sie trägt eine eigene Ed25519-Identität, kündigt sich mit einer signierten Spore an und findet über ihren Bedeutungs-Vektor andere Knoten des Netzes — server-los, ohne Konto, der private Schlüssel bleibt im Browser. SBKIM, Mycel, Knoten, Spore, Sage-Protokol, semantisches Matching.",
    domainKeywords: ["Datei", "Dokument", "Bedeutungssuche", "Mail", "Foto", "Notiz", "privat", "Ordnung", "Katalog"],
  };

  // Gerätename (frei wählbarer Anzeige-Name) — nur Anzeige, NICHT in die Spore
  // (kein Re-Sign): der Raum-/Karten-Name wird "App · Gerätename", die signierte
  // Identität behält CFG.nodeName. SICHERHEIT: Name ist ein Hinweis, kein Vertrauen.
  function geraetename() { try { return (localStorage.getItem("sbkim_geraetename") || "").trim().slice(0, 40); } catch (_e) { return ""; } }
  // Alle Namensfelder der Seite gleichziehen. Eine App darf mehrere haben (Panel +
  // eigenes Feld in den Einstellungen); sie schreiben denselben Speicher und dürfen
  // beim Tippen nicht auseinanderlaufen. Programmatisches Setzen von .value löst
  // kein "input" aus — deshalb keine Schleife.
  function syncGeraetenameFields() {
    try {
      var v = geraetename();
      var list = document.querySelectorAll("[data-sbkim-geraetename]");
      for (var i = 0; i < list.length; i++) { if (list[i].value !== v) list[i].value = v; }
    } catch (_e) {}
  }
  // NETZWEITE BAUREGEL (INTERFACES §11.7): jeder Knoten mit Verbinden-Panel trägt
  // das Gerätenamen-Feld IM Panel. Der Einbau hängt sich an das geteilte Panel
  // (#sbkim-rdv-panel) — kein index.html-Eingriff, und NIEMALS in die byte-kopierte
  // Panel-Datei schreiben (Drift-Guard).
  function injectGeraetenameField() {
    function tryInject() {
      var panel = document.getElementById("sbkim-rdv-panel");
      if (!panel) return false;
      // Erkennungs-Marke statt fester id, und bewusst NUR im Panel gesucht: ein
      // app-eigenes Feld an anderer Stelle bleibt erlaubt (es zieht per
      // syncGeraetenameFields mit), aber im Panel steht nie ein zweites.
      if (panel.querySelector("[data-sbkim-geraetename]")) return true;
      var wrap = document.createElement("div");
      wrap.style.cssText = "margin:8px 0;display:flex;gap:6px;align-items:center;flex-wrap:wrap";
      var lab = document.createElement("span"); lab.textContent = "🏷️ Gerätename:"; lab.style.cssText = "color:#9aa7b6;font-size:.85rem";
      var inp = document.createElement("input"); inp.id = "sbkim-geraetename"; inp.type = "text"; inp.maxLength = 40;
      inp.setAttribute("data-sbkim-geraetename", "1");
      inp.placeholder = "z. B. Klaus-Handy (frei wählbar)"; inp.value = geraetename();
      inp.style.cssText = "flex:1;min-width:120px;padding:4px 6px;border-radius:6px;border:1px solid #33414f;background:#0d1520;color:#dfeaf2;font:inherit";
      inp.title = "Nur ein Anzeige-Hinweis, kein Vertrauens-Beweis — die Kennung bleibt daneben.";
      inp.addEventListener("input", function () {
        try { localStorage.setItem("sbkim_geraetename", String(inp.value || "").trim().slice(0, 40)); } catch (_e) {}
        try { window.dispatchEvent(new CustomEvent("sbkim:geraetename-changed")); } catch (_e) {}
      });
      wrap.appendChild(lab); wrap.appendChild(inp);
      panel.insertBefore(wrap, panel.children[1] || null);
      return true;
    }
    if (tryInject()) return;
    try { var mo = new MutationObserver(function () { if (tryInject()) mo.disconnect(); }); mo.observe(document.body, { childList: true, subtree: true }); } catch (_e) {}
  }
  function displayNodeName() { var g = geraetename(); return g ? (CFG.nodeName + " · " + g) : CFG.nodeName; }

  // ---- app-eigener Identitäts-Erzeuger (Spore aus Modul 02/03, mit %-Balken) ----
  function createIdentity() {
    if (!window.SbkimEmbedding || !window.SbkimSpore) {
      return Promise.reject(new Error("Bedeutungs-Modell/Spore (Modul 02/03) nicht geladen."));
    }
    return window.SbkimEmbedding.init()
      .then(function () { return window.SbkimEmbedding.embedPassage(CFG.domainDescription + ". " + CFG.domainKeywords.join(", ")); })
      .then(function (vec) {
        return window.SbkimSpore.generateOwnSpore({
          domain: CFG.domain, endpoint: CFG.endpoint, nodeType: CFG.nodeType, nodeName: CFG.nodeName,
          domainDescription: CFG.domainDescription, domainKeywords: CFG.domainKeywords, domainVector: Array.from(vec),
        });
      });
  }

  // app-eigener Korpus-Provider: der Katalog beantwortet Fragen von Freunden.
  function prepareCorpus() {
    try { return (typeof window.__CB_getCorpus === "function") ? window.__CB_getCorpus() : []; }
    catch (_e) { return []; }
  }

  var R = function () { return window.SbkimRendezvous; };

  function mount() {
    if (R() && typeof R().init === "function") {
      try {
        R().init({ nodeName: displayNodeName(), dbSuffix: DB_SUFFIX, createIdentity: createIdentity, prepareCorpus: prepareCorpus, ensureIdentity: true });
      } catch (e) { console.warn("[PrivateBrain] Rendezvous Modus A übersprungen:", e); }
    } else {
      console.warn("[PrivateBrain] Netz-Modul (Modul 23) nicht geladen — „Mit dem Knotennetz verbinden“ ist aus.");
    }
    // Kopplung: ändert der Nutzer den Gerätenamen, den Raum-/Karten-Namen neu setzen
    // (fail-soft; die signierte Spore bleibt unangetastet — nur die Anzeige wechselt).
    try {
      injectGeraetenameField();
      window.addEventListener("sbkim:geraetename-changed", function () {
        syncGeraetenameFields();
        try { if (window.SbkimRendezvous && window.SbkimRendezvous.configure) window.SbkimRendezvous.configure({ nodeName: displayNodeName() }); } catch (_e) {}
      });
    } catch (_e) {}
    // Mycel-Fenster des Kanons (Modul 23-UI). Ohne Sprachangabe folgt es <html lang>
    // (DE/EN; RU/PL fallen wie im Kanon auf Deutsch zurück).
    var UI = window.SbkimRendezvousUI;
    if (UI && typeof UI.init === "function") {
      try {
        UI.init({ nodeName: displayNodeName(), dbSuffix: DB_SUFFIX, createIdentity: createIdentity, prepareCorpus: prepareCorpus });
      } catch (e) { console.warn("[PrivateBrain] Mycel-Fenster (Modul 23-UI) übersprungen:", e); }
    } else {
      console.warn("[PrivateBrain] Mycel-Fenster (Modul 23-UI) nicht geladen.");
    }
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", mount);
  else mount();
})();
