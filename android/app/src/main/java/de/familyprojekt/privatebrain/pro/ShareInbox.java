package de.familyprojekt.privatebrain.pro;

import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.io.FileOutputStream;
import java.io.RandomAccessFile;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Files shared into the app from another app (Klaus 2026-10-21: Private Brain Pro should appear
 * in Android's share list). Each file is copied once into a private folder, read by the page in
 * chunks and deleted when the page has taken it. No network, no file paths from outside.
 */
final class ShareInbox {
    static final long MAX_FILE = 200L * 1024 * 1024;   // one shared file
    static final int MAX_FILES = 30;                    // one share
    static final int CHUNK = 256 * 1024;

    static final class Item {
        final String id, name, mime; final long size;
        Item(String id, String name, String mime, long size) { this.id = id; this.name = name; this.mime = mime; this.size = size; }
    }

    private final File dir;
    private final long maxFile;
    private final Map<String, Item> items = new LinkedHashMap<>();

    ShareInbox(File dir) { this(dir, MAX_FILE); }
    ShareInbox(File dir, long maxFile) { this.dir = dir; this.maxFile = maxFile; }

    /** A file name without folders or control characters, never empty, at most 120 characters. */
    static String safeName(String raw, String fallback) {
        String name = raw == null ? "" : raw;
        int slash = Math.max(name.lastIndexOf('/'), name.lastIndexOf('\\'));
        if (slash >= 0) name = name.substring(slash + 1);
        name = name.replaceAll("[\\p{Cntrl}<>:\"|?*]", "").trim();
        while (name.startsWith(".")) name = name.substring(1);
        if (name.isEmpty()) name = fallback;
        return PortableNames.safe(name,120,200);
    }

    static String safeMime(String raw) {
        if (raw == null || !raw.matches("[a-zA-Z0-9.+-]{1,60}/[a-zA-Z0-9.+*-]{1,80}")) return "application/octet-stream";
        return raw.toLowerCase(java.util.Locale.ROOT);
    }

    synchronized int count() { return items.size(); }

    /** Copies one stream; refuses files above the limit and shares above MAX_FILES. */
    Item add(InputStream in, String name, String mime) throws IOException {
        synchronized (this) { if (items.size() >= MAX_FILES) throw new IOException("too many"); }
        if (!dir.isDirectory() && !dir.mkdirs()) throw new IOException("no folder");
        String id = UUID.randomUUID().toString();
        File target = new File(dir, id);
        long total = 0;
        try (InputStream source = in; OutputStream out = new FileOutputStream(target)) {
            byte[] buffer = new byte[64 * 1024];
            for (int n; (n = source.read(buffer)) > 0; ) {
                total += n;
                if (total > maxFile) throw new IOException("too large");
                out.write(buffer, 0, n);
            }
        } catch (IOException error) { target.delete(); throw error; }
        Item item = new Item(id, safeName(name, "Geteilte Datei"), safeMime(mime), total);
        synchronized (this) { items.put(id, item); }
        return item;
    }

    synchronized List<Item> list() { return new ArrayList<>(items.values()); }

    /** At most CHUNK bytes from offset; an empty array means the end. */
    byte[] read(String id, long offset) throws IOException {
        synchronized (this) { if (!items.containsKey(id)) throw new IOException("unknown"); }
        if (offset < 0) throw new IOException("offset");
        try (RandomAccessFile file = new RandomAccessFile(new File(dir, id), "r")) {
            if (offset >= file.length()) return new byte[0];
            byte[] out = new byte[(int) Math.min(CHUNK, file.length() - offset)];
            file.seek(offset); file.readFully(out); return out;
        }
    }

    synchronized void remove(String id) { if (items.remove(id) != null) new File(dir, id).delete(); }

    /** Leftovers from an earlier run are removed; the page never saw them. */
    synchronized void clear() {
        items.clear();
        File[] old = dir.listFiles();
        if (old != null) for (File f : old) f.delete();
    }
}
