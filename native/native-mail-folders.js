/* Display roles only: provider paths are never renamed or sent back as translations. */
(() => {
  'use strict';
  const roles = {inbox:'\\Inbox',draft:'\\Drafts',sent:'\\Sent',archive:'\\Archive',spam:'\\Junk',trash:'\\Trash'};
  const aliases = {
    inbox:['inbox','posteingang','eingang'], draft:['drafts','draft','entwürfe','entwuerfe'],
    sent:['sent','sent messages','sent items','gesendet','gesendete elemente'],
    archive:['archive','archives','archiv'],spam:['spam','junk','junk e-mail','junk-e-mail','spamverdacht','spam-verdacht','unerwünscht','bulk mail'],trash:['trash','deleted messages','deleted items','deleted','papierkorb','gelöscht','gelöschte elemente','gelöschte objekte','bin']
  };
  const normalized = value => String(value).normalize('NFKC').trim().toLowerCase();
  function resolve(folders) {
    const assigned = new Set(), result = new Map();
    // Explicit server roles take precedence over aliases and custom folder names.
    for (const [role, flag] of Object.entries(roles)) {
      const flagged = folders.filter(f => f.specialUse === flag && !assigned.has(f.path));
      if (flagged.length === 1) { result.set(role,flagged[0]); assigned.add(flagged[0].path); }
    }
    for (const [role,names] of Object.entries(aliases)) {
      if (result.has(role)) continue;
      const candidates = folders.filter(f => !assigned.has(f.path) && !f.specialUse && names.includes(normalized(f.name || f.path)));
      if (candidates.length === 1) { result.set(role,candidates[0]); assigned.add(candidates[0].path); }
    }
    return {roles:result,custom:folders.filter(f=>!assigned.has(f.path))};
  }
  window.PBMailFolders = {resolve};
})();
