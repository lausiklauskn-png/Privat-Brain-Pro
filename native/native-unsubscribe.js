/* Newsletter unsubscribe ways (Klaus 2026-10-21: "aus den Newslettern den unsichtbaren Bereich
   herauslesen … direkt aus der E-Mail kündigen"). Pure helpers, no network:
   - parse(): the hidden List-Unsubscribe field (already filtered on Android to https/mailto).
   - pageLink(): the visible "abmelden" link in the mail text, when the hidden field has none.
   - way(): which of the three ways applies: one-click POST, unsubscribe mail, or the web page. */
(() => {
  'use strict';
  const WORDS = /(abmeld|abbestell|austrag|unsubscri|opt[\s-]?out|newsletter\s*k(ü|ue)ndig|отпис|wypisz|rezygnuj)/i;
  const httpsOnly = u => { try { const x = new URL(u); return x.protocol === 'https:' && x.hostname.includes('.') && !x.username ? x.href : ''; } catch { return ''; } };

  function parse(header) {
    const out = { https: '', mailto: '' };
    for (const m of String(header || '').matchAll(/<([^<>\s]{1,1500})>/g)) {
      const uri = m[1];
      if (!out.https && /^https:\/\//i.test(uri)) out.https = httpsOnly(uri);
      if (!out.mailto && /^mailto:/i.test(uri)) out.mailto = uri;
    }
    return out;
  }

  /** mailto:list@example.com?subject=unsubscribe&body=… → {to, subject, text}; one plain address only. */
  function mailto(uri) {
    const m = /^mailto:([^?]+)(?:\?(.*))?$/i.exec(String(uri || ''));
    if (!m) return null;
    let to = ''; try { to = decodeURIComponent(m[1]).trim(); } catch { return null; }
    if (!/^[^\s@,;<>"]+@[^\s@,;<>"]+\.[^\s@,;<>"]+$/.test(to)) return null;
    const q = new URLSearchParams(m[2] || '');
    const clean = (v, max) => String(v || '').replace(/[\r\n]+/g, ' ').trim().slice(0, max);
    return { to, subject: clean(q.get('subject'), 200) || 'unsubscribe', text: String(q.get('body') || 'unsubscribe').slice(0, 2000) };
  }

  /** The link whose own text or nearby words say "abmelden" / "unsubscribe" (https only). */
  function pageLink(html, text) {
    if (html) {
      const doc = new DOMParser().parseFromString(String(html).slice(0, 200000), 'text/html');
      for (const a of doc.querySelectorAll('a[href]')) {
        const href = httpsOnly(a.getAttribute('href') || '');
        if (!href) continue;
        const around = (a.textContent || '') + ' ' + (a.getAttribute('title') || '') + ' ' + (a.parentElement?.textContent || '').slice(0, 300);
        if (WORDS.test(a.textContent || '') || WORDS.test(href) || WORDS.test(around)) return href;
      }
    }
    const value = String(text || '');
    for (const m of value.matchAll(/https:\/\/[^\s<>"'\u0000-\u001f]+/gi)) {
      const href = httpsOnly(m[0].replace(/[.,;!?)\]]+$/, ''));
      const near = value.slice(Math.max(0, m.index - 120), m.index + m[0].length + 40);
      if (href && (WORDS.test(href) || WORDS.test(near))) return href;
    }
    return '';
  }

  /** One-click needs both the https address and the sender's RFC 8058 consent. */
  function way(info) {
    if (!info) return null;
    if (info.oneClick && info.https) return { kind: 'oneclick', url: info.https };
    const mail = info.mailto && mailto(info.mailto);
    if (mail) return { kind: 'mail', ...mail };
    if (info.https || info.page) return { kind: 'page', url: info.https || info.page };
    return null;
  }

  // Rule hits that mean "possibly spam or fraud": unsubscribing would only confirm the address.
  const SUSPECT = new Set(['auth-fail', 'provider-spam', 'brand-mismatch', 'lookalike', 'punycode', 'link-ip', 'link-at', 'pressure']);
  function suspicious(result) { return Boolean(result?.items?.some(i => SUSPECT.has(i.code))); }

  window.PBUnsub = { parse, mailto, pageLink, way, suspicious, SUSPECT };
})();
