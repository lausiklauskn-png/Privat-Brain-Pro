package de.familyprojekt.privatebrain.pro;

/** Flips the app's internet switch in JVM tests (the real one stores it in Android preferences). */
final class AppNetworkTestAccess {
    static void setOffline(boolean value) throws Exception {
        java.lang.reflect.Field f = AppNetwork.class.getDeclaredField("offline");
        f.setAccessible(true);
        f.setBoolean(null, value);
    }
}
