package de.familyprojekt.privatebrain.pro;

import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.net.Uri;
import android.content.pm.PackageInfo;
import android.content.pm.PackageManager;
import android.content.pm.Signature;
import android.os.Build;
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
import java.security.MessageDigest;
import java.util.HashMap;
import java.util.Locale;
import java.util.Map;
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
                PackageInfo installedInfo = getContext().getPackageManager().getPackageInfo(appId,
                    Build.VERSION.SDK_INT >= 28 ? PackageManager.GET_SIGNING_CERTIFICATES : PackageManager.GET_SIGNATURES);
                String installed = installedInfo.versionName;
                long installedCode = Build.VERSION.SDK_INT >= 28 ? installedInfo.getLongVersionCode() : installedInfo.versionCode;
                String certificate = certificate(installedInfo);
                String currentTag = "v" + (preview && installed.endsWith("-test")
                    ? installed.substring(0, installed.length() - 5) : installed);
                if (UpdatePolicy.version(currentTag, preview) == null) throw new IllegalStateException("Invalid installed version");
                JSONArray releases = fetchReleases();
                String bestTag = currentTag, bestUrl = null;
                for (int i = 0; i < releases.length(); i++) {
                    JSONObject release = releases.getJSONObject(i);
                    if (release.optBoolean("draft", true) || !release.has("prerelease")) continue;
                    String tag = release.optString("tag_name", "");
                    if (!UpdatePolicy.releaseAllowed(tag, release.getBoolean("prerelease"), preview)) continue;
                    if (!UpdatePolicy.newer(tag, bestTag, preview)) continue;
                    JSONArray assets = release.optJSONArray("assets");
                    if (assets == null) continue;
                    for (int j = 0; j < assets.length(); j++) {
                        JSONObject asset = assets.getJSONObject(j);
                        if (!asset.optString("state").equals("uploaded") || asset.optLong("size", 0) <= 0) continue;
                        try {
                            String candidate = UpdatePolicy.downloadUrl(tag, asset.optString("name"), preview);
                            // The historical package suffix is permanent. A public tag alone
                            // cannot prove this is its APK rather than the separate production ID.
                            if (!tag.contains("-preview.") && !identityMatches(release, asset, tag, appId, certificate, installedCode)) continue;
                            bestUrl = candidate;
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

    private String certificate(PackageInfo info) throws Exception {
        Signature[] signatures = Build.VERSION.SDK_INT >= 28 && info.signingInfo != null
            ? info.signingInfo.getApkContentsSigners() : info.signatures;
        if (signatures == null || signatures.length != 1) throw new IllegalStateException("Unsupported app signer");
        StringBuilder hex = new StringBuilder();
        for (byte value : MessageDigest.getInstance("SHA-256").digest(signatures[0].toByteArray()))
            hex.append(String.format(Locale.ROOT, "%02x", value & 255));
        return hex.toString();
    }

    private boolean identityMatches(JSONObject release, JSONObject apk, String tag, String appId,
            String certificate, long installedCode) throws Exception {
        String name = "ANDROID-IDENTITY.json";
        String url = "https://github.com/" + UpdatePolicy.REPOSITORY + "/releases/download/" + tag + "/" + name;
        JSONArray assets = release.getJSONArray("assets");
        JSONObject receipt = null;
        for (int i = 0; i < assets.length(); i++) {
            JSONObject asset = assets.optJSONObject(i);
            if (asset == null || !name.equals(asset.optString("name"))) continue;
            if (receipt != null || !"uploaded".equals(asset.optString("state")) ||
                    asset.optLong("size", 0) < 1 || asset.optLong("size") > 16384 ||
                    !url.equals(asset.optString("browser_download_url"))) return false;
            receipt = asset;
        }
        if (receipt == null) return false;
        JSONObject identity = new JSONObject(fetch(new URL(url), 16384, true));
        Map<String, Object> values = new HashMap<>();
        for (String key : new String[] {"schema", "channel", "applicationId", "certificateSha256", "sourceCommit",
                "tag", "versionName", "versionCode", "apk", "apkSha256"}) values.put(key, identity.opt(key));
        String expected = UpdatePolicy.downloadUrl(tag, apk.optString("name"), false);
        String digest = apk.optString("digest", "");
        return expected.equals(apk.optString("browser_download_url")) &&
            (digest.isEmpty() || digest.equals("sha256:" + identity.optString("apkSha256"))) &&
            UpdatePolicy.releaseIdentity(values, tag, appId, certificate, installedCode, apk.optString("name"));
    }

    private JSONArray fetchReleases() throws Exception {
        URL url = new URL("https://api.github.com/repos/" + UpdatePolicy.REPOSITORY + "/releases?per_page=30");
        return new JSONArray(fetch(url, 1048576, false));
    }

    private String fetch(URL url, int maximum, boolean releaseAsset) throws Exception {
        for (int redirects = 0; redirects <= 2; redirects++) {
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
                int response = connection.getResponseCode();
                if (releaseAsset && (response == 301 || response == 302 || response == 303 || response == 307 || response == 308)) {
                    String location = connection.getHeaderField("Location");
                    if (location == null || redirects == 2) throw new IllegalStateException("Release asset redirect unavailable");
                    URL next = new URL(url, location);
                    // Public GitHub assets redirect to its two dedicated asset hosts.
                    // No credentials or page-supplied URL participates in this request.
                    if (!UpdatePolicy.assetRedirectAllowed(next.toString()))
                        throw new IllegalStateException("Unsupported release asset host");
                    url = next;
                    continue;
                }
                if (response != 200) throw new IllegalStateException("Release catalog unavailable");
                try (InputStream input = connection.getInputStream(); ByteArrayOutputStream body = new ByteArrayOutputStream()) {
                    byte[] buffer = new byte[8192];
                    int length;
                    long deadline = android.os.SystemClock.elapsedRealtime() + 20000;
                    while ((length = input.read(buffer)) != -1) {
                        AppNetwork.check();
                        if (body.size() + length > maximum || android.os.SystemClock.elapsedRealtime() > deadline) {
                            throw new IllegalStateException("Release catalog limit exceeded");
                        }
                        body.write(buffer, 0, length);
                    }
                    return body.toString(StandardCharsets.UTF_8.name());
                }
            } finally {
                AppNetwork.release(cancellation);
                connection.disconnect();
            }
        }
        throw new IllegalStateException("Release asset redirect limit exceeded");
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
