package de.familyprojekt.privatebrain.pro;

import java.io.File;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.HashMap;
import java.util.Map;
import org.json.JSONObject;

/** App-private state. OS protection is supplied by the native host, never the page. */
final class DesktopState {
    interface Protection {
        byte[] protect(String binding, byte[] plain) throws Exception;
        byte[] unprotect(String binding, byte[] sealed) throws Exception;
    }
    static final int MODE_PRIVATE = 0;
    final Path directory;
    final Protection protection;
    private final Map<String, Preferences> preferences = new HashMap<>();
    DesktopState(Path directory, Protection protection) throws Exception {
        this.directory = directory.toAbsolutePath().normalize(); this.protection = protection;
        Files.createDirectories(this.directory);
        DesktopFiles.noLinks(this.directory);
    }
    DesktopState getApplicationContext() { return this; }
    File getNoBackupFilesDir() { return directory.toFile(); }
    File getFilesDir() { return directory.toFile(); }
    File getCacheDir() { return directory.resolve("cache").toFile(); }
    String getPackageName() { return "de.familyprojekt.privatebrain.pro"; }
    synchronized Preferences getSharedPreferences(String name, int mode) {
        if (!name.matches("[a-z0-9-]{1,80}")) throw new IllegalArgumentException("INVALID_INPUT");
        return preferences.computeIfAbsent(name, n -> new Preferences(n));
    }
    final class Preferences {
        private final String name;
        private JSONObject data;
        Preferences(String name) {
            this.name = name;
            try {
                Path path = directory.resolve("preferences-" + name + ".dat");
                DesktopFiles.noLinks(path);
                data = Files.exists(path) ? new JSONObject(new String(protection.unprotect(name,
                    Files.readAllBytes(path)), StandardCharsets.UTF_8)) : new JSONObject();
            } catch (Exception error) { throw new IllegalStateException("VAULT_UNAVAILABLE"); }
        }
        synchronized boolean contains(String key) { return data.has(key); }
        synchronized String getString(String key, String fallback) { return data.optString(key, fallback); }
        synchronized boolean getBoolean(String key, boolean fallback) { return data.optBoolean(key, fallback); }
        synchronized Editor edit() { return new Editor(new JSONObject(data.toString())); }
        final class Editor {
            private final JSONObject next;
            Editor(JSONObject next) { this.next = next; }
            Editor clear() { for (String key : next.keySet().toArray(String[]::new)) next.remove(key); return this; }
            Editor putString(String key, String value) { next.put(key, value); return this; }
            Editor putBoolean(String key, boolean value) { next.put(key, value); return this; }
            Editor remove(String key) { next.remove(key); return this; }
            boolean commit() {
                synchronized (Preferences.this) {
                    try {
                        DesktopFiles.atomic(directory.resolve("preferences-" + name + ".dat"),
                            protection.protect(name, next.toString().getBytes(StandardCharsets.UTF_8)));
                        data = next;
                        return true;
                    } catch (Exception error) { return false; }
                }
            }
        }
    }
}
