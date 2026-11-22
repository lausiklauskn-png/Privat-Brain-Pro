package de.familyprojekt.privatebrain.pro;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.util.Properties;
import javax.mail.Part;
import javax.mail.Session;
import javax.mail.internet.MimeBodyPart;
import javax.mail.internet.MimeMessage;
import javax.mail.internet.MimeMultipart;
import javax.mail.internet.MimeUtility;
import org.junit.Test;
import static org.junit.Assert.*;

/** Klaus 22.11.2026: the index of "Alle Konten" remembers name, type and size of attachments, never their content. */
public class MailIndexFilesTest {
    private static MimeMessage mail(int attachments) throws Exception {
        Session session = Session.getInstance(new Properties());
        MimeMessage message = new MimeMessage(session);
        MimeMultipart parts = new MimeMultipart();
        MimeBodyPart text = new MimeBodyPart(); text.setText("Hallo Text", "UTF-8"); parts.addBodyPart(text);
        for (int i = 0; i < attachments; i++) {
            MimeBodyPart file = new MimeBodyPart();
            file.setContent(new byte[1000 + i], "application/pdf");
            file.setFileName(MimeUtility.encodeText("Rechnung Größe " + i + ".pdf", "UTF-8", "B"));
            file.setDisposition(Part.ATTACHMENT);
            parts.addBodyPart(file);
        }
        MimeBodyPart image = new MimeBodyPart(); image.setContent(new byte[50], "image/png"); parts.addBodyPart(image);
        message.setContent(parts); message.saveChanges();
        ByteArrayOutputStream out = new ByteArrayOutputStream(); message.writeTo(out);
        return new MimeMessage(session, new ByteArrayInputStream(out.toByteArray()));
    }

    @Test public void namesTypesAndSizesWithoutContent() throws Exception {
        MailIndex.Body body = MailIndex.body(mail(1));
        assertTrue(body.text.contains("Hallo"));
        assertTrue(body.attachments);
        assertEquals(2, body.files.size());
        assertEquals("Rechnung Größe 0.pdf", body.files.get(0).name);
        assertEquals("application/pdf", body.files.get(0).type);
        assertTrue(body.files.get(0).size >= 1000);
        assertEquals("image/png", body.files.get(1).type);
        assertEquals("", body.files.get(1).name);
    }

    @Test public void atMostTwentyFiles() throws Exception {
        assertEquals(MailIndex.MAX_FILES, MailIndex.body(mail(40)).files.size());
    }

    @Test public void plainMailHasNoFiles() throws Exception {
        MimeMessage message = new MimeMessage(Session.getInstance(new Properties()));
        message.setText("nur Text", "UTF-8"); message.saveChanges();
        MailIndex.Body body = MailIndex.body(message);
        assertFalse(body.attachments);
        assertTrue(body.files.isEmpty());
    }
}
