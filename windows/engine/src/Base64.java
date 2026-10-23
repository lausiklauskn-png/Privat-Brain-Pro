package de.familyprojekt.privatebrain.pro;

/** Portable encoding at the platform boundary; no Android runtime dependency. */
final class Base64 {
    static final int DEFAULT = 0, NO_WRAP = 2;
    static String encodeToString(byte[] bytes, int flags) {
        return java.util.Base64.getEncoder().encodeToString(bytes);
    }
    static byte[] decode(String text, int flags) {
        return (flags == DEFAULT ? java.util.Base64.getMimeDecoder() : java.util.Base64.getDecoder()).decode(text);
    }
}
