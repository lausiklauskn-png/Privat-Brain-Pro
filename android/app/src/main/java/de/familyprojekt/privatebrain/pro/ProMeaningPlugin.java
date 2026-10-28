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
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.atomic.AtomicReference;

/**
 * Switch for the second meaning model (Pro-Umbau 5, Klaus 2026-10-28: "unabhängig vom Mycel ein zweites
 * Embedding-Modell … ein größeres Modell für die Bedeutungssuche innerhalb der App"). Two stages, each its own
 * folder and preferences: "mittel" (multilingual-e5-base, files/meaning-mittel) and "gross" (multilingual-e5-large,
 * files/meaning-gross). The same engine as the other models (SemanticModel): streamed natively into app storage,
 * resumed after an interruption, accepted only with the fingerprints from public/meaning-models.json, removed on
 * request. Mycel and seal keep Modul 03 (e5-small); this model is read only by native-meaning.js.
 * Only one download runs at a time.
 */
@CapacitorPlugin(name = "ProMeaning")
public class ProMeaningPlugin extends Plugin {
    static final String PINS = "public/meaning-models.json";
    static final String[] STAGES = {"mittel", "gross"};
    private static final Map<String, SemanticModel> shared = new HashMap<>();
    private static final ExecutorService worker = Executors.newSingleThreadExecutor();
    /** The stage being downloaded, or null. */
    private static final AtomicReference<String> running = new AtomicReference<>();

    static boolean known(String stage) { return "mittel".equals(stage) || "gross".equals(stage); }
    static String dir(String stage) { return "meaning-" + stage; }

    static synchronized SemanticModel model(Context context, String stage) {
        if (!known(stage)) return null;
        SemanticModel m = shared.get(stage);
        if (m == null) {
            File folder = new File(context.getFilesDir(), dir(stage));
            List<SemanticModel.Entry> entries;
            try { entries = entries(context, stage); } catch (Exception error) { entries = new ArrayList<>(); }
            m = new SemanticModel(folder, entries, url -> (HttpURLConnection) url.openConnection());
            shared.put(stage, m);
        }
        return m;
    }

    static List<SemanticModel.Entry> entries(Context context, String stage) throws Exception {
        String text;
        try (InputStream in = context.getAssets().open(PINS)) {
            java.io.ByteArrayOutputStream all = new java.io.ByteArrayOutputStream();
            byte[] b = new byte[8192]; for (int n; (n = in.read(b)) > 0; ) all.write(b, 0, n);
            text = all.toString(StandardCharsets.UTF_8.name());
        }
        return ProSemanticPlugin.meaningEntries(text, stage);
    }

    private static SharedPreferences prefs(Context context, String stage) { return context.getSharedPreferences(dir(stage), Context.MODE_PRIVATE); }

    /** Called by MainActivity when the WebView's renderer ended: a stage that was starting counts a crash. */
    static void rendererGone(Context context, boolean didCrash, int priority) {
        for (String stage : STAGES) {
            SharedPreferences p = prefs(context, stage);
            SharedPreferences.Editor e = p.edit()
                .putString("lastGone", (didCrash ? "crash" : "killed") + " priority=" + priority + " at=" + System.currentTimeMillis());
            if (p.getBoolean("loading", false)) e.putBoolean("loading", false).putInt("crashes", p.getInt("crashes", 0) + 1);
            e.commit();
        }
    }

    private JSObject stageState(String stage) {
        SemanticModel m = model(getContext(), stage);
        SharedPreferences p = prefs(getContext(), stage);
        return new JSObject()
            .put("installed", m.installed())
            .put("running", stage.equals(running.get()))
            .put("present", m.present())
            .put("total", m.total())
            .put("files", m.entries().size())
            .put("crashes", p.getInt("crashes", 0))
            .put("lastGone", p.getString("lastGone", ""));
    }

    private JSObject state() {
        JSObject stages = new JSObject();
        for (String stage : STAGES) stages.put(stage, stageState(stage));
        String r = running.get();
        return new JSObject().put("stages", stages).put("running", r == null ? "" : r);
    }

    private String stage(PluginCall call) {
        String stage = call.getString("stage", "");
        if (!known(stage)) { call.reject("Unknown stage", "INVALID_INPUT"); return null; }
        return stage;
    }

    @PluginMethod public void getState(PluginCall call) { call.resolve(state()); }

    @PluginMethod public void install(PluginCall call) {
        String stage = stage(call); if (stage == null) return;
        SemanticModel m = model(getContext(), stage);
        if (m.entries().isEmpty()) { call.reject("No fingerprints for this meaning model in this build", "NO_PINS"); return; }
        if (!running.compareAndSet(null, stage)) { call.reject("Already loading", "BUSY"); return; }
        worker.execute(() -> {
            long[] last = {0};
            try {
                m.install((done, total, file, source) -> {
                    long now = System.currentTimeMillis();
                    if (now - last[0] < 250 && done < total) return;
                    last[0] = now;
                    notifyListeners("progress", new JSObject().put("stage", stage).put("done", done).put("total", total).put("file", file).put("source", source));
                });
                running.set(null);
                prefs(getContext(), stage).edit().putInt("crashes", 0).commit();
                call.resolve(state());
            } catch (SemanticModel.Failure f) {
                running.set(null); call.reject(f.getMessage(), f.code);
            } catch (Exception error) {
                running.set(null); call.reject("Model download failed", "DOWNLOAD");
            }
        });
    }

    @PluginMethod public void cancel(PluginCall call) {
        String stage = stage(call); if (stage == null) return;
        model(getContext(), stage).cancel(); call.resolve(state());
    }

    @PluginMethod public void remove(PluginCall call) {
        String stage = stage(call); if (stage == null) return;
        if (stage.equals(running.get())) model(getContext(), stage).cancel();
        worker.execute(() -> {
            try {
                model(getContext(), stage).remove();
                prefs(getContext(), stage).edit().clear().commit();
                call.resolve(state());
            } catch (Exception error) { call.reject("Model could not be removed", "REMOVE_FAILED"); }
        });
    }

    /** The page is about to start this stage; a renderer end until markLoaded counts as a crash. */
    @PluginMethod public void markLoading(PluginCall call) {
        String stage = stage(call); if (stage == null) return;
        prefs(getContext(), stage).edit().putBoolean("loading", true).commit(); call.resolve(state());
    }

    @PluginMethod public void markLoaded(PluginCall call) {
        String stage = stage(call); if (stage == null) return;
        prefs(getContext(), stage).edit().putBoolean("loading", false).putInt("crashes", 0).commit(); call.resolve(state());
    }

    /** Klaus tapped "try again" after a crash. */
    @PluginMethod public void clearCrash(PluginCall call) {
        String stage = stage(call); if (stage == null) return;
        prefs(getContext(), stage).edit().putInt("crashes", 0).commit(); call.resolve(state());
    }
}
