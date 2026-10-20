package de.familyprojekt.privatebrain.pro;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.net.IDN;
import java.net.URI;
import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.Arrays;
import java.util.Locale;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Compact, sorted protection lists (pure Java, no Android).
 *
 * Every entry is the first 64 bits of a SHA-256: of the file itself for malware lists, of a
 * normalized address for link lists. With a few million entries the chance that an unlisted
 * file matches by accident is below 1 in 10^12; a hit is still reported as "listed", never
 * as a verdict about the file.
 */
final class ProtectionList {
    static final int MAX_ENTRIES = 5_000_000;
    static final int MAX_LINE = 16 * 1024;
    private static final Pattern SHA256 = Pattern.compile("(?<![0-9a-fA-F])[0-9a-fA-F]{64}(?![0-9a-fA-F])");
    private static final Pattern URL = Pattern.compile("(?i)\\bhttps?://[^\\s\"'<>,]+");
    /** Large shared platforms: a malware file there says nothing about the platform itself. */
    private static final String[] SHARED_HOSTS = {"github.com", "raw.githubusercontent.com", "gist.githubusercontent.com",
        "objects.githubusercontent.com", "gitlab.com", "bitbucket.org", "drive.google.com", "docs.google.com",
        "storage.googleapis.com", "dropbox.com", "www.dropbox.com", "dl.dropboxusercontent.com", "onedrive.live.com",
        "1drv.ms", "sharepoint.com", "cdn.discordapp.com", "discord.com", "media.discordapp.net", "mediafire.com",
        "www.mediafire.com", "pastebin.com", "transfer.sh", "t.me", "telegram.org"};

    private ProtectionList() { }

    /** Growable array of entries; sorted and de-duplicated by finish(). */
    static final class Builder {
        private long[] values = new long[1024];
        private int size;
        void add(long value) throws IOException {
            if (size == values.length) {
                if (size >= MAX_ENTRIES) throw new VaultCrypto.Failure("LIST_TOO_LARGE");
                values = Arrays.copyOf(values, Math.min(MAX_ENTRIES, size * 2));
            }
            values[size++] = value;
        }
        void addAll(long[] other) throws IOException { for (long v : other) add(v); }
        int size() { return size; }
        long[] finish() { return sortUnique(values, size); }
    }

    static long[] sortUnique(long[] values, int count) {
        long[] copy = Arrays.copyOf(values, count);
        Arrays.sort(copy);
        int n = 0;
        for (int i = 0; i < copy.length; i++) if (n == 0 || copy[i] != copy[n - 1]) copy[n++] = copy[i];
        return Arrays.copyOf(copy, n);
    }

    static boolean contains(long[] sorted, long value) { return sorted != null && Arrays.binarySearch(sorted, value) >= 0; }

    static long prefix(byte[] digest) { return ByteBuffer.wrap(digest, 0, 8).getLong(); }

    static long fromHex(String hex) {
        if (hex == null || !hex.matches("[0-9a-fA-F]{64}")) throw new IllegalArgumentException("sha256");
        return new java.math.BigInteger(hex.substring(0, 16), 16).longValue(); // Long.parseUnsignedLong needs API 26
    }

    static long key(String text) {
        try { return prefix(MessageDigest.getInstance("SHA-256").digest(text.getBytes(StandardCharsets.UTF_8))); }
        catch (java.security.NoSuchAlgorithmException impossible) { throw new IllegalStateException(impossible); }
    }

    /** Host in lower-case ASCII (IDN to punycode), without trailing dot; null when unusable. */
    static String host(String value) {
        if (value == null) return null;
        String h = value.trim().toLowerCase(Locale.ROOT);
        if (h.startsWith("[") && h.endsWith("]")) h = h.substring(1, h.length() - 1);
        while (h.endsWith(".")) h = h.substring(0, h.length() - 1);
        if (h.isEmpty() || h.length() > 253) return null;
        try { h = IDN.toASCII(h, IDN.ALLOW_UNASSIGNED).toLowerCase(Locale.ROOT); }
        catch (IllegalArgumentException invalid) { return null; }
        return h.isEmpty() ? null : h;
    }

    static boolean sharedHost(String host) {
        if (host == null) return false;
        for (String shared : SHARED_HOSTS) if (host.equals(shared) || host.endsWith("." + shared)) return true;
        return false;
    }

    /**
     * Normalized address for list comparison: scheme and host in lower case, default port and
     * fragment removed, empty path as "/". Path and query keep their exact spelling.
     */
    static String normalizeUrl(String value) {
        if (value == null) return null;
        String v = value.trim();
        if (v.length() > 8192) return null;
        try {
            URI uri = new URI(v);
            String scheme = uri.getScheme() == null ? null : uri.getScheme().toLowerCase(Locale.ROOT);
            if (!"http".equals(scheme) && !"https".equals(scheme)) return null;
            String rawHost = uri.getHost();
            int port = uri.getPort();
            if (rawHost == null && uri.getAuthority() != null) {
                // Non-ASCII host names (e.g. "bücher.example") are not parsed as a host by URI.
                String authority = uri.getAuthority();
                authority = authority.substring(authority.lastIndexOf('@') + 1);
                int colon = authority.lastIndexOf(':');
                if (colon > 0 && !authority.startsWith("[")) {
                    try { port = Integer.parseInt(authority.substring(colon + 1)); } catch (NumberFormatException bad) { return null; }
                    authority = authority.substring(0, colon);
                }
                rawHost = authority;
            }
            String host = host(rawHost);
            if (host == null) return null;
            if (("http".equals(scheme) && port == 80) || ("https".equals(scheme) && port == 443)) port = -1;
            String path = uri.getRawPath() == null || uri.getRawPath().isEmpty() ? "/" : uri.getRawPath();
            String query = uri.getRawQuery() == null ? "" : "?" + uri.getRawQuery();
            return scheme + "://" + (host.contains(":") ? "[" + host + "]" : host) + (port == -1 ? "" : ":" + port) + path + query;
        } catch (java.net.URISyntaxException invalid) { return null; }
    }

    static String urlHost(String value) {
        String normalized = normalizeUrl(value);
        if (normalized == null) return null;
        try { return host(new URI(normalized).getHost()); } catch (java.net.URISyntaxException invalid) { return null; }
    }

    static long urlKey(String normalized) { return key("u:" + normalized); }
    static long hostKey(String host) { return key("h:" + host); }

    /** Reads at most MAX_LINE characters per line; longer lines are skipped, not split. */
    private interface LineSink { void line(String line) throws IOException; }
    private static void lines(InputStream input, LineSink sink) throws IOException {
        BufferedReader reader = new BufferedReader(new InputStreamReader(input, StandardCharsets.UTF_8), 64 * 1024);
        StringBuilder line = new StringBuilder();
        boolean tooLong = false;
        int c;
        while ((c = reader.read()) != -1) {
            if (c == '\n') {
                if (!tooLong) sink.line(line.toString());
                line.setLength(0); tooLong = false;
            } else if (!tooLong) {
                if (line.length() >= MAX_LINE) { tooLong = true; line.setLength(0); }
                else line.append((char) c);
            }
        }
        if (!tooLong && line.length() > 0) sink.line(line.toString());
    }

    private static boolean comment(String line) {
        String t = line.trim();
        return t.isEmpty() || t.startsWith("#") || t.startsWith("//");
    }

    /** Text or CSV with one file fingerprint per line (first SHA-256 in the line). */
    static void readHashes(InputStream input, Builder into) throws IOException {
        lines(input, line -> {
            if (comment(line)) return;
            Matcher m = SHA256.matcher(line);
            if (m.find()) into.add(fromHex(m.group()));
        });
    }

    /** Text or CSV with one address per line (first http/https address in the line). */
    static void readUrls(InputStream input, Builder urls, Builder hosts) throws IOException {
        lines(input, line -> {
            if (comment(line)) return;
            Matcher m = URL.matcher(line);
            if (!m.find()) return;
            String normalized = normalizeUrl(m.group());
            if (normalized == null) return;
            urls.add(urlKey(normalized));
            String host = urlHost(normalized);
            if (host != null && !sharedHost(host)) hosts.add(hostKey(host));
        });
    }

    // ---------- file format: "PBSL1" + count + big-endian entries ----------
    private static final byte[] MAGIC = {'P', 'B', 'S', 'L', '1'};
    static byte[] encode(long[] sorted) {
        ByteBuffer out = ByteBuffer.allocate(MAGIC.length + 4 + sorted.length * 8);
        out.put(MAGIC).putInt(sorted.length);
        for (long v : sorted) out.putLong(v);
        return out.array();
    }
    static long[] decode(byte[] data) throws IOException {
        if (data == null || data.length < MAGIC.length + 4) throw new VaultCrypto.Failure("VAULT_DAMAGED");
        ByteBuffer in = ByteBuffer.wrap(data);
        byte[] magic = new byte[MAGIC.length]; in.get(magic);
        int count = in.getInt();
        if (!Arrays.equals(magic, MAGIC) || count < 0 || count > MAX_ENTRIES || in.remaining() != count * 8L)
            throw new VaultCrypto.Failure("VAULT_DAMAGED");
        long[] values = new long[count];
        long previous = 0;
        for (int i = 0; i < count; i++) {
            values[i] = in.getLong();
            if (i > 0 && values[i] <= previous) throw new VaultCrypto.Failure("VAULT_DAMAGED");
            previous = values[i];
        }
        return values;
    }
}
