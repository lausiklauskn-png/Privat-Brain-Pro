package de.familyprojekt.privatebrain.pro;

import android.content.res.AssetManager;
import android.webkit.WebResourceResponse;
import java.io.ByteArrayInputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.InputStream;
import java.util.HashMap;
import java.util.Map;

/**
 * Modul 03 (byte-1:1 from the canon) loads transformers.js from a fixed jsDelivr address.
 * The app answers exactly that address itself: from the model files loaded with the switch
 * (SemanticModel, Klaus 2026-10-21), otherwise from the APK if a build carries them. Any other
 * file under the address gets 404; nothing under it ever goes to the network. The same holds
 * for the model under the app's own address /models/Xenova/multilingual-e5-small/ and, since Sitzung 4
 * (Klaus 2026-10-26, Bildbeschreibung), for the image model under /models/Xenova/vit-gpt2-image-captioning/,
 * loaded with its own switch (ProCaption). The library is answered from whichever model folder has it.
 */
final class BundledLibrary {
    static final String PREFIX = "https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.2";
    static final String ASSET_DIR = "public/vendor/transformers-2.17.2/";
    static final String MODEL_PREFIX = "https://localhost/models/Xenova/multilingual-e5-small/";
    /** The same model at Hugging Face: never loaded inside the view (118 MB in the WebView); the switch loads it natively. */
    static final String REMOTE_MODEL_PREFIX = "https://huggingface.co/Xenova/multilingual-e5-small/";
    /** Image model (Bildbeschreibung, Sitzung 4): same rule, own folder, own switch. */
    static final String CAPTION_MODEL_PREFIX = "https://localhost/models/Xenova/vit-gpt2-image-captioning/";
    static final String REMOTE_CAPTION_PREFIX = "https://huggingface.co/Xenova/vit-gpt2-image-captioning/";
    private static final Map<String, String> FILES = new HashMap<>();
    static {
        FILES.put("transformers.min.js", "application/javascript");
        FILES.put("ort-wasm-simd.wasm", "application/wasm");
        FILES.put("ort-wasm.wasm", "application/wasm");
    }

    /** Does the address belong to the bundled library (answered locally, found or not)? */
    static boolean covers(String url) {
        return url != null && (url.equals(PREFIX) || url.startsWith(PREFIX + "/") || url.startsWith(PREFIX + "?"));
    }

    /** The bundled file for an address, or null (then 404). The bare address is the package entry. */
    static String file(String url) {
        if (!covers(url)) return null;
        String rest = url.substring(PREFIX.length());
        int cut = rest.indexOf('?'); if (cut >= 0) rest = rest.substring(0, cut);
        cut = rest.indexOf('#'); if (cut >= 0) rest = rest.substring(0, cut);
        if (rest.isEmpty() || rest.equals("/") || rest.equals("/dist/transformers.min.js")) return "transformers.min.js";
        if (!rest.startsWith("/dist/")) return null;
        String name = rest.substring("/dist/".length());
        return FILES.containsKey(name) ? name : null;
    }

    static String mime(String name) { return FILES.get(name); }

    static boolean coversModel(String url) { return url != null && url.startsWith(MODEL_PREFIX); }
    static boolean coversCaptionModel(String url) { return url != null && url.startsWith(CAPTION_MODEL_PREFIX); }
    /** Any remote address of the two models: never fetched by the view, the switches load them natively. */
    static boolean remoteModel(String url) { return url != null && (url.startsWith(REMOTE_MODEL_PREFIX) || url.startsWith(REMOTE_CAPTION_PREFIX)); }

    /** "model/<file>" for an address under the model folder, or null. Only plain names, at most one folder deep. */
    static String modelPath(String url) { return modelPath(url, MODEL_PREFIX); }
    static String captionModelPath(String url) { return modelPath(url, CAPTION_MODEL_PREFIX); }
    private static String modelPath(String url, String prefix) {
        if (url == null || !url.startsWith(prefix)) return null;
        String rest = url.substring(prefix.length());
        int cut = rest.indexOf('?'); if (cut >= 0) rest = rest.substring(0, cut);
        cut = rest.indexOf('#'); if (cut >= 0) rest = rest.substring(0, cut);
        if (rest.contains("..") || !rest.matches("[A-Za-z0-9_.-]+(/[A-Za-z0-9_.-]+)?")) return null;
        return "model/" + rest;
    }

    private static Map<String, String> headers() {
        Map<String, String> headers = new HashMap<>();
        headers.put("Access-Control-Allow-Origin", "*");
        headers.put("Cache-Control", "no-store");
        return headers;
    }

    static WebResourceResponse missing() {
        return new WebResourceResponse("text/plain", "UTF-8", 404, "Not available", headers(), new ByteArrayInputStream(new byte[0]));
    }

    static WebResourceResponse respond(AssetManager assets, SemanticModel model, String url) { return respond(assets, url, model); }

    /** The library from the first complete model folder that carries it (meaning model, then image model), else from the APK. */
    static WebResourceResponse respond(AssetManager assets, String url, SemanticModel... models) {
        String name = file(url);
        if (name != null) {
            try {
                File loaded = null;
                for (SemanticModel model : models) { loaded = model == null ? null : model.file("lib/" + name); if (loaded != null) break; }
                InputStream in = loaded != null ? new FileInputStream(loaded) : assets.open(ASSET_DIR + name);
                return new WebResourceResponse(mime(name), null, 200, "OK", headers(), in);
            } catch (Exception notThere) { /* not loaded and not in the APK: 404 */ }
        }
        return missing();
    }

    static WebResourceResponse respondModel(SemanticModel model, String url) { return respondFile(model, modelPath(url)); }
    static WebResourceResponse respondCaptionModel(SemanticModel model, String url) { return respondFile(model, captionModelPath(url)); }
    private static WebResourceResponse respondFile(SemanticModel model, String path) {
        File f = path == null || model == null ? null : model.file(path);
        if (f == null) return missing();
        try {
            String type = path.endsWith(".json") ? "application/json" : "application/octet-stream";
            Map<String, String> h = headers();
            h.put("Content-Length", String.valueOf(f.length()));
            return new WebResourceResponse(type, path.endsWith(".json") ? "UTF-8" : null, 200, "OK", h, new FileInputStream(f));
        } catch (Exception e) { return missing(); }
    }
}
