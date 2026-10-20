package de.familyprojekt.privatebrain.pro;

import android.content.Context;
import android.net.Uri;
import android.provider.DocumentsContract;
import androidx.test.ext.junit.runners.AndroidJUnit4;
import androidx.test.platform.app.InstrumentationRegistry;
import java.io.File;
import java.io.FileOutputStream;
import java.io.RandomAccessFile;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.Arrays;
import java.util.Properties;
import java.util.Random;
import javax.mail.Session;
import javax.mail.internet.MimeBodyPart;
import javax.mail.internet.MimeMessage;
import javax.mail.internet.MimeMultipart;
import org.json.JSONArray;
import org.json.JSONObject;
import org.junit.Test;
import org.junit.runner.RunWith;
import static org.junit.Assert.*;

/** Real Android storage framework, real Keystore, real crypto. Only the folder provider is a local fixture. */
@RunWith(AndroidJUnit4.class)
public class NativeVaultTest {
    private static final String PASSWORD = "Ein langes Passwört 2026";
    private Context context() { return InstrumentationRegistry.getInstrumentation().getTargetContext(); }
    private String authority() { return context().getPackageName() + ".fixture.documents"; }
    private Uri tree(String id) { return DocumentsContract.buildTreeDocumentUri(authority(), id); }
    private File fixture(String path) { return new File(context().getCacheDir(), "fixture-documents/" + path); }
    private Vault vault(String device) {
        context().getSharedPreferences("vault-test-" + device, 0).edit().clear().commit();
        return new Vault(context(), "vault-test-" + device, "pb-vault-test-" + device);
    }
    private void reset() throws Exception {
        context().getContentResolver().call(Uri.parse("content://" + authority()), "fixture-reset", null, null);
        java.security.KeyStore store = java.security.KeyStore.getInstance("AndroidKeyStore"); store.load(null);
        for (String alias : new String[] {"pb-vault-test-a", "pb-vault-test-b"}) if (store.containsAlias(alias)) store.deleteEntry(alias);
    }
    private static String code(Exception error) { return error.getMessage(); }
    private static String sha(byte[] data) throws Exception { return VaultCrypto.hex(MessageDigest.getInstance("SHA-256").digest(data)); }
    private static String sha(File file) throws Exception { return OriginalFileStore.digest(file); }
    private static void delete(File file) { File[] children = file.listFiles(); if (children != null) for (File child : children) delete(child); file.delete(); }

    @Test public void passwordFolderRestoresOnNewDeviceAndRejectsWrongPassword() throws Exception {
        reset();
        Vault a = vault("a");
        try { a.create(tree("vaultA"), "zu kurz", false); fail("short password accepted"); }
        catch (VaultCrypto.Failure expected) { assertEquals("VAULT_PASSWORD_SHORT", code(expected)); }
        assertFalse(a.configured());
        a.create(tree("vaultA"), PASSWORD, false);
        File settings = fixture("vaultA/Private Brain/tresor.json");
        String plain;
        try (java.io.FileInputStream in = new java.io.FileInputStream(settings)) { plain = new String(MailMime.read(in, 65536), StandardCharsets.UTF_8); }
        assertTrue(plain.contains("PBKDF2-HMAC-SHA256") && plain.contains("600000"));
        assertFalse("password stored", plain.contains("Passw"));
        for (String dir : new String[] {"Mails", "Anhänge", "Originale", "Katalog"}) assertTrue(dir, fixture("vaultA/Private Brain/" + dir).isDirectory());
        try { a.create(tree("vaultA"), PASSWORD, false); fail("second vault over the first"); }
        catch (VaultCrypto.Failure expected) { assertEquals("VAULT_EXISTS", code(expected)); }

        // Catalog backup, written in pieces as the page does.
        byte[] catalog = new byte[600 * 1024]; new Random(4).nextBytes(catalog);
        String ticket = a.catalogBegin();
        for (int offset = 0; offset < catalog.length; offset += 262144)
            a.catalogAppend(ticket, offset, Arrays.copyOfRange(catalog, offset, Math.min(catalog.length, offset + 262144)));
        a.catalogFinish(ticket);
        // Accounts and drafts snapshot.
        EncryptedMailStore mailA = new EncryptedMailStore(context(), "vault-test-mail-a", "vault-test-mail-a-key");
        for (String name : mailA.names("")) mailA.remove(name);
        String account = "22222222-2222-4222-8222-222222222222";
        mailA.write("accounts", new JSONObject().put("items", new JSONArray().put(new JSONObject().put("id", account).put("email", "a@example.invalid"))));
        mailA.write("draft-33333333-3333-4333-8333-333333333333", new JSONObject().put("account", account).put("draft", new JSONObject().put("subject", "Entwurf")).put("created", 1));
        a.backupMailStore(mailA);
        // An app original copied encrypted into the folder.
        OriginalFileStore originals = new OriginalFileStore(context());
        byte[] body = "Originaldatei für das neue Gerät".getBytes(StandardCharsets.UTF_8);
        String hash = sha(body);
        JSONObject begun = originals.begin(hash, body.length, "original.txt", "text/plain");
        if (!begun.optBoolean("stored")) { String t = begun.getString("ticket"); originals.append(t, 0, body); originals.finish(t); }
        assertTrue(a.copyOriginal(hash, originals.file(hash), originals.info(hash)));
        assertFalse("copied twice", a.copyOriginal(hash, originals.file(hash), originals.info(hash)));
        File[] stored = fixture("vaultA/Private Brain/Originale").listFiles();
        for (File f : stored) assertFalse("fingerprint visible in file name", f.getName().contains(hash.substring(0, 16)));

        // New device: no preferences, no Keystore entry, empty local stores.
        Vault b = vault("b");
        try { b.open(tree("vaultA"), "ein falsches Passwort!", false); fail("wrong password opened the folder"); }
        catch (VaultCrypto.Failure expected) { assertEquals("VAULT_PASSWORD_WRONG", code(expected)); }
        assertFalse("wrong password changed settings", b.configured());
        b.open(tree("vaultA"), "Ein langes Passwört 2026", false); // decomposed umlaut from another keyboard
        assertTrue(b.unlocked());
        EncryptedMailStore mailB = new EncryptedMailStore(context(), "vault-test-mail-b", "vault-test-mail-b-key");
        for (String name : mailB.names("")) mailB.remove(name);
        JSONObject restored = b.restoreMailStore(mailB);
        assertEquals(1, restored.getInt("accounts")); assertEquals(1, restored.getInt("records"));
        assertEquals("Entwurf", mailB.read("draft-33333333-3333-4333-8333-333333333333").getJSONObject("draft").getString("subject"));
        assertEquals("restoring twice adds nothing", 0, b.restoreMailStore(mailB).getInt("accounts"));
        JSONObject info = b.catalogInfo();
        assertEquals(catalog.length, info.getLong("size"));
        java.io.ByteArrayOutputStream read = new java.io.ByteArrayOutputStream();
        for (long offset = 0; offset < catalog.length; offset += 262144) read.write(b.catalogRead(info.getLong("version"), offset));
        assertArrayEquals(catalog, read.toByteArray());
        delete(new File(context().getFilesDir(), "originals-v1/" + hash));
        assertNull(originals.info(hash));
        assertTrue(b.restoreOriginal(hash, originals));
        assertArrayEquals(body, originals.read(hash, 0));

        // Locking forgets the key; the Keystore only remembers when asked to.
        b.lock();
        assertFalse(b.unlocked());
        try { b.attachments(); fail("locked folder readable"); } catch (VaultCrypto.Failure expected) { assertEquals("VAULT_LOCKED", code(expected)); }
        b.unlock(PASSWORD, true);
        assertTrue("remembered key not used after restart", new Vault(context(), "vault-test-b", "pb-vault-test-b").unlocked());
        b.lock();
        assertFalse("lock kept a remembered key", new Vault(context(), "vault-test-b", "pb-vault-test-b").unlocked());
        reset();
    }

    @Test public void largeAttachmentStreamsIntoFolderAndClearingMarksMailDeleted() throws Exception {
        reset();
        Vault v = vault("a");
        v.create(tree("vaultA"), PASSWORD, false);
        // 40 MB: five times the former whole-mail limit of 8 MB.
        File payload = new File(context().getCacheDir(), "vault-payload.bin");
        byte[] block = new byte[1024 * 1024]; Random random = new Random(9);
        MessageDigest digest = MessageDigest.getInstance("SHA-256");
        try (FileOutputStream out = new FileOutputStream(payload)) {
            for (int i = 0; i < 40; i++) { random.nextBytes(block); digest.update(block); out.write(block); }
        }
        String expected = VaultCrypto.hex(digest.digest());
        Session session = Session.getInstance(new Properties());
        MimeMessage message = new MimeMessage(session);
        message.setSubject("Schreiben vom Anwalt"); message.setFrom("kanzlei@example.invalid");
        MimeMultipart multipart = new MimeMultipart("mixed");
        MimeBodyPart text = new MimeBodyPart(); text.setText("Siehe Anhang.", "UTF-8"); multipart.addBodyPart(text);
        MimeBodyPart file = new MimeBodyPart(); file.attachFile(payload, "application/pdf", "base64"); file.setFileName("schreiben.pdf"); multipart.addBodyPart(file);
        message.setContent(multipart); message.saveChanges();
        File raw = new File(context().getCacheDir(), "vault-mail.eml");
        try (FileOutputStream out = new FileOutputStream(raw)) { message.writeTo(out); }
        assertTrue(raw.length() > 50L * 1024 * 1024);

        String key = v.mailKey("a@example.invalid", "INBOX", "7", 42);
        JSONObject mail = MailMime.parseFile(raw, session, v.sink(key, "a@example.invalid"));
        assertEquals("Siehe Anhang.", mail.getString("text"));
        JSONObject attachment = mail.getJSONArray("attachments").getJSONObject(0);
        assertFalse("bytes passed to the page", attachment.has("data"));
        assertTrue(attachment.getBoolean("stored"));
        assertEquals(40L * 1024 * 1024, attachment.getLong("size"));
        assertEquals(expected, attachment.getString("sha256"));
        String id = attachment.getString("ref");
        byte[] first = v.readAttachment(id, 0);
        byte[] original = new byte[262144];
        try (RandomAccessFile in = new RandomAccessFile(payload, "r")) { in.readFully(original); }
        assertArrayEquals(original, first);
        File staged = v.stageAttachment(id);
        assertEquals(expected, sha(staged)); staged.delete();
        JSONObject entry = v.attachments().getJSONObject(0);
        assertEquals("Schreiben vom Anwalt", entry.getString("subject"));
        assertEquals("kanzlei@example.invalid", entry.getString("from"));
        // Opening the same mail again re-uses the stored file instead of a second copy.
        JSONObject again = MailMime.parseFile(raw, session, v.sink(key, "a@example.invalid"));
        assertEquals(id, again.getJSONArray("attachments").getJSONObject(0).getString("ref"));
        assertEquals(1, v.attachments().length());

        v.saveMail(key, mail);
        assertEquals("Siehe Anhang.", v.loadMail(key).getString("text"));
        // A changed byte on the card is detected, not shown.
        File storedFile = fixture("vaultA/Private Brain/Anhänge/" + id + ".pbv");
        try (RandomAccessFile f = new RandomAccessFile(storedFile, "rw")) { f.seek(VaultCrypto.HEADER + 3L * (VaultCrypto.CHUNK + VaultCrypto.OVERHEAD) + 100); int b = f.read(); f.seek(f.getFilePointer() - 1); f.write(b ^ 0x40); }
        try { v.readAttachment(id, 3L * VaultCrypto.CHUNK); fail("changed file accepted"); }
        catch (VaultCrypto.Failure damaged) { assertEquals("VAULT_DAMAGED", code(damaged)); }

        JSONObject cleared = v.clearAttachments();
        assertEquals(1, cleared.getInt("removed"));
        assertEquals(0, v.attachments().length());
        for (File left : fixture("vaultA/Private Brain/Anhänge").listFiles()) assertTrue(left.getName(), left.getName().startsWith("verzeichnis-"));
        JSONObject shown = v.withAttachmentState(v.loadMail(key));
        assertTrue("mail does not say the attachment is gone", shown.getJSONArray("attachments").getJSONObject(0).getBoolean("deleted"));
        try { v.readAttachment(id, 0); fail("deleted attachment readable"); }
        catch (VaultCrypto.Failure gone) { assertEquals("ATTACHMENT_DELETED", code(gone)); }

        // Per-file limit: an oversized attachment is named and leaves no partial file behind.
        v.attachmentLimit = 1024 * 1024;
        JSONObject limited = MailMime.parseFile(raw, session, v.sink(v.mailKey("a@example.invalid", "INBOX", "7", 43), "a@example.invalid"));
        assertTrue(limited.getJSONArray("attachments").getJSONObject(0).getBoolean("tooLarge"));
        for (File left : fixture("vaultA/Private Brain/Anhänge").listFiles()) assertTrue(left.getName(), left.getName().startsWith("verzeichnis-"));
        assertEquals(Vault.MAX_ATTACHMENT, 1L << 30);
        payload.delete(); raw.delete(); reset();
    }

    @Test public void damagedNewestCatalogFallsBackToThePreviousBackup() throws Exception {
        reset();
        Vault v = vault("a");
        v.create(tree("vaultA"), PASSWORD, false);
        for (String content : new String[] {"erste Sicherung", "zweite Sicherung"}) {
            String ticket = v.catalogBegin();
            v.catalogAppend(ticket, 0, content.getBytes(StandardCharsets.UTF_8));
            v.catalogFinish(ticket);
        }
        assertEquals(2, v.catalogInfo().getLong("version"));
        File newest = fixture("vaultA/Private Brain/Katalog/katalog-2.pbv");
        try (RandomAccessFile f = new RandomAccessFile(newest, "rw")) { f.seek(f.length() - 3); int b = f.read(); f.seek(f.length() - 3); f.write(b ^ 1); }
        JSONObject info = v.catalogInfo();
        assertEquals(1, info.getLong("version"));
        assertEquals("erste Sicherung", new String(v.catalogRead(1, 0), StandardCharsets.UTF_8));
        reset();
    }
}
