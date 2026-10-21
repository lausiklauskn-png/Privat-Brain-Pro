package de.familyprojekt.privatebrain.pro;

import androidx.test.ext.junit.runners.AndroidJUnit4;
import java.io.ByteArrayInputStream;
import java.nio.charset.StandardCharsets;
import java.util.Properties;
import javax.mail.Session;
import javax.mail.internet.MimeMessage;
import org.junit.Test;
import org.junit.runner.RunWith;
import static org.junit.Assert.*;

/** Sorting index for all accounts: headers and readable text only, attachments never read. */
@RunWith(AndroidJUnit4.class)
public class NativeMailIndexTest {
    private static MimeMessage mail(String raw) throws Exception {
        return new MimeMessage(Session.getInstance(new Properties()),
            new ByteArrayInputStream(raw.replace("\n", "\r\n").getBytes(StandardCharsets.ISO_8859_1)));
    }
    private static String repeat(char c, int n) { char[] value = new char[n]; java.util.Arrays.fill(value, c); return new String(value); }

    @Test public void newsletterHeadersAreRecognizedWithoutTheBody() throws Exception {
        MimeMessage message = mail("Message-ID: <a1@x.invalid>\nFrom: Aldi Süd <news@aldi.invalid>\nSubject: Angebote\n"
            + "Date: Tue, 20 Oct 2026 08:00:00 +0200\nList-Unsubscribe: <https://x.invalid/u>\nPrecedence: bulk\n"
            + "Content-Type: text/plain; charset=ISO-8859-1\n\nGültig bis 26.10.\n");
        MailIndex.Head head = MailIndex.head(message, 7);
        assertEquals(7, head.uid);
        assertEquals("<a1@x.invalid>", head.messageId);
        assertEquals("Aldi Süd <news@aldi.invalid>", head.from);
        assertTrue(head.list); assertTrue(head.bulk); assertTrue(head.date > 0);
        MailIndex.Body body = MailIndex.body(message);
        assertTrue(body.text.startsWith("Gültig bis 26.10."));
        assertFalse(body.attachments);
        assertFalse(MailIndex.head(mail("From: a@b.invalid\nSubject: s\n\nx\n"), 1).list);
    }

    @Test public void unusualMessageIdsCountAsMissing() {
        assertEquals("", MailIndex.messageId(null));
        assertEquals("", MailIndex.messageId(new String[] {"x@y.invalid"}));
        assertEquals("", MailIndex.messageId(new String[] {"<a b@y.invalid>"}));
        assertEquals("", MailIndex.messageId(new String[] {"<a\u0001b@y.invalid>"}));
        assertEquals("<ok@y.invalid>", MailIndex.messageId(new String[] {"  <ok@y.invalid> "}));
    }

    @Test public void attachmentsAreSkippedAndOnlyMarked() throws Exception {
        MimeMessage message = mail("From: a@b.invalid\nSubject: Rechnung\nContent-Type: multipart/mixed; boundary=XX\n\n"
            + "--XX\nContent-Type: multipart/alternative; boundary=YY\n\n"
            + "--YY\nContent-Type: text/plain; charset=UTF-8\n\nRechnung Nr. 5\n"
            + "--YY\nContent-Type: text/html; charset=UTF-8\n\n<p>Rechnung <b>Nr. 5</b></p>\n--YY--\n"
            + "--XX\nContent-Type: application/pdf; name=r.pdf\nContent-Disposition: attachment; filename=r.pdf\n"
            + "Content-Transfer-Encoding: base64\n\nJVBERi0x\n--XX--\n");
        MailIndex.Body body = MailIndex.body(message);
        assertEquals("Rechnung Nr. 5", body.text.trim());
        assertTrue(body.html.contains("<b>Nr. 5</b>"));
        assertTrue(body.attachments);
        assertFalse(body.text.contains("JVBER"));
    }

    @Test public void largeTextPartsAreNotLoaded() throws Exception {
        MimeMessage huge = mail("From: a@b.invalid\nSubject: gross\nContent-Type: multipart/mixed; boundary=ZZ\n\n"
            + "--ZZ\nContent-Type: text/plain\n\n" + repeat('A', 600 * 1024) + "\n--ZZ\nContent-Type: text/html\n\n<p>klein</p>\n--ZZ--\n");
        MailIndex.Body body = MailIndex.body(huge);
        assertEquals("", body.text);
        assertTrue(body.html.contains("klein"));
        MimeMessage longText = mail("From: a@b.invalid\nSubject: lang\nContent-Type: text/plain\n\n" + repeat('B', 100000) + "\n");
        assertEquals(MailIndex.MAX_TEXT, MailIndex.body(longText).text.length());
    }
}
