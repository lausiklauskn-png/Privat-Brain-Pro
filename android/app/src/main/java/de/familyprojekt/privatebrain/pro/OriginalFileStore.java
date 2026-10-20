package de.familyprojekt.privatebrain.pro;

import android.content.Context;
import java.io.*;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.*;
import org.json.JSONArray;
import org.json.JSONObject;

/** App-private, content-addressed originals. Publish only verified complete imports. */
final class OriginalFileStore {
    static final int CHUNK = 256 * 1024;
    private static final long MAX_FILE = 256L * 1024 * 1024, QUOTA = 2L * 1024 * 1024 * 1024;
    private final File root;
    private final Map<String, Pending> pending = new HashMap<>();
    private static final class Pending {
        File directory; String hash; long size, written; JSONObject metadata;
    }
    OriginalFileStore(Context context) { root = new File(context.getFilesDir(), "originals-v1"); }
    static void hash(String value) throws IOException {
        if (value == null || !value.matches("[a-f0-9]{64}")) throw new IOException("INVALID_HASH");
    }
    private File directory(String hash) throws IOException { hash(hash); return new File(root, hash); }
    synchronized JSONObject info(String hash) throws Exception {
        File directory = directory(hash), data = new File(directory, "data");
        if (!data.isFile() || !new File(directory, "metadata.json").isFile()) return null;
        File metadataFile = new File(directory, "metadata.json");
        if (metadataFile.length() <= 0 || metadataFile.length() > 8192) throw new IOException("ORIGINAL_UNAVAILABLE");
        byte[] bytes = new byte[(int)metadataFile.length()];
        try (DataInputStream input = new DataInputStream(new FileInputStream(metadataFile))) {
            input.readFully(bytes);
        }
        JSONObject metadata = new JSONObject(new String(bytes, StandardCharsets.UTF_8));
        if (!hash.equals(metadata.getString("hash")) || metadata.getLong("size") != data.length()) throw new IOException("ORIGINAL_UNAVAILABLE");
        return metadata;
    }
    synchronized JSONArray list() throws Exception {
        JSONArray items = new JSONArray(); File[] directories = root.listFiles();
        if (directories != null) for (File directory : directories)
            if (directory.getName().matches("[a-f0-9]{64}")) {
                try { if (info(directory.getName()) != null) items.put(directory.getName()); }
                catch (Exception ignored) { /* Broken copy is reported when selected; never delete it. */ }
            }
        return items;
    }
    private static long used(File directory) {
        long total = 0; File[] children = directory.listFiles();
        if (children != null) for (File child : children) total += child.isDirectory() ? used(child) : child.length();
        return total;
    }
    synchronized JSONObject begin(String hash, long size, String name, String type) throws Exception {
        hash(hash);
        if (size < 0 || size > MAX_FILE || name == null || name.length() > 1024 || type == null || type.length() > 256)
            throw new IOException("ORIGINAL_LIMIT");
        JSONObject existing = info(hash);
        if (existing != null) {
            if (existing.getLong("size") != size || !digest(file(hash)).equals(hash)) throw new IOException("ORIGINAL_UNAVAILABLE");
            return new JSONObject().put("stored", true);
        }
        if (!root.isDirectory() && !root.mkdirs()) throw new IOException("ORIGINAL_UNAVAILABLE");
        long reserved = 0; for (Pending item : pending.values()) reserved += item.size - item.written;
        if (pending.size() >= 2 || used(root) + reserved + size > QUOTA || root.getUsableSpace() < size + 16 * 1024 * 1024)
            throw new IOException("ORIGINAL_LIMIT");
        String ticket = UUID.randomUUID().toString();
        Pending item = new Pending(); item.directory = new File(root, ".pending-" + ticket);
        if (!item.directory.mkdir()) throw new IOException("ORIGINAL_UNAVAILABLE");
        item.hash = hash; item.size = size;
        item.metadata = new JSONObject().put("hash", hash).put("size", size).put("name", name).put("type", type);
        try (FileOutputStream output = new FileOutputStream(new File(item.directory, "data"))) { output.getFD().sync(); }
        pending.put(ticket, item);
        return new JSONObject().put("stored", false).put("ticket", ticket);
    }
    private Pending pending(String ticket) throws IOException {
        Pending item = pending.get(ticket); if (item == null) throw new IOException("INVALID_IMPORT"); return item;
    }
    synchronized void append(String ticket, long offset, byte[] bytes) throws Exception {
        Pending item = pending(ticket);
        if (offset != item.written || bytes.length == 0 || bytes.length > CHUNK || offset + bytes.length > item.size)
            throw new IOException("INVALID_IMPORT");
        try (FileOutputStream output = new FileOutputStream(new File(item.directory, "data"), true)) { output.write(bytes); }
        item.written += bytes.length;
    }
    synchronized String finish(String ticket) throws Exception {
        Pending item = pending(ticket);
        File data = new File(item.directory, "data");
        if (item.written != item.size || !digest(data).equals(item.hash)) throw new IOException("ORIGINAL_HASH_MISMATCH");
        try (FileOutputStream output = new FileOutputStream(data, true)) { output.getFD().sync(); }
        try (FileOutputStream output = new FileOutputStream(new File(item.directory, "metadata.json"))) {
            output.write(item.metadata.toString().getBytes(StandardCharsets.UTF_8)); output.getFD().sync();
        }
        File target = directory(item.hash);
        if (target.exists()) throw new IOException("ORIGINAL_UNAVAILABLE");
        if (!item.directory.renameTo(target)) throw new IOException("ORIGINAL_UNAVAILABLE");
        pending.remove(ticket);
        return item.hash;
    }
    synchronized void abort(String ticket) {
        Pending item = pending.remove(ticket); if (item == null) return;
        new File(item.directory, "data").delete(); new File(item.directory, "metadata.json").delete(); item.directory.delete();
    }
    synchronized File file(String hash) throws Exception {
        if (info(hash) == null) throw new IOException("ORIGINAL_MISSING");
        return new File(directory(hash), "data");
    }
    synchronized byte[] read(String hash, long offset) throws Exception {
        File file = file(hash);
        if (offset < 0 || offset > file.length()) throw new IOException("INVALID_IMPORT");
        byte[] bytes = new byte[(int)Math.min(CHUNK, file.length() - offset)];
        try (RandomAccessFile input = new RandomAccessFile(file, "r")) { input.seek(offset); input.readFully(bytes); }
        return bytes;
    }
    static String digest(File file) throws Exception {
        MessageDigest digest = MessageDigest.getInstance("SHA-256"); byte[] buffer = new byte[CHUNK]; int count;
        try (FileInputStream input = new FileInputStream(file)) { while ((count = input.read(buffer)) != -1) digest.update(buffer, 0, count); }
        StringBuilder value = new StringBuilder(); for (byte b : digest.digest()) value.append(String.format(Locale.ROOT, "%02x", b & 255));
        return value.toString();
    }
}
