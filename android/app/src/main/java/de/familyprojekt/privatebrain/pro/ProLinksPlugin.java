package de.familyprojekt.privatebrain.pro;

import com.getcapacitor.*;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "ProLinks")
public class ProLinksPlugin extends Plugin {
    @PluginMethod public void prepare(PluginCall call) {
        try { call.resolve(new JSObject().put("tickets", BrowserLinks.prepare(call.getArray("urls")))); }
        catch (Exception error) { call.reject("Link unavailable", "LINK_UNAVAILABLE"); }
    }
    @PluginMethod public void open(PluginCall call) {
        getActivity().runOnUiThread(() -> {
            try { BrowserLinks.open(getActivity(), call.getString("url"));call.resolve(new JSObject().put("ok", true)); }
            catch (Exception error) { call.reject("Browser unavailable", "LINK_UNAVAILABLE"); }
        });
    }
}
