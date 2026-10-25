package de.familyprojekt.privatebrain.pro;

import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.Map;
import java.net.URI;

/** Fixed repository and canonical versions. An installation may graduate to stable. */
final class UpdatePolicy {
    static final String REPOSITORY = "lausiklauskn-png/Privat-Brain-Pro";
    private static final String NUMBER = "(0|[1-9][0-9]{0,8})";
    private static final Pattern TAG = Pattern.compile("^v" + NUMBER + "\\." + NUMBER + "\\." + NUMBER + "(?:-preview\\." + NUMBER + ")?$");

    static long[] version(String tag, boolean allowPreview) {
        if (tag == null) return null;
        Matcher match = TAG.matcher(tag);
        if (!match.matches() || match.group(4) != null && !allowPreview) return null;
        return new long[] {Long.parseLong(match.group(1)), Long.parseLong(match.group(2)),
            Long.parseLong(match.group(3)), match.group(4) == null ? 1 : 0,
            match.group(4) == null ? 0 : Long.parseLong(match.group(4))};
    }

    static boolean newer(String candidate, String installed, boolean allowPreview) {
        long[] next = version(candidate, allowPreview), current = version(installed, allowPreview);
        if (next == null || current == null) return false;
        // Once the installation is stable, never offer a preview, even of a higher core version.
        if (current[3] == 1 && next[3] == 0) return false;
        for (int i = 0; i < next.length; i++) {
            if (next[i] != current[i]) return next[i] > current[i];
        }
        return false;
    }

    static boolean releaseAllowed(String tag, boolean prerelease, boolean allowPreview) {
        long[] parsed = version(tag, allowPreview);
        return parsed != null && prerelease == (parsed[3] == 0);
    }

    static boolean assetRedirectAllowed(String value) {
        try {
            URI uri = new URI(value);
            return "https".equals(uri.getScheme()) && uri.getRawUserInfo() == null && uri.getRawFragment() == null &&
                (uri.getPort() == -1 || uri.getPort() == 443) &&
                ("release-assets.githubusercontent.com".equals(uri.getHost()) || "objects.githubusercontent.com".equals(uri.getHost()));
        } catch (Exception error) { return false; }
    }

    /** Stable Android publications need a matching installation identity, not just a SemVer tag. */
    static boolean releaseIdentity(Map<String, ?> identity, String tag, String appId,
            String certificate, long installedCode, String apkName) {
        String channel = "de.familyprojekt.privatebrain.pro.preview".equals(appId) ? "public" :
            "de.familyprojekt.privatebrain.pro".equals(appId) ? "stable" : "";
        Object schema = identity.get("schema"), code = identity.get("versionCode");
        if (channel.isEmpty() || !(schema instanceof Integer || schema instanceof Long) || ((Number)schema).longValue() != 1 ||
                !(code instanceof Integer || code instanceof Long)) return false;
        long nextCode = ((Number)code).longValue();
        return version(tag, false) != null && nextCode > installedCode && nextCode <= 2147483647L &&
            channel.equals(identity.get("channel")) && appId.equals(identity.get("applicationId")) &&
            certificate != null && certificate.matches("[a-f0-9]{64}") && certificate.equals(identity.get("certificateSha256")) &&
            tag.equals(identity.get("tag")) && tag.substring(1).equals(identity.get("versionName")) &&
            ("Private-Brain-Pro-" + tag.substring(1) + ".apk").equals(apkName) && apkName.equals(identity.get("apk")) &&
            identity.get("sourceCommit") instanceof String && ((String)identity.get("sourceCommit")).matches("[a-f0-9]{40}") &&
            identity.get("apkSha256") instanceof String && ((String)identity.get("apkSha256")).matches("[a-f0-9]{64}");
    }

    static String downloadUrl(String tag, String filename, boolean allowPreview) {
        if (version(tag, allowPreview) == null || !(filename.equals("Private-Brain-Pro.apk") ||
                filename.equals("Private-Brain-Pro-" + tag.substring(1) + ".apk"))) {
            throw new IllegalArgumentException("Unsupported release asset");
        }
        return "https://github.com/" + REPOSITORY + "/releases/download/" + tag + "/" + filename;
    }
}
