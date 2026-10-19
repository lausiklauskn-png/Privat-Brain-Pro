package de.familyprojekt.privatebrain.pro;

import androidx.test.core.app.ActivityScenario;
import androidx.test.ext.junit.runners.AndroidJUnit4;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicReference;
import org.junit.Test;
import org.junit.runner.RunWith;
import static org.junit.Assert.*;

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
            awaitTrue(scenario, "Boolean(window.__nativeSmokeInfo && window.__nativeSmokeInfo.platform === 'android' && window.__nativeSmokeInfo.versionName && window.__nativeSmokeInfo.nativeMail === false)");
            evaluate(scenario, "document.querySelector('.main-pages [data-tab=explorer]').click(); true");
            awaitTrue(scenario, "document.querySelector('#panel-explorer').getBoundingClientRect().height > 0 && document.querySelector('#q').getBoundingClientRect().height === 0");
            evaluate(scenario, "document.querySelector('.main-pages [data-tab=search]').click(); true");
            awaitTrue(scenario, "document.querySelector('#q').getBoundingClientRect().height > 0");
        }
    }
}
