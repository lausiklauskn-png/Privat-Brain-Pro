/* Display copies only. Raw MIME and catalog/reply text never pass through this renderer. */
(() => {
  'use strict';
  const labels = {
    original: ['Originalansicht', 'Original view', 'Оригинальный вид', 'Widok oryginału'],
    text: ['Textansicht', 'Text view', 'Текстовый вид', 'Widok tekstowy'],
    hideImages: ['Externe Bilder ausblenden', 'Hide external images', 'Скрыть внешние изображения', 'Ukryj obrazy zewnętrzne'],
    showImages: ['Externe Bilder laden', 'Load external images', 'Загрузить внешние изображения', 'Wczytaj obrazy zewnętrzne'],
    imageHint: ['Externe Bilder werden vom Absender geladen.', 'External images are loaded from the sender.', 'Внешние изображения загружаются у отправителя.', 'Obrazy zewnętrzne są pobierane od nadawcy.'],
    body: ['E-Mail im Original-Layout', 'Email in its original layout', 'Письмо в оригинальном оформлении', 'Wiadomość w oryginalnym układzie'],
    linkError: ['Link konnte nicht geöffnet werden. Prüfe, ob ein Browser verfügbar ist.', 'Unable to open the link. Check that a browser is available.', 'Не удалось открыть ссылку. Проверьте наличие браузера.', 'Nie można otworzyć linku. Sprawdź dostępność przeglądarki.']
  };
  const T = key => labels[key][Math.max(0, ['de','en','ru','pl'].indexOf(document.documentElement.lang))];
  const tags = new Set('a abbr address article b bdi bdo big blockquote br caption center cite code col colgroup dd del details div dl dt em figcaption figure font footer h1 h2 h3 h4 h5 h6 header hr i img ins li main mark ol p picture pre q s section small source span strike strong style sub summary sup table tbody td th thead time tr tt u ul wbr'.split(' '));
  const attrs = new Set('align alt bgcolor border cellpadding cellspacing class color colspan dir face height hspace id lang rowspan size span style title valign vspace width'.split(' '));
  const raster = /^image\/(png|jpeg|gif|webp|avif|bmp)$/i;
  // No app origin, device files, custom intent schemes, userinfo or local-network links.
  function webUrl(value) {
    try {
      if(typeof value!=='string'||value.length>8192)return '';
      const url = new URL(value);
      if (!['https:','http:'].includes(url.protocol) || url.username || url.password) return '';
      if (!url.hostname.includes('.') || url.hostname.includes(':') || url.hostname.endsWith('.') || /(^localhost$|\.localhost$|\.local$|\.internal$|^\d+\.\d+\.\d+\.\d+$)/i.test(url.hostname)) return '';
      return url.href;
    } catch { return ''; }
  }
  function displayHtml(html, attachments, external, links=null, targets=null) {
    const cids = new Map();
    for (const file of attachments || []) {
      if (file.contentId && raster.test(file.type) && /^[A-Za-z0-9+/]*={0,2}$/.test(file.data))
        cids.set(file.contentId.replace(/^<|>$/g,''), `data:${file.type};base64,${file.data}`);
    }
    function image(value) {
      if (/^cid:/i.test(value)) {
        let id = value.slice(4);
        try { id = decodeURIComponent(id); } catch { /* Match literal malformed IDs only. */ }
        return cids.get(id.replace(/^<|>$/g,'')) || '';
      }
      if (/^data:image\/(png|jpeg|gif|webp|avif|bmp);base64,[A-Za-z0-9+/]*={0,2}$/i.test(value)) return value;
      const url = webUrl(value);
      return external && url.startsWith('https:') ? url : '';
    }
    // Template contents are inert: parsing must not request images before consent/CSP.
    const template = document.createElement('template');
    // Preserve body/root presentation attributes without connecting an untrusted document.
    template.innerHTML = String(html).replace(/<(\/?)body(?=[\s>])/gi,'<$1div').replace(/<(\/?)html(?=[\s>])/gi,'<$1div');
    for (const node of [...template.content.querySelectorAll('*')]) {
      if (node.namespaceURI !== 'http://www.w3.org/1999/xhtml' || !tags.has(node.localName)) { node.remove(); continue; }
      const href = node.localName === 'a' ? webUrl(node.getAttribute('href')) : '';
      const src = node.localName === 'img' ? image(node.getAttribute('src') || '') : '';
      const background = image(node.getAttribute('background') || '');
      for (const attr of [...node.attributes]) if (!attrs.has(attr.name)) node.removeAttribute(attr.name);
      if (href) {
        if(links)links.push(href);
        const target=links?(targets?.get(href)||''):href;
        if(target){node.setAttribute('href',target);if(targets)node.setAttribute('target','_top');}
        node.setAttribute('rel','noreferrer noopener');
        if(!node.hasAttribute('title'))node.setAttribute('title',href);
      }
      if (src) { node.setAttribute('src',src); node.setAttribute('referrerpolicy','no-referrer'); }
      if (background) node.setAttribute('background',background);
      // CID backgrounds used by newsletters, including inline CSS and <style> rules.
      const css = value => value.replace(/url\(\s*(["']?)cid:([^\s)'"<>]+)\1\s*\)/gi, (_,quote,id) => `url("${cids.get(id) || ''}")`);
      if (node.hasAttribute('style')) node.setAttribute('style',css(node.getAttribute('style')));
      if (node.localName === 'style') node.textContent = css(node.textContent);
    }
    const policy = `default-src 'none'; script-src 'none'; style-src 'unsafe-inline'; img-src data:${external ? ' https:' : ''}; font-src 'none'; connect-src 'none'; frame-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'`;
    return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Security-Policy" content="${policy}"><meta name="referrer" content="no-referrer"><style>html{color-scheme:light}body{margin:12px;background:#fff;color:#222;font:16px/1.5 Arial,sans-serif;overflow-wrap:anywhere}img{max-width:100%;height:auto}table{max-width:100%}</style></head><body>${template.innerHTML}</body></html>`;
  }
  const views = new WeakMap();
  new MutationObserver(() => document.querySelectorAll('.mail-original').forEach(root => views.get(root)?.())).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
  window.PBMailView = {
    render(mail) {
      const root = document.createElement('div'); root.className = 'mail-original';
      const text = document.createElement('pre'); text.className = 'mail-text'; text.textContent = mail.text || '';
      const nativeLinks=window.Capacitor?.Plugins?.ProLinks;
      if(typeof nativeLinks?.open==='function'){
        const value=mail.text||'',pattern=/https?:\/\/[^\s<>"'\u0000-\u001f]+/gi;let offset=0;const fragment=document.createDocumentFragment();
        for(const match of value.matchAll(pattern)){
          let raw=match[0].replace(/[.,;!?]+$/g,'');
          for(const [open,close] of [['(',')'],['[',']']])
            while(raw.endsWith(close)&&raw.split(close).length>raw.split(open).length)raw=raw.slice(0,-1);
          const url=webUrl(raw);if(!url)continue;
          fragment.append(document.createTextNode(value.slice(offset,match.index)));
          const link=document.createElement('a');link.textContent=raw;link.href=url;
          link.onclick=async event=>{event.preventDefault();if(!event.isTrusted)return;
            try{await nativeLinks.open({url});}catch{const notice=document.createElement('p');notice.setAttribute('role','status');notice.textContent=T('linkError');root.append(notice);}
          };
          fragment.append(link);offset=match.index+raw.length;
        }
        fragment.append(document.createTextNode(value.slice(offset)));text.replaceChildren(fragment);
      }
      if (!mail.html) { root.append(text); return root; }
      const controls = document.createElement('div'); controls.className = 'mail-reader-actions';
      const toggle = document.createElement('button'), images = document.createElement('button');
      toggle.dataset.nativeTool = 'view'; images.dataset.nativeTool = 'images';
      toggle.type = images.type = 'button'; toggle.className = images.className = 'mail-button';
      const frame = document.createElement('iframe'); frame.className = 'mail-html';
      frame.setAttribute('sandbox',''); // No scripts, same-origin, forms, popups or bridge access.
      frame.setAttribute('referrerpolicy','no-referrer'); frame.title = T('body');
      const hint = document.createElement('span'); hint.className = 'mail-muted';
      let showText = false, external = localStorage.getItem('pb_mail_external_images') !== 'off';
      let generation=0;
      function refresh() {
        toggle.textContent = T(showText ? 'original' : 'text');
        toggle.setAttribute('aria-pressed',String(showText));
        images.textContent = T(external ? 'hideImages' : 'showImages');
        images.hidden = showText; hint.hidden = showText || !external; hint.textContent = T('imageHint');
        frame.hidden = showText; text.hidden = !showText;
        const version=++generation,links=typeof nativeLinks?.prepare==='function'?[]:null;
        frame.setAttribute('sandbox','');
        frame.srcdoc = displayHtml(mail.html,mail.attachments,external,links);
        frame.dataset.linksReady=links?.length?'false':'true';
        if(links?.length){
          const urls=[...new Set(links)].slice(0,200);
          nativeLinks.prepare({urls}).then(result=>{
            if(generation!==version)return;
            const targets=new Map();urls.forEach((url,index)=>{const ticket=result.tickets[index];if(/^[a-f0-9-]{36}$/.test(ticket||''))targets.set(url,location.origin+'/_pb_mail_link/'+ticket);});
            // Only sanitized links to native opaque routes may target the parent, and
            // only with a real user activation. No scripts, origin access or popups.
            // Android WebView does not consistently report HTTP subframe navigation.
            if(targets.size)frame.setAttribute('sandbox','allow-top-navigation-by-user-activation');
            frame.srcdoc=displayHtml(mail.html,mail.attachments,external,[],targets);frame.dataset.linksReady='true';
          }).catch(()=>{if(generation===version){hint.textContent=T('linkError');hint.hidden=false;frame.dataset.linksReady='error';}});
        }
      }
      toggle.onclick = () => { showText = !showText; refresh(); };
      images.onclick = () => { external = !external; localStorage.setItem('pb_mail_external_images',external ? 'on' : 'off'); refresh(); };
      views.set(root,refresh);
      controls.append(toggle,images,hint); root.append(controls,frame,text); refresh();
      return root;
    }
  };
})();
