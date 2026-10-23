package de.familyprojekt.privatebrain.pro;

import static org.junit.Assert.assertArrayEquals;
import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertTrue;
import static org.junit.Assert.fail;

import java.io.ByteArrayInputStream;
import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import org.junit.Test;

public class ShareInboxTest {
    private static File folder() throws IOException { return Files.createTempDirectory("share-in").toFile(); }

    @Test public void namesLoseFoldersAndControlCharacters() {
        assertEquals("Rechnung.pdf", ShareInbox.safeName("../../data/Rechnung.pdf", "x"));
        assertEquals("Brief.pdf", ShareInbox.safeName("C:\\Users\\k\\Brief.pdf", "x"));
        assertEquals("ab.txt", ShareInbox.safeName("a\u0000b\n.txt", "x"));
        assertEquals("profile", ShareInbox.safeName("..profile", "x"));
        assertEquals("Geteilte Datei", ShareInbox.safeName(null, "Geteilte Datei"));
        String longName = ShareInbox.safeName("x".repeat(300) + ".pdf", "y");
        assertEquals(120, longName.length());
        assertTrue(longName.endsWith(".pdf"));
        String unicode = ShareInbox.safeName("a" + "😀".repeat(100) + ".pdf", "x");
        assertTrue(unicode.endsWith(".pdf"));
        assertTrue(unicode.length() <= 120);
        assertFalse(unicode.codePoints().anyMatch(cp -> cp >= 0xd800 && cp <= 0xdfff));
    }

    @Test public void mimeTypesAreCheckedNotTrusted() {
        assertEquals("application/pdf", ShareInbox.safeMime("application/PDF"));
        assertEquals("application/octet-stream", ShareInbox.safeMime("text/html; charset=x"));
        assertEquals("application/octet-stream", ShareInbox.safeMime(null));
    }

    @Test public void copiesReadsInChunksAndDeletes() throws IOException {
        File dir = folder();
        ShareInbox inbox = new ShareInbox(dir);
        byte[] bytes = new byte[ShareInbox.CHUNK + 1000];
        for (int i = 0; i < bytes.length; i++) bytes[i] = (byte) i;
        ShareInbox.Item item = inbox.add(new ByteArrayInputStream(bytes), "scan.pdf", "application/pdf");
        assertEquals(bytes.length, item.size);
        byte[] first = inbox.read(item.id, 0), second = inbox.read(item.id, first.length);
        assertEquals(ShareInbox.CHUNK, first.length);
        assertEquals(1000, second.length);
        assertEquals(0, inbox.read(item.id, bytes.length).length);
        byte[] joined = new byte[bytes.length];
        System.arraycopy(first, 0, joined, 0, first.length); System.arraycopy(second, 0, joined, first.length, second.length);
        assertArrayEquals(bytes, joined);
        inbox.remove(item.id);
        assertEquals(0, inbox.count());
        assertFalse(new File(dir, item.id).exists());
        try { inbox.read(item.id, 0); fail("removed file must not be readable"); } catch (IOException expected) { }
    }

    @Test public void refusesTooLargeFilesAndLeavesNothingBehind() throws IOException {
        File dir = folder();
        ShareInbox inbox = new ShareInbox(dir, 1000);
        InputStream endless = new ByteArrayInputStream(new byte[1001]);
        try { inbox.add(endless, "huge.bin", "application/octet-stream"); fail("too large"); } catch (IOException expected) { }
        assertEquals(0, inbox.count());
        String[] left = dir.list();
        assertEquals(0, left == null ? 0 : left.length);
    }

    @Test public void unknownIdsAndNegativeOffsetsAreRefused() throws IOException {
        ShareInbox inbox = new ShareInbox(folder());
        ShareInbox.Item item = inbox.add(new ByteArrayInputStream(new byte[]{1, 2, 3}), "a.txt", "text/plain");
        try { inbox.read("../" + item.id, 0); fail("unknown id"); } catch (IOException expected) { }
        try { inbox.read(item.id, -1); fail("negative offset"); } catch (IOException expected) { }
    }
}
