package de.familyprojekt.privatebrain.pro;

import static org.junit.Assert.*;

import android.app.Activity;
import android.app.Instrumentation;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.content.res.Configuration;
import android.content.res.XmlResourceParser;
import android.content.res.loader.ResourcesLoader;
import android.content.res.loader.ResourcesProvider;
import android.os.ParcelFileDescriptor;
import android.webkit.WebView;
import androidx.lifecycle.Lifecycle;
import androidx.test.core.app.ActivityScenario;
import androidx.test.platform.app.InstrumentationRegistry;
import androidx.test.ext.junit.runners.AndroidJUnit4;
import java.io.File;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicReference;
import org.json.JSONArray;
import org.json.JSONObject;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.xmlpull.v1.XmlPullParser;

/** Real bridge requests; no counterfeit companion app or claimed native Pro launch. */
@RunWith(AndroidJUnit4.class)
@android.annotation.TargetApi(30)
public class NativeToolLauncherTest {
    private static final String WORKFLOW_PACKAGE = "de.familyprojekt.workflowpdf.pro";

    private String evaluate(ActivityScenario<MainActivity> scenario, String script) throws Exception {
        CountDownLatch complete = new CountDownLatch(1);
        AtomicReference<String> result = new AtomicReference<>();
        scenario.onActivity(activity -> activity.getBridge().getWebView().evaluateJavascript(script, value -> {
            result.set(value);
            complete.countDown();
        }));
        assertTrue("WebView response", complete.await(10, TimeUnit.SECONDS));
        return result.get();
    }

    private void awaitTrue(ActivityScenario<MainActivity> scenario, String script) throws Exception {
        long deadline = System.nanoTime() + TimeUnit.SECONDS.toNanos(90);
        while (System.nanoTime() < deadline) {
            if ("true".equals(evaluate(scenario, script))) return;
            Thread.sleep(250);
        }
        fail("Tool launcher did not finish: " + script);
    }

    @Test public void onlyKnownProToolCanBeRequestedAndMissingAppKeepsBrainOpen() throws Exception {
        var instrumentation = InstrumentationRegistry.getInstrumentation();
        var context = instrumentation.getTargetContext();
        var manager = context.getPackageManager();
        try {
            manager.getApplicationInfo(WORKFLOW_PACKAGE, 0);
            fail("This absent-app test requires the real Workflow PDF Pro package to be uninstalled; it never installs a replacement.");
        } catch (PackageManager.NameNotFoundException expected) {
            // The fresh CI emulator deliberately has no official companion APK.
        }
        var packageInfo = manager.getPackageInfo(context.getPackageName(), PackageManager.GET_PERMISSIONS);
        assertFalse("The tool launcher must not request broad package visibility",
            packageInfo.requestedPermissions != null
                && Arrays.asList(packageInfo.requestedPermissions).contains("android.permission.QUERY_ALL_PACKAGES"));
        List<String> visiblePackages = new ArrayList<>();
        // Instrumentation combines the test APK's assets with the application's.
        // An unqualified AndroidManifest.xml lookup can therefore open the test
        // manifest. Load the installed application's exact base APK explicitly
        // using the public API 30 resource-loader API (the smoke emulator is API 35).
        var resources = context.createConfigurationContext(new Configuration()).getResources();
        var loader = new ResourcesLoader();
        try (ParcelFileDescriptor apk = ParcelFileDescriptor.open(
                new File(context.getApplicationInfo().sourceDir), ParcelFileDescriptor.MODE_READ_ONLY);
             ResourcesProvider provider = ResourcesProvider.loadFromApk(apk)) {
            try {
                instrumentation.runOnMainSync(() -> {
                    loader.addProvider(provider);
                    resources.addLoaders(loader);
                });
                try (XmlResourceParser manifest = resources.getAssets().openXmlResourceParser("AndroidManifest.xml")) {
                    int queriesDepth = -1;
                    String manifestPackage = null;
                    while (manifest.next() != XmlPullParser.END_DOCUMENT) {
                        if (manifest.getEventType() == XmlPullParser.START_TAG) {
                            if ("manifest".equals(manifest.getName()) && manifest.getDepth() == 1) {
                                manifestPackage = manifest.getAttributeValue(null, "package");
                            } else if ("queries".equals(manifest.getName())) queriesDepth = manifest.getDepth();
                            else if (queriesDepth >= 0 && manifest.getDepth() == queriesDepth + 1
                                && "package".equals(manifest.getName())) {
                                visiblePackages.add(manifest.getAttributeValue("http://schemas.android.com/apk/res/android", "name"));
                            }
                        } else if (manifest.getEventType() == XmlPullParser.END_TAG
                            && manifest.getDepth() == queriesDepth && "queries".equals(manifest.getName())) {
                            queriesDepth = -1;
                        }
                    }
                    assertEquals("The inspected manifest belongs to the installed target APK",
                        context.getPackageName(), manifestPackage);
                }
            } finally {
                instrumentation.runOnMainSync(() -> {
                    resources.removeLoaders(loader);
                    loader.clearProviders();
                });
            }
        }
        assertTrue("The installed manifest declares the specific companion package query: " + visiblePackages,
            visiblePackages.contains(WORKFLOW_PACKAGE));

        List<Intent> externalStarts = new CopyOnWriteArrayList<>();
        var monitor = new Instrumentation.ActivityMonitor() {
            @Override public Instrumentation.ActivityResult onStartActivity(Intent intent) {
                // A regression must not launch a real browser/installer during this test.
                externalStarts.add(new Intent(intent));
                return new Instrumentation.ActivityResult(Activity.RESULT_CANCELED, null);
            }
        };
        try (ActivityScenario<MainActivity> scenario = ActivityScenario.launch(MainActivity.class)) {
            awaitTrue(scenario, "document.readyState==='complete' && Boolean(window.PBWorkspace && typeof window.Capacitor?.Plugins?.ProLinks?.openApplication==='function')");
            AtomicReference<MainActivity> originalActivity = new AtomicReference<>();
            AtomicReference<WebView> originalWebView = new AtomicReference<>();
            AtomicReference<String> initialAddress = new AtomicReference<>();
            scenario.onActivity(activity -> {
                originalActivity.set(activity);
                originalWebView.set(activity.getBridge().getWebView());
                initialAddress.set(activity.getBridge().getWebView().getUrl());
            });
            instrumentation.addMonitor(monitor);
            try {
                evaluate(scenario, """
                    window.__toolLauncherResult=null;
                    window.__toolLauncherSentinel='same-brain-document';
                    (async()=>{
                      try {
                        const plugin=Capacitor.Plugins.ProLinks,initial=location.href;
                        const missing=await plugin.openApplication({tool:'workflowpdfpro'});
                        const denied=[];
                        const invalid=[
                          {tool:'unknown'},
                          {tool:'de.familyprojekt.workflowpdf.pro'},
                          {tool:'intent://arbitrary/#Intent;scheme=test;end'},
                          {tool:'workflowpdfpro',packageName:'de.familyprojekt.workflowpdf.pro'},
                          {tool:'workflowpdfpro',url:'https://example.invalid/tool.apk'},
                          {tool:'workflowpdfpro',intent:'android.intent.action.VIEW'},
                          {tool:42},{}
                        ];
                        for(const request of invalid){
                          try { await plugin.openApplication(request);denied.push({rejected:false}); }
                          catch(error){denied.push({rejected:true,code:String(error?.code||'').slice(0,80),message:String(error?.message||'').slice(0,160)});}
                        }
                        const again=await plugin.openApplication({tool:'workflowpdfpro'});
                        window.__toolLauncherResult=JSON.stringify({missing,again,denied,
                          sameUrl:location.href===initial,sameDocument:window.__toolLauncherSentinel==='same-brain-document',
                          searchPresent:Boolean(document.getElementById('q'))});
                      }catch(error){window.__toolLauncherResult=JSON.stringify({unexpected:String(error?.message||error).slice(0,200)});}
                    })();true;
                    """);
                awaitTrue(scenario, "typeof window.__toolLauncherResult==='string'");
                String raw = evaluate(scenario, "window.__toolLauncherResult");
                JSONObject result = new JSONObject(new JSONObject("{\"value\":" + raw + "}").getString("value"));
                assertFalse("The genuine tool bridge must resolve a missing companion: " + result, result.has("unexpected"));
                assertFalse("Missing official app is reported honestly", result.getJSONObject("missing").getBoolean("installed"));
                assertFalse("A later valid request remains usable after rejected input", result.getJSONObject("again").getBoolean("installed"));
                JSONArray denied = result.getJSONArray("denied");
                assertEquals("All untrusted request variants were exercised", 8, denied.length());
                for (int i = 0; i < denied.length(); i++) {
                    JSONObject rejection = denied.getJSONObject(i);
                    assertTrue("Unlisted tool, package or intent must be rejected: " + i, rejection.getBoolean("rejected"));
                    assertEquals("Unsupported requests use a bounded fixed error code", "TOOL_UNSUPPORTED", rejection.getString("code"));
                    assertEquals("Unsupported requests do not echo arbitrary package/URL input", "Unsupported tool", rejection.getString("message"));
                }
                assertTrue("The app document URL remains unchanged", result.getBoolean("sameUrl"));
                assertTrue("The same document remains alive", result.getBoolean("sameDocument"));
                assertTrue("Search stays available", result.getBoolean("searchPresent"));
                assertTrue("A missing app never opens a browser, installer or other activity", externalStarts.isEmpty());
                assertEquals("Brain remains the resumed application", Lifecycle.State.RESUMED, scenario.getState());
                scenario.onActivity(activity -> {
                    assertSame("The tool request must not replace the activity", originalActivity.get(), activity);
                    assertSame("The tool request must not replace the WebView", originalWebView.get(), activity.getBridge().getWebView());
                    assertEquals("Native WebView URL is preserved", initialAddress.get(), activity.getBridge().getWebView().getUrl());
                    assertFalse(activity.isFinishing());
                });
            } finally {
                instrumentation.removeMonitor(monitor);
                evaluate(scenario, "delete window.__toolLauncherResult;delete window.__toolLauncherSentinel;true");
            }
        }
    }
}
