    // Windows filesystem boundary. All format, indexing and commit algorithms
    // below this section are taken from the Android source on every build.
    private static final class Entry { String id, name, mime; long size; }
    private java.nio.file.Path path(String id) throws IOException {
        if (tree == null) throw fail("VAULT_NOT_CONFIGURED");
        return DesktopFiles.inside(java.nio.file.Path.of(tree), id);
    }
    private List<Entry> children(String parent) throws IOException {
        List<Entry> out = new ArrayList<>();
        java.nio.file.Path folder = path(parent);
        try (java.nio.file.DirectoryStream<java.nio.file.Path> stream = java.nio.file.Files.newDirectoryStream(folder)) {
            for (java.nio.file.Path p : stream) {
                DesktopFiles.noLinks(p);
                Entry e = new Entry(); e.id = p.toString(); e.name = p.getFileName().toString();
                e.mime = java.nio.file.Files.isDirectory(p) ? DIR : BINARY;
                e.size = DIR.equals(e.mime) ? 0 : java.nio.file.Files.size(p); out.add(e);
            }
        } catch (IOException error) { throw fail("VAULT_FOLDER_UNAVAILABLE"); }
        return out;
    }
    private Entry child(String parent, String name) throws IOException {
        for (Entry e : children(parent)) if (e.name.equals(name)) return e;
        return null;
    }
    private String create(String parent, String mime, String name) throws IOException {
        if (name.isEmpty() || name.equals(".") || name.equals("..") || name.matches(".*[\\\\/:\u0000].*")) throw fail("INVALID_INPUT");
        java.nio.file.Path target = path(parent).resolve(name);
        DesktopFiles.noLinks(target);
        if (DIR.equals(mime)) java.nio.file.Files.createDirectory(target);
        else java.nio.file.Files.createFile(target);
        return target.toString();
    }
    private void delete(String id) { try { java.nio.file.Files.deleteIfExists(path(id)); } catch (Exception ignored) { } }
    private String dir(String name) throws IOException {
        String known = dirs.get(name);
        if (known != null) { path(known); return known; }
        Entry existing = child(rootId, name);
        if (existing != null && !DIR.equals(existing.mime)) throw fail("VAULT_FOLDER_UNAVAILABLE");
        String id = existing != null ? existing.id : create(rootId, DIR, name);
        dirs.put(name, id); return id;
    }
    private byte[] readSmall(String id, int limit) throws IOException {
        java.nio.file.Path p = path(id);
        if (java.nio.file.Files.size(p) > limit) throw fail("VAULT_DAMAGED");
        try (InputStream input = java.nio.file.Files.newInputStream(p)) {
            byte[] bytes = input.readNBytes(limit + 1);
            if (bytes.length > limit) throw fail("VAULT_DAMAGED");
            return bytes;
        }
    }
    private void writeSmall(String id, byte[] data) throws IOException { DesktopFiles.atomic(path(id), data); }
    private OutputStream openSink(String id) throws IOException {
        return new FileOutputStream(path(id).toFile()) {
            @Override public void close() throws IOException { try { getFD().sync(); } finally { super.close(); } }
        };
    }
    private VaultCrypto.Reader reader(String id, String logical) throws IOException {
        java.nio.channels.FileChannel channel = java.nio.channels.FileChannel.open(path(id), java.nio.file.StandardOpenOption.READ);
        try { return new VaultCrypto.Reader(channel, null, key(), logical); }
        catch (IOException error) { channel.close(); throw error; }
    }

