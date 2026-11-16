# Sitzungsbrief 16.11.2026: Gerätetest 1.0.52 – Probleme und Plan

Klaus hat 1.0.52 am Tablet geprüft (16.11., 07:21–07:41, Bilder im Chat). Diese Liste ist sein Befund in eigenen Worten,
geordnet. **Nichts davon ist gebaut.** Sichtbare Änderungen zuerst als HTML-Vorschau, Klaus sagt Ja je Punkt; danach bauen,
Proben, Fassung 1.0.53 nur auf sein Wort.

## Problemliste

### A. Laden und Rückmeldung
1. **„Bitte warten …“ gleich nach dem Start, ohne Grund.** Wahrscheinlich startet das Bedeutungsmodell von selbst. Keiner weiß,
   was lädt; man bricht ab. Schlecht für die Ladezeit (Lighthouse).
2. **Modell erst auf Wunsch:** „Bedeutungssuche“ einschalten → Satz „Modell wird geladen, ca. 130 MB“ → **schmaler** Balken mit
   Prozent. Kein dicker, blinkender Balken, der bei jedem Atemholen neu ansetzt.
3. **„Suchen“ in „Überall suchen“ tut sichtbar nichts** – keine Anzeige, ob gesucht wird oder warum nichts kommt. Ergebnisse tauchen
   erst auf, wenn man den Filter „Dokumente“ wählt.
4. **Mail „Alle Konten“ → Mail öffnen dauert lange;** oben zweimal „Lesedurchgang“ (doppelte Suche/Abruf).

### B. Startseite (Suche)
5. **„Überall suchen“ ist ein eigener großer Kasten mit doppeltem Text.** Gewünscht: eine Reihe neben „Bildbeschreibung“ –
   „Suchen“ plus Zahnrad, im Zahnrad die Quellen (Private Brain, Tresor, Netz).
6. **Filterzeile unklar:** zweimal „Text/Notiz“ (Art und Kategorie nebeneinander, nicht zu unterscheiden); „Beliebig“ sagt nicht,
   dass es der Zeitraum ist; Sortierung (Relevanz, Größe, A–Z) gehört ans Ende. Reihenfolge der Arten anders als bei „Dateien“.
7. **Kein Bestätigen- und kein Löschen-Knopf im Suchfeld.** Nach dem Einsprechen weiß man nicht, wann gesucht wird → man drückt
   „Bedeutung“, das schaltet aber nur den Modus um (und beim zweiten Tipp wieder aus). Lupe/Haken und × ins Feld, überall
   (erste Seite, Dateien, Alle Konten).
8. **Bedeutungssuche ohne Ergebnis**, obwohl passende PDFs da sind (Beispiel aus dem Test, Wort im Diktat unklar).
9. **Diktat trennt Wörter:** „Anthropic“ kommt als „An Tropic“. Suche soll zusammengeschriebene Form mitprüfen.

### C. Hinzufügen
10. **ⓘ-Erklärungen starten offen** – man wird von Text erschlagen. Auch Satz wie „nur arbeiten an einer Kopie …“ hinter ⓘ.
11. **Zwei ⓘ:** oben groß, unten ein winziges neben „mail-mbox.eml“ – kaum zu sehen.
12. **Ziehen-und-Ablegen nicht erkennbar** (kein typischer Ablagebereich), Zweck des Kastens unklar.
13. **Abgleich mit der Familienakte:** dort ist der Eingang besser gelöst (Aufteilung, Einordnung, wie eingefügt wird). Prüfen und
    übernehmen, was passt (Familienakte `app/eingang…`, Startseite „So fängst du an“).

### D. Dateien
14. **Vorschlag „2 Dateien sehen aus wie Rechnungen … Kategorie anlegen?“:** man sieht nicht, welche zwei Dateien gemeint sind –
    keine Markierung, keine Vorschau, sie stehen nicht oben. So legt man blind an, und die App lernt falsch. Erschien außerdem bei der
    Suche „ich suche eine E-Mail“, wo er nicht hingehört.
15. **Feld „Kategorie“ unter jedem Eintrag über die volle Breite** (schon gemeldet) → kleiner Knopf „+ Kategorie“.
16. Suchfeld: × zum Löschen nach dem Einsprechen (siehe 7).

### E. Mail
17. **„Alle Konten“ holt die Anhänge nicht** – auch nach 1.0.52 bleibt es beim gespeicherten Text, wenn der Anbieter-Weg nicht greift.
18. **Gespeicherter Text mit langen Links** („Mit einem Klick im Browser öffnen [https://…]“) – nicht lesbar, Link nicht antippbar.
19. **Klick springt nicht zur angeklickten Mail**, sondern zur letzten (im einzelnen Postfach); über „Alle Konten“ landet er richtig,
    aber langsam.
20. **„Aufräumen“ ohne Hinweis, wenn es nichts gibt** – wirkt kaputt. Satz „Nichts aufzuräumen“ zeigen.
21. **„Liste“/„Absender“ wirken bei einer Suche nicht** (92 Treffer, Umschalten ändert nichts).

### F. Überall
24. **„Bitte warten …“ springt immer wieder an (z. B. in „Kategorien“), ohne dass man etwas getan hat** – sieht aus wie ein
    Suchfeld. Ursache: die Warte-Zeile aus 1.0.52 reagierte auch auf Geräte-Aufrufe, die die App im Hintergrund selbst macht.
    **Behoben am 16.11. (PR nach #146, nicht veröffentlicht):** Punkte nur noch, wenn der Nutzer höchstens 2 s vorher selbst etwas
    getan hat, und mit Namen („Mail wird geladen …“, „Ablage wird gelesen …“). Probe `test-activity` 39. Kommt mit 1.0.53.
22. **ⓘ-Kästen anfangs geschlossen** (Kategorien, Hinzufügen, Einstellungen …). Ändert die Regel aus Sitzung 3 („anfangs offen
    und gemerkt“) – Klaus' neuer Wunsch.
23. Übersicht und „Dateien“-Grundaufbau: vorerst so lassen.
25. **Kategorien: Kasten „Neu ordnen – Kopie in einen neuen Ordner“ ist zu groß.** Klaus: als Knopf/Kachel wie die
    Kategorie-Kacheln oben („Neuer Ordner“ als Dashboard-Kachel); ein Tipp darauf zeigt erst das Schema und dann die Knöpfe
    „Vorschau ansehen“ / „In neuen Ordner kopieren …“. Kein eigener großer Kasten.

## Plan für die nächste Sitzung

1. **Ursachen klären, bevor gebaut wird** (ohne sichtbare Änderung): Wer startet beim App-Start das Modell (1)? Warum zeigt
   „Überall suchen“ nichts (3)? Warum zweimal „Lesedurchgang“ (4)? Warum springt die Mail-Liste zur letzten statt zur angeklickten
   Mail (19)? Warum wirken „Liste“/„Absender“ bei Suche nicht (21)? Warum fand die Bedeutungssuche nichts (8)?
   Familienakte-Eingang lesen (13).
2. **Eine Vorschau (HTML, ein Artefakt) mit nummerierten Punkten**, Klaus sagt Ja je Punkt:
   - V1 Startseite: Suchfeld mit Lupe und ×, eine Reihe „Bildbeschreibung · Suchen ⚙“ (Quellen im Zahnrad), Filterzeile mit
     klaren Namen („Art“, „Kategorie“, „Zeitraum“), Sortierung am Ende, kein doppeltes „Text/Notiz“.
   - V2 Modell laden: Satz mit Größe, schmaler Balken mit Prozent, nur nach Einschalten.
   - V3 Hinzufügen: ein ⓘ, geschlossen; großer Ablagebereich „Dateien oder Ordner hierher ziehen“ mit zwei Knöpfen; Aufteilung nach
     Familienakte-Vorbild.
   - V4 Dateien: Vorschlag „Kategorie anlegen?“ mit den gemeinten Dateien sichtbar markiert und oben, mit Vorschau; nur passend
     zur Suche; „+ Kategorie“ klein.
   - V5 Mail: Links im gespeicherten Text als „Link öffnen ↗“; „Nichts aufzuräumen“; Liste/Absender auch bei Suche.
   - V6 ⓘ überall geschlossen.
   - V7 Kategorien: „Neuer Ordner“ als Kachel neben den Kategorie-Kacheln, Schema und Knöpfe erst nach Tipp (25).
3. **Bauen in Stücken**, je Stück Probe (vorher rot, nachher grün) und Gegenprobe:
   Laden (1, 2, 3, 4) → Startseite (5–9) → Mail (17–21) → Hinzufügen (10–13) → Dateien (14–16) → ⓘ (22).
4. **Anhänge in „Alle Konten“ (17):** Weg wählen mit Klaus – entweder beim Einlesen mitholen (Größengrenze je Mail, z. B. 20 MB,
   verschlüsselt in die Ablage) oder beim Öffnen sicher vom Anbieter holen. Frage an Klaus vor dem Bau.
5. **Diktat (9):** in der Suche Wörter ohne Leerzeichen zusätzlich prüfen („an tropic“ → „antropic/anthropic“), an allen drei Suchfeldern.
6. Gesammelt als **1.0.53** ausgeben, nur auf Klaus' Wort; Nachweis wie bei 1.0.52.

## Offene Fragen an Klaus
- Anhänge in „Alle Konten“: beim Einlesen mitholen (mit Größengrenze?) oder erst beim Öffnen?
- ⓘ überall geschlossen – auch dort, wo bisher „anfangs offen, dann gemerkt“ galt?
- „Zeitraum“-Auswahl: letzte 7 Tage / 30 Tage / dieses Jahr / beliebig – reicht das?

## Startauftrag

```
Repo: lausiklauskn-png/Privat-Brain-Pro, Zweig von origin/main.
Zuerst lesen: CLAUDE.md, BRIEF_SITZUNG_2026-11-16_GERAETETEST-1.0.52.md (Problemliste 1–25, Plan).
Stand: 1.0.52 veröffentlicht (Android, Windows), Klaus' Gerätetest liegt als Liste vor; nur Punkt 24 (Warte-Zeile nur nach Tipp, PR #147) gebaut, nicht veröffentlicht.
Schritt 1: Ursachen klären (Plan Punkt 1), ohne sichtbare Änderung. Schritt 2: eine HTML-Vorschau V1–V7, Ja je Punkt.
Dann bauen in Stücken mit Proben. Veröffentlichen nur mit Klaus' Wort (nächste Fassung 1.0.53).
```
