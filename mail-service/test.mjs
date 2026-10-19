import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createServer } from "node:net";
import nodemailer from "nodemailer";
import { createApp, createStore, PRESETS, validateAccount } from "./server.mjs";
const TOKEN = "test-only-token-0123456789-abcdefghijk",
  ORIGIN = "https://brain.example.test";
const hosts = new Set(Object.values(PRESETS).flatMap((x) => [x.imap, x.smtp]));
const raw = Buffer.from(
  "From: sender@example.test\r\nTo: info@example.test\r\nSubject: Beispiel\r\nMIME-Version: 1.0\r\nContent-Type: text/plain; charset=utf-8\r\n\r\nHallo Welt\r\n",
);
test("Servergrenzen, tatsächlicher SMTP-Dialog und dauerhaftes Wiederholungsschloss", async (t) => {
  const dir = await mkdtemp(join(tmpdir(), "pb-mail-test-"));
  const store = await createStore(dir);
  let sent = [],
    failSMTP = false,
    appends = [],
    moves = [],
    deleted = [];
  const smtp = createServer((socket) => {
    socket.setEncoding("utf8");
    socket.write("220 local-test ESMTP\r\n");
    let buffer = "",
      data = false,
      content = "";
    socket.on("data", (chunk) => {
      buffer += chunk;
      let at;
      while ((at = buffer.indexOf("\r\n")) >= 0) {
        const line = buffer.slice(0, at);
        buffer = buffer.slice(at + 2);
        if (data) {
          if (line === ".") {
            data = false;
            sent.push(content);
            if (failSMTP) {
              socket.destroy();
              return;
            }
            socket.write("250 2.0.0 queued\r\n");
          } else content += line + "\r\n";
          continue;
        }
        if (/^EHLO|^HELO/.test(line))
          socket.write("250-local-test\r\n250 SIZE 40000000\r\n");
        else if (/^MAIL FROM/.test(line)) socket.write("250 OK\r\n");
        else if (/^RCPT TO/.test(line))
          socket.write(
            line.includes("reject@") ? "550 Rejected\r\n" : "250 OK\r\n",
          );
        else if (line === "DATA") {
          data = true;
          content = "";
          socket.write("354 send\r\n");
        } else if (line === "QUIT") {
          socket.end("221 bye\r\n");
        } else socket.write("250 OK\r\n");
      }
    });
  });
  await new Promise((r) => smtp.listen(0, "127.0.0.1", r));
  const imapFactory = (a) => ({
    mailbox: { uidValidity: 22 },
    async connect() {
      if (a.password === "bad") throw new Error("auth");
    },
    async logout() {},
    close() {},
    async list() {
      return [
        {
          path: "INBOX",
          name: "Inbox",
          flags: new Set(),
          specialUse: "\\Inbox",
        },
        { path: "Sent", name: "Sent", flags: new Set(), specialUse: "\\Sent" },
        {
          path: "Trash",
          name: "Trash",
          flags: new Set(),
          specialUse: "\\Trash",
        },
        {
          path: "Drafts",
          name: "Drafts",
          flags: new Set(),
          specialUse: "\\Drafts",
        },
      ];
    },
    async mailboxOpen(path) {
      this.path = path;
    },
    async search() {
      return Array.from({ length: 70 }, (_, i) => i + 1);
    },
    async *fetch(ids) {
      for (const id of ids.split(","))
        yield {
          uid: Number(id),
          size: raw.length,
          flags: new Set(),
          envelope: {
            subject: "Beispiel",
            from: [{ address: "sender@example.test" }],
            date: new Date(),
          },
        };
    },
    async fetchOne(id, opts) {
      return id === 99
        ? { size: 40 * 1024 * 1024 }
        : { size: raw.length, ...(opts.source ? { source: raw } : {}) };
    },
    async messageFlagsAdd() {},
    async messageFlagsRemove() {},
    async messageMove(...args) {
      moves.push(args);
    },
    async messageDelete(...args) {
      deleted.push(args);
    },
    async mailboxCreate() {},
    async append(path, bytes, flags) {
      appends.push({ path, bytes, flags });
    },
  });
  const smtpFactory = () =>
    nodemailer.createTransport({
      host: "127.0.0.1",
      port: smtp.address().port,
      secure: false,
      ignoreTLS: true,
    });
  const app = createApp({
    store,
    token: TOKEN,
    origin: ORIGIN,
    allowedHosts: hosts,
    imapFactory,
    smtpFactory,
  });
  const server = app.listen(0, "127.0.0.1");
  await new Promise((r) => server.once("listening", r));
  const base = "http://127.0.0.1:" + server.address().port;
  const call = async (path, body, extra = {}) => {
    const res = await fetch(base + "/api/mail" + path, {
      method: body ? "POST" : "GET",
      headers: {
        Authorization: "Bearer " + TOKEN,
        Origin: ORIGIN,
        ...(body ? { "Content-Type": "application/json" } : {}),
        ...extra,
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    return { status: res.status, data: await res.json(), headers: res.headers };
  };
  t.after(async () => {
    server.closeAllConnections();
    await new Promise((r) => server.close(r));
    await new Promise((r) => smtp.close(r));
    await rm(dir, { recursive: true, force: true });
  });
  await t.test("Token und Origin zwingend; keine Cache-Ablage", async () => {
    assert.equal(
      (await call("/accounts", null, { Authorization: "wrong" })).status,
      401,
    );
    assert.equal(
      (await call("/accounts", null, { Origin: "https://evil.test" })).status,
      403,
    );
    assert.equal(
      (await call("/accounts")).headers.get("cache-control"),
      "no-store",
    );
  });
  await t.test("Server- und Header-Manipulation werden abgewiesen", () => {
    assert.throws(() =>
      validateAccount(
        {
          provider: "hetzner",
          email: "x@example.test",
          password: "secret",
          imap: "127.0.0.1",
        },
        hosts,
      ),
    );
    assert.throws(() =>
      validateAccount(
        {
          provider: "hetzner",
          email: "x@example.test\r\nBcc: evil@example.test",
          password: "secret",
        },
        hosts,
      ),
    );
  });
  let id;
  await t.test(
    "Beide Anbieter; Anmeldung prüfen, verschlüsselt speichern, keine Passwörter zurückgeben",
    async () => {
      const input = {
        provider: "hetzner",
        email: "info@example.test",
        password: "private-test-password",
      };
      assert.equal(
        (await call("/accounts", { ...input, password: "bad" })).status,
        502,
      );
      const result = await call("/accounts", input);
      assert.equal(result.status, 200);
      id = result.data.id;
      assert.equal(result.data.password, undefined);
      const tele = await call("/accounts", {
        provider: "telekom",
        email: "x@t-online.de",
        password: "telekom-test-secret",
      });
      assert.equal(tele.status, 200);
      assert.equal((await call("/accounts")).data.length, 2);
      assert.equal(
        (await readFile(join(dir, "accounts.enc"))).includes(
          Buffer.from(input.password),
        ),
        false,
      );
      assert.equal((await createStore(dir)).get(id).password, input.password);
    },
  );
  await t.test("Ordner, Seitennavigation, UTF-8-Nachricht", async () => {
    assert.equal((await call("/" + id + "/folders")).data[0].path, "INBOX");
    const page = (await call("/" + id + "/messages?folder=INBOX")).data;
    assert.equal(page.items.length, 50);
    assert.equal(page.next, 21);
    assert.equal(
      (await call("/" + id + "/messages?folder=INBOX&before=21")).data.items
        .length,
      20,
    );
    const message = (
      await call("/" + id + "/messages/1?folder=INBOX&validity=22")
    ).data;
    assert.match(message.text, /Hallo Welt/);
    assert.equal(message.subject, "Beispiel");
    assert.deepEqual(Buffer.from(message.sourceBase64, "base64"), raw);
  });
  await t.test(
    "UIDVALIDITY schützt vor falschem Lesen und Verschieben; Größenlimit",
    async () => {
      assert.equal(
        (await call("/" + id + "/messages/1?folder=INBOX&validity=21")).status,
        409,
      );
      assert.equal(
        (await call("/" + id + "/messages/99?folder=INBOX&validity=22")).status,
        413,
      );
      assert.equal(
        (
          await call("/" + id + "/messages/1/action", {
            folder: "INBOX",
            validity: "21",
            action: "move",
            target: "Trash",
          })
        ).status,
        409,
      );
      assert.equal(moves.length, 0);
    },
  );
  await t.test("Serveraktionen und Löschen nur im Papierkorb", async () => {
    assert.equal(
      (
        await call("/" + id + "/messages/1/action", {
          folder: "INBOX",
          validity: 22,
          action: "move",
          target: "Trash",
        })
      ).status,
      200,
    );
    assert.equal(moves.length, 1);
    assert.equal(
      (
        await call("/" + id + "/messages/1/action", {
          folder: "INBOX",
          validity: 22,
          action: "delete",
        })
      ).status,
      400,
    );
    assert.equal(deleted.length, 0);
    assert.equal(
      (
        await call("/" + id + "/messages/1/action", {
          folder: "Trash",
          validity: 22,
          action: "delete",
        })
      ).status,
      200,
    );
    assert.equal(deleted.length, 1);
  });
  const message = {
    submission: "11111111-1111-4111-8111-111111111111",
    from: "evil@example.test",
    to: "recipient@example.test",
    cc: "",
    bcc: "hidden@example.test",
    subject: "Grüße",
    text: "Hallo",
    attachments: [
      { name: "test.txt", data: Buffer.from("Anhang").toString("base64") },
    ],
  };
  await t.test(
    "Echter SMTP-Dialog: From gebunden, Bcc unsichtbar, MIME-Anhang, Gesendet-Kopie",
    async () => {
      const response = await call("/" + id + "/send", message);
      assert.equal(response.status, 200);
      assert.equal(response.data.status, "sent");
      assert.equal(response.data.saved, true);
      assert.equal(sent.length, 1);
      assert.match(sent[0], /From: info@example.test/);
      assert.doesNotMatch(sent[0], /^Bcc:/im);
      assert.match(sent[0], /filename=test.txt/);
      assert.equal(appends.at(-1).path, "Sent");
      assert.doesNotMatch(appends.at(-1).bytes.toString(), /^Bcc:/im);
    },
  );
  await t.test(
    "Gleicher Schlüssel sendet nicht erneut, auch nach Neustart des Speichers",
    async () => {
      await call("/" + id + "/send", message);
      assert.equal(sent.length, 1);
      assert.equal(
        (await createStore(dir)).submission(id + ":" + message.submission)
          .status,
        "sent",
      );
    },
  );
  await t.test("Header-Injektion vor SMTP blockiert", async () => {
    const count = sent.length;
    assert.equal(
      (
        await call("/" + id + "/send", {
          ...message,
          submission: "22222222-2222-4222-8222-222222222222",
          subject: "bad\r\nBcc: evil@example.test",
        })
      ).status,
      400,
    );
    assert.equal(sent.length, count);
  });
  await t.test("Teilannahme wird ausdrücklich gemeldet", async () => {
    const response = await call("/" + id + "/send", {
      ...message,
      submission: "33333333-3333-4333-8333-333333333333",
      to: "recipient@example.test,reject@example.test",
    });
    assert.equal(response.data.status, "partial");
    assert.deepEqual(response.data.rejected, ["reject@example.test"]);
  });
  await t.test(
    "Verbindungsabbruch nach DATA: kein automatischer Doppelversand",
    async () => {
      failSMTP = true;
      const data = {
        ...message,
        submission: "44444444-4444-4444-8444-444444444444",
      };
      assert.equal((await call("/" + id + "/send", data)).status, 502);
      const count = sent.length;
      assert.equal(
        (await call("/" + id + "/send", data)).data.status,
        "uncertain",
      );
      assert.equal(sent.length, count);
      assert.equal(
        (await createStore(dir)).submission(id + ":" + data.submission).status,
        "uncertain",
      );
      failSMTP = false;
    },
  );
  await t.test("Entwurf ist IMAP-Append, kein SMTP-Versand", async () => {
    const count = sent.length;
    assert.equal((await call("/" + id + "/draft", message)).status, 200);
    assert.equal(sent.length, count);
    assert.equal(appends.at(-1).path, "Drafts");
    assert.ok(appends.at(-1).flags.includes("\\Draft"));
    assert.match(
      appends.at(-1).bytes.toString(),
      /^Bcc: hidden@example.test/im,
    );
  });
  await t.test(
    "Private Dienstdateien sind über HTTP nicht erreichbar",
    async () => {
      for (const path of [
        "/mail-service/data/key",
        "/mail-service/.env",
        "/.git/config",
      ])
        assert.equal((await fetch(base + path)).status, 404);
    },
  );
});
