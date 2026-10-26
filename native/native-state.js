/* Klaus 2026-10-26 (Sitzung 1, Punkt 9c): Einstellungen → „Zustand“ (ohne „— ehrlich“), kurz erklärt;
   „Katalog-Größe“ heißt „Speicher“ und bekommt einen Füllbalken. Der Balken zeigt, wie viel vom Platz belegt ist,
   den das System dieser App zugesteht (navigator.storage.estimate) – nicht den freien Platz des ganzen Geräts.
   Die Katalog-Größe bleibt als Zahl daneben stehen. Gleiche Datei in Private Brain Pro und V3. */
(() => {
  'use strict';
  const words = {
    de: { head: 'Zustand', lead: 'Was diese App gerade gespeichert hat.', storage: 'Speicher', catalog: 'Katalog', used: 'belegt', of: 'von', unknown: 'Belegung unbekannt', title: 'Balken: belegter Anteil des Platzes, den das System dieser App zugesteht. Nicht der freie Platz des ganzen Geräts.' },
    en: { head: 'Status', lead: 'What this app has stored right now.', storage: 'Storage', catalog: 'Catalogue', used: 'used', of: 'of', unknown: 'Usage unknown', title: 'Bar: used share of the space the system allows this app. Not the free space of the whole device.' },
    ru: { head: 'Состояние', lead: 'Что приложение сейчас хранит.', storage: 'Память', catalog: 'Каталог', used: 'занято', of: 'из', unknown: 'Занятость неизвестна', title: 'Полоса: занятая доля места, которое система выделяет приложению. Не свободное место всего устройства.' },
    pl: { head: 'Stan', lead: 'Co ta aplikacja teraz przechowuje.', storage: 'Pamięć', catalog: 'Katalog', used: 'zajęte', of: 'z', unknown: 'Zajętość nieznana', title: 'Pasek: zajęta część miejsca, które system przyznaje tej aplikacji. Nie wolne miejsce całego urządzenia.' }
  };
  const t = k => (words[document.documentElement.lang] || words.de)[k];
  const size = n => n < 1024 ? n + ' B' : n < 1048576 ? (n / 1024).toFixed(1) + ' KB' : n < 1073741824 ? (n / 1048576).toFixed(1) + ' MB' : (n / 1073741824).toFixed(1) + ' GB';
  function start() {
    const value = document.getElementById('stSize'); if (!value) return;
    const box = value.closest('.note'), heading = box?.querySelector('h3'), key = value.previousElementSibling;
    if (!box || !heading || !key) return;
    box.classList.add('pb-state');
    const lead = document.createElement('p'); lead.className = 'pb-state-lead'; heading.after(lead);
    const meter = document.createElement('span'); meter.className = 'pb-state-meter'; meter.setAttribute('role', 'meter'); meter.setAttribute('aria-valuemin', '0'); meter.setAttribute('aria-valuemax', '100');
    const fill = document.createElement('span'); meter.append(fill);
    const detail = document.createElement('span'); detail.className = 'pb-state-detail';
    const wrap = document.createElement('span'); wrap.className = 'v pb-state-storage'; value.replaceWith(wrap);
    value.className = 'pb-state-catalog'; wrap.append(meter, detail, value);
    let est = null;
    function paint() {
      heading.textContent = t('head'); lead.textContent = t('lead'); key.textContent = t('storage'); meter.title = t('title');
      const parts = [t('catalog') + ' ' + value.textContent];
      if (est && est.quota > 0) {
        const pct = Math.min(100, Math.max(0, est.usage / est.quota * 100));
        fill.style.width = (pct > 0 && pct < 1 ? 1 : pct) + '%'; meter.setAttribute('aria-valuenow', String(Math.round(pct)));
        meter.hidden = false; parts.push(size(est.usage) + ' ' + t('used') + ' ' + t('of') + ' ' + size(est.quota));
      } else { meter.hidden = true; parts.push(t('unknown')); }
      detail.textContent = parts.join(' · ');
    }
    async function measure() { try { const e = await navigator.storage?.estimate?.(); if (e && Number.isFinite(e.usage) && Number.isFinite(e.quota)) est = e; } catch {} paint(); }
    new MutationObserver(paint).observe(value, { childList: true, characterData: true, subtree: true });
    new MutationObserver(paint).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
    measure(); setInterval(measure, 60000); addEventListener('focus', measure);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
