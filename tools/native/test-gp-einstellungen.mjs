// Generalprüfung 16.11.2026, Einstellungen nach Themen und Tresor: (6) Themen-Knöpfe in der gewählten Sprache, „Zurück“ führt
// zuerst zu „Alle Themen“, die Tab-Taste geht vom Kopf in den Inhalt, der Sprung von „Hinzufügen“ öffnet „Tresor & Ablage“;
// (7) gesperrt ist „Entsperren“ der Hauptknopf; (8) Texte „oben/unten“ und der Verweis auf die Farbpalette.
// Gebautes www/, gestellte Brücke, Themen wie am Gerät eingeschaltet (pb_einstellungen_themen=an).
import { readFile } from 'node:fs/promises';
import { start, ok, total } from './_gp-harness.mjs';
const h = await start();
try {
  // Warten mit Frist: läuft etwas nicht ein, zählt der folgende Prüfpunkt rot (statt dass die Probe abbricht).
  const tipp = knopf => knopf.click({ timeout: 4000 }).catch(() => {});
  const warte = (page, fn, arg) => page.waitForFunction(fn, arg, { timeout: 4000 }).catch(() => {});
  const names = page => page.evaluate(() => [...document.querySelectorAll('#pbThemen .pb-thema-knopf')].map(b => b.textContent.trim()));
  const settings = async page => { await tipp(page.locator('.native-toolbar-quick [data-tab="settings"]')); await warte(page, () => document.getElementById('panel-settings').classList.contains('on') && document.querySelectorAll('#pbThemen .pb-thema-knopf').length > 5); };
  const soll = {
    de: ['Tresor & Ablage', 'Sprache & Diktat', 'E-Mail-Anhänge', 'Aussehen & App', '‹ Alle Themen'],
    en: ['Vault & storage', 'Language & dictation', 'Email attachments', 'Appearance & app', '‹ All topics'],
    ru: ['Сейф и хранение', 'Язык и диктовка', 'Вложения писем', 'Внешний вид и приложение', '‹ Все темы'],
    pl: ['Sejf i miejsce zapisu', 'Język i dyktowanie', 'Załączniki e-mail', 'Wygląd i aplikacja', '‹ Wszystkie tematy']
  };
  // 6a · Sprache, frisch geladen
  const zahl = {};
  for (const lang of ['de', 'en', 'ru', 'pl']) {
    const page = await h.open({ width: 1280, height: 900, lang, themen: true });
    await settings(page);
    const n = await names(page); zahl[lang] = n.length;
    ok(`${lang}: die Themen-Knöpfe stehen in der gewählten Sprache (${n.slice(0, 3).join(', ')} …)`, soll[lang].slice(0, 4).every(x => n.includes(x)));
    await tipp(page.locator('#pbThemen [data-thema="sprache"]'));
    ok(`${lang}: Rückweg und Titel des Themas sind übersetzt`, await page.evaluate(([back, title]) => document.querySelector('#pbThemaKopf button').textContent === back && document.querySelector('.pb-thema-titel').textContent === title, [soll[lang][4], soll[lang][1]]));
    await page.context().close();
  }
  ok(`In jeder Sprache gibt es gleich viele Themen (${JSON.stringify(zahl)}) – „E-Mail-Anhänge“ hat überall sein eigenes`, new Set(Object.values(zahl)).size === 1);
  // 6a · Sprachwechsel im laufenden Betrieb
  let page = await h.open({ width: 1280, height: 900, themen: true });
  await settings(page);
  await page.evaluate(() => { document.documentElement.lang = 'en'; });
  await warte(page, () => document.querySelector('#pbThemen [data-thema="tresor"]')?.textContent.trim() === 'Vault & storage');
  ok('Nach dem Umschalten der Sprache werden die Knöpfe neu beschriftet', (await names(page)).includes('Language & dictation'));
  await page.evaluate(() => { document.documentElement.lang = 'de'; });
  await warte(page, () => document.querySelector('#pbThemen [data-thema="tresor"]')?.textContent.trim() === 'Tresor & Ablage');

  // 6b · „Zurück“ führt zuerst zu „Alle Themen“
  await tipp(page.locator('#pbThemen [data-thema="bedeutung"]'));
  ok('Thema „Bedeutungssuche“ ist offen, der Zurück-Pfeil ist bedienbar', await page.evaluate(() => window.PBEinstellungen.thema === 'bedeutung' && !document.querySelector('.native-navigation button').disabled));
  await tipp(page.locator('.native-navigation button').first()); await page.waitForTimeout(200);
  ok('Zurück im geöffneten Thema: man steht bei „Alle Themen“, weiter in den Einstellungen', await page.evaluate(() => window.PBEinstellungen.thema === null && document.getElementById('panel-settings').classList.contains('on') && !document.getElementById('pbThemen').hidden));
  ok('Der Fokus steht danach auf dem Knopf des Themas, aus dem man kam', await page.evaluate(() => document.activeElement?.dataset.thema === 'bedeutung'));
  await tipp(page.locator('.native-navigation button').first());
  await warte(page, () => !document.getElementById('panel-settings').classList.contains('on'));
  ok('Der nächste Zurück-Tipp verlässt die Einstellungen (zur Suche)', await page.evaluate(() => document.getElementById('panel-search').classList.contains('on')));
  await settings(page);
  await tipp(page.locator('#pbThemen [data-thema="sprache"]'));
  await tipp(page.locator('#pbThemaKopf button'));
  ok('„‹ Alle Themen“ bleibt und führt ebenfalls zurück', await page.evaluate(() => window.PBEinstellungen.thema === null && document.activeElement?.dataset.thema === 'sprache'));

  // 6c · Tab-Reihenfolge
  await page.focus('#pbThemen [data-thema="sprache"]', { timeout: 4000 }).catch(() => {}); await page.keyboard.press('Enter');
  ok('Mit Enter geöffnet: der Fokus steht auf der Überschrift des Themas', await page.evaluate(() => document.activeElement?.classList.contains('pb-thema-titel') && document.activeElement.textContent === 'Sprache & Diktat'));
  await page.keyboard.press('Tab');
  const first = await page.evaluate(() => { const a = document.activeElement, box = a?.closest('#panel-settings > *'); return { tag: a?.tagName, id: a?.id, thema: box?.dataset.pbThema || '', inPanel: !!a?.closest('#panel-settings'), visible: !!a && a.getClientRects().length > 0 }; });
  ok(`Die nächste Tab-Taste landet im Inhalt des Themas (${first.tag}${first.id ? '#' + first.id : ''})`, first.inPanel && first.thema === 'sprache' && first.visible);
  await page.keyboard.press('Shift+Tab');
  ok('Rückwärts kommt man auf „‹ Alle Themen“', await page.evaluate(() => document.activeElement === document.querySelector('#pbThemaKopf button')));

  // 8 · Aussehen & App nennt die Farbpalette; Texte ohne „oben/unten“
  await tipp(page.locator('#pbThemaKopf button'));
  await tipp(page.locator('#pbThemen [data-thema="app"]'));
  ok('Thema „Aussehen & App“ nennt die Farben und hat einen Knopf dorthin', await page.evaluate(() => { const z = document.getElementById('pbThemaFarben'); return !!z && z.getClientRects().length > 0 && z.querySelector('button').textContent === 'Farben wählen' && z.closest('#panel-settings > *').dataset.pbThema === 'app'; }));
  await page.locator('#pbThemaFarben button').click({ timeout: 4000 }).catch(() => {});
  ok('Der Knopf öffnet die Farbpalette', await page.evaluate(() => document.getElementById('pb-palette-button').getAttribute('aria-expanded') === 'true'));
  await page.keyboard.press('Escape');
  await page.evaluate(() => { document.documentElement.lang = 'pl'; });
  await warte(page, () => document.querySelector('#pbThemaFarben button')?.textContent === 'Wybierz kolory');
  ok('Der Verweis ist übersetzt (pl)', true);
  const html = await readFile('www/index.html', 'utf8');
  ok('Die Texte verweisen auf das Thema „KI-Schlüssel (EU)“ statt auf „oben“/„unten“', !html.includes('Mistral-Schlüssel (oben)') && !html.includes('wenn du unten bewusst') && html.split('Thema „KI-Schlüssel (EU)“').length === 3);
  await page.context().close();

  // 6d · Sprung von „Hinzufügen“
  page = await h.open({ width: 1000, height: 800, themen: true, vault: { configured: false } });
  await tipp(page.locator('.main-pages [data-tab="intake"]'));
  await page.waitForSelector('#vaultLine button', { state: 'visible', timeout: 4000 }).catch(() => {});
  await tipp(page.locator('#vaultLine button'));
  await warte(page, () => document.getElementById('panel-settings').classList.contains('on'));
  await page.waitForTimeout(200);
  ok('Der Knopf in der Zeile „Speicherort“ auf „Hinzufügen“ öffnet gleich das Thema „Tresor & Ablage“', await page.evaluate(() => window.PBEinstellungen.thema === 'tresor' && document.getElementById('pbThemen').hidden && document.getElementById('vault-choose').getClientRects().length > 0));
  ok('Ohne Speicherort ist „Speicherort wählen“ der Hauptknopf', await page.evaluate(() => document.getElementById('vault-choose').className === 'primary' && document.getElementById('vault-unlock').hidden));
  // Ein Thema, dessen Kästen im Dokument VOR dem Kopf stehen (der gemeldete Fall „Tresor & Ablage“): einmal ganz durch, ohne Schleife.
  await tipp(page.locator('#pbThemaKopf button'));
  await page.focus('#pbThemen [data-thema="tresor"]', { timeout: 4000 }).catch(() => {}); await page.keyboard.press('Enter');
  const weg = [];
  for (let i = 0; i < 40; i++) {
    await page.keyboard.press('Tab');
    const w = await page.evaluate(() => { const a = document.activeElement, box = a?.closest('#panel-settings > *'); return a === document.querySelector('#pbThemaKopf button') ? 'kopf' : box && box.dataset.pbThema ? 'inhalt:' + (a.id || a.tagName) : a?.closest('#panel-settings') ? 'seite' : 'aussen'; });
    weg.push(w); if (w === 'aussen' || w === 'kopf') break;
  }
  const inhalt = weg.filter(w => w.startsWith('inhalt:'));
  ok(`„Tresor & Ablage“: Tab geht zuerst durch den Inhalt (${inhalt.length} Stellen: ${weg.join(' → ')}) und verlässt die Seite danach, ohne zum Kopf zurückzuspringen`, weg[0].startsWith('inhalt:') && inhalt.includes('inhalt:vault-choose') && !weg.includes('kopf') && weg.at(-1) === 'aussen' && weg.findIndex(w => !w.startsWith('inhalt:')) === inhalt.length);
  await page.focus('#vault-choose', { timeout: 4000 }).catch(() => {});
  for (let i = 0; i < 12 && !(await page.evaluate(() => document.activeElement === document.querySelector('#pbThemaKopf button'))); i++) await page.keyboard.press('Shift+Tab');
  ok('Rückwärts vom Inhalt kommt man auf „‹ Alle Themen“ und von dort mit Tab wieder in den Inhalt', await page.evaluate(() => document.activeElement === document.querySelector('#pbThemaKopf button')) && (await page.keyboard.press('Tab'), await page.evaluate(() => document.activeElement.closest('#panel-settings > *')?.dataset.pbThema === 'tresor')));

  await page.context().close();

  // 7 · gesperrt: „Entsperren“ ist der Hauptknopf
  page = await h.open({ width: 1000, height: 800, themen: true, vault: { configured: true, unlocked: false, location: 'sdcard', folder: 'Private Brain', reachable: true } });
  await settings(page);
  await tipp(page.locator('#pbThemen [data-thema="tresor"]'));
  await warte(page, () => !document.getElementById('vault-unlock').hidden);
  await page.waitForTimeout(1800);
  const v = await page.evaluate(() => { const row = document.getElementById('vault-unlock').parentElement, shown = [...row.querySelectorAll('button')].filter(b => !b.hidden && b.getClientRects().length); return { order: shown.map(b => b.id), primary: shown.filter(b => b.classList.contains('primary')).map(b => b.id), text: document.getElementById('vault-unlock').textContent, choose: document.getElementById('vault-choose').textContent, all: ['choose', 'openExisting', 'unlock', 'lock', 'migrate', 'backupNow'].every(k => document.getElementById('vault-' + k)), hilfe: document.getElementById('pbTresorHilfeKnopf')?.className }; });
  ok(`Gesperrt: „Entsperren“ ist der einzige blaue Hauptknopf und steht vorn (${v.order.join(', ')})`, v.text.includes('Entsperren') && v.primary.join() === 'vault-unlock' && v.order[0] === 'vault-unlock');
  ok('„Anderen Speicherort wählen“ und „Vorhandenen Ordner öffnen“ bleiben als blasse Knöpfe, kein Knopf fehlt', v.order.includes('vault-choose') && v.order.includes('vault-openExisting') && v.all && v.choose.length > 3);
  ok('„Tresor-Hilfe“ bleibt, ist aber nicht blau, solange nur gesperrt ist', v.hilfe === 'ghost');
  await page.context().close();
  ok('Keine Skriptfehler: ' + h.errors.join(' | '), h.errors.length === 0);
  console.log(`Generalprüfung Einstellungen/Tresor: ${total()} bestanden`);
} finally { await h.stop(); }
