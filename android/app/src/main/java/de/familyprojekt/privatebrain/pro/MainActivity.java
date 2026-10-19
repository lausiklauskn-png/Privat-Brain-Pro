package de.familyprojekt.privatebrain.pro;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override public void onCreate(Bundle state) {
        registerPlugin(ProDevicePlugin.class);
        registerPlugin(ProUpdatesPlugin.class);
        super.onCreate(state);
    }
}
