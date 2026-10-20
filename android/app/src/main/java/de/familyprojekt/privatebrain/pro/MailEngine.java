package de.familyprojekt.privatebrain.pro;

import android.util.Base64;
import com.sun.mail.imap.IMAPFolder;
import com.sun.mail.imap.IMAPStore;
import com.sun.mail.smtp.SMTPTransport;
import java.io.ByteArrayInputStream;
import java.util.Arrays;
import java.util.Date;
import javax.mail.FetchProfile;
import javax.mail.Flags;
import javax.mail.Folder;
import javax.mail.Message;
import javax.mail.Session;
import javax.mail.internet.MimeMessage;
import org.json.JSONArray;
import org.json.JSONObject;

/** Direct device sockets, no Private-Brain server and no general network bridge. */
final class MailEngine {
    interface OAuthProvider { String token(String email) throws Exception; void invalidate(String token); }
    private final EncryptedMailStore store;
    private final OAuthProvider oauth;
    MailEngine(EncryptedMailStore store) { this(store, null); }
    MailEngine(EncryptedMailStore store, OAuthProvider oauth) { this.store = store;this.oauth = oauth; }
    private Session session() { return Session.getInstance(MailAccount.properties()); }
    private Session session(MailAccount account) { return Session.getInstance(MailAccount.properties(account.authType)); }
    private String credential(MailAccount account) throws Exception {
        if (!account.authType.equals("oauth2")) return account.password;
        if (oauth == null) throw new MailFailure("GMAIL_AUTH_REQUIRED");return oauth.token(account.email);
    }
    private IMAPStore imap(MailAccount account) throws Exception {
        IMAPStore connection = (IMAPStore) session(account).getStore("imaps");
        String credential = credential(account);
        try { connection.connect(account.imap, 993, account.user, credential); return connection; }
        catch (javax.mail.AuthenticationFailedException error) { try { connection.close(); } catch (Exception ignored) { } if (account.authType.equals("oauth2")) { oauth.invalidate(credential);throw new MailFailure("GMAIL_AUTH_REQUIRED"); }throw error; }
        catch (Exception error) { try { connection.close(); } catch (Exception ignored) { } throw error; }
    }
    private SMTPTransport smtp(MailAccount account) throws Exception {
        SMTPTransport connection = (SMTPTransport) session(account).getTransport("smtps");
        String credential = credential(account);
        try { connection.connect(account.smtp, 465, account.user, credential); return connection; }
        catch (javax.mail.AuthenticationFailedException error) { try { connection.close(); } catch (Exception ignored) { } if (account.authType.equals("oauth2")) { oauth.invalidate(credential);throw new MailFailure("GMAIL_AUTH_REQUIRED"); }throw error; }
        catch (Exception error) { try { connection.close(); } catch (Exception ignored) { } throw error; }
    }
    void verify(MailAccount account) throws Exception {
        try (IMAPStore ignored = imap(account)) { /* Successful login, not merely a TLS handshake. */ }
        try (SMTPTransport ignored = smtp(account)) { /* Authentication only, no message sent. */ }
    }
    JSONArray accounts() throws Exception {
        JSONObject root = store.read("accounts");
        JSONArray values = root == null ? new JSONArray() : root.getJSONArray("items");
        JSONArray result = new JSONArray();
        for (int i = 0; i < values.length(); i++) result.put(new MailAccount(values.getJSONObject(i)).publicJson());
        return result;
    }
    MailAccount account(String id) throws Exception {
        MailAccount.uuid(id);
        JSONObject root = store.read("accounts");
        if (root != null) {
            JSONArray values = root.getJSONArray("items");
            for (int i = 0; i < values.length(); i++) if (values.getJSONObject(i).getString("id").equals(id)) return new MailAccount(values.getJSONObject(i));
        }
        throw new MailFailure("ACCOUNT_MISSING");
    }
    JSONObject saveAccount(MailAccount account) throws Exception {
        JSONObject root = store.read("accounts");
        JSONArray values = root == null ? new JSONArray() : root.getJSONArray("items");
        if (account.provider.equals("gmail")) for (int n = 0; n < values.length(); n++) {
            MailAccount existing = new MailAccount(values.getJSONObject(n));
            if (existing.provider.equals("gmail") && existing.email.equalsIgnoreCase(account.email)) return existing.publicJson();
        }
        if (values.length() >= 20) throw new MailFailure("ACCOUNT_LIMIT");
        values.put(account.privateJson());
        store.write("accounts", new JSONObject().put("items", values));
        return account.publicJson();
    }
    void removeAccount(String id) throws Exception {
        account(id);
        JSONArray values = store.read("accounts").getJSONArray("items"), result = new JSONArray();
        for (int i = 0; i < values.length(); i++) if (!values.getJSONObject(i).getString("id").equals(id)) result.put(values.getJSONObject(i));
        store.write("accounts", new JSONObject().put("items", result));
        // Preserve local drafts and send receipts; removing a login must not destroy user content.
    }
    JSONArray folders(MailAccount account) throws Exception {
        try (IMAPStore connection = imap(account)) {
            JSONArray result = new JSONArray();
            Folder[] folders = connection.getDefaultFolder().list("*");
            if (folders.length > 1000) throw new MailFailure("MESSAGE_TOO_LARGE");
            for (Folder folder : folders) {
                if ((folder.getType() & Folder.HOLDS_MESSAGES) == 0) continue;
                result.put(new JSONObject().put("path", folder.getFullName()).put("name", folder.getName()).put("specialUse", special(folder)));
            }
            return result;
        }
    }
    private String special(Folder folder) throws Exception {
        if (folder instanceof IMAPFolder) for (String attribute : ((IMAPFolder) folder).getAttributes()) {
            for (String use : new String[] {"\\Sent", "\\Drafts", "\\Trash", "\\Junk", "\\Archive"})
                if (attribute.equalsIgnoreCase(use)) return use;
        }
        return "";
    }
    private IMAPFolder open(IMAPStore connection, String name, String validity, boolean write) throws Exception {
        MailAccount.header(name, 1000);
        IMAPFolder folder = (IMAPFolder) connection.getFolder(name);
        folder.open(write ? Folder.READ_WRITE : Folder.READ_ONLY);
        if (validity != null && !Long.toString(folder.getUIDValidity()).equals(validity)) {
            folder.close(false);
            throw new MailFailure("FOLDER_CHANGED");
        }
        return folder;
    }
    JSONObject messages(MailAccount account, String name, long before) throws Exception {
        try (IMAPStore connection = imap(account)) {
            IMAPFolder folder = open(connection, name, null, false);
            try {
                // Resolve a UID boundary on the server, then fetch at most one envelope page.
                int end = folder.getMessageCount();
                if (before > 0 && end > 0) {
                    int lo = 1, hi = end;
                    while (lo <= hi) {
                        int mid = lo + (hi - lo) / 2;
                        long uid = folder.getUID(folder.getMessage(mid));
                        if (uid >= before) hi = mid - 1; else lo = mid + 1;
                    }
                    end = hi;
                }
                int start = Math.max(1, end - 49);
                Message[] messages = end < 1 ? new Message[0] : folder.getMessages(start, end);
                FetchProfile profile = new FetchProfile();
                profile.add(FetchProfile.Item.FLAGS);
                profile.add(FetchProfile.Item.SIZE); profile.add(javax.mail.UIDFolder.FetchProfileItem.UID);
                folder.fetch(messages, profile);
                // ENVELOPE fetches metadata only, never message bodies or attachments.
                // A page of large newsletters still needs its real subjects and senders.
                FetchProfile envelopes = new FetchProfile(); envelopes.add(FetchProfile.Item.ENVELOPE);
                folder.fetch(messages, envelopes);
                JSONArray items = new JSONArray();
                long last = 0;
                for (int i = messages.length - 1; i >= 0; i--) {
                    Message message = messages[i]; last = folder.getUID(message);
                    JSONArray flags = new JSONArray();
                    if (message.isSet(Flags.Flag.SEEN)) flags.put("\\Seen");
                    if (message.isSet(Flags.Flag.FLAGGED)) flags.put("\\Flagged");
                    Date date = message.getSentDate();
                    String subject = message.getSubject() != null ? message.getSubject() : "";
                    String sender = MailMime.addresses(message.getFrom());
                    items.put(new JSONObject().put("uid", last).put("subject", subject.substring(0, Math.min(1024, subject.length())))
                        .put("from", sender.substring(0, Math.min(2000, sender.length()))).put("date", date == null ? "" : date.toString())
                        .put("oversized", message.getSize() > MailMime.MAX_RAW).put("detailsPending", false)
                        .put("flags", flags).put("size", message.getSize()));
                }
                return new JSONObject().put("validity", Long.toString(folder.getUIDValidity())).put("total", folder.getMessageCount()).put("items", items)
                    .put("next", start > 1 && last > 0 ? last : JSONObject.NULL);
            } finally { folder.close(false); }
        }
    }
    byte[] raw(MailAccount account, String name, String validity, long uid) throws Exception {
        if (uid < 1 || uid > 4294967295L || validity == null || !validity.matches("[0-9]{1,10}")) throw new MailFailure("INVALID_INPUT");
        try (IMAPStore connection = imap(account)) {
            IMAPFolder folder = open(connection, name, validity, false);
            try {
                Message message = folder.getMessageByUID(uid);
                if (message == null) throw new MailFailure("MESSAGE_MISSING");
                return MailMime.bytes(message);
            } finally { folder.close(false); }
        }
    }
    JSONObject message(MailAccount account, String name, String validity, long uid) throws Exception {
        return MailMime.parse(raw(account, name, validity, uid), session());
    }
    void createFolder(MailAccount account, String name) throws Exception {
        MailAccount.header(name, 200);
        if (name.trim().isEmpty()) throw new MailFailure("INVALID_INPUT");
        try (IMAPStore connection = imap(account)) {
            if (!connection.getFolder(name).create(Folder.HOLDS_MESSAGES)) throw new MailFailure("FOLDER_FAILED");
        }
    }
    void action(MailAccount account, String name, String validity, long uid, String action, String target) throws Exception {
        if (uid < 1 || uid > 4294967295L || validity == null || !validity.matches("[0-9]{1,10}")) throw new MailFailure("INVALID_INPUT");
        try (IMAPStore connection = imap(account)) {
            IMAPFolder folder = open(connection, name, validity, true);
            try {
                Message message = folder.getMessageByUID(uid);
                if (message == null) throw new MailFailure("MESSAGE_MISSING");
                switch (action) {
                    case "read": case "unread": message.setFlag(Flags.Flag.SEEN, action.equals("read")); break;
                    case "star": case "unstar": message.setFlag(Flags.Flag.FLAGGED, action.equals("star")); break;
                    case "move":
                        MailAccount.header(target, 1000);
                        if (name.equals(target) || !connection.hasCapability("MOVE")) throw new MailFailure("MOVE_UNSUPPORTED");
                        Folder destination = connection.getFolder(target);
                        if (!destination.exists()) throw new MailFailure("FOLDER_FAILED");
                        folder.moveMessages(new Message[] {message}, destination);
                        break;
                    case "delete":
                        if (!special(folder).equals("\\Trash") || !connection.hasCapability("UIDPLUS")) throw new MailFailure("DELETE_UNSUPPORTED");
                        message.setFlag(Flags.Flag.DELETED, true);
                        folder.expunge(new Message[] {message});
                        break;
                    default: throw new MailFailure("INVALID_INPUT");
                }
            } finally { folder.close(false); }
        }
    }
    JSONObject send(MailAccount account, JSONObject draft) throws Exception {
        Session session = session();
        byte[] mime = MailMime.bytes(MailMime.compose(account, draft, session));
        MailOutbox.Delivery delivery = new MailOutbox.Delivery() {
            SMTPTransport transport;
            public void connect() throws Exception { transport = smtp(account); }
            public void send(byte[] raw) throws Exception {
                MimeMessage message = new MimeMessage(session, new ByteArrayInputStream(raw));
                transport.sendMessage(message, message.getAllRecipients());
            }
            public void close() { if (transport != null) try { transport.close(); } catch (Exception ignored) { } }
        };
        JSONObject result = new MailOutbox(store).send(account.id, draft, mime, delivery);
        if (result.optBoolean("newlySent")) {
            result.remove("newlySent");
            result.put("noticeCode", "SENT_COPY_UNCONFIRMED");
            try {
                // Record 'sent' before this optional copy. A failure here must never resend SMTP.
                try (IMAPStore connection = imap(account)) {
                    Folder sent = null;
                    for (Folder folder : connection.getDefaultFolder().list("*")) if (special(folder).equals("\\Sent")) { sent = folder; break; }
                    if (sent == null) {
                        sent = connection.getFolder("Sent");
                        if (!sent.exists() && !sent.create(Folder.HOLDS_MESSAGES)) throw new MailFailure("FOLDER_FAILED");
                    }
                    MimeMessage copy = new MimeMessage(session, new ByteArrayInputStream(mime));
                    copy.removeHeader("Bcc");
                    copy.setFlag(Flags.Flag.SEEN, true);
                    sent.appendMessages(new Message[] {copy});
                }
                String key = "outbox-" + account.id + "-" + draft.getString("submission");
                JSONObject record = store.read(key);
                record.put("noticeCode", "");
                store.write(key, record);
                result.put("noticeCode", "");
            } catch (Exception ignored) { /* SMTP success remains durable even if the sent copy is uncertain. */ }
            try { store.remove("draft-" + draft.getString("submission")); } catch (Exception ignored) { }
        }
        return result;
    }
    void saveDraft(MailAccount account, JSONObject draft) throws Exception {
        MailAccount.uuid(draft.getString("submission"));
        if (draft.optString("text").length() > MailMime.MAX_TEXT || draft.toString().length() > 10 * 1024 * 1024) throw new MailFailure("MESSAGE_TOO_LARGE");
        store.write("draft-" + draft.getString("submission"), new JSONObject().put("account", account.id)
            .put("draft", draft).put("created", System.currentTimeMillis()));
    }
    JSONArray saved(String account) throws Exception {
        JSONArray result = new JSONArray();
        for (String prefix : new String[] {"draft-", "outbox-"}) for (String name : store.names(prefix)) {
            JSONObject record = store.read(name);
            if (record == null || !record.getString("account").equals(account)) continue;
            JSONObject draft = record.getJSONObject("draft");
            if (prefix.equals("draft-") && store.read("outbox-" + account + "-" + draft.getString("submission")) != null) continue;
            result.put(new JSONObject().put("id", name).put("status", record.optString("status", "draft"))
                .put("subject", draft.optString("subject")).put("to", draft.optString("to"))
                .put("created", record.getLong("created")));
        }
        return result;
    }
    JSONObject savedDraft(String account, String id) throws Exception {
        if (!id.startsWith("draft-") && !id.startsWith("outbox-")) throw new MailFailure("INVALID_INPUT");
        JSONObject record = store.read(id);
        if (record == null || !record.getString("account").equals(account)) throw new MailFailure("MESSAGE_MISSING");
        String status = record.optString("status", "draft");
        if (status.equals("draft")) {
            JSONObject attempt = store.read("outbox-" + account + "-" + record.getJSONObject("draft").getString("submission"));
            if (attempt != null && !attempt.getString("status").equals("queued")) throw new MailFailure("SEND_UNCERTAIN");
        }
        if (!status.equals("draft") && !status.equals("queued")) throw new MailFailure("SEND_UNCERTAIN");
        return record.getJSONObject("draft");
    }
}
