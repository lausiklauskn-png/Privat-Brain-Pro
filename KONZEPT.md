# Private Brain — Konzept

> Ein **eigener kleiner Kasten / Mini-Server** (offline, unabhängig), der das
> **Datenchaos einer Firma oder Person** nach **Bedeutung** durchsuchbar und
> nutzbar macht — ohne dass Originaldateien bewegt, verändert oder verloren gehen.
>
> Stand: 2026-07-14 · Ergebnis der Brainstorming-Sitzung (kein Bau). Sichtbarkeit: privat.

---

## 1. Das Bild in einem Satz

Der Kasten arbeitet wie ein **verstehender Bibliothekar / Filter mit Gedächtnis**:
er liest jede Datei **einmal** („signieren"), behält nur einen **winzigen Katalog**
(Steckbrief + Bedeutungs-Vektor + Zeiger zum Original) und lässt die Datei liegen.
Danach: **semantische, bidirektionale Suche** in Millisekunden — und KI-gestütztes
**Nutzen** (finden, extrahieren, sortieren-vorschlagen).

**Leitbeispiel:** „Finde das schwarze Auto, das neulich bearbeitet wurde, mit
Radstand X, wo *schwarz* draufsteht." Namenssuche scheitert daran; Bedeutungssuche
verschmilzt Datum + Text aus Spec + Text im Bild + Bild-Inhalt zu einem Treffer.

## 2. Das Problem / der Markt

Viele Firmen (und Private) ertrinken in ungeordneten Dateien: falsche Namen, keiner
kennt den Inhalt, Altlasten-Müll — Suchen kostet mehr als Wegwerfen-und-neu-machen.
Gleichzeitig scheuen viele die Cloud-KI. Chance: ein Werkzeug, das die Einstiegshürde
senkt und die Angst nimmt — **offline, vertrauensstark, kinderleicht**.

## 3. Die drei Vertrauens-Säulen (das Herz)

1. **Arbeitet an einer Kopie / liest nur** → das Original ist unantastbar. Man kann
   den Kasten wegwerfen, es geht nichts verloren.
2. **Schlägt vor — du bestätigst** → nichts wird eigenmächtig gelöscht; alles umkehrbar.
3. **Sortiert virtuell — bewegt nichts** → die „Ordnung" ist ein Katalog/eine Ansicht
   über den unbewegten Originalen. **Keine feste Verlinkung bricht** (andere Programme/
   Rechner greifen unverändert zu). Physisches Umräumen nur auf Wunsch, transaktional,
   mit automatischer Weiterleitung + vollständigem Rückgängig.

## 4. Wie es technisch läuft (Durchleitung + Katalog)

- **Zwei Phasen:** (1) **Signieren** einmal je Datei — die einzige „langsame" Stelle,
  mit Fortschritt, nachvollziehbar. (2) **Suchen** — praktisch gratis, Millisekunden.
- **Signieren je Datei:** Fingerabdruck (Hash) → Text/OCR raus → Bedeutungs-Vektor +
  Steckbrief → Katalog-Eintrag. Bereits signierte werden per Hash übersprungen.
- **Speicher winzig:** ~wenige KB je Datei; 100 Dateien < 1 MB. Die **Originale bleiben
  auf dem Rechner** (Durchleitung, keine Voll-Kopie fürs Finden).
- **Nutzen, nicht nur sortieren:** derselbe „einmal verstehen"-Durchgang erlaubt auch
  Extrahieren, Zusammenfassen, Vergleichen — wie in Rezeptbuch/Mixarium (Bild→Rezept,
  OCR, Sortieren), nur auf beliebige Firmen-Dateien verallgemeinert.

## 5. Bausteine, die schon existieren (Wiederverwendung)

OCR (Modul 24) · Bedeutungs-Vektor (Modul 03) · Cosinus-Vorfilter + KI-Richter
(Modul 04) · Schlüssel-Safe (Modul 20) · **Kimseek** = die Such-Seite als fertige PWA.
Es fehlt die „Klammer": dauerhafter Dokument-Index + Multiformat-Parsing + Massenimport.

## 6. Gibt es das schon? (ehrlich)

Die **Technik** (semantischer Index / „RAG") ist Standard. Am nächsten im Massenmarkt:
**Windows Recall / Copilot+-PCs** (on-device Bedeutungs-Index — aber cloud-nah, Lock-in,
schlechter Datenschutz-Ruf), **NAS-KI** (Foto-fokussiert), **Paperless-ngx** (self-hosted,
techie). Die **Kombination** — offline + zerstörungsfrei + turnkey + „nichts geht raus" +
Probe-dann-kaufen für cloud-scheue KMU — gibt es **nicht** als Fertigprodukt. Das ist die Lücke.

## 7. Kasten (Hardware) vs. Software

- **Software:** beste Skalierung, fast keine Kosten — aber Kunde braucht eigene starke
  Hardware + Technik-Mut, und die Offline-Zusage muss er glauben.
- **Kasten:** turnkey, garantierte Rechenkraft, Vertrauen **anfassbar** (wegwerfbar) —
  für den ängstlichen, nicht-technischen Kunden ein leichteres Ja. Aufwand: Logistik,
  sicheres Löschen zwischen Proben.
- **Weg:** erst **Software** bauen und den Vergleich gewinnen lassen → dann **Kasten**
  als Verpackung. Nicht als Hardware-Firma starten, sondern nach dem Beweis eine werden.

---

# Kosten-Nutzen (überschlägig — Größenordnung, keine Zusage)

## Hardware (Einkauf)

| Stufe | Hardware | Richtpreis | Wofür |
|---|---|---|---|
| Einstieg | Mini-PC mit NPU, 32 GB, 1 TB | ~500–900 € | Einzelplatz, kleine Modelle + OCR |
| Mittel | PC mit GPU (RTX 4060/70), 64 GB, 2 TB | ~1.200–2.000 € | Team, Bild-KI zügig |
| Stark | Workstation (RTX 4090+), 64–128 GB | ~3.000–5.000 € | große Bestände, mehrere Nutzer |

## Software-Entwicklung
Für dich fast **kein Bargeld** (Eigenbau + Wiederverwendung); extern wären es grob
**12.000–30.000 €**. **Offline = keine monatlichen Cloud-Kosten.**

## Laufende Kosten
Vendor je Probe-Kasten: Versand ~10–30 € + sicheres Löschen/Support (Zeit). Kunde:
Einmalkauf, **kein Abo**; optional Wartungsgebühr.

## Einstiegskosten
Software-Phase ~0 € (deine Zeit). Demo-Phase: 1 Kasten ~1.500–2.000 € (minimal) bis
3 Kästen ~4.500 € (rotieren).

## Preis & Gewinn
Kasten kostet ~1.500 €, Verkauf ~2.500–3.500 € → **Marge ~1.000–2.000 €/Stück**.
Software-Lizenz (eigene Hardware): einmalig ~500–1.500 € oder Abo ~20–50 €/Monat →
**Skalierungs-Hebel**. Break-even: ~3–5 verkaufte Kästen.

## Marktanalyse (kurz)
- **Zielmarkt:** deutscher Mittelstand + Handwerk + Private mit Datenchaos & Cloud-Skepsis.
- **Wettbewerb:** Microsoft Copilot+/Recall (cloud-nah, Lock-in), NAS-KI (Foto), DMS
  (teuer/Berater), Paperless-ngx (gratis/Selbstbau).
- **Positionierung:** offline + zerstörungsfrei + turnkey + „nichts geht raus" +
  Probe-dann-kaufen — so gebündelt einzigartig.
- **Risiko:** Microsoft bringt on-device-Suche in 2–3 Jahren „gratis mitgeliefert" →
  Vorsprung ist **Vertrauen + Offline + Einfachheit + Nische**, nicht Technik-Neuheit.
- **Rückenwind:** DSGVO-Druck, KI-Skepsis, Wunsch nach Datenhoheit wachsen.

## Kosten-Nutzen über 12 Monate

| Zeit | Tun | Bargeld | Ertrag |
|---|---|---|---|
| Monat 0–2 | Software-MVP (Eigenbau) | ~0 € | — |
| Monat 3–4 | Demo an echten Daten | ~0–1.500 € | Beweis „alt vs. neu" |
| Monat 5–8 | 2–3 Probe-Kästen | ~4.500 € | erste Kaufsignale |
| Monat 9–12 | erste Verkäufe | (aus Kapital) | ~5 × 1.500 € ≈ ~7.500 € |

**Ehrlich:** Jahr 1 = Beweis + kleine schwarze Null. Gewinn-Hebel ab Jahr 2 = Software-Lizenz.

**Kunden-Nutzen (Verkaufs-Rechnung):** 1 Mitarbeiter sucht 20 Min/Tag → ~7 h/Monat;
5 Leute → 100+ €/Monat verlorene Zeit → der Kasten zahlt sich in Monaten selbst.

---

## Nächster Schritt

Der erste Bau ist die **Probeversion** (Software, auf einem Gerät) — siehe
[`BRIEF_PROBEVERSION.md`](BRIEF_PROBEVERSION.md). Der Kasten kommt erst, wenn die
Software den „alt vs. neu"-Vergleich gewinnt.
