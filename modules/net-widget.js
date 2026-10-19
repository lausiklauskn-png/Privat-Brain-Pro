/*
 * Private Brain — Netz-Werkzeug „🌐 Mit dem Knotennetz verbinden" (voll).
 *
 * App-eigener Klebstoff (NICHT byte-kopiert), bewusst NATIV in Private Brains
 * Design gebaut: es nutzt die App-CSS-Variablen (--card/--ink/--line/--acc/
 * --field/--mut) + die App-Knopf-Klassen (primary/ghost) → passt sich AUTOMATISCH
 * an Hell/Dunkel an (im Gegensatz zum fest-dunklen geteilten Modul 23_rendezvous_ui).
 *
 * EIN Einbau-Ort (Klaus 2026-07-19: „alter Netz-Button/-Tab weg, NUR der Flieger"):
 * der Werkzeug-Körper wird über buildTool(container, prefix) gebaut und ausschließlich
 * in den SCHWEBENDEN 🌐-Knopf montiert (immer erreichbar, egal welcher Tab). Blase und
 * Panel sind NIE gleichzeitig sichtbar (offen → Panel, zu → Blase) — kein „doppeltes Netz".
 * Der frühere feste Tab „🌐 Netz" (#pbNetTabMount) ist entfernt.
 *
 * Funktion (1:1 zum Referenz-Widget Sage/family, in Private-Brain-Optik):
 *   - 🏷️ Gerätename (frei wählbar, kein PII) — reist als Hinweis mit
 *   - Verbinden & anmelden · 🙋 Nur neu anmelden · 🧹 Aufräumen & neu anmelden
 *   - Netzweite Frage nach BEDEUTUNG: Textfeld + 🔎 Antwort holen (sucht im Raum den
 *     best-passenden Knoten und fragt ihn) + 🎤 Mikrofon (Modul 21, fail-soft)
 *   - Wer ist im Raum? → pro Knoten: Verwandt-Score · 🤝 Andocken · ❓ gezielt fragen ·
 *     ↗ App öffnen · 🧬 nur verwandte-Filter
 *   - 💬 Antworten: an/aus (Antwortrecht-Umschalter)
 *   - 📬 Briefkasten: Antworten abholen (N) · 💬 offene nochmal fragen · 🗑 leeren
 *
 * Verfassungstreu: alles nutzer-ausgelöst, kein Auto-Connect, kein Dauer-Piepser.
 * Fail-soft: fehlt Modul 23/21/03, bleibt die App voll nutzbar — der Knopf meldet
 * ehrlich, was fehlt. KI-Richter + Schlüssel-Tresor folgen in Stufe C.
 */
(function () {
  "use strict";

  /* ─────────────────────────────────────────────────────────────────────────
   * SPRACHE — schluessellos, byte-gleiches Verfahren wie Modul 15 und 16.
   *
   * Der deutsche Satz IST der Schluessel, `TEXTE.en` traegt die Uebersetzung,
   * `T(de)` gibt auf Deutsch den Satz Zeichen fuer Zeichen zurueck. Rangfolge:
   * `<html lang>` → `de`.
   *
   * ⚠ WARUM EINE EIGENE TABELLE UND NICHT DIE VON MODUL 15. Die Kanon-Module
   * sind byte-1:1-Kopien; ihre `TEXTE` sind modul-intern und nicht ausgefuehrt.
   * Modul 16 hat aus demselben Grund eine eigene. Dieses Fenster ist
   * app-eigener Klebstoff — seine Saetze gehoeren ihm, nicht dem Kanon.
   *
   * ⚠ OHNE `<html lang="en">` AENDERT SICH NICHTS. Private Brains eigener
   * Sprachwaehler setzt das Attribut (index.html), also folgt das Fenster der
   * App von selbst.
   *
   * ⚠ BENANNTE GRENZE: die App kennt VIER Sprachen (de/en/ru/pl), der Kanon
   * zwei. Bei `lang="ru"` und `lang="pl"` faellt dieses Fenster — wie Modul 15
   * und 16 — fail-soft auf DEUTSCH zurueck. Das ist die Entscheidung des
   * Kanons, nicht dieser Datei; sie hier anders zu treffen hiesse, dass das
   * Fenster etwas anderes spricht als das Siegel daneben.
   * ───────────────────────────────────────────────────────────────────────── */
  var TEXTE = { en: {
    "✓ Bedeutung passt zur Beschreibung":
      "✓ Meaning matches the description",
    "⚠ Bedeutung passt nicht zur Beschreibung — kein Vorrang":
      "⚠ Meaning does not match the description — no priority",
    "· Bedeutung aus Inhalten, nicht nachprüfbar":
      "· Meaning computed from content, cannot be checked",
    "· Herkunft der Bedeutung nicht angegeben, nicht nachprüfbar":
      "· Origin of the meaning not stated, cannot be checked",
    "· Bedeutung nicht geprüft":
      "· Meaning not checked",
    "✓ Angemeldet im Raum. Freunde können dich jetzt finden.":
      "✓ Signed in to the room. Friends can find you now.",
    "✓ Neu angemeldet — deine Visitenkarte liegt wieder frisch im Raum.":
      "✓ Signed in again — your calling card is freshly in the room.",
    "✓ Aufgeräumt & neu angemeldet.":
      "✓ Cleaned up & signed in again.",
    "Nicht angemeldet: ":
      "Not signed in: ",
    "keine ausgewählt":
      "none selected",
    " ausgewählt":
      " selected",
    " ausgewählten Knoten.":
      " selected nodes.",
    "🧬 Keine <b>verwandten</b> Knoten im Raum (Filter an). Schalter aus → alle zeigen.":
      "🧬 No <b>related</b> nodes in the room (filter on). Switch it off to show all.",
    "Niemand im Raum.":
      "Nobody in the room.",
    " (KI-bewertet)":
      " (AI-rated)",
    "  ⚠ nicht an die KI":
      "  ⚠ not given to the AI",
    "   Anweisung an eine KI im Text — nicht an die KI gegeben.":
      "   Instruction to an AI in the text — not given to the AI.",
    "“ — siehe unten.":
      "” — see below.",
    "📬 Keine offenen Fragen — alle beantwortet.":
      "📬 No open questions — all answered.",
    "Keine offenen Fragen zum Nachfragen.":
      "No open questions to follow up on.",
    "🧬 nur verwandte: an":
      "🧬 related only: on",
    "🧬 nur verwandte: aus":
      "🧬 related only: off",
    "Server-los, optional. „Verbinden“ trägt deine Visitenkarte in den Raum; „Wer ist im Raum?“ zeigt die anderen. Es reisen nur Fragen & Antworten — keine Dateien. „–“ oder „✕“ schließen das Fenster (der 🌐-Knopf holt es zurück) — beides lässt die Verbindung bestehen (nur bei einer Änderung „🙋 Nur neu anmelden“). 💬 blendet diese Erklärung aus. Deine Fragen bleiben im 📬 Briefkasten (löschbar).":
      "Server-less, optional. “Connect” places your calling card in the room; “Who is in the room?” shows the others. Only questions & answers travel — no files. “–” or “✕” close the window (the 🌐 button brings it back) — both leave the connection up (only after a change use “🙋 Sign in again only”). 💬 hides this explanation. Your questions stay in the 📬 mailbox (deletable).",
    "🔗 KI-Richter: an":
      "🔗 AI judge: on",
    "🇪🇺 nur EU: aus":
      "🇪🇺 EU only: off",
    "💬 Antworten: an":
      "💬 Answering: on",
    "Modell lädt  ":
      "Model loading  ",
    "Modell geladen ✓":
      "Model loaded ✓",
    "Netz-Modul (Modul 23) nicht geladen.":
      "Network module (module 23) not loaded.",
    "Verbinde & melde an … (beim ersten Mal lädt das Bedeutungs-Modell, am Tablet 1–2 Min.)":
      "Connecting & signing in … (the meaning model loads the first time; 1–2 min on a tablet).",
    "Fehler: ":
      "Error: ",
    "Melde neu an … (nur anmelden, keine Reinigung)":
      "Signing in again … (sign-in only, no cleanup)",
    "Räume auf & melde neu an …":
      "Cleaning up & signing in again …",
    "Antwortrecht AUS — dein Katalog beantwortet keine Fragen mehr.":
      "Right to answer OFF — your catalogue no longer answers questions.",
    "✓ Antwortrecht AN — dein Katalog beantwortet Fragen von Freunden (nur solange dieser Tab vorn & wach ist).":
      "✓ Right to answer ON — your catalogue answers friends' questions (only while this tab is in front & awake).",
    "Antwortrecht fehlgeschlagen: ":
      "Right to answer failed: ",
    "Suche Freunde im Raum … (bis zu 12 s — bitte kurz warten)":
      "Looking for friends in the room … (up to 12 s — please wait a moment)",
    "Niemand im Raum gefunden. Ein Freund muss erst „Verbinden & anmelden“ gedrückt haben (Tab vorn/wach). Oder das Relais ist nicht erreichbar.":
      "Nobody found in the room. A friend has to press “Connect & sign in” first (tab in front/awake). Or the relay cannot be reached.",
    "Suche fehlgeschlagen: ":
      "Search failed: ",
    "Bitte eine Frage eintippen (z. B. „ich suche Rezepte, wer kann helfen?“).":
      "Please type a question (e.g. “I am looking for recipes, who can help?”).",
    "Suche den best-passenden Knoten im Raum für: „":
      "Looking for the best-matching node in the room for: “",
    "Niemand im Raum, den ich fragen könnte. Ein Freund muss erst „Verbinden & anmelden“ gedrückt haben (Tab vorn/wach).":
      "Nobody in the room to ask. A friend has to press “Connect & sign in” first (tab in front/awake).",
    "Frage „":
      "Asking “",
    "Frage fehlgeschlagen: ":
      "Question failed: ",
    "🎤 Sprach-Eingabe (Modul 21) nicht geladen — bitte tippen.":
      "🎤 Voice input (module 21) not loaded — please type.",
    "🎤 Dieser Browser kann keine Spracherkennung — bitte tippen.":
      "🎤 This browser cannot do speech recognition — please type.",
    "🎤 Aufnahme gestoppt.":
      "🎤 Recording stopped.",
    "🎤 Sprich jetzt deine Frage …":
      "🎤 Speak your question now …",
    "🎤 Verstanden: „":
      "🎤 Understood: “",
    "❓ Ausgewählte fragen":
      "❓ Ask the selected",
    "Keine Knoten ausgewählt. Hake oben welche an (oder „Alle“).":
      "No nodes selected. Tick some above (or “All”).",
    "Bitte oben die Frage nach Bedeutung eintippen — sie geht an alle ":
      "Please type the meaning question above — it goes to all ",
    "✓ Fertig an ":
      "✓ Done, sent to ",
    "🔗 KI-Richter bewertet die Antworten nach Bedeutung …":
      "🔗 AI judge is rating the answers by meaning …",
    "✓ Antwort von „":
      "✓ Answer from “",
    "Frage abgeschickt — Antwort kommt evtl. später. Schau im 📬 Briefkasten nach (Freundes-Tab muss vorn sein).":
      "Question sent — an answer may arrive later. Check the 📬 mailbox (the friend's tab has to be in front).",
    "⏳ Noch keine Antwort (Knoten evtl. nicht wach). Frage liegt im 📬 Briefkasten.":
      "⏳ No answer yet (the node may not be awake). The question is in the 📬 mailbox.",
    " ⚠ unbestätigt (nicht unterschrieben)":
      " ⚠ unconfirmed (not signed)",
    "die Antwort ist nicht unterschrieben":
      "the answer is not signed",
    "Keine Antwort / kein Treffer.":
      "No answer / no hit.",
    "… frage ":
      "… asking ",
    "Bitte eine Frage eingeben.":
      "Please enter a question.",
    "… docke an ":
      "… docking with ",
    "Andocken nicht verfügbar (Modul 23).":
      "Docking not available (module 23).",
    "🤝 Angedockt mit „":
      "🤝 Docked with “",
    "Nicht verwandt genug zum festen Andocken (unter der Schwelle) — Fragen geht trotzdem.":
      "Not related enough for a firm dock (below the threshold) — asking still works.",
    "Andocken: ":
      "Docking: ",
    "📬 Hole späte Antworten … (bis zu 12 s)":
      "📬 Fetching late answers … (up to 12 s)",
    "Noch keine Antwort. Der Freund muss die Frage beantwortet haben (Tab vorn/wach). Später nochmal „📬 abholen“.":
      "No answer yet. The friend has to have answered the question (tab in front/awake). Try “📬 fetch” again later.",
    "Briefkasten-Abruf fehlgeschlagen: ":
      "Mailbox fetch failed: ",
    "💬 Frage ":
      "💬 Question ",
    "Niemand im Raum — später nochmal.":
      "Nobody in the room — try again later.",
    "Nachfragen fehlgeschlagen: ":
      "Follow-up failed: ",
    "📬 Antworten abholen":
      "📬 Fetch answers",
    "🔗 KI-Richter: aus":
      "🔗 AI judge: off",
    "Bewertet die Antworten aus dem Raum nach Bedeutung (nicht nur Stichwort). Gratis nur als Vorfilter — der Richter braucht deinen eigenen KI-Schlüssel (EU zuerst).":
      "Rates the answers from the room by meaning (not just keyword). Free only as a pre-filter — the judge needs your own AI key (EU first).",
    "🇪🇺 nur EU: an":
      "🇪🇺 EU only: on",
    "KI-Schlüssel (bleibt in diesem Browser)":
      "AI key (stays in this browser)",
    "🔑 Schlüssel holen ↗":
      "🔑 Get a key ↗",
    "🔒 im Tresor merken":
      "🔒 keep in the vault",
    "🔓 Tresor entsperren":
      "🔓 Unlock the vault",
    "Der Schlüssel bleibt nur in diesem Browser (im 🔒 Tresor AES-verschlüsselt, nie im Klartext). Beim Bewerten reisen die Frage + die Kurz-Antworten zur gewählten KI — sonst nichts.":
      "The key stays in this browser only (AES-encrypted in the 🔒 vault, never in clear text). When rating, the question + the short answers travel to the chosen AI — nothing else.",
    "🏷️ Gerätename":
      "🏷️ Device name",
    "z. B. Klaus-Handy (frei wählbar)":
      "e.g. my-phone (freely chosen)",
    "Erscheint im Raum neben dem App-Namen (z. B. „Private Brain · Klaus-Handy“), damit man zwei Geräte auseinanderhält — nur ein Hinweis, kein Vertrauens-Beweis; die Kennung bleibt daneben.":
      "Appears in the room next to the app name (e.g. “Private Brain · my-phone”) so two devices can be told apart — only a hint, not proof of trust; the node id stays beside it.",
    "🌐 Verbinden & anmelden":
      "🌐 Connect & sign in",
    "👥 Wer ist im Raum?":
      "👥 Who is in the room?",
    "🙋 Nur neu anmelden":
      "🙋 Sign in again only",
    "🔎 Netzweite Frage — wer im Raum kann das?":
      "🔎 Network-wide question — who in the room can do this?",
    "Frage nach Bedeutung, z. B. „ich suche Rezepte, wer kann helfen?“":
      "Question by meaning, e.g. “I am looking for recipes, who can help?”",
    "🔎 Antwort holen":
      "🔎 Fetch an answer",
    "Frage sprechen":
      "Speak the question",
    "💬 Antworten: aus":
      "💬 Answering: off",
    "Noch nicht verbunden.":
      "Not connected yet.",
    "💬 offene nochmal fragen":
      "💬 ask open ones again",
    "🗑 leeren":
      "🗑 clear",
    "Nur deine öffentliche Visitenkarte (Name + Bedeutung deiner Sammlung) wird gezeigt — privater Schlüssel & Dateien bleiben in diesem Browser.":
      "Only your public calling card (name + the meaning of your collection) is shown — the private key & your files stay in this browser.",
    "🧹 Aufräumen & neu anmelden":
      "🧹 Clean up & sign in again",
    "📬 Briefkasten geleert.":
      "📬 Mailbox cleared.",
    "Netz-Modul (Modul 23) nicht geladen — „Mit dem Knotennetz verbinden“ ist aus.":
      "Network module (module 23) not loaded — “Connect to the node network” is off.",
    "Mit dem Knotennetz verbinden":
      "Connect to the node network",
    "🌐 Mit dem Knotennetz verbinden":
      "🌐 Connect to the node network",
    "Erklärung ein-/ausblenden":
      "Show / hide the explanation",
    "Zuklappen (Verbindung bleibt)":
      "Collapse (the connection stays)",
    "Zuklappen":
      "Collapse",
    "Schließen (Verbindung bleibt bestehen)":
      "Close (the connection stays up)",
    "Schließen":
      "Close"
  } };

  /* Die gewaehlte Sprache. Kein Throw — fail-soft wie alles hier. */
  function sprache() {
    try {
      var d = typeof document !== "undefined" ? document : null;
      var l = String((d && d.documentElement && d.documentElement.lang) || "").slice(0, 2).toLowerCase();
      return l === "en" ? "en" : "de";
    } catch (_e) { return "de"; }
  }

  /* Uebersetzt einen deutschen Satz. Ohne Eintrag: der deutsche Satz. */
  function T(de) {
    if (sprache() !== "en") return de;
    var w = TEXTE.en;
    return (w && Object.prototype.hasOwnProperty.call(w, de)) ? w[de] : de;
  }

  var R = function () { return window.SbkimRendezvous; };
  var EMB = function () { return window.SbkimEmbedding; };
  var SPEECH = function () { return window.SbkimSpeech; };
  var MATCH = function () { return window.SbkimMatch; };
  var SAFE = function () { return window.SbkimSafe; };

  var DB_SUFFIX = "privatbrain";
  var PENDING_KEY = "sbkim_rdv_pending_" + DB_SUFFIX; // gleicher Schlüssel wie das geteilte Modul-UI
  var POS_KEY = "pb_net_widget_pos";
  var OPEN_KEY = "pb_net_widget_open";
  var RELONLY_KEY = "pb_net_related_only_" + DB_SUFFIX;
  var KI_PREF_KEY = "pb_net_ki_pref_" + DB_SUFFIX;   // {on, provider, euOnly} — NIE der Schlüssel selbst
  var MAX_PENDING = 30;
  var MIC_LANG = "de-DE";
  var GERAETENAME_KEY = "sbkim_geraetename"; // GETEILT über alle Apps derselben Origin (Skill geraetename)
  function getGeraetename() { try { return (localStorage.getItem(GERAETENAME_KEY) || "").trim().slice(0, 40); } catch (_e) { return ""; } }
  function setGeraetename(v) { try { localStorage.setItem(GERAETENAME_KEY, String(v || "").trim().slice(0, 40)); } catch (_e) {} }

  // App-seitige Schlüssel-Seiten je Anbieter (Modul 04 liefert keine keyUrl).
  var KEY_PAGES = {
    mistral: "https://console.mistral.ai/api-keys/",
    claude: "https://console.anthropic.com/settings/keys",
    openai: "https://platform.openai.com/api-keys",
    gemini: "https://aistudio.google.com/app/apikey",
    openrouter: "https://openrouter.ai/keys",
    local: "",
  };
  function kiSecretName(provider) { return "ki_richter_key_" + (provider || "mistral"); }
  function loadKiPref() {
    try { var o = JSON.parse(localStorage.getItem(KI_PREF_KEY) || "null"); if (o && typeof o === "object") return o; } catch (_e) {}
    return { on: false, provider: "mistral", euOnly: true }; // Private Brain: EU zuerst (Klaus 2026-07-18)
  }
  function saveKiPref(p) { try { localStorage.setItem(KI_PREF_KEY, JSON.stringify({ on: !!p.on, provider: p.provider || "mistral", euOnly: !!p.euOnly })); } catch (_e) {} }
  function providerList(euOnly) {
    var m = MATCH();
    var all = (m && m._meta && Array.isArray(m._meta.hybridProviders)) ? m._meta.hybridProviders.slice()
      : [{ id: "mistral", label: "Mistral (EU)", region: "eu" }];
    return euOnly ? all.filter(function (p) { return p.region === "eu"; }) : all;
  }

  var instances = []; // gemountete Werkzeug-Instanz(en) — jetzt nur der Flieger

  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }

  // ---- Briefkasten-Speicher (offene Fragen + späte Antworten), instanzübergreifend ----
  function loadPending() {
    try { var s = localStorage.getItem(PENDING_KEY); var a = s ? JSON.parse(s) : []; return Array.isArray(a) ? a : []; }
    catch (_e) { return []; }
  }
  function savePending(list) {
    try { localStorage.setItem(PENDING_KEY, JSON.stringify((list || []).slice(0, MAX_PENDING))); } catch (_e) {}
  }
  function addPending(qid, question, targetName, targetId) {
    if (!qid) return;
    var list = loadPending();
    if (list.some(function (p) { return p.qid === qid; })) return;
    list.unshift({ qid: qid, q: question || "", target: targetName || "", targetId: targetId || "", ts: Math.floor(Date.now() / 1000), answered: false });
    savePending(list); updateAll();
  }
  function loadRelOnly() { try { return localStorage.getItem(RELONLY_KEY) === "1"; } catch (_e) { return false; } }
  function saveRelOnly(v) { try { localStorage.setItem(RELONLY_KEY, v ? "1" : "0"); } catch (_e) {} }

  // ---- schlanke Knopf-Optik (Klaus: „SCHLANKE Knöpfe, nicht zu dick") ----
  function injectStyle() {
    if (document.getElementById("pbNetStyle")) return;
    var st = document.createElement("style");
    st.id = "pbNetStyle";
    st.textContent =
      ".pbnet-mini{padding:5px 10px!important;font-size:.74rem!important;border-radius:8px!important;line-height:1.2!important}" +
      ".pbnet-field,.pbnet-gnfield{padding:7px 10px;border-radius:8px;border:1px solid var(--line);background:var(--field);color:var(--ink);font:inherit;font-size:.8rem}" +
      ".pbnet-tool .btnrow{display:flex;gap:7px;flex-wrap:wrap;align-items:center}" +
      ".pbnet-badge2{display:inline-block;padding:1px 7px;border-radius:999px;font:600 .7rem var(--mono,monospace);border:1px solid var(--line)}";
    (document.head || document.documentElement).appendChild(st);
  }

  function el(tag, css, txt) { var e = document.createElement(tag); if (css) e.style.cssText = css; if (txt != null) e.textContent = txt; return e; }
  function mk(tag, cls, txt) { var e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; }

  // ---- Modell-Ladefortschritt (Pflicht laut Skill saubere-netz-anmeldung) ----
  function makeProg(progEl) {
    var handler = null;
    return {
      start: function (label) {
        if (progEl) { progEl.style.display = "block"; progEl.textContent = label || "…"; }
        handler = function (ev) {
          var d = ev && ev.detail; if (!d || !progEl) return;
          if (typeof d.progress === "number" && isFinite(d.progress)) {
            var p = Math.max(0, Math.min(100, Math.round(d.progress))); var f = Math.round(p / 5);
            progEl.textContent = T("Modell lädt  ") + "█".repeat(f) + "░".repeat(20 - f) + "  " + p + " %";
          } else if (d.status === "done" || d.status === "ready") { progEl.textContent = T("Modell geladen ✓"); }
        };
        try { window.addEventListener("sbkim:embedding-progress", handler); } catch (_e) {}
      },
      stop: function () {
        try { if (handler) window.removeEventListener("sbkim:embedding-progress", handler); } catch (_e) {}
        handler = null;
        if (progEl) setTimeout(function () { progEl.style.display = "none"; }, 1400);
      },
    };
  }

  function out(inst, msg, append) { var e = inst.els.out; if (!e) return; e.textContent = append ? (e.textContent + "\n" + msg) : msg; }

  // ================= Aktionen (je Instanz) =================
  async function doConnect(inst) {
    if (!R()) { out(inst, T("Netz-Modul (Modul 23) nicht geladen.")); return; }
    out(inst, T("Verbinde & melde an … (beim ersten Mal lädt das Bedeutungs-Modell, am Tablet 1–2 Min.)"));
    inst.prog.start("Verbinde …");
    try {
      var res = await R().connectAndAnnounce(); inst.prog.stop();
      out(inst, res && res.ok ? T("✓ Angemeldet im Raum. Freunde können dich jetzt finden.") : T("Nicht angemeldet: ") + ((res && res.reason) || "unbekannt") + " (offline? Relais nicht erreichbar?)", true);
    } catch (e) { inst.prog.stop(); out(inst, T("Fehler: ") + errMsg(e), true); }
  }
  async function doAnnounceOnly(inst) {
    if (!R()) { out(inst, T("Netz-Modul (Modul 23) nicht geladen.")); return; }
    out(inst, T("Melde neu an … (nur anmelden, keine Reinigung)")); inst.prog.start("Anmelden …");
    try {
      var res = await R().announce(); inst.prog.stop();
      out(inst, res && res.ok ? T("✓ Neu angemeldet — deine Visitenkarte liegt wieder frisch im Raum.") : T("Nicht angemeldet: ") + ((res && res.reason) || "unbekannt") + (/Identität/.test((res && res.reason) || "") ? "  → nutze „Verbinden & anmelden" : ""), true);
    } catch (e) { inst.prog.stop(); out(inst, T("Fehler: ") + errMsg(e), true); }
  }
  async function doRepair(inst) {
    if (!R()) { out(inst, T("Netz-Modul (Modul 23) nicht geladen.")); return; }
    if (!window.confirm("Aufräumen & neu anmelden? Reinigt nur die Netz-Daten dieser Seite (nicht deine Dateien, nicht den Katalog). Danach bitte Strg+Umschalt+R.")) return;
    out(inst, T("Räume auf & melde neu an …")); inst.prog.start("Aufräumen …");
    try {
      var res = await R().repairAndReconnect(); inst.prog.stop();
      out(inst, (res && res.ok ? T("✓ Aufgeräumt & neu angemeldet.") : "Aufgeräumt. Anmeldung: " + ((res && res.reason) || "offline?")) + "\nBitte jetzt hart neu laden (Strg+Umschalt+R).", true);
    } catch (e) { inst.prog.stop(); out(inst, T("Fehler: ") + errMsg(e), true); }
  }
  async function doAnswerToggle(inst) {
    if (!R()) { out(inst, T("Netz-Modul (Modul 23) nicht geladen.")); return; }
    var on = isAnswering();
    try {
      if (on) { R().disableAnswering(); out(inst, T("Antwortrecht AUS — dein Katalog beantwortet keine Fragen mehr.")); }
      else { await R().enableAnswering(); out(inst, T("✓ Antwortrecht AN — dein Katalog beantwortet Fragen von Freunden (nur solange dieser Tab vorn & wach ist).")); }
    } catch (e) { out(inst, T("Antwortrecht fehlgeschlagen: ") + errMsg(e)); }
    syncAnswerButtons();
  }

  async function doDiscover(inst) {
    if (!R()) { out(inst, T("Netz-Modul (Modul 23) nicht geladen.")); return; }
    out(inst, T("Suche Freunde im Raum … (bis zu 12 s — bitte kurz warten)")); inst.prog.start("Suche …");
    if (inst.els.room) inst.els.room.innerHTML = "";
    try {
      var res = await R().discover({ listenMs: 12000 }); inst.prog.stop();
      var cards = (res && res.cards) ? res.cards : (Array.isArray(res) ? res : []);
      if (!cards.length) { out(inst, T("Niemand im Raum gefunden. Ein Freund muss erst „Verbinden & anmelden“ gedrückt haben (Tab vorn/wach). Oder das Relais ist nicht erreichbar."), true); return; }
      out(inst, cards.length + " Freund(e) im Raum.", true); renderRoom(inst, cards);
    } catch (e) { inst.prog.stop(); out(inst, T("Suche fehlgeschlagen: ") + errMsg(e), true); }
  }

  // Netzweite Frage nach BEDEUTUNG: Query einbetten → Raum lesen → besten Knoten
  // ranken → automatisch fragen (Referenz onAutoAsk). „wer im Raum kann das?"
  async function doAutoAsk(inst) {
    var q = (inst.els.query && inst.els.query.value || "").trim();
    if (!q) { out(inst, T("Bitte eine Frage eintippen (z. B. „ich suche Rezepte, wer kann helfen?“).")); if (inst.els.query) inst.els.query.focus(); return; }
    if (!R()) { out(inst, T("Netz-Modul (Modul 23) nicht geladen.")); return; }
    out(inst, T("Suche den best-passenden Knoten im Raum für: „") + q + "“ …"); inst.prog.start("Frage …");
    if (inst.els.room) inst.els.room.innerHTML = "";
    var qvec = null;
    try {
      if (EMB()) { await EMB().init(); qvec = await EMB().embedQuery(q); }
    } catch (_e) { qvec = null; } // fail-soft: ohne Vektor → Recency-Reihenfolge
    try {
      var res = await R().discover({ listenMs: 12000 });
      var cards = (res && res.cards) ? res.cards : (Array.isArray(res) ? res : []);
      if (!cards.length) { inst.prog.stop(); out(inst, T("Niemand im Raum, den ich fragen könnte. Ein Freund muss erst „Verbinden & anmelden“ gedrückt haben (Tab vorn/wach)."), true); return; }
      var ranked = cards;
      if (qvec && typeof R().rankCardsByQuery === "function") {
        try { ranked = R().rankCardsByQuery(cards, Array.from(qvec)); } catch (_e) { ranked = cards; }
      }
      renderRoom(inst, ranked);
      var best = ranked[0];
      out(inst, T("Frage „") + esc(best.nodeName || "Freund") + "“ (bester Treffer im Raum) …", true); inst.prog.stop();
      var ar = await R().askNode(best, q, {});
      await presentAnswer(inst, 0, best, ar, q);
    } catch (e) { inst.prog.stop(); out(inst, T("Frage fehlgeschlagen: ") + errMsg(e), true); }
  }

  // 🎤 Mikrofon (Modul 21, Browser-Engine, sofort, fail-soft)
  function doMic(inst) {
    var S = SPEECH();
    if (!S || typeof S.makeBrowserRecognizer !== "function") { out(inst, T("🎤 Sprach-Eingabe (Modul 21) nicht geladen — bitte tippen.")); return; }
    if (typeof S.isBrowserSupported === "function" && !S.isBrowserSupported()) { out(inst, T("🎤 Dieser Browser kann keine Spracherkennung — bitte tippen.")); return; }
    if (inst._rec) { try { inst._rec.stop(); } catch (_e) {} inst._rec = null; if (inst.els.mic) inst.els.mic.textContent = "🎤"; out(inst, T("🎤 Aufnahme gestoppt.")); return; }
    out(inst, T("🎤 Sprich jetzt deine Frage …"));
    if (inst.els.mic) inst.els.mic.textContent = "⏺";
    var rec = S.makeBrowserRecognizer({
      lang: MIC_LANG,
      onResult: function (t) { if (inst.els.query) { inst.els.query.value = t; } out(inst, T("🎤 Verstanden: „") + t + "“ — jetzt „🔎 Antwort holen“."); },
      onError: function (msg) { out(inst, "🎤 " + (msg || "Spracherkennung fehlgeschlagen") + " — bitte tippen."); if (inst.els.mic) inst.els.mic.textContent = "🎤"; inst._rec = null; },
      onEnd: function () { if (inst.els.mic) inst.els.mic.textContent = "🎤"; inst._rec = null; },
    });
    if (!rec.supported) { out(inst, "🎤 " + (rec.reason || "nicht verfügbar") + " — bitte tippen."); return; }
    inst._rec = rec; rec.start();
  }

  function scoreBadge(card) {
    var rel = (card && typeof card.relatedness === "number" && isFinite(card.relatedness)) ? card.relatedness : null;
    if (rel == null) return '<span class="pbnet-badge2" style="color:var(--mut)">· im Raum</span>';
    var v = (Math.round(rel * 100) / 100).toFixed(2);
    if (card.isRelated) return '<span class="pbnet-badge2" style="color:var(--acc);border-color:var(--acc)">🧬 verwandt ' + v + '</span>';
    return '<span class="pbnet-badge2" style="color:var(--mut)">· verbunden ' + v + '</span>';
  }
  /* S2 (Sage 2026-10-15): Modul 23 rechnet die Bedeutung nach (card.meaning). Fester
     Text, kein fremder Wert im HTML — wie die Karte in Modul 23-UI. */
  function meaningBadge(card) {
    var m = card && card.meaning;
    if (!m || typeof m.status !== "string") return "";
    var txt = m.status === "passt" ? T("✓ Bedeutung passt zur Beschreibung")
      : m.status === "passt-nicht" ? T("⚠ Bedeutung passt nicht zur Beschreibung — kein Vorrang")
      : m.status === "nicht-nachpruefbar"
        ? ((card.spore && card.spore.embeddingSource === "content")
          ? T("· Bedeutung aus Inhalten, nicht nachprüfbar")
          : T("· Herkunft der Bedeutung nicht angegeben, nicht nachprüfbar"))
      : T("· Bedeutung nicht geprüft");
    var col = m.status === "passt" ? "var(--acc)" : m.status === "passt-nicht" ? "#f5c26b" : "var(--mut)";
    return ' <span class="pbnet-badge2" data-sbkim-meaning="' + (m.status === "passt" ? "passt" : m.status === "passt-nicht" ? "passt-nicht" : m.status === "nicht-nachpruefbar" ? "nicht-nachpruefbar" : "nicht-geprueft") + '" style="color:' + col + '">' + txt + '</span>';
  }

  function cardKey(c) { return (c && (c.nodeId || c.nodeName)) ? String(c.nodeId || c.nodeName) : ""; }
  function selectedCards(inst) { return (inst._cards || []).filter(function (c) { return inst.selected[cardKey(c)]; }); }
  function updateSelCount(inst) {
    var p = inst.prefix;
    var n = selectedCards(inst).length;
    var lbl = document.getElementById(p + "-selcount");
    if (lbl) lbl.textContent = n ? (n + T(" ausgewählt")) : T("keine ausgewählt");
    var all = document.getElementById(p + "-selall");
    if (all) {
      var visible = inst.relatedOnly ? (inst._cards || []).filter(function (c) { return !!c.isRelated; }) : (inst._cards || []);
      var allSel = visible.length && visible.every(function (c) { return inst.selected[cardKey(c)]; });
      all.checked = !!allSel;
      all.indeterminate = !allSel && n > 0;
    }
    var askBtn = document.getElementById(p + "-askmany");
    if (askBtn) askBtn.textContent = T("❓ Ausgewählte fragen") + (n ? " (" + n + ")" : "");
  }

  function renderRoom(inst, cards) {
    var room = inst.els.room; if (!room) return;
    inst._cards = cards;
    if (!inst.selected) inst.selected = {};
    var visible = inst.relatedOnly ? cards.filter(function (c) { return !!c.isRelated; }) : cards;
    if (!visible.length) {
      room.innerHTML = '<p style="margin:10px 0 0;color:var(--mut);font-size:.8rem">' +
        (inst.relatedOnly ? T("🧬 Keine <b>verwandten</b> Knoten im Raum (Filter an). Schalter aus → alle zeigen.") : T("Niemand im Raum.")) + "</p>";
      return;
    }
    var p = inst.prefix;
    // Mehrfachauswahl-Leiste (Klaus 2026-07-18): Alle/keine + „Ausgewählte fragen" —
    // deine netzweite Frage (oben) geht an ALLE angehakten Knoten auf einmal.
    var toolbar = '<div class="btnrow" style="margin-top:12px;align-items:center;gap:9px">'
      + '<label style="display:flex;align-items:center;gap:6px;font-size:.78rem;color:var(--ink);cursor:pointer">'
      + '<input type="checkbox" id="' + p + '-selall" style="width:16px;height:16px"> Alle</label>'
      + '<span id="' + p + '-selcount" style="font-size:.74rem;color:var(--mut)">keine ausgewählt</span>'
      + '<button class="ghost pbnet-mini" id="' + p + '-askmany" style="margin-left:auto">❓ Ausgewählte fragen</button></div>';
    room.innerHTML = toolbar + visible.map(function (c) {
      var i = cards.indexOf(c);
      var age = c.ageSec != null ? (" · " + Math.round(c.ageSec) + " s alt") : "";
      var fit = (typeof c.queryFit === "number" && isFinite(c.queryFit)) ? (' <span class="pbnet-badge2" style="color:var(--acc);border-color:var(--acc)">🔎 Passung ' + (Math.round(c.queryFit * 100) / 100).toFixed(2) + '</span>') : "";
      var ep = (c.spore && typeof c.spore.endpoint === "string" && /^https?:\/\//.test(c.spore.endpoint)) ? c.spore.endpoint : "";
      var chk = inst.selected[cardKey(c)] ? " checked" : "";
      return '<div class="card" style="margin-top:10px">'
        + '<div class="fname" style="display:flex;align-items:center;gap:6px;flex-wrap:wrap">'
        + '<input type="checkbox" class="' + p + '-sel" data-i="' + i + '"' + chk + ' title="Für Mehrfach-Frage auswählen" style="width:16px;height:16px;margin-right:2px">'
        + '👤 ' + esc(c.nodeName || c.nodeId || "Knoten")
        + '<span style="color:var(--mut);font-weight:400;font-size:.78rem">' + age + '</span> ' + scoreBadge(c) + meaningBadge(c) + fit + '</div>'
        + '<div class="btnrow" style="margin-top:9px">'
        + '<input type="text" id="' + p + '-q-' + i + '" class="pbnet-field" placeholder="Frage an diesen Freund…" style="flex:1;min-width:140px">'
        + '<button class="ghost pbnet-mini ' + p + '-ask" data-i="' + i + '">❓ fragen</button>'
        + '<button class="ghost pbnet-mini ' + p + '-dock" data-i="' + i + '">🤝 Andocken</button>'
        + (ep ? '<button class="ghost pbnet-mini ' + p + '-open" data-i="' + i + '">↗ App</button>' : '')
        + '</div>'
        + '<div id="' + p + '-a-' + i + '" style="display:none;white-space:pre-wrap;margin-top:8px;padding:8px 10px;background:var(--field);border:1px solid var(--line);border-radius:8px;font-size:.8rem;color:var(--ink);word-break:break-word"></div></div>';
    }).join("");
    room.querySelectorAll("." + p + "-ask").forEach(function (b) { b.addEventListener("click", function () { var i = +b.dataset.i; doAskOne(inst, cards[i], i); }); });
    room.querySelectorAll("." + p + "-dock").forEach(function (b) { b.addEventListener("click", function () { var i = +b.dataset.i; doHandshake(inst, cards[i], i); }); });
    room.querySelectorAll("." + p + "-open").forEach(function (b) { b.addEventListener("click", function () { var i = +b.dataset.i; var c = cards[i]; if (c && c.spore && c.spore.endpoint) window.open(c.spore.endpoint, "_blank", "noopener"); }); });
    // Mehrfachauswahl-Verdrahtung
    room.querySelectorAll("." + p + "-sel").forEach(function (cb) { cb.addEventListener("change", function () { var c = cards[+cb.dataset.i]; var k = cardKey(c); if (cb.checked) inst.selected[k] = true; else delete inst.selected[k]; updateSelCount(inst); }); });
    var allCb = document.getElementById(p + "-selall");
    if (allCb) allCb.addEventListener("change", function () {
      visible.forEach(function (c) { var k = cardKey(c); if (allCb.checked) inst.selected[k] = true; else delete inst.selected[k]; });
      room.querySelectorAll("." + p + "-sel").forEach(function (cb) { cb.checked = allCb.checked; });
      updateSelCount(inst);
    });
    var askManyBtn = document.getElementById(p + "-askmany");
    if (askManyBtn) askManyBtn.addEventListener("click", function () { doAskSelected(inst); });
    updateSelCount(inst);
  }

  // Netzweite Frage (oben) an ALLE ausgewählten Knoten auf einmal (Mehrfachauswahl).
  async function doAskSelected(inst) {
    var q = (inst.els.query && inst.els.query.value || "").trim();
    var chosen = selectedCards(inst);
    if (!chosen.length) { out(inst, T("Keine Knoten ausgewählt. Hake oben welche an (oder „Alle“).")); return; }
    if (!q) { out(inst, T("Bitte oben die Frage nach Bedeutung eintippen — sie geht an alle ") + chosen.length + T(" ausgewählten Knoten.")); if (inst.els.query) inst.els.query.focus(); return; }
    if (!R()) { out(inst, T("Netz-Modul (Modul 23) nicht geladen.")); return; }
    out(inst, T("Frage „") + q + "“ an " + chosen.length + " ausgewählte Knoten … (Antworten erscheinen je Knoten; späte landen im 📬 Briefkasten)"); inst.prog.start("Frage " + chosen.length + " …");
    var okc = 0, pend = 0, err = 0;
    await Promise.all(chosen.map(async function (c) {
      var idx = inst._cards.indexOf(c);
      try {
        var res = await R().askNode(c, q, {});
        await presentAnswer(inst, idx, c, res, q);
        if (res && res.ok && res.results && res.results.length) okc++;
        else if (res && res.pending) pend++;
      } catch (e) { err++; }
    }));
    inst.prog.stop();
    out(inst, T("✓ Fertig an ") + chosen.length + ": " + okc + " direkt beantwortet, " + pend + " noch offen (📬 Briefkasten)" + (err ? ", " + err + " Fehler" : "") + ".", true);
  }

  function kiActive(inst) { return !!(inst.ki && inst.ki.on && inst.ki.key && MATCH() && typeof MATCH().hybridMatch === "function"); }

  // KI-Richter (Modul 04 hybridMatch): bewertet die Antworten nach BEDEUTUNG.
  // Nur wenn an + Schlüssel da; sonst fail-soft (Vorfilter-Reihenfolge gilt).
  async function judgeResults(inst, question, results) {
    if (!kiActive(inst) || !results || !results.length) return { judged: false, list: results };
    var cands = results.map(function (r) { return { label: r.label || "", text: r.label || "", anchorId: (typeof r.anchorId === "string") ? r.anchorId : null, cosine: (typeof r.score === "number") ? r.score : null }; });
    try {
      var jr = await MATCH().hybridMatch({ text: question, label: question }, cands, { apiKey: inst.ki.key, provider: inst.ki.provider, euOnly: !!inst.ki.euOnly });
      if (jr && jr.available && Array.isArray(jr.verdicts)) {
        var by = {}; jr.verdicts.forEach(function (v) { by[v.anchorId ? ("id:" + v.anchorId) : ("lbl:" + v.label)] = v; });
        var ann = results.map(function (r) {
          var v = by[r.anchorId ? ("id:" + r.anchorId) : ("lbl:" + r.label)];
          var o = {}; for (var k in r) o[k] = r[k];
          if (v) { o.kiPasst = v.passt; o.kiScore = v.score; o.begruendung = v.begruendung; o.sicherheit = v.sicherheit; o.ausgeschlossen = v.ausgeschlossen || null; }
          return o;
        });
        ann.sort(function (a, b) { return (b.kiPasst ? 1 : 0) - (a.kiPasst ? 1 : 0) || ((b.kiScore || 0) - (a.kiScore || 0)); });
        return { judged: true, list: ann, region: jr.region, provider: jr.provider };
      }
      return { judged: false, list: results, reason: jr && jr.reason };
    } catch (e) { return { judged: false, list: results, reason: errMsg(e) }; }
  }

  function resultLine(r, judged) {
    var base = "• " + (r.label || "") + (r.score != null ? "  (" + Math.round(r.score * 100) + "%)" : "");
    // Bau 04.J: ein Treffer mit Anweisung an eine KI ging NICHT an die KI — das steht
    // ausdrücklich da, nicht nur als ⚠️ (Klaus: „Ausschließen und zeigen").
    if (judged && r.ausgeschlossen === "ki-anweisung") {
      return "⚠ " + (r.label || "") + T("  ⚠ nicht an die KI") + "\n" + T("   Anweisung an eine KI im Text — nicht an die KI gegeben.");
    }
    if (judged && typeof r.kiPasst === "boolean") {
      base = (r.kiPasst ? "✓ " : "· ") + (r.label || "") + (typeof r.kiScore === "number" ? "  🔗 " + Math.round(r.kiScore * 100) + "%" : "") + (r.sicherheit === "gefahr" ? " ⚠️" : "");
      if (r.begruendung) base += "\n   " + r.begruendung;
    }
    return base;
  }

  async function presentAnswer(inst, i, card, res, q) {
    var a = document.getElementById(inst.prefix + "-a-" + i);
    if (a) a.style.display = "block";
    if (res && res.ok && res.results && res.results.length) {
      // Bau 23.R (Sage 2026-10-14): eine unbestätigte Antwort kann von jedem stammen —
      // sie wird gekennzeichnet und geht nicht an den KI-Richter.
      var unbestaetigt = res.bestaetigt === false;
      if (a && kiActive(inst) && !unbestaetigt) a.textContent = T("🔗 KI-Richter bewertet die Antworten nach Bedeutung …");
      var jr = unbestaetigt ? { judged: false, list: res.results, reason: kiActive(inst) ? T("die Antwort ist nicht unterschrieben") : null } : await judgeResults(inst, q, res.results);
      var head = "✓ " + (card.nodeName || "Freund") + (unbestaetigt ? T(" ⚠ unbestätigt (nicht unterschrieben)") : "") + (jr.judged ? "  (🔗 bewertet · " + (jr.provider || inst.ki.provider) + ")" : "") + ":";
      if (a) a.textContent = head + "\n" + jr.list.map(function (r) { return resultLine(r, jr.judged); }).join("\n") + (!jr.judged && jr.reason && kiActiveWanted(inst) ? "\n(KI-Richter aus: " + jr.reason + ")" : "");
      out(inst, T("✓ Antwort von „") + esc(card.nodeName || "Freund") + T("“ — siehe unten.") + (jr.judged ? T(" (KI-bewertet)") : ""), true);
    } else if (res && res.pending) {
      addPending(res.qid, q, card.nodeName, card.nodeId);
      if (a) a.textContent = T("Frage abgeschickt — Antwort kommt evtl. später. Schau im 📬 Briefkasten nach (Freundes-Tab muss vorn sein).");
      out(inst, T("⏳ Noch keine Antwort (Knoten evtl. nicht wach). Frage liegt im 📬 Briefkasten."), true);
    } else {
      if (a) a.textContent = T("Keine Antwort / kein Treffer.") + (res && res.reason ? "\n(" + res.reason + ")" : "");
    }
  }
  function kiActiveWanted(inst) { return !!(inst.ki && inst.ki.on); }

  async function doAskOne(inst, card, i) {
    var q = (document.getElementById(inst.prefix + "-q-" + i) || {}).value || "";
    var a = document.getElementById(inst.prefix + "-a-" + i); if (a) { a.style.display = "block"; a.textContent = T("… frage ") + (card.nodeName || "Freund"); }
    if (!q.trim()) { if (a) a.textContent = T("Bitte eine Frage eingeben."); return; }
    try { var res = await R().askNode(card, q, {}); await presentAnswer(inst, i, card, res, q); }
    catch (e) { if (a) a.textContent = T("Fehler: ") + errMsg(e); }
  }

  async function doHandshake(inst, card, i) {
    var a = document.getElementById(inst.prefix + "-a-" + i); if (a) { a.style.display = "block"; a.textContent = T("… docke an ") + (card.nodeName || "Freund"); }
    if (!R() || typeof R().handshakeCard !== "function") { if (a) a.textContent = T("Andocken nicht verfügbar (Modul 23)."); return; }
    try {
      var res = await R().handshakeCard(card, {});
      var oc = res && res.outcome;
      if (oc === "established") { if (a) a.textContent = T("🤝 Angedockt mit „") + (card.nodeName || "Freund") + "“ ✓" + (res.score != null ? "  (Verwandtschaft " + Math.round(res.score * 100) + "%)" : ""); }
      else if (oc === "rejected-local") { if (a) a.textContent = T("Nicht verwandt genug zum festen Andocken (unter der Schwelle) — Fragen geht trotzdem."); }
      else if (oc === "timeout") { if (a) a.textContent = "⏳ " + (res.reason || "Keine Antwort — Knoten evtl. offline/nicht wach."); }
      else { if (a) a.textContent = T("Andocken: ") + ((res && res.reason) || oc || "unbekannt"); }
    } catch (e) { if (a) a.textContent = T("Fehler: ") + errMsg(e); }
  }

  // ---- Briefkasten ----
  async function doMailbox(inst) {
    if (!R()) { out(inst, T("Netz-Modul (Modul 23) nicht geladen.")); return; }
    var list = loadPending(); renderMail(inst, list);
    // Bau 23.R (Sage 2026-10-14): je Frage den gefragten Knoten mitgeben — nur dessen Antwort zählt.
    var openQids = list.filter(function (p) { return !p.answered; }).map(function (p) { return p.targetId ? { qid: p.qid, toNodeId: p.targetId } : p.qid; });
    if (!openQids.length) { out(inst, list.length ? T("📬 Keine offenen Fragen — alle beantwortet.") : "📬 Briefkasten leer. Stelle jemandem eine Frage."); return; }
    out(inst, T("📬 Hole späte Antworten … (bis zu 12 s)")); inst.prog.start("Briefkasten …");
    try {
      var res = await R().fetchAnswers(openQids, { waitMs: 12000 }); inst.prog.stop();
      var got = (res && res.answers) || [];
      if (got.length) {
        var byQid = {}; got.forEach(function (x) { if (x && x.qid) byQid[x.qid] = x; });
        list.forEach(function (p) { if (byQid[p.qid]) { p.answered = true; p.answer = byQid[p.qid]; } });
        savePending(list); updateAll();
        out(inst, "✓ " + got.length + " Antwort(en) eingetroffen — siehe unten.", true);
      } else { out(inst, T("Noch keine Antwort. Der Freund muss die Frage beantwortet haben (Tab vorn/wach). Später nochmal „📬 abholen“."), true); }
      renderMail(inst, loadPending());
    } catch (e) { inst.prog.stop(); out(inst, T("Briefkasten-Abruf fehlgeschlagen: ") + errMsg(e), true); }
  }

  // 💬 offene Fragen NOCHMAL an den Raum stellen (Knoten war evtl. inzwischen wach)
  async function doReaskOpen(inst) {
    if (!R()) { out(inst, T("Netz-Modul (Modul 23) nicht geladen.")); return; }
    var list = loadPending();
    var open = list.filter(function (p) { return !p.answered; });
    if (!open.length) { out(inst, list.length ? T("Keine offenen Fragen zum Nachfragen.") : "📬 Briefkasten leer."); return; }
    out(inst, T("💬 Frage ") + open.length + " offene Frage(n) nochmal im Raum …"); inst.prog.start("Nachfragen …");
    try {
      var res = await R().discover({ listenMs: 12000 });
      var cards = (res && res.cards) ? res.cards : (Array.isArray(res) ? res : []);
      inst.prog.stop();
      if (!cards.length) { out(inst, T("Niemand im Raum — später nochmal."), true); return; }
      var changed = 0;
      for (var k = 0; k < open.length; k++) {
        var p = open[k];
        var target = pickCardForReask(cards, p);
        if (!target) continue;
        try {
          var ar = await R().askNode(target, p.q, {});
          if (ar && ar.ok && ar.results && ar.results.length) { p.answered = true; p.answer = { qid: p.qid, fromName: target.nodeName, results: ar.results }; changed++; }
          else if (ar && ar.pending && ar.qid) { p.qid = ar.qid; } // frische qid → beim nächsten 📬 abholbar
        } catch (_e) {}
      }
      savePending(list); updateAll(); renderMail(inst, loadPending());
      out(inst, changed ? ("✓ " + changed + " Antwort(en) gleich erhalten — siehe unten.") : "Fragen erneut abgeschickt. Schau gleich mit „📬 abholen“ nach.", true);
    } catch (e) { inst.prog.stop(); out(inst, T("Nachfragen fehlgeschlagen: ") + errMsg(e), true); }
  }
  function pickCardForReask(cards, p) {
    if (p.target) {
      var byName = cards.filter(function (c) { return (c.nodeName || "").toLowerCase() === String(p.target).toLowerCase(); });
      if (byName.length) return byName[0];
    }
    // sonst: verwandtesten nehmen (fail-soft), sonst den ersten. S2: eine Karte, deren
    // Bedeutung nicht zur Beschreibung passt, nur, wenn es keine andere gibt.
    var best = null, bs = -Infinity;
    var ohne = cards.filter(function (c) { return !(c && c.meaning && c.meaning.status === "passt-nicht"); });
    if (ohne.length) cards = ohne;
    cards.forEach(function (c) { var s = (typeof c.relatedness === "number") ? c.relatedness : -1; if (s > bs) { bs = s; best = c; } });
    return best || cards[0] || null;
  }

  function renderMail(inst, list) {
    var mailEl = inst.els.mail; if (!mailEl) return;
    if (!list || !list.length) { mailEl.innerHTML = ""; return; }
    mailEl.innerHTML = '<div class="card" style="margin-top:10px"><div class="fname">📬 Dein Briefkasten (' + list.length + ')</div>'
      + list.map(function (p) {
        var to = p.target ? (' <span style="color:var(--mut);font-size:.76rem">an ' + esc(p.target) + '</span>') : "";
        var head = '<div style="margin-top:8px;padding-top:8px;border-top:1px solid var(--line)"><b>❓ ' + esc(p.q || "(Frage)") + '</b>' + to;
        var body;
        if (p.answered && p.answer && p.answer.results && p.answer.results.length) {
          body = '<div style="margin-top:4px;color:var(--ink);font-size:.82rem;white-space:pre-wrap">✓ ' + esc(p.target || p.answer.fromName || "Freund") + (p.answer.bestaetigt === false ? esc(T(" ⚠ unbestätigt (nicht unterschrieben)")) : "") + ':\n'
            + p.answer.results.map(function (r) { return "• " + esc(r.label || "") + (r.score != null ? "  (" + Math.round(r.score * 100) + "%)" : ""); }).join("\n") + '</div>';
        } else if (p.answered) { body = '<div style="margin-top:4px;color:var(--mut);font-size:.8rem">✓ beantwortet (kein Treffer)</div>'; }
        else { body = '<div style="margin-top:4px;color:var(--mut);font-size:.8rem">⏳ wartet auf Antwort</div>'; }
        return head + body + '</div>';
      }).join("")
      + '</div>';
  }

  function updateAll() {
    var list = loadPending();
    var openN = list.length;
    var unanswered = list.filter(function (p) { return !p.answered; }).length;
    instances.forEach(function (inst) {
      if (inst.badge) {
        if (openN) { inst.badge.style.display = "grid"; inst.badge.textContent = String(openN); inst.badge.style.background = unanswered ? "#c0563d" : "var(--acc)"; }
        else { inst.badge.style.display = "none"; }
      }
      if (inst.els.mailBtn) inst.els.mailBtn.textContent = T("📬 Antworten abholen") + (unanswered ? " (" + unanswered + ")" : "");
    });
  }

  function isAnswering() { try { var m = R() && R()._meta; return !!(m && m.answering); } catch (_e) { return false; } }
  function syncAnswerButtons() {
    var on = isAnswering();
    instances.forEach(function (inst) { if (inst.els.answerBtn) inst.els.answerBtn.textContent = on ? T("💬 Antworten: an") : T("💬 Antworten: aus"); });
  }
  function errMsg(e) { return e && e.message ? e.message : String(e); }

  // ================= KI-Richter-Abschnitt (Stufe C, opt-in/BYOK, EU zuerst) =================
  function refreshProviders(inst) {
    var sel = inst.ki.els.prov; if (!sel) return;
    var list = providerList(inst.ki.euOnly);
    var cur = inst.ki.provider;
    sel.innerHTML = list.map(function (p) { return '<option value="' + esc(p.id) + '">' + esc(p.label) + (p.region === "eu" ? " 🇪🇺" : "") + '</option>'; }).join("");
    if (!list.some(function (p) { return p.id === cur; })) { cur = (list[0] && list[0].id) || "mistral"; inst.ki.provider = cur; }
    sel.value = cur;
    updateKeyLink(inst);
  }
  function updateKeyLink(inst) {
    var link = inst.ki.els.keyLink; if (!link) return;
    var url = KEY_PAGES[inst.ki.provider] || "";
    if (url) { link.style.display = "inline"; link.href = url; } else { link.style.display = "none"; }
  }
  async function refreshTresorState(inst) {
    var btn = inst.ki.els.unlock; if (!btn || !SAFE() || typeof SAFE().hasSecret !== "function") { if (btn) btn.style.display = "none"; return; }
    try { var has = await SAFE().hasSecret(kiSecretName(inst.ki.provider)); btn.style.display = has ? "inline-block" : "none"; }
    catch (_e) { btn.style.display = "none"; }
  }
  function kiStatus(inst, msg) { if (inst.ki.els.status) inst.ki.els.status.textContent = msg || ""; }
  function syncKiUI(inst) {
    if (inst.ki.els.toggle) inst.ki.els.toggle.textContent = inst.ki.on ? T("🔗 KI-Richter: an") : T("🔗 KI-Richter: aus");
    if (inst.ki.els.body) inst.ki.els.body.style.display = inst.ki.on ? "block" : "none";
    if (inst.ki.els.euBtn) inst.ki.els.euBtn.textContent = inst.ki.euOnly ? T("🇪🇺 nur EU: an") : T("🇪🇺 nur EU: aus");
  }

  function buildKiSection(inst, wrap) {
    var sec = mk("div"); sec.style.cssText = "margin-top:12px;padding-top:10px;border-top:1px solid var(--line)";
    var headRow = mk("div", "btnrow");
    inst.ki.els.toggle = mk("button", "ghost pbnet-mini", T("🔗 KI-Richter: aus")); inst.ki.els.toggle.type = "button";
    headRow.appendChild(inst.ki.els.toggle);
    sec.appendChild(headRow);
    sec.appendChild(mk("div", null, T("Bewertet die Antworten aus dem Raum nach Bedeutung (nicht nur Stichwort). Gratis nur als Vorfilter — der Richter braucht deinen eigenen KI-Schlüssel (EU zuerst)."))).style.cssText = "margin:5px 0 0;color:var(--mut);font-size:.72rem";

    var body = mk("div"); body.style.cssText = "display:none;margin-top:8px"; inst.ki.els.body = body;

    var togRow = mk("div", "btnrow"); togRow.style.marginBottom = "7px";
    inst.ki.els.euBtn = mk("button", "ghost pbnet-mini", T("🇪🇺 nur EU: an")); inst.ki.els.euBtn.type = "button";
    togRow.appendChild(inst.ki.els.euBtn);
    body.appendChild(togRow);

    var provRow = mk("div", "btnrow"); provRow.style.marginBottom = "7px";
    inst.ki.els.prov = mk("select", "pbnet-field"); inst.ki.els.prov.style.cssText += ";flex:1;min-width:150px";
    provRow.appendChild(inst.ki.els.prov);
    body.appendChild(provRow);

    var keyRow = mk("div", "btnrow"); keyRow.style.marginBottom = "6px";
    inst.ki.els.key = mk("input", "pbnet-field"); inst.ki.els.key.type = "password"; inst.ki.els.key.placeholder = T("KI-Schlüssel (bleibt in diesem Browser)"); inst.ki.els.key.autocomplete = "off"; inst.ki.els.key.style.cssText += ";flex:1;min-width:150px";
    var keyLink = document.createElement("a"); keyLink.textContent = T("🔑 Schlüssel holen ↗"); keyLink.target = "_blank"; keyLink.rel = "noopener"; keyLink.className = "pbnet-mini"; keyLink.style.cssText = "align-self:center;color:var(--acc);text-decoration:none;font-size:.74rem;white-space:nowrap";
    inst.ki.els.keyLink = keyLink;
    keyRow.appendChild(inst.ki.els.key); keyRow.appendChild(keyLink);
    body.appendChild(keyRow);

    var tresRow = mk("div", "btnrow");
    var saveBtn = mk("button", "ghost pbnet-mini", T("🔒 im Tresor merken")); saveBtn.type = "button";
    inst.ki.els.unlock = mk("button", "ghost pbnet-mini", T("🔓 Tresor entsperren")); inst.ki.els.unlock.type = "button"; inst.ki.els.unlock.style.display = "none";
    tresRow.appendChild(saveBtn); tresRow.appendChild(inst.ki.els.unlock);
    body.appendChild(tresRow);

    inst.ki.els.status = mk("div"); inst.ki.els.status.style.cssText = "margin-top:6px;font-size:.72rem;color:var(--mut);white-space:pre-wrap";
    body.appendChild(inst.ki.els.status);
    body.appendChild(mk("p", null, T("Der Schlüssel bleibt nur in diesem Browser (im 🔒 Tresor AES-verschlüsselt, nie im Klartext). Beim Bewerten reisen die Frage + die Kurz-Antworten zur gewählten KI — sonst nichts."))).style.cssText = "margin:7px 0 0;color:var(--mut);font-size:.7rem";

    sec.appendChild(body);
    wrap.appendChild(sec);

    // Verdrahtung
    inst.ki.els.toggle.addEventListener("click", function () { inst.ki.on = !inst.ki.on; persistKi(inst); syncKiUI(inst); if (inst.ki.on) { refreshProviders(inst); refreshTresorState(inst); } });
    inst.ki.els.euBtn.addEventListener("click", function () { inst.ki.euOnly = !inst.ki.euOnly; persistKi(inst); syncKiUI(inst); refreshProviders(inst); refreshTresorState(inst); });
    inst.ki.els.prov.addEventListener("change", function () { inst.ki.provider = inst.ki.els.prov.value; persistKi(inst); updateKeyLink(inst); refreshTresorState(inst); inst.ki.key = (inst.ki.els.key.value || "").trim() || inst.ki.key; });
    inst.ki.els.key.addEventListener("input", function () { inst.ki.key = (inst.ki.els.key.value || "").trim(); });
    keyLink.addEventListener("click", function (e) { var url = KEY_PAGES[inst.ki.provider] || ""; if (!url) { e.preventDefault(); kiStatus(inst, "Für diesen Anbieter keine Schlüssel-Seite hinterlegt."); } });
    saveBtn.addEventListener("click", function () { doTresorSave(inst); });
    inst.ki.els.unlock.addEventListener("click", function () { doTresorUnlock(inst); });

    refreshProviders(inst); syncKiUI(inst); refreshTresorState(inst);
  }
  function persistKi(inst) { saveKiPref({ on: inst.ki.on, provider: inst.ki.provider, euOnly: inst.ki.euOnly }); syncAllKiPrefs(inst); }
  // beide Mounts sollen dieselbe Vorwahl zeigen (Schlüssel bleibt pro Mount im RAM)
  function syncAllKiPrefs(source) {
    instances.forEach(function (inst) {
      if (inst === source || !inst.ki) return;
      inst.ki.on = source.ki.on; inst.ki.provider = source.ki.provider; inst.ki.euOnly = source.ki.euOnly;
      syncKiUI(inst); refreshProviders(inst); refreshTresorState(inst);
    });
  }
  async function doTresorSave(inst) {
    var key = (inst.ki.els.key.value || "").trim();
    if (!key) { kiStatus(inst, "Bitte zuerst den KI-Schlüssel eintragen."); return; }
    if (!SAFE() || typeof SAFE().putSecret !== "function") { kiStatus(inst, "Tresor (Modul 20) nicht geladen — Schlüssel bleibt nur bis zum Neuladen."); return; }
    var pw = window.prompt("Tresor-Passwort wählen (mind. 8 Zeichen). Damit wird der KI-Schlüssel verschlüsselt gespeichert — er überlebt Neuladen, liegt nie im Klartext.");
    if (pw == null) return;
    if (pw.length < 8) { kiStatus(inst, "Passwort zu kurz (mind. 8 Zeichen) — nicht gespeichert."); return; }
    try { await SAFE().putSecret(kiSecretName(inst.ki.provider), key, pw); inst.ki.key = key; kiStatus(inst, "🔒 Im Tresor gemerkt. Nächstes Mal „🔓 Tresor entsperren“ mit demselben Passwort."); refreshTresorState(inst); }
    catch (e) { kiStatus(inst, "Speichern fehlgeschlagen: " + errMsg(e)); }
  }
  async function doTresorUnlock(inst) {
    if (!SAFE() || typeof SAFE().getSecret !== "function") { kiStatus(inst, "Tresor (Modul 20) nicht geladen."); return; }
    var pw = window.prompt("Tresor-Passwort eingeben, um den gespeicherten KI-Schlüssel zu laden:");
    if (pw == null) return;
    try {
      var key = await SAFE().getSecret(kiSecretName(inst.ki.provider), pw);
      if (key) { inst.ki.key = key; if (inst.ki.els.key) inst.ki.els.key.value = key; kiStatus(inst, "🔓 Schlüssel geladen — KI-Richter kann bewerten."); }
      else { kiStatus(inst, "Kein Schlüssel / falsches Passwort."); }
    } catch (e) { kiStatus(inst, "Entsperren fehlgeschlagen: " + errMsg(e)); }
  }

  // ================= Werkzeug-Körper bauen (im Flieger montiert) =================
  function buildTool(container, prefix) {
    injectStyle();
    var els = {};
    var wrap = mk("div", "pbnet-tool"); wrap.style.cssText = "font:.84rem var(--sans,system-ui);color:var(--ink)";

    // Gerätename (lokal, kein PII): frei wählbarer Anzeige-Name, reist als Hinweis mit.
    // SICHERHEIT: nur Anzeige, nie Vertrauen — erscheint im Raum NEBEN der Kennung.
    // Lebt jetzt hier im Flieger (kein fester Netz-Tab mehr). Beim Tippen wird der Name
    // gespeichert + 'sbkim:geraetename-changed' gefeuert; rendezvous-init.js hört darauf
    // und re-konfiguriert den Anzeige-Namen (displayNodeName).
    var gnWrap = mk("div"); gnWrap.style.cssText = "margin:0 0 10px";
    var gnLab = mk("label"); gnLab.style.cssText = "display:block;font-size:.76rem;font-weight:600;color:var(--mut);margin-bottom:4px"; gnLab.textContent = T("🏷️ Gerätename");
    els.geraetename = mk("input", "pbnet-gnfield"); els.geraetename.type = "text"; els.geraetename.maxLength = 40;
    els.geraetename.placeholder = T("z. B. Klaus-Handy (frei wählbar)");
    els.geraetename.style.cssText += ";width:100%";
    try { els.geraetename.value = getGeraetename(); } catch (_e) {}
    els.geraetename.addEventListener("input", function () {
      setGeraetename(els.geraetename.value);
      try { window.dispatchEvent(new CustomEvent("sbkim:geraetename-changed")); } catch (_e) {}
    });
    var gnHint = mk("div", "hint"); gnHint.style.cssText = "margin-top:4px;font-size:.72rem;color:var(--mut)";
    gnHint.textContent = T("Erscheint im Raum neben dem App-Namen (z. B. „Private Brain · Klaus-Handy“), damit man zwei Geräte auseinanderhält — nur ein Hinweis, kein Vertrauens-Beweis; die Kennung bleibt daneben.");
    gnLab.appendChild(els.geraetename); gnWrap.appendChild(gnLab); gnWrap.appendChild(gnHint);
    wrap.appendChild(gnWrap);

    // Hauptaktions-Zeile (nur „Verbinden" ist .primary; Rest schlank)
    var row1 = mk("div", "btnrow"); row1.style.marginTop = "2px";
    var connectBtn = mk("button", "primary", T("🌐 Verbinden & anmelden")); connectBtn.type = "button";
    var discoverBtn = mk("button", "ghost pbnet-mini", T("👥 Wer ist im Raum?")); discoverBtn.type = "button";
    var announceBtn = mk("button", "ghost pbnet-mini", T("🙋 Nur neu anmelden")); announceBtn.type = "button";
    row1.appendChild(connectBtn); row1.appendChild(discoverBtn); row1.appendChild(announceBtn);
    wrap.appendChild(row1);

    // Frage-nach-Bedeutung-Zeile + Mikrofon
    var qWrap = mk("div"); qWrap.style.cssText = "margin-top:10px";
    qWrap.appendChild(mk("div", null, T("🔎 Netzweite Frage — wer im Raum kann das?"))).style.cssText = "font-size:.76rem;color:var(--mut);margin-bottom:5px";
    var qrow = mk("div", "btnrow");
    els.query = mk("input", "pbnet-field"); els.query.type = "text"; els.query.placeholder = T("Frage nach Bedeutung, z. B. „ich suche Rezepte, wer kann helfen?“"); els.query.style.cssText += ";flex:1;min-width:150px";
    var askBtn = mk("button", "ghost pbnet-mini", T("🔎 Antwort holen")); askBtn.type = "button";
    els.mic = mk("button", "ghost pbnet-mini", "🎤"); els.mic.type = "button"; els.mic.title = T("Frage sprechen");
    qrow.appendChild(els.query); qrow.appendChild(askBtn); qrow.appendChild(els.mic);
    qWrap.appendChild(qrow);
    wrap.appendChild(qWrap);

    // Umschalter-Zeile: Antworten an/aus · nur verwandte
    var togRow = mk("div", "btnrow"); togRow.style.marginTop = "9px";
    els.answerBtn = mk("button", "ghost pbnet-mini", T("💬 Antworten: aus")); els.answerBtn.type = "button";
    els.relBtn = mk("button", "ghost pbnet-mini", ""); els.relBtn.type = "button";
    togRow.appendChild(els.answerBtn); togRow.appendChild(els.relBtn);
    wrap.appendChild(togRow);

    // Fortschritt + Ausgabe
    els.prog = mk("div"); els.prog.style.cssText = "display:none;margin:9px 0 0;font:.74rem var(--mono,monospace);color:var(--acc);white-space:pre-wrap";
    wrap.appendChild(els.prog);
    els.out = mk("pre"); els.out.style.cssText = "white-space:pre-wrap;background:var(--field);border:1px solid var(--line);border-radius:10px;padding:10px;font-size:.76rem;line-height:1.5;margin:10px 0 0;min-height:1.4em;color:var(--ink);word-break:break-word";
    els.out.textContent = T("Noch nicht verbunden.");
    wrap.appendChild(els.out);

    els.room = mk("div"); wrap.appendChild(els.room);

    // Briefkasten-Zeile
    var mailRow = mk("div", "btnrow"); mailRow.style.cssText = "margin-top:12px;padding-top:10px;border-top:1px solid var(--line)";
    els.mailBtn = mk("button", "ghost pbnet-mini", T("📬 Antworten abholen")); els.mailBtn.type = "button";
    var reaskBtn = mk("button", "ghost pbnet-mini", T("💬 offene nochmal fragen")); reaskBtn.type = "button";
    var clearBtn = mk("button", "ghost pbnet-mini", T("🗑 leeren")); clearBtn.type = "button";
    mailRow.appendChild(els.mailBtn); mailRow.appendChild(reaskBtn); mailRow.appendChild(clearBtn);
    wrap.appendChild(mailRow);
    els.mail = mk("div"); wrap.appendChild(els.mail);

    var kiPref = loadKiPref();
    var kiInst = { on: !!kiPref.on, provider: kiPref.provider || "mistral", euOnly: kiPref.euOnly !== false, key: null, els: {} };

    var inst = { prefix: prefix, els: els, badge: null, relatedOnly: loadRelOnly(), _cards: [], _rec: null, ki: kiInst, selected: {} };
    inst.prog = makeProg(els.prog);
    instances.push(inst);

    // KI-Richter-Abschnitt (opt-in/BYOK) — über den destruktiven „Aufräumen"-Knopf
    buildKiSection(inst, wrap);

    wrap.appendChild(mk("p", null, T("Nur deine öffentliche Visitenkarte (Name + Bedeutung deiner Sammlung) wird gezeigt — privater Schlüssel & Dateien bleiben in diesem Browser."))).style.cssText = "margin:12px 0 0;color:var(--mut);font-size:.72rem";

    // Aufräumen (destruktiv) unten
    var repRow = mk("div", "btnrow"); repRow.style.marginTop = "8px";
    var repairBtn = mk("button", "ghost pbnet-mini", T("🧹 Aufräumen & neu anmelden")); repairBtn.type = "button";
    repRow.appendChild(repairBtn);
    wrap.appendChild(repRow);

    container.appendChild(wrap);

    function syncRel() { els.relBtn.textContent = inst.relatedOnly ? T("🧬 nur verwandte: an") : T("🧬 nur verwandte: aus"); }
    syncRel();

    connectBtn.addEventListener("click", function () { doConnect(inst); });
    discoverBtn.addEventListener("click", function () { doDiscover(inst); });
    announceBtn.addEventListener("click", function () { doAnnounceOnly(inst); });
    askBtn.addEventListener("click", function () { doAutoAsk(inst); });
    els.query.addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); doAutoAsk(inst); } });
    els.mic.addEventListener("click", function () { doMic(inst); });
    els.answerBtn.addEventListener("click", function () { doAnswerToggle(inst); });
    els.relBtn.addEventListener("click", function () { inst.relatedOnly = !inst.relatedOnly; saveRelOnly(inst.relatedOnly); syncRel(); if (inst._cards && inst._cards.length) renderRoom(inst, inst._cards); });
    els.mailBtn.addEventListener("click", function () { doMailbox(inst); });
    reaskBtn.addEventListener("click", function () { doReaskOpen(inst); });
    clearBtn.addEventListener("click", function () { savePending([]); updateAll(); renderMail(inst, []); out(inst, T("📬 Briefkasten geleert.")); });
    repairBtn.addEventListener("click", function () { doRepair(inst); });

    if (!R()) out(inst, T("Netz-Modul (Modul 23) nicht geladen — „Mit dem Knotennetz verbinden“ ist aus."));
    renderMail(inst, loadPending());
    return inst;
  }

  // ================= Schwebender Knopf + Panel =================
  var btnEl, badgeEl, panelEl, bodyEl, minBtnEl, introEl;
  var INTRO_KEY = "pb_net_intro_" + DB_SUFFIX;   // Erklär-Text auf/zu (💬), gemerkt
  // EIN Ding zur Zeit + EIN Klick (wie die Sage-Referenz, Klaus 2026-07-19):
  //  - Öffner-Knopf/Blase antippen  → Panel geht VOLL auf, die Blase verschwindet.
  //  - „–" ODER „✕"                 → Panel zu, die Blase kommt zurück.
  // KEIN Einklappen-auf-die-Titelleiste mehr (das erzwang 2–3 Klicks bis zum vollen
  // Panel und wieder zurück). Beides lässt die Verbindung (Modul 23) unberührt.
  function openPanel() { if (panelEl) { panelEl.style.display = "flex"; if (btnEl) btnEl.style.display = "none"; try { localStorage.setItem(OPEN_KEY, "1"); } catch (_e) {} } }
  function closePanel() { if (panelEl) { panelEl.style.display = "none"; if (btnEl) btnEl.style.display = "flex"; try { localStorage.setItem(OPEN_KEY, "0"); } catch (_e) {} } }
  function togglePanel() { if (panelEl) { (panelEl.style.display === "none" || !panelEl.style.display) ? openPanel() : closePanel(); } }
  // 💬 = den Erklär-Text oben auf-/zuklappen (wie der Tooltip-Knopf im Original).
  function introShown() { try { return localStorage.getItem(INTRO_KEY) !== "0"; } catch (_e) { return true; } }
  function applyIntro(v) { try { localStorage.setItem(INTRO_KEY, v ? "1" : "0"); } catch (_e) {} if (introEl) introEl.style.display = v ? "block" : "none"; }
  function toggleIntro() { applyIntro(!introShown()); }

  function mountFlying() {
    if (document.getElementById("pbNetBtn")) return;
    var pos = null; try { pos = JSON.parse(localStorage.getItem(POS_KEY) || "null"); } catch (_e) {}

    btnEl = el("button",
      "position:fixed;z-index:2147483000;left:16px;bottom:16px;padding:11px 15px;border-radius:999px;" +
      "border:1px solid var(--line);background:var(--card);color:var(--ink);font:600 .84rem var(--sans,system-ui);" +
      "box-shadow:var(--shadow,0 10px 30px rgba(0,0,0,.35));cursor:pointer;display:flex;align-items:center;gap:7px;touch-action:none");
    btnEl.id = "pbNetBtn"; btnEl.type = "button";
    btnEl.setAttribute("aria-label", T("Mit dem Knotennetz verbinden"));
    btnEl.appendChild(el("span", "font-size:1.05rem", "🌐"));
    // Voller Titel „Mit dem Knotennetz verbinden" wie in der Sage-Referenz (Klaus
    // 2026-07-19). Es gibt keine Doppelung mehr: sobald das Panel offen ist, ist die
    // Blase weg (openPanel blendet btnEl aus) — Öffner und Panel sind nie gleichzeitig da.
    btnEl.appendChild(el("span", "", T("Mit dem Knotennetz verbinden")));
    badgeEl = el("span", "display:none;place-items:center;min-width:19px;height:19px;padding:0 5px;border-radius:999px;background:#c0563d;color:#fff;font:700 .7rem var(--mono,monospace);margin-left:2px");
    badgeEl.id = "pbNetBadge"; btnEl.appendChild(badgeEl);
    if (pos && typeof pos.left === "number" && typeof pos.top === "number") { btnEl.style.left = pos.left + "px"; btnEl.style.top = pos.top + "px"; btnEl.style.right = "auto"; btnEl.style.bottom = "auto"; }

    panelEl = el("div",
      "position:fixed;z-index:2147483001;left:16px;bottom:70px;width:min(400px,94vw);max-height:80vh;display:none;" +
      "flex-direction:column;background:var(--card);color:var(--ink);border:1px solid var(--line);border-radius:16px;" +
      "box-shadow:var(--shadow,0 20px 50px rgba(0,0,0,.45));overflow:hidden;font:.84rem var(--sans,system-ui)");
    panelEl.id = "pbNetPanel";
    var head = el("div", "display:flex;align-items:center;gap:8px;padding:11px 13px;border-bottom:1px solid var(--line);background:var(--card2);cursor:move;touch-action:none");
    head.id = "pbNetHead";
    head.appendChild(el("strong", "flex:1;color:var(--ink);font-weight:700", T("🌐 Mit dem Knotennetz verbinden")));
    // 💬 = Erklär-Text oben auf-/zuklappen (wie der Tooltip-Knopf im Sage-Original).
    // „–" UND „✕" schließen BEIDE das Panel (Blase kommt zurück) — EIN Klick auf, EIN
    // Klick zu, kein Zwischen-Zustand. Verbindung (Modul 23) bleibt in beiden Fällen.
    var tipBtn = el("button", "background:none;border:none;color:var(--mut);font-size:1.05rem;line-height:.6;cursor:pointer;padding:0 6px", "💬");
    tipBtn.type = "button"; tipBtn.title = T("Erklärung ein-/ausblenden"); tipBtn.setAttribute("aria-label", T("Erklärung ein-/ausblenden"));
    tipBtn.addEventListener("click", toggleIntro);
    minBtnEl = el("button", "background:none;border:none;color:var(--mut);font-size:1.5rem;line-height:.6;cursor:pointer;padding:0 6px", "–");
    minBtnEl.type = "button"; minBtnEl.title = T("Zuklappen (Verbindung bleibt)"); minBtnEl.setAttribute("aria-label", T("Zuklappen"));
    minBtnEl.addEventListener("click", closePanel);
    var closeBtn = el("button", "background:none;border:none;color:var(--mut);font-size:1.15rem;line-height:.6;cursor:pointer;padding:0 6px 0 2px", "✕");
    closeBtn.type = "button"; closeBtn.title = T("Schließen (Verbindung bleibt bestehen)"); closeBtn.setAttribute("aria-label", T("Schließen"));
    closeBtn.addEventListener("click", closePanel);
    head.appendChild(tipBtn); head.appendChild(minBtnEl); head.appendChild(closeBtn); panelEl.appendChild(head);

    var body = el("div", "padding:12px 13px;overflow:auto"); bodyEl = body;
    introEl = el("p", "margin:0 0 8px;color:var(--mut);font-size:.8rem",
      T("Server-los, optional. „Verbinden“ trägt deine Visitenkarte in den Raum; „Wer ist im Raum?“ zeigt die anderen. Es reisen nur Fragen & Antworten — keine Dateien. „–“ oder „✕“ schließen das Fenster (der 🌐-Knopf holt es zurück) — beides lässt die Verbindung bestehen (nur bei einer Änderung „🙋 Nur neu anmelden“). 💬 blendet diese Erklärung aus. Deine Fragen bleiben im 📬 Briefkasten (löschbar)."));
    applyIntro(introShown());
    body.appendChild(introEl);
    var inst = buildTool(body, "pbfly");
    inst.badge = badgeEl;
    panelEl.appendChild(body);

    document.body.appendChild(btnEl); document.body.appendChild(panelEl);
    wireDrag(btnEl, function () { togglePanel(); });
    wireDrag(head, null, panelEl);

    updateAll(); syncAnswerButtons();
    try { if (localStorage.getItem(OPEN_KEY) === "1") openPanel(); } catch (_e) {}
  }

  // Drag mit Klick-Unterscheidung: < 5 px = Klick.
  function wireDrag(handle, onClick, moveTarget) {
    var target = moveTarget || handle;
    var startX = 0, startY = 0, baseL = 0, baseT = 0, moved = false, dragging = false;
    handle.addEventListener("pointerdown", function (e) {
      if (e.button != null && e.button !== 0) return;
      // Tipp auf einen INNEREN Knopf (z. B. –/✕ in der Kopfzeile) NICHT als Ziehen
      // werten und NICHT den Pointer fangen — sonst schluckt der Ziehgriff den Klick
      // und die Knöpfe reagieren nicht (Klaus 2026-07-18).
      var innerBtn = (e.target && e.target.closest) ? e.target.closest("button") : null;
      if (innerBtn && innerBtn !== handle) return;
      dragging = true; moved = false; startX = e.clientX; startY = e.clientY;
      var r = target.getBoundingClientRect(); baseL = r.left; baseT = r.top;
      try { handle.setPointerCapture(e.pointerId); } catch (_e) {}
    });
    handle.addEventListener("pointermove", function (e) {
      if (!dragging) return;
      var dx = e.clientX - startX, dy = e.clientY - startY;
      if (!moved && Math.abs(dx) + Math.abs(dy) > 5) moved = true;
      if (moved) {
        var nl = Math.max(4, Math.min(window.innerWidth - target.offsetWidth - 4, baseL + dx));
        var nt = Math.max(4, Math.min(window.innerHeight - 40, baseT + dy));
        target.style.left = nl + "px"; target.style.top = nt + "px"; target.style.right = "auto"; target.style.bottom = "auto";
      }
    });
    handle.addEventListener("pointerup", function (e) {
      if (!dragging) return; dragging = false;
      try { handle.releasePointerCapture && handle.releasePointerCapture(e.pointerId); } catch (_e) {}
      if (moved && target === btnEl) { try { var r = btnEl.getBoundingClientRect(); localStorage.setItem(POS_KEY, JSON.stringify({ left: Math.round(r.left), top: Math.round(r.top) })); } catch (_e) {} }
      if (!moved && typeof onClick === "function") onClick();
    });
  }


  /* ─────────────────────────────────────────────────────────────────────────
   * SPRACHWECHSEL IM LAUFENDEN BETRIEB
   *
   * ⚠ DAS PANEL WIRD BEIM LADEN GEBAUT, NICHT BEIM OEFFNEN. `T()` wirkt in dem
   * Augenblick, in dem ein Text ENTSTEHT — wer danach die Sprache umschaltet,
   * bekommt die alten Saetze. **Gemessen am 2026-09-16 im echten Browser:** mit
   * `<html lang="en">` nach dem Laden stand das Fenster vollstaendig auf
   * Deutsch, obwohl Tabelle und `T()` tadellos waren.
   *
   * ⚠ EIN WAECHTER AUF DIE TABELLE HAETTE DAS NICHT GESEHEN. Er liest den
   * Quelltext; hier ging es um den Schirm. Gefunden hat es die Browser-Haelfte
   * der Probe, nicht das Nachdenken.
   *
   * Private Brains eigener Sprachwaehler setzt `<html lang>` (index.html,
   * `documentElement.setAttribute("lang", curLang)`). Das Fenster hoert darauf
   * und **mountet sich neu** — ueber DIESELBE `mountFlying()`. Ein zweiter
   * Nachtrage-Weg waere eine zweite Fassung derselben Beschriftungen, und zwei
   * Fassungen laufen auseinander.
   *
   * ⚠ WAS GETIPPT WURDE, WIRD GERETTET. Ein Sprachwechsel darf keine halb
   * geschriebene Frage und keinen Gereatenamen wegwerfen. Auf/Zu, Lage und
   * Erklaer-Zustand liegen ohnehin im localStorage und kommen von selbst zurueck.
   * Die Verbindung selbst lebt in Modul 23, nicht im DOM — sie bleibt unberuehrt.
   * ───────────────────────────────────────────────────────────────────────── */

  /* Rueckwaerts: eine englische Fassung auf ihren deutschen Schluessel abbilden.
   * Einmal gebaut, danach nachgeschlagen. Ohne Treffer: unveraendert zurueck. */
  var RUECK = null;
  function nachDeutsch(txt) {
    if (RUECK === null) {
      RUECK = {};
      for (var k in TEXTE.en) {
        if (Object.prototype.hasOwnProperty.call(TEXTE.en, k)) RUECK[TEXTE.en[k]] = k;
      }
    }
    return Object.prototype.hasOwnProperty.call(RUECK, txt) ? RUECK[txt] : txt;
  }

  var letzteSprache = sprache();
  function beiSprachwechsel() {
    var jetzt = sprache();
    if (jetzt === letzteSprache) return;
    letzteSprache = jetzt;
    if (!document.getElementById("pbNetBtn")) return;
    var alt = (instances[0] && instances[0].els) || {};
    var rett = {
      query: alt.query ? alt.query.value : null,
      geraetename: alt.geraetename ? alt.geraetename.value : null,
      out: alt.out ? alt.out.textContent : null
    };
    try { if (panelEl && panelEl.parentNode) panelEl.parentNode.removeChild(panelEl); } catch (_e) {}
    try { if (btnEl && btnEl.parentNode) btnEl.parentNode.removeChild(btnEl); } catch (_e) {}
    panelEl = btnEl = bodyEl = badgeEl = introEl = minBtnEl = null;
    instances.length = 0;
    mountFlying();
    var neu = (instances[0] && instances[0].els) || {};
    if (rett.query != null && neu.query) neu.query.value = rett.query;
    if (rett.geraetename != null && neu.geraetename) neu.geraetename.value = rett.geraetename;
    // ⚠ DIE GERETTETE STATUSZEILE IST SELBST UEBERSETZT. Sie woertlich
    // hinueberzureichen holt einen deutschen Satz in die englische Oberflaeche
    // zurueck — genau die halb uebersetzte Tafel, gegen die alles hier gebaut
    // ist. Gefunden hat es der Waechter „KEIN deutscher Tabellen-Satz bleibt
    // stehen", nicht das Nachdenken. Sie wird deshalb erst nach DEUTSCH
    // normalisiert und dann neu uebersetzt — das traegt BEIDE Richtungen.
    //
    // ⚠ BENANNTE GRENZE: eine Zeile, die aus Bruchstuecken UND einem Knoten-
    // Namen zusammengesetzt ist ("✓ Antwort von „Kimboard" — siehe unten."),
    // steht so in keiner Tabelle und behaelt ihren Wortlaut bis zur naechsten
    // Aktion. Sie zu zerlegen hiesse raten, und Raten ist hier teurer als ein
    // Satz, der eine Handlung lang in der alten Sprache stehenbleibt.
    if (rett.out != null && neu.out) neu.out.textContent = T(nachDeutsch(rett.out));
  }
  try {
    if (typeof MutationObserver === "function" && typeof document !== "undefined") {
      new MutationObserver(beiSprachwechsel).observe(document.documentElement,
        { attributes: true, attributeFilter: ["lang"] });
    }
  } catch (_e) {}

  // Öffentliche Mini-Fläche (für Tests)
  window.PBNetWidget = {
    open: openPanel, close: closePanel, toggle: togglePanel,
    isOpen: function () { return !!(panelEl && panelEl.style.display === "flex"); },
    pendingCount: function () { return loadPending().length; },
    _meta: { version: "2.3", native: true, themed: true, stage: "C", onlyFlyer: true },
    lang: function () { return sprache(); },
    langKeys: function () { return Object.keys(TEXTE.en).length; },
  };

  // NUR der schwebende Flieger (kein fester Netz-Tab mehr — Klaus 2026-07-19).
  function boot() { mountFlying(); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
