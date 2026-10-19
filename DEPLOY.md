# Private Brain auf dem eigenen Server (family-projekt.de) betreiben

Ziel: die **ganze App** läuft auf **deinem** Server (dort, wo schon das Relais
`relay.family-projekt.de` liegt). Dann liegt das Bedeutungs-Modell gleich daneben unter
**derselben Adresse** → **kein GitHub-100-MB-Limit, kein CORS, kein fremder Server**, und die
Suche versteht Bedeutung **erst-parteilich und offline**.

> Hinweis: Das ist echte Server-Arbeit (ein paar Befehle auf dem VPS). Wenn dir das zu viel
> ist, sag Bescheid — der **HuggingFace-Weg** braucht **null** Server-Arbeit (Modell lädt
> einmal beim ersten Suchen, danach im Browser offline). Die App läuft in beiden Fällen.

## Schritt für Schritt

**1. App-Dateien auf den Server holen.** Auf dem VPS in einen Web-Ordner klonen:

```bash
git clone https://github.com/lausiklauskn-png/Privat-Brain.git
cd Privat-Brain
```

**2. Modell einmalig herunterladen** (auf dem Server, kein 100-MB-Limit):

```bash
bash tools/fetch-model.sh
```

Danach liegt `models/Xenova/multilingual-e5-small/onnx/model_quantized.onnx` (~113 MB) da.

**3. Statisch ausliefern.** Irgendein Static-Webserver reicht — die App ist reines
HTML/JS, kein Backend. Beispiele (einer genügt):

- **Caddy** (automatisch HTTPS), `Caddyfile`:
  ```
  company-brain.family-projekt.de {
      root * /pfad/zu/Privat-Brain
      file_server
  }
  ```
- **nginx** (Server-Block):
  ```
  server {
      server_name company-brain.family-projekt.de;
      root /pfad/zu/Privat-Brain;
      index index.html;
      location / { try_files $uri $uri/ /index.html; }
  }
  ```
- **Schnelltest** (nur zum Prüfen, nicht dauerhaft): `python3 -m http.server 8080`

**4. Aufrufen** unter deiner neuen Adresse (z. B. `https://company-brain.family-projekt.de/`),
einmal **Strg+Umschalt+R**. Unter *Einstellungen → „Echtes Bedeutungs-Modell"* muss jetzt
**„aktiv · selbst-gehostet"** stehen (das Modell kam von deinem Server, nicht von HuggingFace).

## Warum das ohne Modul-Umbau funktioniert

Modul 03 sucht das Modell zuerst **an der eigenen Adresse** unter `/models/…` (Funktion
`detectModelSource`). Weil jetzt App **und** Modell auf demselben Server (gleiche Origin)
liegen, findet es das Modell dort → lädt lokal, offline, erst-parteilich. Kein CORS, kein
100-MB-Limit, keine Änderung an den byte-1:1-Modulen.

## Zwei kleine Anpassungen (optional, wenn die Adresse wechselt)

- **Spore-Adresse:** in `modules/rendezvous-init.js` das Feld `endpoint` in `CFG` auf die
  neue URL setzen (nur Metadaten in der Visitenkarte; nicht kritisch).
- **Nichts weiter** — alle Pfade in der App sind relativ (`./…`), sie läuft unter jeder
  Adresse und jedem Unterpfad.

## GitHub-Pages-Variante (Alternative, falls du doch nicht auf den Server willst)

Der Action-Knopf „Embedding-Modell ins Repo holen" **scheitert auf GitHub Pages**, weil die
Modell-Datei (113 MB) GitHubs 100-MB-Limit sprengt. Für Pages bräuchte es **Git LFS**
(eigenes Kontingent ~1 GB/Monat). Deshalb ist der eigene Server der saubere Weg.
