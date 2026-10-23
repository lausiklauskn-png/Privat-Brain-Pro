package de.familyprojekt.privatebrain.pro;

/** Windows uses the same filename policy as the Android mail and storage core. */
final class DesktopNames {
    static String safe(String raw) { return PortableNames.safe(raw); }
}
