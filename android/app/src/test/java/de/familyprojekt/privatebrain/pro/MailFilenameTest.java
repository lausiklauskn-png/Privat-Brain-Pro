package de.familyprojekt.privatebrain.pro;

import static org.junit.Assert.*;
import java.nio.charset.StandardCharsets;
import java.text.Normalizer;
import org.junit.Test;

public class MailFilenameTest {
    @Test public void longUnicodeNamesKeepTheirExtensionAndCompleteCharacters() throws Exception {
        for(String value:new String[]{"a"+"😀".repeat(120)+".pdf","Ж".repeat(200)+".PDF","e\u0301".repeat(200)+".pdf"}){
            String safe=MailMime.filename(value);
            assertTrue(safe.toLowerCase(java.util.Locale.ROOT).endsWith(".pdf"));
            assertTrue(safe.length()<=160);assertTrue(safe.getBytes(StandardCharsets.UTF_8).length<=200);
            assertTrue(Normalizer.isNormalized(safe,Normalizer.Form.NFC));
            assertFalse(safe.codePoints().anyMatch(cp->cp>=0xd800&&cp<=0xdfff));
        }
    }
    @Test public void portableNamesAvoidReservedNamesAndPathCharacters() throws Exception {
        assertEquals("_CON.pdf",MailMime.filename("CON.pdf"));
        assertEquals("report.pdf",MailMime.filename("report.pdf"));
        assertFalse(MailMime.filename("../../mail\\file?.pdf").matches(".*[\\\\/:?*].*"));
    }
}
