// 50 Such-Proben in Alltagssprache (Klaus 15.11.2026, Frage-Weg). Geschrieben, bevor gemessen wurde; danach nicht angepasst.
// alle: genau diese Einträge sollen kommen (Mehrzahl, „alle …“). eine: einer davon soll an erster Stelle stehen (Einzahl).
const NORD = ['n1', 'n2', 'n3', 'n4', 'nm'];
export const FRAGEN = [
  // Klaus' Fälle
  { f: 'Rechnungen von Anthropic', alle: [], hinweis: 'unbekannter Absender: nichts darf kommen' },
  { f: 'Rechnung', alle: null, eine: ['n1', 'n2', 'n3', 'n4', 'nm', 's1', 's2', 't1', 'tm', 'z1', 'v2'] },
  { f: 'Rechnungen', alle: ['n1', 'n2', 'n3', 'n4', 'nm', 's1', 's2', 't1', 'tm', 'z1', 'v2'] },
  { f: 'rechnungen von nordlicht', alle: NORD },
  { f: 'ich suche alle Rechnungen von Nordlicht Labs', alle: NORD },
  { f: 'Invoice', eine: NORD },
  { f: 'invoices nordlicht', alle: NORD },
  { f: 'nordlicht', alle: NORD },
  { f: 'Rechnung von Nordlicht aus dem Oktober', eine: ['n3'] },
  { f: 'nordlicht november 2026', alle: ['n4', 'nm'] },
  // deutsche Rechnungen
  { f: 'Rechnungen der Stadtwerke', alle: ['s1', 's2'] },
  { f: 'stadtwerke', alle: ['s1', 's2', 's3', 'b1', 'b2'] },
  { f: 'Rechnung Stadtwerke Oktober', eine: ['s2'] },
  { f: 'Abschlag Strom', alle: ['s1', 's2', 'b1', 'b2'] },
  { f: 'Zahnarzt Rechnung', eine: ['z1'] },
  { f: 'Rechnungen vom Fernmeldewerk', alle: ['t1', 'tm'] },
  { f: 'handyrechnung', eine: ['t1', 'tm'] },
  { f: 'Beitragsrechnung Hausrat', eine: ['v2'] },
  // Verträge, Versicherung
  { f: 'Mietvertrag', eine: ['w1'] },
  { f: 'alle Verträge', alle: ['w1', 't2', 'v1'] },
  { f: 'Handyvertrag', eine: ['t2'] },
  { f: 'Versicherung', alle: ['v1', 'v2', 'v3'] },
  { f: 'Hausratversicherung', alle: ['v1', 'v2'] },
  { f: 'Kündigung', eine: ['v3'] },
  { f: 'Kündigung Kfz-Versicherung', eine: ['v3'] },
  // Steuer, Bank, Arbeit
  { f: 'Steuerbescheid', eine: ['f1'] },
  { f: 'Bescheid vom Finanzamt', eine: ['f1'] },
  { f: 'Kontoauszüge', alle: ['b1', 'b2'] },
  { f: 'Kontoauszug Oktober', eine: ['b2'] },
  { f: 'Gehaltsabrechnung September', eine: ['g1'] },
  { f: 'Lohnabrechnung', eine: ['g1'] },
  { f: 'Mahnung', eine: ['m1'] },
  { f: 'Mahnungen von Sonnenschein', alle: ['m1'] },
  // Gesundheit
  { f: 'Arztbrief', eine: ['a1'] },
  { f: 'Bandscheibe', eine: ['a1'] },
  { f: 'Termin Physiotherapie', eine: ['a2'] },
  { f: 'Befunde', alle: ['a1'] },
  // Mails, Fotos, Formen
  { f: 'Mails von Lisa', alle: ['pm1'] },
  { f: 'E-Mails vom Fernmeldewerk', alle: ['tm'] },
  { f: 'Fotos', alle: ['p1', 'p2', 'p3'] },
  { f: 'Fotos vom Urlaub an der Ostsee', eine: ['p2'] },
  { f: 'Ostsee', alle: ['pm1', 'p2', 'q1'] },
  { f: 'Newsletter', alle: ['nl1'] },
  { f: 'Angebote', alle: ['nl1', 'o1'] },
  { f: 'Angebot Badsanierung', eine: ['o1'] },
  // Zeit
  { f: 'Rechnungen aus dem September', alle: ['n2', 's1'] },
  { f: 'alles von 2025', alle: ['w1', 't2'] },
  { f: 'Nebenkostenabrechnung', eine: ['w2'] },
  // Englisch, Rest
  { f: 'receipts from nordlicht', alle: NORD },
  { f: 'Einkaufsliste', eine: ['q2'] },
];
