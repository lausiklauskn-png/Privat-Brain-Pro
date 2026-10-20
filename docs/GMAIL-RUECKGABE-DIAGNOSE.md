# Google-Rückgabe und gezielte Diagnose — 2026-10-20

## Tatsächlicher Nutzerstand

Der Nutzer hat im Tablet-Browser inzwischen ein eigenes Google-Cloud-Projekt,
die externe OAuth-Grundkonfiguration und einen Android-Client für Paket und
Vorschau-Zertifikat angelegt. Die Testnutzerliste zeigt ein akzeptiertes Konto
mit Gmail-Domain; der zusätzliche Googlemail-Eintrag wurde von der Konsole
abgelehnt. Die Konsole zeigt Mail-Scope, userinfo.email und openid. Ob alle
Änderungen dauerhaft gespeichert sind, bleibt bei einem neuen 403 zu prüfen.

Ein vorheriger Google-Dialog lieferte ausdrücklich 403/access_denied mit dem
Hinweis auf Testnutzer. Der spätere App-Screenshot zeigt den neuen Wortlaut aus
Vorschau .9, aber nur GMAIL_AUTH_REQUIRED. Er beweist weiterhin keinen
Gmail-IMAP-/SMTP-Zugang. Keine Nutzeradressen, IP-Adressen, Client-IDs oder
Zugriffsfreigaben aus den Bildern in das Repository übernehmen.

## Reparatur und Grenze der Diagnose

Die bisherige App griff nach Zustimmung unmittelbar auf
`AuthorizationResult.toGoogleSignInAccount().getEmail()` zu. Das tatsächlich
installierte SDK-Datenmodell erlaubt ein fehlendes Legacy-Konto auch bei einem
Ergebnis mit Access-Token und Scopes. Ein solcher Fall endete bisher in der
allgemeinen Fehlermeldung. Ein Instrumentierungstest erzeugt diesen Zustand mit
dem echten SDK-Ergebnistyp und prüft den neuen Rückweg. Dass genau dies am
Nutzergerät geschieht, ist damit noch nicht nachgewiesen.

Fehlen Legacy-Kontodaten, fragt ausschließlich der native Teil mit dem erhaltenen
Token Googles festen HTTPS-Userinfo-Endpunkt ab:
`https://www.googleapis.com/oauth2/v2/userinfo`. Es gibt keine frei wählbare URL,
keine Weiterleitung, keine Änderung der TLS-/Hostnamenprüfung und keine Token-
Übergabe an JavaScript. Antworten sind auf 64 KiB und Zeitlimits beschränkt;
die Adresse muss vorhanden, syntaktisch gültig und von Google ausdrücklich als
bestätigt markiert sein. 401 verwirft die erhaltene Freigabe. Keine automatischen
Versandwiederholungen. Die Abfrage läuft außerhalb des UI-Threads; späte Antworten
nach Aktivitätsende werden ignoriert.

Gmail und Googlemail werden für dieselbe Adresse als Domain-Aliase verglichen.
Andere Konten, Plus-Adressen und fremde Domains werden nicht zusammengelegt.
Gmail-Anmeldung und kurzlebiger RAM-Cache nutzen die kanonische Adresse;
wiederholtes Verbinden erhält vorhandene Kennung und Entwürfe. Telekom und
Hetzner behalten ihren Passwort-/Adressweg. Keine Änderung des Kontenschemas.

Die vier UI-Sprachen unterscheiden jetzt fehlendes Token, fehlenden Mail-Scope,
noch nötige Zustimmung, nicht bestätigbare Kontodaten, Kontowechsel und
abgelehnte IMAP-/SMTP-Anmeldung. Der sichtbare stabile Fehlercode enthält keine
Anbieterantworten, Mail-Adressen oder Zugangsdaten. Unbekannte SDK-Fehler geben
nur den numerischen Status an. Eine pauschale Aufforderung zur Cloud-Einrichtung
ist keine Diagnose für jede dieser unterschiedlichen Fehlerstellen.

## Prüfungen und nächster Geräteversuch

Drei zusätzliche Android-Fälle prüfen SDK-Rückgabe ohne Legacy-Konto, Alias-
Zuordnung und Kontentrennung, abgelehnte unvollständige Grants, feste HTTPS-URL,
keine Redirects, ungeprüfte/überlange Antworten und sichere vier Sprachtexte.
Der bestehende Wiederanmeldungstest verlangt außerdem denselben Kontenschlüssel
und erhaltene Entwürfe bei Wechsel zwischen Gmail-/Googlemail-Domain.

Vorschau .10 ist nach erfolgreicher vollständiger CI mit 26 nativen Fällen und
signierter Updateprobe veröffentlicht. Nachweise im
[Android-Prüfstand](PRUEFSTAND-ANDROID.md#veröffentlichte-vorschau-10--2026-10-20). Am Gerät einmal erneut anmelden. Bei erneutem Fehler genügt ein Foto
des neuen stabilen Fehlercodes, niemals Tokens, Passwörter oder Gerätecodes.
Ein echter Google-Login sowie echter Gmail-Empfang und Versand bleiben bis zur
entsprechenden Geräteprüfung offen. Keine öffentliche Google-Prüfung oder
Store-Veröffentlichung aus der privaten Testkonfiguration ableiten.
