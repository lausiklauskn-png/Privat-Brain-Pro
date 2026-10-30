/* „Überall suchen“ in Private Brain Pro (Pro-Umbau 12, Klaus m7 2026-10-30). Der Kasten selbst ist der gemeinsame Baustein
   native/pro-ueberall.js (hier gepflegt, byte-gleich in Workflow PDF Pro); diese Datei sagt nur, was Private Brain dazugibt:
   • diese App: Wortsuche über den Katalog (Name, Pfad, Kurzfassung, Tags, Kategorie, Absender, Mailtext) — dieselbe Frage wie im Suchfeld
   • Tresorordner: die Fächer der anderen Pro-Apps über ProVault.tresorFach (nur in der Android-App, nur bei offenem Tresorordner);
     das eigene Fach „Private Brain“ nicht, das ist ja der Katalog oben
   • Netz: Modul 23 (window.SbkimRendezvous, byte-1:1) — nur mit Haken
   Ein Tipp auf eine Zeile dieser App öffnet die Datei wie in der Trefferliste (openFile). */
(() => {
  'use strict';
  if (window.PBUeberall) return;
  const vault = () => window.Capacitor?.Plugins?.ProVault;
  function tresor() {
    const api = vault();
    if (!api || typeof api.tresorFach !== 'function' || typeof api.tresorZustand !== 'function') return null;
    return {
      zustand: async () => { const z = await api.tresorZustand({}); return { gewaehlt: !!z.gewaehlt, offen: !!(z.offen) }; },
      fach: fach => api.tresorFach({ fach })
    };
  }
  const katalog = () => (typeof CATALOG !== 'undefined' ? CATALOG : window.CATALOG) || [];
  const text = r => [r.name, r.path, r.summary, r.snippet, Array.isArray(r.tags) ? r.tags.join(' ') : '', r.category,
    r.mail && r.mail.from, r.caption, typeof r.mailBody === 'string' ? r.mailBody.slice(0, 4000) : ''].filter(Boolean).join(' · ');
  function appSuchen(frage) {
    return window.ProUeberall.listeSuchen(katalog(), frage, { herkunft: 'app', typ: r => (r.mailBody != null ? 'mail' : 'datei'),
      text, name: r => r.name || r.path || r.hash, id: r => r.hash });
  }
  function einsetzen() {
    if (!window.ProUeberall || !window.ProBedienung) return false;
    const panel = document.getElementById('panel-search');
    if (!panel || panel.querySelector('[data-pro-ue]')) return Boolean(panel);
    const k = window.ProUeberall.kasten({
      appName: 'Private Brain Pro', eigenesFeld: false, frage: () => document.getElementById('q')?.value || '',
      app: appSuchen, tresor, tresorOhne: ['private-brain'], netz: () => window.SbkimRendezvous || null,
      mycelOeffnen: () => { try { window.SbkimRendezvousUI?.show?.(); } catch { /* fail-soft */ } },
      kannOeffnen: z => z.herkunft === 'app', oeffnen: z => { if (typeof window.openFile === 'function') void window.openFile(z.id); }
    });
    k.element.id = 'pbUeberall';
    const vor = document.getElementById('results');
    panel.insertBefore(k.element, vor || null);
    window.PBUeberall = { element: k.element, suchen: k.suchen };
    return true;
  }
  if (!einsetzen()) document.addEventListener('DOMContentLoaded', einsetzen, { once: true });
})();
