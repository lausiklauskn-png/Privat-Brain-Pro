package de.familyprojekt.privatebrain.pro;

import java.io.IOException;
import java.nio.ByteBuffer;
import java.nio.channels.FileChannel;
import java.nio.file.*;
import java.nio.file.attribute.BasicFileAttributes;
import java.util.UUID;

/** Fail closed on links, unavailable folders and incomplete atomic writes. */
final class DesktopFiles {
    static void noLinks(Path path) throws IOException {
        Path absolute = path.toAbsolutePath().normalize(), part = absolute.getRoot();
        for (Path item : absolute) {
            part = part.resolve(item);
            if (!Files.exists(part, LinkOption.NOFOLLOW_LINKS)) continue;
            BasicFileAttributes a = Files.readAttributes(part, BasicFileAttributes.class, LinkOption.NOFOLLOW_LINKS);
            if (a.isSymbolicLink() || a.isOther()) throw new IOException("VAULT_FOLDER_UNAVAILABLE");
        }
    }
    static Path inside(Path root, String value) throws IOException {
        Path path = Path.of(value).toAbsolutePath().normalize();
        if (!path.startsWith(root.toAbsolutePath().normalize())) throw new IOException("INVALID_INPUT");
        noLinks(path);
        return path;
    }
    static void atomic(Path target, byte[] bytes) throws IOException {
        noLinks(target);
        Path temp = target.resolveSibling(".pb-pending-" + UUID.randomUUID());
        try {
            try (FileChannel out = FileChannel.open(temp, StandardOpenOption.CREATE_NEW, StandardOpenOption.WRITE)) {
                ByteBuffer buffer = ByteBuffer.wrap(bytes);
                while (buffer.hasRemaining()) out.write(buffer);
                out.force(true);
            }
            Files.move(temp, target, StandardCopyOption.ATOMIC_MOVE, StandardCopyOption.REPLACE_EXISTING);
        } finally { Files.deleteIfExists(temp); }
    }
}
