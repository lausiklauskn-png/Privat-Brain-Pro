# Private Brain Pro — Name ab Version .13

Auf Nutzerwunsch heißt die Android-App ab jetzt **Private Brain Pro**, ohne
„Test“. Das gilt für Startsymbol, Fenstertitel, Überschrift und Einstellungen.
Auch die Versionsangabe hat keinen `-test`-Zusatz mehr. Fehlermeldungen und
Größenhinweise bezeichnen die App ebenfalls ohne „Test“, in allen vier Sprachen.

## Installation und bestehende Daten

Die installierbare Version bleibt in derselben technischen Update-Linie:
`de.familyprojekt.privatebrain.pro.preview`, gleiches Signierzertifikat.
Version .13 heißt technisch `0.1.0-preview.13`, `versionCode` 13. „preview“ bleibt
in Paketkennung, Download und Updatekanal erhalten. Eine andere Paketkennung
würde eine zweite App mit getrennten Daten erzeugen und den Google-Client ändern.
Die APK über die bestehende App installieren, nicht vorher deinstallieren.

Die Namensänderung ändert weder Konten noch Entwürfe, Originaldateien oder
Mail-Adressen. Der PWA-Quellstand und das andere PWA-Repository bleiben unverändert.
Die Pro-Überschrift wird erst beim Packen der nativen App eingesetzt.

## Google — vorhandene Registrierung weiterverwenden

Der Google-Zustimmungsbildschirm zeigt in den Nutzerbildern bereits
**Private Brain Pro**. Falls dort doch noch „Test“ erscheint:

1. Im vorhandenen Google-Cloud-Projekt **Google Auth Platform → Branding** öffnen.
2. Als **Anwendungsname** genau **Private Brain Pro** eintragen und speichern.
3. Die neue APK installieren und die Anmeldung erneut öffnen.

Kein neues Projekt oder neuer OAuth-Client nötig: Paketkennung und SHA-1 des
Android-Zertifikats bleiben gleich. Der frei wählbare Name unter **Clients** ist
nur für die Verwaltung; er kann ebenfalls Private Brain Pro heißen. Der native
Google-Kontendialog kann den installierten Android-Appnamen anzeigen — diesen
ändert die neue APK.

**Googles Veröffentlichungsstatus „Test“ ist davon unabhängig.** Das bloße Umbenennen
veröffentlicht oder verifiziert die Google-Anwendung nicht und entfernt keine
Testnutzer. Die vorhandene Freigabe und den akzeptierten Testnutzereintrag behalten.
Eine spätere Umstellung auf Produktion separat durchführen; hier ist sie nicht
Bestandteil der Namensänderung. Ebenso bleibt die Veröffentlichung über GitHub,
ohne Play-Store-Veröffentlichung. Googlemail/Gmail bleiben Aliase desselben Kontos;
keine neue E-Mail-Adresse anlegen und das vorhandene Konto nicht entfernen.

## Prüfung

Die vorhandenen Browser- und Android-Startprüfungen kontrollieren jetzt den
Appnamen und die Pro-Überschrift. Kein zusätzlicher Testfall für die Textänderung.
Build-, Signatur- und tatsächliche Update-Nachweise:
[Android-Prüfstand](PRUEFSTAND-ANDROID.md#veröffentlichte-version-13--2026-10-20).

[APK .13](https://github.com/lausiklauskn-png/Privat-Brain-Pro/releases/download/v0.1.0-preview.13/Private-Brain-Pro-0.1.0-preview.13.apk) ist veröffentlicht und als Update über .12 geprüft.
