package de.familyprojekt.privatebrain.pro;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertNull;
import static org.junit.Assert.assertTrue;
import static org.junit.Assert.fail;

import java.io.ByteArrayInputStream;
import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.file.Files;
import java.security.MessageDigest;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.junit.Test;

public class SemanticModelTest {
    /** A small web server in memory: per address a body, or a status; counts requests and can break off once. */
    static final class Fake {
        final Map<String, byte[]> bodies = new HashMap<>();
        final Map<String, Integer> status = new HashMap<>();
        final List<String> asked = new ArrayList<>();
        String breakOnce; int breakAfter;
        HttpURLConnection open(URL url) {
            return new HttpURLConnection(url) {
                String range;
                @Override public void setRequestProperty(String k, String v) { if ("Range".equals(k)) range = v; }
                @Override public int getResponseCode() {
                    asked.add(url + (range == null ? "" : " " + range));
                    if (status.containsKey(url.toString())) return status.get(url.toString());
                    if (!bodies.containsKey(url.toString())) return 404;
                    return range == null ? 200 : 206;
                }
                @Override public InputStream getInputStream() throws IOException {
                    byte[] all = bodies.get(url.toString());
                    int from = range == null ? 0 : Integer.parseInt(range.replace("bytes=", "").replace("-", ""));
                    byte[] rest = Arrays.copyOfRange(all, from, all.length);
                    if (url.toString().equals(breakOnce)) {
                        breakOnce = null;
                        byte[] cut = Arrays.copyOf(rest, breakAfter);
                        return new InputStream() {
                            int i;
                            @Override public int read() throws IOException { if (i < cut.length) return cut[i++] & 0xff; throw new IOException("connection lost"); }
                        };
                    }
                    return new ByteArrayInputStream(rest);
                }
                @Override public void disconnect() { }
                @Override public boolean usingProxy() { return false; }
                @Override public void connect() { }
            };
        }
    }

    static String sha(byte[] b) throws Exception { return SemanticModel.hex(MessageDigest.getInstance("SHA-256").digest(b)); }
    static byte[] bytes(int n, int seed) { byte[] b = new byte[n]; for (int i = 0; i < n; i++) b[i] = (byte) (i * 31 + seed); return b; }
    static File folder() throws IOException { return Files.createTempDirectory("semantic").toFile(); }

    @Test public void loadsFromTheFirstSourceThatHasTheRightFile() throws Exception {
        byte[] model = bytes(300_000, 1), lib = bytes(70_000, 2);
        Fake web = new Fake();
        web.status.put("https://own.example/m.onnx", 503);                       // Klaus' server down
        web.bodies.put("https://hf.example/m.onnx", model);
        web.bodies.put("https://own.example/l.js", bytes(70_000, 9));           // wrong file there
        web.bodies.put("https://cdn.example/l.js", lib);
        List<SemanticModel.Entry> list = Arrays.asList(
            new SemanticModel.Entry("model/onnx/m.onnx", sha(model), model.length, Arrays.asList("https://own.example/m.onnx", "https://hf.example/m.onnx")),
            new SemanticModel.Entry("lib/l.js", sha(lib), 0, Arrays.asList("https://own.example/l.js", "https://cdn.example/l.js")));
        File dir = folder();
        SemanticModel m = new SemanticModel(dir, list, web::open);
        assertFalse(m.installed());
        assertNull("nothing is served before the model is complete", m.file("lib/l.js"));
        long[] seen = {0};
        m.install((done, total, file, source) -> seen[0] = Math.max(seen[0], done));
        assertTrue(m.installed());
        assertArrayEquals(model, Files.readAllBytes(m.file("model/onnx/m.onnx").toPath()));
        assertArrayEquals(lib, Files.readAllBytes(m.file("lib/l.js").toPath()));
        assertNull("only listed files", m.file("model/other.json"));
        assertTrue("progress reached the model size", seen[0] >= model.length);
        assertFalse("no partial files stay behind", new File(dir, "lib/l.js.part").exists());
        int before = web.asked.size();
        m.install((d, t, f, s) -> { });
        assertEquals("a complete model is not loaded again", before, web.asked.size());
    }

    @Test public void continuesWhereAnInterruptedDownloadStopped() throws Exception {
        byte[] model = bytes(500_000, 3);
        Fake web = new Fake();
        web.bodies.put("https://hf.example/m.onnx", model);
        web.breakOnce = "https://hf.example/m.onnx"; web.breakAfter = 200_000;
        List<SemanticModel.Entry> list = Arrays.asList(new SemanticModel.Entry("model/m.onnx", sha(model), model.length, Arrays.asList("https://hf.example/m.onnx")));
        SemanticModel m = new SemanticModel(folder(), list, web::open);
        try { m.install((d, t, f, s) -> { }); fail("the first attempt breaks off"); }
        catch (SemanticModel.Failure expected) { assertEquals("DOWNLOAD", expected.code); }
        assertFalse(m.installed());
        assertEquals(200_000, m.present());
        m.install((d, t, f, s) -> { });
        assertTrue(m.installed());
        assertTrue("second request asks only for the rest: " + web.asked, web.asked.get(web.asked.size() - 1).endsWith("bytes=200000-"));
        assertArrayEquals(model, Files.readAllBytes(m.file("model/m.onnx").toPath()));
    }

    @Test public void aFileWithAnotherFingerprintIsNeverAccepted() throws Exception {
        byte[] model = bytes(10_000, 4);
        Fake web = new Fake();
        web.bodies.put("https://own.example/m.onnx", bytes(10_000, 5));
        web.bodies.put("https://hf.example/m.onnx", bytes(10_000, 6));
        List<SemanticModel.Entry> list = Arrays.asList(new SemanticModel.Entry("model/m.onnx", sha(model), 0, Arrays.asList("https://own.example/m.onnx", "https://hf.example/m.onnx")));
        File dir = folder();
        SemanticModel m = new SemanticModel(dir, list, web::open);
        try { m.install((d, t, f, s) -> { }); fail("both sources carry a wrong file"); }
        catch (SemanticModel.Failure expected) { assertEquals("DOWNLOAD", expected.code); assertTrue(expected.getMessage().contains("fingerprint")); }
        assertFalse(m.installed());
        assertFalse(new File(dir, "model/m.onnx").exists());
        assertEquals("a wrong file is not kept for resuming", 0, m.present());
    }

    @Test public void aChangedPinListMeansNotInstalledAndRemoveClearsEverything() throws Exception {
        byte[] a = bytes(1000, 7);
        Fake web = new Fake(); web.bodies.put("https://x.example/a", a);
        File dir = folder();
        SemanticModel m = new SemanticModel(dir, Arrays.asList(new SemanticModel.Entry("lib/a.js", sha(a), a.length, Arrays.asList("https://x.example/a"))), web::open);
        m.install((d, t, f, s) -> { });
        assertTrue(m.installed());
        SemanticModel newer = new SemanticModel(dir, Arrays.asList(new SemanticModel.Entry("lib/a.js", sha(bytes(1000, 8)), 1000, Arrays.asList("https://x.example/a"))), web::open);
        assertFalse("another fingerprint in the app means the stored files are not trusted", newer.installed());
        m.remove();
        assertFalse(dir.exists());
        assertFalse(m.installed());
    }

    @Test public void theAppInternetSwitchStopsTheDownload() throws Exception {
        byte[] a = bytes(1000, 9);
        Fake web = new Fake(); web.bodies.put("https://x.example/a", a);
        SemanticModel m = new SemanticModel(folder(), Arrays.asList(new SemanticModel.Entry("lib/a.js", sha(a), a.length, Arrays.asList("https://x.example/a"))), web::open);
        AppNetworkTestAccess.setOffline(true);
        try { m.install((d, t, f, s) -> { }); fail("offline"); }
        catch (SemanticModel.Failure expected) { assertEquals("APP_OFFLINE", expected.code); }
        finally { AppNetworkTestAccess.setOffline(false); }
        assertTrue("nothing was asked while offline", web.asked.isEmpty());
    }

    @Test public void unsafePathsAndHashesAreRefused() {
        for (String bad : new String[]{"../x", "lib/../x", "other/x", "lib/a/b/c", "lib/"}) {
            try { new SemanticModel.Entry(bad, "0".repeat(64), 0, Arrays.asList()); fail(bad); } catch (IllegalArgumentException expected) { }
        }
        try { new SemanticModel.Entry("lib/a", "xyz", 0, Arrays.asList()); fail("hash"); } catch (IllegalArgumentException expected) { }
        assertNotNull(new SemanticModel.Entry("model/onnx/model_quantized.onnx", "0".repeat(64), 0, Arrays.asList()));
    }

    static void assertArrayEquals(byte[] a, byte[] b) { assertTrue(Arrays.equals(a, b)); }
}
