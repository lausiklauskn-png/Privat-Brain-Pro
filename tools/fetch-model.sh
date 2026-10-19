#!/usr/bin/env bash
# Holt das Bedeutungs-Modell (Xenova/multilingual-e5-small) DIREKT auf deinen Server
# (family-projekt.de) — dort gibt es KEIN 100-MB-Limit wie bei GitHub. Danach liegt es
# unter models/… neben der App und wird erst-parteilich, offline, ohne fremden Server geladen.
#
# Ausführen im Ordner, aus dem du Private Brain auslieferst (dort, wo index.html liegt):
#   bash tools/fetch-model.sh
set -euo pipefail

BASE="https://huggingface.co/Xenova/multilingual-e5-small/resolve/main"
DIR="models/Xenova/multilingual-e5-small"
mkdir -p "$DIR/onnx"

for f in config.json tokenizer.json tokenizer_config.json special_tokens_map.json; do
  echo "Lade $f ..."
  curl -sSL --fail --retry 3 -o "$DIR/$f" "$BASE/$f"
done
echo "Lade onnx/model_quantized.onnx (~113 MB — der große Brocken) ..."
curl -sSL --fail --retry 3 -o "$DIR/onnx/model_quantized.onnx" "$BASE/onnx/model_quantized.onnx"

# Prüfen: echtes JSON, ONNX groß genug (kein abgebrochener Download / keine Fehlerseite)
head -c1 "$DIR/config.json" | grep -q '{' || { echo "FEHLER: config.json ist kein JSON"; exit 1; }
python3 -c "import json; json.load(open('$DIR/config.json')); json.load(open('$DIR/tokenizer.json'))" 2>/dev/null \
  || { echo "FEHLER: config/tokenizer nicht lesbar"; exit 1; }
SZ=$(stat -c%s "$DIR/onnx/model_quantized.onnx")
echo "ONNX-Größe: $SZ Bytes"
test "$SZ" -gt 5000000 || { echo "FEHLER: ONNX zu klein — Download fehlgeschlagen?"; exit 1; }

echo
echo "✓ Modell liegt unter $DIR/"
echo "  Liefere Private Brain aus DIESEM Ordner aus (index.html + models/ + modules/)."
echo "  Die App erkennt das Modell dann automatisch am eigenen Server (erst-parteilich, offline)."
