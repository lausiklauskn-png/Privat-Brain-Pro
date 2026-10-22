package de.familyprojekt.privatebrain.pro;

import android.util.Base64;
import com.sun.mail.imap.IMAPFolder;
import com.sun.mail.imap.IMAPStore;
import com.sun.mail.smtp.SMTPTransport;
import java.io.ByteArrayInputStream;
import java.io.File;
import java.io.FileOutputStream;
import java.io.OutputStream;
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
    private final Vault vault;
    MailEngine(EncryptedMailStore store) { this(store, null, null); }
    MailEngine(EncryptedMailStore store, OAuthProvider oauth) { this(store, oauth, null); }
    MailEngine(EncryptedMailStore store, OAuthProvider oauth, Vault vault) { this.store = store;this.oauth = oauth;this.vault = vault; }
    private boolean vaultMode() { return vault != null && vault.configured(); }
    private Session session() { return Session.getInstance(MailAccount.properties()); }
    private Session session(MailAccount account) { return Session.getInstance(MailAccount.properties(account.authType)); }
    private String credential(MailAccount account) throws Exception {
        AppNetwork.check();
        if (!account.authType.equals("oauth2")) return account.password;
        if (oauth == null) throw new MailFailure("GMAIL_AUTH_REQUIRED");return oauth.token(account.email);
    }
    private IMAPStore imap(MailAccount account) throws Exception { return imap(account, false); }
    private IMAPStore imap(MailAccount account, boolean large) throws Exception {
        AppNetwork.check();
        java.util.Properties properties = MailAccount.properties(account.authType);
        // Large downloads into the folder: fewer round trips for one message body.
        if (large) properties.setProperty("mail.imaps.fetchsize", Integer.toString(1024 * 1024));
        IMAPStore connection = (IMAPStore) Session.getInstance(properties).getStore("imaps");
        String credential = credential(account);
        try { connection.connect(account.imap, 993, account.authType.equals("oauth2")?GmailIdentity.key(account.user):account.user, credential); return connection; }
        catch (javax.mail.AuthenticationFailedException error) { try { connection.close(); } catch (Exception ignored) { } if (account.authType.equals("oauth2")) { oauth.invalidate(credential);throw new MailFailure("GMAIL_IMAP_AUTH_FAILED"); }throw error; }
        catch (Exception error) { try { connection.close(); } catch (Exception ignored) { } throw error; }
    }
    private SMTPTransport smtp(MailAccount account) throws Exception {
        AppNetwork.check();
        SMTPTransport connection = (SMTPTransport) session(account).getTransport("smtps");
        String credential = credential(account);
        try { connection.connect(account.smtp, 465, account.authType.equals("oauth2")?GmailIdentity.key(account.user):account.user, credential); return connection; }
        catch (javax.mail.AuthenticationFailedException error) { try { connection.close(); } catch (Exception ignored) { } if (account.authType.equals("oauth2")) { oauth.invalidate(credential);throw new MailFailure("GMAIL_SMTP_AUTH_FAILED"); }throw error; }
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
            if (existing.provider.equals("gmail") && GmailIdentity.same(existing.email,account.email)) {
                // Called only after explicit authorization and both server logins have succeeded.
                // Repair the alias from older previews without changing account/draft IDs.
                MailAccount updated = new MailAccount(account.privateJson().put("id",existing.id));
                values.put(n,updated.privateJson());store.write("accounts",new JSONObject().put("items",values));
                return updated.publicJson();
            }
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
                result.put(new JSONObject().put("path", folder.getFullName()).put("name", folder.getName()).put("specialUse", special(folder)).put("collection", collection(folder)));
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
    /** Virtual views such as Gmail's "All Mail" or "Starred" repeat mails of other folders. */
    private boolean collection(Folder folder) throws Exception {
        if (folder instanceof IMAPFolder) for (String attribute : ((IMAPFolder) folder).getAttributes())
            if (attribute.equalsIgnoreCase("\\All") || attribute.equalsIgnoreCase("\\Flagged") || attribute.equalsIgnoreCase("\\Important")) return true;
        return false;
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
                        .put("oversized", message.getSize() > (vaultMode() ? Vault.MAX_MESSAGE : MailMime.MAX_RAW)).put("detailsPending", false)
                        .put("flags", flags).put("size", message.getSize()));
                }
                return new JSONObject().put("validity", Long.toString(folder.getUIDValidity())).put("total", folder.getMessageCount()).put("items", items)
                    .put("next", start > 1 && last > 0 ? last : JSONObject.NULL);
            } finally { folder.close(false); }
        }
    }
    /**
     * Sorting index: one page of headers received since a date, newest first, below an optional UID.
     * Reads ENVELOPE, flags and four list headers only; never bodies or attachments, never sets \Seen.
     */
    JSONObject index(MailAccount account, String name, long since, long before) throws Exception {
        if (since < 0 || before < 0 || before > 4294967295L) throw new MailFailure("INVALID_INPUT");
        try (IMAPStore connection = imap(account)) {
            IMAPFolder folder = open(connection, name, null, false);
            try {
                Message[] found = folder.search(new javax.mail.search.ReceivedDateTerm(javax.mail.search.ComparisonTerm.GE, new Date(since)));
                FetchProfile uids = new FetchProfile(); uids.add(javax.mail.UIDFolder.FetchProfileItem.UID);
                folder.fetch(found, uids);
                java.util.List<Message> candidates = new java.util.ArrayList<>();
                for (Message message : found) { long uid = folder.getUID(message); if (uid > 0 && (before == 0 || uid < before)) candidates.add(message); }
                candidates.sort((a, b) -> { try { return Long.compare(folder.getUID(b), folder.getUID(a)); } catch (Exception error) { return 0; } });
                boolean more = candidates.size() > MailIndex.PAGE;
                Message[] page = candidates.subList(0, Math.min(MailIndex.PAGE, candidates.size())).toArray(new Message[0]);
                FetchProfile profile = new FetchProfile();
                profile.add(FetchProfile.Item.FLAGS); profile.add(FetchProfile.Item.SIZE); profile.add(FetchProfile.Item.ENVELOPE);
                for (String header : new String[] {"Message-ID", "List-Unsubscribe", "List-Unsubscribe-Post", "List-Id", "Precedence"}) profile.add(header);
                folder.fetch(page, profile);
                JSONArray items = new JSONArray();
                long last = 0;
                for (Message message : page) {
                    MailIndex.Head head = MailIndex.head(message, last = folder.getUID(message));
                    items.put(new JSONObject().put("uid", head.uid).put("messageId", head.messageId).put("from", head.from).put("subject", head.subject)
                        .put("date", head.date).put("size", head.size).put("seen", head.seen).put("flagged", head.flagged).put("list", head.list).put("bulk", head.bulk)
                        .put("unsubscribe", head.unsubscribe).put("oneClick", head.oneClick));
                }
                return new JSONObject().put("validity", Long.toString(folder.getUIDValidity())).put("items", items)
                    .put("next", more && last > 0 ? last : JSONObject.NULL);
            } finally { folder.close(false); }
        }
    }
    /** Undo for "in den Papierkorb": find one mail again by its Message-ID (exact match, read-only). */
    JSONObject locate(MailAccount account, String name, String messageId) throws Exception {
        if (MailIndex.messageId(new String[] {messageId}).isEmpty()) throw new MailFailure("INVALID_INPUT");
        try (IMAPStore connection = imap(account)) {
            IMAPFolder folder = open(connection, name, null, false);
            try {
                Message[] found = folder.search(new javax.mail.search.HeaderTerm("Message-ID", messageId));
                long uid = 0;
                for (Message message : found) if (MailIndex.messageId(message.getHeader("Message-ID")).equals(messageId)) uid = Math.max(uid, folder.getUID(message));
                return new JSONObject().put("validity", Long.toString(folder.getUIDValidity())).put("uid", uid > 0 ? uid : JSONObject.NULL);
            } finally { folder.close(false); }
        }
    }
    /** Readable text of a few messages for the sorting index; attachment parts are skipped unread. */
    JSONObject indexText(MailAccount account, String name, String validity, JSONArray uids) throws Exception {
        if (validity == null || !validity.matches("[0-9]{1,10}") || uids == null || uids.length() < 1 || uids.length() > MailIndex.TEXT_BATCH) throw new MailFailure("INVALID_INPUT");
        try (IMAPStore connection = imap(account)) {
            IMAPFolder folder = open(connection, name, validity, false);
            try {
                JSONArray items = new JSONArray();
                for (int i = 0; i < uids.length(); i++) {
                    long uid = uids.optLong(i, -1);
                    if (uid < 1 || uid > 4294967295L) throw new MailFailure("INVALID_INPUT");
                    Message message = folder.getMessageByUID(uid);
                    if (message == null) continue;
                    MailIndex.Body body;
                    try { body = MailIndex.body(message); }
                    catch (Exception unreadable) { body = new MailIndex.Body(); /* Listed by header only. */ }
                    items.put(new JSONObject().put("uid", uid).put("text", body.text).put("html", body.html).put("attachments", body.attachments));
                }
                return new JSONObject().put("items", items);
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
        if (vaultMode()) return vaultMessage(account, name, validity, uid);
        return MailMime.parse(raw(account, name, validity, uid), session());
    }
    /**
     * Folder mode: an opened mail is kept encrypted in the folder; its attachments are
     * streamed there piece by piece (up to 1 GB each) and never pass through the page.
     */
    private JSONObject vaultMessage(MailAccount account, String name, String validity, long uid) throws Exception {
        if (uid < 1 || uid > 4294967295L || validity == null || !validity.matches("[0-9]{1,10}")) throw new MailFailure("INVALID_INPUT");
        vault.requireUnlocked();
        String key = vault.mailKey(account.email, name, validity, uid);
        JSONObject cached = vault.loadMail(key);
        if (cached != null) return vault.withAttachmentState(cached);
        File temp = vault.temporary();
        try {
            try (IMAPStore connection = imap(account, true)) {
                IMAPFolder folder = open(connection, name, validity, false);
                try {
                    Message message = folder.getMessageByUID(uid);
                    if (message == null) throw new MailFailure("MESSAGE_MISSING");
                    long size = message.getSize();
                    if (size > Vault.MAX_MESSAGE) throw new MailFailure("MESSAGE_TOO_LARGE");
                    long free = vault.free();
                    // Download copy in app storage plus the encrypted copy in the folder.
                    if (temp.getParentFile().getUsableSpace() < size + 64L * 1024 * 1024 || (free >= 0 && free < size + 64L * 1024 * 1024))
                        throw new MailFailure("STORAGE_FULL");
                    try (OutputStream out = new java.io.BufferedOutputStream(new FileOutputStream(temp), 256 * 1024)) {
                        message.writeTo(new java.io.FilterOutputStream(out) {
                            long written;
                            @Override public void write(int b) throws java.io.IOException { write(new byte[] {(byte) b}, 0, 1); }
                            @Override public void write(byte[] data, int offset, int length) throws java.io.IOException {
                                if ((written += length) > Vault.MAX_MESSAGE) throw new java.io.IOException("MESSAGE_TOO_LARGE");
                                out.write(data, offset, length);
                            }
                        });
                    }
                } finally { folder.close(false); }
            }
            JSONObject mail = MailMime.parseFile(temp, session(), vault.sink(key, account.email));
            boolean complete = true;
            JSONArray parts = mail.getJSONArray("attachments");
            for (int i = 0; i < parts.length(); i++) if (parts.getJSONObject(i).optBoolean("failed")) complete = false;
            // An incomplete transfer is shown once but fetched again next time.
            if (complete) vault.saveMail(key, mail);
            return vault.withAttachmentState(mail);
        } finally { temp.delete(); }
    }
    /** "Erneut laden": forget the folder copy of one mail; the next opening fetches it again. */
    void forgetMessage(MailAccount account, String name, String validity, long uid) throws Exception {
        if (!vaultMode()) return;
        vault.requireUnlocked();
        vault.forgetMail(vault.mailKey(account.email, name, validity, uid));
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
    /** The same actions for many mails over ONE connection (Klaus 2026-10-22: 50 mails took minutes, one login each). */
    JSONObject actions(MailAccount account, String name, String validity, JSONArray uids, String action, String target) throws Exception {
        if (validity == null || !validity.matches("[0-9]{1,10}") || uids == null || uids.length() < 1 || uids.length() > 500) throw new MailFailure("INVALID_INPUT");
        long[] list = new long[uids.length()];
        for (int i = 0; i < list.length; i++) {
            list[i] = uids.optLong(i, -1);
            if (list[i] < 1 || list[i] > 4294967295L) throw new MailFailure("INVALID_INPUT");
        }
        try (IMAPStore connection = imap(account)) {
            IMAPFolder folder = open(connection, name, validity, true);
            try {
                java.util.ArrayList<Message> found = new java.util.ArrayList<>();
                for (Message message : folder.getMessagesByUID(list)) if (message != null) found.add(message);
                Message[] messages = found.toArray(new Message[0]);
                if (messages.length > 0) switch (action) {
                    case "read": case "unread": folder.setFlags(messages, new Flags(Flags.Flag.SEEN), action.equals("read")); break;
                    case "star": case "unstar": folder.setFlags(messages, new Flags(Flags.Flag.FLAGGED), action.equals("star")); break;
                    case "move":
                        MailAccount.header(target, 1000);
                        if (name.equals(target) || !connection.hasCapability("MOVE")) throw new MailFailure("MOVE_UNSUPPORTED");
                        Folder destination = connection.getFolder(target);
                        if (!destination.exists()) throw new MailFailure("FOLDER_FAILED");
                        folder.moveMessages(messages, destination);
                        break;
                    case "delete":
                        if (!special(folder).equals("\\Trash") || !connection.hasCapability("UIDPLUS")) throw new MailFailure("DELETE_UNSUPPORTED");
                        folder.setFlags(messages, new Flags(Flags.Flag.DELETED), true);
                        folder.expunge(messages);
                        break;
                    default: throw new MailFailure("INVALID_INPUT");
                }
                return new JSONObject().put("ok", true).put("done", messages.length).put("missing", list.length - messages.length);
            } finally { folder.close(false); }
        }
    }
    JSONObject send(MailAccount account, JSONObject draft) throws Exception {
        AppNetwork.check();
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
                // Gmail's SMTP service saves its own Sent copy. Appending again would
                // duplicate that message in Gmail even though SMTP was sent only once.
                if (!account.provider.equals("gmail")) try (IMAPStore connection = imap(account)) {
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
