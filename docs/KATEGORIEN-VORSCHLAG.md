# Kategorien per Vorschlag (A4, 2026-10-21)

Aus dem [Plan „Ordnen, Sortieren, Suchen“](PLAN_2026-10-21_ordnen-sortieren-suchen.md), Klaus' Entscheidung:
**Vorschlag, ein Tipp.** Noch **nicht** in einer veröffentlichten Vorschau.

## Was Klaus sieht und wo er tippt

1. **Explorer** öffnen. Oben über den Dateien steht zum Beispiel:
   „🧾 3 Dateien sehen aus wie „Rechnungen“ (z. B. Rechnung-Stadtwerke.pdf, Telefon-Oktober.pdf).
   Kategorie anlegen? Nur eine Ansicht, die Dateien bleiben, wo sie sind.“ → **Anlegen** · **Nein danke**
2. Nach **Anlegen** steht im Ordnerbaum **🧾 Rechnungen (3)**. Ein Tipp zeigt genau diese Dateien,
   neueste oben. ↕, Suche und „auch im Inhalt“ wirken auch hier.
3. **Neue passende Dateien kommen von selbst hinein.**
4. **Gehört nicht hierher** an einer Datei nimmt sie dauerhaft aus dieser Kategorie heraus.
   Die Datei bleibt im Katalog und an ihrem Ort.
5. **Kategorie auflösen** entfernt nur die Ansicht. Der Vorschlag kommt danach nicht sofort zurück.
   **Abgelehnte Vorschläge wieder zeigen** holt abgelehnte Vorschläge zurück.

Kategorien: 🧾 Rechnungen · 💶 Gehalt · 🩺 Gesundheit · 📑 Verträge · 🛡 Versicherung.

## Wie erkannt wird (`native/native-categories.js`)

- Feste Wortlisten je Kategorie, ohne Netz und ohne KI. Ein Wort, das das Schriftstück selbst
  benennt („Rechnung“, „Gehaltsabrechnung“, „Arztbrief“, „Vertrag“, „Versicherungsschein“), zählt im
  Dateinamen 2 Punkte, im Text 1. Jeder typische Inhalt („Rechnungsbetrag“, „Lohnsteuer“,
  „Diagnose“, „Laufzeit“, „Versicherungsnummer“ …) zählt 1. Ab **3 Punkten** passt eine Datei.
- Vorgeschlagen wird eine Kategorie erst ab **2 passenden Dateien**.
- Gelesen werden Name, Steckbrief, Zusammenfassung und erkannter Text aus dem Katalog.
- Mails aus „👥 Alle Konten“ gehören nicht dazu; sie haben ihre eigene Ansicht.

## Grenzen

- Nur eine Ansicht: nichts wird verschoben, umbenannt oder gelöscht.
- Feste Wortlisten irren sich: Ein Kochrezept enthält „Rezept“, ein Kassenzettel kann als Rechnung
  zählen. Dafür gibt es „Gehört nicht hierher“. Die Korrektur gilt für diese eine Datei; die App
  lernt daraus noch nicht für ähnliche Dateien (Stufe 5 / A6).
- Welche Kategorien angelegt oder abgelehnt sind, steht als Liste der Kurzschlüssel im Gerät
  (`localStorage`, ohne Inhalte). „Gehört nicht hierher“ steht am Katalogeintrag und wird mit dem
  Katalog verschlüsselt im Speicherort gesichert.
- Scans ohne Texterkennung werden nur über den Namen erkannt.
- Nicht gemessen: echte Unterlagen, Klaus' Tablet.

## Prüfung (2026-10-21)

- `node tools/native/test-categories.mjs`: **21 grün**. Geprüft werden:
  - Vorschläge erst ab zwei Dateien, nichts vor der Entscheidung, keine Datei bewegt.
  - Die Ansicht zeigt genau die Rechnungen, neue kommen von selbst dazu.
  - „Gehört nicht hierher“ wirkt dauerhaft, auch nach einem Neustart; die Suche wirkt in der Kategorie.
  - „Nein danke“, „Auflösen“ und „wieder zeigen“; eine Rechnung, die man nur am Namen erkennt.
  - Englisch mit passenden Anführungszeichen, 360 px Breite, flache Knöpfe.
- Gegenprobe in einer Wegwerfkopie mit 5 Eingriffen; am Ende alle **gefangen**.
  „Dateiname zählt nicht“ rutschte zuerst durch, weil alle Testdateien genug Text hatten.
  Danach gibt es eine Testrechnung, die man nur am Namen erkennt.
- Beim Bau gefunden: Im Englischen standen deutsche Anführungszeichen. Jetzt hat jede Sprache
  ihre eigenen (gefangen von der Englisch-Prüfung).
- Ordnerknöpfe im Explorer jetzt flach (28 px) wie die übrigen Knöpfe.
- `test:native-web` komplett grün (16 Proben).
