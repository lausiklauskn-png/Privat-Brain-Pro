package de.familyprojekt.privatebrain.pro;

import de.familyprojekt.tresor.DateiAblage;
import java.io.File;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import org.junit.Test;
import static org.junit.Assert.*;

/**
 * Gemeinsamer Tresor-Plan (Klaus 2026-11-03): Ordnerwahl einheitlich und Ersatzschlüssel nicht neben den Tresor.
 * Nachgestellt ist Klaus' SD-Karte vom 3.11.: „Privat Brain Pro Hauptablageordner/“ mit tresorordner.json,
 * „Tresorordner/“, „Private Brain/“ (tresor.json, Anhänge, Katalog …) und den Fächern der anderen Apps.
 */
public final class OrdnerWahlTest {
    static final String SD = "com.android.externalstorage.documents", KARTE = "1A2B-3C4D";
    static final String HAUPT = KARTE + ":Privat Brain Pro Hauptablageordner";

    static File karte() throws IOException {
        File h = Files.createTempDirectory("hauptablage").toFile(); h.deleteOnExit();
        Files.write(new File(h, "tresorordner.json").toPath(), "{\"format\":\"familyprojekt-tresorordner\"}".getBytes(StandardCharsets.UTF_8));
        File v = new File(h, "Tresorordner"); v.mkdirs();
        Files.write(new File(v, "kennwort-0b1c2d3e-0000-4000-8000-000000000000.json").toPath(), new byte[] {'{', '}'});
        Files.write(new File(v, "ersatz-0a1b2c3d.json").toPath(), new byte[] {'{', '}'});
        File pb = new File(h, "Private Brain"); new File(pb, "Anhänge").mkdirs(); new File(pb, "Katalog").mkdirs();
        Files.write(new File(pb, "tresor.json").toPath(), "{\"format\":\"private-brain-vault\"}".getBytes(StandardCharsets.UTF_8));
        new File(h, "Workflow PDF Pro").mkdirs(); new File(h, "Eingang-Private-Brain").mkdirs(); new File(h, "Familienakte").mkdirs();
        return h;
    }
    static String art(File ordner) throws IOException { return OrdnerWahl.einordnen(new DateiAblage(ordner), ordner.getName()); }

    @Test public void einordnungDerOrdnerAufDerKarte() throws Exception {
        File h = karte();
        assertEquals(OrdnerWahl.HAUPTABLAGE, art(h));
        assertEquals(OrdnerWahl.VERWALTUNG, art(new File(h, "Tresorordner")));
        assertEquals(OrdnerWahl.FACH, art(new File(h, "Private Brain")));
        assertEquals(OrdnerWahl.FACH, art(new File(h, "Workflow PDF Pro")));
        assertEquals(OrdnerWahl.FACH, art(new File(h, "Eingang-Private-Brain")));
        File frei = Files.createTempDirectory("frei").toFile(); frei.deleteOnExit();
        assertEquals(OrdnerWahl.FREI, art(frei));
        // Eine umbenannte Kopie der Verwaltung wird an ihren Dateien erkannt, nicht nur am Namen.
        File kopie = Files.createTempDirectory("kopie").toFile(); kopie.deleteOnExit();
        Files.write(new File(kopie, "fach-private-brain.json").toPath(), new byte[] {'{', '}'});
        assertEquals(OrdnerWahl.VERWALTUNG, art(kopie));
    }

    @Test public void speicherortNimmtHauptablageUndPrivateBrainAberKeineFremdenOrdner() throws Exception {
        File h = karte();
        assertNull("Hauptablageordner: Vault.find nutzt darin „Private Brain“", OrdnerWahl.speicherortFehler(new DateiAblage(h), h.getName()));
        assertNull(OrdnerWahl.speicherortFehler(new DateiAblage(new File(h, "Private Brain")), "Private Brain"));
        File leer = new File(h.getParentFile(), "leer-" + System.nanoTime()); leer.mkdirs(); leer.deleteOnExit();
        assertNull("gewöhnlicher leerer Ordner bleibt erlaubt", OrdnerWahl.speicherortFehler(new DateiAblage(leer), leer.getName()));
        assertEquals("VAULT_FOLDER_IM_TRESOR", OrdnerWahl.speicherortFehler(new DateiAblage(new File(h, "Tresorordner")), "Tresorordner"));
        assertEquals("VAULT_FOLDER_IM_TRESOR", OrdnerWahl.speicherortFehler(new DateiAblage(new File(h, "Workflow PDF Pro")), "Workflow PDF Pro"));
        assertEquals("VAULT_FOLDER_IM_TRESOR", OrdnerWahl.speicherortFehler(new DateiAblage(new File(h, "Eingang-Private-Brain")), "Eingang-Private-Brain"));
        // Leeres „Private Brain“ (noch nicht eingerichtet) ist Klaus' ursprünglicher Weg und bleibt erlaubt.
        File neu = Files.createTempDirectory("pbneu").toFile(); File pb = new File(neu, "Private Brain"); pb.mkdirs(); neu.deleteOnExit();
        assertNull(OrdnerWahl.speicherortFehler(new DateiAblage(pb), "Private Brain"));
    }

    @Test public void tresorVerbindenNurMitTresorordnerJson() throws Exception {
        File h = karte();
        assertNull(OrdnerWahl.tresorFehler(art(h)));
        assertEquals("TRESOR_ORDNER_VERWALTUNG", OrdnerWahl.tresorFehler(art(new File(h, "Tresorordner"))));
        assertEquals("TRESOR_ORDNER_IST_FACH", OrdnerWahl.tresorFehler(art(new File(h, "Private Brain"))));
        assertEquals("TRESOR_ORDNER_IST_FACH", OrdnerWahl.tresorFehler(art(new File(h, "Workflow PDF Pro"))));
        File frei = Files.createTempDirectory("frei").toFile(); frei.deleteOnExit();
        assertEquals("ohne tresorordner.json nur mit Rückfrage", "NEU", OrdnerWahl.tresorFehler(art(frei)));
    }

    @Test public void ersatzschluesselImOderNebenDemTresorWirdErkannt() {
        List<String> bereiche = Arrays.asList(SD + "|" + HAUPT, SD + "|" + HAUPT + "/Private Brain");
        String wurzel = SD + "|" + HAUPT + "/Private Brain";
        // Klaus' Befund: direkt im Hauptablageordner.
        assertTrue(OrdnerWahl.imTresor(SD, HAUPT + "/PRIVATE-BRAIN-ERSATZSCHLUESSEL.txt", bereiche, wurzel));
        assertTrue(OrdnerWahl.imTresor(SD, HAUPT + "/Private Brain/Katalog/x.txt", bereiche, wurzel));
        assertTrue("Groß/klein egal", OrdnerWahl.imTresor(SD, KARTE.toLowerCase() + ":privat brain pro hauptablageordner/k.txt", bereiche, wurzel));
        // Nur Speicherort bekannt (Tresor nie verbunden): neben „Private Brain“ zählt auch.
        assertTrue(OrdnerWahl.imTresor(SD, HAUPT + "/k.txt", Collections.singletonList(wurzel), wurzel));
        // Woanders: erlaubt.
        assertFalse(OrdnerWahl.imTresor(SD, "primary:Download/PRIVATE-BRAIN-ERSATZSCHLUESSEL.txt", bereiche, wurzel));
        assertFalse(OrdnerWahl.imTresor(SD, KARTE + ":Sicherung/k.txt", bereiche, wurzel));
        assertFalse("ähnlicher Name ist nicht derselbe Ordner", OrdnerWahl.imTresor(SD, HAUPT + " alt/k.txt", bereiche, wurzel));
        // Ehrliche Grenze: andere Anbieter haben keinen Pfad in der Kennung.
        assertFalse(OrdnerWahl.imTresor("com.android.providers.downloads.documents", "msf:42", bereiche, wurzel));
        assertFalse(OrdnerWahl.imTresor(SD, HAUPT + "/k.txt", Collections.emptyList(), null));
    }

    @Test public void eltern() {
        assertEquals("primary:a/b", OrdnerWahl.eltern("primary:a/b/c"));
        assertEquals("primary:", OrdnerWahl.eltern("primary:a"));
        assertNull(OrdnerWahl.eltern("msf:42".replace(":", "")));
    }
}
