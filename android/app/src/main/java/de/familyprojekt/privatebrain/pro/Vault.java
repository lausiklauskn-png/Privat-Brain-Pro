package de.familyprojekt.privatebrain.pro;

import android.content.ContentResolver;
import android.content.Context;
import android.content.SharedPreferences;
import android.database.Cursor;
import android.net.Uri;
import android.os.ParcelFileDescriptor;
import android.os.storage.StorageManager;
import android.os.storage.StorageVolume;
import android.provider.DocumentsContract;
import android.security.keystore.KeyGenParameterSpec;
import android.security.keystore.KeyProperties;
import android.util.Base64;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;
import java.security.KeyStore;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;
import javax.crypto.Cipher;
import javax.crypto.KeyGenerator;
import javax.crypto.Mac;
import javax.crypto.SecretKey;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import org.json.JSONArray;
import org.json.JSONObject;

/**
 * Password-encrypted storage in a folder the user chose with Android's folder picker
 * (tablet storage or SD card). The data key is wrapped only by the user's password;
 * the Android Keystore may additionally remember it on this device, never instead of it.
 */
final class Vault {
    static final long MAX_ATTACHMENT = 1L << 30, MAX_MESSAGE = 1536L * 1024 * 1024;
    static final int MIN_PASSWORD = 10;
    static final String ROOT = "Private Brain", SETTINGS = "tresor.json";
    static final String MAILS = "Mails", ATTACHMENTS = "Anhänge", ORIGINALS = "Originale", CATALOG = "Katalog";
    /** Protection lists, their status and access keys; readable names, encrypted contents. */
    static final String LISTS = "Schutzlisten";
    private static final String DIR = DocumentsContract.Document.MIME_TYPE_DIR, BINARY = "application/octet-stream";
    private static Vault instance;

    static synchronized Vault get(Context context) {
        if (instance == null) instance = new Vault(context.getApplicationContext(), "vault-v1", "private-brain-vault-v1");
        return instance;
    }

    private final Context context;
    private final ContentResolver resolver;
    private final String prefsName, alias;
    private byte[] dataKey, nameKey;
    private Uri tree;
    private String rootId, vaultId;
    private JSONArray attachmentIndex, originalIndex;
    private final Map<String, String> dirs = new HashMap<>();
    private final Map<String, Pending> pending = new HashMap<>();
    long attachmentLimit = MAX_ATTACHMENT;

    // Package-private: instrumented tests use separate preferences and Keystore aliases.
    Vault(Context context, String prefsName, String alias) {
        this.context = context; this.prefsName = prefsName; this.alias = alias;
        resolver = context.getContentResolver();
    }

    private SharedPreferences prefs() { return context.getSharedPreferences(prefsName, Context.MODE_PRIVATE); }
    private static VaultCrypto.Failure fail(String code) { return new VaultCrypto.Failure(code); }

    // ---------- Storage Access Framework ----------
    private Uri doc(String id) { return DocumentsContract.buildDocumentUriUsingTree(tree, id); }
    private static final class Entry { String id, name, mime; long size; }
    private List<Entry> children(String parent) throws IOException {
        List<Entry> out = new ArrayList<>();
        String[] columns = {DocumentsContract.Document.COLUMN_DOCUMENT_ID, DocumentsContract.Document.COLUMN_DISPLAY_NAME,
            DocumentsContract.Document.COLUMN_MIME_TYPE, DocumentsContract.Document.COLUMN_SIZE};
        try (Cursor c = resolver.query(DocumentsContract.buildChildDocumentsUriUsingTree(tree, parent), columns, null, null, null)) {
            if (c == null) throw fail("VAULT_FOLDER_UNAVAILABLE");
            while (c.moveToNext()) {
                Entry e = new Entry(); e.id = c.getString(0); e.name = c.getString(1); e.mime = c.getString(2);
                e.size = c.isNull(3) ? -1 : c.getLong(3);
                if (e.id != null && e.name != null) out.add(e);
            }
        } catch (SecurityException | IllegalArgumentException error) { throw fail("VAULT_FOLDER_UNAVAILABLE"); }
        return out;
    }
    private Entry child(String parent, String name) throws IOException {
        for (Entry e : children(parent)) if (e.name.equals(name)) return e;
        return null;
    }
    private String create(String parent, String mime, String name) throws IOException {
        try {
            Uri created = DocumentsContract.createDocument(resolver, doc(parent), mime, name);
            if (created == null) throw fail("VAULT_FOLDER_UNAVAILABLE");
            return DocumentsContract.getDocumentId(created);
        } catch (IOException error) { throw error; }
        catch (Exception error) { throw fail("VAULT_FOLDER_UNAVAILABLE"); }
    }
    private void delete(String id) { try { DocumentsContract.deleteDocument(resolver, doc(id)); } catch (Exception ignored) { } }
    private String dir(String name) throws IOException {
        String known = dirs.get(name);
        if (known != null) return known;
        Entry existing = child(rootId, name);
        String id = existing != null ? existing.id : create(rootId, DIR, name);
        dirs.put(name, id);
        return id;
    }
    private byte[] readSmall(String id, int limit) throws IOException {
        try (InputStream in = resolver.openInputStream(doc(id))) {
            if (in == null) throw fail("VAULT_FOLDER_UNAVAILABLE");
            return MailMime.read(in, limit);
        } catch (IOException error) { throw error; }
        catch (MailFailure error) { throw fail("VAULT_DAMAGED"); }
        catch (Exception error) { throw fail("VAULT_FOLDER_UNAVAILABLE"); }
    }
    private void writeSmall(String id, byte[] data) throws IOException {
        try (OutputStream out = resolver.openOutputStream(doc(id), "w")) {
            if (out == null) throw fail("VAULT_FOLDER_UNAVAILABLE");
            out.write(data);
        } catch (SecurityException error) { throw fail("VAULT_FOLDER_UNAVAILABLE"); }
    }
    private VaultCrypto.Reader reader(String id, String logical) throws IOException {
        ParcelFileDescriptor descriptor;
        try { descriptor = resolver.openFileDescriptor(doc(id), "r"); }
        catch (SecurityException error) { throw fail("VAULT_FOLDER_UNAVAILABLE"); }
        if (descriptor == null) throw fail("VAULT_FOLDER_UNAVAILABLE");
        try { return new VaultCrypto.Reader(new FileInputStream(descriptor.getFileDescriptor()).getChannel(), descriptor, key(), logical); }
        catch (IOException error) { descriptor.close(); throw error; }
    }

    /** Pending encrypted write. Never visible in an index before commit(). */
    static final class Pending { String id, logical; VaultCrypto.Writer writer; }
    private Pending begin(String dirName, String fileName, String logical, long limit) throws IOException {
        Pending p = new Pending();
        synchronized (this) { p.id = create(dir(dirName), BINARY, fileName); }
        p.logical = logical;
        try {
            OutputStream out = resolver.openOutputStream(doc(p.id), "w");
            if (out == null) throw fail("VAULT_FOLDER_UNAVAILABLE");
            p.writer = new VaultCrypto.Writer(out, key(), logical, limit);
        } catch (Exception error) { delete(p.id); throw error instanceof IOException ? (IOException) error : fail("VAULT_FOLDER_UNAVAILABLE"); }
        return p;
    }
    private void commit(Pending p) throws IOException {
        try { p.writer.close(); }
        catch (IOException error) { delete(p.id); throw error; }
        // A provider may accept a write and lose it; read the final chunk back before indexing.
        try (VaultCrypto.Reader check = reader(p.id, p.logical)) {
            if (check.size() != p.writer.size()) throw fail("VAULT_DAMAGED");
            check.chunk(check.size() == 0 ? 0 : (check.size() - 1) / VaultCrypto.CHUNK);
        } catch (IOException error) { delete(p.id); throw error; }
    }
    private void abort(Pending p) { try { p.writer.close(); } catch (Exception ignored) { } delete(p.id); }

    // ---------- Keys ----------
    private synchronized byte[] key() throws IOException {
        if (dataKey == null && !remembered()) throw fail("VAULT_LOCKED");
        return dataKey.clone();
    }
    synchronized boolean configured() { return prefs().contains("tree"); }
    /** Identity of the opened folder; changes when another folder is chosen. */
    synchronized String folderId() { return configured() ? prefs().getString("id", "") + "|" + prefs().getString("tree", "") : ""; }
    synchronized boolean unlocked() { return dataKey != null || (configured() && remembered()); }
    synchronized void requireUnlocked() throws IOException { key(); bind(); }
    /** Kennung des Tresors (tresor.json) für den Tresorordner (Schritt D2). */
    synchronized String tresorId() { return prefs().getString("id", ""); }
    /** Ganzer Pfad der Ablage im Speicher (Teil hinter „Speicher:“ der Dokument-Kennung), z. B. „Ordner/Private Brain“ (Leitfaden § 5). */
    synchronized String pfad() { String r = prefs().getString("root", ""); return r.contains(":") ? r.substring(r.indexOf(':') + 1) : r; }
    /** Baum und Dokument-Kennung des Ablage-Ordners für „In Dateien öffnen“ (die Adresse baut das Plugin); null ohne Speicherort.
     *  Ohne Android-Bezüge, weil die Windows-Fassung diese Datei übersetzt (windows/engine/build.mjs). */
    synchronized String[] ordnerAdresse() { return configured() ? new String[] { prefs().getString("tree", ""), prefs().getString("root", "") } : null; }
    /** Kopie des Datenschlüssels für den Einzug in den Tresorordner. Bleibt nativ, nie an die WebView. */
    synchronized byte[] tresorSchluessel() throws IOException { return key(); }

    private SecretKey deviceKey(boolean create) throws Exception {
        KeyStore store = KeyStore.getInstance("AndroidKeyStore"); store.load(null);
        if (store.containsAlias(alias)) return (SecretKey) store.getKey(alias, null);
        if (!create) return null;
        KeyGenerator generator = KeyGenerator.getInstance(KeyProperties.KEY_ALGORITHM_AES, "AndroidKeyStore");
        generator.init(new KeyGenParameterSpec.Builder(alias, KeyProperties.PURPOSE_ENCRYPT | KeyProperties.PURPOSE_DECRYPT)
            .setBlockModes(KeyProperties.BLOCK_MODE_GCM).setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_NONE)
            .setKeySize(256).setRandomizedEncryptionRequired(true).build());
        return generator.generateKey();
    }
    /** Comfort only: unwraps the remembered key; any failure simply asks for the password again. */
    private boolean remembered() {
        if (dataKey != null) return true;
        String stored = prefs().getString("remember", null), id = prefs().getString("id", null);
        if (stored == null || id == null) return false;
        try {
            byte[] blob = Base64.decode(stored, Base64.NO_WRAP);
            SecretKey device = deviceKey(false);
            if (device == null) return false;
            Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
            cipher.init(Cipher.DECRYPT_MODE, device, new GCMParameterSpec(128, blob, 0, 12));
            cipher.updateAAD(("pbv1-device|" + id).getBytes(StandardCharsets.UTF_8));
            install(cipher.doFinal(blob, 12, blob.length - 12), id);
            return true;
        } catch (Exception error) { return false; }
    }
    private void remember(boolean value) throws Exception {
        if (!value) { prefs().edit().remove("remember").commit(); return; }
        Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
        cipher.init(Cipher.ENCRYPT_MODE, deviceKey(true));
        cipher.updateAAD(("pbv1-device|" + vaultId).getBytes(StandardCharsets.UTF_8));
        byte[] sealed = cipher.doFinal(dataKey), blob = new byte[12 + sealed.length];
        System.arraycopy(cipher.getIV(), 0, blob, 0, 12); System.arraycopy(sealed, 0, blob, 12, sealed.length);
        if (!prefs().edit().putString("remember", Base64.encodeToString(blob, Base64.NO_WRAP)).commit()) throw fail("VAULT_UNAVAILABLE");
    }
    private void install(byte[] key, String id) throws Exception {
        dataKey = key; vaultId = id;
        Mac mac = Mac.getInstance("HmacSHA256"); mac.init(new SecretKeySpec(key, "HmacSHA256"));
        nameKey = mac.doFinal("pbv1-names".getBytes(StandardCharsets.UTF_8));
        attachmentIndex = null; originalIndex = null;
    }
    /** File names reveal neither mails nor original fingerprints. */
    synchronized String name(String kind, String value) throws IOException {
        key();
        try {
            Mac mac = Mac.getInstance("HmacSHA256"); mac.init(new SecretKeySpec(nameKey, "HmacSHA256"));
            return VaultCrypto.hex(mac.doFinal((kind + "|" + value).getBytes(StandardCharsets.UTF_8))).substring(0, 40);
        } catch (Exception error) { throw fail("VAULT_UNAVAILABLE"); }
    }
    private void bind() throws IOException {
        if (tree != null) return;
        if (!configured()) throw fail("VAULT_NOT_CONFIGURED");
        tree = Uri.parse(prefs().getString("tree", "")); rootId = prefs().getString("root", ""); dirs.clear();
    }

    // ---------- Setup, opening, locking ----------
    static String location(Context context, Uri tree) {
        if (!"com.android.externalstorage.documents".equals(tree.getAuthority())) return "other";
        String id = DocumentsContract.getTreeDocumentId(tree), volume = id.contains(":") ? id.substring(0, id.indexOf(':')) : id;
        if ("primary".equalsIgnoreCase(volume)) return "device";
        StorageManager storage = (StorageManager) context.getSystemService(Context.STORAGE_SERVICE);
        if (storage != null) for (StorageVolume v : storage.getStorageVolumes())
            if (volume.equalsIgnoreCase(v.getUuid())) return v.isRemovable() ? "sdcard" : "other";
        return "removable";
    }
    private String displayName(Uri treeUri, String id) {
        try (Cursor c = resolver.query(DocumentsContract.buildDocumentUriUsingTree(treeUri, id),
                new String[] {DocumentsContract.Document.COLUMN_DISPLAY_NAME}, null, null, null)) {
            if (c != null && c.moveToFirst()) return c.getString(0);
        } catch (Exception ignored) { }
        return "";
    }
    /** Returns the existing vault folder below or at the chosen folder, or null. */
    synchronized String find(Uri chosen) throws IOException {
        Uri saved = tree; String savedRoot = rootId; tree = chosen;
        try {
            String top = DocumentsContract.getTreeDocumentId(chosen);
            if (child(top, SETTINGS) != null) return top;
            Entry folder = child(top, ROOT);
            if (folder != null && DIR.equals(folder.mime) && child(folder.id, SETTINGS) != null) return folder.id;
            return null;
        } finally { tree = saved; rootId = savedRoot; }
    }
    synchronized JSONObject create(Uri chosen, CharSequence password, boolean rememberHere) throws Exception {
        if (password.length() < MIN_PASSWORD) throw fail("VAULT_PASSWORD_SHORT");
        if (find(chosen) != null) throw fail("VAULT_EXISTS");
        tree = chosen; dirs.clear();
        String top = DocumentsContract.getTreeDocumentId(chosen);
        // A chosen, empty "Private Brain" folder is used directly; otherwise a subfolder is created.
        if (ROOT.equals(displayName(chosen, top)) && children(top).isEmpty()) rootId = top;
        else {
            Entry existing = child(top, ROOT);
            if (existing != null && (!DIR.equals(existing.mime) || !children(existing.id).isEmpty())) throw fail("VAULT_FOLDER_IN_USE");
            rootId = existing != null ? existing.id : create(top, DIR, ROOT);
        }
        String id = UUID.randomUUID().toString();
        byte[] salt = VaultCrypto.random(16), key = VaultCrypto.random(VaultCrypto.KEY), pw = VaultCrypto.passwordBytes(password);
        byte[] kek = VaultCrypto.pbkdf2(pw, salt, VaultCrypto.ITERATIONS);
        Arrays.fill(pw, (byte) 0);
        JSONObject settings = new JSONObject().put("format", "private-brain-vault").put("version", 1).put("id", id)
            .put("kdf", "PBKDF2-HMAC-SHA256").put("iterations", VaultCrypto.ITERATIONS)
            .put("salt", Base64.encodeToString(salt, Base64.NO_WRAP))
            .put("key", Base64.encodeToString(VaultCrypto.seal(kek, key, wrapAad(id, VaultCrypto.ITERATIONS)), Base64.NO_WRAP))
            .put("created", System.currentTimeMillis());
        Arrays.fill(kek, (byte) 0);
        String file = create(rootId, "application/json", SETTINGS);
        try { writeSmall(file, settings.toString(2).getBytes(StandardCharsets.UTF_8)); }
        catch (IOException error) { delete(file); throw error; }
        // Read back exactly what the card holds before anything depends on it.
        JSONObject check = new JSONObject(new String(readSmall(file, 16384), StandardCharsets.UTF_8));
        if (!id.equals(check.optString("id"))) { delete(file); throw fail("VAULT_FOLDER_UNAVAILABLE"); }
        for (String name : new String[] {MAILS, ATTACHMENTS, ORIGINALS, CATALOG}) dir(name);
        save(chosen, id, key, rememberHere);
        return state();
    }
    private static byte[] wrapAad(String id, int iterations) { return ("pbv1-vault|" + id + "|" + iterations).getBytes(StandardCharsets.UTF_8); }
    private byte[] unwrap(JSONObject settings, CharSequence password) throws Exception {
        if (!"private-brain-vault".equals(settings.optString("format")) || settings.optInt("version") != 1) throw fail("VAULT_DAMAGED");
        int iterations = settings.getInt("iterations");
        if (iterations < VaultCrypto.MIN_ITERATIONS || iterations > VaultCrypto.MAX_ITERATIONS) throw fail("VAULT_DAMAGED");
        byte[] salt = Base64.decode(settings.getString("salt"), Base64.NO_WRAP), pw = VaultCrypto.passwordBytes(password);
        if (salt.length < 16) throw fail("VAULT_DAMAGED");
        byte[] kek = VaultCrypto.pbkdf2(pw, salt, iterations);
        Arrays.fill(pw, (byte) 0);
        try { return VaultCrypto.open(kek, Base64.decode(settings.getString("key"), Base64.NO_WRAP), wrapAad(settings.getString("id"), iterations)); }
        catch (java.security.GeneralSecurityException wrong) { throw fail("VAULT_PASSWORD_WRONG"); }
        finally { Arrays.fill(kek, (byte) 0); }
    }
    private JSONObject settings() throws IOException {
        Entry file = child(rootId, SETTINGS);
        if (file == null) throw fail("VAULT_FOLDER_UNAVAILABLE");
        try { return new JSONObject(new String(readSmall(file.id, 16384), StandardCharsets.UTF_8)); }
        catch (org.json.JSONException error) { throw fail("VAULT_DAMAGED"); }
    }
    /** Opens an existing vault folder (e.g. the SD card from an old tablet). Nothing is changed on a wrong password. */
    synchronized JSONObject open(Uri chosen, CharSequence password, boolean rememberHere) throws Exception {
        String root = find(chosen);
        if (root == null) throw fail("VAULT_MISSING");
        Uri savedTree = tree; String savedRoot = rootId;
        tree = chosen; rootId = root; dirs.clear();
        try {
            JSONObject settings = settings();
            byte[] key = unwrap(settings, password);
            save(chosen, settings.getString("id"), key, rememberHere);
            return state();
        } catch (Exception error) { tree = savedTree; rootId = savedRoot; dirs.clear(); throw error; }
    }
    private void save(Uri chosen, String id, byte[] key, boolean rememberHere) throws Exception {
        String top = DocumentsContract.getTreeDocumentId(chosen);
        if (!prefs().edit().clear().putString("tree", chosen.toString()).putString("root", rootId).putString("id", id)
                .putString("name", displayName(chosen, top)).putString("location", location(context, chosen)).commit())
            throw fail("VAULT_UNAVAILABLE");
        install(key, id);
        remember(rememberHere);
    }
    synchronized JSONObject unlock(CharSequence password, boolean rememberHere) throws Exception {
        bind();
        JSONObject settings = settings();
        if (!settings.optString("id").equals(prefs().getString("id", ""))) throw fail("VAULT_DAMAGED");
        install(unwrap(settings, password), settings.getString("id"));
        remember(rememberHere);
        return state();
    }
    /** Forget the key on this device; the folder and its data stay untouched. */
    synchronized JSONObject lock() throws Exception {
        if (dataKey != null) Arrays.fill(dataKey, (byte) 0);
        if (nameKey != null) Arrays.fill(nameKey, (byte) 0);
        dataKey = null; nameKey = null; attachmentIndex = null; originalIndex = null;
        prefs().edit().remove("remember").commit();
        return state();
    }
    synchronized JSONObject state() throws Exception {
        JSONObject state = new JSONObject().put("configured", configured());
        if (!configured()) return state;
        state.put("unlocked", unlocked()).put("remembered", prefs().contains("remember"))
            .put("location", prefs().getString("location", "other")).put("folder", prefs().getString("name", "")).put("pfad", pfad())
            .put("minPassword", MIN_PASSWORD).put("attachmentLimit", attachmentLimit);
        if (unlocked()) {
            try {
                bind();
                long bytes = 0; JSONArray items = attachments();
                for (int i = 0; i < items.length(); i++) bytes += items.getJSONObject(i).optLong("size");
                state.put("attachments", items.length()).put("attachmentBytes", bytes).put("reachable", true);
                Entry latest = latest(CATALOG, "katalog");
                state.put("catalogBackup", latest != null);
            } catch (VaultCrypto.Failure error) { state.put("reachable", false).put("problem", error.getMessage()); }
        }
        return state;
    }

    // ---------- Versioned small documents (index files, account snapshot, catalog) ----------
    private Entry latest(String dirName, String base) throws IOException { List<Entry> v = versions(dirName, base); return v.isEmpty() ? null : v.get(0); }
    private List<Entry> versions(String dirName, String base) throws IOException {
        List<Entry> found = new ArrayList<>();
        for (Entry e : children(dir(dirName))) if (e.name.matches(java.util.regex.Pattern.quote(base) + "-[0-9]{1,12}\\.pbv")) found.add(e);
        found.sort((a, b) -> Long.compare(number(b.name), number(a.name)));
        return found;
    }
    private static long number(String name) { return Long.parseLong(name.substring(name.lastIndexOf('-') + 1, name.length() - 4)); }
    /** Newest readable version; an unreadable newest one falls back to the one before. */
    private byte[] readLatest(String dirName, String base, String kind, long limit) throws IOException {
        IOException last = null;
        for (Entry e : versions(dirName, base)) {
            try (VaultCrypto.Reader r = reader(e.id, kind + "/" + number(e.name))) { return VaultCrypto.readAll(r, limit); }
            catch (IOException error) { last = error; }
        }
        if (last != null && "VAULT_FOLDER_UNAVAILABLE".equals(last.getMessage())) throw last;
        if (last != null) throw fail("VAULT_DAMAGED");
        return null;
    }
    private Pending beginVersion(String dirName, String base, String kind, long limit) throws IOException {
        List<Entry> existing = versions(dirName, base);
        long next = existing.isEmpty() ? 1 : number(existing.get(0).name) + 1;
        return begin(dirName, base + "-" + next + ".pbv", kind + "/" + next, limit);
    }
    private void prune(String dirName, String base) throws IOException {
        List<Entry> all = versions(dirName, base);
        for (int i = 3; i < all.size(); i++) delete(all.get(i).id);
    }
    private void writeVersion(String dirName, String base, String kind, byte[] data) throws IOException {
        Pending p = beginVersion(dirName, base, kind, data.length);
        try { p.writer.write(data); } catch (IOException error) { abort(p); throw error; }
        commit(p);
        prune(dirName, base);
    }

    // ---------- Named documents (protection lists and their status) ----------
    /** Newest readable version of "<dirName>/<base>-<n>.pbv", or null when none exists. */
    synchronized byte[] readDocument(String dirName, String base, long limit) throws IOException {
        requireUnlocked();
        return readLatest(dirName, base, "doc/" + base, limit);
    }
    /** Writes a new version (read back before it counts) and keeps the last three. */
    synchronized void writeDocument(String dirName, String base, byte[] data) throws IOException {
        requireUnlocked();
        writeVersion(dirName, base, "doc/" + base, data);
    }
    /** Names and sizes inside one folder of the vault (for status displays and tests). */
    synchronized JSONArray listing(String dirName) throws IOException {
        requireUnlocked();
        JSONArray out = new JSONArray();
        try { for (Entry e : children(dir(dirName))) out.put(new JSONObject().put("name", e.name).put("size", e.size)); }
        catch (org.json.JSONException error) { throw fail("VAULT_UNAVAILABLE"); }
        return out;
    }

    // ---------- Mail attachments ----------
    synchronized JSONArray attachments() throws IOException {
        requireUnlocked();
        if (attachmentIndex == null) {
            byte[] data = readLatest(ATTACHMENTS, "verzeichnis", "idx", 64L * 1024 * 1024);
            try { attachmentIndex = data == null ? new JSONArray() : new JSONObject(new String(data, StandardCharsets.UTF_8)).getJSONArray("items"); }
            catch (org.json.JSONException error) { throw fail("VAULT_DAMAGED"); }
        }
        return attachmentIndex;
    }
    private void saveAttachments() throws IOException {
        try { writeVersion(ATTACHMENTS, "verzeichnis", "idx", new JSONObject().put("items", attachmentIndex).toString().getBytes(StandardCharsets.UTF_8)); }
        catch (org.json.JSONException error) { throw fail("VAULT_UNAVAILABLE"); }
    }
    private synchronized JSONObject attachment(String id) throws IOException {
        JSONArray items = attachments();
        for (int i = 0; i < items.length(); i++) if (id.equals(items.optJSONObject(i).optString("id"))) return items.optJSONObject(i);
        return null;
    }
    private synchronized JSONObject attachment(String mail, int part) throws IOException {
        JSONArray items = attachments();
        for (int i = 0; i < items.length(); i++) {
            JSONObject e = items.optJSONObject(i);
            if (mail.equals(e.optString("mail")) && e.optInt("part", -1) == part) return e;
        }
        return null;
    }
    private static JSONObject reference(JSONObject entry) throws org.json.JSONException {
        return new JSONObject().put("name", entry.getString("name")).put("type", entry.optString("type", BINARY))
            .put("size", entry.getLong("size")).put("sha256", entry.getString("sha256")).put("ref", entry.getString("id"))
            .put("stored", true).put("inline", false).put("contentId", "");
    }
    /** Streams one attachment (encrypted, chunk by chunk) into the folder. */
    JSONObject storeAttachment(InputStream input, String mail, int part, String name, String type, JSONObject head) throws Exception {
        JSONObject existing = attachment(mail, part);
        if (existing != null) return reference(existing);
        String id = UUID.randomUUID().toString();
        Pending p = begin(ATTACHMENTS, id + ".pbv", "att/" + id, attachmentLimit);
        try {
            byte[] buffer = new byte[64 * 1024]; int n;
            while ((n = input.read(buffer)) != -1) p.writer.write(buffer, 0, n);
        } catch (VaultCrypto.Failure error) {
            abort(p);
            if ("FILE_TOO_LARGE".equals(error.getMessage()))
                return new JSONObject().put("name", name).put("type", type).put("tooLarge", true).put("limit", attachmentLimit).put("inline", false).put("contentId", "");
            throw error;
        } catch (Exception error) { abort(p); throw error; }
        commit(p);
        JSONObject entry = new JSONObject().put("id", id).put("name", name).put("type", type).put("size", p.writer.size())
            .put("sha256", p.writer.digestHex()).put("mail", mail).put("part", part)
            .put("account", head.optString("account")).put("from", head.optString("from")).put("subject", head.optString("subject"))
            .put("date", head.optString("date")).put("stored", System.currentTimeMillis());
        synchronized (this) {
            attachments().put(entry);
            try { saveAttachments(); }
            catch (IOException error) {
                attachmentIndex = null; delete(p.id); throw error;
            }
        }
        return reference(entry);
    }
    MailMime.Sink sink(String mail, String account) {
        return (part, index, name, type, head) -> {
            JSONObject existing = attachment(mail, index);
            if (existing != null) return reference(existing);
            head.put("account", account);
            try (InputStream in = part.getInputStream()) { return storeAttachment(in, mail, index, name, type, head); }
            catch (MailFailure | VaultCrypto.Failure error) { throw error; }
            catch (javax.mail.MessagingException | IOException broken) {
                // Undecodable part or interrupted provider write: reported, never cached as complete.
                return new JSONObject().put("name", name).put("type", type).put("failed", true).put("inline", false).put("contentId", "");
            }
        };
    }
    synchronized JSONObject clearAttachments() throws Exception {
        requireUnlocked();
        JSONArray items = attachments();
        long bytes = 0; int count = items.length();
        for (int i = 0; i < items.length(); i++) bytes += items.getJSONObject(i).optLong("size");
        // Index first: an interrupted clear leaves orphan files, never entries without files.
        attachmentIndex = new JSONArray();
        saveAttachments();
        for (Entry e : children(dir(ATTACHMENTS))) if (!e.name.startsWith("verzeichnis-")) delete(e.id);
        return new JSONObject().put("removed", count).put("bytes", bytes);
    }
    byte[] readAttachment(String id, long offset) throws Exception {
        JSONObject entry = attachment(id);
        if (entry == null) throw fail("ATTACHMENT_DELETED");
        Entry file = child(dir(ATTACHMENTS), id + ".pbv");
        if (file == null) throw fail("ATTACHMENT_DELETED");
        try (VaultCrypto.Reader r = reader(file.id, "att/" + id)) {
            if (r.size() != entry.getLong("size")) throw fail("VAULT_DAMAGED");
            return r.read(offset, VaultCrypto.CHUNK);
        }
    }
    /** Decrypted copy for another app ("Öffnen mit …"); only after the page warned the user. */
    File stageAttachment(String id) throws Exception {
        JSONObject entry = attachment(id);
        if (entry == null) throw fail("ATTACHMENT_DELETED");
        File directory = new File(context.getCacheDir(), "exports/vault");
        if (!directory.isDirectory() && !directory.mkdirs()) throw fail("FILE_UNAVAILABLE");
        File[] old = directory.listFiles();
        if (old != null) for (File f : old) if (System.currentTimeMillis() - f.lastModified() > 60L * 60 * 1000) f.delete();
        if (directory.getUsableSpace() < entry.getLong("size") + 32L * 1024 * 1024) throw fail("STORAGE_FULL");
        File out = new File(directory, UUID.randomUUID() + "-" + MailMime.filename(entry.getString("name")));
        Entry file = child(dir(ATTACHMENTS), id + ".pbv");
        if (file == null) throw fail("ATTACHMENT_DELETED");
        java.security.MessageDigest digest = java.security.MessageDigest.getInstance("SHA-256");
        try (VaultCrypto.Reader r = reader(file.id, "att/" + id); InputStream in = r.stream(); FileOutputStream o = new FileOutputStream(out)) {
            byte[] buffer = new byte[64 * 1024]; int n;
            while ((n = in.read(buffer)) != -1) { digest.update(buffer, 0, n); o.write(buffer, 0, n); }
        } catch (Exception error) { out.delete(); throw error; }
        if (!entry.getString("sha256").equals(VaultCrypto.hex(digest.digest()))) { out.delete(); throw fail("VAULT_DAMAGED"); }
        return out;
    }

    // ---------- Mails (text, headers, attachment references) ----------
    String mailKey(String account, String folder, String validity, long uid) throws IOException {
        return name("mail", account.toLowerCase(Locale.ROOT) + "\n" + folder + "\n" + validity + "\n" + uid);
    }
    JSONObject loadMail(String key) throws Exception {
        Entry file;
        synchronized (this) { requireUnlocked(); file = child(dir(MAILS), key + ".pbv"); }
        if (file == null) return null;
        try (VaultCrypto.Reader r = reader(file.id, "mail/" + key)) {
            return new JSONObject(new String(VaultCrypto.readAll(r, 64L * 1024 * 1024), StandardCharsets.UTF_8));
        } catch (VaultCrypto.Failure damaged) {
            if ("VAULT_FOLDER_UNAVAILABLE".equals(damaged.getMessage()) || "VAULT_LOCKED".equals(damaged.getMessage())) throw damaged;
            return null; // A damaged cache copy is fetched again from the provider.
        }
    }
    void saveMail(String key, JSONObject mail) throws Exception {
        forgetMail(key);
        byte[] data = mail.toString().getBytes(StandardCharsets.UTF_8);
        Pending p = begin(MAILS, key + ".pbv", "mail/" + key, data.length);
        try { p.writer.write(data); } catch (IOException error) { abort(p); throw error; }
        commit(p);
    }
    synchronized void forgetMail(String key) throws IOException {
        requireUnlocked();
        for (Entry e : children(dir(MAILS))) if (e.name.equals(key + ".pbv")) delete(e.id);
    }
    /** Marks references whose files were removed ("Ganzen Ordner leeren"). */
    JSONObject withAttachmentState(JSONObject mail) throws Exception {
        JSONObject copy = new JSONObject(mail.toString());
        JSONArray items = copy.optJSONArray("attachments");
        if (items != null) for (int i = 0; i < items.length(); i++) {
            JSONObject a = items.getJSONObject(i);
            if (a.has("ref") && attachment(a.getString("ref")) == null) { a.put("stored", false).put("deleted", true); }
        }
        return copy;
    }
    File temporary() throws IOException {
        File directory = new File(context.getCacheDir(), "vault-download");
        if (!directory.isDirectory() && !directory.mkdirs()) throw fail("FILE_UNAVAILABLE");
        File[] old = directory.listFiles();
        if (old != null) for (File f : old) if (System.currentTimeMillis() - f.lastModified() > 60L * 60 * 1000) f.delete();
        return new File(directory, UUID.randomUUID() + ".eml");
    }
    /** Free space where the vault lives, if the provider exposes a real file; -1 when unknown. */
    long free() {
        try {
            bind();
            Entry settings = child(rootId, SETTINGS);
            if (settings == null) return -1;
            try (ParcelFileDescriptor d = resolver.openFileDescriptor(doc(settings.id), "r")) {
                android.system.StructStatVfs s = android.system.Os.fstatvfs(d.getFileDescriptor());
                return s.f_bavail * s.f_frsize;
            }
        } catch (Exception error) { return -1; }
    }

    // ---------- Account/draft snapshot ----------
    void backupMailStore(EncryptedMailStore store) throws Exception {
        requireUnlocked();
        JSONObject records = new JSONObject();
        for (String name : store.names("")) {
            JSONObject value = store.read(name);
            if (value != null) records.put(name, value);
        }
        byte[] data = new JSONObject().put("v", 1).put("records", records).toString().getBytes(StandardCharsets.UTF_8);
        synchronized (this) { writeVersion(MAILS, "konten", "acc", data); }
    }
    /** Adds missing accounts, drafts and send records. Existing local data is never replaced. */
    JSONObject restoreMailStore(EncryptedMailStore store) throws Exception {
        byte[] data;
        synchronized (this) { requireUnlocked(); data = readLatest(MAILS, "konten", "acc", 64L * 1024 * 1024); }
        int accounts = 0, records = 0;
        if (data == null) return new JSONObject().put("accounts", 0).put("records", 0);
        JSONObject all = new JSONObject(new String(data, StandardCharsets.UTF_8)).getJSONObject("records");
        for (java.util.Iterator<String> it = all.keys(); it.hasNext(); ) {
            String name = it.next();
            JSONObject value = all.getJSONObject(name), local = store.read(name);
            if (name.equals("accounts")) {
                JSONArray mine = local == null ? new JSONArray() : local.getJSONArray("items"), theirs = value.getJSONArray("items");
                java.util.Set<String> ids = new java.util.HashSet<>();
                for (int i = 0; i < mine.length(); i++) ids.add(mine.getJSONObject(i).getString("id"));
                for (int i = 0; i < theirs.length() && mine.length() < 20; i++)
                    if (ids.add(theirs.getJSONObject(i).getString("id"))) { mine.put(theirs.getJSONObject(i)); accounts++; }
                if (accounts > 0) store.write("accounts", new JSONObject().put("items", mine));
            } else if (local == null) { store.write(name, value); records++; }
        }
        return new JSONObject().put("accounts", accounts).put("records", records);
    }

    // ---------- Catalog backup (written in pieces by the page) ----------
    synchronized String catalogBegin() throws Exception {
        requireUnlocked();
        Pending p = beginVersion(CATALOG, "katalog", "cat", 512L * 1024 * 1024);
        String ticket = UUID.randomUUID().toString();
        if (pending.size() >= 2) { abort(p); throw fail("VAULT_BUSY"); }
        pending.put(ticket, p);
        return ticket;
    }
    void catalogAppend(String ticket, long offset, byte[] data) throws Exception {
        Pending p;
        synchronized (this) { p = pending.get(ticket); }
        if (p == null || offset != p.writer.size()) throw fail("INVALID_INPUT");
        try { p.writer.write(data); } catch (IOException error) { synchronized (this) { pending.remove(ticket); } abort(p); throw error; }
    }
    synchronized void catalogFinish(String ticket) throws Exception {
        Pending p = pending.remove(ticket);
        if (p == null) throw fail("INVALID_INPUT");
        commit(p);
        prune(CATALOG, "katalog");
    }
    synchronized void catalogAbort(String ticket) { Pending p = pending.remove(ticket); if (p != null) abort(p); }
    synchronized JSONObject catalogInfo() throws Exception {
        requireUnlocked();
        boolean damagedBackup = false;
        for (Entry e : versions(CATALOG, "katalog")) {
            try (VaultCrypto.Reader r = reader(e.id, "cat/" + number(e.name))) {
                r.chunk(r.size() == 0 ? 0 : (r.size() - 1) / VaultCrypto.CHUNK);
                return new JSONObject().put("exists", true).put("size", r.size()).put("version", number(e.name));
            } catch (VaultCrypto.Failure damaged) {
                if ("VAULT_FOLDER_UNAVAILABLE".equals(damaged.getMessage())) throw damaged;
                damagedBackup = true;
            }
        }
        if (damagedBackup) throw fail("VAULT_DAMAGED");
        return new JSONObject().put("exists", false);
    }
    byte[] catalogRead(long version, long offset) throws Exception {
        Entry file;
        synchronized (this) { bind(); file = child(dir(CATALOG), "katalog-" + version + ".pbv"); }
        if (file == null) throw fail("INVALID_INPUT");
        try (VaultCrypto.Reader r = reader(file.id, "cat/" + version)) { return r.read(offset, VaultCrypto.CHUNK); }
    }

    // ---------- Originals ("Dateien hinzufügen") ----------
    synchronized JSONArray originals() throws IOException {
        requireUnlocked();
        if (originalIndex == null) {
            byte[] data = readLatest(ORIGINALS, "verzeichnis", "oidx", 64L * 1024 * 1024);
            try { originalIndex = data == null ? new JSONArray() : new JSONObject(new String(data, StandardCharsets.UTF_8)).getJSONArray("items"); }
            catch (org.json.JSONException error) { throw fail("VAULT_DAMAGED"); }
        }
        return originalIndex;
    }
    private synchronized JSONObject original(String hash) throws IOException {
        JSONArray items = originals();
        for (int i = 0; i < items.length(); i++) if (hash.equals(items.optJSONObject(i).optString("hash"))) return items.optJSONObject(i);
        return null;
    }
    /** Encrypted copy of a verified app original. Returns false when it already exists. */
    boolean copyOriginal(String hash, File source, JSONObject meta) throws Exception {
        if (original(hash) != null) return false;
        String file = name("orig", hash);
        Pending p = begin(ORIGINALS, file + ".pbv", "orig/" + hash, 2L << 30);
        try (InputStream in = new FileInputStream(source)) {
            byte[] buffer = new byte[64 * 1024]; int n;
            while ((n = in.read(buffer)) != -1) p.writer.write(buffer, 0, n);
        } catch (Exception error) { abort(p); throw error; }
        commit(p);
        if (!hash.equals(p.writer.digestHex())) { delete(p.id); throw fail("VAULT_DAMAGED"); }
        synchronized (this) {
            originals().put(new JSONObject().put("hash", hash).put("file", file).put("size", p.writer.size())
                .put("name", meta.optString("name", "file")).put("type", meta.optString("type", "")));
            try { writeVersion(ORIGINALS, "verzeichnis", "oidx", new JSONObject().put("items", originalIndex).toString().getBytes(StandardCharsets.UTF_8)); }
            catch (IOException error) { originalIndex = null; delete(p.id); throw error; }
        }
        return true;
    }
    /** Brings a missing app original back from the folder (new device). Verified by fingerprint. */
    boolean restoreOriginal(String hash, OriginalFileStore store) throws Exception {
        if (!configured() || !unlocked()) return false;
        JSONObject entry = original(hash);
        if (entry == null) return false;
        Entry file;
        synchronized (this) { file = child(dir(ORIGINALS), entry.getString("file") + ".pbv"); }
        if (file == null) return false;
        JSONObject begun = store.begin(hash, entry.getLong("size"), entry.optString("name", "file"), entry.optString("type", ""));
        if (begun.optBoolean("stored")) return true;
        String ticket = begun.getString("ticket");
        try (VaultCrypto.Reader r = reader(file.id, "orig/" + hash)) {
            for (long offset = 0; offset < r.size(); offset += VaultCrypto.CHUNK) store.append(ticket, offset, r.read(offset, VaultCrypto.CHUNK));
            store.finish(ticket);
            return true;
        } catch (Exception error) { store.abort(ticket); throw error; }
    }
    /** One-time transfer of existing app data into the folder. */
    JSONObject migrate(OriginalFileStore store, EncryptedMailStore mail) throws Exception {
        requireUnlocked();
        int copied = 0, failed = 0;
        JSONArray hashes = store.list();
        for (int i = 0; i < hashes.length(); i++) {
            String hash = hashes.getString(i);
            try { if (copyOriginal(hash, store.file(hash), store.info(hash))) copied++; }
            catch (VaultCrypto.Failure error) { if (!"FILE_TOO_LARGE".equals(error.getMessage())) throw error; failed++; }
        }
        backupMailStore(mail);
        return new JSONObject().put("originals", copied).put("skipped", failed);
    }
}
