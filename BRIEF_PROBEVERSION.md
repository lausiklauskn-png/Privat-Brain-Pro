# BRIEF — Private Brain: Probeversion („Signieren → sortiert ausgeben → semantisch suchen")

> Anschlussbrief aus der Brainstorming-Sitzung 2026-07-14. Für die **nächste**
> (Bau-)Sitzung. Kein Kasten, keine Backup-Pipeline, kein Maßstab — nur der
> **Erlebnis-Beweis** auf EINEM Gerät.

## Stand

Vision + Kosten-Nutzen stehen (siehe [`KONZEPT.md`](KONZEPT.md)). Jetzt: die kleinste
überzeugende **Probeversion** bauen.

## Ziel

Dateien **reinwerfen → signieren → als sortierte Ansicht ausgeben → semantisch besser
suchen / sich selbst sortieren**. Beweis: eine Inhalts-/Bedeutungs-Frage treffen, die die
Namenssuche NICHT kann.

## Design (entschieden — Freibrief)

Schlanke **Browser-PWA** aus dem eigenen Baukasten. **EINE klare Fläche:**
großes Einwurf-Feld → Signier-Fortschritt → eine Suchleiste mit **Umschalter
„Namenssuche ↔ Bedeutungssuche"** → Treffer **MIT Begründung**. Einfach, edel, sofort
nachvollziehbar, überzeugend durch den direkten Vergleich.

## Der Fluss (was gebaut wird)

1. **Einwurf:** Drop-Feld (Ordner/Dateien wählen). Arbeitet an der **Kopie im
   Browser-Speicher**, fasst Originale nie an.
2. **Signieren (je Datei, mit Fortschrittsbalken):** Hash → Text raus (PDF/Text/E-Mail),
   Bilder → OCR (Modul 24) + optional Vision → **Steckbrief + Vektor** (Modul 03) →
   Katalog-Eintrag. Bereits signierte (per Hash) überspringen.
3. **Ausgabe (virtuelle Ordnung):** aufgeräumte Ansicht mit KI-vorgeschlagenen Gruppen
   („Rechnungen / Fotos / Verträge …") — **nur Vorschlag** (echtes Schreiben in einen
   Ordner = Kasten-Stufe später).
4. **Suchen:** natürliche Sprache → Cosinus-Vorfilter (gratis) + KI-Richter optional
   (Modul 04) → Treffer **mit Begründung + Schnipsel + „öffnen"**.
5. **Aha-Umschalter „Namenssuche ↔ Bedeutungssuche":** dieselbe Frage, links nichts,
   rechts Treffer. Der überzeugende Moment.

## Datenvertrag (Steckbrief je Datei)

```
{ id/hash, name, pfad, typ, datum, textSchnipsel, vektor, kiKurzfassung, vorschlagKategorie }
```

## Akzeptanzkriterien

- ~100 gemischte Dateien (inkl. Bilder + E-Mails) → **signiert mit sichtbarem Fortschritt**.
- Frage wie „das schwarze Auto, neulich bearbeitet, mit Radstand X" → **richtige
  Trefferliste mit Begründung**, Suche < 1 s.
- **Zerstörungsfrei:** Originale unberührt. Zweiter Lauf: signierte übersprungen.

## Reihenfolge (Bau)

Text/E-Mail zuerst (schneller Gewinn) → Bilder/OCR → Vision (optional) →
Sortier-Vorschlag → der „Namens- ↔ Bedeutungs"-Umschalter (der Beweis).

## Offene Fragen an Klaus

- **Name** (Private Brain / Alternative)?
- **Erster Datei-Typ-Fokus** fürs Demo?
- **Lokal vs. EU-Cloud** für OCR/Vision im Demo (BYOK/Zustimmung)?
- **Sortier-Ausgabe:** Bildschirm-Ansicht (Demo) genügt, oder gleich echter Shortcut-Ordner?

## Pflichtlektüre für die Bau-Sitzung

Dieser Brief · [`KONZEPT.md`](KONZEPT.md) · Kimseek-README (Such-Seite existiert) ·
Module 03/04/24 in Sage-Protokol.
