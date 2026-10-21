package de.familyprojekt.privatebrain.pro;

import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.Reader;
import java.nio.charset.Charset;
import java.util.Locale;
import javax.mail.Address;
import javax.mail.Flags;
import javax.mail.Message;
import javax.mail.MessagingException;
import javax.mail.Multipart;
import javax.mail.Part;
import javax.mail.internet.ContentType;
import javax.mail.internet.InternetAddress;
import javax.mail.internet.MimeUtility;

/**
 * Sorting index for all accounts: headers and readable text only.
 * Attachments are never read; large text parts are skipped instead of loaded.
 * Kept free of Android classes so the same rules can be checked on a plain JVM.
 */
final class MailIndex {
    static final int MAX_TEXT = 20000, MAX_HTML = 200000, MAX_PART = 512 * 1024, PAGE = 100, TEXT_BATCH = 10;

    static final class Head {
        long uid, date, size;
        String messageId = "", from = "", subject = "", unsubscribe = "";
        boolean seen, flagged, list, bulk, oneClick;
    }
    static final class Body {
        String text = "", html = "";
        boolean attachments;
    }

    private MailIndex() { }

    static Head head(Message message, long uid) throws MessagingException {
        Head head = new Head();
        head.uid = uid;
        head.messageId = messageId(message.getHeader("Message-ID"));
        head.from = cut(address(message.getFrom()), 2000);
        String subject = message.getSubject();
        head.subject = cut(subject == null ? "" : subject, 1024);
        java.util.Date date = message.getSentDate();
        if (date == null) date = message.getReceivedDate();
        head.date = date == null ? 0 : date.getTime();
        head.size = Math.max(0, message.getSize());
        head.seen = message.isSet(Flags.Flag.SEEN);
        head.flagged = message.isSet(Flags.Flag.FLAGGED);
        head.list = present(message.getHeader("List-Unsubscribe")) || present(message.getHeader("List-Id"));
        head.unsubscribe = unsubscribe(message.getHeader("List-Unsubscribe"));
        head.oneClick = !head.unsubscribe.isEmpty() && oneClick(message.getHeader("List-Unsubscribe-Post"));
        String[] precedence = message.getHeader("Precedence");
        if (precedence != null) for (String value : precedence)
            if (value != null && value.trim().toLowerCase(Locale.ROOT).matches("bulk|list|junk")) head.bulk = true;
        return head;
    }

    /**
     * The hidden unsubscribe field (RFC 2369): keeps only <https://…> and <mailto:…> entries,
     * without spaces or control characters, at most four, joined by ", ". Anything else is dropped.
     */
    static String unsubscribe(String[] values) {
        if (values == null) return "";
        StringBuilder result = new StringBuilder();
        int count = 0;
        for (String value : values) {
            if (value == null) continue;
            java.util.regex.Matcher m = java.util.regex.Pattern.compile("<([^<>]{1,1500})>").matcher(value.replaceAll("\\r?\\n[ \\t]+", ""));
            while (m.find() && count < 4) {
                String uri = m.group(1).trim();
                String lower = uri.toLowerCase(Locale.ROOT);
                if (!(lower.startsWith("https://") || lower.startsWith("mailto:"))) continue;
                if (!uri.matches("[^\\s\\p{Cntrl}]+")) continue;
                if (result.length() > 0) result.append(", ");
                result.append('<').append(uri).append('>');
                count++;
            }
        }
        return cut(result.toString(), 3000);
    }

    /** RFC 8058: the sender allows a single POST without visiting the page. */
    static boolean oneClick(String[] values) {
        if (values == null) return false;
        for (String value : values)
            if (value != null && value.replaceAll("\\s", "").equalsIgnoreCase("List-Unsubscribe=One-Click")) return true;
        return false;
    }

    /** Only one syntactically plain identifier; anything unusual counts as missing. */
    static String messageId(String[] values) {
        if (values == null || values.length == 0 || values[0] == null) return "";
        String value = values[0].trim();
        return value.matches("<[^<>\\s\\p{Cntrl}]{1,996}>") ? value : "";
    }

    static Body body(Part part) throws Exception {
        Body body = new Body();
        walk(part, body, 0, new int[] {0});
        body.text = cut(body.text, MAX_TEXT);
        body.html = cut(body.html, MAX_HTML);
        return body;
    }

    private static void walk(Part part, Body body, int depth, int[] parts) throws Exception {
        if (depth > 12 || ++parts[0] > 120) return;
        boolean attachment = Part.ATTACHMENT.equalsIgnoreCase(part.getDisposition()) || part.getFileName() != null;
        if (attachment) { body.attachments = true; return; }
        if (part.isMimeType("multipart/*")) {
            Object content = part.getContent();
            if (!(content instanceof Multipart)) return;
            Multipart multipart = (Multipart) content;
            int count = Math.min(multipart.getCount(), 100);
            for (int i = 0; i < count; i++) walk(multipart.getBodyPart(i), body, depth + 1, parts);
            return;
        }
        boolean plain = part.isMimeType("text/plain"), html = part.isMimeType("text/html");
        if (!plain && !html) {
            if (!part.isMimeType("message/rfc822") && part.getSize() != 0) body.attachments = true;
            return;
        }
        if ((plain && !body.text.isEmpty()) || (html && !body.html.isEmpty())) return;
        // Unknown or large sizes are skipped: the index must never pull a huge part into memory.
        if (part.getSize() < 0 || part.getSize() > MAX_PART) return;
        String text = read(part, plain ? MAX_TEXT : MAX_HTML);
        if (plain) body.text = text; else body.html = text;
    }

    private static String read(Part part, int limit) throws Exception {
        String charset = "UTF-8";
        try {
            String declared = new ContentType(part.getContentType()).getParameter("charset");
            if (declared != null && Charset.isSupported(MimeUtility.javaCharset(declared))) charset = MimeUtility.javaCharset(declared);
        } catch (Exception ignored) { /* Fall back to UTF-8 for an unreadable content type. */ }
        try (InputStream input = part.getInputStream(); Reader reader = new InputStreamReader(input, charset)) {
            StringBuilder result = new StringBuilder();
            char[] buffer = new char[4096];
            int n;
            while (result.length() < limit && (n = reader.read(buffer, 0, Math.min(buffer.length, limit - result.length()))) != -1)
                result.append(buffer, 0, n);
            return result.toString();
        }
    }

    static String address(Address[] values) {
        if (values == null) return "";
        StringBuilder result = new StringBuilder();
        for (Address value : values) {
            if (result.length() > 0) result.append(", ");
            if (value instanceof InternetAddress) {
                InternetAddress internet = (InternetAddress) value;
                String name = internet.getPersonal(), mail = internet.getAddress() == null ? "" : internet.getAddress();
                result.append(name == null || name.trim().isEmpty() ? mail : name.replaceAll("[<>\\p{Cntrl}]", " ").trim() + " <" + mail + ">");
            } else result.append(value.toString());
        }
        return result.toString();
    }

    private static boolean present(String[] values) {
        if (values == null) return false;
        for (String value : values) if (value != null && !value.trim().isEmpty()) return true;
        return false;
    }
    static String cut(String value, int limit) { return value.length() <= limit ? value : value.substring(0, limit); }
}
