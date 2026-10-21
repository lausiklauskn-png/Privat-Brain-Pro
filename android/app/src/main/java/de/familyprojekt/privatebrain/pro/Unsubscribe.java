package de.familyprojekt.privatebrain.pro;

import java.io.IOException;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URI;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.util.Locale;
import org.json.JSONObject;

/**
 * One-click newsletter unsubscribe (RFC 8058): a single POST of "List-Unsubscribe=One-Click"
 * to the https address the sender put in its hidden List-Unsubscribe field. No cookies, no page,
 * no redirects followed, honours the app's internet switch, never retried automatically.
 */
final class Unsubscribe {
    interface Opener { HttpURLConnection open(URL url) throws IOException; }
    static final byte[] BODY = "List-Unsubscribe=One-Click".getBytes(StandardCharsets.US_ASCII);

    private Unsubscribe() { }

    /** Only plain https addresses with a real host; nothing local, no user info, at most 1500 characters. */
    static URL validate(String value) throws MailFailure {
        try {
            if (value == null || value.length() > 1500 || !value.matches("[^\\s\\p{Cntrl}]+")) throw new MailFailure("INVALID_INPUT");
            URI uri = new URI(value);
            String host = uri.getHost() == null ? "" : uri.getHost().toLowerCase(Locale.ROOT);
            if (!"https".equalsIgnoreCase(uri.getScheme()) || host.isEmpty() || uri.getUserInfo() != null
                || host.equals("localhost") || host.endsWith(".localhost") || host.endsWith(".local") || !host.contains(".")
                || host.matches("[0-9.]+") || host.contains(":")) throw new MailFailure("INVALID_INPUT");
            return uri.toURL();
        } catch (MailFailure known) { throw known; }
        catch (Exception invalid) { throw new MailFailure("INVALID_INPUT"); }
    }

    static JSONObject oneClick(String value, Opener opener) throws Exception {
        URL url = validate(value);
        AppNetwork.check();
        long started = AppNetwork.epoch();
        HttpURLConnection request = opener.open(url);
        AutoCloseable cancel = AppNetwork.track(request::disconnect);
        try {
            request.setInstanceFollowRedirects(false);
            request.setUseCaches(false);
            request.setConnectTimeout(15000);
            request.setReadTimeout(20000);
            request.setRequestMethod("POST");
            request.setDoOutput(true);
            request.setRequestProperty("Content-Type", "application/x-www-form-urlencoded");
            request.setRequestProperty("User-Agent", "Private Brain Pro");
            request.setFixedLengthStreamingMode(BODY.length);
            try (OutputStream out = request.getOutputStream()) { out.write(BODY); }
            int status = request.getResponseCode();
            AppNetwork.check(started);
            return new JSONObject().put("ok", accepted(status)).put("status", status);
        } finally {
            AppNetwork.release(cancel);
            request.disconnect();
        }
    }

    /** 2xx means done; a redirect also means the server took the POST (RFC 8058 needs no page). */
    static boolean accepted(int status) { return status >= 200 && status < 400; }
}
