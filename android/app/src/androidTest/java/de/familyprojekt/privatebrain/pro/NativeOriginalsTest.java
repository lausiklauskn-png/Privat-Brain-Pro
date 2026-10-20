package de.familyprojekt.privatebrain.pro;

import android.content.Context;
import android.content.Intent;
import androidx.core.content.FileProvider;
import androidx.test.core.app.ApplicationProvider;
import androidx.test.ext.junit.runners.AndroidJUnit4;
import java.io.*;
import java.security.MessageDigest;
import java.util.*;
import org.json.JSONObject;
import org.junit.Test;
import org.junit.runner.RunWith;
import static org.junit.Assert.*;

@RunWith(AndroidJUnit4.class)
public class NativeOriginalsTest {
    private final Context context = ApplicationProvider.getApplicationContext();
    private static String digest(byte[] bytes) throws Exception {
        StringBuilder hex = new StringBuilder();for (byte b : MessageDigest.getInstance("SHA-256").digest(bytes)) hex.append(String.format(Locale.ROOT,"%02x",b & 255));return hex.toString();
    }
    private static byte[] bytes() { byte[] bytes = new byte[OriginalFileStore.CHUNK * 2 + 39];new Random(782341).nextBytes(bytes);return bytes; }
    @Test public void originalsSurviveStoreReopeningAndProviderSharesExactBytes() throws Exception {
        OriginalFileStore store = new OriginalFileStore(context);byte[] original = bytes();String hash = digest(original);
        JSONObject start = store.begin(hash,original.length,"original.bin","application/octet-stream");
        if (!start.optBoolean("stored")) {
            String ticket = start.getString("ticket");
            assertNull(store.info(hash));
            try { store.append(ticket,1,new byte[]{1});fail("Out-of-order append accepted"); } catch (IOException expected) { }
            for (int offset=0;offset<original.length;offset+=OriginalFileStore.CHUNK) store.append(ticket,offset,Arrays.copyOfRange(original,offset,Math.min(original.length,offset+OriginalFileStore.CHUNK)));
            assertNull(store.info(hash));store.finish(ticket);
        }
        OriginalFileStore reopened = new OriginalFileStore(context);
        assertEquals(original.length,reopened.info(hash).getLong("size"));
        assertEquals(hash,OriginalFileStore.digest(reopened.file(hash)));
        ByteArrayOutputStream read = new ByteArrayOutputStream();
        for (int offset=0;offset<original.length;offset+=OriginalFileStore.CHUNK) read.write(reopened.read(hash,offset));
        assertArrayEquals(original,read.toByteArray());
        var uri=FileProvider.getUriForFile(context,context.getPackageName()+".fileprovider",reopened.file(hash),"original.bin");
        try (android.database.Cursor cursor=context.getContentResolver().query(uri,new String[]{android.provider.OpenableColumns.DISPLAY_NAME},null,null,null)) {
            assertNotNull(cursor);assertTrue(cursor.moveToFirst());assertEquals("original.bin",cursor.getString(0));
        }
        try (InputStream stream=context.getContentResolver().openInputStream(uri)) {
            ByteArrayOutputStream result=new ByteArrayOutputStream();byte[] buffer=new byte[8192];int count;
            while ((count=stream.read(buffer))!=-1) result.write(buffer,0,count);
            assertArrayEquals(original,result.toByteArray());
        }
        assertTrue(reopened.begin(hash,original.length,"same.bin","").getBoolean("stored"));
    }
    @Test public void incompleteOrWrongHashImportsNeverPublishAndAbortKeepsCompleteCopies() throws Exception {
        OriginalFileStore store=new OriginalFileStore(context);String hash=digest("unpublished original".getBytes(java.nio.charset.StandardCharsets.UTF_8));
        String ticket=store.begin(hash,4,"bad.txt","text/plain").getString("ticket");
        try { store.finish(ticket);fail("Incomplete original published"); }catch(IOException expected) { }
        store.append(ticket,0,new byte[]{1,2,3,4});
        try { store.finish(ticket);fail("Wrong original hash published"); }catch(IOException expected) { }
        assertNull(store.info(hash));store.abort(ticket);assertNull(store.info(hash));
        try { store.info("../../accounts");fail("Path traversal accepted"); }catch(IOException expected) { }
    }
    @Test public void browserPolicyRejectsActiveLocalAndCredentialUrls() throws Exception {
        for(String url:new String[]{"javascript:alert(1)","data:text/html,abc","file:///etc/passwd","content://private/a","intent://x","https://user:secret@example.com/","http://127.0.0.1/","https://2130706433/","https://host.local/","https://[::1]/","https://example.com/\nsecret"})assertNull(url,BrowserLinks.allowed(url));
        assertEquals("https://example.com/news?a=1#article",BrowserLinks.allowed("https://example.com/news?a=1#article"));
        var tickets=BrowserLinks.prepare(new org.json.JSONArray().put("https://example.com/news").put("javascript:alert(1)"));
        assertEquals("",tickets.getString(1));String ticket=tickets.getString(0);
        assertEquals("https://example.com/news",BrowserLinks.resolve(android.net.Uri.parse("https://localhost"+BrowserLinks.PREFIX+ticket)));
        assertNull(BrowserLinks.resolve(android.net.Uri.parse("https://example.com"+BrowserLinks.PREFIX+ticket)));
        assertNull(BrowserLinks.resolve(android.net.Uri.parse("https://localhost"+BrowserLinks.PREFIX+"forged")));
    }
    @Test public void gmailAddsNoPasswordAndOldAccountFormatStillLoads() throws Exception {
        JSONObject old=new JSONObject().put("provider","telekom").put("email","fixture@example.com").put("password","fixture-only").put("imap","secureimap.t-online.de").put("smtp","securesmtp.t-online.de");
        assertEquals("password",new MailAccount(old).authType);assertEquals("fixture-only",new MailAccount(old).password);
        JSONObject google=new JSONObject().put("provider","gmail").put("authType","oauth2").put("email","fixture@gmail.com").put("imap","imap.gmail.com").put("smtp","smtp.gmail.com");
        MailAccount account=new MailAccount(google);assertEquals("oauth2",account.authType);assertFalse(account.privateJson().has("password"));
        for(String name:Arrays.asList("token","accessToken","refreshToken"))assertFalse(account.privateJson().has(name));
        try { new MailAccount(new JSONObject(google.toString()).put("password","forbidden"));fail("Google password accepted"); }catch(MailFailure expected) { }
        try { new MailAccount(new JSONObject(google.toString()).put("imap","different.example.com"));fail("OAuth credential may escape Gmail host"); }catch(MailFailure expected) { }
    }
}
