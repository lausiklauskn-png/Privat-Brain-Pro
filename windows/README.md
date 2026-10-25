# Private Brain Pro für Windows 1.0.36

[Windows-x64-Setup 1.0.36 herunterladen](https://github.com/lausiklauskn-png/Privat-Brain-Pro/releases/download/windows-v1.0.36/Private-Brain-Pro-Windows-1.0.36-x64-setup.exe). Über die vorhandene
Installation installieren; die bisherige App nicht deinstallieren.
Gemeinsame Android-/Windows-Quelle `a1bd98f40b0186c5a9a148dbd04d19979e6262c4`, PR #82 übernommen.
[Prüfstand](../docs/BAUSTAND-WINDOWS.md) ·
[Downloadnachweis](../docs/design/umbau-2026-10-24/windows-1.0.36-pruefung.json).

Tauri 2/WebView2 mit derselben lokalen Pro-Oberfläche wie Android. Der Mail-,
MIME- und PBV1-Kern wird beim Bau aus den Android-Quellen übernommen. Der
mitgelieferte Java-21-Laufzeitteil braucht keine Installation durch den Nutzer.
Windows speichert Gerätegeheimnisse mit DPAPI; der portable Ordner bleibt mit
dem Benutzerpasswort verschlüsselt. Keine Android-Schlüssel werden übernommen.

`docs/BAUSTAND-WINDOWS.md` nennt den belegten Stand und die Grenzen. Die CI
prüft die installierte App, Neustart, Daten nach Neuinstallation, das reale
Offline-Modell und die Abbruchwege. Danach baut und installiert sie einen
zusätzlichen Auslieferungsbau ohne Prüfzugang. Ausschließlich dessen Artefakt
`windows-installer` wird zur Veröffentlichung verwendet; es enthält Prüfsummen
und den genauen Quellstand. Der abgenommene Installer von 1.0.36 ist öffentlich
verfügbar und wurde unabhängig gegen diese Belege geprüft.

Kern prüfen: `node windows/engine/test.mjs` (Java 21, Node 24).
Auf Windows: `npm ci --prefix windows`, `node windows/tools/prepare-runtime.mjs`,
`npm run tauri --prefix windows -- build --bundles nsis`.

Die öffentliche Gmail-Client-ID gehört zur App. Der Loopback-Anmeldeweg nutzt
den Standardbrowser und PKCE S256; Tokens verlassen den nativen Gerätespeicher
nicht. Live-Anmeldung und Google-Freigabe stehen noch aus. Technischer Vertrag:
https://developers.google.com/identity/protocols/oauth2/native-app

Die beauftragte Veröffentlichung und Übernahme in main sind abgeschlossen.
Das unsignierte NSIS-Setup pro Benutzer bleibt der beauftragte Auslieferungsweg.
