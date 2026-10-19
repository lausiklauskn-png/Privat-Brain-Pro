package de.familyprojekt.privatebrain.pro;

import java.util.regex.Matcher;
import java.util.regex.Pattern;

/** Fixed repository, separate installation channels, canonical numeric versions. */
final class UpdatePolicy {
    static final String REPOSITORY = "lausiklauskn-png/Privat-Brain-Pro";
    private static final String NUMBER = "(0|[1-9][0-9]{0,8})";
    private static final Pattern TAG = Pattern.compile("^v" + NUMBER + "\\." + NUMBER + "\\." + NUMBER + "(?:-preview\\." + NUMBER + ")?$");

    static long[] version(String tag, boolean preview) {
        Matcher match = TAG.matcher(tag);
        if (!match.matches() || (match.group(4) != null) != preview) return null;
        return new long[] {Long.parseLong(match.group(1)), Long.parseLong(match.group(2)),
            Long.parseLong(match.group(3)), preview ? Long.parseLong(match.group(4)) : 0};
    }

    static boolean newer(String candidate, String installed, boolean preview) {
        long[] next = version(candidate, preview), current = version(installed, preview);
        if (next == null || current == null) return false;
        for (int i = 0; i < next.length; i++) {
            if (next[i] != current[i]) return next[i] > current[i];
        }
        return false;
    }

    static String downloadUrl(String tag, String filename, boolean preview) {
        if (version(tag, preview) == null || !(filename.equals("Private-Brain-Pro.apk") ||
                filename.equals("Private-Brain-Pro-" + tag.substring(1) + ".apk"))) {
            throw new IllegalArgumentException("Unsupported release asset");
        }
        return "https://github.com/" + REPOSITORY + "/releases/download/" + tag + "/" + filename;
    }
}
