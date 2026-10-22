# Private Brain Pro für Windows — in Arbeit

Tauri 2/WebView2 mit derselben lokalen Pro-Oberfläche wie Android. Der Mail-,
MIME- und PBV1-Kern wird beim Bau aus den Android-Quellen übernommen. Der
mitgelieferte Java-21-Laufzeitteil braucht keine Installation durch den Nutzer.
Windows speichert Gerätegeheimnisse mit DPAPI; der portable Ordner bleibt mit
dem Benutzerpasswort verschlüsselt. Keine Android-Schlüssel werden übernommen.

Noch kein abgenommener Windows-Installer. `docs/BAUSTAND-WINDOWS.md` nennt den
belegten Stand und die offenen Adapter. Ein grüner erster Bau ersetzt die
Prüfung der installierten App nicht.

Kern prüfen: `node windows/engine/test.mjs` (Java 21, Node 24).
Auf Windows: `npm ci --prefix windows`, `node windows/tools/prepare-runtime.mjs`,
`npm run tauri --prefix windows -- build --bundles nsis`.

Die öffentliche Gmail-Client-ID gehört zur App. Der Loopback-Anmeldeweg nutzt
den Standardbrowser und PKCE S256; Tokens verlassen den nativen Gerätespeicher
nicht. Live-Anmeldung und Google-Freigabe stehen noch aus. Technischer Vertrag:
https://developers.google.com/identity/protocols/oauth2/native-app

Veröffentlichen/Übernehmen in main bleibt bis zu Klaus' ausdrücklicher Freigabe
offen. Unsigniertes NSIS-Setup pro Benutzer ist der beauftragte Auslieferungsweg.
