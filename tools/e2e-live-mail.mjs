import assert from "node:assert/strict";
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { join, extname } from "node:path";
import { chromium } from "playwright-core";
const root = new URL("..", import.meta.url).pathname;
const server = createServer(async (req, res) => {
  try {
    const p =
      req.url.split("?")[0] === "/"
        ? "index.html"
        : decodeURIComponent(req.url.split("?")[0]);
    res.setHeader(
      "Content-Type",
      {
        ".html": "text/html",
        ".js": "text/javascript",
        ".css": "text/css",
        ".json": "application/json",
        ".svg": "image/svg+xml",
      }[extname(p)] || "application/octet-stream",
    );
    res.end(await readFile(join(root, p)));
  } catch {
    res.writeHead(404);
    res.end();
  }
});
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const url = "http://127.0.0.1:" + server.address().port + "/";
const browser = await chromium.launch({
  executablePath: process.env.CB_CHROMIUM || "/usr/bin/chromium",
  args: ["--no-sandbox"],
});
let count = 0;
function ok(name, value) {
  assert.ok(value, name);
  console.log("✓ " + name);
  count++;
}
try {
  const context = await browser.newContext({ acceptDownloads: true }),
    page = await context.newPage(),
    errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.setDefaultTimeout(10000);
  const settled = () =>
    page.waitForFunction(
      () => !document.querySelector(".live-mail")?.hasAttribute("aria-busy"),
    );
  let accounts = [],
    requests = [],
    outcome = "sent",
    next = 2;
  const data = {
    raw: "From: sender@example.test\r\nTo: info@family-projekt.de\r\nSubject: Testpostfach\r\nDate: Mon, 19 Oct 2026 10:00:00 +0200\r\nContent-Type: text/plain; charset=utf-8\r\n\r\nEine Mail zur semantischen Suche.",
    from: "sender@example.test",
    to: "info@family-projekt.de",
    cc: "",
    subject: "Testpostfach",
    text: 'Eine Mail zur semantischen Suche. <img src="https://tracker.invalid/x">',
    messageId: "<message@example.test>",
    replyTo: "reply@example.test",
    attachments: [
      {
        name: "notiz.txt",
        data: Buffer.from("Anhangtext").toString("base64"),
        type: "text/plain",
      },
    ],
  };
  await context.route("**/*", async (route) => {
    const req = route.request();
    if (req.url().startsWith(url)) return route.continue();
    if (!req.url().startsWith("https://mail.example.test/api/mail"))
      return route.abort();
    const u = new URL(req.url()),
      path = u.pathname.replace("/api/mail", ""),
      body = req.postDataJSON();
    requests.push({
      path,
      body,
      method: req.method(),
      authorization: req.headers().authorization,
    });
    let result = { ok: true };
    if (path === "/accounts") {
      if (req.method() === "POST") {
        result = { id: "account1", email: body.email, provider: body.provider };
        accounts = [result];
      } else result = accounts;
    } else if (path.endsWith("/folders"))
      result = [
        { path: "INBOX", name: "Eingang", specialUse: "\\Inbox" },
        { path: "Trash", name: "Papierkorb", specialUse: "\\Trash" },
        { path: "Junk", name: "Spam", specialUse: "\\Junk" },
        { path: "Archive", name: "Archiv", specialUse: "\\Archive" },
        { path: "Drafts", name: "Entwürfe", specialUse: "\\Drafts" },
      ];
    else if (path.endsWith("/messages"))
      result = {
        validity: "22",
        items: [
          {
            uid: u.searchParams.has("before") ? 1 : 2,
            subject: "Testpostfach",
            from: "sender@example.test",
            flags: [],
            size: 300,
          },
        ],
        next: u.searchParams.has("before") ? null : next,
      };
    else if (/messages\/\d+$/.test(path)) result = data;
    else if (path.endsWith("/send"))
      result = {
        status: outcome,
        accepted: ["recipient@example.test"],
        rejected: [],
        saved: true,
        notice:
          outcome === "uncertain"
            ? "Übermittlung unklar. Nicht erneut senden."
            : undefined,
      };
    await route.fulfill({
      json: result,
      headers: {
        "Access-Control-Allow-Origin": url.slice(0, -1),
        "Access-Control-Allow-Headers": "Authorization, Content-Type",
        "Cache-Control": "no-store",
      },
    });
  });
  await page.goto(url);
  await page.waitForFunction(() => window.PBLiveMail && db);
  await page.click("#mailTab");
  ok(
    "Lokales Postfach bleibt ohne Anmeldung verfügbar",
    await page.locator(".mail-app:not(.live-mail)").isVisible(),
  );
  await page
    .getByRole("button", { name: "Mailkonto verbinden", exact: true })
    .click();
  await settled();
  let dialog = page.locator("dialog.live-dialog");
  await dialog
    .getByLabel("HTTPS-Adresse des privaten Dienstes")
    .fill("https://mail.example.test");
  await dialog
    .getByLabel("Dienst-Schlüssel")
    .fill("test-service-token-only-for-this-session");
  await dialog.getByRole("button", { name: "Verbinden", exact: true }).click();
  await settled();
  await page.waitForFunction(() => document.querySelector("dialog select"));
  dialog = page.locator("dialog.live-dialog");
  await dialog
    .getByLabel("E-Mail-Adresse", { exact: true })
    .fill("info@family-projekt.de");
  await dialog.getByLabel("Mail-Passwort").fill("test-password-not-real");
  await dialog.getByRole("button", { name: "Verbinden", exact: true }).click();
  await settled();
  await page.waitForSelector('[data-live-folder="INBOX"]');
  ok(
    "Hetzner-Konto wird mit TLS-Servervorgaben an privaten Dienst übergeben",
    requests.some(
      (r) =>
        r.path === "/accounts" &&
        r.body?.provider === "hetzner" &&
        r.body.imap === "mail.your-server.de",
    ),
  );
  ok(
    "Token und Passwort fehlen in localStorage und sessionStorage",
    await page.evaluate(
      () =>
        !JSON.stringify({ ...localStorage, ...sessionStorage }).match(
          /test-password-not-real|test-service-token/,
        ),
    ),
  );
  ok(
    "Verbindungsknopf ist im verbundenen Zustand ausgeblendet",
    !(await page
      .getByRole("button", { name: "Mailkonto verbinden", exact: true })
      .isVisible()),
  );
  ok(
    "Serverordner und Nachrichten erscheinen",
    (await page.locator("[data-live-folder]").count()) === 5 &&
      (await page.locator("[data-live-uid]").count()) === 1,
  );
  await page
    .getByRole("button", { name: "Weitere Nachrichten", exact: true })
    .click();
  await settled();
  await page.waitForFunction(
    () => document.querySelectorAll("[data-live-uid]").length === 2,
  );
  ok(
    "Weitere Seite wird geladen",
    requests.some((r) => r.path.endsWith("/messages")) &&
      (await page.locator("[data-live-uid]").count()) === 2,
  );
  await page.locator('[data-live-uid="2"]').click();
  await settled();
  await page.waitForSelector("#pb-live-reader .mail-report");
  ok(
    "Klartext wird angezeigt, eingebettetes Mail-HTML bleibt Text",
    (await page
      .locator("#pb-live-reader")
      .innerText()
      .then((t) => t.includes("<img src="))) &&
      (await page.locator("#pb-live-reader img").count()) === 0,
  );
  ok(
    "Lesen setzt die Server-Markierung mit UIDVALIDITY",
    requests.some((r) => r.body?.action === "read" && r.body.validity === "22"),
  );
  await page.locator('[data-lang="en"]').click();
  await settled();
  ok(
    "Sprachwechsel erhält Serverordner und Betreff",
    (await page.locator('[data-live-folder="INBOX"]').innerText()) ===
      "Eingang" &&
      (await page.locator('[data-live-uid="2"]').innerText()).includes(
        "Testpostfach",
      ),
  );
  await page.locator('[data-lang="de"]').click();
  await settled();
  ok(
    "Text- und Anhangprüfung sichtbar",
    (await page.locator("#pb-live-reader .mail-report").innerText()).includes(
      "notiz.txt",
    ),
  );
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "↓ notiz.txt", exact: true }).click();
  await settled();
  ok(
    "Originalanhang ist herunterladbar",
    (await download).suggestedFilename() === "notiz.txt",
  );
  await page.evaluate(() => {
    window.__geteilt = [];
    navigator.canShare = (d) => !!d?.files?.length;
    navigator.share = async (d) => { window.__geteilt.push({ n: d.files.length, name: d.files[0].name, type: d.files[0].type, size: d.files[0].size }); };
  });
  await page.getByRole("button", { name: "An BookLedgerPro teilen", exact: true }).click();
  await settled();
  const geteilt = await page.evaluate(() => window.__geteilt);
  ok(
    "„An BookLedgerPro teilen“ gibt genau die Original-Mail als .eml-Datei (message/rfc822) an Web Share",
    geteilt.length === 1 && geteilt[0].n === 1 && geteilt[0].type === "message/rfc822" && /\.eml$/.test(geteilt[0].name) && geteilt[0].size > 100,
  );
  await page.evaluate(() => { navigator.canShare = () => false; });
  page.once("dialog", (d) => d.accept());
  const emlDownload = page.waitForEvent("download");
  await page.getByRole("button", { name: "An BookLedgerPro teilen", exact: true }).click();
  ok(
    "Ohne Web Share wird die .eml gespeichert und der Weg (Belege hochladen) genannt",
    /\.eml$/.test((await emlDownload).suggestedFilename()),
  );
  await settled();
  await page.getByRole("button", { name: "Antworten", exact: true }).click();
  await settled();
  ok(
    "Antwort verwendet Reply-To",
    (await page.locator("#pb-live-to").inputValue()) === "reply@example.test",
  );
  ok(
    "Senden ist beschriftete Hauptaktion oberhalb der Empfängerfelder",
    await page.locator('.mail-compose-actions [data-live-text="send"]').evaluate(b =>
      b.classList.contains('mail-primary') && b.textContent === 'Senden' &&
      b.getBoundingClientRect().bottom <= document.getElementById('pb-live-to').getBoundingClientRect().top),
  );
  ok("Leere Cc-/Bcc-Felder sind zunächst eingeklappt", !await page.locator('#pb-live-cc').isVisible());
  await page.locator('.mail-copy-fields > summary').click();
  await page.locator('#pb-live-cc').fill('copy@example.test');
  await page.locator('#pb-live-bcc').fill('hidden@example.test');
  await page.locator('.mail-copy-fields > summary').click();
  const attachmentChooser = page.waitForEvent('filechooser');
  await page.locator('.mail-compose-actions [data-live-text="attach"]').click();
  await (await attachmentChooser).setFiles({name:'compose-note.txt',mimeType:'text/plain',buffer:Buffer.from('Notiz zum Entwurf.')});
  await settled();
  ok("Cc/Bcc bleiben nach Einklappen und Anhang-Neuzeichnen erhalten",
    await page.locator('#pb-live-cc').inputValue()==='copy@example.test' &&
    await page.locator('#pb-live-bcc').inputValue()==='hidden@example.test' &&
    !await page.locator('#pb-live-cc').isVisible());
  for (const [lang, caption] of [['en','Cc / Bcc'],['ru','Копия / скрытая копия'],['pl','DW / UDW'],['de','Cc / Bcc']]) {
    await page.evaluate(lang => { document.documentElement.lang = lang; }, lang);
    await page.waitForFunction(caption => document.querySelector('.live-mail .mail-copy-fields > summary').textContent === caption, caption);
    ok(lang + ': aufklappbare Empfängerfelder übersetzen ohne Werteverlust',
      await page.locator('.mail-copy-fields > summary').textContent() === caption &&
      await page.locator('#pb-live-bcc').inputValue() === 'hidden@example.test');
  }
  await page.locator("#pb-live-to").fill("recipient@example.test");
  await page.locator("#pb-live-subject").fill("Antwort");
  await page.locator("#pb-live-text").fill("Antworttext");
  await page
    .getByRole("button", { name: "Server-Entwurf speichern", exact: true })
    .click();
  await settled();
  await page.waitForFunction(() =>
    document.querySelector(".live-mail>.mail-notice").textContent.includes("✓"),
  );
  ok(
    "Entwurf speichern ruft keinen Versand auf",
    requests.some((r) => r.path.endsWith("/draft")) &&
      !requests.some((r) => r.path.endsWith("/send")),
  );
  ok("Eingeklappte Cc/Bcc werden im Entwurf gespeichert",
    requests.find(r=>r.path.endsWith('/draft')).body.cc==='copy@example.test' &&
    requests.find(r=>r.path.endsWith('/draft')).body.bcc==='hidden@example.test');
  page.on("dialog", (d) => d.accept());
  await page.getByRole("button", { name: "Senden", exact: true }).click();
  await settled();
  await page.waitForFunction(() =>
    document
      .querySelector("#pb-live-reader")
      .textContent.includes("Mailserver hat"),
  );
  const submission = requests.find((r) => r.path.endsWith("/send"));
  ok(
    "Versand enthält stabile Kennung und Thread-Bezug",
    submission.body.submission.length === 36 &&
      submission.body.inReplyTo === "<message@example.test>",
  );
  ok("Senden übernimmt eingeklappte Cc/Bcc genau einmal",
    submission.body.cc==='copy@example.test' && submission.body.bcc==='hidden@example.test' &&
    requests.filter(r=>r.path.endsWith('/send')).length===1);
  ok(
    "Versanderfolg wird erst nach Serverantwort angezeigt",
    (await page.locator("#pb-live-reader").innerText()).includes("angenommen"),
  );
  await page
    .getByRole("button", { name: "Aktualisieren", exact: true })
    .click();
  await settled();
  await page.locator('[data-live-uid="2"]').click();
  await settled();
  await page.getByRole("button", { name: "Weiterleiten", exact: true }).click();
  await settled();
  ok(
    "Weiterleitung enthält Originalanhang",
    (await page.locator("#pb-live-reader").innerText()).includes("notiz.txt"),
  );
  await page
    .getByRole("button", { name: "← Nachrichtenliste", exact: true })
    .click();
  await settled();
  await page.locator('[data-live-folder="INBOX"]').click();
  await settled();
  await page.locator('[data-live-uid="2"]').click();
  await settled();
  await page.getByRole("button", { name: "Als Spam", exact: true }).click();
  await settled();
  ok(
    "Spam-Aktion bewegt die Nachricht auf dem Server",
    requests.some((r) => r.body?.action === "move" && r.body.target === "Junk"),
  );
  await page.locator('[data-live-uid="2"]').click();
  await settled();
  await page
    .getByRole("button", { name: "In Katalog", exact: true })
    .click();
  await settled();
  await page.waitForFunction(() =>
    CATALOG.some((r) => r.name === "Testpostfach"),
  );
  ok(
    "Mail wird für gemeinsame Bedeutungssuche katalogisiert",
    await page.evaluate(() =>
      CATALOG.some((r) => r.mailBody.includes("semantischen")),
    ),
  );
  for (const width of [320, 768, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    ok(
      width + "px: Serverpostfach ohne Querlaufen",
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    );
  }
  await page.setViewportSize({ width: 768, height: 1024 });
  await page.screenshot({
    path: "/tmp/private-brain-live-mail-tablet.png",
    fullPage: true,
  });
  await page
    .getByRole("button", { name: "Dienst trennen", exact: true })
    .click();
  await settled();
  ok(
    "Trennen kehrt zum lokalen Postfach zurück",
    await page.locator(".mail-app:not(.live-mail)").isVisible(),
  );
  await page.reload();
  await page.waitForFunction(() => window.PBLiveMail && db);
  await page.click("#mailTab");
  ok(
    "Neuladen verbindet kein Konto ohne erneute Schlüssel-Eingabe",
    await page
      .getByRole("button", { name: "Mailkonto verbinden", exact: true })
      .isVisible(),
  );
  for (const width of [320, 768]) {
    await page.setViewportSize({ width, height: 900 });
    await page
      .getByRole("button", { name: "Mailkonto verbinden", exact: true })
      .click();
    await settled();
    ok(
      width + "px: Kontoeinrichtung passt auf den Bildschirm",
      await page
        .locator("dialog.live-dialog")
        .evaluate(
          (d) =>
            d.getBoundingClientRect().width <= innerWidth &&
            d.scrollWidth <= d.clientWidth,
        ),
    );
    await page
      .locator("dialog.live-dialog")
      .getByRole("button", { name: "Abbrechen", exact: true })
      .click();
    await settled();
  }
  ok("Keine unbehandelten Browserfehler", errors.length === 0);
  await context.close();
  console.log("\n" + count + " Live-Mail-Prüfungen bestanden");
} finally {
  await browser.close();
  await new Promise((r) => server.close(r));
}
