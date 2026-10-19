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
