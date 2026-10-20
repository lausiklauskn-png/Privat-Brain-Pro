package de.familyprojekt.privatebrain.upgradeprobe;

import android.app.Activity;
import android.app.Instrumentation;
import android.content.Context;
import android.content.Intent;
import android.os.Bundle;
import android.view.View;
import android.view.ViewGroup;
import android.webkit.WebView;
import java.lang.reflect.Constructor;
import java.lang.reflect.Method;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicReference;
import org.json.JSONObject;

/** Installed only in the disposable CI emulator; never bundled in the app/release.
 * The matching signature lets Android run this instrumentation on non-debug APKs.
 * There is no WebView debugging endpoint and no application test hook.
 */
public final class UpgradeProbe extends Instrumentation {
    private static final String PREFIX = "de.familyprojekt.privatebrain.pro.";
    private static final String ID = "10b7ec23-2089-4cbd-95a3-64f0dd7a20b1";
    private String phase;
    private WebView web;
    private final CountDownLatch paused=new CountDownLatch(1);
    @Override public void onCreate(Bundle args) { super.onCreate(args); phase=args.getString("phase"); start(); }
    @Override public void callActivityOnPause(Activity activity) { super.callActivityOnPause(activity);paused.countDown(); }
    private static void require(boolean value, String message) {
        if (!value) throw new AssertionError(message);
    }
    private WebView find(View view) {
        if (view instanceof WebView) return (WebView)view;
        if (view instanceof ViewGroup) for (int n=0;n<((ViewGroup)view).getChildCount();n++) {
            WebView found=find(((ViewGroup)view).getChildAt(n)); if(found!=null)return found;
        }
        return null;
    }
    /** Null when the WebView has not answered within the given time. */
    private String evaluate(String script, long seconds) throws Exception {
        CountDownLatch done=new CountDownLatch(1); AtomicReference<String> value=new AtomicReference<>();
        runOnMainSync(()->web.evaluateJavascript(script,result->{value.set(result);done.countDown();}));
        return done.await(seconds,TimeUnit.SECONDS) ? value.get() : null;
    }
    private String js(String script) throws Exception {
        String value=evaluate(script,15);
        require(value!=null,"WebView response timed out"); return value;
    }
    private void await(String expression) throws Exception {
        long deadline=System.nanoTime()+TimeUnit.SECONDS.toNanos(90);
        while(System.nanoTime()<deadline) {
            // A first cold start of a freshly installed APK can leave the WebView silent
            // for longer than one poll. No answer means "not yet", within the same deadline.
            long left=TimeUnit.NANOSECONDS.toSeconds(deadline-System.nanoTime());
            if("true".equals(evaluate("Boolean("+expression+")",Math.max(1,Math.min(15,left)))))return;
            Thread.sleep(200);
        }
        throw new AssertionError("Failed condition: "+expression);
    }
    private Class<?> type(String name) throws Exception { return getTargetContext().getClassLoader().loadClass(PREFIX+name); }
    private Object construct(String name,Class<?>[] types,Object... args) throws Exception {
        Constructor<?> c=type(name).getDeclaredConstructor(types); c.setAccessible(true); return c.newInstance(args);
    }
    private Object call(Object object,String name,Class<?>[] types,Object... args) throws Exception {
        Method m=object.getClass().getDeclaredMethod(name,types);m.setAccessible(true);return m.invoke(object,args);
    }
    private Object engine() throws Exception {
        Object store=construct("EncryptedMailStore",new Class<?>[]{Context.class},getTargetContext());
        return construct("MailEngine",new Class<?>[]{type("EncryptedMailStore")},store);
    }
    @Override public void onStart() {
        Bundle result=new Bundle();
        try {
            require("seed".equals(phase)||"baseline".equals(phase)||"verify".equals(phase),"Unknown probe phase");
            Intent launch=new Intent(Intent.ACTION_MAIN).setClassName(getTargetContext().getPackageName(),PREFIX+"MainActivity")
                .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            Activity activity=startActivitySync(launch);
            runOnMainSync(()->web=find(activity.getWindow().getDecorView()));
            require(web!=null,"Missing actual app WebView");
            await("window.PBWorkspace && window.Capacitor && typeof db !== 'undefined' && db && window.PBNetwork?.ready");
            if("seed".equals(phase)) {
                Object engine=engine();
                JSONObject fixture=new JSONObject().put("id",ID).put("provider","webde")
                    .put("email","upgrade-fixture@webde.invalid").put("password","synthetic-offline-only")
                    .put("imap","imap.web.de").put("smtp","smtp.web.de");
                Object account=construct("MailAccount",new Class<?>[]{JSONObject.class},fixture);
                call(engine,"saveAccount",new Class<?>[]{type("MailAccount")},account);
                js("document.querySelector('[data-lang=en]').click();localStorage.setItem('pb_upgrade_probe','retained');window.PBNetwork.setOffline(true).then(()=>window.__probeOffline=true);true");
                await("document.documentElement.lang === 'en' && localStorage.getItem('pb_lang') === 'en' && window.__probeOffline === true");
                // Exercise IndexedDB as well as localStorage and the native encrypted account store.
                js("window.__probeDb=false;(()=>{const tx=db.transaction('catalog','readwrite');tx.objectStore('catalog').put({hash:'signed-upgrade-fixture',name:'Signed upgrade fixture',text:'retained offline data',size:21,type:'text/plain'});tx.oncomplete=()=>window.__probeDb=true;tx.onerror=()=>window.__probeDb='error';})();true");
                await("window.__probeDb === true");
                // WebView's localStorage disk commit is asynchronous. Give it the
                // normal Activity background lifecycle before killing its process.
                // The separate baseline cold start below proves durability BEFORE
                // installing an update; no preservation assertion is relaxed.
                runOnMainSync(()->activity.moveTaskToBack(true));
                require(paused.await(10,TimeUnit.SECONDS),"Seed app did not background");
                Thread.sleep(10000);
            } else {
                await("document.documentElement.lang === 'en' && localStorage.getItem('pb_lang') === 'en' && localStorage.getItem('pb_upgrade_probe') === 'retained'");
                await("window.PBNetwork.offline === true && document.documentElement.dataset.appOffline === 'true'");
                Object account=call(engine(),"account",new Class<?>[]{String.class},ID);
                JSONObject saved=(JSONObject)call(account,"privateJson",new Class<?>[]{});
                require("synthetic-offline-only".equals(saved.getString("password")),"Encrypted account was not retained");
                js("window.__probeDb=false;(()=>{const r=db.transaction('catalog').objectStore('catalog').get('signed-upgrade-fixture');r.onsuccess=()=>window.__probeDb=r.result?.text === 'retained offline data';})();true");
                await("window.__probeDb === true");
                js("window.Capacitor.Plugins.ProMail.accounts().then(a=>window.__probeAccount=a.items.some(x=>x.id==='"+ID+"'));true");
                await("window.__probeAccount === true");
                if("verify".equals(phase)) {
                js("window.Capacitor.Plugins.ProMail.accounts().then(a=>window.__probeAccount=a.items.some(x=>x.id==='"+ID+"'));PBWorkspace.navigate('settings');true");
                await("window.__probeAccount === true && document.querySelector('#vaultPlace h3')?.textContent.includes('Storage location and encryption') && document.querySelector('#vault-choose')?.getBoundingClientRect().width > 0 && window.PBVault?.active() === false");
                js("document.querySelector('[data-lang=de]').click();true");
                await("document.querySelector('#vaultPlace h3')?.textContent === '🔐 Speicherort und Verschlüsselung'");
                // Let the real ACTION_OPEN_DOCUMENT_TREE leave the app, then cancel it.
                js("localStorage.setItem('pb_fs_ok','1');PBWorkspace.navigate('intake');document.querySelector('#pickDir').click();true");
                android.accessibilityservice.AccessibilityServiceInfo info=getUiAutomation().getServiceInfo();
                info.flags |= android.accessibilityservice.AccessibilityServiceInfo.FLAG_RETRIEVE_INTERACTIVE_WINDOWS;
                getUiAutomation().setServiceInfo(info);
                long deadline=System.nanoTime()+TimeUnit.SECONDS.toNanos(20);
                boolean chooser=false;
                while(System.nanoTime()<deadline) {
                    for(android.view.accessibility.AccessibilityWindowInfo w:getUiAutomation().getWindows()) {
                        android.view.accessibility.AccessibilityNodeInfo root=w.getRoot();
                        if(root!=null && root.getPackageName()!=null && root.getPackageName().toString().contains("documentsui")) chooser=true;
                    }
                    if(chooser)break;Thread.sleep(200);
                }
                require(chooser,"Android folder picker did not open");
                getUiAutomation().performGlobalAction(android.accessibilityservice.AccessibilityService.GLOBAL_ACTION_BACK);
                await("!document.querySelector('#pickDir').disabled && window.PBVault.active() === false");
                }
            }
            result.putString("stream","SIGNED_UPGRADE_"+phase.toUpperCase(java.util.Locale.ROOT)+"_PASS\n");
            finish(Activity.RESULT_OK,result);
        } catch(Throwable failure) {
            java.io.StringWriter trace=new java.io.StringWriter();
            failure.printStackTrace(new java.io.PrintWriter(trace));
            result.putString("stream","SIGNED_UPGRADE_FAIL: "+trace+"\n");
            finish(Activity.RESULT_CANCELED,result);
        }
    }
}
