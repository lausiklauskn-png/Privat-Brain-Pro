package de.familyprojekt.privatebrain.pro;

import java.io.ByteArrayOutputStream;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import org.json.JSONObject;
import org.junit.Test;
import static org.junit.Assert.*;

public class UnsubscribeTest {
    @Test public void hiddenFieldKeepsOnlyHttpsAndMailto() {
        assertEquals("<https://news.example.com/u?id=1>, <mailto:leave@example.com?subject=unsubscribe>",
            MailIndex.unsubscribe(new String[] {"<https://news.example.com/u?id=1>,\r\n <mailto:leave@example.com?subject=unsubscribe>"}));
        assertEquals("", MailIndex.unsubscribe(new String[] {"<http://plain.example.com/u>, <javascript:alert(1)>, <ftp://x.example.com>"}));
        assertEquals("", MailIndex.unsubscribe(new String[] {"<https://bad example.com/u>"}));
        assertEquals("", MailIndex.unsubscribe(null));
        String many = "<https://a.example.com/1>,<https://a.example.com/2>,<https://a.example.com/3>,<https://a.example.com/4>,<https://a.example.com/5>";
        assertEquals(4, MailIndex.unsubscribe(new String[] {many}).split(", ").length);
    }

    @Test public void oneClickNeedsTheExactRfc8058Value() {
        assertTrue(MailIndex.oneClick(new String[] {"List-Unsubscribe=One-Click"}));
        assertTrue(MailIndex.oneClick(new String[] {" list-unsubscribe = one-click "}));
        assertFalse(MailIndex.oneClick(new String[] {"List-Unsubscribe=Maybe"}));
        assertFalse(MailIndex.oneClick(null));
    }

    @Test public void onlyPublicHttpsAddressesAreAccepted() throws Exception {
        assertEquals("news.example.com", Unsubscribe.validate("https://news.example.com/u?t=abc").getHost());
        for (String bad : new String[] {"http://news.example.com/u", "https://localhost/u", "https://10.0.0.1/u", "https://[::1]/u",
            "https://user:pw@news.example.com/u", "https://intranet/u", "https://printer.local/u", "javascript:alert(1)", "https://a b.example.com/", null}) {
            try { Unsubscribe.validate(bad); fail("accepted " + bad); }
            catch (MailFailure expected) { assertEquals("INVALID_INPUT", expected.code); }
        }
    }

    static final class FakeConnection extends HttpURLConnection {
        final ByteArrayOutputStream body = new ByteArrayOutputStream();
        final int status;
        FakeConnection(URL url, int status) { super(url); this.status = status; }
        @Override public OutputStream getOutputStream() { return body; }
        @Override public int getResponseCode() { return status; }
        @Override public void connect() { }
        @Override public void disconnect() { }
        @Override public boolean usingProxy() { return false; }
    }

    @Test public void sendsOneFormPostWithoutFollowingRedirects() throws Exception {
        FakeConnection[] seen = new FakeConnection[1];
        JSONObject result = Unsubscribe.oneClick("https://news.example.com/u?id=7", url -> seen[0] = new FakeConnection(url, 302));
        assertTrue(result.getBoolean("ok"));
        assertEquals(302, result.getInt("status"));
        assertEquals("POST", seen[0].getRequestMethod());
        assertFalse(seen[0].getInstanceFollowRedirects());
        assertEquals("application/x-www-form-urlencoded", seen[0].getRequestProperty("Content-Type"));
        assertEquals("List-Unsubscribe=One-Click", seen[0].body.toString(StandardCharsets.US_ASCII.name()));
        assertFalse(Unsubscribe.oneClick("https://news.example.com/u", url -> new FakeConnection(url, 500)).getBoolean("ok"));
    }
}
