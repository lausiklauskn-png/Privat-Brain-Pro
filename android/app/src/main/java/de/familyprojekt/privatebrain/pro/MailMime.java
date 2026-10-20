package de.familyprojekt.privatebrain.pro;

import android.text.Html;
import android.util.Base64;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.Date;
import javax.activation.DataHandler;
import javax.mail.Address;
import javax.mail.Message;
import javax.mail.Multipart;
import javax.mail.Part;
import javax.mail.Session;
import javax.mail.internet.InternetAddress;
import javax.mail.internet.ContentType;
import javax.mail.internet.MimeBodyPart;
import javax.mail.internet.MimeMessage;
import javax.mail.internet.MimeMultipart;
import javax.mail.internet.MimeUtility;
import javax.mail.util.ByteArrayDataSource;
import org.json.JSONArray;
import org.json.JSONObject;

final class MailMime {
    static final int MAX_RAW = 8 * 1024 * 1024;
    static final int MAX_ATTACHMENTS = 5 * 1024 * 1024;
    static final int MAX_TEXT = 1024 * 1024;

    static byte[] read(InputStream input, int limit) throws Exception {
        try (InputStream stream = input; ByteArrayOutputStream bytes = new ByteArrayOutputStream()) {
            byte[] buffer = new byte[8192];
            int n;
            while ((n = stream.read(buffer)) != -1) {
                if ((long) bytes.size() + n > limit) throw new MailFailure("MESSAGE_TOO_LARGE");
                bytes.write(buffer, 0, n);
            }
            return bytes.toByteArray();
        }
    }
    static byte[] bytes(Message message) throws Exception {
        if (message.getSize() > MAX_RAW) throw new MailFailure("MESSAGE_TOO_LARGE");
        ByteArrayOutputStream bytes = new ByteArrayOutputStream();
        message.writeTo(new OutputStream() {
            @Override public void write(int b) throws java.io.IOException { write(new byte[] {(byte) b}, 0, 1); }
            @Override public void write(byte[] data, int offset, int length) throws java.io.IOException {
                if ((long) bytes.size() + length > MAX_RAW) throw new java.io.IOException("MESSAGE_TOO_LARGE");
                bytes.write(data, offset, length);
            }
        });
        return bytes.toByteArray();
    }
    static String addresses(Address[] values) {
        if (values == null) return "";
        StringBuilder result = new StringBuilder();
        for (Address value : values) {
            if (result.length() > 0) result.append(", ");
            result.append(value instanceof InternetAddress ? ((InternetAddress) value).getAddress() : value.toString());
        }
        return result.toString();
    }
    static String filename(String value) throws Exception {
        String name = value == null || value.isEmpty() ? "attachment" : value;
        try { name = MimeUtility.decodeText(name); }
        catch (java.io.UnsupportedEncodingException ignored) { /* Keep an inert sanitized filename. */ }
        name = name.replaceAll("[\\\\/\\p{Cntrl}\\p{Cf}]", "_");
        return name.substring(0, Math.min(200, name.length()));
    }
    /** Receives attachment parts as streams; used for the password-encrypted folder. */
    interface Sink { JSONObject store(Part part, int index, String name, String type, JSONObject head) throws Exception; }
    private static final class Bodies {
        String plain = "", html = "";
        int parts = 0, attachedBytes = 0, index = 0;
        final JSONArray attachments = new JSONArray();
        Sink sink; JSONObject head;
    }
    private static String type(Part part) throws Exception {
        try { return new ContentType(part.getContentType()).getBaseType().toLowerCase(java.util.Locale.ROOT); }
        catch (javax.mail.internet.ParseException invalid) { return "application/octet-stream"; }
    }
    private static void store(Part part, Bodies bodies, String name) throws Exception {
        if (bodies.attachments.length() >= 200) throw new MailFailure("MESSAGE_TOO_LARGE");
        bodies.attachments.put(bodies.sink.store(part, bodies.index++, name, type(part), bodies.head));
    }
    private static void extract(Part part, Bodies bodies, int depth) throws Exception {
        if (depth > 20 || ++bodies.parts > 150) throw new MailFailure("MESSAGE_TOO_LARGE");
        boolean explicitAttachment = Part.ATTACHMENT.equalsIgnoreCase(part.getDisposition());
        String[] ids = part.getHeader("Content-ID");
        String contentId = ids == null || ids.length == 0 ? "" : ids[0].trim().replaceAll("^<|>$", "");
        boolean attachment = explicitAttachment || part.getFileName() != null;
        if (!attachment && part.isMimeType("multipart/*")) {
            Multipart multipart = (Multipart) part.getContent();
            if (multipart.getCount() > 100) throw new MailFailure("MESSAGE_TOO_LARGE");
            for (int i = 0; i < multipart.getCount(); i++) extract(multipart.getBodyPart(i), bodies, depth + 1);
        } else if (!attachment && (part.isMimeType("text/plain") || part.isMimeType("text/html"))) {
            // Streaming mode: a giant text part is kept as a file instead of being read into memory.
            if (bodies.sink != null && (part.getSize() < 0 || (long) bodies.plain.length() + bodies.html.length() + part.getSize() > MAX_TEXT)) {
                store(part, bodies, part.isMimeType("text/html") ? "text.html" : "text.txt"); return;
            }
            Object content = part.getContent();
            if (!(content instanceof String)) throw new MailFailure("INVALID_MESSAGE");
            String text = (String) content;
            if ((long) bodies.plain.length() + bodies.html.length() + text.length() > MAX_TEXT) throw new MailFailure("MESSAGE_TOO_LARGE");
            // A multipart/alternative contains representations, not successive paragraphs.
            // Keep the first body of each kind; do not concatenate duplicate alternatives.
            if (part.isMimeType("text/plain") && bodies.plain.isEmpty()) bodies.plain = text;
            else if (part.isMimeType("text/html") && bodies.html.isEmpty()) bodies.html = text;
        } else {
            if (bodies.sink != null) {
                boolean inline = !explicitAttachment && !contentId.isEmpty() && type(part).matches("image/(png|jpeg|gif|webp|avif|bmp)");
                // Small inline pictures stay with the HTML view; every attachment goes to the folder.
                if (!inline || part.getSize() < 0 || (long) bodies.attachedBytes + part.getSize() > MAX_ATTACHMENTS) {
                    store(part, bodies, filename(part.getFileName())); return;
                }
            }
            byte[] content = read(part.getInputStream(), MAX_ATTACHMENTS - bodies.attachedBytes);
            bodies.attachedBytes += content.length;
            if (bodies.attachments.length() >= 30) throw new MailFailure("MESSAGE_TOO_LARGE");
            String type;
            try { type = new ContentType(part.getContentType()).getBaseType().toLowerCase(java.util.Locale.ROOT); }
            catch (javax.mail.internet.ParseException invalid) { type = "application/octet-stream"; }
            boolean inline = !explicitAttachment && !contentId.isEmpty() &&
                type.matches("image/(png|jpeg|gif|webp|avif|bmp)");
            bodies.attachments.put(new JSONObject().put("name", filename(part.getFileName()))
                .put("type", type).put("contentId", contentId.substring(0, Math.min(998, contentId.length())))
                .put("inline", inline).put("data", Base64.encodeToString(content, Base64.NO_WRAP)));
        }
    }
    static JSONObject parse(byte[] raw, Session session) throws Exception {
        if (raw.length > MAX_RAW) throw new MailFailure("MESSAGE_TOO_LARGE");
        MimeMessage message = new MimeMessage(session, new ByteArrayInputStream(raw));
        Bodies bodies = new Bodies();
        extract(message, bodies, 0);
        // Separate catalog/reply text from the original HTML representation and raw MIME.
        // The UI displays HTML only in its script-free, opaque-origin sandbox.
        String text = bodies.plain.isEmpty() ? Html.fromHtml(bodies.html, Html.FROM_HTML_MODE_LEGACY).toString() : bodies.plain;
        return new JSONObject().put("raw", new String(raw, StandardCharsets.UTF_8))
            .put("sourceBase64", Base64.encodeToString(raw, Base64.NO_WRAP))
            .put("subject", message.getSubject() == null ? "" : message.getSubject())
            .put("messageId", message.getMessageID() == null ? "" : message.getMessageID())
            .put("replyTo", addresses(message.getReplyTo())).put("from", addresses(message.getFrom()))
            .put("to", addresses(message.getRecipients(Message.RecipientType.TO)))
            .put("cc", addresses(message.getRecipients(Message.RecipientType.CC)))
            .put("bcc", addresses(message.getRecipients(Message.RecipientType.BCC)))
            .put("text", text).put("html", bodies.html).put("attachments", bodies.attachments);
    }
    static final int MAX_HEADERS = 64 * 1024;
    /**
     * Parses a downloaded message file without loading it: parts are views onto the file
     * (SharedFileInputStream) and attachments are streamed into the sink.
     */
    static JSONObject parseFile(java.io.File file, Session session, Sink sink) throws Exception {
        try (javax.mail.util.SharedFileInputStream input = new javax.mail.util.SharedFileInputStream(file)) {
            MimeMessage message = new MimeMessage(session, input);
            Date date = message.getSentDate();
            JSONObject head = new JSONObject().put("subject", message.getSubject() == null ? "" : message.getSubject())
                .put("from", addresses(message.getFrom())).put("date", date == null ? "" : Long.toString(date.getTime()));
            Bodies bodies = new Bodies();
            bodies.sink = sink; bodies.head = head;
            extract(message, bodies, 0);
            String text = bodies.plain.isEmpty() ? Html.fromHtml(bodies.html, Html.FROM_HTML_MODE_LEGACY).toString() : bodies.plain;
            // The check report reads headers and text; the complete source stays with the provider.
            StringBuilder headers = new StringBuilder();
            java.util.Enumeration<?> lines = message.getAllHeaderLines();
            while (lines.hasMoreElements() && headers.length() < MAX_HEADERS) headers.append(lines.nextElement()).append("\r\n");
            return new JSONObject().put("raw", headers.append("\r\n").append(text).toString())
                .put("subject", head.getString("subject"))
                .put("messageId", message.getMessageID() == null ? "" : message.getMessageID())
                .put("replyTo", addresses(message.getReplyTo())).put("from", head.getString("from"))
                .put("to", addresses(message.getRecipients(Message.RecipientType.TO)))
                .put("cc", addresses(message.getRecipients(Message.RecipientType.CC)))
                .put("bcc", addresses(message.getRecipients(Message.RecipientType.BCC)))
                .put("text", text).put("html", bodies.html).put("attachments", bodies.attachments).put("vault", true);
        }
    }
    static MimeMessage compose(MailAccount account, JSONObject draft, Session session) throws Exception {
        MailAccount.uuid(draft.getString("submission"));
        String text = draft.getString("text");
        if (text.length() > MAX_TEXT) throw new MailFailure("MESSAGE_TOO_LARGE");
        MimeMessage message = new MimeMessage(session);
        message.setFrom(new InternetAddress(account.email));
        int count = 0;
        Message.RecipientType[] types = {Message.RecipientType.TO, Message.RecipientType.CC, Message.RecipientType.BCC};
        String[] fields = {"to", "cc", "bcc"};
        for (int i = 0; i < fields.length; i++) {
            String value = MailAccount.header(draft.optString(fields[i]), 2000).replace(';', ',').trim();
            if (value.isEmpty()) continue;
            InternetAddress[] addresses = InternetAddress.parse(value, true);
            for (InternetAddress address : addresses) {
                address.validate();
                if (address.isGroup()) throw new MailFailure("INVALID_INPUT");
            }
            count += addresses.length;
            message.setRecipients(types[i], addresses);
        }
        if (count < 1 || count > 100) throw new MailFailure("INVALID_INPUT");
        message.setSubject(MailAccount.header(draft.optString("subject"), 998), "UTF-8");
        String reply = MailAccount.header(draft.optString("inReplyTo"), 998);
        if (!reply.isEmpty()) message.setHeader("In-Reply-To", reply);
        MimeMultipart multipart = new MimeMultipart("mixed");
        MimeBodyPart body = new MimeBodyPart();
        body.setText(text, "UTF-8");
        multipart.addBodyPart(body);
        JSONArray attachments = draft.getJSONArray("attachments");
        if (attachments.length() > 30) throw new MailFailure("MESSAGE_TOO_LARGE");
        int total = 0;
        for (int i = 0; i < attachments.length(); i++) {
            JSONObject item = attachments.getJSONObject(i);
            String encoded = item.getString("data");
            if (encoded.length() > MAX_ATTACHMENTS * 4L / 3 + 4) throw new MailFailure("MESSAGE_TOO_LARGE");
            byte[] data = Base64.decode(encoded, Base64.DEFAULT);
            total += data.length;
            if (total > MAX_ATTACHMENTS) throw new MailFailure("MESSAGE_TOO_LARGE");
            MimeBodyPart file = new MimeBodyPart();
            file.setDataHandler(new DataHandler(new ByteArrayDataSource(data, "application/octet-stream")));
            file.setFileName(filename(item.getString("name")));
            file.setDisposition(Part.ATTACHMENT);
            multipart.addBodyPart(file);
        }
        message.setContent(multipart);
        message.setSentDate(new Date());
        message.saveChanges();
        message.setHeader("Message-ID", "<" + draft.getString("submission") + "@privatebrain.invalid>");
        return message;
    }
    static String fingerprint(JSONObject draft) throws Exception {
        MessageDigest digest = MessageDigest.getInstance("SHA-256");
        for (String field : new String[] {"to", "cc", "bcc", "subject", "text", "inReplyTo"}) add(digest, draft.optString(field));
        JSONArray files = draft.getJSONArray("attachments");
        add(digest, Integer.toString(files.length()));
        for (int i = 0; i < files.length(); i++) {
            JSONObject file = files.getJSONObject(i);
            add(digest, file.getString("name"));
            add(digest, file.getString("data"));
        }
        return Base64.encodeToString(digest.digest(), Base64.NO_WRAP);
    }
    private static void add(MessageDigest digest, String value) {
        byte[] data = value.getBytes(StandardCharsets.UTF_8);
        digest.update(Integer.toString(data.length).getBytes(StandardCharsets.US_ASCII));
        digest.update((byte) ':');
        digest.update(data);
    }
}
