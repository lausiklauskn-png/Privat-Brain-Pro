/*
 * Siegel-Inhalt — DIE IDENTITÄT DIESES KNOTENS, und sonst nichts.
 *
 * ⚠ HIER STEHT KEIN KANON. Der Andock-Wizard, alle Anzeigetexte und alle
 * Prüfungen liegen seit A18 (2026-09-14) in EINER netzweit byte-gleichen
 * Datei — `assets/sbkim-andock-wizard.js`, Kanon `Sage-Protokol/src/modules/16b_andock_wizard.js`.
 * Diese Datei trägt nur noch, was in jedem Knoten ANDERS sein muss.
 *
 * Warum die Trennung: gemessen über die 20 Kopien im Netz standen am 2026-09-14
 * ZWÖLF verschiedene Code-Fassungen desselben Werkzeugs. Jede Verbesserung
 * kostete Handarbeit mal zwanzig und unterblieb deshalb meistens.
 *
 * ⚠ UND DIESE DATEI WIRD NIE VERTEILT. Sie trägt die BEDEUTUNG des Knotens; ein
 * Überschreiben gäbe dieser App den Namen und den Vektor einer fremden — der
 * Schaden vom 2026-08-16 in Alis Moderaum.
 *
 * Vertrag: Sage-Protokol/docs/INTERFACES.md §11.9.
 */
(function () {
  "use strict";
  window.SBKIM_SIEGEL_WIZ = {
    domain: "Privates Daten-Gehirn",
    endpoint: "https://lausiklauskn-png.github.io/Privat-Brain/",
    nodeType: "hybrid",
    nodeName: "Private Brain",
    domainDescription: "Private Brain — dein privates zweites Gehirn: durchsucht deine eigenen Daten (Mails, Dokumente, Fotos, Notizen) nach Bedeutung, offline, ohne dass Originale bewegt werden. Es liest jede Datei einmal, behält nur einen winzigen Bedeutungs-Katalog aus Vektor, Steckbrief und Zeiger aufs Original und lässt die Originale unangetastet — liest nur, schlägt vor, bewegt nichts. Diese App ist zugleich ein eigenständiger Knoten im SBKIM-Mycel: Semantisches Bidirektionales KI-Matching nach der offenen Spezifikation aus dem Sage-Protokol. Sie trägt eine eigene Ed25519-Identität, kündigt sich mit einer signierten Spore an und findet über ihren Bedeutungs-Vektor andere Knoten des Netzes — server-los, ohne Konto, der private Schlüssel bleibt im Browser. SBKIM, Mycel, Knoten, Spore, Sage-Protokol, semantisches Matching.",
    domainKeywords: ["Datei", "Dokument", "Bedeutungssuche", "Mail", "Foto", "Notiz", "privat", "Ordnung", "Katalog", "SBKIM", "Mycel"],
    stammCategories: ["Dokumente", "Fotos", "Mails", "Notizen"],
    guestCategories: ["Spore-Erzeugung", "Backup", "Handshake"],
    /* ⚠ NACHGETRAGEN BEIM A18-UMBAU (2026-09-14). Vorher stand dieser Name HART
       im Wizard-Code — in einer Datei, die jetzt netzweit byte-gleich ist. */
    backupPrefix: "private-brain-backup",
  };
})();
