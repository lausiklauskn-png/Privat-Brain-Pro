package de.familyprojekt.privatebrain.pro;

import android.content.Context;
import android.content.SharedPreferences;
import android.net.Uri;
import android.provider.DocumentsContract;
import android.security.keystore.KeyGenParameterSpec;
import android.security.keystore.KeyProperties;
import android.util.Base64;
import de.familyprojekt.tresor.Eintrag;
import de.familyprojekt.tresor.SafAblage;
import de.familyprojekt.tresor.TresorOrdner;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.security.KeyStore;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Iterator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import javax.crypto.Cipher;
import javax.crypto.KeyGenerator;
import javax.crypto.SecretKey;
import javax.crypto.spec.GCMParameterSpec;
import org.json.JSONArray;
import org.json.JSONObject;

/**
 * Geräteseite des gemeinsamen Tresorordners für Private Brain Pro (Schritt D2, wie D1 in Workflow PDF Pro). Merkt die Ordnerfreigabe und auf Wunsch
 * den Hauptschlüssel (Android-Schlüsselspeicher). Die Ordnerschicht ist das byte-gleiche Paket de.familyprojekt.tresor,
 * die Regeln des Einzugs stehen in {@link TresorEinzug}. Eine Instanz für Speicherort- und Mail-Plugin; alles synchronisiert.
 */
final class ProTresorordner {
    private static final String PREFS = "pb-tresorordner-v1", ALIAS = "private-brain-pro-tresorordner-merken-v1";
    private static ProTresorordner instance;
    static synchronized ProTresorordner get(Context context) { if (instance == null) instance = new ProTresorordner(context); return instance; }
    private final Context context;
    private SafAblage ablage;
    private TresorOrdner offen;
    // Von Hand gesperrt (Tablet-Probe 2026-10-28: „Sperren“ öffnete sofort wieder, weil zustand() den gemerkten Schlüssel nahm).
    // Bis zum nächsten Entsperren von Hand oder App-Neustart öffnet der gemerkte Schlüssel nicht von selbst.
    private boolean vonHandGesperrt;

    private ProTresorordner(Context context) { this.context = context.getApplicationContext(); }

    private SharedPreferences prefs() { return context.getSharedPreferences(PREFS, Context.MODE_PRIVATE); }
    synchronized boolean gewaehlt() { return prefs().contains("baum"); }
    synchronized boolean istOffen() { return offen != null; }
    /** Der Nutzer will ausdrücklich entsperren oder einziehen: der gemerkte Schlüssel darf wieder öffnen. */
    synchronized void entsperrenGewuenscht() { vonHandGesperrt = false; }
    synchronized boolean vonHandGesperrt() { return vonHandGesperrt; }
    /** Ganzer Pfad des Tresorordners im Speicher (Leitfaden § 5), z. B. „Privat Brain Pro Hauptablageordner“. */
    synchronized String pfad() {
        String b = prefs().getString("baum", null); if (b == null) return "";
        try { String id = DocumentsContract.getTreeDocumentId(Uri.parse(b)); return id.contains(":") ? id.substring(id.indexOf(':') + 1) : id; }
        catch (Exception e) { return ""; }
    }
    /** Dokument-Adresse des Tresorordners für „In Dateien öffnen“; null ohne gewählten Ordner. */
    synchronized Uri ordnerUri() {
        String b = prefs().getString("baum", null); if (b == null) return null;
        Uri t = Uri.parse(b); return DocumentsContract.buildDocumentUriUsingTree(t, DocumentsContract.getTreeDocumentId(t));
    }

    private SafAblage ablage() throws IOException {
        if (ablage != null) return ablage;
        String baum = prefs().getString("baum", null);
        if (baum == null) throw new IOException("TRESOR_KEIN_ORDNER");
        ablage = new SafAblage(context.getContentResolver(), Uri.parse(baum));
        return ablage;
    }

    /** Prüft einen frisch gewählten Ordner, ohne ihn zu übernehmen. */
    synchronized String pruefen(Uri baum, String tresorId) throws IOException {
        return TresorEinzug.pruefen(new SafAblage(context.getContentResolver(), baum), tresorId);
    }

    synchronized void baumSetzen(Uri baum) throws IOException {
        schliessen();
        String name = baum.getLastPathSegment() == null ? "" : baum.getLastPathSegment();
        if (name.contains(":")) name = name.substring(name.indexOf(':') + 1);
        // Ein anderer Ordner: ein gemerkter Schlüssel gehört zum alten und wird vergessen.
        if (!prefs().edit().putString("baum", baum.toString()).putString("name", name).remove("merken").remove("kennung").commit()) throw new IOException("TRESOR_NICHT_VERFUEGBAR");
        ablage = null;
    }

    synchronized boolean vorhanden() throws IOException { return TresorOrdner.vorhanden(ablage()); }

    /** Passt der gespeicherte Ordner (noch) zum entsperrten App-Tresor? */
    synchronized String pruefung(String tresorId) throws IOException { return TresorEinzug.pruefen(ablage(), tresorId); }

    /** Gemerkten Hauptschlüssel benutzen, falls vorhanden und passend. */
    synchronized boolean gemerktEntsperren() {
        if (offen != null) return true;
        if (!prefs().contains("merken")) return false;
        byte[] haupt = null;
        try {
            SafAblage a = ablage();
            String id = TresorOrdner.kennung(a);
            if (!id.equals(prefs().getString("kennung", ""))) return false;
            byte[] wert = Base64.decode(prefs().getString("merken", ""), Base64.NO_WRAP);
            SecretKey k = geraeteSchluessel(false);
            if (k == null || wert.length != 12 + 32 + 16) return false;
            Cipher c = Cipher.getInstance("AES/GCM/NoPadding");
            c.init(Cipher.DECRYPT_MODE, k, new GCMParameterSpec(128, wert, 0, 12));
            c.updateAAD(geraetAad(id));
            haupt = c.doFinal(wert, 12, wert.length - 12);
            offen = TresorOrdner.mitHauptschluessel(a, TresorEinzug.APP, haupt);
            return true;
        } catch (Exception e) {
            offen = null; // passt nicht mehr (Passwort/Ersatz neu, anderer Ordner): von Hand entsperren
            return false;
        } finally { if (haupt != null) Arrays.fill(haupt, (byte) 0); }
    }

    /** Mit Passwort anlegen oder öffnen, dann den App-Tresor einziehen. */
    synchronized void mitPasswort(CharSequence passwort, boolean anlegen, boolean merken, Vault vault) throws Exception {
        if (!"PASST".equals(pruefung(vault.tresorId()))) throw new IOException("TRESOR_ORDNER_PASST_NICHT");
        TresorOrdner t = anlegen ? TresorOrdner.anlegen(ablage(), TresorEinzug.APP, passwort) : TresorOrdner.oeffnen(ablage(), TresorEinzug.APP, passwort);
        schliessen();
        vonHandGesperrt = false;
        offen = t;
        if (merken) merken(t);
        einziehen(vault);
    }

    /** Einzug bei offenem Tresorordner (wiederholt ist kein Fehler; fremder Schlüssel im Fach: TRESOR_FACH_BELEGT). */
    synchronized void einziehen(Vault vault) throws Exception {
        if (offen == null) throw new IOException("TRESOR_GESPERRT");
        if (!"PASST".equals(pruefung(vault.tresorId()))) throw new IOException("TRESOR_ORDNER_PASST_NICHT");
        byte[] k = vault.tresorSchluessel();
        try { TresorEinzug.einziehen(offen, k); } finally { Arrays.fill(k, (byte) 0); }
    }

    synchronized JSONObject zustand(Vault vault) throws Exception {
        SharedPreferences p = prefs();
        JSONObject z = new JSONObject().put("gewaehlt", p.contains("baum")).put("ordner", p.getString("name", "")).put("pfad", pfad()).put("gemerkt", p.contains("merken"));
        z.put("offen", offen != null).put("eingezogen", false);
        if (!p.contains("baum")) return z;
        try {
            SafAblage a = ablage();
            boolean da = TresorOrdner.vorhanden(a);
            z.put("erreichbar", true).put("vorhanden", da);
            if (vault != null && vault.configured()) z.put("pruefung", TresorEinzug.pruefen(a, vault.tresorId()));
            if (da) { z.put("kennung", TresorOrdner.kennung(a)); if (!vonHandGesperrt) gemerktEntsperren(); }
            z.put("offen", offen != null);
            if (offen != null) {
                z.put("eingezogen", TresorEinzug.eingezogen(offen));
                z.put("eintraege", TresorEinzug.eingezogen(offen) ? offen.eigenesVerzeichnis(TresorEinzug.FACH).size() : 0);
            }
        } catch (IOException e) { z.put("erreichbar", false).put("problem", e.getMessage()); }
        return z;
    }

    /** Inhaltsverzeichnis des eigenen Fachs aus den Zeilen der Bibliothek (nur bei Änderung neu). */
    synchronized JSONObject verzeichnis(JSONArray zeilen, Vault vault) throws Exception {
        if (offen == null && (vonHandGesperrt || !gemerktEntsperren())) throw new IOException("TRESOR_GESPERRT");
        if (!TresorEinzug.eingezogen(offen)) throw new IOException("TRESOR_FACH_FEHLT");
        if (vault != null && !"PASST".equals(pruefung(vault.tresorId()))) throw new IOException("TRESOR_ORDNER_PASST_NICHT");
        List<Map<String, Object>> roh = new ArrayList<>();
        for (int i = 0; i < zeilen.length(); i++) roh.add(map(zeilen.getJSONObject(i)));
        List<Eintrag> neu = TresorEinzug.eintraege(roh);
        boolean geschrieben = TresorEinzug.schreibenWennGeaendert(offen, neu);
        return new JSONObject().put("geschrieben", geschrieben).put("eintraege", neu.size());
    }

    /** Rechnungsmail (.eml) ins Übergabefach „Eingang-BookLedgerPro/Mails/“ legen. */
    synchronized JSONObject mailAblegen(byte[] eml, String name, long datum, String auszug, Vault vault) throws Exception {
        if (offen == null && (vonHandGesperrt || !gemerktEntsperren())) throw new IOException("TRESOR_GESPERRT");
        if (vault != null && !"PASST".equals(pruefung(vault.tresorId()))) throw new IOException("TRESOR_ORDNER_PASST_NICHT");
        Eintrag e = TresorEinzug.mailAblegen(offen, name, datum, new java.io.ByteArrayInputStream(eml), auszug);
        return new JSONObject(e.alsMap());
    }

    private static Map<String, Object> map(JSONObject o) {
        Map<String, Object> m = new LinkedHashMap<>();
        for (Iterator<String> k = o.keys(); k.hasNext(); ) {
            String s = k.next(); Object v = o.opt(s);
            if (v instanceof Number) v = ((Number) v).longValue();
            if (v instanceof String || v instanceof Long) m.put(s, v);
        }
        return m;
    }

    synchronized void sperren(boolean vergessen) {
        schliessen();
        vonHandGesperrt = true;
        if (vergessen) prefs().edit().remove("merken").remove("kennung").commit();
    }

    synchronized void schliessen() { if (offen != null) offen.close(); offen = null; }

    // ---------- Hauptschlüssel im Android-Schlüsselspeicher (wie BookLedgerPro, eigener Alias) ----------
    private SecretKey geraeteSchluessel(boolean anlegen) throws Exception {
        KeyStore ks = KeyStore.getInstance("AndroidKeyStore"); ks.load(null);
        if (ks.containsAlias(ALIAS)) return (SecretKey) ks.getKey(ALIAS, null);
        if (!anlegen) return null;
        KeyGenerator g = KeyGenerator.getInstance(KeyProperties.KEY_ALGORITHM_AES, "AndroidKeyStore");
        g.init(new KeyGenParameterSpec.Builder(ALIAS, KeyProperties.PURPOSE_ENCRYPT | KeyProperties.PURPOSE_DECRYPT)
            .setBlockModes(KeyProperties.BLOCK_MODE_GCM).setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_NONE).setKeySize(256).build());
        return g.generateKey();
    }
    private static byte[] geraetAad(String id) { return ("familyprojekt-tresorordner|" + id + "|geraet|" + TresorEinzug.APP).getBytes(StandardCharsets.UTF_8); }
    private void merken(TresorOrdner t) throws Exception {
        byte[] haupt = t.hauptschluesselKopie();
        try {
            Cipher c = Cipher.getInstance("AES/GCM/NoPadding");
            c.init(Cipher.ENCRYPT_MODE, geraeteSchluessel(true));
            c.updateAAD(geraetAad(t.id()));
            byte[] zu = c.doFinal(haupt), wert = new byte[12 + zu.length];
            System.arraycopy(c.getIV(), 0, wert, 0, 12); System.arraycopy(zu, 0, wert, 12, zu.length);
            if (!prefs().edit().putString("merken", Base64.encodeToString(wert, Base64.NO_WRAP)).putString("kennung", t.id()).commit()) throw new IOException("TRESOR_NICHT_VERFUEGBAR");
        } finally { Arrays.fill(haupt, (byte) 0); }
    }
}
