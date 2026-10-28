package de.familyprojekt.privatebrain.pro;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.concurrent.TimeUnit;
import org.json.JSONArray;
import org.json.JSONObject;

/** Gerätecheck vor dem Laden eines Modells (Klaus 2026-10-28). Nur lesen: Arbeitsspeicher, Prozessor, Grafik, freier Platz.
 *  Die gebündelte Laufzeit hat kein java.management; Speicher, Prozessor und Grafik kommen deshalb einmal aus CIM
 *  (PowerShell, ohne Profil, ohne Netz, 8 s Höchstdauer). Fehlt etwas, bleibt das Feld leer — die Seite sagt es. */
final class DesktopGeraet {
    private DesktopGeraet() {}
    static final String SKRIPT = String.join(";",
        "$ErrorActionPreference='SilentlyContinue'",
        "$c=Get-CimInstance Win32_ComputerSystem",
        "$p=Get-CimInstance Win32_Processor | Select-Object -First 1",
        "$g=@(Get-CimInstance Win32_VideoController | ForEach-Object { [pscustomobject]@{name=$_.Name;ram=[int64]$_.AdapterRAM} })",
        // AdapterRAM ist bei 4 GB gedeckelt; der genaue Wert steht beim Treiber (qwMemorySize).
        "$q=@(Get-ItemProperty 'HKLM:\\SYSTEM\\CurrentControlSet\\Control\\Class\\{4d36e968-e325-11ce-bfc1-08002be10318}\\0*' | Where-Object { $_.'HardwareInformation.qwMemorySize' } | ForEach-Object { [pscustomobject]@{name=$_.DriverDesc;ram=[int64]$_.'HardwareInformation.qwMemorySize'} })",
        "[pscustomobject]@{ram=[int64]$c.TotalPhysicalMemory;cpu=$p.Name;cores=[int]$p.NumberOfLogicalProcessors;gpu=$g;gpuExact=$q} | ConvertTo-Json -Compress -Depth 4");

    static JSONObject measure(Path data) {
        JSONObject r = new JSONObject().put("platform", "windows").put("cores", Runtime.getRuntime().availableProcessors());
        try { r.put("freeBytes", Files.getFileStore(data).getUsableSpace()); } catch (Exception unbekannt) { /* bleibt leer */ }
        if (!System.getProperty("os.name", "").toLowerCase().contains("windows")) return r;
        Path aus = null;
        try {
            aus = Files.createTempFile("pb-geraet", ".json");
            Process p = new ProcessBuilder("powershell.exe", "-NoProfile", "-NonInteractive", "-ExecutionPolicy", "Bypass", "-Command", SKRIPT)
                .redirectError(ProcessBuilder.Redirect.DISCARD).redirectOutput(aus.toFile()).start();
            p.getOutputStream().close();
            if (!p.waitFor(8, TimeUnit.SECONDS)) { p.destroyForcibly(); return r; }
            if (Files.size(aus) > 64 * 1024) return r;
            merge(r, new JSONObject(new String(Files.readAllBytes(aus), java.nio.charset.StandardCharsets.ISO_8859_1).trim()));   // Konsolen-Codepage: nie an Zeichen scheitern
        } catch (Exception ignored) { /* ohne CIM: nur Kerne und Platz */ }
        finally { if (aus != null) try { Files.deleteIfExists(aus); } catch (Exception egal) { /* temp */ } }
        return r;
    }

    /** CIM-Antwort in die gemeinsame Form (ramBytes, cpu, cores, gpu[{name, vramBytes}]); exakter Grafikspeicher gewinnt. */
    static void merge(JSONObject r, JSONObject cim) {
        if (cim.optLong("ram", 0) > 0) r.put("ramBytes", cim.optLong("ram"));
        if (!cim.optString("cpu", "").isBlank()) r.put("cpu", cim.optString("cpu").trim());
        if (cim.optInt("cores", 0) > 0) r.put("cores", cim.optInt("cores"));
        JSONArray gpu = new JSONArray(), basis = liste(cim.opt("gpu")), genau = liste(cim.opt("gpuExact"));
        for (int i = 0; i < basis.length(); i++) {
            JSONObject g = basis.getJSONObject(i); String name = g.optString("name", "").trim(); if (name.isEmpty()) continue;
            long ram = g.optLong("ram", 0);
            for (int j = 0; j < genau.length(); j++) if (name.equals(genau.getJSONObject(j).optString("name", "").trim())) ram = Math.max(ram, genau.getJSONObject(j).optLong("ram", 0));
            gpu.put(new JSONObject().put("name", name).put("vramBytes", ram));
        }
        r.put("gpu", gpu);
    }
    private static JSONArray liste(Object o) {
        if (o instanceof JSONArray a) return a;
        JSONArray a = new JSONArray(); if (o instanceof JSONObject j) a.put(j); return a;
    }
}
