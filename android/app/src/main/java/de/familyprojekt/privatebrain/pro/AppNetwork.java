package de.familyprojekt.privatebrain.pro;

import android.content.Context;
import java.io.IOException;
import java.util.ArrayList;
import java.util.WeakHashMap;

/** App-only internet gate. No Wi-Fi changes, account changes or automatic retries. */
final class AppNetwork {
    static final class Blocked extends IOException { Blocked() { super("APP_OFFLINE"); } }
    private static volatile boolean offline;
    private static long epoch;
    private static final WeakHashMap<AutoCloseable, Boolean> active = new WeakHashMap<>();
    static synchronized void initialize(Context context) {
        offline = context.getSharedPreferences("app-network", Context.MODE_PRIVATE).getBoolean("offline", false);
    }
    static boolean isOffline() { return offline; }
    static synchronized long epoch() { return epoch; }
    static void check() throws Blocked { if (offline) throw new Blocked(); }
    static synchronized void check(long started) throws Blocked { if (offline || started != epoch) throw new Blocked(); }
    static synchronized <T extends AutoCloseable> T track(T resource) throws Blocked {
        if (offline) { close(resource);throw new Blocked(); }
        active.put(resource, Boolean.TRUE);return resource;
    }
    static synchronized void release(AutoCloseable resource) { active.remove(resource); }
    static void setOffline(Context context, boolean value) throws IOException {
        ArrayList<AutoCloseable> cancel;
        synchronized (AppNetwork.class) {
            if (!context.getSharedPreferences("app-network", Context.MODE_PRIVATE).edit().putBoolean("offline", value).commit())
                throw new IOException("Network setting unavailable");
            if (offline == value) return;
            offline = value;epoch++;
            cancel = value ? new ArrayList<>(active.keySet()) : new ArrayList<>();
            if (value) active.clear();
        }
        for (AutoCloseable resource : cancel) close(resource);
    }
    private static void close(AutoCloseable resource) { try { if(resource!=null)resource.close(); } catch(Exception ignored) { } }
    static boolean external(String value) {
        try {
            java.net.URI uri = java.net.URI.create(value);
            String scheme = uri.getScheme();
            return scheme != null && (scheme.equals("http") || scheme.equals("https") || scheme.equals("ws") || scheme.equals("wss"))
                && !((scheme.equals("https") || scheme.equals("http")) && "localhost".equals(uri.getHost()) && uri.getPort() == -1);
        } catch(Exception ignored) { return true; }
    }
}
