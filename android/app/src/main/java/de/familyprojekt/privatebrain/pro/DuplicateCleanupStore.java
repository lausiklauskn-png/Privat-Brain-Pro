package de.familyprojekt.privatebrain.pro;

import android.content.ContentResolver;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.database.Cursor;
import android.net.Uri;
import android.os.Process;
import android.provider.DocumentsContract;
import java.io.IOException;
import java.io.InputStream;
import java.security.MessageDigest;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicBoolean;
import org.json.JSONArray;
import org.json.JSONObject;

/** A fresh, explicitly writable SAF selection. Never operates on catalog paths or app originals. */
final class DuplicateCleanupStore {
    static final long MAX_FILE = 80L * 1024 * 1024;
    static final long MAX_BATCH = 512L * 1024 * 1024;
    static final int MAX_FILES = 2000, MAX_DEPTH = 8, MAX_DOCUMENTS = 4000;
    private static final int CHUNK = 256 * 1024;
    private static final String[] COLUMNS = {
        DocumentsContract.Document.COLUMN_DOCUMENT_ID,
        DocumentsContract.Document.COLUMN_DISPLAY_NAME,
        DocumentsContract.Document.COLUMN_MIME_TYPE,
        DocumentsContract.Document.COLUMN_SIZE,
        DocumentsContract.Document.COLUMN_FLAGS,
        DocumentsContract.Document.COLUMN_LAST_MODIFIED
    };
    private final Context context;
    private final ContentResolver resolver;
    private final Object lifecycle = new Object(), streamLock = new Object();
    private final AtomicBoolean running = new AtomicBoolean(), cancelled = new AtomicBoolean();
    private volatile boolean prepared;
    private volatile InputStream activeInput;
    private volatile String phase = "idle";
    private volatile int scannedFiles, skippedFiles, skippedFolders, deletedFiles;
    private volatile long scannedBytes, readBytes;
    private volatile Session session;

    private static final class Session {
        final String id = UUID.randomUUID().toString();
        final Uri tree, root;
        final Map<String, Entry> entries = new LinkedHashMap<>();
        final Map<String, List<Entry>> groups = new LinkedHashMap<>();
        Session(Uri selected) {
            tree = selected;
            root = DocumentsContract.buildDocumentUriUsingTree(tree, DocumentsContract.getTreeDocumentId(tree));
        }
    }
    private static final class Entry {
        final String id = UUID.randomUUID().toString(), name, path, hash;
        final Uri uri;
        final long size, modified;
        final boolean deletable;
        boolean deleted;
        Entry(Uri uri, String name, String path, long size, long modified, String hash, boolean deletable) {
            this.uri = uri; this.name = name; this.path = path;
            this.size = size; this.modified = modified; this.hash = hash; this.deletable = deletable;
        }
        JSONObject json() throws Exception {
            return new JSONObject().put("id", id).put("name", name).put("path", path)
                .put("size", size).put("deletable", deletable);
        }
    }
    private static final class Metadata {
        final String documentId, name, type;
        final long size, flags, modified;
        Metadata(Cursor c) {
            documentId = c.getString(0); name = c.getString(1); type = c.getString(2);
            size = c.isNull(3) ? -1 : c.getLong(3); flags = c.isNull(4) ? 0 : c.getLong(4);
            modified = c.isNull(5) ? -1 : c.getLong(5);
        }
        boolean directory() { return DocumentsContract.Document.MIME_TYPE_DIR.equals(type); }
        boolean deletable() { return (flags & DocumentsContract.Document.FLAG_SUPPORTS_DELETE) != 0; }
    }
    private static final class ScanLimit extends IOException { ScanLimit() { super("SCAN_LIMIT"); } }
    private static final class Cancelled extends IOException { Cancelled() { super("CANCELLED"); } }

    DuplicateCleanupStore(Context context) { this.context = context; resolver = context.getContentResolver(); }

    // Reserve before opening the picker or queueing work, so an early cancel stays latched.
    void prepareWork() throws IOException {
        synchronized (lifecycle) {
            if (running.get() || prepared) throw new IOException("CLEANUP_BUSY");
            cancelled.set(false); prepared = true; phase = "pending";
        }
    }
    void abandonWork() {
        synchronized (lifecycle) { if (!running.get()) { prepared = false; phase = "idle"; } }
    }
    private void begin(String nextPhase) throws IOException {
        synchronized (lifecycle) {
            if (running.get()) throw new IOException("CLEANUP_BUSY");
            if (!prepared) cancelled.set(false);
            prepared = false; running.set(true); phase = nextPhase;
            scannedFiles = 0; skippedFiles = 0; skippedFolders = 0; scannedBytes = 0; readBytes = 0; deletedFiles = 0;
        }
    }
    private void finish() { synchronized (lifecycle) { running.set(false); phase = "idle"; } }
    void cancel() {
        synchronized (lifecycle) { if (!running.get() && !prepared) return; cancelled.set(true); }
        synchronized (streamLock) {
            InputStream input = activeInput;
            if (input != null) try { input.close(); } catch (IOException ignored) {}
        }
    }
    JSONObject progress() throws Exception {
        return new JSONObject().put("running", running.get() || prepared).put("phase", phase)
            .put("scannedFiles", scannedFiles).put("scannedBytes", scannedBytes)
            .put("skippedFiles", skippedFiles).put("skippedFolders", skippedFolders).put("deletedFiles", deletedFiles)
            .put("cancelled", cancelled.get());
    }
    private void checkCancelled() throws Cancelled { if (cancelled.get()) throw new Cancelled(); }
    private void permission(Uri tree) throws IOException {
        if (tree == null || !"content".equals(tree.getScheme()) || !DocumentsContract.isTreeUri(tree)
            || context.checkUriPermission(tree, Process.myPid(), Process.myUid(),
                Intent.FLAG_GRANT_READ_URI_PERMISSION | Intent.FLAG_GRANT_WRITE_URI_PERMISSION)
                != PackageManager.PERMISSION_GRANTED) throw new IOException("FOLDER_WRITE_PERMISSION_REQUIRED");
    }
    private Metadata metadata(Uri uri) throws Exception {
        try (Cursor c = resolver.query(uri, COLUMNS, null, null, null)) {
            if (c == null || !c.moveToFirst()) throw new IOException("FILE_MISSING");
            return new Metadata(c);
        }
    }
    private static String safeName(String name) throws IOException {
        if (name == null || name.length() > 1024 || name.contains("/") || name.contains("\\")
            || name.equals(".") || name.equals("..")) throw new IOException("INVALID_DOCUMENT_NAME");
        return name;
    }
    private void inside(Session selected, Uri document) throws Exception {
        if (!DocumentsContract.isChildDocument(resolver, selected.root, document))
            throw new IOException("DOCUMENT_OUTSIDE_SELECTED_FOLDER");
    }
    private String digest(Uri document, long expectedSize, boolean scanBudget) throws Exception {
        checkCancelled();
        if (expectedSize < 0 || expectedSize > MAX_FILE) throw new IOException("FILE_SIZE_LIMIT");
        MessageDigest digest = MessageDigest.getInstance("SHA-256");
        InputStream input = resolver.openInputStream(document);
        if (input == null) throw new IOException("FILE_UNREADABLE");
        try {
            synchronized (streamLock) { checkCancelled(); activeInput = input; }
            byte[] bytes = new byte[CHUNK]; long total = 0; int count;
            while (true) {
                checkCancelled();
                int allowance = (int) Math.min(bytes.length, expectedSize - total + 1);
                count = input.read(bytes, 0, allowance);
                if (count == -1) break;
                if (count == 0) {
                    int single = input.read();
                    if (single == -1) break;
                    bytes[0] = (byte) single; count = 1;
                }
                total += count;
                if (scanBudget) { readBytes += count; if (readBytes > MAX_BATCH) throw new ScanLimit(); }
                if (total > expectedSize) throw new IOException("FILE_CHANGED");
                digest.update(bytes, 0, count);
            }
            checkCancelled();
            if (total != expectedSize) throw new IOException("FILE_CHANGED");
            StringBuilder hash = new StringBuilder();
            for (byte b : digest.digest()) hash.append(String.format(Locale.ROOT, "%02x", b & 255));
            return hash.toString();
        } finally {
            synchronized (streamLock) { if (activeInput == input) activeInput = null; }
            try { input.close(); } catch (IOException ignored) {}
        }
    }
    private static String reason(Exception error) {
        if (error instanceof SecurityException) return "FOLDER_PERMISSION_LOST";
        String message = error.getMessage();
        return message != null && message.matches("[A-Z_]{3,80}") ? message : "FILE_OPERATION_FAILED";
    }
    private static void error(JSONArray errors, String path, Exception error) throws Exception {
        if (errors.length() < 50) errors.put(new JSONObject().put("path", path).put("message", reason(error)));
    }

    JSONObject scan(Uri tree) throws Exception {
        begin("scan"); session = null;
        Session selected = null; JSONArray errors = new JSONArray(); boolean partial = false;
        try {
            permission(tree); selected = new Session(tree);
            Metadata root = metadata(selected.root);
            if (!root.directory()) throw new IOException("FOLDER_REQUIRED");
            String name = safeName(root.name);
            Set<String> seenDocuments = new HashSet<>(), seenUris = new HashSet<>();
            seenDocuments.add(DocumentsContract.getTreeDocumentId(tree));
            int[] visitedFiles = {0}, visitedDocuments = {0};
            try {
                walk(selected, DocumentsContract.getTreeDocumentId(tree), name, 0,
                    seenDocuments, seenUris, visitedFiles, visitedDocuments, errors);
            } catch (Cancelled ignored) {
                // A cancelled scan cannot authorize a later destructive operation.
            } catch (ScanLimit limit) {
                partial = true; error(errors, name, limit);
            }
            partial |= skippedFiles > 0 || skippedFolders > 0 || errors.length() > 0;
            JSONArray groups = new JSONArray();
            if (!cancelled.get()) {
                for (Map.Entry<String, List<Entry>> group : selected.groups.entrySet()) {
                    if (group.getValue().size() < 2) continue;
                    JSONArray copies = new JSONArray();
                    for (Entry entry : group.getValue()) { selected.entries.put(entry.id, entry); copies.put(entry.json()); }
                    groups.put(new JSONObject().put("hash", group.getKey())
                        .put("size", group.getValue().get(0).size).put("copies", copies));
                }
                session = selected;
            }
            return new JSONObject().put("session", cancelled.get() ? "" : selected.id)
                .put("name", name).put("groups", groups).put("scannedFiles", scannedFiles)
                .put("scannedBytes", scannedBytes).put("skippedFiles", skippedFiles).put("skippedFolders", skippedFolders)
                .put("errors", errors).put("partial", partial || cancelled.get()).put("cancelled", cancelled.get());
        } finally { finish(); }
    }
    private void walk(Session selected, String parent, String path, int depth,
            Set<String> seenDocuments, Set<String> seenUris, int[] visitedFiles,
            int[] visitedDocuments, JSONArray errors) throws Exception {
        checkCancelled();
        if (depth > MAX_DEPTH) { skippedFolders++; error(errors, path, new IOException("FOLDER_DEPTH_LIMIT")); return; }
        Uri children = DocumentsContract.buildChildDocumentsUriUsingTree(selected.tree, parent);
        try (Cursor c = resolver.query(children, COLUMNS, null, null, null)) {
            if (c == null) throw new IOException("FOLDER_UNREADABLE");
            while (c.moveToNext()) {
                checkCancelled();
                if (++visitedDocuments[0] > MAX_DOCUMENTS) throw new ScanLimit();
                Metadata item = new Metadata(c);
                if (item.documentId == null) { skippedFiles++; error(errors, path, new IOException("INVALID_DOCUMENT_ID")); continue; }
                if (!seenDocuments.add(item.documentId)) continue;
                Uri uri = DocumentsContract.buildDocumentUriUsingTree(selected.tree, item.documentId);
                if (!seenUris.add(uri.normalizeScheme().toString())) continue;
                String childPath = path;
                try {
                    childPath = path + "/" + safeName(item.name);
                    inside(selected, uri);
                    if (item.directory()) {
                        walk(selected, item.documentId, childPath, depth + 1, seenDocuments,
                            seenUris, visitedFiles, visitedDocuments, errors);
                        continue;
                    }
                    if (++visitedFiles[0] > MAX_FILES) throw new ScanLimit();
                    if (item.size < 0 || item.size > MAX_FILE) throw new IOException("FILE_SIZE_LIMIT");
                    if (readBytes + item.size > MAX_BATCH) throw new ScanLimit();
                    String hash = digest(uri, item.size, true);
                    // Providers may report metadata that changes during a read.
                    Metadata after = metadata(uri);
                    if (after.directory() || after.size != item.size || !item.name.equals(after.name)
                        || !item.documentId.equals(after.documentId)
                        || (item.modified > 0 && after.modified != item.modified))
                        throw new IOException("FILE_CHANGED");
                    Entry entry = new Entry(uri, item.name, childPath, item.size, after.modified, hash, after.deletable());
                    selected.groups.computeIfAbsent(hash, ignored -> new ArrayList<>()).add(entry);
                    scannedFiles++; scannedBytes += item.size;
                } catch (Cancelled | ScanLimit stop) { throw stop; }
                catch (Exception failure) {
                    if (cancelled.get()) throw new Cancelled();
                    if (item.directory()) skippedFolders++; else skippedFiles++;
                    error(errors, childPath, failure);
                }
            }
        } catch (Cancelled | ScanLimit stop) { throw stop; }
        catch (Exception failure) {
            if (cancelled.get()) throw new Cancelled();
            skippedFolders++; error(errors, path, failure);
        }
    }
    private void verifyMetadata(Session selected, Entry entry, boolean deleting) throws Exception {
        checkCancelled(); permission(selected.tree); inside(selected, entry.uri);
        Metadata current = metadata(entry.uri);
        if (entry.deleted || current.directory() || current.size != entry.size || !entry.name.equals(current.name)
            || !DocumentsContract.getDocumentId(entry.uri).equals(current.documentId)
            || (entry.modified > 0 && current.modified != entry.modified)) throw new IOException("FILE_CHANGED");
        if (deleting && !current.deletable()) throw new IOException("FILE_DELETE_NOT_SUPPORTED");
    }
    private void verify(Session selected, Entry entry, boolean deleting) throws Exception {
        verifyMetadata(selected, entry, deleting);
        if (!entry.hash.equals(digest(entry.uri, entry.size, false))) throw new IOException("FILE_CHANGED");
        verifyMetadata(selected, entry, deleting);
    }

    JSONObject delete(String sessionId, List<String> requested) throws Exception {
        begin("delete");
        JSONArray deleted = new JSONArray(), failures = new JSONArray(); long deletedBytes = 0;
        try {
            checkCancelled();
            Session selected = session;
            if (selected == null || !selected.id.equals(sessionId)) throw new IOException("STALE_CLEANUP_SESSION");
            permission(selected.tree);
            if (requested == null || requested.isEmpty() || requested.size() > MAX_FILES) throw new IOException("INVALID_SELECTION");
            LinkedHashSet<String> ids = new LinkedHashSet<>(requested);
            if (ids.size() != requested.size()) throw new IOException("INVALID_SELECTION");
            Map<String, List<Entry>> affected = new LinkedHashMap<>();
            for (String id : ids) {
                Entry entry = selected.entries.get(id);
                if (entry == null || entry.deleted) throw new IOException("UNKNOWN_COPY_ID");
                affected.computeIfAbsent(entry.hash, ignored -> new ArrayList<>()).add(entry);
            }
            Map<String, Entry> keepers = new LinkedHashMap<>();
            // The entire batch is checked before the first physical deletion.
            for (Map.Entry<String, List<Entry>> group : affected.entrySet()) {
                List<Entry> retained = new ArrayList<>();
                for (Entry entry : selected.groups.get(group.getKey()))
                    if (!entry.deleted && !ids.contains(entry.id)) retained.add(entry);
                if (retained.isEmpty()) throw new IOException("KEEP_ONE_VERIFIED_COPY");
                for (Entry entry : group.getValue()) verify(selected, entry, true);
                Entry keeper = null;
                for (Entry candidate : retained) {
                    try { verify(selected, candidate, false); keeper = candidate; break; }
                    catch (Exception failure) { if (cancelled.get()) throw new Cancelled(); }
                }
                if (keeper == null) throw new IOException("KEEPER_NOT_VERIFIED");
                keepers.put(group.getKey(), keeper);
            }
            for (String id : ids) {
                Entry entry = selected.entries.get(id);
                try {
                    checkCancelled();
                    // Check the retained bytes immediately before every deletion, including after a partial failure.
                    Entry keeper = keepers.get(entry.hash);
                    verify(selected, keeper, false);
                    // Hash the candidate last, then check both snapshots again. SAF providers do not
                    // offer an atomic compare-and-delete operation; reject observable concurrent edits.
                    verify(selected, entry, true);
                    verifyMetadata(selected, keeper, false);
                    verifyMetadata(selected, entry, true);
                    checkCancelled();
                    if (!DocumentsContract.deleteDocument(resolver, entry.uri)) throw new IOException("DELETE_NOT_CONFIRMED");
                    entry.deleted = true; deletedFiles++; deletedBytes += entry.size; deleted.put(entry.json());
                } catch (Exception failure) {
                    failures.put(new JSONObject().put("id", entry.id).put("message", cancelled.get() ? "CANCELLED" : reason(failure)));
                }
            }
            return new JSONObject().put("deleted", deleted).put("failures", failures).put("deletedBytes", deletedBytes)
                .put("partial", failures.length() > 0).put("cancelled", cancelled.get());
        } catch (Cancelled stopped) {
            return new JSONObject().put("deleted", deleted).put("failures", failures).put("deletedBytes", deletedBytes)
                .put("partial", true).put("cancelled", true);
        } finally { finish(); }
    }
}
