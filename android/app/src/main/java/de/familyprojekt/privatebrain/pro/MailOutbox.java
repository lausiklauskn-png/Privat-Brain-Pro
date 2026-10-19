package de.familyprojekt.privatebrain.pro;

import android.util.Base64;
import org.json.JSONObject;

/** Durable intent before SMTP. An ambiguous attempt is never automatically repeated. */
final class MailOutbox {
    interface Delivery {
        void connect() throws Exception;
        void send(byte[] message) throws Exception;
        void close();
    }
    private final EncryptedMailStore store;
    MailOutbox(EncryptedMailStore store) { this.store = store; }

    JSONObject send(String account, JSONObject draft, byte[] prepared, Delivery delivery) throws Exception {
        MailAccount.uuid(account);
        String submission = draft.getString("submission");
        MailAccount.uuid(submission);
        String name = "outbox-" + account + "-" + submission;
        String fingerprint = MailMime.fingerprint(draft);
        JSONObject record = store.read(name);
        if (record != null) {
            if (!record.getString("fingerprint").equals(fingerprint)) throw new MailFailure("SEND_CHANGED");
            if (record.getString("status").equals("sent")) return new JSONObject().put("status", "sent")
                .put("noticeCode", record.optString("noticeCode"));
            if (!record.getString("status").equals("queued")) return uncertain();
        } else {
            record = new JSONObject().put("account", account).put("submission", submission)
                .put("status", "queued").put("fingerprint", fingerprint).put("draft", draft)
                .put("created", System.currentTimeMillis()).put("mime", Base64.encodeToString(prepared, Base64.NO_WRAP));
            store.write(name, record);
        }
        boolean possiblySent = false;
        try {
            // Connecting/authenticating cannot send a message; retrying this stage is safe.
            delivery.connect();
            record.put("status", "sending");
            store.write(name, record);
            possiblySent = true;
            delivery.send(Base64.decode(record.getString("mime"), Base64.NO_WRAP));
            record.put("status", "sent").put("noticeCode", "SENT_COPY_UNCONFIRMED");
            store.write(name, record);
            return new JSONObject().put("status", "sent").put("newlySent", true);
        } catch (Exception error) {
            if (!possiblySent) throw error;
            record.put("status", "uncertain");
            try { store.write(name, record); } catch (Exception ignored) { /* Durable 'sending' is also an ambiguous receipt. */ }
            return uncertain();
        } finally {
            delivery.close();
        }
    }
    private JSONObject uncertain() throws Exception {
        return new JSONObject().put("status", "uncertain").put("noticeCode", "SEND_UNCERTAIN");
    }
}
