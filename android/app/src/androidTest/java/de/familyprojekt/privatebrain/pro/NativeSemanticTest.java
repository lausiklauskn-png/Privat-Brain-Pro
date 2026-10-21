package de.familyprojekt.privatebrain.pro;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertTrue;
import static org.junit.Assert.fail;

import android.content.Context;
import android.util.Log;
import androidx.test.core.app.ActivityScenario;
import androidx.test.core.app.ApplicationProvider;
import androidx.test.ext.junit.runners.AndroidJUnit4;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicReference;
import org.json.JSONObject;
import org.junit.Test;
import org.junit.runner.RunWith;

/**
 * The real meaning model with the switch (Klaus 2026-10-21): Android loads the files from the
 * internet (Klaus' server, else Hugging Face / jsDelivr) and checks their fingerprints; then the
 * app is cut off and Modul 03 loads the model from app storage and understands meaning.
 * If the view's process ends while the model starts, the test says so instead of only "crashed".
 */
@RunWith(AndroidJUnit4.class)
public class NativeSemanticTest {
    private String evaluate(ActivityScenario<MainActivity> scenario, String script) throws Exception {
        CountDownLatch complete = new CountDownLatch(1);
        AtomicReference<String> result = new AtomicReference<>();
        scenario.onActivity(activity -> activity.getBridge().getWebView().evaluateJavascript(script, value -> {
            result.set(value);
            complete.countDown();
        }));
        if (!complete.await(10, TimeUnit.SECONDS)) return null;
        return result.get();
    }

    private String await(ActivityScenario<MainActivity> scenario, String script, int seconds, Context context) throws Exception {
        long deadline = System.nanoTime() + TimeUnit.SECONDS.toNanos(seconds);
        while (System.nanoTime() < deadline) {
            String value = evaluate(scenario, script);
            if (value != null && !"null".equals(value) && !"\"\"".equals(value)) return value;
            String gone = context.getSharedPreferences("semantic", Context.MODE_PRIVATE).getString("lastGone", "");
            if (!gone.isEmpty()) fail("WebView process ended while the model started: " + gone);
            Thread.sleep(1000);
        }
        fail("App did not answer: " + script);
        return null;
    }

    @Test public void modelLoadedWithTheSwitchRunsOfflineFromAppStorage() throws Exception {
        Context context = ApplicationProvider.getApplicationContext();
        AppNetwork.initialize(context);
        AppNetwork.setOffline(context, false);
        context.getSharedPreferences("semantic", Context.MODE_PRIVATE).edit().clear().commit();
        SemanticModel model = ProSemanticPlugin.model(context);
        long started = System.currentTimeMillis();
        model.install((done, total, file, source) -> Log.i("NativeSemanticTest", "model " + done + "/" + total + " " + file + " from " + source));
        Log.i("NativeSemanticTest", "model loaded in " + (System.currentTimeMillis() - started) + " ms");
        assertTrue("all files loaded and checked", model.installed());
        // Offline from the first moment: the app starts the model by itself, and nothing may come from the internet.
        AppNetwork.setOffline(context, true);
        try (ActivityScenario<MainActivity> scenario = ActivityScenario.launch(MainActivity.class)) {
            await(scenario, "(window.SbkimEmbedding&&window.PBNetwork&&window.PBNetwork.ready&&window.PBSemantic)?'yes':''", 90, context);
            assertEquals("\"true\"", await(scenario, "String(PBNetwork.offline)", 30, context));
            try {
                evaluate(scenario, "window.__sem=null;(async()=>{try{await SbkimEmbedding.init();"
                    + "const q=await SbkimEmbedding.embedQuery('Rechnung vom Zahnarzt');"
                    + "const near=await SbkimEmbedding.embedPassage('Zahnarztrechnung über 120 Euro für eine Füllung');"
                    + "const far=await SbkimEmbedding.embedPassage('Wetterbericht: morgen Regen in Hamburg');"
                    + "const dot=(a,b)=>{let s=0;for(let i=0;i<a.length;i++)s+=a[i]*b[i];return s;};"
                    + "window.__sem=JSON.stringify({fallback:SbkimEmbedding.getModelFallback(),dim:q.length,near:dot(q,near),far:dot(q,far),source:SbkimEmbedding.getModelSource(),root:SbkimEmbedding.getModelRoot(),offline:PBNetwork.offline});"
                    + "}catch(e){window.__sem=JSON.stringify({error:String(e&&e.message||e),fallback:SbkimEmbedding.getModelFallback&&SbkimEmbedding.getModelFallback(),source:SbkimEmbedding.getModelSource()});}})()");
                String raw = await(scenario, "window.__sem||''", 300, context);
                JSONObject result = new JSONObject(new JSONObject("{\"v\":" + raw + "}").getString("v"));
                assertTrue("model did not load: " + result, !result.has("error"));
                assertEquals("e5-small vectors have 384 dimensions", 384, result.getInt("dim"));
                Log.i("NativeSemanticTest", "result " + result);
                assertEquals("model comes from the app " + result, "local", result.getString("source"));
                assertTrue("no fallback to the internet " + result, result.isNull("fallback") || !result.has("fallback"));
                assertEquals("from the app's own address", "https://localhost/models/", result.getString("root"));
                assertTrue("app stayed offline", result.getBoolean("offline"));
                assertTrue("meaning: dentist bill nearer than weather " + result, result.getDouble("near") > result.getDouble("far") + 0.02);
            } finally {
                evaluate(scenario, "PBNetwork.setOffline(false)");
            }
        } finally {
            AppNetwork.setOffline(context, false);
        }
    }
}
