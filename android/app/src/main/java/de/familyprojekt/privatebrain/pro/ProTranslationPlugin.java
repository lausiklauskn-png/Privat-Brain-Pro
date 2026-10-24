package de.familyprojekt.privatebrain.pro;

import android.content.Context;
import android.content.SharedPreferences;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.atomic.AtomicLong;
import org.json.JSONArray;
import org.json.JSONObject;

/** Explicit public model downloads; isolated Web Worker inference never sends mail to native HTTP. */
@CapacitorPlugin(name = "ProTranslation")
public class ProTranslationPlugin extends Plugin {
    private static final String PINS = "public/translation-models.json";
    private static TranslationModels shared;
    private static final ExecutorService worker = Executors.newSingleThreadExecutor();
    private static final AtomicBoolean running = new AtomicBoolean();
    private static final AtomicLong generation = new AtomicLong();
    private static final Object inferenceLock = new Object();
    private static volatile SemanticModel active;

    static synchronized TranslationModels models(Context context) throws Exception {
        if (shared == null) {
            ByteArrayOutputStream text = new ByteArrayOutputStream();
            try (InputStream in = context.getAssets().open(PINS)) {
                byte[] buffer = new byte[8192];
                for (int n; (n = in.read(buffer)) > 0; ) text.write(buffer, 0, n);
            }
            shared = TranslationModels.parse(new File(context.getFilesDir(), "translation"),
                new JSONObject(text.toString(StandardCharsets.UTF_8.name())), url -> (HttpURLConnection) url.openConnection());
        }
        return shared;
    }

    private static SharedPreferences prefs(Context context) { return context.getSharedPreferences("translation", Context.MODE_PRIVATE); }

    static void rendererGone(Context context, boolean didCrash, int priority) {
        synchronized (inferenceLock) {
            SharedPreferences p = prefs(context);
            if (!p.getString("loadingId", "").isEmpty()) p.edit().remove("loadingId")
                .putInt("crashes", p.getInt("crashes", 0) + 1)
                .putString("lastGone", (didCrash ? "crash" : "killed") + " priority=" + priority).commit();
        }
    }

    @Override public void load() {
        // An unfinished inference after Android killed the whole process also must not auto-loop.
        synchronized (inferenceLock) {
            SharedPreferences p = prefs(getContext());
            if (!p.getString("loadingId", "").isEmpty()) p.edit().remove("loadingId")
                .putInt("crashes", p.getInt("crashes", 0) + 1).putString("lastGone", "interrupted").commit();
        }
    }

    private JSObject state(String source, String target) throws Exception {
        TranslationModels all = models(getContext());
        List<TranslationModels.Definition> route = source == null || target == null ? new ArrayList<>() : all.route(source, target);
        JSONArray path = new JSONArray(), languages = new JSONArray(TranslationModels.LANGUAGES), overview = new JSONArray();
        boolean ready = source != null && target != null;
        long total = route.isEmpty() ? 0 : all.library.total(), present = route.isEmpty() ? 0 : all.library.present();
        if (!route.isEmpty()) ready = all.library.installed();
        for (TranslationModels.Definition def : route) {
            ready &= def.model.installed(); total += def.model.total(); present += def.model.present();
            path.put(new JSObject().put("key", def.key).put("source", def.source).put("target", def.target).put("id", def.id).put("prefix", def.prefix));
        }
        for (TranslationModels.Definition def : all.models.values()) overview.put(new JSObject()
            .put("key", def.key).put("source", def.source).put("target", def.target).put("ready", all.library.installed() && def.model.installed())
            .put("total", def.model.total()).put("present", def.model.present()));
        SharedPreferences p = prefs(getContext());
        return new JSObject().put("available", true).put("ready", ready).put("languages", languages)
            .put("route", path).put("models", overview).put("running", running.get()).put("total", total).put("present", present)
            .put("blocked", p.getInt("crashes", 0) > 0).put("crashes", p.getInt("crashes", 0)).put("lastGone", p.getString("lastGone", ""));
    }

    private void reject(PluginCall call, Exception error) {
        if (error instanceof SemanticModel.Failure) call.reject(error.getMessage(), ((SemanticModel.Failure) error).code);
        else if (error instanceof AppNetwork.Blocked) call.reject("App is offline", "APP_OFFLINE");
        else if (error instanceof IllegalArgumentException) call.reject("Unsupported translation language", "UNSUPPORTED_LANGUAGE");
        else call.reject("Translation model files unavailable", "MODEL_FILES");
    }

    @PluginMethod public void status(PluginCall call) {
        try { call.resolve(state(call.getString("source"), call.getString("target"))); }
        catch (Exception error) { reject(call, error); }
    }

    @PluginMethod public void download(PluginCall call) {
        String source = call.getString("source"), target = call.getString("target");
        final TranslationModels all;
        final List<TranslationModels.Definition> route;
        try { all = models(getContext()); route = all.route(source, target); }
        catch (Exception error) { reject(call, error); return; }
        if (!running.compareAndSet(false, true)) { call.reject("Translation download already running", "BUSY"); return; }
        long job = generation.incrementAndGet();
        long networkEpoch = AppNetwork.epoch();
        worker.execute(() -> {
            try {
                List<SemanticModel> selected = new ArrayList<>();
                if (!route.isEmpty()) selected.add(all.library);
                for (TranslationModels.Definition def : route) selected.add(def.model);
                long total = 0;
                for (SemanticModel model : selected) total += model.total();
                final long expected = total;
                long before = 0;
                long[] last = {0};
                for (SemanticModel model : selected) {
                    if (!model.installed()) AppNetwork.check(networkEpoch);
                    active = model;
                    final long offset = before;
                    model.install((done, ignored, file, host) -> {
                        long now = System.currentTimeMillis();
                        if (now - last[0] < 250 && offset + done < expected) return;
                        last[0] = now;
                        notifyListeners("progress", new JSObject().put("done", offset + done).put("total", expected).put("file", file).put("source", host));
                    }, () -> generation.get() != job);
                    before += model.total();
                }
                if (generation.get() != job) throw new SemanticModel.Failure("CANCELLED", "Cancelled");
                active = null; running.set(false); call.resolve(state(source, target));
            } catch (Exception error) { active = null; running.set(false); reject(call, error); }
        });
    }

    @PluginMethod public void cancel(PluginCall call) {
        generation.incrementAndGet();
        SemanticModel current = active;
        if (current != null) current.cancel();
        // A caller can start the next reader only after the old native job has
        // settled; no previous job may still write files or report BUSY after this.
        worker.execute(() -> call.resolve(new JSObject().put("cancelled", true)));
    }

    @PluginMethod public void markLoading(PluginCall call) {
        String id = call.getString("id", "");
        if (!id.matches("[A-Za-z0-9_.-]{1,100}")) { call.reject("Invalid inference id", "INVALID_ARGUMENT"); return; }
        synchronized (inferenceLock) {
            SharedPreferences p = prefs(getContext());
            if (p.getInt("crashes", 0) > 0) { call.reject("Translation stopped after a model failure", "MODEL_BLOCKED"); return; }
            if (!p.edit().putString("loadingId", id).commit()) {
                call.reject("Could not persist translation crash guard", "MODEL_STORAGE"); return;
            }
        }
        call.resolve();
    }

    @PluginMethod public void markFinished(PluginCall call) {
        String id = call.getString("id", "");
        synchronized (inferenceLock) {
            SharedPreferences p = prefs(getContext());
            if (id.equals(p.getString("loadingId", ""))) {
                SharedPreferences.Editor edit = p.edit().remove("loadingId");
                if (Boolean.TRUE.equals(call.getBoolean("failed", false))) edit.putInt("crashes", p.getInt("crashes", 0) + 1);
                if (!edit.commit()) { call.reject("Could not persist translation state", "MODEL_STORAGE"); return; }
            }
        }
        call.resolve();
    }

    @PluginMethod public void clearCrash(PluginCall call) {
        synchronized (inferenceLock) {
            if (!prefs(getContext()).edit().remove("loadingId").remove("lastGone").putInt("crashes", 0).commit()) {
                call.reject("Could not persist translation retry", "MODEL_STORAGE"); return;
            }
        }
        call.resolve();
    }
}
