// Erzeugt aus Datei-Organizer lib/eml.ts (scripts/kern-js.mjs). Nicht von Hand ändern.
const MAX_TIEFE = 4;
function kopfTeilen(roh) {
  const trenn = roh.search(/\r?\n\r?\n/);
  const kopfText = trenn >= 0 ? roh.slice(0, trenn) : roh;
  const rumpf = trenn >= 0 ? roh.slice(trenn).replace(/^\r?\n\r?\n/, "") : "";
  const kopf = {};
  let letzter = "";
  for (const zeile of kopfText.split(/\r?\n/)) {
    if (/^\s/.test(zeile) && letzter) {
      kopf[letzter] += " " + zeile.trim();
      continue;
    }
    const m = zeile.match(/^([\w-]+):\s*(.*)$/);
    if (m) {
      letzter = m[1].toLowerCase();
      kopf[letzter] = (kopf[letzter] ? kopf[letzter] + ", " : "") + m[2];
    }
  }
  return { kopf, rumpf };
}
function kopfDekodieren(s) {
  return s.replace(/=\?([^?]+)\?([QBqb])\?([^?]*)\?=/g, (_g, satz, art, inhalt) => {
    const bytes = art.toUpperCase() === "B" ? b64(inhalt) : qp(inhalt.replace(/_/g, " "));
    return textAus(bytes, satz);
  }).replace(/\?=\s+=\?/g, "");
}
function textAus(bytes, satz = "utf-8") {
  try {
    return new TextDecoder(/8859|latin/i.test(satz) ? "latin1" : /1252/.test(satz) ? "windows-1252" : "utf-8").decode(bytes);
  } catch {
    return new TextDecoder("utf-8").decode(bytes);
  }
}
function b64(s) {
  const sauber = s.replace(/[^A-Za-z0-9+/=]/g, "");
  const bin = atob(sauber);
  const o = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) o[i] = bin.charCodeAt(i);
  return o;
}
function qp(s) {
  const weich = s.replace(/=\r?\n/g, "");
  const o = [];
  for (let i = 0; i < weich.length; i++) {
    const c = weich[i];
    if (c === "=" && /^[0-9A-Fa-f]{2}$/.test(weich.slice(i + 1, i + 3))) {
      o.push(parseInt(weich.slice(i + 1, i + 3), 16));
      i += 2;
    } else {
      const b = new TextEncoder().encode(c);
      o.push(...b);
    }
  }
  return new Uint8Array(o);
}
function param(wert, name) {
  const m = wert.match(new RegExp(`${name}\\*?=\\s*(?:"([^"]*)"|([^;\\s]+))`, "i"));
  const roh = m ? m[1] ?? m[2] ?? "" : "";
  if (/^utf-8''/i.test(roh)) {
    try {
      return decodeURIComponent(roh.replace(/^utf-8''/i, ""));
    } catch {
      return roh;
    }
  }
  return kopfDekodieren(roh);
}
function teil(roh, tiefe, aus) {
  const { kopf, rumpf } = kopfTeilen(roh);
  const typ = kopf["content-type"] || "text/plain";
  const kodierung = (kopf["content-transfer-encoding"] || "").toLowerCase();
  const disp = kopf["content-disposition"] || "";
  const name = param(disp, "filename") || param(typ, "name");
  if (/^multipart\//i.test(typ) && tiefe < MAX_TIEFE) {
    const grenze = param(typ, "boundary");
    if (!grenze) return;
    const stuecke = rumpf.split(new RegExp(`\\r?\\n?--${grenze.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?:--)?\\s*\\r?\\n?`));
    for (const s of stuecke) if (s.trim()) teil(s, tiefe + 1, aus);
    return;
  }
  const bytes = kodierung === "base64" ? b64(rumpf) : kodierung === "quoted-printable" ? qp(rumpf) : new TextEncoder().encode(rumpf);
  if (/^message\/rfc822/i.test(typ) && tiefe < MAX_TIEFE) {
    aus.anhaenge.push({ name: name || "weitergeleitet.eml", mime: "message/rfc822", daten: bytes });
    return;
  }
  if (name || /attachment/i.test(disp)) {
    aus.anhaenge.push({ name: name || "anhang", mime: typ.split(";")[0].trim(), daten: bytes });
    return;
  }
  if (/^text\/plain/i.test(typ)) aus.text.push(textAus(bytes, param(typ, "charset") || "utf-8"));
  else if (/^text\/html/i.test(typ) && !aus.text.length) aus.text.push(textAus(bytes, param(typ, "charset") || "utf-8").replace(/<br\s*\/?>/gi, "\n").replace(/<\/p>/gi, "\n").replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/[ \t]+/g, " "));
}
function leseEml(roh) {
  const { kopf } = kopfTeilen(roh);
  const aus = { text: [], anhaenge: [] };
  teil(roh, 0, aus);
  const meta = {
    von: kopfDekodieren(kopf["from"] || ""),
    an: kopfDekodieren(kopf["to"] || ""),
    betreff: kopfDekodieren(kopf["subject"] || ""),
    datum: datumAusKopf(kopf["date"] || ""),
    anhaenge: aus.anhaenge.map((a) => a.name)
  };
  return { meta, text: aus.text.join("\n").trim(), anhaenge: aus.anhaenge };
}
function datumAusKopf(s) {
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? void 0 : d.toISOString().slice(0, 10);
}
function absenderName(von) {
  const m = von.match(/^\s*"?([^"<]+?)"?\s*<[^>]+>/);
  if (m) return m[1].trim();
  return von.replace(/[<>]/g, "").trim();
}
export {
  absenderName,
  b64,
  kopfDekodieren,
  leseEml
};
