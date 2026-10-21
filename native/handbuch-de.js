/* Benutzerhandbuch Private Brain Pro — Inhalt (Deutsch).
   ERWEITERN: neues Kapitel als Objekt in "kapitel" anhängen, neue Begriffe in "begriffe".
   Schreibweise im Text:
     [[Wort]]           springt zum Begriff mit genau diesem Namen (Abschnitt „Begriffe“)
     [[Wort|ziel]]      springt zum Abschnitt mit der Kennung „ziel“ (Kapitel, Schritt oder Begriff)
     {{https://…|Text}} öffnet die Seite im Browser (nur echte Links von Anbietern)
     **fett**
   Jede Kennung darf nur einmal vorkommen; die Probe tools/native/test-manual.mjs meldet
   tote Sprungziele. */
window.PB_HANDBUCH_DE = {
  titel: 'Benutzerhandbuch Private Brain Pro',
  stand: 'Stand: Vorschau .19 (2026-10-21) – wird laufend ergänzt',
  kapitel: [
    {
      id: 'start', titel: 'Erste Schritte',
      bloecke: [
        { p: 'Private Brain Pro ist dein privates „zweites Gehirn“: Es liest deine Dateien, Mails und Fotos einmal, merkt sich ihre Bedeutung im [[Katalog]] und lässt die [[Original|original]]e unverändert. Danach findest du alles über die Suche – auch ohne Internet.' },
        { p: 'Oben stehen acht Ansichten mit Symbol und kurzem Namen: **Suche**, **Dateien**, **Explorer**, **Postfach**, **Übersicht**, **Katalog**, **Doppelte** und **Einstellungen** (Zahnrad). Das **App-Menü** rechts oben enthält Sprache, Hell/Dunkel, Neu laden und den [[Internetschalter|internet]].' },
        { p: '**Aktualisieren:** Eine neue Version immer **über die vorhandene App** installieren, nie vorher deinstallieren – sonst sind Konten und Daten auf dem Gerät weg. Mit [[Speicherort]] und Passwort lässt sich trotzdem fast alles zurückholen (siehe [[Vorhandenen Ordner öffnen|wiederherstellen]]).' },
        { p: 'Wichtige Einrichtung in dieser Reihenfolge: 1. [[Speicherort wählen|speicherort]] · 2. Mailkonto im [[Postfach|postfach]] verbinden · 3. [[Virenschutz einrichten|virenschutz]].' }
      ]
    },
    {
      id: 'suche', titel: 'Suchen',
      bloecke: [
        { p: 'Ins Suchfeld eintippen oder das Mikrofon benutzen. **Nach Bedeutung** findet auch Dinge, die anders formuliert sind („Urlaub am Meer“ findet „Ferien an der Ostsee“); **nach Wörtern** sucht genau die Zeichenfolge.' },
        { p: 'Unter dem Suchfeld kannst du nach Art, Kategorie und Zeit filtern. Ein Treffer zeigt Vorschau, Fundstelle und – wenn vorhanden – das [[Original|original]].' }
      ]
    },
    {
      id: 'dateien', titel: 'Dateien hinzufügen und Explorer',
      bloecke: [
        { p: 'In **Dateien** Dokumente, Fotos oder Mails (.eml/.mbox) hineinziehen oder auswählen. Jede Datei wird einmal gelesen, mit einem [[Fingerabdruck]] versehen und in den [[Katalog]] aufgenommen.' },
        { p: 'Der **Explorer** zeigt alles in Ordnern. Mit gewähltem [[Speicherort]] erscheint dort zusätzlich der Ordner **📎 Mail-Anhänge** mit Name, Größe, Absender und dem Ergebnis der [[Schutzprüfung|virenschutz-ergebnisse]].' },
        { p: '„Öffnen mit …“ gibt eine Datei an eine andere App weiter. Vorher kommt eine Warnung, denn die Datei verlässt dabei den geschützten Ordner.' }
      ]
    },
    {
      id: 'postfach', titel: 'Postfach (E-Mail)',
      bloecke: [
        { p: 'Im **Postfach** über „Konto verbinden“ einen Anbieter wählen: Telekom, Google/Gmail, WEB.DE, GMX, Yahoo, 1&1/IONOS oder Hetzner. Die Server sind fest eingetragen. Das Passwort tippst du nur im Android-Fenster ein, nie in die Seite.' },
        { p: 'Hinweise je Anbieter: **Telekom** braucht das separate Passwort für E-Mail-Programme. **WEB.DE/GMX** – vorher im Anbieter-Postfach „POP3/IMAP“ einschalten. **Yahoo** – ein App-Passwort beim Anbieter erzeugen. **Google** – Anmeldung über das Google-Fenster, kein Passwort in der App. Microsoft/Outlook ist noch nicht anschließbar.' },
        { p: 'Beim Öffnen einer Mail steht oben ein kleines Feld **🛡 Schutz**: Es zeigt [[Hinweis]]e und [[Befund]]e zu Absender, Links und Anhängen (siehe [[Virenschutz|virenschutz]]).' },
        { p: 'Eine Mail wird nur gesendet, wenn du „Senden“ tippst. Ist unklar, ob eine Mail ankam, sendet die App **nie** automatisch ein zweites Mal.' }
      ]
    },
    {
      id: 'speicherort', titel: 'Speicherort und Verschlüsselung (Tablet oder SD-Karte)',
      bloecke: [
        { p: '**Wo:** Einstellungen → „🔐 Speicherort und Verschlüsselung“ → **Speicherort wählen**.' },
        { schritte: [
          '„📱 Tablet“ oder „💾 SD-Karte“ antippen. Android öffnet die Ordnerauswahl.',
          'Einen neuen Ordner anlegen, zum Beispiel „Private Brain“, und auswählen.',
          'Im Android-Fenster zweimal dein [[Passwort|speicherort-passwort]] eingeben (mindestens 10 Zeichen) und den Hinweis bestätigen.',
          'Frage „Vorhandene Daten übernehmen?“ mit **OK** beantworten.'
        ] },
        { p: 'Danach liegen Mail-Anhänge (bis 1 GB je Datei), geöffnete Mails, Konten, Entwürfe, Originale, die [[Katalogsicherung]] und die [[Schutzlisten]] verschlüsselt in diesem Ordner.' },
        { id: 'speicherort-passwort', p: '**Passwort des Speicherorts:** Es wird nirgends gespeichert. **Passwort vergessen = Daten im Ordner verloren.** Es ist ein anderes Passwort als das des [[Tresor]]s mit seinen [[Ersatzschlüssel]]n.' },
        { id: 'wiederherstellen', p: '**Vorhandenen Ordner öffnen** (neues Gerät oder nach Neuinstallation): Einstellungen → „🔐 Speicherort …“ → **Vorhandenen Ordner öffnen** → Ordner auf der SD-Karte wählen → Passwort. Konten, Entwürfe und Katalog kommen zurück; vorhandene Daten werden nie überschrieben. Google-Konten brauchen eine neue Freigabe.' },
        { p: '**Sperren:** „Auf diesem Gerät sperren“ vergisst den Schlüssel. Beim nächsten Öffnen einer Mail fragt Android einmal nach dem Passwort.' }
      ]
    },
    {
      id: 'tresor-kapitel', titel: 'Tresor und Ersatzschlüssel',
      bloecke: [
        { p: 'Der [[Tresor]] im Bereich „Tresor — Verschlüsselung“ hat ein eigenes Passwort. Für ihn erzeugt **Ersatzschlüssel erzeugen & sichern** fünf [[Ersatzschlüssel]]. Android fragt mit „Speichern unter“, wohin die Datei soll. Erst nach dem erfolgreichen Speichern geht es weiter.' },
        { p: 'Drei der fünf Anteile genügen, um das Tresor-Passwort wiederherzustellen. Die Anteile getrennt und sicher aufbewahren, nie in Chats oder Bildschirmfotos zeigen.' }
      ]
    },
    {
      id: 'virenschutz', titel: 'Virenschutz, Spam und Betrug',
      bloecke: [
        { p: 'Die App prüft Mails, Anhänge, Links und eingelesene Dateien auf dem Gerät. Das ist **kein vollständiger Virenscanner**: Ein Treffer ist ein Warnzeichen, kein Treffer ist keine Garantie. Die App schreibt deshalb nie „virenfrei“.' },
        { p: '**Wo:** Einstellungen → „🛡 Schutz vor Viren, Spam und Betrug“.' },
        { p: 'Ohne Einrichtung arbeiten bereits die [[Spam- und Betrugsregeln|regeln]]. Für die Listen bekannter Schaddateien und gefährlicher Links brauchst du einmalig einen kostenlosen [[Zugangsschlüssel]] von abuse.ch, für VirusTotal optional einen zweiten. Voraussetzung ist ein gewählter [[Speicherort]].' }
      ]
    },
    {
      id: 'schluessel-abuse', titel: 'Virenschutz einrichten: Schlüssel von abuse.ch',
      bloecke: [
        { schritte: [
          'Konto erstellen: {{https://auth.abuse.ch/|auth.abuse.ch}} → anmelden, zum Beispiel mit einem vorhandenen Google-, GitHub- oder anderem Konto, das die Seite anbietet.',
          'Schlüssel erstellen: auf derselben Seite {{https://auth.abuse.ch/|auth.abuse.ch}} in deinem Profil den Bereich **Auth-Key** suchen → **Generate**/**Erzeugen** → den langen Schlüssel kopieren.',
          'Schlüssel einfügen: in der App Einstellungen → „🛡 Schutz …“ → **🔑 abuse.ch-Schlüssel** → im Android-Fenster einfügen → **Speichern**.',
          'Fertig: Die App lädt die Listen sofort. Unter „Schutz“ steht danach „Stand …“ mit der Anzahl der Einträge.'
        ] },
        { p: 'Die Namen der Menüpunkte bei abuse.ch können sich ändern; gesucht ist immer der persönliche **Auth-Key**. Der Schlüssel liegt verschlüsselt in deinem [[Speicherort]] und wird nur beim Abruf der Listen an abuse.ch geschickt.' }
      ]
    },
    {
      id: 'schluessel-vt', titel: 'Virenschutz einrichten: Schlüssel von VirusTotal (optional)',
      bloecke: [
        { schritte: [
          'Konto erstellen: {{https://www.virustotal.com/gui/join-us|virustotal.com/gui/join-us}} → kostenlos registrieren.',
          'E-Mail bestätigen: den Link in der Bestätigungsmail antippen.',
          'Schlüssel erstellen: {{https://www.virustotal.com/gui/my-apikey|virustotal.com/gui/my-apikey}} → **API Key** kopieren.',
          'Schlüssel einfügen: Einstellungen → „🛡 Schutz …“ → **🔑 VirusTotal-Schlüssel** → einfügen → **Speichern**.'
        ] },
        { p: 'VirusTotal bekommt nur den [[Fingerabdruck]] einer Datei, nie die Datei selbst, und nur wenn du bei einem Anhang auf **VirusTotal fragen** tippst. Die kostenlose Nutzung erlaubt wenige Abfragen pro Minute.' }
      ]
    },
    {
      id: 'virenschutz-ergebnisse', titel: 'Virenschutz: Was die Ergebnisse bedeuten',
      bloecke: [
        { p: '**🛡 Schutz: nichts aufgefallen** – keine Regel und keine Liste hat angeschlagen. Das ist keine Garantie.' },
        { p: '[[Hinweis]] – eine Regel ist aufgefallen, zum Beispiel „Antworten gehen an eine andere Adresse“. Genauer hinsehen, im Zweifel den Absender auf anderem Weg fragen.' },
        { p: '[[Befund]] – eine Datei oder ein Link steht in einer [[Schutzlisten|schutzlisten]]-Liste. Anhang nicht öffnen, Link nicht antippen.' },
        { p: '**nicht geprüft** – zum Beispiel ohne [[Zugangsschlüssel]], bei gesperrtem [[Speicherort]] oder ausgeschaltetem [[Internetschalter|internet]]. Der Grund steht dabei.' },
        { p: '**VirusTotal: 3 von 70 Scannern melden etwas** – so viele Virenscanner halten die Datei für gefährlich. Schon 1–2 Meldungen sind ein Grund zur Vorsicht.' },
        { id: 'helfer-app', p: '**Mit Virenscanner-App prüfen** gibt einen Anhang nach einer Warnung an eine installierte Virenscanner-App weiter (zum Beispiel eines bekannten Herstellers). Die Datei verlässt dabei den geschützten Ordner.' },
        { p: '**Alles prüfen** (in der Schutz-Karte) vergleicht alle Mail-Anhänge im Ordner und alle eingelesenen Dateien mit der Liste bekannter Schaddateien.' }
      ]
    },
    {
      id: 'aktualisierung', titel: 'Virenschutz: Automatische Aktualisierung',
      bloecke: [
        { p: 'Die Listen aktualisieren sich von selbst: neue Einträge alle 12 Stunden, die große Gesamtliste etwa monatlich und **automatisch nur im WLAN**. **Jetzt aktualisieren** lädt sofort, auch mobil.' },
        { p: 'Ist der [[Internetschalter|internet]] aus, wird nichts geladen. Schlägt ein Abruf fehl, bleibt die alte Liste gültig; der nächste Versuch kommt frühestens nach 3 Stunden. Abschalten: Haken bei „Listen automatisch aktualisieren“ entfernen.' }
      ]
    },
    {
      id: 'internet', titel: 'Internet nur für diese App aus- und einschalten',
      bloecke: [
        { p: '**App-Menü → App vom Internet trennen.** Danach heißt derselbe Schalter **Internetzugriff wieder erlauben**. Die Wahl bleibt nach einem Neustart erhalten. WLAN, Mobilfunk und andere Apps bleiben unverändert; lokale Suche, Originale und Entwürfe funktionieren weiter.' }
      ]
    },
    {
      id: 'grenzen', titel: 'Grenzen und was noch kommt',
      bloecke: [
        { p: 'Noch offen: Senden großer Anhänge (Anbieter erlauben meist 25–50 MB), Passwortwechsel für den Speicherort, Microsoft/Outlook, ein Virenscanner direkt auf dem Gerät (ClamAV), Bedeutungssuche mit Modell in der App. Nichts davon ist bisher an deinem Tablet gemessen.' },
        { p: 'Dieses Handbuch wird mit jeder Version ergänzt.' }
      ]
    }
  ],
  begriffe: [
    { name: 'Befund', text: 'Eine Datei oder Adresse steht in einer Liste bekannter Schadsoftware oder gefährlicher Links. Nicht öffnen.' },
    { name: 'Ersatzschlüssel', text: 'Fünf Teile, aus denen sich das Passwort des [[Tresor]]s wiederherstellen lässt; drei genügen. Sie gelten nicht für das Passwort des [[Speicherort]]s.' },
    { name: 'Fingerabdruck', text: 'Eine aus dem Dateiinhalt berechnete Zahlenfolge (SHA-256). Gleiche Datei = gleicher Fingerabdruck; aus ihm lässt sich die Datei nicht zurückgewinnen. Deshalb darf er für Vergleiche nach außen gehen.' },
    { name: 'Hinweis', text: 'Eine Regel ist aufgefallen (zum Beispiel ein Link, der woanders hinführt, als er anzeigt). Kein Urteil, sondern ein Grund zum Hinsehen.' },
    { name: 'Internetschalter', text: 'Schalter im App-Menü, der nur Private Brain Pro vom Internet trennt. Siehe [[Internet aus- und einschalten|internet]].' },
    { name: 'Katalog', text: 'Das kleine Verzeichnis, in dem die App sich die Bedeutung jeder Datei merkt (Steckbrief, Stichwörter, Zeiger auf das Original). Die Suche arbeitet mit ihm.' },
    { name: 'Katalogsicherung', text: 'Eine verschlüsselte Kopie des [[Katalog]]s im [[Speicherort]]. Sie wird nach jeder Änderung automatisch geschrieben.' },
    { name: 'Original', id: 'original', text: 'Die eingelesene Datei selbst. Die App verändert Originale nie; mit [[Speicherort]] liegt zusätzlich eine verschlüsselte Kopie im Ordner.' },
    { name: 'Phishing', text: 'Betrugsmail, die sich als Bank, Paketdienst oder Firma ausgibt, um Passwörter oder Geld zu erbeuten. Typisch: Zeitdruck, gefälschter Absender, Link mit fremdem Ziel. Die [[Spam- und Betrugsregeln|regeln]] erkennen solche Muster.' },
    { name: 'Schutzlisten', text: 'Listen bekannter Schaddateien (MalwareBazaar) und gefährlicher Links (URLhaus) von abuse.ch. Sie liegen verschlüsselt im [[Speicherort]] unter „Schutzlisten“, zum Beispiel „Schaddateien-MalwareBazaar“ – nie im Tablet-Speicher.' },
    { name: 'Spam- und Betrugsregeln', id: 'regeln', text: 'Prüfungen ohne Internet: Hat der Mailanbieter den Absender bestätigt (SPF, DKIM, DMARC)? Geht die Antwort an eine fremde Adresse? Nennt der Name eine Firma, deren Adresse fehlt? Sieht die Adresse einer bekannten nur ähnlich? Führt ein Link woanders hin? Kurzlinks, Druck und Geldforderungen, Anhänge, die Programme starten können. Ergebnis ist ein [[Hinweis]].' },
    { name: 'Speicherort', id: 'speicherort-begriff', text: 'Der Ordner auf Tablet oder SD-Karte, den du in den Einstellungen gewählt hast. Alles darin ist mit deinem Passwort verschlüsselt. Siehe [[Speicherort und Verschlüsselung|speicherort]].' },
    { name: 'Tresor', text: 'Der verschlüsselte Bereich „Tresor — Verschlüsselung“ mit eigenem Passwort und [[Ersatzschlüssel]]n. Er ist getrennt vom [[Speicherort]].' },
    { name: 'Zugangsschlüssel', text: 'Persönlicher Schlüssel (auch „API-Key“ oder „Auth-Key“), mit dem ein Anbieter wie abuse.ch oder VirusTotal dich erkennt. Kostenlos; Eingabe nur im Android-Fenster; liegt verschlüsselt im [[Speicherort]]. Anleitung: [[abuse.ch|schluessel-abuse]], [[VirusTotal|schluessel-vt]].' }
  ]
};
