#!/usr/bin/env bash
# Holt das BILD-Beschreiber-Modell (Xenova/vit-gpt2-image-captioning) auf deinen Server
# bzw. in den Termux-Ordner, aus dem du Private Brain auslieferst. Leicht, WASM-tauglich
# (kein WebGPU nötig) — realistisch fürs Tablet. Danach liegt es unter models/… neben der
# App und wird erst-parteilich, offline geladen (Stufe 3b).
#
# Ausführen im Ordner, aus dem du Private Brain auslieferst (dort, wo index.html liegt):
#   bash tools/fetch-image-model.sh
set -euo pipefail

MODEL="Xenova/vit-gpt2-image-captioning"
BASE="https://huggingface.co/$MODEL/resolve/main"
DIR="models/$MODEL"
mkdir -p "$DIR/onnx"

# Kleine Konfig-/Tokenizer-Dateien
for f in config.json generation_config.json preprocessor_config.json \
         tokenizer.json tokenizer_config.json vocab.json merges.txt special_tokens_map.json; do
  echo "Lade $f ..."
  curl -sSL --fail --retry 3 -o "$DIR/$f" "$BASE/$f" || echo "  (übersprungen: $f nicht vorhanden)"
done

# Die großen ONNX-Brocken (Encoder + Decoder, quantisiert)
for f in encoder_model_quantized.onnx decoder_model_merged_quantized.onnx; do
  echo "Lade onnx/$f (großer Brocken) ..."
  curl -sSL --fail --retry 3 -o "$DIR/onnx/$f" "$BASE/onnx/$f"
done

# Prüfen: echtes JSON + ONNX groß genug (kein abgebrochener Download / keine Fehlerseite)
head -c1 "$DIR/config.json" | grep -q '{' || { echo "FEHLER: config.json ist kein JSON"; exit 1; }
python3 -c "import json; json.load(open('$DIR/config.json'))" 2>/dev/null \
  || { echo "FEHLER: config.json nicht lesbar"; exit 1; }
SZ=$(stat -c%s "$DIR/onnx/encoder_model_quantized.onnx")
echo "Encoder-ONNX-Größe: $SZ Bytes"
test "$SZ" -gt 3000000 || { echo "FEHLER: ONNX zu klein — Download fehlgeschlagen?"; exit 1; }

echo
echo "✓ Bild-Modell liegt unter $DIR/"
echo
echo "WEG A — App + Modell vom SELBEN Server (einfachst, kein CORS):"
echo "  Liefere Private Brain aus DIESEM Ordner aus (index.html + models/ + modules/ + pb-caption.js)."
echo "  In den Einstellungen: 'Lokalen Bild-Beschreiber aktivieren', Server-Adresse LEER lassen."
echo
echo "WEG B — App auf github.io, Modell auf DEINEM Server (fremdes Gerät kommt dran):"
echo "  Lege den Ordner models/ auf deinen Server, z. B. erreichbar unter"
echo "    https://dein-server.de/pb-models/   (dann liegt darin Xenova/vit-gpt2-image-captioning/…)"
echo "  In den Einstellungen dieses als 'Modell-Server-Adresse' eintragen."
echo "  WICHTIG: der Server muss CORS erlauben. Beispiel (nginx), für den Modell-Pfad:"
echo "    add_header Access-Control-Allow-Origin \"*\" always;"
echo "  Caddy:  header /pb-models/* Access-Control-Allow-Origin \"*\""
