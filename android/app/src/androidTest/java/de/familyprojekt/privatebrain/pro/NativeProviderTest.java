package de.familyprojekt.privatebrain.pro;

import android.content.Context;
import androidx.test.core.app.ApplicationProvider;
import androidx.test.ext.junit.runners.AndroidJUnit4;
import java.io.File;
import java.nio.charset.StandardCharsets;
import java.security.KeyStore;
import java.util.UUID;
import org.json.JSONArray;
import org.json.JSONObject;
import org.junit.After;
import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;
import static org.junit.Assert.*;

@RunWith(AndroidJUnit4.class)
public class NativeProviderTest {
    private Context context;
    private String directory,alias,secret;
    private EncryptedMailStore store;
    @Before public void create(){
        context=ApplicationProvider.getApplicationContext();String unique=UUID.randomUUID().toString();
        directory="provider-test-"+unique;alias="provider-test-"+unique;secret=UUID.randomUUID().toString();
        store=new EncryptedMailStore(context,directory,alias);
    }
    @After public void cleanup()throws Exception{
        File folder=new File(context.getNoBackupFilesDir(),directory);File[] files=folder.listFiles();
        if(files!=null)for(File file:files)file.delete();folder.delete();
        KeyStore keys=KeyStore.getInstance("AndroidKeyStore");keys.load(null);keys.deleteEntry(alias);
    }
    private JSONObject input(MailProvider provider)throws Exception{
        JSONObject input=new JSONObject().put("provider",provider.id).put("email","fixture@"+provider.id+".invalid")
            .put("imap",provider.imap).put("smtp",provider.smtp);
        if(provider==MailProvider.GOOGLE)input.put("authType","oauth2");else input.put("password",secret);
        return input;
    }
    @Test public void allSevenTemplatesSurviveEncryptedReopeningWithoutChangingExistingAccountsOrDrafts()throws Exception{
        MailEngine engine=new MailEngine(store);JSONArray before=new JSONArray();MailAccount web=null;
        for(MailProvider provider:MailProvider.values())if(provider.ready()){
            MailAccount account=new MailAccount(input(provider));before.put(engine.saveAccount(account));
            assertFalse(account.publicJson().has("password"));assertEquals(provider.id,account.provider);
            assertEquals(account.email,account.user);
            for(String protocol:new String[]{"imaps","smtps"}){
                var properties=MailAccount.properties(account.authType);
                assertEquals("true",properties.getProperty("mail."+protocol+".ssl.enable"));
                assertEquals("true",properties.getProperty("mail."+protocol+".ssl.checkserveridentity"));
            }
            if(provider==MailProvider.WEBDE)web=account;
        }
        assertEquals(7,before.length());assertNotNull(web);
        JSONObject draft=new JSONObject().put("submission",UUID.randomUUID().toString()).put("to","receiver@example.invalid")
            .put("cc","").put("bcc","").put("subject","Existing unsent draft").put("text","Keep my draft").put("attachments",new JSONArray());
        engine.saveDraft(web,draft);
        MailEngine reopened=new MailEngine(new EncryptedMailStore(context,directory,alias));
        assertEquals(before.toString(),reopened.accounts().toString());
        assertEquals(draft.toString(),reopened.savedDraft(web.id,"draft-"+draft.getString("submission")).toString());
        assertEquals(7,reopened.accounts().length());
        for(File file:new File(context.getNoBackupFilesDir(),directory).listFiles())if(file.isFile()){
            String encrypted=new String(java.nio.file.Files.readAllBytes(file.toPath()),StandardCharsets.UTF_8);
            assertFalse(encrypted.contains(secret));assertFalse(encrypted.contains(web.email));assertFalse(encrypted.contains("Keep my draft"));
        }
        // Old password records without authType still load; the custom Hetzner server stays editable.
        MailAccount old=new MailAccount(input(MailProvider.HETZNER).put("imap","imap.custom.invalid").put("smtp","smtp.custom.invalid"));
        assertEquals("password",old.authType);assertEquals("imap.custom.invalid",old.imap);
    }
    private void rejected(JSONObject value,String code)throws Exception{
        try{new MailAccount(value);fail("Unsafe or unavailable provider accepted");}catch(MailFailure failure){assertEquals(code,failure.code);}
    }
    @Test public void fixedProviderServersCannotBeRedirectedAndMicrosoftNeverFallsBackToPassword()throws Exception{
        for(MailProvider provider:MailProvider.values())if(provider.ready()&&!provider.editable){
            rejected(input(provider).put("imap","imap.other.invalid"),"INVALID_INPUT");
            rejected(input(provider).put("smtp","smtp.other.invalid"),"INVALID_INPUT");
            if(provider!=MailProvider.TELEKOM)rejected(input(provider).put("user","another@example.invalid"),"INVALID_INPUT");
            if(provider!=MailProvider.GOOGLE)rejected(input(provider).put("authType","oauth2"),"INVALID_INPUT");
        }
        rejected(input(MailProvider.MICROSOFT),"PROVIDER_SETUP_REQUIRED");
        rejected(input(MailProvider.MICROSOFT).put("authType","oauth2"),"PROVIDER_SETUP_REQUIRED");
        rejected(input(MailProvider.TELEKOM).put("provider","unknown"),"INVALID_INPUT");
        assertEquals(0,new MailEngine(store).accounts().length());
    }
}
