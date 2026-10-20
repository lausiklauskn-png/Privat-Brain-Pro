package de.familyprojekt.privatebrain.pro;

import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.net.Uri;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.atomic.AtomicBoolean;
import org.json.JSONArray;
import org.json.JSONObject;

/** User-initiated public version check. No tokens, arbitrary URLs or APK installer. */
@CapacitorPlugin(name = "ProUpdates")
public class ProUpdatesPlugin extends Plugin {
    private final ExecutorService worker = Executors.newSingleThreadExecutor();
    private final AtomicBoolean checking = new AtomicBoolean(false);
    private volatile String updateUrl;

    @PluginMethod public void check(PluginCall call) {
        if (!checking.compareAndSet(false, true)) {
            call.reject("Update check already running", "UPDATE_BUSY");
            return;
        }
        worker.execute(() -> {
            updateUrl = null;
            try {
                AppNetwork.check();
                String appId = getContext().getPackageName();
                boolean preview = appId.equals("de.familyprojekt.privatebrain.pro.preview");
                if (!preview && !appId.equals("de.familyprojekt.privatebrain.pro")) {
                    JSObject result = new JSObject();
                    result.put("status", "unsupported");
                    call.resolve(result);
                    return;
                }
                String installed = getContext().getPackageManager().getPackageInfo(appId, 0).versionName;
                String currentTag = "v" + (preview && installed.endsWith("-test")
                    ? installed.substring(0, installed.length() - 5) : installed);
                if (UpdatePolicy.version(currentTag, preview) == null) throw new IllegalStateException("Invalid installed version");
                JSONArray releases = fetchReleases();
                String bestTag = currentTag, bestUrl = null;
                for (int i = 0; i < releases.length(); i++) {
                    JSONObject release = releases.getJSONObject(i);
                    if (release.optBoolean("draft", true) || !release.has("prerelease") ||
                            release.getBoolean("prerelease") != preview) continue;
                    String tag = release.optString("tag_name", "");
                    if (!UpdatePolicy.newer(tag, bestTag, preview)) continue;
                    JSONArray assets = release.optJSONArray("assets");
                    if (assets == null) continue;
                    for (int j = 0; j < assets.length(); j++) {
                        JSONObject asset = assets.getJSONObject(j);
                        if (!asset.optString("state").equals("uploaded") || asset.optLong("size", 0) <= 0) continue;
                        try {
                            bestUrl = UpdatePolicy.downloadUrl(tag, asset.optString("name"), preview);
                            bestTag = tag;
                            break;
                        } catch (IllegalArgumentException ignored) { /* Not an installable app asset. */ }
                    }
                }
                updateUrl = bestUrl;
                JSObject result = new JSObject();
                result.put("status", bestUrl == null ? "current" : "available");
                result.put("version", bestTag.substring(1));
                call.resolve(result);
            } catch (Exception error) {
                // No account data or exception/network diagnostics are exposed to the page.
                call.reject("Update check unavailable", error instanceof AppNetwork.Blocked ? "APP_OFFLINE" : "UPDATE_UNAVAILABLE");
            } finally {
                checking.set(false);
            }
        });
    }

    private JSONArray fetchReleases() throws Exception {
        URL url = new URL("https://api.github.com/repos/" + UpdatePolicy.REPOSITORY + "/releases?per_page=30");
        AppNetwork.check();
        HttpURLConnection connection = (HttpURLConnection) url.openConnection();
        AutoCloseable cancellation=AppNetwork.track(connection::disconnect);
        connection.setConnectTimeout(8000);
        connection.setReadTimeout(8000);
        connection.setInstanceFollowRedirects(false);
        connection.setRequestProperty("Accept", "application/vnd.github+json");
        connection.setRequestProperty("X-GitHub-Api-Version", "2022-11-28");
        connection.setRequestProperty("User-Agent", "Private-Brain-Pro-Android");
        try {
            if (connection.getResponseCode() != 200) throw new IllegalStateException("Release catalog unavailable");
            try (InputStream input = connection.getInputStream(); ByteArrayOutputStream body = new ByteArrayOutputStream()) {
                byte[] buffer = new byte[8192];
                int length;
                long deadline = android.os.SystemClock.elapsedRealtime() + 20000;
                while ((length = input.read(buffer)) != -1) {
                    if (body.size() + length > 1048576 || android.os.SystemClock.elapsedRealtime() > deadline) {
                        throw new IllegalStateException("Release catalog limit exceeded");
                    }
                    body.write(buffer, 0, length);
                }
                return new JSONArray(body.toString(StandardCharsets.UTF_8.name()));
            }
        } finally {
            AppNetwork.release(cancellation);
            connection.disconnect();
        }
    }

    @PluginMethod public void openDownload(PluginCall call) {
        // The URL comes only from the successful check above; page-supplied URLs are ignored.
        String target = updateUrl;
        if (target == null) {
            call.reject("No checked update available", "UPDATE_NOT_CHECKED");
            return;
        }
        getActivity().runOnUiThread(() -> {
            try {
                Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse(target));
                intent.addCategory(Intent.CATEGORY_BROWSABLE);
                getActivity().startActivity(intent);
                call.resolve();
            } catch (ActivityNotFoundException error) {
                call.reject("No browser available", "UPDATE_OPEN_FAILED");
            }
        });
    }

    @Override protected void handleOnDestroy() {
        worker.shutdownNow();
        updateUrl = null;
    }
}
