package de.familyprojekt.privatebrain.pro;

import static org.junit.Assert.*;
import android.content.Context;
import androidx.test.core.app.ActivityScenario;
import androidx.test.core.app.ApplicationProvider;
import androidx.test.ext.junit.runners.AndroidJUnit4;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicReference;
import org.json.JSONObject;
import org.junit.Test;
import org.junit.runner.RunWith;

/** Real quantized Marian inference with the app cut off before the worker starts. Synthetic text only. */
@RunWith(AndroidJUnit4.class)
public class NativeTranslationTest {
    private String evaluate(ActivityScenario<MainActivity> scenario, String script) throws Exception {
        CountDownLatch complete = new CountDownLatch(1);
        AtomicReference<String> result = new AtomicReference<>();
        scenario.onActivity(activity -> activity.getBridge().getWebView().evaluateJavascript(script, value -> {
            result.set(value); complete.countDown();
        }));
        assertTrue("WebView response", complete.await(10, TimeUnit.SECONDS));
        return result.get();
    }

    private String await(ActivityScenario<MainActivity> scenario, String script, int seconds, Context context) throws Exception {
        long deadline = System.nanoTime() + TimeUnit.SECONDS.toNanos(seconds);
        while (System.nanoTime() < deadline) {
            String value = evaluate(scenario, script);
            if (value != null && !value.equals("null") && !value.equals("\"\"")) return value;
            String gone = context.getSharedPreferences("translation", Context.MODE_PRIVATE).getString("lastGone", "");
            if (!gone.isEmpty()) fail("Translation renderer stopped: " + gone + "; local assets=" + TranslationAssets.diagnostics());
            Thread.sleep(1000);
        }
        String diagnostic = evaluate(scenario, "JSON.stringify({worker:window.PBTranslationDevice?.diagnostics?.(),models:window.__translationReaderTest?.models})");
        fail("Translation did not finish within " + seconds + " seconds; diagnostic=" + diagnostic + "; local assets=" + TranslationAssets.diagnostics());
        return null;
    }

    @Test public void staleCompletionAndDownloadCannotClearTheInferenceCrashGuard() throws Exception {
        Context context = ApplicationProvider.getApplicationContext();
        AppNetwork.initialize(context);
        AppNetwork.setOffline(context, true);
        context.getSharedPreferences("translation", Context.MODE_PRIVATE).edit().clear().commit();
        try (ActivityScenario<MainActivity> scenario = ActivityScenario.launch(MainActivity.class)) {
            await(scenario, "(window.PBTranslationDevice&&window.Capacitor&&Capacitor.Plugins.ProTranslation)?'yes':''", 90, context);
            evaluate(scenario, "window.__translationGuard=null;(async()=>{try{const p=Capacitor.Plugins.ProTranslation;"
                + "await p.markLoading({id:'old-job'});await p.markLoading({id:'current-job'});await p.markFinished({id:'old-job',failed:true});"
                + "const stale=await p.status({source:'de',target:'en'});await p.markFinished({id:'current-job',failed:true});"
                + "const failed=await p.status({source:'de',target:'en'});"
                + "const downloaded=await p.download({source:'en',target:'en'});let refused='';"
                + "try{await p.markLoading({id:'blocked-job'});}catch(e){refused=e.code||'';}"
                + "await p.clearCrash();const cleared=await p.status();"
                + "window.__translationGuard=JSON.stringify({staleBlocked:stale.blocked,failedBlocked:failed.blocked,downloadBlocked:downloaded.blocked,refused,clearedBlocked:cleared.blocked});"
                + "}catch(e){window.__translationGuard=JSON.stringify({error:String(e&&e.message||e),code:e&&e.code});}})()");
            String raw = await(scenario, "window.__translationGuard||''", 30, context);
            JSONObject result = new JSONObject(new JSONObject("{\"v\":" + raw + "}").getString("v"));
            assertFalse("native guard contract: " + result, result.has("error"));
            assertFalse("stale failure cannot overwrite current job", result.getBoolean("staleBlocked"));
            assertTrue("actual job failure blocks automatic restart", result.getBoolean("failedBlocked"));
            assertTrue("even a successful no-download action cannot clear it", result.getBoolean("downloadBlocked"));
            assertEquals("MODEL_BLOCKED", result.getString("refused"));
            assertFalse("only explicit retry clears it", result.getBoolean("clearedBlocked"));
            assertEquals("", context.getSharedPreferences("translation", Context.MODE_PRIVATE).getString("loadingId", ""));
        } finally {
            context.getSharedPreferences("translation", Context.MODE_PRIVATE).edit().clear().commit();
            AppNetwork.setOffline(context, false);
        }
    }

    @Test public void selectedPublicModelTranslatesBelowOriginalWithoutNetworkOrAiKey() throws Exception {
        Context context = ApplicationProvider.getApplicationContext();
        AppNetwork.initialize(context);
        AppNetwork.setOffline(context, false);
        context.getSharedPreferences("translation", Context.MODE_PRIVATE).edit().clear().commit();
        TranslationModels all = ProTranslationPlugin.models(context);
        // Test fixture simulates the explicit model-download action. No email is sent to these hosts.
        all.library.install((d, t, f, s) -> {});
        for (TranslationModels.Definition def : all.route("de", "en")) def.model.install((d, t, f, s) -> {});
        assertTrue(all.library.installed());
        assertTrue(all.route("de", "en").get(0).model.installed());
        TranslationAssets.enableDiagnostics(true);
        AppNetwork.setOffline(context, true);
        try (ActivityScenario<MainActivity> scenario = ActivityScenario.launch(MainActivity.class)) {
            await(scenario, "(window.PBMailTranslation&&window.PBTranslationDevice&&window.PBNetwork&&PBNetwork.ready)?'yes':''", 90, context);
            scenario.onActivity(activity -> {
                assertTrue("document network stays blocked", activity.getBridge().getWebView().getSettings().getBlockNetworkLoads());
                assertTrue("worker network stays blocked", android.webkit.ServiceWorkerController.getInstance()
                    .getServiceWorkerWebSettings().getBlockNetworkLoads());
            });
            final String originalText = "Die Katze sitzt auf dem Tisch. Bitte prüfen Sie die Rechnung für unsere Besprechung. "
                + "Wir werden die Unterlagen mit freundlichen Grüßen an Ihre Firma schicken.";
            try {
                // Use the shipped reader UI. No translate/download button is clicked and no
                // translation API is called by the test: opening the reader starts its real flow.
                evaluate(scenario, "window.__localTranslation=null;(async()=>{try{"
                    + "const text=" + JSONObject.quote(originalText) + ";"
                    + "const modelState=await PBTranslationDevice.status({source:'de',target:'en'});"
                    + "const models={ready:modelState.ready,blocked:modelState.blocked,crashes:modelState.crashes,route:modelState.route?.map(leg=>leg.key),total:modelState.total,present:modelState.present};"
                    + "const checked=await fetch(location.origin+'/pb-translation/models/Xenova/opus-mt-de-en/config.json');"
                    + "if(checked.status!==200)throw Object.assign(new Error('Local model preflight'),{code:'LOCAL_MODEL_HTTP_'+checked.status});"
                    + "const config=await checked.json();if(config.model_type!=='marian')throw Object.assign(new Error('Local model preflight'),{code:'LOCAL_MODEL_CONFIG'});"
                    + "const saved={language:localStorage.getItem('pb_mail_translation_language_v1'),route:localStorage.getItem('pb_mail_translation_route_v1'),ui:document.documentElement.lang};"
                    + "localStorage.setItem('pb_mail_translation_language_v1','en');localStorage.setItem('pb_mail_translation_route_v1','device');document.documentElement.lang='de';"
                    + "const host=document.createElement('section');host.id='native-translation-reader';host.style.cssText='position:fixed;inset:0;z-index:2147483647;display:block;overflow:auto;background:white;color:black;padding:16px';"
                    + "const actions=document.createElement('div');actions.className='mail-actions';"
                    + "const original=document.createElement('pre');original.className='mail-text';original.textContent=text;host.append(actions,original);document.body.append(host);"
                    + "const mounted=PBMailTranslation.mount({host,actions,source:async()=>({text})});"
                    + "if(!mounted)throw new Error('Real mail translation panel did not mount');"
                    + "window.__translationReaderTest={host,original,panel:mounted.panel,saved,models};"
                    + "}catch(e){window.__localTranslation=JSON.stringify({error:'Native reader setup failed',code:e&&e.code,diagnostics:window.PBTranslationDevice?.diagnostics?.()});}})()");
                String raw = await(scenario, "window.__localTranslation||(()=>{const f=window.__translationReaderTest;if(!f)return '';"
                    + "const output=f.panel.querySelector('.pb-mail-translation-result'),result=f.panel.querySelector('[data-mail-translate=result]'),target=f.panel.querySelector('[data-mail-translate=target]');"
                    + "const status=f.panel.querySelector('[role=status]')?.textContent||'';"
                    + "if(/konnte nicht|nicht verfügbar|angehalten|nicht sicher|fehlen noch/.test(status))return JSON.stringify({error:status,diagnostics:PBTranslationDevice.diagnostics?.(),models:f.models});"
                    + "if(!output||output.hidden||!result?.textContent.trim()||target.disabled)return '';"
                    + "return JSON.stringify({text:result.textContent,original:f.original.textContent,below:f.original.nextElementSibling===f.panel,visible:!f.panel.hidden&&f.host.getClientRects().length>0,target:target.value,source:f.panel.querySelector('[data-mail-translate=source]').value,route:f.panel.querySelector('[data-mail-translate=route]').value,resultLanguage:result.lang,offline:PBNetwork.offline});})()", 360, context);
                JSONObject result = new JSONObject(new JSONObject("{\"v\":" + raw + "}").getString("v"));
                assertFalse("real reader/bridge/worker inference failed: " + result + "; local assets=" + TranslationAssets.diagnostics(), result.has("error"));
                assertTrue("reader translated automatically while offline", result.getBoolean("offline"));
                assertEquals("original mail text is preserved exactly", originalText, result.getString("original"));
                assertTrue("translation panel directly follows the original", result.getBoolean("below"));
                assertTrue("translation is visible in the reader", result.getBoolean("visible"));
                assertEquals("language was identified without selecting it", "auto", result.getString("source"));
                assertEquals("device", result.getString("route"));
                assertEquals("en", result.getString("target"));
                assertEquals("translated text is marked as English", "en", result.getString("resultLanguage"));
                String translated = result.getString("text").toLowerCase(java.util.Locale.ROOT);
                assertTrue("English translation preserves the subject", translated.contains("cat"));
                assertTrue("English translation preserves the object", translated.contains("table"));
                assertFalse("output is generated, not echoed", translated.contains("katze"));
                assertEquals("no stuck loading flag", "", context.getSharedPreferences("translation", Context.MODE_PRIVATE).getString("loadingId", ""));
            } finally {
                evaluate(scenario, "(()=>{const f=window.__translationReaderTest;if(!f)return;f.host.remove();for(const [key,value] of [['pb_mail_translation_language_v1',f.saved.language],['pb_mail_translation_route_v1',f.saved.route]]){if(value==null)localStorage.removeItem(key);else localStorage.setItem(key,value);}document.documentElement.lang=f.saved.ui;delete window.__translationReaderTest;})()");
            }
        } finally {
            TranslationAssets.enableDiagnostics(false);
            AppNetwork.setOffline(context, false);
        }
    }
}
