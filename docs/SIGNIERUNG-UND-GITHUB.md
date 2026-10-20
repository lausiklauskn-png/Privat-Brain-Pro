# Gemeinsame Signierung für Claude und Codex

Beide Sitzungen verwenden dieselbe bestehende Android-Vorschau-Identität:

- Paket: `de.familyprojekt.privatebrain.pro.preview`
- Zertifikat SHA-256: `362ee70d28da9c4b51e37057c3519a3e6eb2c679059dfb9f56b4003f9374fa80`
- Freigabe: ausschließlich `PB_SIGNING_UNLOCK` im GitHub-Environment `android-preview`.
- Dauerhafte Sicherung im Repo: ausschließlich `signing/android-release.enc.json`
  und das öffentliche `signing/android-certificate.json`.

Die Werkzeuge sind aus [Workflow-PDF-Pro](https://github.com/lausiklauskn-png/Workflow-PDF-Pro/tree/f403aa1188232e2679fe664ebbdc2a6301ce6106/tools/signing)
übernommen und angepasst. AES-256-GCM, Version 1, zufällige 12-Byte-Nonce,
16-Byte-Authentifizierungstag und authentifizierter JSON-Kopf entsprechen dessen
Format; App-Kennung und Formatname sind an Private Brain gebunden. Der verschlüsselte
Inhalt enthält zusätzlich ein getrenntes `keyPassword`. JKS und PKCS12 bleiben
unverändert. Es gibt hier **keinen** `init`-Befehl und keine Erzeugung eines neuen
Produktionsschlüssels. Der Produktions-Pin lässt sich nicht per Parameter ersetzen.

## Aktueller Stand und Voraussetzung

Der ursprüngliche Vorschau-Keystore wurde am 2026-10-20 in der älteren
Codex-Umgebung gefunden. Das Zertifikat entspricht dem oben festgelegten Pin;
auch der private Schlüssel wurde mit den vorhandenen Zugangsdaten geprüft.
Die Originaldatei blieb unverändert. Es wurde keine neue Signieridentität erzeugt.

Der öffentliche Empfänger stammt aus dem erfolgreichen
[recipient-Lauf 39481762663](https://github.com/lausiklauskn-png/Privat-Brain-Pro/actions/runs/39481762663)
auf main. Ausschließlich die age-verschlüsselte Importdatei wurde über
[PR #37](https://github.com/lausiklauskn-png/Privat-Brain-Pro/pull/37) übertragen.
Im [Importlauf 39482128805](https://github.com/lausiklauskn-png/Privat-Brain-Pro/actions/runs/39482128805)
waren Entschlüsselung, Original-Pin-/Privatschlüsselprüfung, Versiegelung und
unabhängige Wiederherstellung erfolgreich. Der Gesamtlauf ist rot, weil GitHub
Actions keine PR anlegen darf; deshalb wird der bereits erzeugte, geprüfte
Übernahmezweig gemäß Ersatzweg durch die autorisierte Sitzung übernommen.
Nach dem Merge ist weiterhin die Operation **check auf main** auszuführen.

`signing/android-release.enc.json` enthält ausschließlich das verschlüsselte
Identitätspaket; `signing/android-certificate.json` den öffentlichen Pin.
Die Freigabe bleibt im Environment `android-preview` und muss keiner KI mitgeteilt
werden. Keystore und Zugangsdaten liegen nicht im Klartext im Repository.
Aus einer öffentlichen APK lässt sich der private Schlüssel nicht wiederherstellen.

## Einmalige Übernahme: Einzelschritte für Klaus

Diese Schritte gelten, sobald die Werkzeug-PR auf main gemergt ist.

1. [Actions öffnen](https://github.com/lausiklauskn-png/Privat-Brain-Pro/actions/workflows/signing-identity.yml).
2. **Run workflow** drücken, Branch **main**, Operation **recipient** auswählen.
3. Den grünen Lauf öffnen. In der Zusammenfassung steht eine öffentliche Zeile,
   die mit `age1` beginnt. Diese Zeile darf kopiert und an die ältere Sitzung
   gegeben werden. Niemals den Freigabewert kopieren.
4. Der älteren Sitzung den untenstehenden Auftrag schicken. Sie muss zuerst
   tatsächlich die Originaldatei finden und deren Zertifikat prüfen.
5. Nach deren PR und grüner CI den verschlüsselten Import auf main übernehmen.
6. Denselben Workflow öffnen, Operation **import** wählen und starten.
7. Der Lauf prüft den Original-Pin und den privaten Schlüssel, versiegelt das Paket,
   entschlüsselt es unabhängig erneut und erstellt eine PR. Diese PR enthält nur
   das verschlüsselte Paket, den öffentlichen Pin und die Entfernung von `import.age`.
8. Die PR nach grüner CI mergen. Danach Operation **check** starten. Nur ein grüner
   Lauf bestätigt die Wiederherstellung des tatsächlichen Vorschau-Schlüssels.

Falls GitHub der Actions-Bot-PR widerspricht: Der erfolgreiche Import legt das
**verschlüsselte** Paket zusätzlich als `sealed-preview-identity` ab. Eine Sitzung
mit Push-Recht darf genau diese zwei Dateien in einer PR übernehmen und
`signing/import.age` entfernen. Keine entschlüsselten Dateien herunterladen.
Bot-PRs mit `GITHUB_TOKEN` lösen möglicherweise keine weitere CI aus; dann muss
eine Sitzung die PR über ihre eigene Push-Berechtigung mit einem nachvollziehbaren
Commit aktualisieren, damit die regulären Prüfungen laufen.

### Auftrag zum Kopieren an die Sitzung mit dem ursprünglichen Schlüssel

```text
Private Brain Pro: Bitte suche zuerst die ursprüngliche Vorschau-Schlüsseldatei
und die zugehörigen Store-/Key-Passwörter und den Alias in deiner zugänglichen
Umgebung. Erzeuge KEINEN neuen Schlüssel. Der notwendige Zertifikats-Pin ist
362ee70d28da9c4b51e37057c3519a3e6eb2c679059dfb9f56b4003f9374fa80.
Lies docs/SIGNIERUNG-UND-GITHUB.md und verwende die aktuellen tools/signing.
Der öffentliche age1-Empfänger wird separat aus dem GitHub-recipient-Lauf geliefert.
Prüfe die Originaldatei und verschlüssele sie samt beiden Passwörtern und Alias
mit encrypt-import an genau diesen Empfänger. Committe ausschließlich
signing/import.age auf einem eigenen Zweig und erstelle eine PR.
Keine Schlüssel/Passwörter/Freigaben im Klartext in Git, Logs oder Chat.
Falls der Originalschlüssel nicht auffindbar ist, sage das ausdrücklich;
eine andere KI-Sitzung besitzt ihn nicht automatisch.
```

### Ausführung durch die ältere Sitzung

Die Sitzung installiert die hashgebundene Python-Abhängigkeit in einer lokalen
virtuellen Umgebung. `PB_SIGNING_PYTHON` zeigt auf deren Interpreter. Die
vorhandenen Zugangsdaten werden sicher als `PB_EXISTING_STORE_PASSWORD`,
`PB_EXISTING_KEY_PASSWORD` und `PB_EXISTING_KEY_ALIAS` gebunden; keine Werte in
Shell-Historie oder Chat schreiben. Der Aufruf lautet:

```sh
node tools/signing/cli.mjs encrypt-import /sicherer/Pfad/zum/Original-Keystore age1...öffentlicherEmpfänger
```

Hierfür wird `PB_SIGNING_UNLOCK` **nicht** benötigt. Das Werkzeug prüft vor dem
Verschlüsseln das Original-Zertifikat und die Verwendbarkeit des privaten Schlüssels.
`signing/import.age` wird ausschließlich neu angelegt, niemals überschrieben.

## Was innerhalb von Actions geschieht

HKDF-SHA-256 leitet aus der vorhandenen 256-Bit-Freigabe mit getrenntem Import-
Kontext `private-brain-pro/import/v1` und der App-/Environment-Kennung einen
X25519-age-Schlüssel ab. Nur dessen öffentlicher Empfänger wird ausgegeben.
Der Import verwendet das Standardformat age v1 über die Rust-Implementierung
`pyrage` (Version und Linux-Wheel-SHA-256 festgelegt). Weder abgeleiteter privater
age-Schlüssel noch entschlüsselter Import werden als Artefakt oder Datei abgelegt.
Sie werden nur über interne Prozess-Pipes weitergereicht. Private Keystore-
Arbeitskopien liegen ausschließlich in temporären Verzeichnissen mit Modus 0700,
Dateien 0600 und werden auch bei Fehlern entfernt. Laufende Prozesse und GitHub
Runner müssen dafür vertrauenswürdig sein; Main-/Environment-Schutz bleibt wichtig.

Import und Wiederherstellung verlangen immer den fest kodierten Original-Pin.
`keytool -certreq` prüft zusätzlich den privaten Schlüssel und dessen Passwort,
nicht nur das öffentliche Zertifikat. Vorhandene Identitätspakete werden nicht
automatisch ersetzt. Die Freigabe wird nur den benötigten Actions-Schritten
übergeben. Beim Release erhalten die Gradle-Prozesse ausschließlich temporäre,
maskierte Jobwerte; im abschließenden Schritt wird die Schlüsseldatei entfernt.
Das Paket ist nur für den Vorschaukanal zugelassen; eine stabile App braucht eine
eigene separat geprüfte Identität und wird mit diesem Paket verweigert.

## Prüfen und sichern

`node --test tools/signing/test-*.mjs` prüft mit einem getrennten, kurzlebigen
Testschlüssel unter anderem Standard-age-Import, AES-GCM-Authentifizierung,
getrennte Passwörter, JKS/PKCS12, Manipulationen, falsche Freigabe, Pin und
Aufräumen. Für positive Tests wird nur eine temporäre Modulkopie an den
Test-Pin gebunden; der echte Produktionsweg weist diesen Testschlüssel ab.
Die Tests allein ersetzen keine Prüfung des tatsächlichen Originals; diese wurde
im oben verlinkten Importlauf zusätzlich ausgeführt.

Lokal am 2026-10-20 ausgeführt: Installation des festgelegten Wheels mit
`pip --require-hashes --only-binary=:all: --no-deps` erfolgreich; alle **11**
Signierprüfungen bestanden, keine übersprungen. `actionlint` prüfte die drei
betroffenen Workflows ohne Fehler. Der GitHub-Import mit dem tatsächlichen Original ist oben dokumentiert. Die echte
signierte .16-auf-.17-Updateprobe ist separat vor der Veröffentlichung zu prüfen.

Die Freigabe getrennt vom verschlüsselten Repo sichern. Zusätzlich eine sichere
Offline-Sicherung des ursprünglichen Keystores und beider Passwörter behalten.
Den Wert von `PB_SIGNING_UNLOCK` nicht ersetzen: Ein anderer Wert kann das Paket
nicht entschlüsseln und ergibt einen anderen Import-Empfänger. Die vier alten
`ANDROID_KEYSTORE_*`-/Alias-Secrets **erst nach erfolgreichem Release und
öffentlicher Downloadprüfung** löschen. Bis dahin nicht löschen oder überschreiben.

[Veröffentlichungsablauf, Updateprobe und gleicher Signierer](VEROEFFENTLICHEN.md).
