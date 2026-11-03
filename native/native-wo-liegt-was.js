/* „Wo liegt was?“ – Hilfe zum gemeinsamen Tresor aller Pro-Apps (gemeinsamer Tresor-Plan, Klaus 2026-11-03: „Ja zum Plan“).
   App-eigen (kein gemeinsamer Baustein): ein Knopf im Kasten „Tresor & Ablage“ (#vaultPlace) öffnet die Seite.
   Der allgemeine Teil ist in allen Pro-Apps gleich; darunter steht, was für Private Brain Pro gilt.
   Dazu PBOrdnerHinweis: dieselben Meldungen für falsch gewählte Ordner, auch für „Zusammenarbeit mit Pro-Apps“.
   Russisch und Polnisch zeigen Deutsch (im Plan so vorgesehen). */
(() => {
  'use strict';
  const api = window.Capacitor?.Plugins?.ProVault;
  if (typeof api?.state !== 'function') return;
  const HINWEIS = {
    de: 'Wähle den Ordner, in dem „tresorordner.json“ liegt.',
    en: 'Choose the folder that contains “tresorordner.json”.',
    ru: 'Выберите папку, в которой лежит «tresorordner.json».',
    pl: 'Wybierz folder, w którym leży „tresorordner.json”.'
  };
  const T = {
    de: {
      knopf: 'Wo liegt was?',
      titel: 'Wo liegt was?',
      allgemein: [
        'Der gemeinsame Tresor aller Pro-Apps ist der Ordner, in dem die Datei „tresorordner.json“ liegt (bei Klaus: SD-Karte › Privat Brain Pro Hauptablageordner). Diesen Ordner wählst du in jeder App einmal aus.',
        'Nie den Unterordner „Tresorordner“ wählen und nie einen App-Ordner darin.',
        'Darin legt jede App ihren eigenen Ordner an: Workflow PDF Pro · Private Brain · BookLedgerPro · Familienakte.',
        'Die Ordner „Eingang-…“ sind Briefkästen: Andere Apps legen dort etwas für diese App ab.',
        'Die Dateien heißen nur nach Nummern und sind verschlüsselt. Den echten Namen zeigt die App. Ohne App lassen sie sich nicht öffnen.',
        'Offene Dateien (PDF, .json, .txt) gehören nicht in den Tresor-Ordner. Ersatzschlüssel ausdrucken oder getrennt aufbewahren.',
        'Ein Passwort gilt für alle Pro-Apps.'
      ],
      app: 'Diese App: Fach „Private Brain“ · Eingang: „Eingang-Private-Brain“',
      verbinden: 'Verbinden: Einstellungen › Tresor & Ablage › Zusammenarbeit mit Pro-Apps › „Pro-Tresor verbinden …“ – dort den Ordner wählen, in dem „tresorordner.json“ liegt.',
      speicherort: 'Speicherort von Private Brain: Einstellungen › Tresor & Ablage › „Speicherort wählen“. Richtig ist der Ordner „Private Brain“ oder der Ordner, in dem „tresorordner.json“ liegt – Private Brain nutzt darin seinen Ordner „Private Brain“ und legt keinen zweiten daneben an.',
      ablage: '„Ablageordner wählen“ (unter „Dateien hinzufügen“) legt UNVERSCHLÜSSELTE Kopien deiner Dateien an und ist kein Tresor. Wer das nicht will, tippt dort „Kopieren ausschalten“. Diesen Ordner nie in den Tresor-Ordner legen.',
      original: 'Ein Original brauchst du als offene Datei? In der geöffneten Mail „Original teilen / sichern“ tippen und einen Ort außerhalb des Tresors wählen.',
      ersatz: 'Die Ersatzschlüssel-Datei warnt dich, wenn du sie in den Tresor-Ordner oder direkt daneben legen willst (erkennbar auf Tablet-Speicher und SD-Karte).',
      schliessen: 'Schließen'
    },
    en: {
      knopf: 'What is where?',
      titel: 'What is where?',
      allgemein: [
        'The shared vault of all Pro apps is the folder that contains the file “tresorordner.json” (for Klaus: SD card › Privat Brain Pro Hauptablageordner). You choose this folder once in every app.',
        'Never choose the subfolder “Tresorordner” and never an app folder inside it.',
        'Inside it every app creates its own folder: Workflow PDF Pro · Private Brain · BookLedgerPro · Familienakte.',
        'The “Eingang-…” folders are mailboxes: other apps leave something there for this app.',
        'The files are named only by numbers and are encrypted. The app shows the real name. They cannot be opened without the app.',
        'Open files (PDF, .json, .txt) do not belong in the vault folder. Print recovery keys or keep them separately.',
        'One password applies to all Pro apps.'
      ],
      app: 'This app: compartment “Private Brain” · inbox: “Eingang-Private-Brain”',
      verbinden: 'Connect: Settings › Vault & storage › Work with Pro apps › “Connect Pro vault …” – choose the folder that contains “tresorordner.json”.',
      speicherort: 'Private Brain storage: Settings › Vault & storage › “Choose storage location”. Correct is the folder “Private Brain” or the folder that contains “tresorordner.json” – Private Brain then uses its folder “Private Brain” inside and never creates a second one next to it.',
      ablage: '“Choose library folder” (under “Add files”) creates UNENCRYPTED copies of your files and is not a vault. If you do not want that, tap “Turn off copying” there. Never put that folder into the vault folder.',
      original: 'Need an original as an open file? In the opened email tap “Share / save original” and choose a place outside the vault.',
      ersatz: 'The recovery key file warns you if you try to put it into the vault folder or right next to it (detected on tablet storage and SD card).',
      schliessen: 'Close'
    }
  };
  const MELDUNG = {
    de: {
      TRESOR_ORDNER_VERWALTUNG: 'Das ist der Verwaltungsordner „Tresorordner“ – ihn nie selbst wählen. ' + HINWEIS.de + ' Nichts wurde verändert.',
      TRESOR_ORDNER_IST_FACH: 'Das ist ein App-Ordner im Tresor (zum Beispiel „Private Brain“). Bitte die Ebene darüber wählen. ' + HINWEIS.de + ' Nichts wurde verändert.',
      VAULT_FOLDER_IM_TRESOR: 'Das ist die Verwaltung oder der Ordner einer anderen App im gemeinsamen Tresor. Wähle „Private Brain“ oder den Ordner, in dem „tresorordner.json“ liegt. Nichts wurde verändert.'
    },
    en: {
      TRESOR_ORDNER_VERWALTUNG: 'This is the management folder “Tresorordner” – never choose it yourself. ' + HINWEIS.en + ' Nothing was changed.',
      TRESOR_ORDNER_IST_FACH: 'This is an app folder inside the vault (for example “Private Brain”). Choose the level above. ' + HINWEIS.en + ' Nothing was changed.',
      VAULT_FOLDER_IM_TRESOR: 'This is the management folder or another app’s folder inside the shared vault. Choose “Private Brain” or the folder that contains “tresorordner.json”. Nothing was changed.'
    }
  };
  const sprache = () => (document.documentElement.lang === 'en' ? 'en' : 'de');
  const make = (tag, text, cls) => { const e = document.createElement(tag); if (text != null) e.textContent = text; if (cls) e.className = cls; return e; };

  function zeigen() {
    const t = T[sprache()];
    const dialog = make('dialog', null, 'live-dialog native-wo-liegt-was'); dialog.id = 'woLiegtWas';
    const liste = make('ul'); for (const satz of t.allgemein) liste.append(make('li', satz));
    const eigen = make('ul'); for (const k of ['app', 'verbinden', 'speicherort', 'ablage', 'original', 'ersatz']) { const li = make('li', t[k]); li.dataset.punkt = k; eigen.append(li); }
    const zu = make('button', t.schliessen, 'primary'); zu.type = 'button'; zu.onclick = () => dialog.close();
    dialog.append(make('h2', t.titel), liste, make('h3', 'Private Brain Pro'), eigen, zu);
    document.body.append(dialog);
    dialog.addEventListener('close', () => dialog.remove(), { once: true });
    dialog.showModal();
  }
  const knopf = make('button', null, 'ghost'); knopf.type = 'button'; knopf.id = 'woLiegtWasKnopf'; knopf.onclick = zeigen;
  const beschriften = () => { knopf.textContent = T[sprache()].knopf; };
  function einsetzen() {
    const card = document.getElementById('vaultPlace');
    if (!card) return false;
    if (!knopf.isConnected) { const row = card.querySelector('.btnrow'); row ? row.after(knopf) : card.append(knopf); }
    beschriften();
    return true;
  }
  const start = () => { if (!einsetzen()) setTimeout(start, 300); };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true }); else start();
  new MutationObserver(beschriften).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
  window.PBOrdnerHinweis = Object.freeze({
    hinweis: () => HINWEIS[document.documentElement.lang] || HINWEIS.de,
    meldung: code => MELDUNG[sprache()][code] || null,
    zeigen
  });
})();
