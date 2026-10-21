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
import java.util.Iterator;
import java.util.List;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.atomic.AtomicBoolean;
import org.json.JSONArray;
import org.json.JSONObject;

/**
 * Switch for the meaning model (Klaus 2026-10-21). Loads the files natively (SemanticModel),
 * reports progress, removes them on request and remembers when the view died while the model
 * was starting, so the next start does not load it again by itself.
 */
@CapacitorPlugin(name = "ProSemantic")
public class ProSemanticPlugin extends Plugin {
    static final String PINS = "public/semantic-model.json";
    private static SemanticModel shared;
    // Shared across activity restarts: a download keeps running when the view is recreated.
    private static final ExecutorService worker = Executors.newSingleThreadExecutor();
    private static final AtomicBoolean running = new AtomicBoolean();

    static synchronized SemanticModel model(Context context) {
        if (shared == null) {
            try {
                shared = new SemanticModel(new File(context.getFilesDir(), "semantic"), entries(context),
                    url -> (HttpURLConnection) url.openConnection());
            } catch (Exception error) {
                shared = new SemanticModel(new File(context.getFilesDir(), "semantic"), new ArrayList<>(), url -> (HttpURLConnection) url.openConnection());
            }
        }
        return shared;
    }

    static List<SemanticModel.Entry> entries(Context context) throws Exception {
        String text;
        try (InputStream in = context.getAssets().open(PINS)) {
            java.io.ByteArrayOutputStream all = new java.io.ByteArrayOutputStream();
            byte[] b = new byte[8192]; for (int n; (n = in.read(b)) > 0; ) all.write(b, 0, n);
            text = all.toString(StandardCharsets.UTF_8.name());
        }
        JSONObject pins = new JSONObject(text), lib = pins.getJSONObject("library"), mod = pins.getJSONObject("model");
        JSONObject sizes = pins.optJSONObject("sizes"), download = pins.getJSONObject("download");
        List<SemanticModel.Entry> list = new ArrayList<>();
        add(list, "lib/", lib.getJSONObject("files"), sizes, download.getJSONArray("library"), lib.getString("version"), "", "");
        add(list, "model/", mod.getJSONObject("files"), sizes, download.getJSONArray("model"), "", mod.getString("id"), mod.getString("revision"));
        return list;
    }

    private static void add(List<SemanticModel.Entry> list, String prefix, JSONObject files, JSONObject sizes, JSONArray templates,
                            String version, String id, String revision) throws Exception {
        for (Iterator<String> it = files.keys(); it.hasNext(); ) {
            String name = it.next();
            List<String> urls = new ArrayList<>();
            for (int i = 0; i < templates.length(); i++)
                urls.add(templates.getString(i).replace("{version}", version).replace("{id}", id).replace("{revision}", revision).replace("{file}", name));
            long size = sizes == null ? 0 : sizes.optLong(prefix + name, 0);
            list.add(new SemanticModel.Entry(prefix + name, files.getString(name), size, urls));
        }
    }

    private static SharedPreferences prefs(Context context) { return context.getSharedPreferences("semantic", Context.MODE_PRIVATE); }

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
