package de.familyprojekt.privatebrain.pro;

import de.familyprojekt.tresor.Ablage;
import de.familyprojekt.tresor.Fach;
import de.familyprojekt.tresor.Hauptordner;
import de.familyprojekt.tresor.Json;
import de.familyprojekt.tresor.TresorOrdner;
import de.familyprojekt.tresor.UnterAblage;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.Map;

/**
 * „Tresor einrichten – nur Speicher wählen“ für Private Brain Pro (Klaus 2026-11-04), gerätefrei und ohne Android-Klassen,
 * damit JUnit es mit {@code DateiAblage} prüft. Vorbild Workflow PDF Pro {@code ProVaultPlugin.tresorEinrichten},
 * Familienakte {@code ProTresorAdapter.einrichten}, BookLedgerPro {@code TresorEinrichtung}.
 *
 * Unterschied zu BookLedgerPro: Private Brain Pro hat eine eigene verschlüsselte Ablage („Private Brain/“ mit
 * {@code tresor.json}, Mails, Anhänge, Originale, Katalog). Sie liegt nach der Einrichtung als Fach im Tresor-Hauptordner.
 * Diese Klasse entscheidet nur – sie liest, schreibt aber nichts. Angelegt wird erst nach dem Passwort im Plugin.
 *
 * Abgewiesen, bevor etwas entsteht: Ordner im Tresor, mehrere Tresore, ungültiger oder belegter Name, ein fremder
 * Inhalt in „Private Brain“, und eine schon eingerichtete eigene Ablage an einem anderen Ort (nie still umziehen).
 */
final class TresorEinrichtung {
    private TresorEinrichtung() { }

    /** Was bei der Einrichtung geschieht. Pfade relativ zum gewählten Speicher ("" = er selbst). */
    static final class Plan {
        final Hauptordner.Ergebnis e;
        /** Neu anzulegender Hauptordner (nur bei ANLEGEN_DARIN), sonst null. */
        final String neuerOrdner;
        /** Hauptordner relativ zum gewählten Speicher. */
        final String pfad;
        /** Gemeinsamer Tresor (tresorordner.json) liegt schon da. */
        final boolean tresorDa;
        /** Eigene Ablage „Private Brain/tresor.json“ liegt schon im Hauptordner. */
        final boolean ablageDa;
        Plan(Hauptordner.Ergebnis e, String neuerOrdner, String pfad, boolean tresorDa, boolean ablageDa) {
            this.e = e; this.neuerOrdner = neuerOrdner; this.pfad = pfad; this.tresorDa = tresorDa; this.ablageDa = ablageDa;
        }
        /** Ein Passwort-Fenster mit Wiederholung und Hinweis, sobald etwas neu verschlüsselt wird. */
        boolean anlegen() { return !tresorDa || !ablageDa; }
    }

    /** Nur lesend, direkt nach der Speicherwahl: braucht es noch einen Namen (ANLEGEN_DARIN)? */
    static Hauptordner.Ergebnis pruefen(Ablage gewaehlt, String ordnerName) throws IOException {
        Hauptordner.Ergebnis e = Hauptordner.suchen(gewaehlt, letzterTeil(ordnerName));
        if (e.gefunden()) return e;
        if (Hauptordner.UNTERORDNER.equals(e.art) || istFachName(ordnerName)) throw new IOException("TRESOR_ORDNER_UNTERORDNER");
        if (!e.anlegen()) throw new IOException("TRESOR_ORDNER_" + e.art);
        return e;
    }

    /** Liegt im gewählten Ordner selbst schon „Private Brain/tresor.json“ (ältere Ablage ohne gemeinsamen Tresor)? */
    static boolean alteAblageHier(Ablage gewaehlt) throws IOException { return gewaehlt.gibtEs(TresorEinzug.KOPF_PFAD); }

    /**
     * Nur lesend. {@code neuerName} nur bei ANLEGEN_DARIN ohne alte Ablage im gewählten Ordner.
     * {@code eigeneId}: Kennung der schon eingerichteten eigenen Ablage oder leer/null.
     */
    static Plan planen(Ablage gewaehlt, Hauptordner.Ergebnis e, String neuerName, String eigeneId) throws IOException {
        String neu = null, pfad;
        if (e.gefunden()) pfad = e.pfad;
        else if (Hauptordner.ANLEGEN_DARIN.equals(e.art) && !alteAblageHier(gewaehlt)) {
            neu = Hauptordner.name(neuerName);
            if (gewaehlt.gibtEs(neu) && (!gewaehlt.istOrdner(neu) || !gewaehlt.liste(neu).isEmpty())) throw new IOException("TRESOR_NAME_BELEGT");
            pfad = neu;
        } else if (e.anlegen()) pfad = ""; // leerer Speicher, oder die alte Ablage liegt schon hier: Tresor daneben
        else throw new IOException("TRESOR_ORDNER_" + e.art);
        String vor = pfad.isEmpty() ? "" : pfad + "/";
        boolean ablageDa = gewaehlt.gibtEs(vor + TresorEinzug.KOPF_PFAD);
        String fach = vor + Fach.PRIVATE_BRAIN.ordner;
        boolean eigene = eigeneId != null && !eigeneId.isEmpty();
        if (ablageDa) {
            String id = kopfKennung(gewaehlt, vor + TresorEinzug.KOPF_PFAD);
            if (id == null) throw new IOException("TRESOR_ORDNER_FREMDER_TRESOR");
            if (eigene && !eigeneId.equals(id)) throw new IOException("VAULT_ANDERER_ORT");
        } else {
            if (gewaehlt.gibtEs(fach) && (!gewaehlt.istOrdner(fach) || !gewaehlt.liste(fach).isEmpty())) throw new IOException("VAULT_FOLDER_IN_USE");
            if (eigene) throw new IOException("VAULT_ANDERER_ORT");
        }
        return new Plan(e, neu, pfad, e.gefunden(), ablageDa);
    }

    /** Erst prüfen, dann schreiben: das Passwort öffnet den vorhandenen gemeinsamen Tresor (falsch → TRESOR_PASSWORT_FALSCH). */
    static void tresorPasswortPruefen(Ablage gewaehlt, Plan plan, CharSequence passwort) throws IOException {
        if (!plan.tresorDa) {
            if (passwort == null || Character.codePointCount(passwort, 0, passwort.length()) < TresorOrdner.MIN_PASSWORT)
                throw new IOException("TRESOR_PASSWORT_KURZ");
            return;
        }
        TresorOrdner.oeffnen(haupt(gewaehlt, plan), TresorEinzug.APP, passwort).close();
    }

    /** Ablage des Hauptordners; legt ihn bei {@code neuerOrdner} an (sonst nichts). */
    static Ablage hauptAnlegen(Ablage gewaehlt, Plan plan) throws IOException {
        if (plan.neuerOrdner != null) return Hauptordner.ablage(gewaehlt, plan.e, plan.neuerOrdner);
        return haupt(gewaehlt, plan);
    }

    static Ablage haupt(Ablage gewaehlt, Plan plan) throws IOException {
        return plan.pfad.isEmpty() ? gewaehlt : new UnterAblage(gewaehlt, plan.pfad);
    }

    /** Lies-mich ist ein Zusatz; ein Fehler bricht nichts ab. */
    static void liesMich(Ablage haupt) {
        try { Hauptordner.liesMichAnlegen(haupt); } catch (IOException zusatz) { /* Zusatz */ }
    }

    private static String kopfKennung(Ablage a, String pfad) {
        try {
            Map<String, Object> kopf = Json.objekt(new String(a.lesen(pfad, 65536), StandardCharsets.UTF_8));
            Object id = kopf.get("id");
            return TresorEinzug.TRESOR_FORMAT.equals(kopf.get("format")) && id instanceof String && !((String) id).isEmpty() ? (String) id : null;
        } catch (IOException kaputt) { return null; }
    }

    static String letzterTeil(String n) {
        if (n == null) return "";
        String s = n.replace('\\', '/');
        while (s.endsWith("/")) s = s.substring(0, s.length() - 1);
        s = s.substring(s.lastIndexOf('/') + 1);
        if (s.contains(":")) s = s.substring(s.indexOf(':') + 1);
        return s.trim();
    }

    static boolean istFachName(String n) {
        String s = letzterTeil(n);
        if (s.isEmpty()) return false;
        if (s.equalsIgnoreCase(TresorOrdner.VERWALTUNG)) return true;
        for (Fach f : Fach.ALLE) if (s.equalsIgnoreCase(f.ordner)) return true;
        return s.regionMatches(true, 0, "Eingang-", 0, 8);
    }
}
