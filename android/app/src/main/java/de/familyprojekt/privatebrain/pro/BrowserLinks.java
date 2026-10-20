package de.familyprojekt.privatebrain.pro;

import android.app.Activity;
import android.content.Intent;
import android.net.Uri;
import java.net.URI;
import java.util.*;
import org.json.JSONArray;

/** Mail never gains scripts or app-origin privileges. Gesture-bound opaque routes open the browser. */
final class BrowserLinks {
    static final String PREFIX = "/_pb_mail_link/";
    private static final LinkedHashMap<String, String> links = new LinkedHashMap<>();
    static String allowed(String value) {
        try {
            if (value == null || value.length() > 8192 || value.matches("(?s).*[\\x00-\\x20\\x7f].*")) return null;
            URI url = new URI(value);
            if (!"https".equalsIgnoreCase(url.getScheme()) && !"http".equalsIgnoreCase(url.getScheme())) return null;
            String host = url.getHost();
            if (url.getRawUserInfo() != null || host == null || !host.contains(".") || host.contains(":")) return null;
            host = host.toLowerCase(Locale.ROOT);
            if (host.endsWith(".") || host.endsWith(".localhost") || host.endsWith(".local") || host.endsWith(".internal") || host.matches("[0-9.]+")) return null;
            if (url.getPort() != -1 && (url.getPort() < 1 || url.getPort() > 65535)) return null;
            return url.toASCIIString();
        } catch (Exception error) { return null; }
    }
    static synchronized JSONArray prepare(JSONArray urls) throws Exception {
        if (urls.length() > 200) throw new IllegalArgumentException();
        JSONArray result = new JSONArray();
        for (int n = 0; n < urls.length(); n++) {
            String value = allowed(urls.getString(n));
            if (value == null) { result.put(""); continue; }
            String ticket = UUID.randomUUID().toString();links.put(ticket, value);result.put(ticket);
            while (links.size() > 2048) links.remove(links.keySet().iterator().next());
        }
        return result;
    }
    static synchronized String resolve(Uri uri) {
        if (!"https".equals(uri.getScheme()) || !"localhost".equals(uri.getAuthority()) || uri.getQuery() != null || uri.getFragment() != null) return null;
        String path = uri.getPath();
        if (path == null || !path.startsWith(PREFIX)) return null;
        return links.get(path.substring(PREFIX.length()));
    }
    static void open(Activity activity, String value) {
        String safe = allowed(value);if (safe == null) throw new IllegalArgumentException();
        Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse(safe)).addCategory(Intent.CATEGORY_BROWSABLE);
        activity.startActivity(intent);
    }
}
