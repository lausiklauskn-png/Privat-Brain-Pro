# Originalprogramme und Freischaltung für .34

Stand 24.10.2026: **als .34 veröffentlicht**.
[Signierte Android-Update-APK](https://github.com/lausiklauskn-png/Privat-Brain-Pro/releases/download/v1.0.0-preview.34/Private-Brain-Pro-1.0.0-preview.34.apk).
Die Zugänge ergänzen den [Bedienungsauftrag für .34](SUCHE-34.md).

## Was die vier Zugänge öffnen

| Werkzeug | Vorgesehener Weg nach Freischaltung |
|---|---|
| Workflow PDF Pro | Installiertes Android-Originalprogramm mit fester Paketkennung `de.familyprojekt.workflowpdf.pro`. Fehlt es, erscheint ein ausdrücklich anzuklickender Installationsknopf zur offiziellen [APK v1.0.3](https://github.com/lausiklauskn-png/Workflow-PDF-Pro/releases/download/v1.0.3/Workflow-PDF-Pro-1.0.3.apk). Unter Windows führt der ausdrückliche Downloadweg zur [offiziellen Release-Seite](https://github.com/lausiklauskn-png/Workflow-PDF-Pro/releases). |
| Kim-Sync | Original-Webangebot: <https://lausiklauskn-png.github.io/Kim-sync/> |
| Datei-Post | Original-Webangebot: <https://dateien.family-projekt.de/> |
| BookLedgerPro | Original-Webangebot: <https://lausiklauskn-png.github.io/BookLedgerPro/> |

Die Webangebote werden im Browser geöffnet. Workflow PDF Pro wird als native
Anwendung gestartet; die drei anderen Einträge werden nicht als vollständig
mitgelieferte native Programme bezeichnet. Private Programmquellen werden
für diese vier Verweise nicht in Private Brain Pro kopiert. Die beiden
bereits mitgelieferten lokalen Werkzeuge Pinnwand/Kimboard und Suche/Kimseek
behalten ihre bisherigen Wege.

## Grenze der Freischaltung und Verschlüsselung

`PBLicense` prüft die Menüzugänge, bevor ein externes Ziel geöffnet wird. Die
Freischaltung schützt diese Wege in Private Brain Pro. Sie sperrt weder eine
öffentlich erreichbare Webseite auf deren Server noch den Quelltext oder eine
separat installierte Anwendung. Es gibt keine neue AES-Verschlüsselung dieser
externen Programme oder Webseiten in Private Brain Pro.

Der bestehende geheime Herausgeber-Schlüssel bleibt mit dem Studio-Passwort
über PBKDF2 und AES-256-GCM auf dem Herausgebergerät verschlüsselt. Freischaltcodes
werden mit Schnorr signiert und anhand vertrauenswürdiger öffentlicher Schlüssel
geprüft. Das Studio bleibt hinter langem Druck auf „©“ in den Einstellungen;
Studio-Schlüssel und Verfahren werden hierfür nicht neu angelegt oder ersetzt.
Die Werkzeugliste umfasst zehn IDs, darunter die neuen `workflowpdfpro` und
`bookledgerpro`.

`native/license-keys.json` enthält derzeit **keinen** veröffentlichten
Herausgeber-Schlüssel. Die vorhandene lokale Vorschau vertraut deshalb nur dem
eigenen Studio-Schlüssel desselben Geräts. Damit Käufergeräte Codes erkennen,
muss Klaus' **öffentlicher** Herausgeber-Schlüssel in die App-Konfiguration
aufgenommen werden. Der geheime Schlüssel bleibt auf seinem Gerät. Diese
öffentliche Konfiguration ist noch offen; keine geräteübergreifend fertige
Käuferfreischaltung behaupten.

## Nachweise und Grenzen

- Die Quellen `native/native-tools.js` und `native/native-license.js` enthalten
  die benannten Ziele und vorgeschaltete Freischaltprüfung. 74 Werkzeug-
  Browserfälle bestanden; der Browser verwendet dabei nachgebildete Brücken.
- `ProLinksPlugin.openApplication` akzeptiert ausschließlich die benannte
  Werkzeug-ID und startet nur die festgelegte Android-Paketkennung. Fehlende
  Installation führt zu einem Ergebnis für die Oberfläche, nicht zu einem
  ungefragten Download. Der neue native Launcher-Test prüft den fehlenden Fall
  und acht ungültige Aufrufe ohne externen Start. Zusammen mit den drei
  Tests der Ordnerbereinigung bestanden 60 native Fälle ohne Fehler/Skips
  auf main `1fe0f684ec3b6c7e645c55387ec698f8e96204fb`, Job `121014024355`.
  Ein tatsächlicher Start einer installierten Fremd-App ist damit nicht belegt.
- Quellzuordnung und erfolgreiche Pages-Bereitstellung der Webangebote sind
  belegt. Direkte HTTPS-Proben aus dieser Umgebung wurden durch die Netzrichtlinie
  mit `CONNECT 403` abgewiesen. Aktuelle Erreichbarkeit im Nutzerbrowser wird
  damit nicht als geprüft ausgegeben.
- Android-/Windows-main und Signierung erfolgreich; Release [40142276521](https://github.com/lausiklauskn-png/Privat-Brain-Pro/actions/runs/40142276521)
  einschließlich signiertem Update .33 → .34 und unabhängiger öffentlicher
  Downloadprüfung abgeschlossen.
  [Download- und Quellnachweis](android-preview34-pruefung.json).

Das neue BookLedgerPro-Liniensymbol ist eine eigene Zeichnung im Pro-Repository.
Workflow PDF Pro nutzt das vorhandene Workflow-PDF-Symbol; Herkunft unter
[Werkzeugsymbole](../../../native/tool-icons/README.md).
