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
                if (AppNetwork.isOffline() && AppNetwork.external(request.getUrl().toString()))
                    return new android.webkit.WebResourceResponse("text/plain", "UTF-8", 503, "App offline",
                        java.util.Collections.emptyMap(), new java.io.ByteArrayInputStream(new byte[0]));
                if (request.getUrl().getPath() != null && request.getUrl().getPath().startsWith(BrowserLinks.PREFIX))
                    return new android.webkit.WebResourceResponse("text/plain", "UTF-8", new java.io.ByteArrayInputStream(new byte[0]));
                return super.shouldInterceptRequest(view, request);
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
