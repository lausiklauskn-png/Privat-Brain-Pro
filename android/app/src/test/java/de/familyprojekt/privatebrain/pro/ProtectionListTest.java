package de.familyprojekt.privatebrain.pro;

import static org.junit.Assert.assertArrayEquals;
import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertNull;
import static org.junit.Assert.assertTrue;
import static org.junit.Assert.fail;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import org.junit.Test;

public class ProtectionListTest {
    private static final String A = "a".repeat(64), B = "0123456789abcdef".repeat(4), C = "F".repeat(64);
    private static ByteArrayInputStream text(String s) { return new ByteArrayInputStream(s.getBytes(StandardCharsets.UTF_8)); }

    @Test public void hashListsFromTextAndCsvIgnoreCommentsAndNoise() throws Exception {
        ProtectionList.Builder b = new ProtectionList.Builder();
        ProtectionList.readHashes(text("# MalwareBazaar recent\n" + A + "\r\n\"2026-10-20\",\"" + B + "\",\"x.exe\"\n"
            + "not a hash " + "a".repeat(63) + "\n" + "b".repeat(65) + "\n\n" + A.toUpperCase() + "\n"), b);
        long[] list = b.finish();
        assertEquals(2, list.length);
        assertTrue(ProtectionList.contains(list, ProtectionList.fromHex(A)));
        assertTrue(ProtectionList.contains(list, ProtectionList.fromHex(B)));
        assertFalse(ProtectionList.contains(list, ProtectionList.fromHex(C)));
    }

    @Test public void overlongLinesAreSkippedNotSplit() throws Exception {
        ProtectionList.Builder b = new ProtectionList.Builder();
        ProtectionList.readHashes(text("x".repeat(ProtectionList.MAX_LINE + 10) + A + "\n" + B + "\n"), b);
        long[] list = b.finish();
        assertEquals(1, list.length);
        assertTrue(ProtectionList.contains(list, ProtectionList.fromHex(B)));
    }

    @Test public void addressesAreNormalizedBeforeComparison() {
        assertEquals("http://evil.example/a?b=1", ProtectionList.normalizeUrl(" HTTP://Evil.Example:80/a?b=1#frag "));
        assertEquals("https://evil.example/", ProtectionList.normalizeUrl("https://EVIL.example.:443"));
        assertEquals("https://xn--bcher-kva.example/x", ProtectionList.normalizeUrl("https://bücher.example/x"));
        assertEquals("http://198.51.100.7:8080/p", ProtectionList.normalizeUrl("http://198.51.100.7:8080/p"));
        assertEquals("evil.example", ProtectionList.urlHost("https://paypal.com@evil.example/login"));
        assertEquals(ProtectionList.fromHex("8".repeat(64)), 0x8888888888888888L);
        assertNull(ProtectionList.normalizeUrl("javascript:alert(1)"));
        assertNull(ProtectionList.normalizeUrl("ftp://evil.example/"));
        assertNull(ProtectionList.normalizeUrl("https:///nohost"));
    }

    @Test public void linkListsKeepAddressesAndServersButNotSharedPlatforms() throws Exception {
        ProtectionList.Builder urls = new ProtectionList.Builder(), hosts = new ProtectionList.Builder();
        ProtectionList.readUrls(text("# URLhaus\n\"1\",\"2026-10-20\",\"http://evil.example/drop.exe\",\"online\"\n"
            + "https://raw.githubusercontent.com/x/y/z.ps1\n" + "kein link\n"), urls, hosts);
        long[] u = urls.finish(), h = hosts.finish();
        assertEquals(2, u.length);
        assertTrue(ProtectionList.contains(u, ProtectionList.urlKey("http://evil.example/drop.exe")));
        assertTrue(ProtectionList.contains(h, ProtectionList.hostKey("evil.example")));
        assertFalse(ProtectionList.contains(h, ProtectionList.hostKey("raw.githubusercontent.com")));
        assertTrue(ProtectionList.sharedHost("cdn.discordapp.com"));
        assertFalse(ProtectionList.sharedHost("notgithub.com"));
    }

    @Test public void encodedListsRoundTripAndRejectTampering() throws Exception {
        long[] list = ProtectionList.sortUnique(new long[] {5, -3, 5, 9, Long.MIN_VALUE}, 5);
        assertArrayEquals(new long[] {Long.MIN_VALUE, -3, 5, 9}, list);
        byte[] data = ProtectionList.encode(list);
        assertArrayEquals(list, ProtectionList.decode(data));
        byte[] truncated = java.util.Arrays.copyOf(data, data.length - 1);
        byte[] unsorted = data.clone(); unsorted[data.length - 1] = 0; unsorted[data.length - 8] = (byte) 0x80;
        byte[] magic = data.clone(); magic[0] = 'X';
        for (byte[] bad : new byte[][] {truncated, unsorted, magic, new byte[3]}) {
            try { ProtectionList.decode(bad); fail("accepted damaged list"); }
            catch (IOException expected) { assertEquals("VAULT_DAMAGED", expected.getMessage()); }
        }
    }

    @Test public void tooManyEntriesStopInsteadOfExhaustingMemory() throws Exception {
        ProtectionList.Builder b = new ProtectionList.Builder();
        try { for (long i = 0; i <= ProtectionList.MAX_ENTRIES; i++) b.add(i); fail("no limit"); }
        catch (IOException expected) { assertEquals("LIST_TOO_LARGE", expected.getMessage()); }
    }
}
