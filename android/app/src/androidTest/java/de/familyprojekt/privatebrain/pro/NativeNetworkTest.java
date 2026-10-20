package de.familyprojekt.privatebrain.pro;

import android.content.Context;
import androidx.test.core.app.ActivityScenario;
import androidx.test.core.app.ApplicationProvider;
import androidx.test.ext.junit.runners.AndroidJUnit4;
import java.io.File;
import java.net.ServerSocket;
import java.net.Socket;
import java.net.SocketTimeoutException;
import java.security.KeyStore;
import java.util.UUID;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicReference;
import org.json.JSONArray;
import org.json.JSONObject;
import org.junit.After;
import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;
import static org.junit.Assert.*;

@RunWith(AndroidJUnit4.class)
public class NativeNetworkTest {
    private Context context;private boolean previous;
    @Before public void online() throws Exception {
        context=ApplicationProvider.getApplicationContext();AppNetwork.initialize(context);previous=AppNetwork.isOffline();AppNetwork.setOffline(context,false);
    }
    @After public void restore() throws Exception { AppNetwork.setOffline(context,previous); }
    @Test public void offlineClosesExistingMailSocketAndBlocksNewTransportBeforeConnect() throws Exception {
        try(ServerSocket server=new ServerSocket(0);Socket client=new AppSocketFactory().createSocket()) {
            client.connect(new java.net.InetSocketAddress("127.0.0.1",server.getLocalPort()));
            try(Socket accepted=server.accept()) {
                AppNetwork.setOffline(context,true);assertTrue(client.isClosed());accepted.setSoTimeout(1500);assertEquals(-1,accepted.getInputStream().read());
            }
            try { com.sun.mail.util.SocketFetcher.getSocket("127.0.0.1",server.getLocalPort(),MailAccount.properties(),"mail.imaps",true);fail("Offline mail connected"); }
            catch(java.io.IOException expected) { assertEquals("APP_OFFLINE",ProMailPlugin.code(expected)); }
            server.setSoTimeout(300);
            try { server.accept().close();fail("Socket factory fell back to an ungated connection"); } catch(SocketTimeoutException expected) { }
            try { new GmailUserInfo(url->{throw new AssertionError("Offline identity lookup attempted HTTP");}).email("synthetic");fail(); }
            catch(AppNetwork.Blocked expected) { }
            AppNetwork.setOffline(context,false);
            try(Socket resumed=new AppSocketFactory().createSocket()) { resumed.connect(new java.net.InetSocketAddress("127.0.0.1",server.getLocalPort()));try(Socket accepted=server.accept()){assertTrue(resumed.isConnected());} }
        }
    }
    @Test public void offlineKeepsAccountsAndDraftsAndDoesNotResendInterruptedSubmission() throws Exception {
        String unique="network-test-"+UUID.randomUUID();EncryptedMailStore store=new EncryptedMailStore(context,unique,unique);
        try {
            MailEngine engine=new MailEngine(store);
            MailAccount account=new MailAccount(new JSONObject().put("provider","webde").put("email","fixture@webde.invalid").put("password","synthetic").put("imap","imap.web.de").put("smtp","smtp.web.de"));engine.saveAccount(account);
            JSONObject draft=new JSONObject().put("submission",UUID.randomUUID().toString()).put("to","fixture@example.invalid").put("cc","").put("bcc","").put("subject","Unsent offline draft").put("text","Keep this text").put("attachments",new JSONArray());engine.saveDraft(account,draft);
            String before=engine.accounts().toString();AppNetwork.setOffline(context,true);
            assertEquals(before,engine.accounts().toString());assertEquals(draft.toString(),engine.savedDraft(account.id,"draft-"+draft.getString("submission")).toString());
            try { engine.send(account,draft);fail("Offline send accepted"); } catch(AppNetwork.Blocked expected) { }
            assertEquals(0,store.names("outbox-").size());
            AppNetwork.setOffline(context,false);int[] sends={0};
            MailOutbox.Delivery interrupted=new MailOutbox.Delivery(){public void connect(){}public void send(byte[] data)throws Exception{sends[0]++;AppNetwork.setOffline(context,true);throw new AppNetwork.Blocked();}public void close(){}};
            assertEquals("uncertain",new MailOutbox(store).send(account.id,draft,new byte[]{1,2,3},interrupted).getString("status"));
            AppNetwork.setOffline(context,false);
            assertEquals("uncertain",new MailOutbox(store).send(account.id,draft,new byte[]{1,2,3},interrupted).getString("status"));assertEquals(1,sends[0]);
            assertEquals(before,new MailEngine(new EncryptedMailStore(context,unique,unique)).accounts().toString());
        } finally {
            File dir=new File(context.getNoBackupFilesDir(),unique);File[] files=dir.listFiles();if(files!=null)for(File file:files)file.delete();dir.delete();
            KeyStore keys=KeyStore.getInstance("AndroidKeyStore");keys.load(null);keys.deleteEntry(unique);
        }
    }
    private String eval(ActivityScenario<MainActivity> scenario,String script)throws Exception {
        CountDownLatch done=new CountDownLatch(1);AtomicReference<String> result=new AtomicReference<>();scenario.onActivity(activity->activity.getBridge().getWebView().evaluateJavascript(script,value->{result.set(value);done.countDown();}));assertTrue(done.await(10,TimeUnit.SECONDS));return result.get();
    }
    private void await(ActivityScenario<MainActivity> scenario,String script)throws Exception {
        long until=System.nanoTime()+TimeUnit.SECONDS.toNanos(60);while(System.nanoTime()<until){if("true".equals(eval(scenario,script)))return;Thread.sleep(100);}fail(script);
    }
    @Test public void nativeSwitchSurvivesRestartKeepsLocalAssetsAndCanBeEnabledAgain()throws Exception {
        try(ActivityScenario<MainActivity> app=ActivityScenario.launch(MainActivity.class)) {
            await(app,"Boolean(window.PBNetwork?.ready && window.PBWorkspace && typeof db!=='undefined' && db)");
            eval(app,"localStorage.setItem('offline-sentinel','keep');document.querySelector('.native-options>summary').click();document.querySelector('.native-offline-switch').click();true");
            await(app,"PBNetwork.ready && PBNetwork.offline && !document.querySelector('.native-offline-switch').disabled");assertTrue(AppNetwork.isOffline());
            eval(app,"window.Capacitor.Plugins.ProUpdates.check().catch(e=>window.__offlineUpdate=e.code);fetch('https://network.example.invalid/pixel').catch(e=>window.__offlineFetch=e.message);fetch('native.css').then(r=>r.text()).then(s=>window.__localCss=s.includes('.native-status'));true");
            await(app,"window.__offlineUpdate==='APP_OFFLINE' && window.__offlineFetch==='APP_OFFLINE' && window.__localCss===true");
            app.recreate();await(app,"Boolean(window.PBNetwork?.ready && PBNetwork.offline && window.PBWorkspace && typeof db!=='undefined' && db)");
            assertEquals("\"keep\"",eval(app,"localStorage.getItem('offline-sentinel')"));
            eval(app,"PBWorkspace.navigate('explorer');window.Capacitor.Plugins.ProMail.accounts().then(a=>window.__localAccounts=Array.isArray(a.items));true");await(app,"window.__localAccounts===true && document.querySelector('#panel-explorer').classList.contains('on')");
            eval(app,"document.querySelector('.native-options>summary').click();document.querySelector('.native-offline-switch').click();true");await(app,"PBNetwork.ready && !PBNetwork.offline && !document.querySelector('.native-offline-switch').disabled");assertFalse(AppNetwork.isOffline());
            app.onActivity(activity->assertFalse(activity.getBridge().getWebView().getSettings().getBlockNetworkLoads()));
            assertTrue(AppNetwork.external("https://network.example.invalid/image"));assertFalse(AppNetwork.external("https://localhost/native.css"));
        }
    }
}
