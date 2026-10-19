package de.familyprojekt.privatebrain.pro;

import android.content.Context;
import android.security.keystore.KeyGenParameterSpec;
import android.security.keystore.KeyProperties;
import android.util.AtomicFile;
import android.util.Base64;
import java.io.File;
import java.io.FileOutputStream;
import java.nio.charset.StandardCharsets;
import java.security.KeyStore;
import java.util.ArrayList;
import java.util.List;
import javax.crypto.Cipher;
import javax.crypto.KeyGenerator;
import javax.crypto.SecretKey;
import javax.crypto.spec.GCMParameterSpec;
import org.json.JSONObject;

/** Authenticated, atomic private files. A missing key never resets existing data. */
final class EncryptedMailStore {
    private final File directory;
    private final String alias;
    private final String binding;
    EncryptedMailStore(Context context) {
        this(context, "native-mail-v1", "private-brain-mail-v1");
    }
    // Package-private injection is used only by instrumented tests, never by the bridge.
    EncryptedMailStore(Context context, String folder, String keyAlias) {
        directory = new File(context.getNoBackupFilesDir(), folder);
        alias = keyAlias;
        binding = context.getPackageName() + ":" + folder + ":";
    }
    private File file(String name) throws MailFailure {
        if (!name.matches("[a-z0-9-]{1,110}")) throw new MailFailure("INVALID_INPUT");
        return new File(directory, name + ".json");
    }
    private SecretKey key(boolean create) throws Exception {
        KeyStore store = KeyStore.getInstance("AndroidKeyStore");
        store.load(null);
        if (store.containsAlias(alias)) return (SecretKey) store.getKey(alias, null);
        if (!create) throw new MailFailure("VAULT_UNAVAILABLE");
        // Any surviving encrypted file means that loss of a key needs recovery, not replacement.
        String[] existing = directory.list();
        if (existing != null && existing.length > 0) throw new MailFailure("VAULT_UNAVAILABLE");
        KeyGenerator generator = KeyGenerator.getInstance(KeyProperties.KEY_ALGORITHM_AES, "AndroidKeyStore");
        generator.init(new KeyGenParameterSpec.Builder(alias, KeyProperties.PURPOSE_ENCRYPT | KeyProperties.PURPOSE_DECRYPT)
            .setBlockModes(KeyProperties.BLOCK_MODE_GCM).setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_NONE)
            .setKeySize(256).setRandomizedEncryptionRequired(true).build());
        return generator.generateKey();
    }
    synchronized JSONObject read(String name) throws Exception {
        try { return readData(name); }
        catch (MailFailure error) { throw error; }
        catch (Exception error) { throw new MailFailure("VAULT_UNAVAILABLE"); }
    }
    private JSONObject readData(String name) throws Exception {
        AtomicFile file = new AtomicFile(file(name));
        if (!file.getBaseFile().exists() && !new File(file.getBaseFile() + ".bak").exists()) return null;
        if (file.getBaseFile().length() > 36 * 1024 * 1024) throw new MailFailure("VAULT_UNAVAILABLE");
        JSONObject envelope = new JSONObject(new String(file.readFully(), StandardCharsets.UTF_8));
        if (envelope.getInt("version") != 1) throw new MailFailure("VAULT_UNAVAILABLE");
        byte[] iv = Base64.decode(envelope.getString("iv"), Base64.NO_WRAP);
        if (iv.length != 12) throw new MailFailure("VAULT_UNAVAILABLE");
        Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
        cipher.init(Cipher.DECRYPT_MODE, key(false), new GCMParameterSpec(128, iv));
        cipher.updateAAD((binding + name).getBytes(StandardCharsets.UTF_8));
        byte[] plain = cipher.doFinal(Base64.decode(envelope.getString("data"), Base64.NO_WRAP));
        return new JSONObject(new String(plain, StandardCharsets.UTF_8));
    }
    synchronized void write(String name, JSONObject value) throws Exception {
        try { writeData(name, value); }
        catch (MailFailure error) { throw error; }
        catch (Exception error) { throw new MailFailure("VAULT_UNAVAILABLE"); }
    }
    private void writeData(String name, JSONObject value) throws Exception {
        File target = file(name);
        byte[] plain = value.toString().getBytes(StandardCharsets.UTF_8);
        if (plain.length > 24 * 1024 * 1024) throw new MailFailure("MESSAGE_TOO_LARGE");
        if (!directory.isDirectory() && !directory.mkdirs()) throw new MailFailure("VAULT_UNAVAILABLE");
        long used = 0;
        File[] files = directory.listFiles();
        if (files == null) throw new MailFailure("VAULT_UNAVAILABLE");
        for (File file : files) used += file.length();
        if (used - target.length() + plain.length * 4L / 3 + 512 > 256L * 1024 * 1024)
            throw new MailFailure("VAULT_UNAVAILABLE");
        Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
        cipher.init(Cipher.ENCRYPT_MODE, key(true));
        cipher.updateAAD((binding + name).getBytes(StandardCharsets.UTF_8));
        JSONObject envelope = new JSONObject().put("version", 1)
            .put("iv", Base64.encodeToString(cipher.getIV(), Base64.NO_WRAP))
            .put("data", Base64.encodeToString(cipher.doFinal(plain), Base64.NO_WRAP));
        AtomicFile atomic = new AtomicFile(target);
        FileOutputStream output = null;
        try {
            output = atomic.startWrite();
            output.write(envelope.toString().getBytes(StandardCharsets.UTF_8));
            atomic.finishWrite(output);
        } catch (Exception error) {
            if (output != null) atomic.failWrite(output);
            throw error;
        }
    }
    synchronized List<String> names(String prefix) {
        List<String> names = new ArrayList<>();
        String[] files = directory.list();
        if (files != null) for (String file : files) {
            // AtomicFile backup suffixes must also be discoverable after an interrupted write.
            String base = file.endsWith(".json.bak") ? file.substring(0, file.length() - 9) :
                file.endsWith(".json") ? file.substring(0, file.length() - 5) : "";
            if (base.startsWith(prefix) && !names.contains(base)) names.add(base);
        }
        return names;
    }
    synchronized void remove(String name) throws Exception { new AtomicFile(file(name)).delete(); }
}
