package de.familyprojekt.privatebrain.pro;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertTrue;
import static org.junit.Assert.fail;

import androidx.test.core.app.ActivityScenario;
import androidx.test.ext.junit.runners.AndroidJUnit4;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicReference;
import org.json.JSONObject;
import org.junit.Test;
import org.junit.runner.RunWith;

/**
 * The real meaning model inside the packaged app (Klaus 2026-10-21: "Modell fest einbauen"):
 * Modul 03 loads it with the app cut off from the internet, from the APK, and its vectors
 * understand meaning (a dentist bill is nearer to "Zahnarztrechnung" than a weather report).
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
        assertTrue("WebView did not return a JavaScript result", complete.await(10, TimeUnit.SECONDS));
        return result.get();
    }

    private String await(ActivityScenario<MainActivity> scenario, String script, int seconds) throws Exception {
        long deadline = System.nanoTime() + TimeUnit.SECONDS.toNanos(seconds);
        while (System.nanoTime() < deadline) {
            String value = evaluate(scenario, script);
            if (value != null && !"null".equals(value) && !"\"\"".equals(value)) return value;
            Thread.sleep(500);
        }
        fail("Bundled app did not answer: " + script);
        return null;
    }

    @Test public void realModelLoadsOfflineFromTheApkAndUnderstandsMeaning() throws Exception {
        try (ActivityScenario<MainActivity> scenario = ActivityScenario.launch(MainActivity.class)) {
            await(scenario, "(window.SbkimEmbedding&&window.PBNetwork&&window.PBNetwork.ready)?'yes':''", 90);
            evaluate(scenario, "window.__semOff=null;PBNetwork.setOffline(true).then(()=>window.__semOff='ok',e=>window.__semOff='err:'+e.message)");
            assertEquals("\"ok\"", await(scenario, "window.__semOff||''", 30));
            try {
                evaluate(scenario, "window.__sem=null;(async()=>{try{await SbkimEmbedding.init();"
                    + "const q=await SbkimEmbedding.embedQuery('Rechnung vom Zahnarzt');"
                    + "const near=await SbkimEmbedding.embedPassage('Zahnarztrechnung über 120 Euro für eine Füllung');"
                    + "const far=await SbkimEmbedding.embedPassage('Wetterbericht: morgen Regen in Hamburg');"
                    + "const dot=(a,b)=>{let s=0;for(let i=0;i<a.length;i++)s+=a[i]*b[i];return s;};"
                    + "window.__sem=JSON.stringify({dim:q.length,near:dot(q,near),far:dot(q,far),source:SbkimEmbedding.getModelSource(),offline:PBNetwork.offline});"
                    + "}catch(e){window.__sem=JSON.stringify({error:String(e&&e.message||e)});}})()");
                String raw = await(scenario, "window.__sem||''", 240);
                JSONObject result = new JSONObject(new JSONObject("{\"v\":" + raw + "}").getString("v"));
                assertTrue("model did not load: " + result, !result.has("error"));
                assertEquals("e5-small vectors have 384 dimensions", 384, result.getInt("dim"));
                assertEquals("model comes from the app", "local", result.getString("source"));
                assertTrue("app stayed offline", result.getBoolean("offline"));
                assertTrue("meaning: dentist bill nearer than weather " + result, result.getDouble("near") > result.getDouble("far") + 0.02);
            } finally {
                evaluate(scenario, "PBNetwork.setOffline(false)");
                await(scenario, "PBNetwork.offline?'':'online'", 30);
            }
        }
    }
}
