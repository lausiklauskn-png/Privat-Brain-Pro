/* Immediate, local activity feedback. It reports work, never success. Native
   callers own their token and finish it in finally, including failure/cancel. */
(() => {
  'use strict';
  if (window.PBActivity) return;
  const words = {
    de: 'Bitte warten …', en: 'Please wait …', ru: 'Подождите …', pl: 'Proszę czekać …'
  };
  const waiting = () => words[String(document.documentElement.lang || 'de').slice(0, 2)] || words.de;
  const jobs = new Map(), targets = new WeakMap();
  let next = 0, row = null, rowText = null;
  function dots() {
    const icon = document.createElement('span'); icon.className = 'pb-activity-dots'; icon.setAttribute('aria-hidden', 'true');
    for (let i = 0; i < 3; i++) icon.append(document.createElement('i'));
    return icon;
  }
  function setClass(node, name, value) {
    if (node.classList.contains(name) !== value) node.classList.toggle(name, value);
  }
  function label(job) {
    try { return String(typeof job.label === 'function' ? job.label() : job.label || waiting()); }
    catch { return waiting(); }
  }
  function hostFor(job) {
    const viewer = job?.target?.closest('.native-file-viewer:not([hidden])');
    if (viewer?.isConnected) return viewer.querySelector('.native-file-head') || viewer;
    return document.querySelector('.wrap') || document.body || document.documentElement;
  }
  function render() {
    const job = [...jobs.values()].at(-1);
    if (!row) {
      row = document.createElement('div'); row.id = 'pb-activity'; row.className = 'pb-activity'; row.hidden = true;
      row.setAttribute('role', 'status'); row.setAttribute('aria-live', 'polite'); row.setAttribute('aria-atomic', 'true');
      rowText = document.createElement('span'); rowText.className = 'pb-activity-text'; row.append(dots(), rowText);
    }
    if (!job) {
      if (!row.hidden) row.hidden = true;
      if (rowText.textContent) rowText.textContent = '';
      return;
    }
    const host = hostFor(job), toolbar = host.matches('.wrap') && host.querySelector(':scope>.native-toolbar-row');
    const anchor = toolbar || (host.matches('.wrap') && host.querySelector(':scope>header.top'));
    if (anchor) { if (anchor.nextElementSibling !== row) anchor.after(row); }
    else if (row.parentElement !== host) host.append(row);
    const text = label(job); if (rowText.textContent !== text) rowText.textContent = text;
    if (row.hidden) row.hidden = false;
  }
  function paint() {
    // Two frames give the newly inserted status a paint before a caller begins
    // expensive work. Hidden/background views must not deadlock that caller.
    return new Promise(resolve => {
      if (document.hidden || typeof requestAnimationFrame !== 'function') { setTimeout(resolve, 0); return; }
      let first = 0, second = 0, complete = false;
      const finish = () => {
        if (complete) return; complete = true;
        clearTimeout(timer); cancelAnimationFrame(first); cancelAnimationFrame(second); resolve();
      };
      const timer = setTimeout(finish, 250);
      first = requestAnimationFrame(() => { second = requestAnimationFrame(finish); });
    });
  }
  function start(options = {}) {
    const target = options.target?.nodeType === 1 ? options.target : null;
    const job = {id: ++next, label: options.label, target}; jobs.set(job.id, job);
    if (target) {
      let state = targets.get(target);
      if (!state) {
        state = {jobs: new Set(), priorBusy: target.getAttribute('aria-busy'), priorClass: target.classList.contains('pb-activity-target')};
        targets.set(target, state);
      }
      state.jobs.add(job.id); target.setAttribute('aria-busy', 'true'); setClass(target, 'pb-activity-target', true);
    }
    render();
    let done = false;
    return Object.freeze({ready: paint(), finish() {
      if (done) return; done = true; jobs.delete(job.id);
      if (target) {
        const state = targets.get(target); state?.jobs.delete(job.id);
        if (state && !state.jobs.size) {
          if (target.getAttribute('aria-busy') === 'true') {
            if (state.priorBusy === null) target.removeAttribute('aria-busy'); else target.setAttribute('aria-busy', state.priorBusy);
          }
          if (!state.priorClass) setClass(target, 'pb-activity-target', false);
          targets.delete(target);
        }
      }
      render();
    }});
  }
  async function run(options, work) {
    const token = start(options);
    try { await token.ready; return await work(); }
    finally { token.finish(); }
  }
  window.PBActivity = Object.freeze({start, run});

  // Keep the proven progress counters and original DOM nodes. Only their old
  // bars are visually replaced; data/phase/error text and cancel buttons stay.
  const adapted = new WeakMap();
  let captionBusy = null, queued = false, syncFrame = 0, syncTimer = 0;
  function adapt(node, busy) {
    if (!node) return;
    let indicator = adapted.get(node);
    if (!indicator) {
      indicator = document.createElement('span'); indicator.className = 'pb-progress-busy';
      indicator.setAttribute('role', 'img'); indicator.append(dots()); node.prepend(indicator);
      adapted.set(node, indicator); setClass(node, 'pb-dot-progress', true);
    }
    const text = waiting(); if (indicator.getAttribute('aria-label') !== text) indicator.setAttribute('aria-label', text);
    if (indicator.hidden === busy) indicator.hidden = !busy;
  }
  function sync() {
    if (syncFrame) cancelAnimationFrame(syncFrame);
    clearTimeout(syncTimer); syncFrame = syncTimer = 0;
    queued = false;
    const imported = document.getElementById('prog');
    adapt(imported, Boolean(imported?.classList.contains('on')));
    const caption = document.getElementById('capProgWrap');
    // These fixed terminal messages are emitted by the existing caption path.
    // Leave them visible, while avoiding a spinner that falsely keeps running.
    const captionStatus = document.getElementById('capStatus')?.textContent || '';
    if (/nicht starten|nicht verfügbar|pausiert|fehlgeschlagen/.test(captionStatus)) captionBusy = false;
    adapt(caption, Boolean(caption?.classList.contains('on') && captionBusy !== false));
    const semantic = document.getElementById('pb-semantic');
    adapt(semantic, Boolean(semantic && ['loading', 'starting'].includes(semantic.dataset.state)));
    document.querySelectorAll('.native-mail-progress').forEach(node => adapt(node, !node.hidden));
    document.querySelectorAll('.pb-mail-translation').forEach(node => adapt(node,
      Boolean(!node.hidden && node.querySelector('[data-mail-translate="target"]:disabled'))));
    if (jobs.size) render();
  }
  function schedule() {
    if (queued) return;
    queued = true;
    // Model counters and large imports can mutate many nodes in one frame.
    // Coalesce their visual feedback instead of adding another hot UI loop.
    if (typeof requestAnimationFrame === 'function' && !document.hidden) syncFrame = requestAnimationFrame(sync);
    syncTimer = setTimeout(sync, document.hidden ? 0 : 120);
  }
  window.addEventListener('pb:caption-progress', event => {
    const status = event.detail?.status;
    if (status === 'ready') captionBusy = false;
    else if (['progress', 'download', 'initiate'].includes(status)) captionBusy = true;
    schedule();
  });
  const observe = () => {
    new MutationObserver(schedule).observe(document.body, {subtree: true, childList: true, characterData: true,
      attributes: true, attributeFilter: ['class', 'hidden', 'data-state', 'disabled']});
    new MutationObserver(() => { render(); sync(); }).observe(document.documentElement,
      {attributes: true, attributeFilter: ['lang']});
    sync();
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', observe, {once: true}); else observe();
})();
