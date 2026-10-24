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

    @Test public void portraitAndLandscapeKeepTheSameWebViewAndSearch() throws Exception {
        var context = androidx.test.platform.app.InstrumentationRegistry.getInstrumentation().getTargetContext();
        var declared = context.getPackageManager().getActivityInfo(
            new android.content.ComponentName(context, MainActivity.class), 0);
        assertEquals("The app must not lock its declared orientation",
            android.content.pm.ActivityInfo.SCREEN_ORIENTATION_UNSPECIFIED, declared.screenOrientation);
        int requiredChanges = android.content.pm.ActivityInfo.CONFIG_ORIENTATION
            | android.content.pm.ActivityInfo.CONFIG_SCREEN_SIZE
            | android.content.pm.ActivityInfo.CONFIG_SMALLEST_SCREEN_SIZE
            | android.content.pm.ActivityInfo.CONFIG_SCREEN_LAYOUT
            | android.content.pm.ActivityInfo.CONFIG_DENSITY
            | android.content.pm.ActivityInfo.CONFIG_KEYBOARD
            | android.content.pm.ActivityInfo.CONFIG_KEYBOARD_HIDDEN;
        if (android.os.Build.VERSION.SDK_INT >= 26)
            requiredChanges |= android.content.pm.ActivityInfo.CONFIG_COLOR_MODE;
        assertEquals("Rotation, keyboard and window configuration changes must stay in the app",
            requiredChanges, declared.configChanges & requiredChanges);
        // This exercises Android rotation and lifecycle continuity. It does not
        // claim a measurement on Samsung DeX hardware or a tablet window manager.
        try (ActivityScenario<MainActivity> scenario = ActivityScenario.launch(MainActivity.class)) {
            AtomicReference<MainActivity> initialActivity = new AtomicReference<>();
            AtomicReference<android.webkit.WebView> initialWebView = new AtomicReference<>();
            scenario.onActivity(activity -> {
                assertEquals(android.content.pm.ActivityInfo.SCREEN_ORIENTATION_UNSPECIFIED,
                    activity.getRequestedOrientation());
                initialActivity.set(activity); initialWebView.set(activity.getBridge().getWebView());
            });
            try {
                awaitTrue(scenario, "Boolean(window.PBWorkspace && document.querySelector('#q'))");
                assertEquals("true", evaluate(scenario, "(()=>{PBWorkspace.navigate('search');window.__rotationSentinel='same-document';const q=document.querySelector('#q');q.value='synthetic rotation query';q.dispatchEvent(new Event('input',{bubbles:true}));return true;})()"));
                for (int requested : new int[] {android.content.pm.ActivityInfo.SCREEN_ORIENTATION_PORTRAIT,
                    android.content.pm.ActivityInfo.SCREEN_ORIENTATION_LANDSCAPE,
                    android.content.pm.ActivityInfo.SCREEN_ORIENTATION_PORTRAIT}) {
                    scenario.onActivity(activity -> activity.setRequestedOrientation(requested));
                    boolean portrait = requested == android.content.pm.ActivityInfo.SCREEN_ORIENTATION_PORTRAIT;
                    awaitTrue(scenario, portrait ? "innerHeight > innerWidth" : "innerWidth > innerHeight");
                    scenario.onActivity(activity -> {
                        assertSame("Rotation recreated the activity", initialActivity.get(), activity);
                        assertSame("Rotation replaced the WebView", initialWebView.get(), activity.getBridge().getWebView());
                        assertEquals(portrait ? android.content.res.Configuration.ORIENTATION_PORTRAIT
                            : android.content.res.Configuration.ORIENTATION_LANDSCAPE,
                            activity.getResources().getConfiguration().orientation);
                    });
                    assertEquals("Rotation must keep the document, search text and active view", "true",
                        evaluate(scenario, "window.__rotationSentinel==='same-document' && document.querySelector('#q').value==='synthetic rotation query' && document.querySelector('#panel-search').classList.contains('on') && Boolean(window.Capacitor.Plugins.ProFiles)"));
                }
            } finally {
                scenario.onActivity(activity -> activity.setRequestedOrientation(
                    android.content.pm.ActivityInfo.SCREEN_ORIENTATION_UNSPECIFIED));
            }
        }
    }

    @Test public void recoveryKeysRequireACompletedDocumentSaveAndCanRecoverTheVault() throws Exception {
        var instrumentation=androidx.test.platform.app.InstrumentationRegistry.getInstrumentation();
        var context=instrumentation.getTargetContext();
        var directory=new java.io.File(context.getCacheDir(),"exports");directory.mkdirs();
        var output=new java.io.File(directory,"synthetic-recovery-"+java.util.UUID.randomUUID()+".txt");
        assertTrue(output.createNewFile());
        var uri=androidx.core.content.FileProvider.getUriForFile(context,context.getPackageName()+".fileprovider",output);
        var save=new java.util.concurrent.atomic.AtomicBoolean(false);
        var intents=new java.util.concurrent.CopyOnWriteArrayList<android.content.Intent>();
        var monitor=new android.app.Instrumentation.ActivityMonitor(){
            @Override public android.app.Instrumentation.ActivityResult onStartActivity(android.content.Intent intent){
                if(!android.content.Intent.ACTION_CREATE_DOCUMENT.equals(intent.getAction()))return null;
                intents.add(new android.content.Intent(intent));
                return save.get()?new android.app.Instrumentation.ActivityResult(android.app.Activity.RESULT_OK,new android.content.Intent().setData(uri)):
                    new android.app.Instrumentation.ActivityResult(android.app.Activity.RESULT_CANCELED,null);
            }
        };
        instrumentation.addMonitor(monitor);
        try(ActivityScenario<MainActivity> scenario=ActivityScenario.launch(MainActivity.class)){
            // Component globals exist before DOMContentLoaded wires the setup button.
            awaitTrue(scenario,"document.readyState === 'complete' && Boolean(window.PBRecoveryExport && window.PBTresor && window.PBWorkspace && window.JasonLib && typeof window.Capacitor?.Plugins?.ProFiles?.saveRecoveryKeys === 'function')");
            assertEquals("true",evaluate(scenario,"localStorage.removeItem('pb_tresor_verify');PBTresor.lock();PBWorkspace.navigate('settings');document.querySelector('#tresorSetup').click();document.querySelector('#tzPw').value='synthetic-recovery-fixture-2026';document.querySelector('#tzPw2').value='synthetic-recovery-fixture-2026';document.querySelector('#tzMk').click();true"));
            try {
                awaitTrue(scenario,"document.querySelector('#tzErr').textContent.includes('abgebrochen')");
            } catch (AssertionError failure) {
                throw new AssertionError("Recovery export state (no credentials): "+evaluate(scenario,"JSON.stringify({ready:document.readyState,language:document.documentElement.lang,message:document.querySelector('#tzErr')?.textContent,modal:document.querySelector('#tresorModalBg')?.classList.contains('on'),disabled:document.querySelector('#tzSaved')?.disabled})")+"; native chooser calls="+intents.size(),failure);
            }
            assertEquals(1,intents.size());
            assertEquals("text/plain",intents.get(0).getType());
            assertTrue(intents.get(0).hasCategory(android.content.Intent.CATEGORY_OPENABLE));
            assertTrue(intents.get(0).getBooleanExtra(android.content.Intent.EXTRA_LOCAL_ONLY,false));
            assertEquals("true",evaluate(scenario,"document.querySelector('#tzSaved').disabled && document.querySelector('#tzFinish').disabled"));
            assertEquals(0,output.length());
            save.set(true);evaluate(scenario,"document.querySelector('#tzDl').click();true");
            awaitTrue(scenario,"!document.querySelector('#tzSaved').disabled && document.querySelector('#tzErr').textContent.includes('gespeichert')");
            assertEquals(2,intents.size());
            var lines=new String(java.nio.file.Files.readAllBytes(output.toPath()),java.nio.charset.StandardCharsets.UTF_8).split("\\n");
            var shares=new org.json.JSONArray();for(String line:lines)if(line.startsWith("JT3v5-"))shares.put(line.trim());
            assertEquals(5,shares.length());
            evaluate(scenario,"window.__exportedRecovery="+shares+";document.querySelector('#tzSaved').click();document.querySelector('#tzFinish').click();true");
            awaitTrue(scenario,"PBTresor.isUnlocked()");
            evaluate(scenario,"PBTresor.lock();document.querySelector('#tresorRecover').click();document.querySelector('#trShares').value=window.__exportedRecovery.slice(0,3).join('\\n');document.querySelector('#trGo').click();true");
            awaitTrue(scenario,"PBTresor.isUnlocked()");
            assertEquals("true",evaluate(scenario,"!JSON.stringify(localStorage).includes('synthetic-recovery-fixture-2026') && !JSON.stringify(localStorage).includes('JT3v5-')"));
            evaluate(scenario,"PBTresor.lock();localStorage.removeItem('pb_tresor_verify');delete window.__exportedRecovery;true");
        }finally{instrumentation.removeMonitor(monitor);output.delete();}
    }

    @Test public void nativeFolderChooserCanBeCancelledAndRetriedWithHiddenExplanation() throws Exception {
        var instrumentation=androidx.test.platform.app.InstrumentationRegistry.getInstrumentation();
        var monitor=new android.app.Instrumentation.ActivityMonitor(new android.content.IntentFilter(android.content.Intent.ACTION_OPEN_DOCUMENT_TREE),new android.app.Instrumentation.ActivityResult(android.app.Activity.RESULT_CANCELED,null),true);
        instrumentation.addMonitor(monitor);
        try(ActivityScenario<MainActivity> scenario=ActivityScenario.launch(MainActivity.class)){
            awaitTrue(scenario,"Boolean(window.PBFolders && window.Capacitor.Plugins.ProFolders)");
            evaluate(scenario,"localStorage.setItem('pb_fs_ok','1');PBWorkspace.navigate('intake');true");
            awaitTrue(scenario,"!('showDirectoryPicker' in window) && document.querySelector('#pickDir').getBoundingClientRect().width > 0 && document.querySelector('#chooseLibrary').getBoundingClientRect().width > 0");
            evaluate(scenario,"document.querySelector('#pickDir').click();true");
            awaitTrue(scenario,"!document.querySelector('#pickDir').disabled");
            assertEquals(1,monitor.getHits());
            evaluate(scenario,"document.querySelector('#chooseLibrary').click();true");
            awaitTrue(scenario,"!document.querySelector('#chooseLibrary').disabled");assertEquals(2,monitor.getHits());
            evaluate(scenario,"document.querySelector('#pickDir').click();true");
            awaitTrue(scenario,"!document.querySelector('#pickDir').disabled");assertEquals(3,monitor.getHits());
            assertEquals("true",evaluate(scenario,"!document.querySelector('#modalBg.on') && !document.querySelector('.native-folder-consent')"));
            evaluate(scenario,"localStorage.removeItem('pb_fs_ok');true");
        }finally{instrumentation.removeMonitor(monitor);}
    }

    @Test public void bundledSearchAndNativeBridgeWork() throws Exception {
        try (ActivityScenario<MainActivity> scenario = ActivityScenario.launch(MainActivity.class)) {
            awaitTrue(scenario, "Boolean(window.PBWorkspace && document.querySelector('#q') && document.querySelectorAll('.main-pages .tab').length === 4)");
            scenario.onActivity(activity -> assertEquals("Private Brain Pro",
                activity.getApplicationInfo().loadLabel(activity.getPackageManager()).toString()));
            // Since .28 a small version tag (v1.0.28) stands next to the name (Klaus 2026-10-22).
            assertEquals("\"Private Brain Pro\"", evaluate(scenario, "[...document.querySelector('.brand h1').childNodes].filter(n => n.nodeType === 3).map(n => n.textContent).join('').trim()"));
            awaitTrue(scenario, "/^v\\d+\\.\\d+\\.\\d+$/.test(document.getElementById('pbVersion')?.textContent || '')");
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
                // An idle UI queue does not mean the ActivityResult callback has
                // arrived. Wait for this attempt's actual cancellation and the
                // retry control restored by GmailAuthorization.Callback.failure.
                long cancellationDeadline=System.nanoTime()+TimeUnit.SECONDS.toNanos(10);
                while(true){
                    try{
                        assertEquals(attempt,picked.size());
                        onView(withText(org.hamcrest.Matchers.containsString("(CANCELLED)"))).inRoot(isDialog()).check(matches(isDisplayed()));
                        onView(withText("Mit Google anmelden")).inRoot(isDialog()).check(matches(androidx.test.espresso.matcher.ViewMatchers.isEnabled()));
                        break;
                    }catch(androidx.test.espresso.NoMatchingViewException | androidx.test.espresso.NoMatchingRootException | AssertionError pending){
                        if(System.nanoTime()>=cancellationDeadline)throw pending;
                        Thread.sleep(50);
                    }
                }
                assertEquals(attempt,picked.size());
                assertArrayEquals(new String[]{"com.google"},picked.get(attempt-1).getStringArrayExtra("allowableAccountTypes"));
            }
            onView(withText("Abbrechen")).inRoot(isDialog()).perform(click());
            awaitTrue(scenario,"window.__pickerDone===true");
            evaluate(scenario,"PBMailDevice.accounts().then(items=>window.__afterPicker=items.length);true");
            awaitTrue(scenario,"window.__afterPicker===window.__beforePicker");
        }finally{instrumentation.removeMonitor(monitor);}
    }

    private void chooseMailProvider(String label){
        onView(androidx.test.espresso.matcher.ViewMatchers.isAssignableFrom(android.widget.Spinner.class)).inRoot(isDialog())
            .perform(androidx.test.espresso.action.ViewActions.scrollTo(),click());
        androidx.test.espresso.Espresso.onData(org.hamcrest.Matchers.equalTo(label))
            .inRoot(androidx.test.espresso.matcher.RootMatchers.isPlatformPopup()).perform(click());
    }
    @Test public void providerChoicesClearPasswordsUseFixedServersAndKeepMicrosoftOutOfPasswordLogin()throws Exception{
        try(ActivityScenario<MainActivity> scenario=ActivityScenario.launch(MainActivity.class)){
            awaitTrue(scenario,"Boolean(window.PBMailDevice)");
            evaluate(scenario,"PBMailDevice.accounts().then(items=>window.__providerBefore=JSON.stringify(items));window.__providersCancelled=false;PBMailDevice.addAccount().then(value=>window.__providersCancelled=value===null);true");
            var password=androidx.test.espresso.matcher.ViewMatchers.withInputType(android.text.InputType.TYPE_CLASS_TEXT|android.text.InputType.TYPE_TEXT_VARIATION_PASSWORD);
            for(MailProvider preset:new MailProvider[]{MailProvider.WEBDE,MailProvider.GMX,MailProvider.YAHOO,MailProvider.IONOS}){
                chooseMailProvider(preset.label);
                onView(withText(preset.imap)).inRoot(isDialog()).perform(androidx.test.espresso.action.ViewActions.scrollTo())
                    .check(matches(org.hamcrest.Matchers.allOf(isDisplayed(),org.hamcrest.Matchers.not(androidx.test.espresso.matcher.ViewMatchers.isEnabled()))));
                onView(withText(preset.smtp)).inRoot(isDialog()).perform(androidx.test.espresso.action.ViewActions.scrollTo())
                    .check(matches(org.hamcrest.Matchers.not(androidx.test.espresso.matcher.ViewMatchers.isEnabled())));
                onView(password).inRoot(isDialog()).check(matches(withText("")))
                    .perform(androidx.test.espresso.action.ViewActions.scrollTo(),androidx.test.espresso.action.ViewActions.replaceText("synthetic-password"),androidx.test.espresso.action.ViewActions.closeSoftKeyboard());
                onView(withText(preset.help(0))).inRoot(isDialog()).perform(androidx.test.espresso.action.ViewActions.scrollTo()).check(matches(isDisplayed()));
                // Empty email fails locally: the form must unlock so another provider can be chosen.
                onView(withText("Verbinden und prüfen")).inRoot(isDialog()).perform(click());
                onView(androidx.test.espresso.matcher.ViewMatchers.isAssignableFrom(android.widget.Spinner.class)).inRoot(isDialog())
                    .check(matches(androidx.test.espresso.matcher.ViewMatchers.isEnabled()));
                onView(withText("Anmeldung fehlgeschlagen. E-Mail-Adresse, E-Mail-Passwort und Servernamen prüfen.")).inRoot(isDialog())
                    .perform(androidx.test.espresso.action.ViewActions.scrollTo()).check(matches(isDisplayed()));
            }
            chooseMailProvider("Hetzner");
            onView(password).inRoot(isDialog()).check(matches(withText("")));
            chooseMailProvider("Google / Gmail");
            onView(password).inRoot(isDialog()).check(matches(org.hamcrest.Matchers.not(isDisplayed())));
            chooseMailProvider("Outlook / Microsoft 365");
            onView(password).inRoot(isDialog()).check(matches(org.hamcrest.Matchers.not(isDisplayed())));
            onView(withText(MailProvider.setupLabel(0))).inRoot(isDialog()).perform(click());
            onView(withText(MailProvider.microsoftPlan(0))).inRoot(isDialog()).check(matches(isDisplayed()));
            pressBackUnconditionally();
            onView(withText("Abbrechen")).inRoot(isDialog()).perform(click());
            awaitTrue(scenario,"window.__providersCancelled===true");
            evaluate(scenario,"PBMailDevice.accounts().then(items=>window.__providerAfter=JSON.stringify(items));true");
            awaitTrue(scenario,"typeof window.__providerAfter==='string'&&window.__providerAfter===window.__providerBefore");
        }
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
