package de.familyprojekt.privatebrain.pro;

import androidx.test.core.app.ActivityScenario;
import androidx.test.ext.junit.runners.AndroidJUnit4;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicReference;
import org.junit.Test;
import org.junit.runner.RunWith;
import static org.junit.Assert.*;
import static androidx.test.espresso.Espresso.onView;
import static androidx.test.espresso.Espresso.pressBackUnconditionally;
import static androidx.test.espresso.action.ViewActions.click;
import static androidx.test.espresso.assertion.ViewAssertions.matches;
import static androidx.test.espresso.matcher.ViewMatchers.isDisplayed;
import static androidx.test.espresso.matcher.RootMatchers.isDialog;
import static androidx.test.espresso.matcher.ViewMatchers.withText;

/** Runs the real bundled page and Java bridge, not a mock browser transport. */
@RunWith(AndroidJUnit4.class)
public class NativeStartupTest {
    private String evaluate(ActivityScenario<MainActivity> scenario, String script) throws Exception {
        CountDownLatch complete = new CountDownLatch(1);
        AtomicReference<String> result = new AtomicReference<>();
        scenario.onActivity(activity -> activity.getBridge().getWebView().evaluateJavascript(script, value -> {
            result.set(value);
            complete.countDown();
        }));
        assertTrue("WebView did not return a JavaScript result", complete.await(10, TimeUnit.SECONDS));
        return result.get();
    }

    private void awaitTrue(ActivityScenario<MainActivity> scenario, String script) throws Exception {
        long deadline = System.nanoTime() + TimeUnit.SECONDS.toNanos(90);
        while (System.nanoTime() < deadline) {
            if ("true".equals(evaluate(scenario, script))) return;
            Thread.sleep(250);
        }
        fail("Bundled app did not satisfy: " + script);
    }

    @Test public void bundledSearchAndNativeBridgeWork() throws Exception {
        try (ActivityScenario<MainActivity> scenario = ActivityScenario.launch(MainActivity.class)) {
            awaitTrue(scenario, "Boolean(window.PBWorkspace && document.querySelector('#q') && document.querySelectorAll('.main-pages .tab').length === 4)");
            assertEquals("\"https://localhost\"", evaluate(scenario, "location.origin"));
            evaluate(scenario, "window.Capacitor.Plugins.ProDevice.getInfo().then(info => window.__nativeSmokeInfo = info); true");
            awaitTrue(scenario, "Boolean(window.__nativeSmokeInfo && window.__nativeSmokeInfo.platform === 'android' && window.__nativeSmokeInfo.versionName && window.__nativeSmokeInfo.nativeMail === true)");
            evaluate(scenario, "window.Capacitor.Plugins.ProMail.accounts().then(info => window.__nativeMailSmoke = info); true");
            awaitTrue(scenario, "Boolean(window.PBMailDevice && window.__nativeMailSmoke && Array.isArray(window.__nativeMailSmoke.items) && window.__nativeMailSmoke.items.length === 0)");
            evaluate(scenario, "window.PBMailDevice.addAccount().then(value => window.__nativeSetupCancelled = value === null); true");
            long dialogDeadline = System.nanoTime() + TimeUnit.SECONDS.toNanos(10);
            while (true) {
                try { onView(withText("Mailkonto verbinden")).inRoot(isDialog()).check(matches(isDisplayed())); break; }
                catch (androidx.test.espresso.NoMatchingViewException | androidx.test.espresso.NoMatchingRootException missing) {
                    if (System.nanoTime() >= dialogDeadline) throw missing;
                    Thread.sleep(100);
                }
            }
            onView(withText("Passwort für E-Mail-Programme")).inRoot(isDialog()).check(matches(isDisplayed()));
            onView(withText("Abbrechen")).inRoot(isDialog()).perform(click());
            awaitTrue(scenario, "window.__nativeSetupCancelled === true");
            evaluate(scenario, "window.Capacitor.Plugins.ProMail.accounts().then(info => window.__afterCancel = info); true");
            awaitTrue(scenario, "Boolean(window.__afterCancel && window.__afterCancel.items.length === 0)");
            evaluate(scenario, "window.Capacitor.Plugins.ProUpdates.check().then(info => window.__updateSmokeInfo = info); true");
            awaitTrue(scenario, "Boolean(window.__updateSmokeInfo && window.__updateSmokeInfo.status === 'unsupported')");
            evaluate(scenario, "window.Capacitor.Plugins.ProUpdates.openDownload().catch(error => window.__updateOpenError = error.code); true");
            awaitTrue(scenario, "window.__updateOpenError === 'UPDATE_NOT_CHECKED'");
            // Real Android WebView, including the iframe isolation boundary (not just a browser mock).
            evaluate(scenario, "window.__mailExecuted=false; addEventListener('message',e=>{if(e.data==='mail-script-ran')window.__mailExecuted=true;}); document.querySelector('.main-pages [data-tab=mail]').click(); const box=PBMailView.render({text:'Fallback',html:'<table bgcolor=ivory><tr><td>Original newsletter</td></tr></table>',attachments:[]}); document.querySelector('#mailWorkspace').append(box); const frame=box.querySelector('iframe'); frame.onload=()=>window.__mailFrameReady=true; frame.srcdoc += '<script>parent.postMessage(\"mail-script-ran\",\"*\")</script>'; true");
            awaitTrue(scenario, "window.__mailFrameReady===true");
            assertEquals("false", evaluate(scenario, "window.__mailExecuted"));
            assertEquals("true", evaluate(scenario, "(()=>{const f=document.querySelector('.mail-html');if(f.getAttribute('sandbox')!=='')return false;try{f.contentWindow.document;return false;}catch(e){return e.name==='SecurityError';}})()"));
            assertEquals("true", evaluate(scenario, "document.querySelector('.wrap').getBoundingClientRect().width >= innerWidth-2"));
            evaluate(scenario, "document.querySelector('.main-pages [data-tab=explorer]').click(); true");
            awaitTrue(scenario, "document.querySelector('#panel-explorer').getBoundingClientRect().height > 0 && document.querySelector('#q').getBoundingClientRect().height === 0");
            evaluate(scenario, "document.querySelector('.main-pages [data-tab=search]').click(); true");
            awaitTrue(scenario, "document.querySelector('#q').getBoundingClientRect().height > 0");
        }
    }

    @Test public void fileViewerAndTwelveAndroidBackStepsKeepAppAlive() throws Exception {
        try (ActivityScenario<MainActivity> scenario = ActivityScenario.launch(MainActivity.class)) {
            awaitTrue(scenario, "Boolean(window.PBNavigation && window.PBWorkspace && typeof db !== 'undefined' && db)");
            evaluate(scenario, "window.__navigationSentinel='unchanged'; PBWorkspace.navigate('explorer'); true");
            evaluate(scenario, "showBlob(new File(['Original local document'],'android-navigation.txt',{type:'text/plain'}),{name:'android-navigation.txt'}); true");
            awaitTrue(scenario, "document.querySelector('.native-file-text')?.textContent === 'Original local document'");
            pressBackUnconditionally();
            awaitTrue(scenario, "document.querySelector('.native-file-viewer').hidden && document.querySelector('#panel-explorer').classList.contains('on')");
            assertEquals("\"https://localhost\"", evaluate(scenario, "location.origin"));
            assertEquals("\"unchanged\"", evaluate(scenario, "window.__navigationSentinel"));
            // Twelve real view entries, traversed with the actual Android back dispatcher.
            for (int i = 0; i < 12; i++) {
                evaluate(scenario, "showBlob(new File(['Step " + i + "'],'step.txt',{type:'text/plain'})); true");
                awaitTrue(scenario, "document.querySelector('.native-file-text')?.textContent === 'Step " + i + "'");
            }
            for (int i = 10; i >= 0; i--) {
                pressBackUnconditionally();
                awaitTrue(scenario, "document.querySelector('.native-file-text')?.textContent === 'Step " + i + "'");
            }
            pressBackUnconditionally();
            awaitTrue(scenario, "document.querySelector('.native-file-viewer').hidden && document.querySelector('#panel-explorer').classList.contains('on')");
            assertEquals("\"unchanged\"", evaluate(scenario, "window.__navigationSentinel"));
            assertEquals("true", evaluate(scenario, "Boolean(window.Capacitor.Plugins.ProFiles && window.PBMailDevice)"));
        }
    }

    @Test public void mailLinkGestureOpensExternalBrowserWithoutLeavingMail() throws Exception {
        java.util.concurrent.atomic.AtomicReference<android.content.Intent> opened = new java.util.concurrent.atomic.AtomicReference<>();
        android.app.Instrumentation instrumentation = androidx.test.platform.app.InstrumentationRegistry.getInstrumentation();
        android.app.Instrumentation.ActivityMonitor monitor = new android.app.Instrumentation.ActivityMonitor() {
            @Override public android.app.Instrumentation.ActivityResult onStartActivity(android.content.Intent intent) {
                if (android.content.Intent.ACTION_VIEW.equals(intent.getAction())) {
                    opened.set(intent);return new android.app.Instrumentation.ActivityResult(0,null);
                }
                return null;
            }
        };
        instrumentation.addMonitor(monitor);
        try (ActivityScenario<MainActivity> scenario = ActivityScenario.launch(MainActivity.class)) {
            awaitTrue(scenario,"Boolean(window.PBMailView && window.PBNavigation)");
            evaluate(scenario,"PBWorkspace.navigate('mail');window.__browserSentinel='kept';const host=document.createElement('div');host.id='browser-link-fixture';host.style='position:fixed;inset:0;padding:20px;background:white;z-index:2147483647';host.append(PBMailView.render({text:'Browserprobe https://example.com/mail-test',html:'<a href=\"https://example.com/mail-test\">Browserprobe</a>',attachments:[]}));document.body.append(host);host.querySelector('iframe').style.height='180px';true");
            awaitTrue(scenario,"document.querySelector('#browser-link-fixture iframe').dataset.linksReady==='true'");
            evaluate(scenario,"window.__linkFrameLoaded=false;window.__linkScript=false;const f=document.querySelector('#browser-link-fixture iframe');f.onload=()=>window.__linkFrameLoaded=true;f.srcdoc+='<script>parent.__linkScript=true</script>';true");
            awaitTrue(scenario,"window.__linkFrameLoaded===true");
            assertEquals("false",evaluate(scenario,"window.__linkScript"));
            assertEquals("true",evaluate(scenario,"(()=>{try{document.querySelector('#browser-link-fixture iframe').contentWindow.document;return false;}catch(e){return e.name==='SecurityError';}})()"));
            String local = evaluate(scenario,"document.querySelector('#browser-link-fixture iframe').srcdoc.match(/https:\\/\\/localhost\\/_pb_mail_link\\/[a-f0-9-]+/)[0]");
            final android.net.Uri route=android.net.Uri.parse((String)new org.json.JSONTokener(local).nextValue());
            scenario.onActivity(activity -> {
                android.webkit.WebResourceRequest request = new android.webkit.WebResourceRequest() {
                    public android.net.Uri getUrl(){return route;}public boolean isForMainFrame(){return false;}
                    public boolean isRedirect(){return false;}public boolean hasGesture(){return false;}
                    public String getMethod(){return "GET";}public java.util.Map<String,String> getRequestHeaders(){return java.util.Collections.emptyMap();}
                };
                assertTrue(activity.getBridge().getWebViewClient().shouldOverrideUrlLoading(activity.getBridge().getWebView(),request));
            });
            assertNull("Mail loaded a browser without a gesture",opened.get());
            Thread.sleep(300);
            org.json.JSONArray point=new org.json.JSONArray(evaluate(scenario,"(()=>{const r=document.querySelector('#browser-link-fixture iframe').getBoundingClientRect();return[(r.left+32)*devicePixelRatio,(r.top+25)*devicePixelRatio];})()"));
            final float x=(float)point.getDouble(0),y=(float)point.getDouble(1);
            onView(androidx.test.espresso.matcher.ViewMatchers.isAssignableFrom(android.webkit.WebView.class)).perform(new androidx.test.espresso.action.GeneralClickAction(
                androidx.test.espresso.action.Tap.SINGLE,view->{int[] position=new int[2];view.getLocationOnScreen(position);return new float[]{position[0]+x,position[1]+y};},androidx.test.espresso.action.Press.FINGER));
            long deadline=System.nanoTime()+TimeUnit.SECONDS.toNanos(10);
            while(opened.get()==null && System.nanoTime()<deadline)Thread.sleep(100);
            assertNotNull("Actual mail link click did not request external browser; frame=" + evaluate(scenario,"JSON.stringify({origin:location.origin,sandbox:document.querySelector('#browser-link-fixture iframe')?.getAttribute('sandbox'),ratio:devicePixelRatio})"),opened.get());
            assertEquals("https://example.com/mail-test",opened.get().getDataString());
            assertTrue(opened.get().hasCategory(android.content.Intent.CATEGORY_BROWSABLE));
            assertEquals("\"kept\"",evaluate(scenario,"window.__browserSentinel"));
            assertEquals("\"https://localhost\"",evaluate(scenario,"location.origin"));
            assertEquals("true",evaluate(scenario,"document.querySelector('#panel-mail').classList.contains('on')"));
            assertEquals("\"allow-top-navigation-by-user-activation\"",evaluate(scenario,"document.querySelector('#browser-link-fixture iframe').getAttribute('sandbox')"));
        } finally { instrumentation.removeMonitor(monitor); }
    }

    @Test public void googleChoiceUsesConsentAndHidesPasswordFields() throws Exception {
        try(ActivityScenario<MainActivity> scenario=ActivityScenario.launch(MainActivity.class)) {
            awaitTrue(scenario,"Boolean(window.PBMailDevice)");
            evaluate(scenario,"window.__googleCancelled=false;PBMailDevice.addAccount().then(value=>window.__googleCancelled=value===null);true");
            onView(androidx.test.espresso.matcher.ViewMatchers.isAssignableFrom(android.widget.Spinner.class)).inRoot(isDialog()).perform(click());
            androidx.test.espresso.Espresso.onData(org.hamcrest.Matchers.equalTo("Google / Gmail"))
                .inRoot(androidx.test.espresso.matcher.RootMatchers.isPlatformPopup()).perform(click());
            onView(withText("Mit Google anmelden")).inRoot(isDialog()).check(matches(isDisplayed()));
            onView(withText("Passwort für E-Mail-Programme")).inRoot(isDialog()).check(matches(org.hamcrest.Matchers.not(isDisplayed())));
            onView(withText("Abbrechen")).inRoot(isDialog()).perform(click());
            awaitTrue(scenario,"window.__googleCancelled===true");
        }
    }

    @Test public void googleAccountPickerCancellationCanRetryWithoutChangingAccounts() throws Exception {
        var instrumentation=androidx.test.platform.app.InstrumentationRegistry.getInstrumentation();
        var picked=new java.util.concurrent.CopyOnWriteArrayList<android.content.Intent>();
        var monitor=new android.app.Instrumentation.ActivityMonitor(){
            @Override public android.app.Instrumentation.ActivityResult onStartActivity(android.content.Intent intent){
                if(intent.hasExtra("allowableAccountTypes")){
                    picked.add(new android.content.Intent(intent));
                    return new android.app.Instrumentation.ActivityResult(android.app.Activity.RESULT_CANCELED,null);
                }
                return null;
            }
        };
        instrumentation.addMonitor(monitor);
        try(ActivityScenario<MainActivity> scenario=ActivityScenario.launch(MainActivity.class)){
            awaitTrue(scenario,"Boolean(window.PBMailDevice)");
            evaluate(scenario,"window.__pickerDone=false;PBMailDevice.accounts().then(items=>window.__beforePicker=items.length);PBMailDevice.addAccount().then(value=>window.__pickerDone=value===null);true");
            onView(androidx.test.espresso.matcher.ViewMatchers.isAssignableFrom(android.widget.Spinner.class)).inRoot(isDialog()).perform(click());
            androidx.test.espresso.Espresso.onData(org.hamcrest.Matchers.equalTo("Google / Gmail")).inRoot(androidx.test.espresso.matcher.RootMatchers.isPlatformPopup()).perform(click());
            for(int attempt=1;attempt<=2;attempt++){
                onView(withText("Mit Google anmelden")).inRoot(isDialog()).perform(click());
                instrumentation.waitForIdleSync();
                onView(withText(org.hamcrest.Matchers.containsString("(CANCELLED)"))).inRoot(isDialog()).check(matches(isDisplayed()));
                assertEquals(attempt,picked.size());
                assertArrayEquals(new String[]{"com.google"},picked.get(attempt-1).getStringArrayExtra("allowableAccountTypes"));
            }
            onView(withText("Abbrechen")).inRoot(isDialog()).perform(click());
            awaitTrue(scenario,"window.__pickerDone===true");
            evaluate(scenario,"PBMailDevice.accounts().then(items=>window.__afterPicker=items.length);true");
            awaitTrue(scenario,"window.__afterPicker===window.__beforePicker");
        }finally{instrumentation.removeMonitor(monitor);}
    }

    @Test public void pdfPagesAndAndroidBackUseRealNativeBridge() throws Exception {
        java.io.File file=NativePdfTest.fixture(androidx.test.core.app.ApplicationProvider.getApplicationContext());
        String data=android.util.Base64.encodeToString(java.nio.file.Files.readAllBytes(file.toPath()),android.util.Base64.NO_WRAP);
        try(ActivityScenario<MainActivity> scenario=ActivityScenario.launch(MainActivity.class)){
            awaitTrue(scenario,"Boolean(window.PBPDF && window.PBNavigation)");
            evaluate(scenario,"PBWorkspace.navigate('explorer');showBlob(new File([Uint8Array.from(atob("+org.json.JSONObject.quote(data)+"),c=>c.charCodeAt(0))],'scanned-original.pdf',{type:'application/pdf'}));true");
            awaitTrue(scenario,"Boolean(document.querySelector('.native-pdf-page')?.naturalWidth>0 && !document.querySelector('.native-pdf-page').hidden && document.querySelector('.native-pdf-toolbar span')?.textContent==='Seite 1 von 2')");
            evaluate(scenario,"document.querySelectorAll('.native-pdf-toolbar button')[1].click();true");
            awaitTrue(scenario,"Boolean(document.querySelector('.native-pdf-page')?.naturalWidth>0 && !document.querySelector('.native-pdf-page').hidden && document.querySelector('.native-pdf-toolbar span')?.textContent==='Seite 2 von 2')");
            pressBackUnconditionally();awaitTrue(scenario,"document.querySelector('.native-file-viewer').hidden && document.querySelector('#panel-explorer').classList.contains('on')");
            assertEquals("\"https://localhost\"",evaluate(scenario,"location.origin"));
        }finally{file.delete();}
    }
}
