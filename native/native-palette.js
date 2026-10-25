/* Switch the existing appearance profiles in place, without leaving the page. */
(() => {
  'use strict';
  let mounted=false;
  function mount() {
    if (mounted) return true;
    const host = document.querySelector('.native-toolbar-quick'), theme = window.PBTheme;
    if (!host || !theme?.current() || !window.PBIcons?.has('palette')) return false;
    const source = () => document.getElementById('pb-theme-settings');
    const trigger = document.getElementById('pb-palette-button') || document.createElement('button');
    trigger.id = 'pb-palette-button'; trigger.type = 'button'; trigger.className = 'ghost compact-tool compact-icon-only';
    if (!trigger.querySelector('.compact-icon')) trigger.append(window.PBIcons.create('palette'));
    trigger.setAttribute('aria-haspopup', 'dialog'); trigger.setAttribute('aria-expanded', 'false'); trigger.setAttribute('aria-controls', 'pb-palette');
    const popup = document.createElement('section');
    popup.id = 'pb-palette'; popup.hidden = true; popup.setAttribute('role', 'dialog'); popup.setAttribute('aria-labelledby', 'pb-palette-heading');
    const heading = document.createElement('h3'); heading.id = 'pb-palette-heading';
    const choices = document.createElement('div'); choices.className = 'pb-palette-choices'; choices.setAttribute('role', 'group');
    const status = document.createElement('p'); status.className = 'pb-palette-status'; status.setAttribute('role', 'status'); status.hidden = true;
    for (const name of theme.themes) {
      const original = source()?.querySelector('[data-pb-theme-choice="' + name + '"]');
      if (!original) return false;
      const button = document.createElement('button'); button.type = 'button'; button.dataset.pbPaletteChoice = name;
      button.style.setProperty('--pb-palette-accent', original.style.getPropertyValue('--pb-choice-accent'));
      const swatch = document.createElement('span'); swatch.className = 'pb-palette-swatch'; swatch.setAttribute('aria-hidden', 'true');
      const label = document.createElement('span'); label.className = 'pb-palette-name';
      const tick = original.querySelector('.pb-theme-tick').cloneNode(true); tick.classList.add('pb-palette-tick');
      button.append(swatch, label, tick);
      button.addEventListener('click', () => {
        theme.choose(name); sync();
        // Keep a failed-save notice visible instead of silently closing it.
        if (status.hidden) close(true);
      });
      choices.append(button);
    }
    popup.append(heading, choices, status); if (!trigger.isConnected) host.append(trigger); document.body.append(popup);
    const buttons = () => [...choices.querySelectorAll('[data-pb-palette-choice]')];
    function position() {
      if (popup.hidden) return;
      const viewport = window.visualViewport;
      const width = viewport?.width || document.documentElement.clientWidth, height = viewport?.height || innerHeight;
      const leftEdge = (viewport?.offsetLeft || 0) + 8, topEdge = (viewport?.offsetTop || 0) + 8;
      popup.style.maxWidth = Math.max(0, width - 16) + 'px'; popup.style.maxHeight = Math.max(0, height - 16) + 'px';
      const anchor = trigger.getBoundingClientRect(), box = popup.getBoundingClientRect();
      const left = Math.max(leftEdge, Math.min(anchor.right - box.width, leftEdge + width - 16 - box.width));
      const below = anchor.bottom + 6, above = anchor.top - box.height - 6;
      const top = Math.max(topEdge, Math.min(below + box.height <= topEdge + height - 16 ? below : above, topEdge + height - 16 - box.height));
      popup.style.left = left + 'px'; popup.style.top = top + 'px';
    }
    function sync() {
      const panel = source(); if (!panel) return;
      const groupName = panel.querySelector('.pb-theme-choices')?.getAttribute('aria-label') || '';
      trigger.title = groupName; trigger.setAttribute('aria-label', groupName); choices.setAttribute('aria-label', groupName);
      heading.textContent = panel.querySelector('h3')?.textContent || '';
      for (const button of buttons()) {
        const original = panel.querySelector('[data-pb-theme-choice="' + button.dataset.pbPaletteChoice + '"]');
        button.querySelector('.pb-palette-name').textContent = original.querySelector('.pb-theme-name').textContent;
        button.title = original.title; button.setAttribute('aria-pressed', String(button.dataset.pbPaletteChoice === theme.current()));
      }
      const existingStatus = panel.querySelector('.pb-theme-status');
      status.textContent = existingStatus && !existingStatus.classList.contains('pb-help-status-redundant') ? existingStatus.textContent : '';
      status.hidden = !status.textContent;
      position();
    }
    function close(restoreFocus = false) {
      popup.hidden = true; trigger.setAttribute('aria-expanded', 'false');
      if (restoreFocus) trigger.focus({preventScroll:true});
    }
    trigger.addEventListener('click', () => {
      if (!popup.hidden) { close(true); return; }
      sync(); popup.hidden = false; trigger.setAttribute('aria-expanded', 'true'); position();
      (choices.querySelector('[aria-pressed="true"]') || choices.firstElementChild)?.focus({preventScroll:true});
    });
    document.addEventListener('pointerdown', event => { if (!popup.hidden && !popup.contains(event.target) && !trigger.contains(event.target)) close(); });
    document.addEventListener('focusin', event => { if (!popup.hidden && !popup.contains(event.target) && !trigger.contains(event.target)) close(); });
    document.addEventListener('keydown', event => {
      if (popup.hidden) return;
      if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); close(true); return; }
      const all = buttons(), current = all.indexOf(document.activeElement); if (current < 0) return;
      let next;
      if (event.key === 'ArrowDown' || event.key === 'ArrowRight') next = (current + 1) % all.length;
      if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') next = (current + all.length - 1) % all.length;
      if (event.key === 'Home') next = 0;
      if (event.key === 'End') next = all.length - 1;
      if (next !== undefined) { event.preventDefault(); all[next].focus({preventScroll:true}); }
    });
    window.addEventListener('pb:theme', sync); window.addEventListener('resize', position);
    window.addEventListener('scroll', position, true);
    window.visualViewport?.addEventListener('resize', position); window.visualViewport?.addEventListener('scroll', position);
    new MutationObserver(() => queueMicrotask(sync)).observe(document.documentElement, {attributes:true,attributeFilter:['lang']});
    if (typeof ResizeObserver === 'function') { const size = new ResizeObserver(position); size.observe(trigger); size.observe(popup); }
    sync(); mounted=true; return true;
  }
  function start() {
    if (mount()) return;
    const waiting = new MutationObserver(() => { if (mount()) waiting.disconnect(); });
    waiting.observe(document.body, {childList:true,subtree:true});
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, {once:true}); else start();
})();
