package de.familyprojekt.privatebrain.pro;

import android.content.Context;
import android.net.ConnectivityManager;
import java.io.BufferedInputStream;
import java.io.ByteArrayOutputStream;
import java.io.FilterInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.util.zip.ZipInputStream;
import org.json.JSONArray;
import org.json.JSONObject;

/**
 * Protection lists inside the user's encrypted storage folder (tablet or SD card).
 *
 * Downloads stream from the provider straight into memory and from there, encrypted, into
 * "Schutzlisten/" in the chosen folder. Nothing is written to the app's own storage. Every
 * download respects the app's internet switch; access keys live encrypted in the folder and
 * never reach the web page.
 */
final class Protection {
    static final String MALWARE = "Schaddateien-MalwareBazaar", LINKS = "Gefaehrliche-Links-URLhaus",
        SERVERS = "Gefaehrliche-Server-URLhaus", STATUS = "Stand", KEYS = "Zugangsschluessel";
    static final long HOUR = 60L * 60 * 1000, DAY = 24 * HOUR;
    static final long RECENT_EVERY = 12 * HOUR, FULL_EVERY = 30 * DAY, RETRY_AFTER = 3 * HOUR;
    static final long MAX_DOWNLOAD = 256L * 1024 * 1024, MAX_LIST_FILE = 8L + ProtectionList.MAX_ENTRIES * 8L + 16;
    private static final java.util.regex.Pattern KEY = java.util.regex.Pattern.compile("[A-Za-z0-9_-]{20,128}");
    private static final java.util.regex.Pattern HEX = java.util.regex.Pattern.compile("[0-9a-f]{64}");

    /** The encrypted folder as seen by the lists (Vault on the device, memory in JVM tests). */
    interface Store {
        boolean configured(); boolean unlocked(); String folderId(); void requireUnlocked() throws IOException;
        byte[] read(String base, long limit) throws IOException; void write(String base, byte[] data) throws IOException;
        JSONArray listing() throws IOException;
    }
    interface Opener { HttpURLConnection open(URL url) throws IOException; }
    interface Clock { long now(); }
    interface Metered { boolean metered(); }

    private final Store vault;
    private final Opener opener;
    private final Clock clock;
    private final Metered metered;
    final String malwareBase, linksBase, virusTotalBase;
    private String cachedFolder;
    private long[] malware, links, servers;
    private boolean updating;

    static Protection create(Context context) {
        ConnectivityManager connectivity = (ConnectivityManager) context.getSystemService(Context.CONNECTIVITY_SERVICE);
        return new Protection(store(Vault.get(context)), url -> (HttpURLConnection) url.openConnection(), System::currentTimeMillis,
            () -> connectivity == null || connectivity.isActiveNetworkMetered(),
            "https://mb-api.abuse.ch", "https://urlhaus-api.abuse.ch", "https://www.virustotal.com");
    }

    // Package-private: tests serve fixtures without any network.
    Protection(Store vault, Opener opener, Clock clock, Metered metered, String malwareBase, String linksBase, String virusTotalBase) {
        this.vault = vault; this.opener = opener; this.clock = clock; this.metered = metered;
        this.malwareBase = malwareBase; this.linksBase = linksBase; this.virusTotalBase = virusTotalBase;
    }

    static Store store(Vault vault) {
        return new Store() {
            @Override public boolean configured() { return vault.configured(); }
            @Override public boolean unlocked() { return vault.unlocked(); }
            @Override public String folderId() { return vault.folderId(); }
            @Override public void requireUnlocked() throws IOException { vault.requireUnlocked(); }
            @Override public byte[] read(String base, long limit) throws IOException { return vault.readDocument(Vault.LISTS, base, limit); }
            @Override public void write(String base, byte[] data) throws IOException { vault.writeDocument(Vault.LISTS, base, data); }
            @Override public JSONArray listing() throws IOException { return vault.listing(Vault.LISTS); }
        };
    }
    private static VaultCrypto.Failure fail(String code) { return new VaultCrypto.Failure(code); }

    // ---------- status and keys (encrypted documents in "Schutzlisten/") ----------
    private JSONObject status() throws Exception {
        byte[] data = vault.read(STATUS, 1024 * 1024);
        JSONObject s = data == null ? new JSONObject() : new JSONObject(new String(data, StandardCharsets.UTF_8));
        if (!s.has("auto")) s.put("auto", true);
        for (String part : new String[] {"malware", "links", "virustotal"}) if (s.optJSONObject(part) == null) s.put(part, new JSONObject());
        return s;
    }
    private void saveStatus(JSONObject s) throws Exception { vault.write(STATUS, s.toString().getBytes(StandardCharsets.UTF_8)); }
    private JSONObject keys() throws Exception {
        byte[] data = vault.read(KEYS, 64 * 1024);
        return data == null ? new JSONObject() : new JSONObject(new String(data, StandardCharsets.UTF_8));
    }
    static boolean validKey(CharSequence value) { return value != null && KEY.matcher(value).matches(); }
    synchronized void setKey(String service, CharSequence value) throws Exception {
        if (!"abusech".equals(service) && !"virustotal".equals(service)) throw fail("INVALID_INPUT");
        JSONObject k = keys();
        if (value == null || value.length() == 0) k.remove(service);
        else if (!validKey(value)) throw fail("KEY_INVALID");
        else k.put(service, value.toString());
        vault.write(KEYS, k.toString().getBytes(StandardCharsets.UTF_8));
        if ("abusech".equals(service)) {
            JSONObject s = status();
            for (String part : new String[] {"malware", "links"}) { s.getJSONObject(part).remove("problem"); s.getJSONObject(part).remove("attempt"); }
            saveStatus(s);
        }
    }
    synchronized void setAuto(boolean value) throws Exception { JSONObject s = status(); s.put("auto", value); saveStatus(s); }

    /** Status for the page: dates, counts, problems, whether keys exist – never the keys. */
    synchronized JSONObject state() throws Exception {
        JSONObject out = new JSONObject().put("configured", vault.configured()).put("unlocked", vault.unlocked())
            .put("offline", AppNetwork.isOffline()).put("updating", updating);
        if (!vault.configured() || !vault.unlocked()) return out;
        JSONObject s = status(), k = keys();
        out.put("auto", s.optBoolean("auto", true)).put("malware", s.getJSONObject("malware")).put("links", s.getJSONObject("links"))
            .put("keys", new JSONObject().put("abusech", k.has("abusech")).put("virustotal", k.has("virustotal")))
            .put("folder", Vault.LISTS).put("files", vault.listing());
        return out;
    }

    // ---------- downloads ----------
    /** Stream limited to MAX_DOWNLOAD bytes; a larger body is an error, never truncated data. */
    private static final class Capped extends FilterInputStream {
        long left;
        Capped(InputStream in, long limit) { super(in); left = limit; }
        @Override public int read() throws IOException { int c = super.read(); if (c >= 0 && --left < 0) throw fail("LIST_TOO_LARGE"); return c; }
        @Override public int read(byte[] b, int off, int len) throws IOException {
            int n = super.read(b, off, len); if (n > 0 && (left -= n) < 0) throw fail("LIST_TOO_LARGE"); return n;
        }
    }
    interface Body { void read(InputStream body) throws IOException; }
    /** One GET; the response body (unzipped if it is a ZIP archive) goes to the reader. */
    private void fetch(String address, String header, String value, Body reader) throws IOException {
        AppNetwork.check();
        long started = AppNetwork.epoch();
        HttpURLConnection request = null; AutoCloseable cancel = null;
        try {
            request = opener.open(new URL(address));
            HttpURLConnection active = request; cancel = AppNetwork.track(active::disconnect);
            request.setUseCaches(false); request.setConnectTimeout(20000); request.setReadTimeout(60000);
            request.setRequestMethod("GET"); request.setRequestProperty("Accept-Encoding", "identity");
            if (header != null) request.setRequestProperty(header, value);
            int code = request.getResponseCode();
            if (code == 401 || code == 403) throw fail("KEY_REJECTED");
            if (code == 404) throw fail("LIST_NOT_FOUND");
            if (code == 429) throw fail("RATE_LIMITED");
            if (code != 200) throw fail("DOWNLOAD_FAILED");
            try (InputStream raw = new BufferedInputStream(new Capped(request.getInputStream(), MAX_DOWNLOAD), 64 * 1024)) {
                raw.mark(4);
                boolean zip = raw.read() == 'P' && raw.read() == 'K';
                raw.reset();
                if (!zip) reader.read(raw);
                else try (ZipInputStream archive = new ZipInputStream(raw)) {
                    if (archive.getNextEntry() == null) throw fail("DOWNLOAD_FAILED");
                    reader.read(archive);
                }
            }
            AppNetwork.check(started);
        } catch (AppNetwork.Blocked | VaultCrypto.Failure known) { throw known; }
        catch (IOException other) {
            if (AppNetwork.isOffline() || started != AppNetwork.epoch()) throw new AppNetwork.Blocked();
            throw fail("DOWNLOAD_FAILED");
        } finally {
            if (cancel != null) AppNetwork.release(cancel);
            if (request != null) request.disconnect();
        }
    }
    private static String path(String key, String file) { return "/v2/files/exports/" + key + "/" + file; }
    private static String code(Exception error) { String c = ProMailPlugin.code(error); return c.equals("CONNECTION_FAILED") ? "DOWNLOAD_FAILED" : c; }
    private long[] loadList(String base) throws Exception {
        byte[] data = vault.read(base, MAX_LIST_FILE);
        return data == null ? new long[0] : ProtectionList.decode(data);
    }

    private boolean due(JSONObject part, long every, boolean force, long now) {
        if (force) return true;
        if (part.has("attempt") && now - part.optLong("attempt") < RETRY_AFTER && part.has("problem")) return false;
        return now - part.optLong("updated", 0) >= every;
    }

    /**
     * Updates what is due (or everything when forced). The large complete malware list is
     * fetched automatically only on Wi-Fi; recent additions are merged in every 12 hours.
     */
    JSONObject update(boolean force) throws Exception {
        synchronized (this) {
            vault.requireUnlocked();
            if (updating) throw fail("VAULT_BUSY");
            updating = true;
        }
        try { return run(force); }
        finally { synchronized (this) { updating = false; } }
    }
    private JSONObject run(boolean force) throws Exception {
        JSONObject s, k;
        synchronized (this) { s = status(); k = keys(); }
        JSONObject result = new JSONObject().put("checked", true);
        if (!force && !s.optBoolean("auto", true)) return result.put("skipped", "AUTO_OFF");
        if (AppNetwork.isOffline()) return result.put("skipped", "APP_OFFLINE");
        String key = k.optString("abusech", "");
        long now = clock.now();
        JSONObject m = s.getJSONObject("malware"), l = s.getJSONObject("links");
        boolean malwareDue = due(m, RECENT_EVERY, force, now), linksDue = due(l, RECENT_EVERY, force, now);
        if (!malwareDue && !linksDue) return result.put("skipped", "NOT_DUE");
        if (key.isEmpty()) {
            for (JSONObject part : new JSONObject[] {m, l}) part.put("problem", "KEY_REQUIRED");
            synchronized (this) { saveStatus(s); }
            return result.put("skipped", "KEY_REQUIRED");
        }
        if (malwareDue) updateMalware(m, key, force, now);
        if (linksDue) updateLinks(l, key, now);
        synchronized (this) { saveStatus(s); invalidate(); }
        return result.put("malware", m).put("links", l);
    }
    private void updateMalware(JSONObject m, String key, boolean force, long now) throws Exception {
        m.put("attempt", now);
        try {
            ProtectionList.Builder list = new ProtectionList.Builder();
            boolean full = false;
            boolean fullDue = now - m.optLong("full", 0) >= FULL_EVERY && (force || !metered.metered()) && now - m.optLong("fullMissing", 0) >= FULL_EVERY;
            if (fullDue) {
                try { fetch(malwareBase + path(key, "full.csv.zip"), null, null, body -> ProtectionList.readHashes(body, list)); full = true; }
                catch (VaultCrypto.Failure notThere) {
                    if (!"LIST_NOT_FOUND".equals(notThere.getMessage())) throw notThere;
                    m.put("fullMissing", now);
                }
            }
            ProtectionList.Builder recent = new ProtectionList.Builder();
            fetch(malwareBase + path(key, "recent.csv"), null, null, body -> ProtectionList.readHashes(body, recent));
            // Without a fresh complete list, recent additions extend the existing list.
            if (!full) list.addAll(loadList(MALWARE));
            list.addAll(recent.finish());
            long[] merged = list.finish();
            vault.write(MALWARE, ProtectionList.encode(merged));
            m.put("updated", now).put("count", merged.length).put("recentCount", recent.size()).remove("problem");
            if (full) m.put("full", now);
        } catch (Exception error) { m.put("problem", code(error)); }
    }
    private void updateLinks(JSONObject l, String key, long now) throws Exception {
        l.put("attempt", now);
        try {
            ProtectionList.Builder urls = new ProtectionList.Builder(), hosts = new ProtectionList.Builder();
            fetch(linksBase + path(key, "recent.csv"), null, null, body -> ProtectionList.readUrls(body, urls, hosts));
            long[] u = urls.finish(), h = hosts.finish();
            // Links are replaced, not accumulated: an address taken down drops out again.
            vault.write(LINKS, ProtectionList.encode(u));
            vault.write(SERVERS, ProtectionList.encode(h));
            l.put("updated", now).put("count", u.length).put("servers", h.length).remove("problem");
        } catch (Exception error) { l.put("problem", code(error)); }
    }

    // ---------- lookups (in memory after the first use) ----------
    private synchronized void invalidate() { malware = links = servers = null; cachedFolder = null; }
    private synchronized void ensure() throws Exception {
        vault.requireUnlocked();
        String folder = vault.folderId();
        if (folder.equals(cachedFolder) && malware != null) return;
        malware = loadList(MALWARE); links = loadList(LINKS); servers = loadList(SERVERS);
        cachedFolder = folder;
    }
    /** Which of the given SHA-256 fingerprints are on the malware list. */
    JSONObject checkHashes(JSONArray hashes) throws Exception {
        ensure();
        JSONArray items = new JSONArray();
        long[] list; synchronized (this) { list = malware; }
        for (int i = 0; i < hashes.length() && i < 1000; i++) {
            String hex = hashes.optString(i, "").toLowerCase(java.util.Locale.ROOT);
            JSONObject item = new JSONObject().put("sha256", hex);
            if (!HEX.matcher(hex).matches()) item.put("invalid", true);
            else item.put("listed", ProtectionList.contains(list, ProtectionList.fromHex(hex)));
            items.put(item);
        }
        return new JSONObject().put("items", items).put("available", list.length > 0).put("count", list.length);
    }
    /** Which addresses are listed exactly, or sit on a server with listed malware links. */
    JSONObject checkUrls(JSONArray urls) throws Exception {
        ensure();
        JSONArray items = new JSONArray();
        long[] u, h; synchronized (this) { u = links; h = servers; }
        for (int i = 0; i < urls.length() && i < 500; i++) {
            String raw = urls.optString(i, "");
            JSONObject item = new JSONObject().put("url", raw);
            String normalized = ProtectionList.normalizeUrl(raw);
            if (normalized == null) { items.put(item.put("invalid", true)); continue; }
            String host = ProtectionList.urlHost(normalized);
            item.put("host", host).put("listed", ProtectionList.contains(u, ProtectionList.urlKey(normalized)))
                .put("serverListed", host != null && !ProtectionList.sharedHost(host) && ProtectionList.contains(h, ProtectionList.hostKey(host)));
            items.put(item);
        }
        return new JSONObject().put("items", items).put("available", u.length > 0).put("count", u.length);
    }

    /** Fingerprint only (never the file) to VirusTotal; on the user's tap only. */
    JSONObject virusTotal(String sha256) throws Exception {
        String hex = sha256 == null ? "" : sha256.toLowerCase(java.util.Locale.ROOT);
        if (!HEX.matcher(hex).matches()) throw fail("INVALID_INPUT");
        String key;
        synchronized (this) { vault.requireUnlocked(); key = keys().optString("virustotal", ""); }
        if (key.isEmpty()) throw fail("KEY_REQUIRED");
        ByteArrayOutputStream body = new ByteArrayOutputStream();
        try {
            fetch(virusTotalBase + "/api/v3/files/" + hex, "x-apikey", key, in -> {
                byte[] buffer = new byte[8192]; int n;
                while ((n = in.read(buffer)) != -1) { if (body.size() + n > 4 * 1024 * 1024) throw fail("DOWNLOAD_FAILED"); body.write(buffer, 0, n); }
            });
        } catch (VaultCrypto.Failure missing) {
            if ("LIST_NOT_FOUND".equals(missing.getMessage())) return new JSONObject().put("known", false).put("checked", clock.now());
            throw missing;
        }
        JSONObject attributes;
        try { attributes = new JSONObject(body.toString(StandardCharsets.UTF_8.name())).getJSONObject("data").getJSONObject("attributes"); }
        catch (org.json.JSONException unexpected) { throw fail("DOWNLOAD_FAILED"); }
        JSONObject stats = attributes.optJSONObject("last_analysis_stats");
        if (stats == null) return new JSONObject().put("known", true).put("analysed", false).put("checked", clock.now());
        int malicious = stats.optInt("malicious"), suspicious = stats.optInt("suspicious"), total = 0;
        for (java.util.Iterator<String> it = stats.keys(); it.hasNext(); ) {
            String name = it.next();
            // "type-unsupported", "timeout" and "failure" are engines that gave no answer.
            if (name.equals("malicious") || name.equals("suspicious") || name.equals("undetected") || name.equals("harmless")) total += stats.optInt(name);
        }
        return new JSONObject().put("known", true).put("analysed", true).put("malicious", malicious).put("suspicious", suspicious)
            .put("total", total).put("date", attributes.optLong("last_analysis_date") * 1000).put("checked", clock.now());
    }
}
