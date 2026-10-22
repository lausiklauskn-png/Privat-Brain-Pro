/* Links to get the AI keys (Klaus 2026-10-22: "Nutzer wissen oft nicht, wie schnell sie zu den entsprechenden Stellen
   kommen" · "direkt einen Link zu Google Vision … direkt auf die Seite, wo ich die Keys erstellen kann").
   Next to the key field in the settings: one tap opens the provider's page in the browser. Google has no single key page:
   step 1 turns on the Cloud Vision API in a project, step 2 is the page where the API key is created, and if Google
   refuses that key for Vision ("Vision 403"), the general credentials page makes a key for the whole project.
   Nothing is filled in automatically; the key is still typed or pasted by the person. */
(() => {
  'use strict';
  const links = window.Capacitor?.Plugins?.ProLinks;
  if (typeof links?.open !== 'function') return;
  const PAGES = {
    googleVision: 'https://console.cloud.google.com/flows/enableapi?apiid=vision.googleapis.com',
    // Klaus 2026-10-22: the page where he created his key (without his project; Google opens the person's own one).
    googleKey: 'https://console.cloud.google.com/agent-platform/studio/settings/api-keys',
    googleCredentials: 'https://console.cloud.google.com/apis/credentials',
    mistral: 'https://console.mistral.ai/api-keys'
  };
  const W = {
    de: { googleVision: '① Google Vision einschalten', googleKey: '② Google-Schlüssel erstellen', googleCredentials: 'Bei „Vision 403“: andere Schlüsselseite', mistral: 'Mistral-Schlüssel holen',
      hintGoogle: 'Google Vision: ① tippen, Projekt wählen, „Aktivieren“. Dann ② tippen, Schlüssel erstellen, kopieren und oben einfügen. Meldet die App „Vision 403“, den Schlüssel auf der anderen Schlüsselseite erstellen („Anmeldedaten erstellen“ → „API-Schlüssel“). Google verlangt dafür ein Konto mit Zahlungsangabe; die ersten 1.000 Seiten im Monat sind laut Google kostenlos.',
      hintMistral: 'Mistral: anmelden, „Create new key“, kopieren und oben einfügen.',
      wrongKey: '⚠ Das sieht nicht wie ein Google-Schlüssel aus (sie beginnen mit „AIza“). Bitte den Google-Schlüssel einfügen, sonst geht der falsche Schlüssel an Google.' },
    en: { googleVision: '① Turn on Google Vision', googleKey: '② Create Google key', googleCredentials: 'If "Vision 403": other key page', mistral: 'Get Mistral key',
      hintGoogle: 'Google Vision: tap ①, choose a project, "Enable". Then tap ②, create a key, copy and paste it above. If the app says "Vision 403", create the key on the other key page ("Create credentials" → "API key"). Google asks for an account with billing details; according to Google the first 1,000 pages a month are free.',
      hintMistral: 'Mistral: sign in, "Create new key", copy and paste it above.',
      wrongKey: '⚠ This does not look like a Google key (they start with "AIza"). Please paste the Google key, otherwise the wrong key goes to Google.' },
    ru: { googleVision: '① Включить Google Vision', googleKey: '② Создать ключ Google', googleCredentials: 'При «Vision 403»: другая страница ключей', mistral: 'Получить ключ Mistral',
      hintGoogle: 'Google Vision: нажмите ①, выберите проект, «Включить». Затем ②, создайте ключ, скопируйте и вставьте выше. Если приложение пишет «Vision 403», создайте ключ на другой странице («Создать учётные данные» → «Ключ API»). Google требует аккаунт с платёжными данными; по данным Google первые 1000 страниц в месяц бесплатны.',
      hintMistral: 'Mistral: войдите, «Create new key», скопируйте и вставьте выше.',
      wrongKey: '⚠ Это не похоже на ключ Google (он начинается с «AIza»). Вставьте ключ Google, иначе в Google уйдёт чужой ключ.' },
    pl: { googleVision: '① Włącz Google Vision', googleKey: '② Utwórz klucz Google', googleCredentials: 'Przy „Vision 403”: inna strona kluczy', mistral: 'Pobierz klucz Mistral',
      hintGoogle: 'Google Vision: dotknij ①, wybierz projekt, „Włącz”. Potem ②, utwórz klucz, skopiuj i wklej powyżej. Jeśli aplikacja pokaże „Vision 403”, utwórz klucz na innej stronie („Utwórz dane logowania” → „Klucz API”). Google wymaga konta z danymi płatności; według Google pierwsze 1000 stron miesięcznie jest bezpłatne.',
      hintMistral: 'Mistral: zaloguj się, „Create new key”, skopiuj i wklej powyżej.',
      wrongKey: '⚠ To nie wygląda na klucz Google (zaczyna się od „AIza”). Wklej klucz Google, inaczej do Google trafi zły klucz.' }
  };
  const t = k => (W[document.documentElement.lang] || W.de)[k];

  function render() {
    const field = document.getElementById('aiKey')?.closest('label');
    if (!field) return;
    let row = document.getElementById('pb-ai-key-links');
    if (!row) {
      row = document.createElement('div');
      row.id = 'pb-ai-key-links'; row.className = 'pb-ai-key-links';
      for (const page of Object.keys(PAGES)) {
        const b = document.createElement('button');
        b.type = 'button'; b.className = 'ghost'; b.dataset.keyPage = page;
        b.addEventListener('click', event => { if (event.isTrusted) void links.open({ url: PAGES[page] }); });
        row.append(b);
      }
      for (const cls of ['pb-ai-key-hint', 'pb-ai-key-hint', 'pb-ai-key-warn']) {
        const p = document.createElement('p'); p.className = cls; row.append(p);
      }
      field.after(row);
    }
    // All buttons stay visible: Google for the text recognition, Mistral also for "KI beim Schreiben".
    for (const b of row.querySelectorAll('[data-key-page]')) b.textContent = '↗ ' + t(b.dataset.keyPage);
    const [hintGoogle, hintMistral] = row.querySelectorAll('.pb-ai-key-hint');
    hintGoogle.dataset.for = 'google'; hintGoogle.textContent = t('hintGoogle');
    hintMistral.dataset.for = 'mistral'; hintMistral.textContent = t('hintMistral');
    const chosen = document.getElementById('aiProvider')?.value || '';
    const key = (document.getElementById('aiKey')?.value || '').trim();
    const warn = row.querySelector('.pb-ai-key-warn');
    warn.hidden = !(chosen === 'google' && key && !key.startsWith('AIza'));
    warn.textContent = t('wrongKey');
  }
  const start = () => {
    render();
    document.getElementById('aiProvider')?.addEventListener('change', render);
    document.getElementById('aiKey')?.addEventListener('input', render);
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true }); else start();
  new MutationObserver(render).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
})();
