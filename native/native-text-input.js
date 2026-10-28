/* Ordinary native text entry uses an app dialog (touch, mouse and keyboard). Since 2026-10-28 (Klaus: microphone only at
   search and free text) these one-line names get no microphone. Secret/password dialogs stay native. */
(() => {
  'use strict';
  const labels = {
    de: ['Übernehmen', 'Abbrechen'], en: ['Apply', 'Cancel'],
    ru: ['Применить', 'Отмена'], pl: ['Zastosuj', 'Anuluj']
  };
  let current = null;
  function ask(title, initial = '') {
    if (current) { current.field.focus(); return Promise.resolve(null); }
    return new Promise(resolve => {
      const previous = document.activeElement;
      const dialog = document.createElement('dialog'); dialog.className = 'live-dialog pb-text-input';
      const heading = document.createElement('h2'); heading.id = 'pb-text-input-title'; heading.textContent = String(title);
      const form = document.createElement('form'); form.method = 'dialog';
      const field = document.createElement('input'); field.type = 'text'; field.id = 'pb-text-input-value'; field.value = String(initial);
      field.setAttribute('aria-label', String(title)); field.autocomplete = 'off';
      const actions = document.createElement('div'); actions.className = 'btnrow';
      const apply = document.createElement('button'); apply.type = 'submit'; apply.className = 'primary'; apply.dataset.textInput = 'apply';
      const cancel = document.createElement('button'); cancel.type = 'button'; cancel.className = 'ghost'; cancel.dataset.textInput = 'cancel';
      const translate = () => { const words = labels[document.documentElement.lang] || labels.de; apply.textContent = words[0]; cancel.textContent = words[1]; };
      translate(); actions.append(apply, cancel); form.append(field, actions); dialog.append(heading, form);
      dialog.setAttribute('aria-labelledby', heading.id);
      let answer = null;
      current = { field };
      form.addEventListener('submit', event => { event.preventDefault(); answer = field.value; dialog.close(); });
      cancel.addEventListener('click', () => { answer = null; dialog.close(); });
      dialog.addEventListener('cancel', () => { answer = null; });
      const observer = new MutationObserver(translate); observer.observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
      dialog.addEventListener('close', () => {
        observer.disconnect(); current = null; dialog.remove();
        if (previous?.isConnected && !previous.closest?.('[inert]')) previous.focus?.({ preventScroll: true });
        resolve(answer);
      }, { once: true });
      document.body.append(dialog); dialog.showModal(); field.focus(); field.select();
    });
  }
  window.PBTextPrompt = Object.freeze({ ask });
})();
