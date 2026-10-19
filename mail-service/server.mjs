/* Private Brain's opt-in private mail bridge. No account data is exposed to Pages. */
import express from "express";
import { ImapFlow } from "imapflow";
import nodemailer from "nodemailer";
import { simpleParser } from "mailparser";
import {
  randomBytes,
  createCipheriv,
  createDecipheriv,
  timingSafeEqual,
  createHash,
} from "node:crypto";
import { mkdir, readFile, writeFile, rename } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
const HERE = dirname(fileURLToPath(import.meta.url));
export const PRESETS = {
  telekom: { imap: "secureimap.t-online.de", smtp: "securesmtp.t-online.de" },
  hetzner: { imap: "mail.your-server.de", smtp: "mail.your-server.de" },
};
const fail = (message, status = 400) =>
  Object.assign(new Error(message), { status });
function clean(value, max = 1000) {
  if (
    typeof value !== "string" ||
    value.length > max ||
    /[\x00-\x1f\x7f]/.test(value)
  )
    throw fail("Ungültige Eingabe.");
  return value;
}
export function validateAccount(input, allowed) {
  const preset = PRESETS[input.provider];
  if (!preset) throw fail("Anbieter auswählen.");
  const email = clean(input.email, 254).trim();
  if (!/^[^\s<>@,;]+@[^\s<>@,;]+\.[^\s<>@,;]+$/.test(email))
    throw fail("Ungültige E-Mail-Adresse.");
  const imap = clean(input.imap || preset.imap, 253).toLowerCase(),
    smtp = clean(input.smtp || preset.smtp, 253).toLowerCase();
  for (const host of [imap, smtp])
    if (!allowed.has(host))
      throw fail("Mailserver ist nicht in MAIL_ALLOWED_HOSTS freigegeben.");
  const password = clean(input.password, 1024);
  if (!password) throw fail("Passwort fehlt.");
  const id = createHash("sha256")
    .update(email.toLowerCase() + "|" + imap)
    .digest("hex")
    .slice(0, 24);
  return {
    id,
    provider: input.provider,
    email,
    user: clean(input.user || email, 254),
    password,
    imap,
    smtp,
  };
}
export async function createStore(directory) {
  await mkdir(directory, { recursive: true, mode: 0o700 });
  let key;
  try {
    key = await readFile(resolve(directory, "key"));
  } catch (e) {
    if (e.code !== "ENOENT") throw e;
    key = randomBytes(32);
    await writeFile(resolve(directory, "key"), key, {
      mode: 0o600,
      flag: "wx",
    });
  }
  if (key.length !== 32) throw new Error("Ungültiger Datenschlüssel");
  let state = { accounts: {}, submissions: {} };
  try {
    const bytes = await readFile(resolve(directory, "accounts.enc"));
    const d = createDecipheriv("aes-256-gcm", key, bytes.subarray(0, 12));
    d.setAuthTag(bytes.subarray(12, 28));
    state = JSON.parse(
      Buffer.concat([d.update(bytes.subarray(28)), d.final()]),
    );
  } catch (e) {
    if (e.code !== "ENOENT") throw e;
  }
  async function save() {
    const iv = randomBytes(12),
      c = createCipheriv("aes-256-gcm", key, iv),
      enc = Buffer.concat([c.update(JSON.stringify(state)), c.final()]);
    await writeFile(
      resolve(directory, "accounts.tmp"),
      Buffer.concat([iv, c.getAuthTag(), enc]),
      { mode: 0o600 },
    );
    await rename(
      resolve(directory, "accounts.tmp"),
      resolve(directory, "accounts.enc"),
    );
  }
  return {
    all: () => Object.values(state.accounts),
    get: (id) => state.accounts[id],
    async put(a) {
      state.accounts[a.id] = a;
      await save();
    },
    async remove(id) {
      delete state.accounts[id];
      await save();
    },
    submission: (key) => state.submissions[key],
    async submit(key, result) {
      state.submissions[key] = result;
      await save();
    },
  };
}
function imapOptions(a) {
  return {
    host: a.imap,
    port: 993,
    secure: true,
    auth: { user: a.user, pass: a.password },
    logger: false,
    connectionTimeout: 15000,
    greetingTimeout: 15000,
    socketTimeout: 45000,
    tls: { minVersion: "TLSv1.2", rejectUnauthorized: true },
  };
}
function smtpFor(a) {
  return nodemailer.createTransport({
    host: a.smtp,
    port: 465,
    secure: true,
    auth: { user: a.user, pass: a.password },
    logger: false,
    debug: false,
    connectionTimeout: 15000,
    socketTimeout: 45000,
    tls: { minVersion: "TLSv1.2", rejectUnauthorized: true },
  });
}
export function createApp({
  store,
  token,
  origin,
  allowedHosts,
  imapFactory = (a) => new ImapFlow(imapOptions(a)),
  smtpFactory = smtpFor,
  webRoot = resolve(HERE, "../"),
  maxBytes = 30 * 1024 * 1024,
}) {
  if (!token || token.length < 32)
    throw new Error("MAIL_TOKEN muss mindestens 32 Zeichen haben.");
  const app = express();
  app.disable("x-powered-by");
  app.use("/api/mail", (req, res, next) => {
    res.set({
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    });
    const requestOrigin = req.get("origin");
    if (requestOrigin && requestOrigin !== origin)
      return res.status(403).json({ error: "Origin nicht freigegeben." });
    if (requestOrigin) {
      res.set({
        "Access-Control-Allow-Origin": origin,
        Vary: "Origin",
        "Access-Control-Allow-Headers": "Authorization, Content-Type",
        "Access-Control-Allow-Methods": "GET,POST,DELETE,OPTIONS",
      });
    }
    if (req.method === "OPTIONS") return res.sendStatus(204);
    const incoming = Buffer.from(req.get("authorization") || ""),
      expected = Buffer.from("Bearer " + token);
    if (
      incoming.length !== expected.length ||
      !timingSafeEqual(incoming, expected)
    )
      return res.status(401).json({ error: "Dienst-Schlüssel ungültig." });
    next();
  });
  app.use("/api/mail", express.json({ limit: "42mb" }));
  // Serialize mailbox work. This also prevents racing credential writes and duplicate button actions.
  let chain = Promise.resolve();
  function route(method, path, fn) {
    app[method]("/api/mail" + path, (req, res, next) => {
      const work = chain.then(() => fn(req, res));
      chain = work.catch(() => {});
      work.catch(next);
    });
  }
  function account(req) {
    const a = store.get(clean(req.params.id, 32));
    if (!a) throw fail("Konto nicht gefunden.", 404);
    return a;
  }
  const publicAccount = (a) => ({
    id: a.id,
    email: a.email,
    provider: a.provider,
  });
  async function session(a, fn) {
    const c = imapFactory(a);
    try {
      await c.connect();
      return await fn(c);
    } finally {
      try {
        await c.logout();
      } catch {
        c.close();
      }
    }
  }
  const path = (req) =>
    clean(req.query.folder || req.body?.folder || "INBOX", 1000);
  const uid = (req) => {
    const n = Number(req.params.uid);
    if (!Number.isSafeInteger(n) || n < 1) throw fail("Ungültige UID.");
    return n;
  };
  async function mailbox(c, req) {
    await c.mailboxOpen(path(req));
    if (
      String(c.mailbox.uidValidity) !==
      String(req.query.validity || req.body?.validity)
    )
      throw fail("Ordner hat sich geändert. Bitte neu laden.", 409);
  }
  route("get", "/accounts", async (req, res) =>
    res.json(store.all().map(publicAccount)),
  );
  route("post", "/accounts", async (req, res) => {
    const a = validateAccount(req.body, allowedHosts);
    await session(a, async () => {});
    const smtp = smtpFactory(a);
    try {
      await smtp.verify();
    } finally {
      smtp.close();
    }
    await store.put(a);
    res.json(publicAccount(a));
  });
  route("delete", "/accounts/:id", async (req, res) => {
    await store.remove(account(req).id);
    res.json({ ok: true });
  });
  route("get", "/:id/folders", async (req, res) =>
    res.json(
      await session(account(req), async (c) =>
        (await c.list())
          .filter((f) => !f.flags.has("\\Noselect"))
          .map((f) => ({
            path: f.path,
            name: f.name,
            specialUse: f.specialUse || "",
          })),
      ),
    ),
  );
  route("post", "/:id/folders", async (req, res) => {
    const name = clean(req.body.name, 200).trim();
    if (!name) throw fail("Ordnername fehlt.");
    await session(account(req), (c) => c.mailboxCreate(name));
    res.json({ ok: true });
  });
  route("get", "/:id/messages", async (req, res) =>
    res.json(
      await session(account(req), async (c) => {
        await c.mailboxOpen(path(req));
        const all = await c.search({ all: true }, { uid: true });
        const before = Number(req.query.before) || Infinity;
        const ids = all
            .filter((id) => id < before)
            .sort((a, b) => b - a)
            .slice(0, 50),
          items = [];
        if (ids.length)
          for await (const m of c.fetch(
            ids.join(","),
            { uid: true, envelope: true, flags: true, size: true },
            { uid: true },
          ))
            items.push({
              uid: m.uid,
              subject: m.envelope?.subject || "",
              from: m.envelope?.from?.map((x) => x.address).join(", ") || "",
              date: m.envelope?.date || "",
              flags: [...m.flags],
              size: m.size,
            });
        return {
          validity: String(c.mailbox.uidValidity),
          items: items.sort((a, b) => b.uid - a.uid),
          next: ids.length === 50 ? Math.min(...ids) : null,
        };
      }),
    ),
  );
  async function source(c, req) {
    await mailbox(c, req);
    const meta = await c.fetchOne(uid(req), { size: true }, { uid: true });
    if (!meta) throw fail("Nachricht nicht gefunden.", 404);
    if (meta.size > maxBytes) throw fail("Nachricht über 30 MB.", 413);
    const m = await c.fetchOne(
      uid(req),
      { source: true, size: true },
      { uid: true },
    );
    if (!m) throw fail("Nachricht nicht gefunden.", 404);
    if (m.size > maxBytes || m.source.length > maxBytes)
      throw fail(
        "Nachricht über 30 MB. Bitte im Anbieter-Webmail öffnen.",
        413,
      );
    return m.source;
  }
  route("get", "/:id/messages/:uid", async (req, res) =>
    res.json(
      await session(account(req), async (c) => {
        const raw = await source(c, req);
        const m = await simpleParser(raw, {
          skipHtmlToText: false,
          skipTextToHtml: true,
        });
        return {
          raw: raw.toString("utf8"),
          sourceBase64: raw.toString("base64"),
          subject: m.subject || "",
          messageId: m.messageId || "",
          replyTo:
            m.replyTo?.value
              .map((x) => x.address)
              .filter(Boolean)
              .join(", ") || "",
          from: m.from?.text || "",
          to:
            m.to?.value
              .map((x) => x.address)
              .filter(Boolean)
              .join(", ") || "",
          cc:
            m.cc?.value
              .map((x) => x.address)
              .filter(Boolean)
              .join(", ") || "",
          bcc:
            m.bcc?.value
              .map((x) => x.address)
              .filter(Boolean)
              .join(", ") || "",
          text: m.text || "",
          attachments: m.attachments.map((a) => ({
            name: a.filename || "attachment",
            type: a.contentType,
            data: a.content.toString("base64"),
          })),
        };
      }),
    ),
  );
  route("post", "/:id/messages/:uid/action", async (req, res) => {
    await session(account(req), async (c) => {
      await mailbox(c, req);
      const id = uid(req);
      switch (req.body.action) {
        case "read":
        case "unread":
        case "star":
        case "unstar": {
          const flag = ["read", "unread"].includes(req.body.action)
            ? "\\Seen"
            : "\\Flagged";
          await c[
            ["read", "star"].includes(req.body.action)
              ? "messageFlagsAdd"
              : "messageFlagsRemove"
          ](id, [flag], { uid: true });
          break;
        }
        case "move":
          await c.messageMove(id, clean(req.body.target, 1000), { uid: true });
          break;
        case "delete": {
          const folders = await c.list();
          const trash = folders.find((f) => f.specialUse === "\\Trash");
          if (!trash || trash.path !== path(req))
            throw fail("Endgültiges Löschen nur im Papierkorb.");
          await c.messageDelete(id, { uid: true });
          break;
        }
        default:
          throw fail("Unbekannte Aktion.");
      }
    });
    res.json({ ok: true });
  });
  function message(a, input, isDraft = false) {
    const subject = clean(input.subject, 998);
    const recipients = {};
    let count = 0;
    for (const field of ["to", "cc", "bcc"]) {
      const value = clean(input[field] || "", 2000);
      const list = value
        .split(/[;,]/)
        .map((s) => s.trim())
        .filter(Boolean);
      for (const email of list)
        if (!/^[^\s<>@,;]+@[^\s<>@,;]+\.[^\s<>@,;]+$/.test(email))
          throw fail("Empfänger als E-Mail-Adressen eingeben.");
      count += list.length;
      recipients[field] = list;
    }
    if ((!count && !isDraft) || count > 100)
      throw fail("1 bis 100 Empfänger erforderlich.");
    if (typeof input.text !== "string" || input.text.length > 2 * 1024 * 1024)
      throw fail("Nachricht zu groß.");
    if (!Array.isArray(input.attachments) || input.attachments.length > 30)
      throw fail("Ungültige Anhänge.");
    let size = 0;
    const attachments = input.attachments.map((a) => {
      const content = Buffer.from(a.data || "", "base64");
      size += content.length;
      return {
        filename: clean(a.name, 255),
        content,
        contentType: "application/octet-stream",
      };
    });
    if (size > 25 * 1024 * 1024)
      throw fail("Anhänge zusammen höchstens 25 MB.");
    return {
      from: a.email,
      ...recipients,
      subject,
      text: input.text,
      attachments,
      ...(input.inReplyTo ? { inReplyTo: clean(input.inReplyTo, 998) } : {}),
      disableFileAccess: true,
      disableUrlAccess: true,
    };
  }
  // A submission key is retained server-side: a lost browser response must never silently resend.
  route("post", "/:id/send", async (req, res) => {
    const a = account(req);
    if (!/^[a-f0-9-]{36}$/.test(req.body.submission || ""))
      throw fail("Übermittlungsschlüssel fehlt.");
    const key = a.id + ":" + req.body.submission;
    if (store.submission(key)) return res.json(store.submission(key));
    const mail = message(a, req.body);
    const smtp = smtpFactory(a);
    let result;
    await store.submit(key, {
      status: "uncertain",
      notice:
        "Übermittlung unklar. Gesendet-Ordner prüfen; nicht automatisch erneut senden.",
    });
    try {
      result = await smtp.sendMail(mail);
    } catch (e) {
      throw fail(
        "SMTP-Ergebnis unklar. Gesendet-Ordner oder Anbieter prüfen. Kein automatischer Wiederholungsversuch.",
        502,
      );
    } finally {
      smtp.close();
    }
    const accepted = result.accepted || [],
      rejected = result.rejected || [];
    const outcome = {
      status: rejected.length ? "partial" : "sent",
      accepted,
      rejected,
      saved: false,
      messageId: result.messageId,
    };
    await store.submit(key, outcome);
    // Store Bcc-free RFC822 copy in the provider's actual Sent folder.
    try {
      const builder = nodemailer.createTransport({
        streamTransport: true,
        buffer: true,
        newline: "windows",
      });
      const copy = await builder.sendMail({
        ...mail,
        bcc: undefined,
        messageId: result.messageId,
      });
      await session(a, async (c) => {
        let folders = await c.list();
        let sent = folders.find((f) => f.specialUse === "\\Sent");
        if (!sent) {
          await c.mailboxCreate("Sent");
          sent = { path: "Sent" };
        }
        await c.append(sent.path, copy.message, ["\\Seen"]);
      });
      outcome.saved = true;
    } catch {
      outcome.notice =
        "SMTP hat die Nachricht angenommen; Gesendet-Kopie konnte nicht gespeichert werden. Nicht erneut senden.";
    }
    await store.submit(key, outcome);
    res.json(outcome);
  });
  route("post", "/:id/draft", async (req, res) => {
    const a = account(req),
      mail = message(a, req.body, true),
      builder = nodemailer.createTransport({
        streamTransport: true,
        buffer: true,
        newline: "windows",
      }),
      copy = await builder.sendMail({ ...mail, keepBcc: true });
    await session(a, async (c) => {
      const folders = await c.list();
      let draft = folders.find((f) => f.specialUse === "\\Drafts");
      if (!draft) {
        await c.mailboxCreate("Drafts");
        draft = { path: "Drafts" };
      }
      await c.append(draft.path, copy.message, ["\\Draft", "\\Seen"]);
    });
    res.json({ ok: true });
  });
  app.use("/api/mail", (err, req, res, next) => {
    res
      .status(err.status || 502)
      .json({
        error: err.status
          ? err.message
          : "Mailserver nicht erreichbar oder Anmeldung fehlgeschlagen. Serverdaten und Zugang prüfen.",
      });
  });
  // Only application assets; never serve the service directory or server credentials.
  for (const prefix of ["/assets", "/modules", "/models"])
    app.use(
      prefix,
      express.static(resolve(webRoot, "." + prefix), { dotfiles: "deny" }),
    );
  for (const file of [
    "index.html",
    "sw.js",
    "app-manifest.json",
    "icon-192.png",
    "icon-512.png",
    "catalog-emblem.png",
    "pb-caption.js",
    "sicherheit.html",
    "impressum.html",
  ])
    app.get("/" + file, (req, res) => res.sendFile(resolve(webRoot, file)));
  app.get("/sbkim/spore.json", (req, res) =>
    res.sendFile(resolve(webRoot, "sbkim/spore.json")),
  );
  app.get("/", (req, res) => res.sendFile(resolve(webRoot, "index.html")));
  return app;
}
if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  const data = resolve(process.env.MAIL_DATA || resolve(HERE, "data")),
    store = await createStore(data);
  const origin = process.env.MAIL_ORIGIN;
  if (!origin || new URL(origin).protocol !== "https:")
    throw new Error(
      "MAIL_ORIGIN muss die HTTPS-Adresse der privaten Anwendung sein.",
    );
  const allowedHosts = new Set(
    (
      process.env.MAIL_ALLOWED_HOSTS ||
      Object.values(PRESETS)
        .flatMap((p) => [p.imap, p.smtp])
        .join(",")
    )
      .split(",")
      .map((s) => s.trim().toLowerCase()),
  );
  const app = createApp({
    store,
    token: process.env.MAIL_TOKEN,
    origin,
    allowedHosts,
  });
  app.listen(
    Number(process.env.PORT) || 8787,
    process.env.MAIL_BIND || "127.0.0.1",
    () => console.log("Private Brain Mail-Dienst bereit."),
  );
}
