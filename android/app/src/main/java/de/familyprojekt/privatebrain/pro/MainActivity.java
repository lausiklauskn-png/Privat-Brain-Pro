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
        registerPlugin(ProSpeechPlugin.class);
        registerPlugin(ProSharePlugin.class);
        registerPlugin(ProSemanticPlugin.class);
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
                // Modul 03's library and model addresses are answered from the app, before the offline switch: they are local.
                String address = request.getUrl().toString();
                if (BundledLibrary.covers(address)) return BundledLibrary.respond(getAssets(), ProSemanticPlugin.model(MainActivity.this), address);
                if (BundledLibrary.coversModel(address)) return BundledLibrary.respondModel(ProSemanticPlugin.model(MainActivity.this), address);
                if (AppNetwork.isOffline() && AppNetwork.external(request.getUrl().toString()))
                    return new android.webkit.WebResourceResponse("text/plain", "UTF-8", 503, "App offline",
                        java.util.Collections.emptyMap(), new java.io.ByteArrayInputStream(new byte[0]));
                if (request.getUrl().getPath() != null && request.getUrl().getPath().startsWith(BrowserLinks.PREFIX))
                    return new android.webkit.WebResourceResponse("text/plain", "UTF-8", new java.io.ByteArrayInputStream(new byte[0]));
                return super.shouldInterceptRequest(view, request);
            }
            @Override public boolean onRenderProcessGone(android.webkit.WebView view, android.webkit.RenderProcessGoneDetail detail) {
                // The view's process ended (for example out of memory while the meaning model starts).
                // Remember it and open the app again instead of letting Android close it.
                ProSemanticPlugin.rendererGone(MainActivity.this, detail.didCrash(), detail.rendererPriorityAtExit());
                android.util.Log.w("PrivateBrainPro", "WebView renderer gone: crash=" + detail.didCrash() + " priority=" + detail.rendererPriorityAtExit());
                if (view.getParent() instanceof android.view.ViewGroup) ((android.view.ViewGroup) view.getParent()).removeView(view);
                view.destroy();
                MainActivity.this.recreate();
                return true;
            }
        });
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
    @Override public void onDestroy() { if (google != null) google.close();super.onDestroy(); }
}
