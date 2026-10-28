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
        info.put("nativeMail", true);
        info.put("persistentFolders", false);
        info.put("persistentFiles", true);
        call.resolve(info);
    }

    /** Gerätecheck vor dem Laden eines Modells (Klaus 2026-10-28): nur lesen, nichts verlässt das Gerät. */
    @PluginMethod public void measure(PluginCall call) {
        JSObject r = new JSObject();
        r.put("platform", "android");
        r.put("cores", Runtime.getRuntime().availableProcessors());
        try {
            android.app.ActivityManager am = (android.app.ActivityManager) getContext().getSystemService(android.content.Context.ACTIVITY_SERVICE);
            android.app.ActivityManager.MemoryInfo mi = new android.app.ActivityManager.MemoryInfo();
            if (am != null) { am.getMemoryInfo(mi); r.put("ramBytes", mi.totalMem); r.put("ramFreeBytes", mi.availMem); r.put("lowRam", am.isLowRamDevice()); }
        } catch (RuntimeException unbekannt) { /* bleibt leer */ }
        try { r.put("freeBytes", new android.os.StatFs(getContext().getFilesDir().getPath()).getAvailableBytes()); } catch (RuntimeException unbekannt) { /* bleibt leer */ }
        String cpu = android.os.Build.VERSION.SDK_INT >= 31 ? android.os.Build.SOC_MANUFACTURER + " " + android.os.Build.SOC_MODEL : android.os.Build.HARDWARE;
        r.put("cpu", cpu.trim());
        r.put("gpu", new com.getcapacitor.JSArray());
        call.resolve(r);
    }
}
