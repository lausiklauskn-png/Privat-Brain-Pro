package de.familyprojekt.privatebrain.pro;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/** Read-only device boundary. No credentials, arbitrary paths or network proxy. */
@CapacitorPlugin(name = "ProDevice")
public class ProDevicePlugin extends Plugin {
    @PluginMethod public void getInfo(PluginCall call) {
        JSObject info = new JSObject();
        info.put("platform", "android");
        try {
            var app = getContext().getPackageManager().getPackageInfo(getContext().getPackageName(), 0);
            info.put("versionName", app.versionName);
            info.put("versionCode", (android.os.Build.VERSION.SDK_INT >= 28 ? app.getLongVersionCode() : app.versionCode));
        } catch (android.content.pm.PackageManager.NameNotFoundException error) {
            call.reject("App version unavailable");
            return;
        }
        info.put("nativeMail", false);
        info.put("persistentFolders", false);
        call.resolve(info);
    }
}
