package de.familyprojekt.privatebrain.pro;

import android.os.Bundle;
import androidx.activity.OnBackPressedCallback;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override public void onCreate(Bundle state) {
        registerPlugin(ProDevicePlugin.class);
        registerPlugin(ProUpdatesPlugin.class);
        registerPlugin(ProMailPlugin.class);
        registerPlugin(ProFilesPlugin.class);
        super.onCreate(state);
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
}
