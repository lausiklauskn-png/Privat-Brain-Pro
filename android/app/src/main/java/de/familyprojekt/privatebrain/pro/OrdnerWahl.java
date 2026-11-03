package de.familyprojekt.privatebrain.pro;

import de.familyprojekt.tresor.Ablage;
import de.familyprojekt.tresor.Fach;
import de.familyprojekt.tresor.TresorOrdner;
import java.io.IOException;
import java.util.List;
import java.util.Locale;

/**
 * Welcher Ordner wurde gewählt? (Gemeinsamer Tresor-Plan, Klaus 2026-11-03: „Ja zum Plan“.)
 * Reines Java ohne Android-Bezüge (JVM-Probe {@code OrdnerWahlTest} mit {@code DateiAblage}); die Plugins
 * reichen eine {@code SafAblage} und den Anzeigenamen des gewählten Ordners herein.
 *
 * Befund von Klaus' SD-Karte (3.11.): Die Ersatzschlüssel-Datei lag im Klartext direkt im gemeinsamen Tresor
 * („Privat Brain Pro Hauptablageordner“, neben tresorordner.json). Speicherort und Tresorordner wurden in
 * verschiedenen Ebenen gewählt. Diese Klasse ordnet beides gleich ein und sagt, was erkennbar ist:
 * nur Ordner auf dem Gerätespeicher oder der SD-Karte (Kennung „Speicher:Pfad“) lassen sich am Pfad vergleichen.
 */
final class OrdnerWahl {
    /** Ordner mit tresorordner.json: der gemeinsame Tresor (Hauptablageordner). */
    static final String HAUPTABLAGE = "HAUPTABLAGE";
    /** „Tresorordner/“ selbst (Verwaltung: kennwort-/ersatz-/fach-*.json) — nie wählen. */
    static final String VERWALTUNG = "VERWALTUNG";
    /** Ein Fach-Ordner im Tresor (App-Ordner oder „Eingang-…“), auch „Private Brain“ mit tresor.json. */
    static final String FACH = "FACH";
    /** Nichts davon: ein gewöhnlicher (auch leerer) Ordner. */
    static final String FREI = "FREI";

    static final String KOPF_APP = "tresor.json", EIGENES_FACH = Fach.PRIVATE_BRAIN.ordner;
    /** Speicher der Android-Dateien-App für Gerätespeicher und SD-Karte; nur dort trägt die Kennung den Pfad. */
    static final String SPEICHER_ANBIETER = "com.android.externalstorage.documents";

    private OrdnerWahl() { }

    static String einordnen(Ablage a, String name) throws IOException {
        if (a.gibtEs(TresorOrdner.KOPF)) return HAUPTABLAGE;
        String n = name == null ? "" : name.trim();
        if (TresorOrdner.VERWALTUNG.equalsIgnoreCase(n)) return VERWALTUNG;
        List<String> kinder = a.liste("");
        for (String k : kinder)
            if (k.toLowerCase(Locale.ROOT).matches("(kennwort|ersatz|fach)-[a-z0-9-]+\\.json")) return VERWALTUNG;
        if (a.gibtEs(KOPF_APP)) return FACH;
        for (Fach f : Fach.ALLE) if (f.ordner.equalsIgnoreCase(n)) return FACH;
        return FREI;
    }

    /**
     * Speicherort (Ablage von Private Brain): erlaubt sind der Ordner „Private Brain“ selbst, der Hauptablageordner
     * (dort nutzt {@code Vault.find/create} den vorhandenen Unterordner „Private Brain“ oder legt genau ihn an) und ein
     * gewöhnlicher Ordner. Nie die Verwaltung „Tresorordner/“ und nie das Fach einer anderen App oder ein „Eingang-…“.
     * @return null = passt, sonst der Fehlercode für die Seite.
     */
    static String speicherortFehler(Ablage a, String name) throws IOException {
        String art = einordnen(a, name);
        if (VERWALTUNG.equals(art)) return "VAULT_FOLDER_IM_TRESOR";
        if (FACH.equals(art) && !a.gibtEs(KOPF_APP) && !EIGENES_FACH.equalsIgnoreCase(name == null ? "" : name.trim())) return "VAULT_FOLDER_IM_TRESOR";
        return null;
    }

    /**
     * Gemeinsamer Tresor verbinden: gewählt werden muss der Ordner mit tresorordner.json.
     * @return null = passt (HAUPTABLAGE), „NEU“ = dort liegt noch kein Tresor (nur mit ausdrücklicher Rückfrage anlegen),
     *         sonst der Fehlercode für die Seite (nichts wird angelegt).
     */
    static String tresorFehler(String art) {
        if (HAUPTABLAGE.equals(art)) return null;
        if (VERWALTUNG.equals(art)) return "TRESOR_ORDNER_VERWALTUNG";
        if (FACH.equals(art)) return "TRESOR_ORDNER_IST_FACH";
        return "NEU";
    }

    /**
     * Liegt ein frisch angelegtes Dokument (Ersatzschlüssel-Datei) im Tresor oder direkt neben dem Ablage-Ordner?
     * {@code bereiche}: „Anbieter|Kennung“ geschützter Ordner (Speicherort-Baum, Ablage-Wurzel „…/Private Brain“, Tresorordner-Baum).
     * Ein Dokument liegt darin, wenn seine Kennung mit „Ordner/“ beginnt. Neben der Ablage-Wurzel heißt: im selben
     * Elternordner wie „Private Brain“ (dort lag die Datei auf Klaus' Karte).
     * Nur für {@link #SPEICHER_ANBIETER} erkennbar; andere Anbieter (Cloud, „Downloads“) haben Kennungen ohne Pfad → false.
     */
    static boolean imTresor(String anbieter, String ziel, List<String> bereicheMitAnbieter, String ablageWurzelMitAnbieter) {
        if (!SPEICHER_ANBIETER.equals(anbieter) || ziel == null || !ziel.contains(":")) return false;
        for (String b : bereicheMitAnbieter) {
            if (b == null || !b.startsWith(SPEICHER_ANBIETER + "|")) continue;
            if (innen(ziel, b.substring(SPEICHER_ANBIETER.length() + 1))) return true;
        }
        if (ablageWurzelMitAnbieter != null && ablageWurzelMitAnbieter.startsWith(SPEICHER_ANBIETER + "|")) {
            String eltern = eltern(ablageWurzelMitAnbieter.substring(SPEICHER_ANBIETER.length() + 1));
            if (eltern != null && eltern.equalsIgnoreCase(eltern(ziel))) return true;
        }
        return false;
    }
    private static boolean innen(String ziel, String ordner) {
        if (ordner.isEmpty() || !ordner.contains(":")) return false;
        String z = ziel.toLowerCase(Locale.ROOT), o = ordner.toLowerCase(Locale.ROOT);
        if (o.endsWith(":")) return z.startsWith(o);           // ganzer Speicher gewählt
        return z.startsWith(o + "/");
    }
    /** „Speicher:a/b/c“ → „Speicher:a/b“; „Speicher:a“ → „Speicher:“. */
    static String eltern(String kennung) {
        if (kennung == null || !kennung.contains(":")) return null;
        int doppel = kennung.indexOf(':'), strich = kennung.lastIndexOf('/');
        return strich > doppel ? kennung.substring(0, strich) : kennung.substring(0, doppel + 1);
    }
}
