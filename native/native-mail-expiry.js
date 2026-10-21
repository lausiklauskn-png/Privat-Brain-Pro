/* Reads how long an offer in a newsletter is valid ("gültig bis 26.10.", "vom 20.10. bis 25.10.",
   "Angebote KW 43"). Only dates next to such words count; a lone date ("Bestellung vom 12.10.")
   never does. Several offers: the latest end wins, so a running offer is never treated as expired.
   No clear date means "unknown"; the caller must then never delete automatically. */
(() => {
  'use strict';
  const DAY = 864e5;
  const MONTHS = {
    januar: 1, jan: 1, january: 1, februar: 2, feb: 2, february: 2, maerz: 3, marz: 3, mar: 3, march: 3, april: 4, apr: 4,
    mai: 5, may: 5, juni: 6, jun: 6, june: 6, juli: 7, jul: 7, july: 7, august: 8, aug: 8, september: 9, sep: 9, sept: 9,
    oktober: 10, okt: 10, october: 10, oct: 10, november: 11, nov: 11, dezember: 12, dez: 12, december: 12, dec: 12
  };
  const month = '(januar|februar|maerz|marz|april|mai|juni|juli|august|september|oktober|november|dezember|january|february|march|may|june|july|october|december|jan|feb|mar|apr|jun|jul|aug|sept|sep|okt|oct|nov|dez|dec)\\.?';
  // One date: 26.10. · 26.10.26 · 26.10.2026 · 26. Oktober (2026) · October 26(, 2026)
  const D = `(?:(\\d{1,2})\\.\\s?(\\d{1,2})\\.(?:\\s?(\\d{4}|\\d{2})(?!\\d))?|(\\d{1,2})\\.?\\s${month}(?:\\s(\\d{4}))?|${month}\\s(\\d{1,2})(?:st|nd|rd|th)?(?:,?\\s(\\d{4}))?)`;
  const groups = 9;
  const END_WORDS = '(?:gueltig|gultig|valid|giltig)\\s(?:noch\\s)?(?:bis|until|till|through)(?:\\s(?:zum|einschliesslich|inkl\\.?|including))?' +
    '|(?:nur\\s)?(?:noch\\s)?bis(?:\\s(?:zum|einschliesslich|inkl\\.?))?|endet\\s(?:am)?|lauft\\sbis|laeuft\\sbis|until|ends(?:\\son)?|expires(?:\\son)?|ablauf(?:datum)?:?';
  const RANGE_START = '(?:vom|von|ab|aktionszeitraum:?|zeitraum:?|from|gultig\\svom|gueltig\\svom)?';
  function fold(text) {
    return String(text || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/ß/g, 'ss').replace(/[\u00a0\u2009\u202f]/g, ' ').replace(/[\u2010-\u2015]/g, '-').replace(/[ \t]+/g, ' ');
  }
  function build(m, offset, reference) {
    let day, mon, year;
    if (m[offset + 1]) { day = +m[offset + 1]; mon = +m[offset + 2]; year = m[offset + 3]; }
    else if (m[offset + 4]) { day = +m[offset + 4]; mon = MONTHS[m[offset + 5]]; year = m[offset + 6]; }
    else if (m[offset + 7]) { mon = MONTHS[m[offset + 7]]; day = +m[offset + 8]; year = m[offset + 9]; }
    if (!day || !mon || mon > 12 || day > 31) return null;
    const ref = new Date(reference);
    let y = year ? (+year < 100 ? 2000 + +year : +year) : ref.getFullYear();
    let date = new Date(y, mon - 1, day, 23, 59, 59);
    if (date.getMonth() !== mon - 1 || date.getDate() !== day) return null;
    // Without a year, a date far before the mail belongs to the next year (December mail, January offer).
    if (!year && date.getTime() < reference - 60 * DAY) date = new Date(y + 1, mon - 1, day, 23, 59, 59);
    return date.getTime();
  }
  function isoWeekEnd(week, reference) {
    const ref = new Date(reference);
    const end = year => { const jan4 = new Date(year, 0, 4), monday = new Date(year, 0, 4 - ((jan4.getDay() + 6) % 7)); return new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + (week - 1) * 7 + 6, 23, 59, 59).getTime(); };
    let value = end(ref.getFullYear());
    if (value < reference - 120 * DAY) value = end(ref.getFullYear() + 1);
    return value;
  }
  /** @returns {{until:number|null, sure:boolean, phrase:string}} */
  function find(text, reference = Date.now()) {
    const t = fold(text).slice(0, 20000), ends = [], phrases = [];
    const range = new RegExp(`${RANGE_START}\\s?${D}\\s?(?:-|bis|bis zum|to|until)\\s?${D}`, 'g');
    for (const m of t.matchAll(range)) {
      const a = build(m, 0, reference), b = build(m, groups, reference);
      if (a && b && b >= a - DAY) { ends.push(b); phrases.push(m[0].trim()); }
    }
    const single = new RegExp(`(?:^|[^a-z])(?:${END_WORDS})\\s?${D}`, 'g');
    for (const m of t.matchAll(single)) {
      const offset = m.length - 1 - groups;
      const value = build(m, offset, reference);
      if (value) { ends.push(value); phrases.push(m[0].trim()); }
    }
    for (const m of t.matchAll(/(?:^|[^a-z])(?:kw|kalenderwoche|week)\s?(\d{1,2})(?!\d)/g)) {
      const week = +m[1];
      if (week >= 1 && week <= 53) { ends.push(isoWeekEnd(week, reference)); phrases.push(m[0].trim()); }
    }
    if (!ends.length) return { until: null, sure: false, phrase: '' };
    const until = Math.max(...ends);
    // Implausible ends (long before the mail or more than about a year after) make the whole mail unsure.
    const sure = ends.every(v => v >= reference - 7 * DAY && v <= reference + 400 * DAY);
    return { until: sure ? until : null, sure, phrase: phrases[ends.indexOf(until)] || '' };
  }
  /** One day of grace after the last day of validity. */
  const expired = (until, now = Date.now()) => Boolean(until) && until + DAY < now;
  const api = { find, expired, DAY };
  window.PBMailExpiry = api;
})();
