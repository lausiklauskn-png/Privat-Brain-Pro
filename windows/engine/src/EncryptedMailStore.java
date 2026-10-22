package de.familyprojekt.privatebrain.pro;

import java.nio.charset.StandardCharsets;
import java.nio.file.*;
import java.util.ArrayList;
import java.util.List;
import org.json.JSONObject;

/** Windows device store. DPAPI protection and atomic commit precede success. */
final class EncryptedMailStore {
    private final DesktopState state;
    private final Path directory;
    EncryptedMailStore(DesktopState state) throws Exception {
        this.state = state; directory = state.directory.resolve("native-mail-v1");
        DesktopFiles.noLinks(directory); Files.createDirectories(directory);
    }
    private Path file(String name) throws Exception {
        if (name == null || !name.matches("[a-z0-9-]{1,110}")) throw new MailFailure("INVALID_INPUT");
        Path file = directory.resolve(name + ".dat"); DesktopFiles.noLinks(file); return file;
    }
    synchronized JSONObject read(String name) throws Exception {
        Path file = file(name);
        if (!Files.exists(file)) return null;
        if (Files.size(file) > 36L * 1024 * 1024) throw new MailFailure("VAULT_UNAVAILABLE");
        try { return new JSONObject(new String(state.protection.unprotect("mail|" + name, Files.readAllBytes(file)), StandardCharsets.UTF_8)); }
        catch (Exception error) { throw new MailFailure("VAULT_UNAVAILABLE"); }
    }
    synchronized void write(String name, JSONObject value) throws Exception {
        Path file = file(name); byte[] plain = value.toString().getBytes(StandardCharsets.UTF_8);
        if (plain.length > 24L * 1024 * 1024) throw new MailFailure("MESSAGE_TOO_LARGE");
        long used = 0;
        try (DirectoryStream<Path> files = Files.newDirectoryStream(directory)) {
            for (Path p : files) { DesktopFiles.noLinks(p); used += Files.size(p); }
        }
        if (used + plain.length + 65536 > 256L * 1024 * 1024) throw new MailFailure("VAULT_UNAVAILABLE");
        byte[] sealed;
        try { sealed = state.protection.protect("mail|" + name, plain); }
        finally { java.util.Arrays.fill(plain, (byte)0); }
        DesktopFiles.atomic(file, sealed);
    }
    synchronized List<String> names(String prefix) throws Exception {
        List<String> names = new ArrayList<>();
        try (DirectoryStream<Path> files = Files.newDirectoryStream(directory, "*.dat")) {
            for (Path p : files) {
                DesktopFiles.noLinks(p);
                String name = p.getFileName().toString().replaceFirst("\\.dat$", "");
                if (name.startsWith(prefix)) names.add(name);
            }
        }
        return names;
    }
    synchronized void remove(String name) throws Exception { Files.deleteIfExists(file(name)); }
}
