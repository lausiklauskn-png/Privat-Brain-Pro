package de.familyprojekt.privatebrain.pro;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

@CapacitorPlugin(name = "ProNetwork")
public class ProNetworkPlugin extends Plugin {
    private final ExecutorService worker = Executors.newSingleThreadExecutor();
    private void result(PluginCall call) { JSObject value = new JSObject();value.put("offline",AppNetwork.isOffline());call.resolve(value); }
    @PluginMethod public void getState(PluginCall call) { result(call); }
    @PluginMethod public void setOffline(PluginCall call) {
        Boolean value = call.getBoolean("offline");
        if(value==null) { call.reject("Boolean offline required","INVALID_INPUT");return; }
        worker.execute(()->{
            try {
                AppNetwork.setOffline(getContext(),value);
                getActivity().runOnUiThread(()->{
                    // Local Capacitor assets continue through the WebView request interceptor.
                    if(value)getBridge().getWebView().stopLoading();
                    getBridge().getWebView().getSettings().setBlockNetworkLoads(value);
                    getBridge().getWebView().setNetworkAvailable(!value);
                    result(call);
                });
            } catch(Exception error) { call.reject("Network setting unavailable","NETWORK_SETTING_FAILED"); }
        });
    }
    @Override protected void handleOnDestroy() { worker.shutdownNow(); }
}
