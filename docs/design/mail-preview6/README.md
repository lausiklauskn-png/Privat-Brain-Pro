# Gleiches Postfach vor und nach dem Verbinden

Nutzerauftrag 2026-10-20: Die erste, lokale Postfachansicht ist auch nach der
Kontoaktivierung verbindlich. Kein abweichendes technisches INBOX-/Trash-Menü.
Ausgangsstand: e2d1cdca5d803a2fe86400ac9e7111b9006ad47d (Vorschau .5).

Gemeinsame Beschriftungen und Ordnerknöpfe aus `PBMailUI`: Posteingang, Entwürfe,
Postausgang, Gesendet, Archiv, Spam, Papierkorb, Exportiert – gleiche Symbole und
Reihenfolge in DE/EN/RU/PL. Titel Postfach, petrolfarbener Verfassen-Knopf,
Mails importieren, Suchfeld und Auswahl-/Verschiebeleiste bleiben vorhanden.
Kontoauswahl, Aktualisieren und Kontowerkzeuge stehen darüber. Eigene Anbieter-
ordner erscheinen zusätzlich mit unverändertem Namen.

Anbieterrollen haben Vorrang, danach eindeutige bekannte Namenszuordnungen.
Mehrdeutige Ordner werden nicht stillschweigend als Standardordner verwendet.
Intern bleiben Kontokennung, IMAP-Pfad, UID und UIDVALIDITY unverändert. Die
Namenszuordnung gewährt insbesondere keine zusätzlichen Löschrechte.

Entwürfe zeigen lokale verschlüsselte Entwürfe zusätzlich zu vorhandenen
Anbieterentwürfen. Postausgang zeigt echte Versandversuche auf diesem Gerät;
unklarer Versand bleibt gesperrt, kein automatischer Neuversand. Gesendet zeigt
vorrangig den Anbieterordner, sonst bestätigte lokale Versandnachweise.
Exportiert enthält die bestehenden lokalen Katalogexporte; beim Öffnen eines
solchen Eintrags wird dessen bestehende lokale Postfachansicht verwendet.
Mailimport bleibt lokaler Import, kein automatisches Hochladen zum Anbieter.

Fehlende Anbieterordner werden nicht automatisch angelegt. Unbekannte
Nachrichtenzahlen stehen als „–“, nach dem Öffnen wird die tatsächliche gesamte
Nachrichtenzahl angezeigt. Bei Geräteentwürfen neben einer noch unbekannten
Anbieterzahl kennzeichnet „+“ zusätzliche, noch nicht gezählte Anbieternachrichten.
Auswählen und Verschieben arbeiten auf den geladenen Anbieternachrichten.
Lokale Entwürfe/Versandnachweise werden nicht als IMAP-Nachrichten vorgetäuscht.

72 native Oberflächenproben bestanden: gleiche Ordner/Primärknopfstile vor/nach
Aktivierung, Rohpfade bei übersetzten Namen, getrennte Anbieterordner `@not-virtual`/`@outbox`,
UID-gebundene Sammelaktion, fehlgeschlagener Ordner- oder Nachrichtenabruf ohne
veraltete Aktionen, Kontenwechsel
mit geleerter Auswahl und getrenntem Postausgang, vier Sprachen, HTML/CID-
Originalansicht und 320/768/1280/1920 Pixel. Vorher/Nachher enthält ausschließlich
synthetische Konten/Nachrichten. Keine Nutzerbilder oder persönlichen Mails in Git.

Erneute Aufnahmen: `PB_CAPTURE_DESIGN=1 node tools/native/test-mail-device.mjs`
nach `npm run sync:android`. Geräteprüfung der fertigen APK steht zusätzlich aus.
