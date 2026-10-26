package de.familyprojekt.privatebrain.pro;

import android.content.Context;
import android.content.SharedPreferences;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.io.File;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.atomic.AtomicBoolean;

/**
 * Switch for the image model (Bildbeschreibung, Sitzung 4, Klaus 2026-10-26: "Bilder verstehen muss unbedingt
 * mit rein, überall"). The same engine as the meaning model (SemanticModel): files are streamed natively into
 * app storage (files/caption), resumed after an interruption, accepted only with the fingerprints from
 * public/caption-model.json, removed on request. The page reads the checked files through MainActivity as
 * local addresses; a renderer end while the model starts is remembered, so it does not start again by itself.
 */
@CapacitorPlugin(name = "ProCaption")
public class ProCaptionPlugin extends Plugin {
    static final String PINS = "public/caption-model.json";
    static final String DIR = "caption";
    private static SemanticModel shared;
    private static final ExecutorService worker = Executors.newSingleThreadExecutor();
    private static final AtomicBoolean running = new AtomicBoolean();

    static synchronized SemanticModel model(Context context) {
        if (shared == null) {
            try {
                shared = new SemanticModel(new File(context.getFilesDir(), DIR), entries(context), url -> (HttpURLConnection) url.openConnection());
            } catch (Exception error) {
                shared = new SemanticModel(new File(context.getFilesDir(), DIR), new ArrayList<>(), url -> (HttpURLConnection) url.openConnection());
            }
        }
        return shared;
    }

    /** The same pin layout as the meaning model, read from caption-model.json. */
    static List<SemanticModel.Entry> entries(Context context) throws Exception {
        String text;
        try (InputStream in = context.getAssets().open(PINS)) {
            java.io.ByteArrayOutputStream all = new java.io.ByteArrayOutputStream();
            byte[] b = new byte[8192]; for (int n; (n = in.read(b)) > 0; ) all.write(b, 0, n);
            text = all.toString(StandardCharsets.UTF_8.name());
        }
        return ProSemanticPlugin.entries(text);
    }

    private static SharedPreferences prefs(Context context) { return context.getSharedPreferences(DIR, Context.MODE_PRIVATE); }

    /** Called by MainActivity when the WebView's renderer ended. */
    static void rendererGone(Context context, boolean didCrash, int priority) {
        SharedPreferences p = prefs(context);
        SharedPreferences.Editor e = p.edit()
            .putString("lastGone", (didCrash ? "crash" : "killed") + " priority=" + priority + " at=" + System.currentTimeMillis());
        if (p.getBoolean("loading", false)) e.putBoolean("loading", false).putInt("crashes", p.getInt("crashes", 0) + 1);
        e.commit();
    }

    private JSObject state() {
        SemanticModel m = model(getContext());
        SharedPreferences p = prefs(getContext());
        return new JSObject()
            .put("installed", m.installed())
            .put("running", running.get())
            .put("present", m.present())
            .put("total", m.total())
            .put("files", m.entries().size())
            .put("crashes", p.getInt("crashes", 0))
            .put("lastGone", p.getString("lastGone", ""));
    }

    @PluginMethod public void getState(PluginCall call) { call.resolve(state()); }

    @PluginMethod public void install(PluginCall call) {
        if (!running.compareAndSet(false, true)) { call.reject("Already loading", "BUSY"); return; }
        SemanticModel m = model(getContext());
        if (m.entries().isEmpty()) { running.set(false); call.reject("No fingerprints for the image model in this build", "NO_PINS"); return; }
        worker.execute(() -> {
            long[] last = {0};
            try {
                m.install((done, total, file, source) -> {
                    long now = System.currentTimeMillis();
                    if (now - last[0] < 250 && done < total) return;
                    last[0] = now;
                    notifyListeners("progress", new JSObject().put("done", done).put("total", total).put("file", file).put("source", source));
                });
                running.set(false);
                prefs(getContext()).edit().putInt("crashes", 0).commit();
                call.resolve(state());
            } catch (SemanticModel.Failure f) {
                running.set(false); call.reject(f.getMessage(), f.code);
            } catch (Exception error) {
                running.set(false); call.reject("Model download failed", "DOWNLOAD");
            }
        });
    }

    @PluginMethod public void cancel(PluginCall call) { model(getContext()).cancel(); call.resolve(state()); }

    @PluginMethod public void remove(PluginCall call) {
        model(getContext()).cancel();
        worker.execute(() -> {
            try {
                model(getContext()).remove();
                prefs(getContext()).edit().clear().commit();
                call.resolve(state());
            } catch (Exception error) { call.reject("Model could not be removed", "REMOVE_FAILED"); }
        });
    }

    /** The page is about to start the model; a renderer end until markLoaded counts as a crash. */
    @PluginMethod public void markLoading(PluginCall call) { prefs(getContext()).edit().putBoolean("loading", true).commit(); call.resolve(state()); }

    @PluginMethod public void markLoaded(PluginCall call) { prefs(getContext()).edit().putBoolean("loading", false).putInt("crashes", 0).commit(); call.resolve(state()); }

    /** Klaus tapped "try again" after a crash. */
    @PluginMethod public void clearCrash(PluginCall call) { prefs(getContext()).edit().putInt("crashes", 0).commit(); call.resolve(state()); }
}
