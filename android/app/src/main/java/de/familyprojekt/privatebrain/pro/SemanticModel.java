package de.familyprojekt.privatebrain.pro;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.function.BooleanSupplier;

/**
 * The meaning model, loaded on request from inside the app (Klaus 2026-10-21: "Schalter … Laden
 * des Modells direkt aus der App … von meinem Server"). Each file is tried from its sources in
 * order (Klaus' server first, then Hugging Face / the npm CDN), streamed to app storage, resumed
 * after an interruption and accepted only with its fixed SHA-256. The WebView never holds the
 * download; it later reads the checked files through MainActivity as local addresses.
 */
final class SemanticModel {
    interface Opener { HttpURLConnection open(URL url) throws IOException; }
    interface Progress { void update(long done, long total, String file, String source); }

    static final class Entry {
        final String path, sha256; final long size; final List<String> urls;
        Entry(String path, String sha256, long size, List<String> urls) {
            if (path == null || !path.matches("(lib|model)/[A-Za-z0-9_.-]+(/[A-Za-z0-9_.-]+)?") || path.contains(".."))
                throw new IllegalArgumentException("bad path " + path);
            if (sha256 == null || !sha256.matches("[0-9a-f]{64}")) throw new IllegalArgumentException("bad sha256 for " + path);
            this.path = path; this.sha256 = sha256; this.size = size; this.urls = Collections.unmodifiableList(new ArrayList<>(urls));
        }
    }

    static final class Failure extends IOException {
        final String code;
        Failure(String code, String message) { super(message); this.code = code; }
    }

    static final String MARKER = "installed.txt";
    private static final int CHUNK = 64 * 1024;
    private final File dir;
    private final List<Entry> entries;
    private final Opener opener;
    private volatile boolean cancelled;
    private volatile BooleanSupplier cancelledExternally = () -> false;
    private volatile long networkEpoch;
    private volatile HttpURLConnection current;

    SemanticModel(File dir, List<Entry> entries, Opener opener) {
        this.dir = dir; this.entries = Collections.unmodifiableList(new ArrayList<>(entries)); this.opener = opener;
    }

    List<Entry> entries() { return entries; }
    File dir() { return dir; }

    long total() { long sum = 0; for (Entry e : entries) sum += Math.max(0, e.size); return sum; }

    /** What the marker must say: every path with its fingerprint. A changed pin list means "not installed". */
    String expectedMarker() {
        StringBuilder text = new StringBuilder();
        for (Entry e : entries) text.append(e.path).append(' ').append(e.sha256).append('\n');
        return text.toString();
    }

    boolean installed() {
        File marker = new File(dir, MARKER);
        if (!marker.isFile()) return false;
        try {
            if (!expectedMarker().equals(read(marker))) return false;
        } catch (IOException e) { return false; }
        for (Entry e : entries) {
            File f = new File(dir, e.path);
            if (!f.isFile() || (e.size > 0 && f.length() != e.size)) return false;
        }
        return true;
    }

    /** Bytes already in app storage, finished or partial (for the progress bar after a restart). */
    long present() {
        long sum = 0;
        for (Entry e : entries) {
            File done = new File(dir, e.path), part = new File(dir, e.path + ".part");
            if (done.isFile()) sum += done.length(); else if (part.isFile()) sum += part.length();
        }
        return sum;
    }

    /** The checked file for a path, or null while the model is not complete. */
    File file(String path) {
        if (!installed()) return null;
        for (Entry e : entries) if (e.path.equals(path)) return new File(dir, e.path);
        return null;
    }

    void cancel() {
        cancelled = true;
        HttpURLConnection c = current;
        if (c != null) c.disconnect();
    }

    void remove() throws IOException {
        cancel();
        deleteTree(dir);
        if (dir.exists()) throw new IOException("Model folder could not be removed");
    }

    /** Loads every missing file. Returns normally only when all files are present and checked. */
    void install(Progress progress) throws IOException {
        install(progress, () -> false);
    }

    /** A multi-model job can cancel the next leg before its first connection opens. */
    void install(Progress progress, BooleanSupplier stop) throws IOException {
        cancelledExternally = stop;
        networkEpoch = AppNetwork.epoch();
        cancelled = false;
        if (isCancelled()) throw new Failure("CANCELLED", "Cancelled");
        if (!dir.isDirectory() && !dir.mkdirs()) throw new Failure("STORAGE", "Model folder unavailable");
        long need = total() - present();
        if (dir.getUsableSpace() > 0 && need > 0 && dir.getUsableSpace() < need + 50L * 1024 * 1024)
            throw new Failure("NO_SPACE", "Not enough free storage");
        new File(dir, MARKER).delete();
        long done = 0;
        for (Entry e : entries) {
            if (isCancelled()) throw new Failure("CANCELLED", "Cancelled");
            File target = new File(dir, e.path);
            if (target.isFile() && verified(target, e)) { done += target.length(); continue; }
            target.delete();
            done = fetch(e, target, done, progress);
        }
        write(new File(dir, MARKER), expectedMarker());
        progress.update(total(), total(), "", "");
    }

    private boolean isCancelled() { return cancelled || cancelledExternally.getAsBoolean(); }

    private boolean verified(File f, Entry e) throws IOException {
        if (e.size > 0 && f.length() != e.size) return false;
        File stamp = new File(f.getPath() + ".sha256");
        if (stamp.isFile() && e.sha256.equals(read(stamp).trim())) return true;
        boolean ok = e.sha256.equals(hex(digestFile(f, null)));
        if (ok) write(stamp, e.sha256); else f.delete();
        return ok;
    }

    private long fetch(Entry e, File target, long before, Progress progress) throws IOException {
        File part = new File(target.getPath() + ".part");
        if (!target.getParentFile().isDirectory() && !target.getParentFile().mkdirs()) throw new Failure("STORAGE", "Model folder unavailable");
        IOException last = null;
        for (String source : e.urls) {
            if (isCancelled()) throw new Failure("CANCELLED", "Cancelled");
            try {
                download(e, source, part, before, progress);
                if (!part.renameTo(target)) throw new Failure("STORAGE", "Could not store " + e.path);
                write(new File(target.getPath() + ".sha256"), e.sha256);
                return before + target.length();
            } catch (AppNetwork.Blocked blocked) {
                throw new Failure("APP_OFFLINE", "App is offline");
            } catch (Failure f) {
                if ("CANCELLED".equals(f.code) || "APP_OFFLINE".equals(f.code) || "STORAGE".equals(f.code)) throw f;
                last = f;
            } catch (IOException io) {
                if (isCancelled()) throw new Failure("CANCELLED", "Cancelled");
                try { AppNetwork.check(networkEpoch); }
                catch (AppNetwork.Blocked blocked) { throw new Failure("APP_OFFLINE", "App is offline"); }
                last = io;
            }
        }
        throw new Failure("DOWNLOAD", e.path + ": " + (last == null ? "no source" : last.getMessage()));
    }

    private void download(Entry e, String source, File part, long before, Progress progress) throws IOException {
        MessageDigest sha = sha();
        long have = part.isFile() ? part.length() : 0;
        if (e.size > 0 && have > e.size) { part.delete(); have = 0; }
        if (have > 0) digestFile(part, sha);
        if (isCancelled()) throw new Failure("CANCELLED", "Cancelled");
        AppNetwork.check(networkEpoch);
        HttpURLConnection c = opener.open(new URL(source));
        AutoCloseable tracked = AppNetwork.track(c::disconnect);
        current = c;
        try {
            c.setConnectTimeout(20000); c.setReadTimeout(30000);
            c.setInstanceFollowRedirects(true);
            c.setRequestProperty("Accept-Encoding", "identity");
            if (have > 0) c.setRequestProperty("Range", "bytes=" + have + "-");
            int status = c.getResponseCode();
            boolean append = have > 0 && status == 206;
            if (status != 200 && status != 206) throw new Failure("HTTP", source + ": HTTP " + status);
            if (status == 200 && have > 0) { sha = sha(); have = 0; }
            try (InputStream in = c.getInputStream(); OutputStream out = new FileOutputStream(part, append)) {
                byte[] buffer = new byte[CHUNK];
                long written = have, nextReport = 0;
                String host = new URL(source).getHost();
                for (int n; (n = in.read(buffer)) > 0; ) {
                    if (isCancelled()) throw new Failure("CANCELLED", "Cancelled");
                    AppNetwork.check(networkEpoch);
                    if (e.size > 0 && written + n > e.size) throw new Failure("SIZE", source + ": larger than expected");
                    out.write(buffer, 0, n); sha.update(buffer, 0, n); written += n;
                    if (written >= nextReport) { progress.update(before + written, total(), e.path, host); nextReport = written + 512 * 1024; }
                }
            }
            String actual = hex(sha.digest());
            if (!e.sha256.equals(actual)) { part.delete(); throw new Failure("CHECKSUM", source + ": fingerprint " + actual); }
        } finally {
            current = null;
            AppNetwork.release(tracked);
            c.disconnect();
        }
    }

    private static MessageDigest sha() {
        try { return MessageDigest.getInstance("SHA-256"); } catch (Exception e) { throw new IllegalStateException(e); }
    }

    private static byte[] digestFile(File f, MessageDigest into) throws IOException {
        MessageDigest d = into == null ? sha() : into;
        try (InputStream in = new FileInputStream(f)) {
            byte[] buffer = new byte[CHUNK];
            for (int n; (n = in.read(buffer)) > 0; ) d.update(buffer, 0, n);
        }
        return into == null ? d.digest() : null;
    }

    static String hex(byte[] bytes) {
        StringBuilder s = new StringBuilder();
        for (byte b : bytes) s.append(String.format("%02x", b));
        return s.toString();
    }

    private static String read(File f) throws IOException {
        try (InputStream in = new FileInputStream(f)) {
            byte[] all = new byte[(int) Math.min(f.length(), 1 << 20)];
            int off = 0;
            for (int n; off < all.length && (n = in.read(all, off, all.length - off)) > 0; ) off += n;
            return new String(all, 0, off, StandardCharsets.UTF_8);
        }
    }

    private static void write(File f, String text) throws IOException {
        File tmp = new File(f.getPath() + ".tmp");
        try (OutputStream out = new FileOutputStream(tmp)) { out.write(text.getBytes(StandardCharsets.UTF_8)); }
        if (!tmp.renameTo(f)) { tmp.delete(); throw new IOException("Could not write " + f.getName()); }
    }

    private static void deleteTree(File f) {
        File[] children = f.listFiles();
        if (children != null) for (File c : children) deleteTree(c);
        f.delete();
    }
}
