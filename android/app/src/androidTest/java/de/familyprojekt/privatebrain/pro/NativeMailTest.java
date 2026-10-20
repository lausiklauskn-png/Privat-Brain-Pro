package de.familyprojekt.privatebrain.pro;

import android.content.Context;
import android.util.Base64;
import androidx.test.core.app.ApplicationProvider;
import androidx.test.ext.junit.runners.AndroidJUnit4;
import com.sun.mail.smtp.SMTPTransport;
import java.io.ByteArrayInputStream;
import java.io.File;
import java.nio.charset.StandardCharsets;
import java.security.KeyStore;
import java.util.Properties;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicInteger;
import javax.mail.Session;
import javax.mail.Store;
import javax.mail.internet.MimeMessage;
import org.json.JSONArray;
import org.json.JSONObject;
import org.junit.After;
import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;
import static org.junit.Assert.*;

@RunWith(AndroidJUnit4.class)
public class NativeMailTest {
    private Context context;
    private String directory, alias;
    private EncryptedMailStore storage;
    @Before public void create() {
        context = ApplicationProvider.getApplicationContext();
        String unique = UUID.randomUUID().toString(); directory = "mail-test-" + unique; alias = "mail-test-" + unique;
        storage = new EncryptedMailStore(context, directory, alias);
    }
    @After public void cleanup() throws Exception {
        File folder = new File(context.getNoBackupFilesDir(), directory);
        File[] files = folder.listFiles(); if (files != null) for (File file : files) file.delete(); folder.delete();
        KeyStore keys = KeyStore.getInstance("AndroidKeyStore"); keys.load(null); keys.deleteEntry(alias); keys.deleteEntry(alias + "-tls");
    }
    private byte[] read(File file) throws Exception { return MailMime.read(new java.io.FileInputStream(file), 36 * 1024 * 1024); }
    private void write(File file, byte[] data) throws Exception { try (java.io.FileOutputStream output = new java.io.FileOutputStream(file)) { output.write(data); } }
    private JSONObject accountJson() throws Exception {
        return new JSONObject().put("id", UUID.randomUUID().toString()).put("provider", "hetzner").put("email", "sender@example.invalid")
            .put("user", "sender@example.invalid").put("password", UUID.randomUUID().toString())
            .put("imap", "mail.example.invalid").put("smtp", "mail.example.invalid");
    }
    private JSONObject draft() throws Exception {
        return new JSONObject().put("submission", UUID.randomUUID().toString()).put("to", "receiver@example.invalid")
            .put("cc", "").put("bcc", "hidden@example.invalid").put("subject", "Native test – Prüfung")
            .put("text", "Local test only").put("attachments", new JSONArray());
    }
    @Test public void vaultEncryptsAndTamperingCannotResetAccounts() throws Exception {
        JSONObject secret = accountJson(); MailAccount account = new MailAccount(secret);
        new MailEngine(storage).saveAccount(account);
        File file = new File(new File(context.getNoBackupFilesDir(), directory), "accounts.json");
        byte[] encrypted = read(file);
        String encoded = new String(encrypted, StandardCharsets.UTF_8);
        assertFalse(encoded.contains(secret.getString("password")));
        assertFalse(encoded.contains("sender@example.invalid"));
        assertFalse(account.publicJson().has("password")); assertFalse(account.publicJson().has("user"));
        EncryptedMailStore reopened = new EncryptedMailStore(context, directory, alias);
        assertEquals(secret.getString("password"), new MailEngine(reopened).account(account.id).password);
        JSONObject envelope = new JSONObject(encoded);
        byte[] cipher = Base64.decode(envelope.getString("data"), Base64.NO_WRAP); cipher[0] ^= 1;
        envelope.put("data", Base64.encodeToString(cipher, Base64.NO_WRAP));
        write(file, envelope.toString().getBytes(StandardCharsets.UTF_8));
        byte[] damaged = read(file);
        try { new MailEngine(reopened).saveAccount(new MailAccount(accountJson())); fail("Tampered vault was overwritten"); }
        catch (MailFailure error) { assertEquals("VAULT_UNAVAILABLE", error.code); }
        assertArrayEquals(damaged, read(file));
    }
    @Test public void lostKeystoreKeyDoesNotCreateReplacementData() throws Exception {
        storage.write("accounts", new JSONObject().put("items", new JSONArray().put(accountJson())));
        File file = new File(new File(context.getNoBackupFilesDir(), directory), "accounts.json");
        byte[] before = read(file);
        KeyStore keys = KeyStore.getInstance("AndroidKeyStore"); keys.load(null); keys.deleteEntry(alias);
        try { storage.read("accounts"); fail("Lost key was ignored"); } catch (MailFailure error) { assertEquals("VAULT_UNAVAILABLE", error.code); }
        try { storage.write("another", new JSONObject()); fail("A new key replaced the lost key"); } catch (MailFailure error) { assertEquals("VAULT_UNAVAILABLE", error.code); }
        assertFalse(keys.containsAlias(alias)); assertArrayEquals(before, read(file));
    }
    @Test public void mimeRoundTripPreservesBinaryAndRejectsHeaderInjection() throws Exception {
        MailAccount account = new MailAccount(accountJson()); JSONObject draft = draft();
        String content = Base64.encodeToString(new byte[] {0, 1, (byte) 255, 65}, Base64.NO_WRAP);
        draft.getJSONArray("attachments").put(new JSONObject().put("name", "../test.bin").put("data", content));
        Session session = Session.getInstance(MailAccount.properties());
        JSONObject parsed = MailMime.parse(MailMime.bytes(MailMime.compose(account, draft, session)), session);
        assertEquals(draft.getString("subject"), parsed.getString("subject"));
        assertTrue(parsed.getString("text").contains("Local test only"));
        assertEquals(content, parsed.getJSONArray("attachments").getJSONObject(0).getString("data"));
        assertFalse(parsed.getJSONArray("attachments").getJSONObject(0).getString("name").contains("/"));
        draft.put("subject", "normal\r\nBcc: injected@example.invalid");
        try { MailMime.compose(account, draft, session); fail("Header injection accepted"); }
        catch (MailFailure error) { assertEquals("INVALID_INPUT", error.code); }
        try { MailMime.parse(new byte[MailMime.MAX_RAW + 1], session); fail("Oversized message accepted"); }
        catch (MailFailure error) { assertEquals("MESSAGE_TOO_LARGE", error.code); }
    }
    @Test public void originalHtmlAndCidSurviveMimeParsing() throws Exception {
        String html = "<html><body bgcolor=\"#fff5dc\"><table><tr><td><h1>Herbstangebote</h1>"
            + "<img src=\"cid:logo@example.invalid\"></td></tr></table></body></html>";
        String image = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jBv8AAAAASUVORK5CYII=";
        String eml = "From: newsletter@example.invalid\r\nTo: reader@example.invalid\r\nSubject: Herbstangebote\r\n"
            + "MIME-Version: 1.0\r\nContent-Type: multipart/related; boundary=related\r\n\r\n"
            + "--related\r\nContent-Type: multipart/alternative; boundary=alternative\r\n\r\n"
            + "--alternative\r\nContent-Type: text/plain; charset=UTF-8\r\n\r\nAngebote als Text\r\n"
            + "--alternative\r\nContent-Type: text/html; charset=UTF-8\r\n\r\n" + html + "\r\n--alternative--\r\n"
            + "--related\r\nContent-Type: image/png; name=logo.png\r\nContent-ID: <logo@example.invalid>\r\n"
            + "Content-Disposition: inline; filename=logo.png\r\nContent-Transfer-Encoding: base64\r\n\r\n" + image + "\r\n"
            + "--related\r\nContent-Type: application/octet-stream\r\nContent-Disposition: attachment; filename=test.bin\r\n"
            + "Content-Transfer-Encoding: base64\r\n\r\nAAH/QQ==\r\n--related--\r\n";
        byte[] original = eml.getBytes(StandardCharsets.UTF_8);
        JSONObject parsed = MailMime.parse(original, Session.getInstance(MailAccount.properties()));
        assertEquals(html, parsed.getString("html"));
        assertEquals("Angebote als Text", parsed.getString("text"));
        assertArrayEquals(original, Base64.decode(parsed.getString("sourceBase64"), Base64.NO_WRAP));
        JSONObject inline = parsed.getJSONArray("attachments").getJSONObject(0);
        assertEquals("logo@example.invalid", inline.getString("contentId"));
        assertEquals("image/png", inline.getString("type")); assertTrue(inline.getBoolean("inline"));
        assertEquals(image, inline.getString("data"));
        JSONObject attachment = parsed.getJSONArray("attachments").getJSONObject(1);
        assertFalse(attachment.getBoolean("inline")); assertEquals("AAH/QQ==", attachment.getString("data"));
    }
    @Test public void defaultTrustRejectsUntrustedTlsBeforeAuthentication() throws Exception {
        try (TestMailTlsServer server = new TestMailTlsServer(alias + "-tls", false, false)) {
            Properties properties = MailAccount.properties();
            assertEquals("true", properties.getProperty("mail.imaps.ssl.checkserveridentity"));
            assertNull(properties.get("mail.imaps.ssl.trust"));
            Store client = Session.getInstance(properties).getStore("imaps");
            try { client.connect("localhost", server.port, "test", UUID.randomUUID().toString()); fail("Untrusted certificate accepted"); }
            catch (Exception error) { assertEquals("TLS_FAILED", ProMailPlugin.code(error)); }
            finally { client.close(); }
            server.await(); assertEquals(0, server.authentications.get());
        }
    }
    @Test public void trustedTestCertificateStillRequiresMatchingHostname() throws Exception {
        try (TestMailTlsServer server = new TestMailTlsServer(alias + "-tls", false, false)) {
            Properties properties = MailAccount.properties();
            properties.put("mail.imaps.ssl.socketFactory", server.trustedClient);
            properties.setProperty("mail.imaps.socketFactory.fallback", "false");
            Store client = Session.getInstance(properties).getStore("imaps");
            try { client.connect(server.numericHost(), server.port, "test", UUID.randomUUID().toString()); fail("Wrong hostname accepted"); }
            catch (Exception expected) { /* JavaMail rejects certificate identity before LOGIN. */ }
            finally { client.close(); }
            server.await(); assertEquals(0, server.authentications.get());
        }
    }
    @Test public void imapLibraryAuthenticatesOverVerifiedTls() throws Exception {
        try (TestMailTlsServer server = new TestMailTlsServer(alias + "-tls", false, false)) {
            Properties properties = MailAccount.properties();
            properties.put("mail.imaps.ssl.socketFactory", server.trustedClient);
            properties.setProperty("mail.imaps.socketFactory.fallback", "false");
            try (Store client = Session.getInstance(properties).getStore("imaps")) {
                client.connect("localhost", server.port, "test", UUID.randomUUID().toString()); assertTrue(client.isConnected());
            }
            catch (Exception error) { throw new AssertionError(server.diagnostics(), error); }
            server.await(); assertEquals(1, server.authentications.get());
        }
    }
    @Test public void gmailXoauth2AuthenticatesImapAndSmtpWithoutPasswordFallback() throws Exception {
        for (boolean smtp : new boolean[] {false, true}) {
            try (TestMailTlsServer server = new TestMailTlsServer(alias + "-tls", smtp, false, true)) {
                String protocol = smtp ? "smtps" : "imaps";
                Properties properties = MailAccount.properties("oauth2");
                properties.put("mail." + protocol + ".ssl.socketFactory", server.trustedClient);
                properties.setProperty("mail." + protocol + ".socketFactory.fallback", "false");
                Session session = Session.getInstance(properties);
                if (smtp) {
                    try (SMTPTransport client = (SMTPTransport) session.getTransport(protocol)) {
                        client.connect("localhost", server.port, TestMailTlsServer.OAUTH_USER, TestMailTlsServer.OAUTH_TOKEN);
                        assertTrue(client.isConnected());
                    }
                } else {
                    try (Store client = session.getStore(protocol)) {
                        client.connect("localhost", server.port, TestMailTlsServer.OAUTH_USER, TestMailTlsServer.OAUTH_TOKEN);
                        assertTrue(client.isConnected());
                    }
                }
                server.await();assertEquals(1, server.authentications.get());
            }
        }
    }
    @Test public void gmailReauthorizationPreservesExistingAccountsAndDrafts() throws Exception {
        MailEngine engine = new MailEngine(storage);
        MailAccount old = new MailAccount(accountJson());engine.saveAccount(old);
        JSONObject google = new JSONObject().put("provider", "gmail").put("authType", "oauth2").put("email", "fixture@gmail.com")
            .put("imap", "imap.gmail.com").put("smtp", "smtp.gmail.com");
        MailAccount first = new MailAccount(google);engine.saveAccount(first);
        JSONObject local = draft();engine.saveDraft(first, local);
        MailEngine reopened = new MailEngine(new EncryptedMailStore(context, directory, alias));
        assertEquals(first.id, reopened.saveAccount(new MailAccount(google)).getString("id"));
        JSONObject aliasAccount=new JSONObject(google.toString()).put("email","fixture@googlemail.com");
        JSONObject repaired=reopened.saveAccount(new MailAccount(aliasAccount));
        assertEquals(first.id,repaired.getString("id"));assertEquals("fixture@googlemail.com",repaired.getString("email"));
        MailEngine afterRepair=new MailEngine(new EncryptedMailStore(context,directory,alias));
        assertEquals("fixture@googlemail.com",afterRepair.account(first.id).email);
        assertEquals("fixture@googlemail.com",afterRepair.account(first.id).user);
        MimeMessage outgoing=MailMime.compose(afterRepair.account(first.id),local,Session.getInstance(MailAccount.properties()));
        assertEquals("fixture@googlemail.com",((javax.mail.internet.InternetAddress)outgoing.getFrom()[0]).getAddress());
        assertEquals(2, reopened.accounts().length());assertEquals(old.password, reopened.account(old.id).password);
        assertEquals(local.toString(), reopened.savedDraft(first.id, "draft-" + local.getString("submission")).toString());
        assertFalse(storage.read("accounts").toString().contains("accessToken"));
        try { reopened.verify(first);fail("Google connection proceeded without authorization provider"); }
        catch (MailFailure error) { assertEquals("GMAIL_AUTH_REQUIRED", error.code); }
    }
    private void sendAndRepeat(boolean loseAcknowledgement) throws Exception {
        MailAccount account = new MailAccount(accountJson()); JSONObject draft = draft();
        byte[] prepared = MailMime.bytes(MailMime.compose(account, draft, Session.getInstance(MailAccount.properties())));
        AtomicInteger connects = new AtomicInteger();
        try (TestMailTlsServer server = new TestMailTlsServer(alias + "-tls", true, loseAcknowledgement)) {
            Properties properties = MailAccount.properties(); properties.put("mail.smtps.ssl.socketFactory", server.trustedClient);
            properties.setProperty("mail.smtps.socketFactory.fallback", "false");
            Session session = Session.getInstance(properties);
            MailOutbox.Delivery wire = new MailOutbox.Delivery() {
                SMTPTransport transport;
                public void connect() throws Exception {
                    connects.incrementAndGet(); transport = (SMTPTransport) session.getTransport("smtps");
                    transport.connect("localhost", server.port, "test", UUID.randomUUID().toString());
                }
                public void send(byte[] raw) throws Exception {
                    MimeMessage message = new MimeMessage(session, new ByteArrayInputStream(raw));
                    transport.sendMessage(message, message.getAllRecipients());
                }
                public void close() { try { if (transport != null) transport.close(); } catch (Exception ignored) { } }
            };
            JSONObject first;
            try { first = new MailOutbox(storage).send(account.id, draft, prepared, wire); }
            catch (Exception error) { throw new AssertionError(server.diagnostics(), error); }
            assertEquals(loseAcknowledgement ? "uncertain" : "sent", first.getString("status"));
            EncryptedMailStore reopened = new EncryptedMailStore(context, directory, alias);
            JSONObject repeated = new MailOutbox(reopened).send(account.id, draft, prepared, wire);
            assertEquals(first.getString("status"), repeated.getString("status"));
            server.await(); assertEquals(1, connects.get()); assertEquals(1, server.deliveries.get()); assertFalse(server.leakedBcc.get());
            draft.put("text", "Changed after submission");
            try { new MailOutbox(reopened).send(account.id, draft, prepared, wire); fail("Changed submission accepted"); }
            catch (MailFailure error) { assertEquals("SEND_CHANGED", error.code); }
            assertEquals(1, connects.get());
        }
    }
    @Test public void confirmedSmtpSendIsNotRepeatedAfterReopeningVault() throws Exception { sendAndRepeat(false); }
    @Test public void connectionLossAfterDataDoesNotResend() throws Exception { sendAndRepeat(true); }
}
