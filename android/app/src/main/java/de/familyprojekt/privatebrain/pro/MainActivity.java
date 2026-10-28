package de.familyprojekt.privatebrain.pro;

import android.os.Bundle;
import androidx.activity.OnBackPressedCallback;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    private GmailAuthorization google;
    GmailAuthorization google() { return google; }
    @Override public void onCreate(Bundle state) {
        AppNetwork.initialize(this);
        registerPlugin(ProNetworkPlugin.class);
        registerPlugin(ProDevicePlugin.class);
        registerPlugin(ProUpdatesPlugin.class);
        registerPlugin(ProMailPlugin.class);
        registerPlugin(ProFilesPlugin.class);
        registerPlugin(ProFoldersPlugin.class);
        registerPlugin(ProVaultPlugin.class);
        registerPlugin(ProProtectPlugin.class);
        registerPlugin(ProLinksPlugin.class);
        registerPlugin(ProDuplicatesPlugin.class);
        registerPlugin(ProSpeechPlugin.class);
        registerPlugin(ProSharePlugin.class);
        registerPlugin(ProSemanticPlugin.class);
        registerPlugin(ProCaptionPlugin.class);
        registerPlugin(ProTranslationPlugin.class);
        registerPlugin(de.familyprojekt.hintergrund.ProHintergrundPlugin.class);
        super.onCreate(state);
        google = new GmailAuthorization(this);
        bridge.getWebView().getSettings().setBlockNetworkLoads(AppNetwork.isOffline());
        bridge.getWebView().setNetworkAvailable(!AppNetwork.isOffline());
        bridge.setWebViewClient(new com.getcapacitor.BridgeWebViewClient(bridge) {
            @Override public boolean shouldOverrideUrlLoading(android.webkit.WebView view, android.webkit.WebResourceRequest request) {
                if (request.getUrl().getPath() != null && request.getUrl().getPath().startsWith(BrowserLinks.PREFIX)) {
                    String link = BrowserLinks.resolve(request.getUrl());
                    if (request.hasGesture() && link != null) {
                        try { BrowserLinks.open(MainActivity.this, link); }
                        catch (Exception error) { android.widget.Toast.makeText(MainActivity.this, "Browser nicht verfügbar / Browser unavailable", android.widget.Toast.LENGTH_SHORT).show(); }
                    }
                    return true;
                }
                return super.shouldOverrideUrlLoading(view, request);
            }
            @Override public android.webkit.WebResourceResponse shouldInterceptRequest(android.webkit.WebView view, android.webkit.WebResourceRequest request) {
                android.webkit.WebResourceResponse local = interceptAppRequest(request);
                return local != null ? local : super.shouldInterceptRequest(view, request);
            }
            // Android calls this only from 8.0 (API 26) on; older devices keep the old behaviour.
            @android.annotation.TargetApi(android.os.Build.VERSION_CODES.O)
            @Override public boolean onRenderProcessGone(android.webkit.WebView view, android.webkit.RenderProcessGoneDetail detail) {
                // The view's process ended (for example out of memory while the meaning model starts).
                // Remember it and open the app again instead of letting Android close it.
                ProSemanticPlugin.rendererGone(MainActivity.this, detail.didCrash(), detail.rendererPriorityAtExit());
                ProCaptionPlugin.rendererGone(MainActivity.this, detail.didCrash(), detail.rendererPriorityAtExit());
                ProTranslationPlugin.rendererGone(MainActivity.this, detail.didCrash(), detail.rendererPriorityAtExit());
                android.util.Log.w("PrivateBrainPro", "WebView renderer gone: crash=" + detail.didCrash() + " priority=" + detail.rendererPriorityAtExit());
                if (view.getParent() instanceof android.view.ViewGroup) ((android.view.ViewGroup) view.getParent()).removeView(view);
                view.destroy();
                MainActivity.this.recreate();
                return true;
            }
        });
        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.N) installWorkerClient();
        getOnBackPressedDispatcher().addCallback(this, new OnBackPressedCallback(true) {
            @Override public void handleOnBackPressed() {
                if (bridge == null) { moveTaskToBack(true); return; }
                bridge.getWebView().evaluateJavascript(
                    "window.PBNavigation ? (PBNavigation.back() ? 'handled' : 'root') : null", result -> {
                        if ("\"handled\"".equals(result)) return;
                        if (!"\"root\"".equals(result) && bridge.getWebView().canGoBack()) bridge.getWebView().goBack();
                        else moveTaskToBack(true);
                    });
            }
        });
    }

    /** The document and worker contexts must see the same checked files and internet gate. */
    private android.webkit.WebResourceResponse interceptAppRequest(android.webkit.WebResourceRequest request) {
        String address = request.getUrl().toString();
        if (TranslationModels.covers(address)) return TranslationAssets.respond(this, address);
        if (BundledLibrary.covers(address)) return BundledLibrary.respond(getAssets(), address, ProSemanticPlugin.model(this), ProCaptionPlugin.model(this));
        if (BundledLibrary.coversModel(address)) return BundledLibrary.respondModel(ProSemanticPlugin.model(this), address);
        if (BundledLibrary.coversCaptionModel(address)) return BundledLibrary.respondCaptionModel(ProCaptionPlugin.model(this), address);
        if (BundledLibrary.remoteModel(address)) return BundledLibrary.missing();
        if (AppNetwork.isOffline() && AppNetwork.external(address))
            return new android.webkit.WebResourceResponse("text/plain", "UTF-8", 503, "App offline",
                java.util.Collections.emptyMap(), new java.io.ByteArrayInputStream(new byte[0]));
        if (request.getUrl().getPath() != null && request.getUrl().getPath().startsWith(BrowserLinks.PREFIX))
            return new android.webkit.WebResourceResponse("text/plain", "UTF-8", new java.io.ByteArrayInputStream(new byte[0]));
        return null;
    }

    @android.annotation.TargetApi(android.os.Build.VERSION_CODES.N)
    private void installWorkerClient() {
        // Chromium routes dedicated-worker subresources through the service-worker
        // client too. Capacitor's default client only knows APK assets, not our
        // downloaded models. Keep its local-server fallback for all other files.
        android.webkit.ServiceWorkerController controller = android.webkit.ServiceWorkerController.getInstance();
        controller.getServiceWorkerWebSettings().setBlockNetworkLoads(AppNetwork.isOffline());
        controller.setServiceWorkerClient(new android.webkit.ServiceWorkerClient() {
            @Override public android.webkit.WebResourceResponse shouldInterceptRequest(android.webkit.WebResourceRequest request) {
                android.webkit.WebResourceResponse local = interceptAppRequest(request);
                return local != null ? local : bridge.getLocalServer().shouldInterceptRequest(request);
            }
        });
    }
    @Override public void onDestroy() { if (google != null) google.close();super.onDestroy(); }
}
