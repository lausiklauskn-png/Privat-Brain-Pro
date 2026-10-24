package de.familyprojekt.privatebrain.pro;

import android.app.Activity;
import android.content.Intent;
import com.getcapacitor.*;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "ProLinks")
public class ProLinksPlugin extends Plugin {
    private static final String WORKFLOW_PDF_PRO_PACKAGE = "de.familyprojekt.workflowpdf.pro";

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

    /** Start only the named companion app. Missing apps never trigger a download. */
    @PluginMethod public void openApplication(PluginCall call) {
        if (call.getData().length() != 1 || !"workflowpdfpro".equals(call.getData().opt("tool"))) {
            call.reject("Unsupported tool", "TOOL_UNSUPPORTED");
            return;
        }
        Activity activity = getActivity();
        if (activity == null) {
            call.reject("Application unavailable", "TOOL_UNAVAILABLE");
            return;
        }
        activity.runOnUiThread(() -> {
            try {
                Intent launch = activity.getPackageManager().getLaunchIntentForPackage(WORKFLOW_PDF_PRO_PACKAGE);
                if (launch == null) {
                    call.resolve(new JSObject().put("installed", false));
                    return;
                }
                launch.setPackage(WORKFLOW_PDF_PRO_PACKAGE);
                activity.startActivity(launch);
                call.resolve(new JSObject().put("installed", true));
            } catch (Exception error) {
                call.reject("Application unavailable", "TOOL_UNAVAILABLE");
            }
        });
    }
}
