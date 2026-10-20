package de.familyprojekt.privatebrain.pro;

import android.content.Context;
import android.net.Uri;
import android.provider.DocumentsContract;
import androidx.test.ext.junit.runners.AndroidJUnit4;
import androidx.test.platform.app.InstrumentationRegistry;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileNotFoundException;
import java.io.IOException;
import java.io.InputStream;
import java.io.RandomAccessFile;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.TreeSet;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;
import org.json.JSONArray;
import org.json.JSONObject;
import org.junit.After;
import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;
import static org.junit.Assert.*;

/**
 * Real storage framework, real Keystore, real crypto; the providers (abuse.ch, VirusTotal)
 * are replaced by fixed answers, so no test ever reaches the internet.
 */
@RunWith(AndroidJUnit4.class)
public class NativeProtectTest {
    private static final String PASSWORD = "Ein langes Passwört 2026";
    private static final String KEY = "abuse-key-0123456789abcdefABCDEF", VT_KEY = "vt0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcd";
    private static final String A = rep('a'), B = rep('b'), C = rep('c'), D = rep('d');
    private static String rep(char c) { char[] v = new char[64]; java.util.Arrays.fill(v, c); return new String(v); }
    private Context context() { return InstrumentationRegistry.getInstrumentation().getTargetContext(); }
    private String authority() { return context().getPackageName() + ".fixture.documents"; }
    private Uri tree(String id) { return DocumentsContract.buildTreeDocumentUri(authority(), id); }
    private File lists() { return new File(context().getCacheDir(), "fixture-documents/vaultA/Private Brain/Schutzlisten"); }

    /** Fixed answers by path; every request is recorded. */
    private final Map<String, Object[]> answers = new HashMap<>();
    private final List<String> requests = new ArrayList<>();
    private final Map<String, String> lastHeaders = new HashMap<>();
    private long now = 1_800_000_000_000L;
    private boolean metered = true;
    private final class Fake extends HttpURLConnection {
        Fake(URL url) { super(url); }
        @Override public void disconnect() { }
        @Override public boolean usingProxy() { return false; }
        @Override public void connect() { }
        @Override public void setRequestProperty(String key, String value) { lastHeaders.put(key, value); }
        private Object[] answer() { Object[] a = answers.get(url.getHost() + url.getPath()); return a == null ? new Object[] {404, new byte[0]} : a; }
        @Override public int getResponseCode() { return (Integer) answer()[0]; }
        @Override public InputStream getInputStream() throws IOException {
            if ((Integer) answer()[0] != 200) throw new FileNotFoundException(url.getHost() + url.getPath());
            return new ByteArrayInputStream((byte[]) answer()[1]);
        }
    }
    private Vault vault;
    private Protection protection;

    @Before public void setUp() throws Exception {
        AppNetwork.setOffline(context(), false);
        context().getContentResolver().call(Uri.parse("content://" + authority()), "fixture-reset", null, null);
        java.security.KeyStore store = java.security.KeyStore.getInstance("AndroidKeyStore"); store.load(null);
        if (store.containsAlias("pb-protect-test")) store.deleteEntry("pb-protect-test");
        context().getSharedPreferences("protect-test", 0).edit().clear().commit();
        vault = new Vault(context(), "protect-test", "pb-protect-test");
        vault.create(tree("vaultA"), PASSWORD, false);
        protection = new Protection(Protection.store(vault), url -> { requests.add(url.getHost() + url.getPath()); return new Fake(url); },
            () -> now, () -> metered, "https://mb.test", "https://uh.test", "https://vt.test");
    }
    @After public void tearDown() throws Exception { AppNetwork.setOffline(context(), false); }

    private static byte[] text(String s) { return s.getBytes(StandardCharsets.UTF_8); }
    private static byte[] zip(String name, String content) throws IOException {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        try (ZipOutputStream z = new ZipOutputStream(out)) { z.putNextEntry(new ZipEntry(name)); z.write(text(content)); z.closeEntry(); }
        return out.toByteArray();
    }
    private void serveLists() throws IOException {
        answers.put("mb.test/v2/files/exports/" + KEY + "/full.csv.zip", new Object[] {200, zip("full.csv", "# full\n\"2026-01-01\",\"" + A + "\"\n\"2026-01-02\",\"" + B + "\"\n")});
        answers.put("mb.test/v2/files/exports/" + KEY + "/recent.csv", new Object[] {200, text("# recent\n\"2026-10-20\",\"" + C + "\"\n")});
    }
    private static Map<String, Long> appFiles(Context context) {
        Map<String, Long> out = new HashMap<>();
        for (File root : new File[] {context.getFilesDir(), context.getCacheDir(), context.getNoBackupFilesDir(), context.getExternalFilesDir(null), context.getExternalCacheDir()})
            if (root != null) walk(root, out);
        out.keySet().removeIf(path -> path.contains("/fixture-documents/"));
        return out;
    }
    private static void walk(File file, Map<String, Long> out) {
        File[] children = file.listFiles();
        if (children == null) { out.put(file.getPath(), file.length()); return; }
        for (File child : children) walk(child, out);
    }
    private static boolean contains(byte[] haystack, byte[] needle) {
        outer: for (int i = 0; i + needle.length <= haystack.length; i++) { for (int j = 0; j < needle.length; j++) if (haystack[i + j] != needle[j]) continue outer; return true; }
        return false;
    }
    private JSONObject hashes(String... values) throws Exception { return protection.checkHashes(new JSONArray(java.util.Arrays.asList(values))); }

    @Test public void listsAreFetchedWithTheKeyAndStoredOnlyInTheChosenFolder() throws Exception {
        Map<String, Long> before = appFiles(context());
        JSONObject first = protection.update(false);
        assertEquals("without a key nothing is fetched", "KEY_REQUIRED", first.getString("skipped"));
        assertTrue(requests.isEmpty());
        protection.setKey("abusech", KEY);
        serveLists();
        protection.update(true);
        // URLhaus answers on its own host; both use the same file name.
        assertTrue(requests.toString(), requests.contains("mb.test/v2/files/exports/" + KEY + "/full.csv.zip"));
        assertTrue(requests.contains("mb.test/v2/files/exports/" + KEY + "/recent.csv"));
        assertTrue(requests.contains("uh.test/v2/files/exports/" + KEY + "/recent.csv"));
        JSONArray found = hashes(A, B, C, D, "kein hash").getJSONArray("items");
        assertTrue(found.getJSONObject(0).getBoolean("listed") && found.getJSONObject(1).getBoolean("listed") && found.getJSONObject(2).getBoolean("listed"));
        assertFalse(found.getJSONObject(3).getBoolean("listed"));
        assertTrue(found.getJSONObject(4).getBoolean("invalid"));

        TreeSet<String> names = new TreeSet<>();
        for (File f : lists().listFiles()) names.add(f.getName());
        for (String prefix : new String[] {"Schaddateien-MalwareBazaar-", "Gefaehrliche-Links-URLhaus-", "Gefaehrliche-Server-URLhaus-", "Stand-", "Zugangsschluessel-"})
            assertTrue(prefix + " in " + names, names.stream().anyMatch(n -> n.startsWith(prefix) && n.endsWith(".pbv")));
        // Encrypted: neither the key nor a listed fingerprint is readable in the folder.
        byte[] raw = new byte[0];
        for (File f : lists().listFiles()) {
            byte[] content = Files.readAllBytes(f.toPath());
            assertFalse("key readable in " + f.getName(), contains(content, text(KEY)));
            assertFalse("fingerprint readable in " + f.getName(), contains(content, new byte[] {(byte) 0xaa, (byte) 0xaa, (byte) 0xaa, (byte) 0xaa, (byte) 0xaa, (byte) 0xaa}));
            raw = content;
        }
        assertTrue(raw.length > 0);
        // The app's own storage gained nothing: downloads went through memory into the folder.
        Map<String, Long> after = appFiles(context());
        for (Map.Entry<String, Long> e : after.entrySet())
            assertTrue("written outside the chosen folder: " + e.getKey(), before.containsKey(e.getKey()) || e.getValue() < 4096 && e.getKey().contains("shared_prefs"));
        JSONObject state = protection.state();
        assertTrue(state.getJSONObject("keys").getBoolean("abusech"));
        assertFalse("key reached the page", state.toString().contains(KEY));
        assertEquals(3, state.getJSONObject("malware").getInt("count"));
    }

    @Test public void linkListsNameExactAddressesAndServers() throws Exception {
        protection.setKey("abusech", KEY);
        answers.put("uh.test/v2/files/exports/" + KEY + "/recent.csv", new Object[] {200, text("# URLhaus\n"
            + "\"1\",\"2026-10-20\",\"http://Evil.Example/drop.exe\",\"online\"\n\"2\",\"2026-10-20\",\"https://raw.githubusercontent.com/x/y/run.ps1\",\"online\"\n")});
        protection.update(true);
        JSONArray items = protection.checkUrls(new JSONArray(java.util.Arrays.asList("http://evil.example:80/drop.exe#x", "https://evil.example/other",
            "https://raw.githubusercontent.com/x/y/other.ps1", "https://example.org/", "javascript:alert(1)"))).getJSONArray("items");
        assertTrue(items.getJSONObject(0).getBoolean("listed"));
        assertFalse(items.getJSONObject(1).getBoolean("listed")); assertTrue(items.getJSONObject(1).getBoolean("serverListed"));
        assertFalse("shared platforms are not condemned", items.getJSONObject(2).getBoolean("serverListed"));
        assertFalse(items.getJSONObject(3).getBoolean("listed") || items.getJSONObject(3).getBoolean("serverListed"));
        assertTrue(items.getJSONObject(4).getBoolean("invalid"));
    }

    @Test public void automaticUpdatesRespectSwitchScheduleWifiAndRetry() throws Exception {
        protection.setKey("abusech", KEY);
        serveLists();
        AppNetwork.setOffline(context(), true);
        assertEquals("APP_OFFLINE", protection.update(false).getString("skipped"));
        assertTrue("fetched although the app is offline", requests.isEmpty());
        AppNetwork.setOffline(context(), false);
        // Mobile data: the large complete list waits for Wi-Fi; recent additions do not.
        protection.update(false);
        assertFalse(requests.toString(), requests.stream().anyMatch(r -> r.endsWith("full.csv.zip")));
        assertTrue(hashes(C).getJSONArray("items").getJSONObject(0).getBoolean("listed"));
        requests.clear();
        assertEquals("NOT_DUE", protection.update(false).getString("skipped"));
        assertTrue(requests.isEmpty());
        now += 13 * Protection.HOUR; metered = false;
        protection.update(false);
        assertTrue(requests.toString(), requests.stream().anyMatch(r -> r.endsWith("full.csv.zip")));
        assertTrue(hashes(A).getJSONArray("items").getJSONObject(0).getBoolean("listed"));
        // Without a complete list, recent additions extend the list instead of replacing it.
        answers.remove("mb.test/v2/files/exports/" + KEY + "/full.csv.zip");
        answers.put("mb.test/v2/files/exports/" + KEY + "/recent.csv", new Object[] {200, text(D + "\n")});
        now += 31 * Protection.DAY; requests.clear();
        protection.update(false);
        JSONArray items = hashes(A, C, D).getJSONArray("items");
        for (int i = 0; i < 3; i++) assertTrue("lost " + i, items.getJSONObject(i).getBoolean("listed"));
        // A rejected key is recorded and not retried at once.
        answers.put("mb.test/v2/files/exports/" + KEY + "/recent.csv", new Object[] {401, new byte[0]});
        now += 13 * Protection.HOUR;
        protection.update(false);
        assertEquals("KEY_REJECTED", protection.state().getJSONObject("malware").getString("problem"));
        requests.clear(); now += Protection.HOUR;
        assertEquals("NOT_DUE", protection.update(false).getString("skipped"));
        assertTrue(requests.isEmpty());
        assertTrue("old list kept after a failed update", hashes(D).getJSONArray("items").getJSONObject(0).getBoolean("listed"));
        protection.setAuto(false);
        now += 30 * Protection.DAY;
        assertEquals("AUTO_OFF", protection.update(false).getString("skipped"));
    }

    @Test public void lockedFolderAndDamagedListAreNeverTakenAsEmpty() throws Exception {
        protection.setKey("abusech", KEY);
        serveLists();
        protection.update(true);
        answers.put("mb.test/v2/files/exports/" + KEY + "/recent.csv", new Object[] {200, text(D + "\n")});
        protection.update(true);
        vault.lock();
        try { hashes(A); fail("locked folder answered"); }
        catch (VaultCrypto.Failure expected) { assertEquals("VAULT_LOCKED", expected.getMessage()); }
        vault.unlock(PASSWORD, false);
        File newest = null; long number = -1;
        for (File f : lists().listFiles()) if (f.getName().startsWith("Schaddateien-MalwareBazaar-")) {
            long n = Long.parseLong(f.getName().replaceAll("\\D", ""));
            if (n > number) { number = n; newest = f; }
        }
        try (RandomAccessFile file = new RandomAccessFile(newest, "rw")) { file.seek(file.length() - 5); int b = file.read(); file.seek(file.length() - 5); file.write(b ^ 1); }
        Protection fresh = new Protection(Protection.store(vault), url -> new Fake(url), () -> now, () -> true, "https://mb.test", "https://uh.test", "https://vt.test");
        JSONArray items = fresh.checkHashes(new JSONArray(java.util.Arrays.asList(A, D))).getJSONArray("items");
        assertTrue("previous version used", items.getJSONObject(0).getBoolean("listed"));
        assertFalse("damaged newest version was used", items.getJSONObject(1).getBoolean("listed"));
    }

    @Test public void virusTotalReceivesOnlyTheFingerprint() throws Exception {
        try { protection.virusTotal(A); fail("no key"); }
        catch (VaultCrypto.Failure expected) { assertEquals("KEY_REQUIRED", expected.getMessage()); }
        protection.setKey("virustotal", VT_KEY);
        answers.put("vt.test/api/v3/files/" + A, new Object[] {200, text("{\"data\":{\"attributes\":{\"last_analysis_date\":1760000000,"
            + "\"last_analysis_stats\":{\"malicious\":3,\"suspicious\":1,\"undetected\":60,\"harmless\":6,\"timeout\":2,\"type-unsupported\":4}}}}")});
        JSONObject result = protection.virusTotal(A.toUpperCase());
        assertEquals(3, result.getInt("malicious")); assertEquals(70, result.getInt("total"));
        assertEquals(VT_KEY, lastHeaders.get("x-apikey"));
        assertEquals("vt.test/api/v3/files/" + A, requests.get(requests.size() - 1));
        assertFalse(protection.virusTotal(B).getBoolean("known"));
        try { protection.virusTotal("../" + A); fail("path accepted"); }
        catch (VaultCrypto.Failure expected) { assertEquals("INVALID_INPUT", expected.getMessage()); }
        AppNetwork.setOffline(context(), true);
        try { protection.virusTotal(A); fail("asked although offline"); }
        catch (AppNetwork.Blocked expected) { }
    }
}
