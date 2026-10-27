package de.familyprojekt.privatebrain.pro;

import de.familyprojekt.tresor.DateiAblage;
import de.familyprojekt.tresor.Eintrag;
import de.familyprojekt.tresor.Fach;
import de.familyprojekt.tresor.TresorOrdner;
import java.io.File;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Random;
import java.util.TreeMap;
import java.util.UUID;
import org.junit.Test;
import static org.junit.Assert.*;

/**
 * Schritt D2: Einzug des Private-Brain-Tresors in den gemeinsamen Tresorordner, am nachgestellten Ordner
 * (java.io.File statt SD-Karte). Kernfragen aus Klaus' Plan: die Probe an einer Kopie lässt das Original
 * unberührt · im Fach bleibt jede Datei byte-gleich · der Rückweg (zwei Einträge löschen) ergibt wieder den
 * Ausgangszustand · eine andere App liest danach das Inhaltsverzeichnis.
 */
public final class TresorEinzugTest {
    static final String PW = "ein-langes-Tresorordner-Passwort";

    static File neu() throws IOException { File d = Files.createTempDirectory("einzug").toFile(); d.deleteOnExit(); return d; }

    static Map<String, String> baum(File wurzel) throws Exception {
        Map<String, String> aus = new TreeMap<>();
        sammeln(wurzel, "", aus);
        return aus;
    }
    private static void sammeln(File f, String pfad, Map<String, String> aus) throws Exception {
        if (f.isDirectory()) {
            aus.put(pfad + "/", "ordner");
            String[] namen = f.list(); Arrays.sort(namen);
            for (String n : namen) sammeln(new File(f, n), pfad.isEmpty() ? n : pfad + "/" + n, aus);
        } else aus.put(pfad, VaultCrypto.hex(MessageDigest.getInstance("SHA-256").digest(Files.readAllBytes(f.toPath()))));
    }
    static String code(Run r) { try { r.run(); return "kein Fehler"; } catch (IOException e) { return e.getMessage(); } catch (Exception e) { return e.toString(); } }
    interface Run { void run() throws Exception; }

    /** Wie Vault.create: „Private Brain/“ mit tresor.json und den Unterordnern (Dateien unter HMAC-Namen). */
    static String workflowTresorNachstellen(File eltern) throws Exception {
        String id = UUID.randomUUID().toString();
        File w = new File(eltern, Fach.PRIVATE_BRAIN.ordner); assertTrue(w.mkdirs());
        String kopf = "{\n  \"format\": \"private-brain-vault\",\n  \"version\": 1,\n  \"id\": \"" + id + "\",\n  \"kdf\": \"PBKDF2-HMAC-SHA256\",\n  \"iterations\": 600000,\n  \"salt\": \"AAAAAAAAAAAAAAAAAAAAAA==\",\n  \"key\": \"eA==\",\n  \"created\": 1761500000000\n}";
        Files.write(new File(w, TresorEinzug.TRESOR_KOPF).toPath(), kopf.getBytes(StandardCharsets.UTF_8));
        Random r = new Random(7);
        for (String ordner : new String[] {"Mails", "Anhänge", "Originale", "Katalog"}) {
            File o = new File(w, ordner); assertTrue(o.mkdirs());
            for (int i = 0; i < 2; i++) { byte[] b = new byte[30_000 + r.nextInt(100_000)]; r.nextBytes(b); Files.write(new File(o, Long.toHexString(r.nextLong()) + "a1b2c3d4e5f6a7b8c9d0e1f2.pbv").toPath(), b); }
        }
        return id;
    }
    static void kopieren(File von, File nach) throws IOException {
        if (von.isDirectory()) { assertTrue(nach.mkdirs()); for (String n : von.list()) kopieren(new File(von, n), new File(nach, n)); }
        else Files.copy(von.toPath(), nach.toPath());
    }
    static void loeschenRekursiv(File f) { File[] k = f.listFiles(); if (k != null) for (File x : k) loeschenRekursiv(x); assertTrue(f.delete()); }

    @Test public void pruefenErkenntOrdner() throws Exception {
        File leer = neu(), sd = neu();
        String id = workflowTresorNachstellen(sd);
        assertEquals("OHNE_TRESOR", TresorEinzug.pruefen(new DateiAblage(leer), id));
        assertEquals("PASST", TresorEinzug.pruefen(new DateiAblage(sd), id));
        assertEquals("FREMDER_TRESOR", TresorEinzug.pruefen(new DateiAblage(sd), UUID.randomUUID().toString()));
        // Wer den Ordner „Workflow PDF Pro“ selbst wählt, muss die Ebene darüber freigeben.
        assertEquals("IST_FACH", TresorEinzug.pruefen(new DateiAblage(new File(sd, Fach.PRIVATE_BRAIN.ordner)), id));
        // Ein Kopf einer anderen App unter dem Namen zählt nicht.
        File fremd = neu(); new File(fremd, Fach.PRIVATE_BRAIN.ordner).mkdirs();
        Files.write(new File(fremd, TresorEinzug.KOPF_PFAD).toPath(), ("{\"format\":\"workflow-pdf-pro-vault\",\"id\":\"" + id + "\"}").getBytes(StandardCharsets.UTF_8));
        assertEquals("FREMDER_TRESOR", TresorEinzug.pruefen(new DateiAblage(fremd), id));
        // Kopf mit „format“ — nicht verwechseln mit Workflow PDF Pros „app“-Kopf.
        Files.write(new File(fremd, TresorEinzug.KOPF_PFAD).toPath(), ("{\"app\":\"private-brain-vault\",\"id\":\"" + id + "\"}").getBytes(StandardCharsets.UTF_8));
        assertEquals("FREMDER_TRESOR", TresorEinzug.pruefen(new DateiAblage(fremd), id));
    }

    @Test public void probeAnKopieLaesstOriginalUndFachUnberuehrtUndRueckwegStimmt() throws Exception {
        File sd = neu(), original = new File(sd, "Ablage"), probe = new File(sd, "Tresor-Probe");
        assertTrue(original.mkdirs());
        String id = workflowTresorNachstellen(original);
        kopieren(new File(original, Fach.PRIVATE_BRAIN.ordner), new File(probe, Fach.PRIVATE_BRAIN.ordner));
        Map<String, String> sdVorher = baum(sd), probeVorher = baum(probe), fachVorher = baum(new File(probe, Fach.PRIVATE_BRAIN.ordner));
        byte[] datenSchluessel = new SecureRandom().generateSeed(32);

        DateiAblage a = new DateiAblage(probe);
        assertEquals("PASST", TresorEinzug.pruefen(a, id));
        try (TresorOrdner t = TresorOrdner.anlegen(a, TresorEinzug.APP, PW)) {
            TresorEinzug.einziehen(t, datenSchluessel);
            assertTrue(TresorEinzug.eingezogen(t));
            TresorEinzug.einziehen(t, datenSchluessel); // zweimal ist kein Fehler
            assertEquals("TRESOR_FACH_BELEGT", code(() -> TresorEinzug.einziehen(t, new SecureRandom().generateSeed(32))));
        }
        // Original (alles außerhalb der Probe) unverändert, im Fach jede Datei byte-gleich.
        Map<String, String> sdNachher = baum(sd);
        for (Map.Entry<String, String> e : sdVorher.entrySet()) if (!e.getKey().startsWith("Tresor-Probe")) assertEquals(e.getKey(), e.getValue(), sdNachher.get(e.getKey()));
        assertEquals(fachVorher, baum(new File(probe, Fach.PRIVATE_BRAIN.ordner)));
        // Neu in der Probe nur: tresorordner.json und Tresorordner/.
        List<String> neueOben = new ArrayList<>(Arrays.asList(probe.list())); neueOben.removeAll(Arrays.asList(Fach.PRIVATE_BRAIN.ordner));
        neueOben.sort(null);
        assertEquals(Arrays.asList(TresorOrdner.VERWALTUNG, TresorOrdner.KOPF), neueOben);

        // Eine andere App öffnet mit demselben Passwort und bekommt genau den Datenschlüssel des Fachs.
        try (TresorOrdner blp = TresorOrdner.oeffnen(new DateiAblage(probe), Fach.BOOKLEDGER_APP, PW)) {
            assertArrayEquals(datenSchluessel, blp.fachSchluessel(TresorEinzug.FACH));
            assertEquals("TRESOR_FACH_FREMD", code(() -> blp.fachEinziehen(TresorEinzug.FACH, datenSchluessel)));
        }
        // Rückweg: die drei neuen Einträge löschen = Ausgangszustand.
        loeschenRekursiv(new File(probe, TresorOrdner.VERWALTUNG));
        assertTrue(new File(probe, TresorOrdner.KOPF).delete());
        assertEquals(probeVorher, baum(probe));
    }

    static Map<String, Object> zeile(String id, String name, long datum, String auszug) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", id); m.put("name", name); m.put("datum", datum); m.put("groesse", 1234L); m.put("auszug", auszug);
        m.put("sha256", "ab".repeat(32));
        return m;
    }

    @Test public void inhaltsverzeichnisNurBeiAenderungUndFuerAndereLesbar() throws Exception {
        File sd = neu(); String id = workflowTresorNachstellen(sd);
        DateiAblage a = new DateiAblage(sd);
        try (TresorOrdner t = TresorOrdner.anlegen(a, TresorEinzug.APP, PW)) {
            TresorEinzug.einziehen(t, new SecureRandom().generateSeed(32));
            List<Map<String, Object>> zeilen = new ArrayList<>();
            zeilen.add(zeile(UUID.randomUUID().toString(), "Rechnung Mai", 1700000000000L, "Rechnung Nr. 4711 " + "x".repeat(2000)));
            zeilen.add(zeile(UUID.randomUUID().toString(), "Vertrag", 1700000001000L, ""));
            assertTrue(TresorEinzug.schreibenWennGeaendert(t, TresorEinzug.eintraege(zeilen)));
            int staende = new File(sd, TresorOrdner.VERWALTUNG + "/verzeichnis/" + TresorEinzug.FACH + "/" + TresorEinzug.APP).list().length;
            assertFalse(TresorEinzug.schreibenWennGeaendert(t, TresorEinzug.eintraege(zeilen)));
            assertEquals(staende, new File(sd, TresorOrdner.VERWALTUNG + "/verzeichnis/" + TresorEinzug.FACH + "/" + TresorEinzug.APP).list().length);
            zeilen.get(1).put("name", "Vertrag (neu)");
            assertTrue(TresorEinzug.schreibenWennGeaendert(t, TresorEinzug.eintraege(zeilen)));
            // Schreiber und Format setzt die App-Seite selbst, egal was hereinkommt.
            zeilen.get(0).put("schreiber", Fach.PRIVATE_BRAIN_APP); zeilen.get(0).put("verschluesselung", "fpt1");
            for (Eintrag e : TresorEinzug.eintraege(zeilen)) { assertEquals(TresorEinzug.APP, e.schreiber); assertEquals("app", e.verschluesselung); }
            zeilen.get(0).put("id", "../böse");
            assertEquals("TRESOR_EINTRAG_UNGUELTIG", code(() -> TresorEinzug.eintraege(zeilen)));
        }
        try (TresorOrdner pb = TresorOrdner.oeffnen(a, Fach.WORKFLOW_PDF_APP, PW)) {
            List<Eintrag> gelesen = pb.verzeichnis(TresorEinzug.FACH);
            assertEquals(2, gelesen.size());
            Eintrag r = gelesen.get(0).name.startsWith("Rechnung") ? gelesen.get(0) : gelesen.get(1);
            assertTrue(r.auszug.startsWith("Rechnung Nr. 4711"));
            assertEquals(Eintrag.AUSZUG_MAX, r.auszug.length());
            assertEquals("katalog/" + r.id, r.verweis);
            assertEquals("TRESOR_FACH_FREMD", code(() -> pb.verzeichnisSchreiben(TresorEinzug.FACH, new ArrayList<>())));
        }
        assertEquals("PASST", TresorEinzug.pruefen(a, id));
    }

    @Test public void rechnungsmailLiegtImEingangUndBookLedgerProLiestSie() throws Exception {
        File sd = neu(); workflowTresorNachstellen(sd);
        Map<String, String> fachVorher = baum(new File(sd, Fach.PRIVATE_BRAIN.ordner));
        byte[] eml = ("From: Lieferant <rechnung@example.org>\r\nSubject: Rechnung 2026-117\r\n\r\nAnbei die Rechnung.").getBytes(StandardCharsets.UTF_8);
        DateiAblage a = new DateiAblage(sd);
        try (TresorOrdner t = TresorOrdner.anlegen(a, TresorEinzug.APP, PW)) {
            TresorEinzug.einziehen(t, new SecureRandom().generateSeed(32));
            Eintrag e = TresorEinzug.mailAblegen(t, "Rechnung 2026/117: Büro", 1761500000000L, new java.io.ByteArrayInputStream(eml), "Anbei die Rechnung.");
            assertEquals("Rechnung 2026_117_ Büro.eml", e.name);
            assertEquals("fpt1", e.verschluesselung);
            assertTrue(e.verweis.startsWith("Mails/"));
            // Eine zweite gleiche Mail ist eine eigene Zeile (Doppel erkennt BookLedgerPro am SHA-256).
            TresorEinzug.mailAblegen(t, "x", 0, new java.io.ByteArrayInputStream(eml), "");
        }
        assertEquals(fachVorher, baum(new File(sd, Fach.PRIVATE_BRAIN.ordner)));
        try (TresorOrdner blp = TresorOrdner.oeffnen(a, Fach.BOOKLEDGER_APP, PW)) {
            List<Eintrag> eingang = blp.verzeichnis(Fach.EINGANG_BOOKLEDGER.slug);
            assertEquals(2, eingang.size());
            Eintrag r = eingang.get(0).name.startsWith("Rechnung") ? eingang.get(0) : eingang.get(1);
            assertEquals(Fach.PRIVATE_BRAIN_APP, r.schreiber);
            assertEquals("message/rfc822", r.art);
            assertEquals(eingang.get(0).sha256, eingang.get(1).sha256);
            java.io.ByteArrayOutputStream back = new java.io.ByteArrayOutputStream();
            try (java.io.InputStream in = blp.oeffnen(Fach.EINGANG_BOOKLEDGER.slug, r)) { byte[] b = new byte[4096]; int n; while ((n = in.read(b)) != -1) back.write(b, 0, n); }
            assertArrayEquals(eml, back.toByteArray());
            blp.markeSetzen(Fach.EINGANG_BOOKLEDGER.slug, r.id);
            assertTrue(new File(sd, Fach.EINGANG_BOOKLEDGER.ordner + "/" + r.verweis).isFile()); // übernommen ≠ gelöscht
        }
    }
}
