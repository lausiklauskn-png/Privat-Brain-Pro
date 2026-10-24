package de.familyprojekt.privatebrain.pro;

import static org.junit.Assert.*;

import android.app.Activity;
import android.app.Instrumentation;
import android.content.Intent;
import android.net.Uri;
import androidx.test.core.app.ActivityScenario;
import androidx.test.ext.junit.runners.AndroidJUnit4;
import androidx.test.platform.app.InstrumentationRegistry;
import java.io.File;
import java.io.InputStream;
import java.lang.reflect.Field;
import java.nio.file.Files;
import java.util.Arrays;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicReference;
import org.json.JSONObject;
import org.junit.Test;
import org.junit.runner.RunWith;

/** Real plugin queues and provider bytes. No actual recipient app or user file. */
@RunWith(AndroidJUnit4.class)
public class NativeFileHandoffTest {
    private String evaluate(ActivityScenario<MainActivity> scenario, String script) throws Exception {
        CountDownLatch complete = new CountDownLatch(1);
        AtomicReference<String> value = new AtomicReference<>();
        scenario.onActivity(activity -> activity.getBridge().getWebView().evaluateJavascript(script, result -> {
            value.set(result); complete.countDown();
        }));
        assertTrue("WebView response", complete.await(10, TimeUnit.SECONDS));
        return value.get();
    }

    private void await(ActivityScenario<MainActivity> scenario, String script) throws Exception {
        long until = System.nanoTime() + TimeUnit.SECONDS.toNanos(30);
        while (System.nanoTime() < until) {
            if ("true".equals(evaluate(scenario, script))) return;
            Thread.sleep(100);
        }
        fail("File handoff did not complete: " + script);
    }

    @Test public void shareBypassesBusyPdfQueueAndStillRejectsChangedOriginalBytes() throws Exception {
        Instrumentation instrumentation = InstrumentationRegistry.getInstrumentation();
        var context = instrumentation.getTargetContext();
        File source = NativePdfTest.fixture(context);
        byte[] bytes = Files.readAllBytes(source.toPath());
        String hash = OriginalFileStore.digest(source);
        OriginalFileStore store = new OriginalFileStore(context);
        JSONObject started = store.begin(hash, bytes.length, "Verified share probe.pdf", "application/pdf");
        if (!started.optBoolean("stored", false)) {
            String ticket = started.getString("ticket");
            for (int offset = 0; offset < bytes.length; offset += OriginalFileStore.CHUNK)
                store.append(ticket, offset, Arrays.copyOfRange(bytes, offset, Math.min(bytes.length, offset + OriginalFileStore.CHUNK)));
            store.finish(ticket);
        }
        File original = store.file(hash);
        CountDownLatch queued = new CountDownLatch(1), release = new CountDownLatch(1), chooser = new CountDownLatch(1);
        CopyOnWriteArrayList<Intent> offers = new CopyOnWriteArrayList<>();
        Instrumentation.ActivityMonitor monitor = new Instrumentation.ActivityMonitor() {
            @Override public Instrumentation.ActivityResult onStartActivity(Intent intent) {
                if (!Intent.ACTION_CHOOSER.equals(intent.getAction())) return null;
                Intent offered = intent.getParcelableExtra(Intent.EXTRA_INTENT);
                if (offered == null || !Intent.ACTION_SEND.equals(offered.getAction())) return null;
                offers.add(new Intent(offered)); chooser.countDown();
                return new Instrumentation.ActivityResult(Activity.RESULT_CANCELED, null);
            }
        };
        instrumentation.addMonitor(monitor);
        try (ActivityScenario<MainActivity> scenario = ActivityScenario.launch(MainActivity.class)) {
            try {
                await(scenario, "Boolean(window.Capacitor?.Plugins?.ProFiles?.share && window.PBNavigation)");
                AtomicReference<ExecutorService> fileQueue = new AtomicReference<>();
                scenario.onActivity(activity -> {
                    try {
                        var plugin = activity.getBridge().getPlugin("ProFiles").getInstance();
                        Field field = ProFilesPlugin.class.getDeclaredField("worker"); field.setAccessible(true);
                        fileQueue.set((ExecutorService) field.get(plugin));
                    } catch (Exception error) { throw new AssertionError(error); }
                });
                fileQueue.get().execute(() -> {
                    queued.countDown();
                    try { release.await(45, TimeUnit.SECONDS); }
                    catch (InterruptedException ignored) { Thread.currentThread().interrupt(); }
                });
                assertTrue("PDF/file lane is deliberately occupied", queued.await(5, TimeUnit.SECONDS));
                evaluate(scenario, "window.__fileHandoff=null;Capacitor.Plugins.ProFiles.share({hash:" + JSONObject.quote(hash)
                    + "}).then(r=>window.__fileHandoff=r.ok?'ok':'bad',e=>window.__fileHandoff=e.code||'bad');true");
                assertTrue("Share must reach its chooser while the PDF lane is still blocked", chooser.await(10, TimeUnit.SECONDS));
                assertEquals("The old queue was never released to make Share pass", 1L, release.getCount());
                await(scenario, "window.__fileHandoff==='ok'");
                assertEquals(1, offers.size());
                Intent offered = offers.get(0);
                assertEquals("application/pdf", offered.getType());
                assertEquals(Intent.FLAG_GRANT_READ_URI_PERMISSION, offered.getFlags());
                Uri uri = offered.getParcelableExtra(Intent.EXTRA_STREAM);
                assertNotNull(uri);
                assertEquals(uri, offered.getClipData().getItemAt(0).getUri());
                try (InputStream stream = context.getContentResolver().openInputStream(uri)) {
                    assertNotNull(stream); assertArrayEquals(bytes, stream.readAllBytes());
                }
                // Faster dispatch must not replace the selected original's fingerprint check.
                byte[] changed = bytes.clone(); changed[changed.length - 1] ^= 1;
                Files.write(original.toPath(), changed);
                evaluate(scenario, "window.__fileHandoff=null;Capacitor.Plugins.ProFiles.share({hash:" + JSONObject.quote(hash)
                    + "}).then(()=>window.__fileHandoff='unexpected',e=>window.__fileHandoff=e.code||'bad');true");
                await(scenario, "window.__fileHandoff==='FILE_UNAVAILABLE'");
                assertEquals("Changed bytes must never reach another chooser", 1, offers.size());
            } finally { release.countDown(); Files.write(original.toPath(), bytes); }
        } finally { instrumentation.removeMonitor(monitor); source.delete(); }
    }
}
