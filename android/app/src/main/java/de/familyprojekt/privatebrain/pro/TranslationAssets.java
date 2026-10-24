package de.familyprojekt.privatebrain.pro;

import android.content.Context;
import android.webkit.WebResourceResponse;
import java.io.ByteArrayInputStream;
import java.io.File;
import java.io.FileInputStream;
import java.util.HashMap;
import java.util.Map;

/** The worker's private addresses always resolve locally, including while App Internet is off. */
final class TranslationAssets {
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
                return new WebResourceResponse(mime, mime.endsWith("json") || mime.endsWith("javascript") ? "UTF-8" : null,
                    200, "OK", headers, new FileInputStream(file));
            }
        } catch (Exception unavailable) { /* no network fallback */ }
        return new WebResourceResponse("text/plain", "UTF-8", 404, "Model not installed", headers, new ByteArrayInputStream(new byte[0]));
    }
}
