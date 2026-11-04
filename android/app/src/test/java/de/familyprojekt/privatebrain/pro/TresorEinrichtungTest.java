package de.familyprojekt.privatebrain.pro;

import de.familyprojekt.tresor.Ablage;
import de.familyprojekt.tresor.DateiAblage;
import de.familyprojekt.tresor.Hauptordner;
import de.familyprojekt.tresor.TresorOrdner;
import java.io.File;
import java.io.IOException;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import org.junit.Test;
import static org.junit.Assert.*;

/**
 * „Tresor einrichten – nur Speicher wählen“ in Private Brain Pro (Klaus 2026-11-04): die Entscheidung vor dem Passwort,
 * am nachgestellten Speicher (java.io.File statt SD-Karte). Geprüft wird, dass nichts geschrieben wird, solange nur
 * geplant und geprüft wird, und dass jede falsche Lage abgewiesen ist, bevor etwas entsteht.
 */
public final class TresorEinrichtungTest {
    static final String PW = "ein-langes-Tresor-Passwort";

    static File neu() throws IOException { File d = Files.createTempDirectory("einrichten").toFile(); d.deleteOnExit(); return d; }
    static void datei(Ablage a, String pfad, String text) throws IOException { try (OutputStream o = a.neu(pfad)) { o.write(text.getBytes(StandardCharsets.UTF_8)); } }
    static void pbKopf(Ablage a, String vor, String id) throws IOException {
        if (!vor.isEmpty()) a.ordner(vor.substring(0, vor.length() - 1));
        a.ordner(vor + "Private Brain");
        datei(a, vor + "Private Brain/tresor.json", "{\"format\":\"private-brain-vault\",\"version\":1,\"id\":\"" + id + "\"}");
    }
    static int anzahl(File d) { File[] l = d.listFiles(); int n = 0; if (l != null) for (File f : l) n += 1 + (f.isDirectory() ? anzahl(f) : 0); return n; }

    @Test public void leererSpeicher_tresorUndAblageNeu_nichtsGeschrieben() throws Exception {
        File d = neu(); DateiAblage a = new DateiAblage(d);
        Hauptordner.Ergebnis e = TresorEinrichtung.pruefen(a, "SD-Karte");
        assertEquals(Hauptordner.ANLEGEN_HIER, e.art);
        TresorEinrichtung.Plan p = TresorEinrichtung.planen(a, e, null, null);
        assertEquals("", p.pfad); assertNull(p.neuerOrdner); assertFalse(p.tresorDa); assertFalse(p.ablageDa); assertTrue(p.anlegen());
        assertEquals(0, anzahl(d));
    }

    @Test public void speicherMitAnderem_neuerHauptordner_nameGeprueft() throws Exception {
        File d = neu(); DateiAblage a = new DateiAblage(d); datei(a, "Urlaub.jpg", "x");
        Hauptordner.Ergebnis e = TresorEinrichtung.pruefen(a, "primary:");
        assertEquals(Hauptordner.ANLEGEN_DARIN, e.art);
        TresorEinrichtung.Plan p = TresorEinrichtung.planen(a, e, Hauptordner.VORSCHLAG, null);
        assertEquals(Hauptordner.VORSCHLAG, p.pfad); assertEquals(Hauptordner.VORSCHLAG, p.neuerOrdner);
        assertFalse(a.gibtEs(Hauptordner.VORSCHLAG)); // geplant, nicht angelegt
        try { TresorEinrichtung.planen(a, e, "a/b", null); fail(); } catch (IOException ok) { }
        try { TresorEinrichtung.planen(a, e, "Private Brain", null); fail(); } catch (IOException ok) { }
        a.ordner("Belegt"); datei(a, "Belegt/x.txt", "x");
        try { TresorEinrichtung.planen(a, e, "Belegt", null); fail(); } catch (IOException ok) { assertEquals("TRESOR_NAME_BELEGT", ok.getMessage()); }
    }

    @Test public void vorhandenerTresor_wirdGefunden_ablageNochNicht() throws Exception {
        File d = neu(); DateiAblage a = new DateiAblage(d); a.ordner("Privat Brain Pro Hauptablageordner");
        Ablage h = TresorEinrichtung.haupt(a, new TresorEinrichtung.Plan(null, null, "Privat Brain Pro Hauptablageordner", true, false));
        TresorOrdner.anlegen(h, "familienakte", PW).close();
        datei(a, "Notiz.txt", "x");
        Hauptordner.Ergebnis e = TresorEinrichtung.pruefen(a, "SD");
        assertTrue(e.gefunden());
        TresorEinrichtung.Plan p = TresorEinrichtung.planen(a, e, null, "");
        assertEquals("Privat Brain Pro Hauptablageordner", p.pfad); assertTrue(p.tresorDa); assertFalse(p.ablageDa);
        int vorher = anzahl(d);
        TresorEinrichtung.tresorPasswortPruefen(a, p, PW);
        try { TresorEinrichtung.tresorPasswortPruefen(a, p, "falsches-Passwort-123"); fail(); }
        catch (IOException ok) { assertEquals("TRESOR_PASSWORT_FALSCH", ok.getMessage()); }
        assertEquals(vorher, anzahl(d)); // Prüfen schreibt nichts
    }

    @Test public void eigeneAblageImTresor_gleicheKennung_passt_andere_abgewiesen() throws Exception {
        File d = neu(); DateiAblage a = new DateiAblage(d);
        a.ordner("Family-Projekt"); Ablage h = TresorEinrichtung.haupt(a, new TresorEinrichtung.Plan(null, null, "Family-Projekt", true, false));
        TresorOrdner.anlegen(h, "workflow-pdf-pro", PW).close();
        pbKopf(a, "Family-Projekt/", "11111111-1111-1111-1111-111111111111");
        Hauptordner.Ergebnis e = TresorEinrichtung.pruefen(a, "SD");
        TresorEinrichtung.Plan p = TresorEinrichtung.planen(a, e, null, null);
        assertTrue(p.ablageDa); assertFalse(p.anlegen());
        assertTrue(TresorEinrichtung.planen(a, e, null, "11111111-1111-1111-1111-111111111111").ablageDa);
        try { TresorEinrichtung.planen(a, e, null, "22222222-2222-2222-2222-222222222222"); fail(); }
        catch (IOException ok) { assertEquals("VAULT_ANDERER_ORT", ok.getMessage()); }
    }

    @Test public void eigeneAblageWoanders_nieStillUmziehen() throws Exception {
        File d = neu(); DateiAblage a = new DateiAblage(d);
        try { TresorEinrichtung.planen(a, TresorEinrichtung.pruefen(a, "SD"), null, "33333333-3333-3333-3333-333333333333"); fail(); }
        catch (IOException ok) { assertEquals("VAULT_ANDERER_ORT", ok.getMessage()); }
    }

    @Test public void privateBrainMitFremdemInhalt_abgewiesen() throws Exception {
        // Im gefundenen Tresor liegt „Private Brain“ ohne tresor.json, aber mit Inhalt: nie hineinlegen.
        File d = neu(); DateiAblage a = new DateiAblage(d);
        TresorOrdner.anlegen(a, "familienakte", PW).close();
        a.ordner("Private Brain"); datei(a, "Private Brain/fremd.txt", "x");
        Hauptordner.Ergebnis e = TresorEinrichtung.pruefen(a, "SD");
        assertTrue(e.gefunden());
        try { TresorEinrichtung.planen(a, e, null, null); fail(); } catch (IOException ok) { assertEquals("VAULT_FOLDER_IN_USE", ok.getMessage()); }
        // Außerhalb eines Tresors: „Private Brain“ mit fremdem Inhalt bleibt unberührt, ein neuer Hauptordner entsteht daneben.
        File d3 = neu(); DateiAblage c = new DateiAblage(d3); c.ordner("Private Brain"); datei(c, "Private Brain/fremd.txt", "x");
        assertEquals(Hauptordner.VORSCHLAG, TresorEinrichtung.planen(c, TresorEinrichtung.pruefen(c, "SD"), Hauptordner.VORSCHLAG, null).pfad);
        // fremdes Format in tresor.json
        File d2 = neu(); DateiAblage b = new DateiAblage(d2); b.ordner("Private Brain"); datei(b, "Private Brain/tresor.json", "{\"format\":\"anders\",\"id\":\"x\"}");
        try { TresorEinrichtung.planen(b, TresorEinrichtung.pruefen(b, "SD"), null, null); fail(); }
        catch (IOException ok) { assertEquals("TRESOR_ORDNER_FREMDER_TRESOR", ok.getMessage()); }
    }

    @Test public void alteAblageOhneTresor_tresorEntstehtDaneben() throws Exception {
        File d = neu(); DateiAblage a = new DateiAblage(d);
        pbKopf(a, "", "44444444-4444-4444-4444-444444444444");
        Hauptordner.Ergebnis e = TresorEinrichtung.pruefen(a, "Privat Brain Pro Hauptablageordner");
        assertEquals(Hauptordner.ANLEGEN_DARIN, e.art);
        TresorEinrichtung.Plan p = TresorEinrichtung.planen(a, e, null, "44444444-4444-4444-4444-444444444444");
        assertEquals("", p.pfad); assertNull(p.neuerOrdner); assertFalse(p.tresorDa); assertTrue(p.ablageDa);
    }

    @Test public void ordnerImTresor_undMehrereTresore_abgewiesen() throws Exception {
        File d = neu(); DateiAblage a = new DateiAblage(d);
        try { TresorEinrichtung.pruefen(a, "primary:Family-Projekt/Private Brain"); fail(); } catch (IOException ok) { assertEquals("TRESOR_ORDNER_UNTERORDNER", ok.getMessage()); }
        try { TresorEinrichtung.pruefen(a, "Tresorordner"); fail(); } catch (IOException ok) { assertEquals("TRESOR_ORDNER_UNTERORDNER", ok.getMessage()); }
        for (String n : new String[] {"A", "B"}) { a.ordner(n); TresorOrdner.anlegen(TresorEinrichtung.haupt(a, new TresorEinrichtung.Plan(null, null, n, true, false)), "bookledgerpro", PW).close(); }
        try { TresorEinrichtung.pruefen(a, "SD"); fail(); } catch (IOException ok) { assertEquals("TRESOR_ORDNER_MEHRERE", ok.getMessage()); }
    }

    @Test public void kurzesPasswort_fuerNeuenTresor_abgewiesen() throws Exception {
        File d = neu(); DateiAblage a = new DateiAblage(d);
        TresorEinrichtung.Plan p = TresorEinrichtung.planen(a, TresorEinrichtung.pruefen(a, "SD"), null, null);
        try { TresorEinrichtung.tresorPasswortPruefen(a, p, "kurz"); fail(); } catch (IOException ok) { assertEquals("TRESOR_PASSWORT_KURZ", ok.getMessage()); }
        TresorEinrichtung.tresorPasswortPruefen(a, p, PW);
        assertEquals(0, anzahl(d));
    }

    @Test public void hauptordnerAnlegen_nurBeiNeuemNamen_undLiesMich() throws Exception {
        File d = neu(); DateiAblage a = new DateiAblage(d); datei(a, "x.txt", "x");
        TresorEinrichtung.Plan p = TresorEinrichtung.planen(a, TresorEinrichtung.pruefen(a, "SD"), "Meine Akte", null);
        Ablage h = TresorEinrichtung.hauptAnlegen(a, p);
        assertTrue(a.istOrdner("Meine Akte"));
        TresorOrdner.anlegen(h, TresorEinzug.APP, PW).close();
        TresorEinrichtung.liesMich(h);
        assertTrue(a.gibtEs("Meine Akte/" + Hauptordner.LIES_MICH));
        assertTrue(a.gibtEs("Meine Akte/" + TresorOrdner.KOPF));
    }
}
