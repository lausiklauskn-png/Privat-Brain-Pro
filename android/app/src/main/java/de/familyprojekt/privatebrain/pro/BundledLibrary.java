package de.familyprojekt.privatebrain.pro;

import android.content.res.AssetManager;
import android.webkit.WebResourceResponse;
import java.io.ByteArrayInputStream;
import java.io.InputStream;
import java.util.HashMap;
import java.util.Map;

/**
 * Modul 03 (byte-1:1 from the canon) loads transformers.js from a fixed jsDelivr address.
 * The app answers exactly that address from files inside the APK (Klaus 2026-10-21: "Modell
 * fest einbauen"), so the meaning search runs without the internet. Any other file under the
 * address gets 404; nothing under it ever goes to the network.
 */
final class BundledLibrary {
    static final String PREFIX = "https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.2";
    static final String ASSET_DIR = "public/vendor/transformers-2.17.2/";
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

    static WebResourceResponse respond(AssetManager assets, String url) {
        Map<String, String> headers = new HashMap<>();
        headers.put("Access-Control-Allow-Origin", "*");
        headers.put("Cache-Control", "no-store");
        String name = file(url);
        if (name != null) {
            try {
                InputStream in = assets.open(ASSET_DIR + name);
                return new WebResourceResponse(mime(name), null, 200, "OK", headers, in);
            } catch (Exception missing) { /* built without the model: fall through to 404 */ }
        }
        return new WebResourceResponse("text/plain", "UTF-8", 404, "Not bundled", headers, new ByteArrayInputStream(new byte[0]));
    }
}
