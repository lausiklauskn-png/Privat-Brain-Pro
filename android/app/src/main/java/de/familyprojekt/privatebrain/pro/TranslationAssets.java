package de.familyprojekt.privatebrain.pro;

import android.content.Context;
import android.webkit.WebResourceResponse;
import java.io.ByteArrayInputStream;
import java.io.File;
import java.io.FileInputStream;
import java.util.HashMap;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/** The worker's private addresses always resolve locally, including while App Internet is off. */
final class TranslationAssets {
    private static boolean diagnostic;
    private static final List<String> requests = new ArrayList<>();

    /** Enabled by isolated instrumentation only. Never records text, headers or arbitrary URLs. */
    static synchronized void enableDiagnostics(boolean enabled) { diagnostic = enabled; requests.clear(); }
    static synchronized String diagnostics() { return requests.toString(); }
    private static synchronized void record(String url, int status, long bytes) {
        if (!diagnostic) return;
        String name = "unlisted";
        if (url != null && url.startsWith(TranslationModels.BASE)) {
            String path = url.substring(TranslationModels.BASE.length());
            if (path.startsWith("lib/") && TranslationModels.LIBRARY_FILES.contains(path.substring(4))) name = path;
            if (path.matches("models/Xenova/opus-mt-(de-en|en-de|ru-en|en-ru|pl-en|en-mul)/.+")) {
                int cut = path.indexOf('/', "models/Xenova/".length());
                if (cut > 0 && TranslationModels.allowedModelFile(path.substring(cut + 1))) name = path;
            }
        }
        String event = name + " status=" + status + " bytes=" + bytes;
        if (requests.size() < 64) requests.add(event);
        android.util.Log.i("PrivateBrainPro", "Translation asset " + event);
    }

    static WebResourceResponse respond(Context context, String url) {
        Map<String, String> headers = new HashMap<>();
        headers.put("Access-Control-Allow-Origin", "https://localhost");
        headers.put("Cache-Control", "no-store");
        try {
            File file = ProTranslationPlugin.models(context).file(url);
            if (file != null) {
                headers.put("Content-Length", String.valueOf(file.length()));
                String mime = file.getName().endsWith(".js") ? "application/javascript" : file.getName().endsWith(".wasm")
                    ? "application/wasm" : file.getName().endsWith(".json") ? "application/json" : "application/octet-stream";
                FileInputStream stream = new FileInputStream(file);
                record(url, 200, file.length());
                return new WebResourceResponse(mime, mime.endsWith("json") || mime.endsWith("javascript") ? "UTF-8" : null,
                    200, "OK", headers, stream);
            }
        } catch (Exception unavailable) { /* no network fallback */ }
        record(url, 404, 0);
        return new WebResourceResponse("text/plain", "UTF-8", 404, "Model not installed", headers, new ByteArrayInputStream(new byte[0]));
    }
}
