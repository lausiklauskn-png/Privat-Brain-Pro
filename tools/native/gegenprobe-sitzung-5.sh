#!/bin/bash
# Gegenprobe Sitzung 5: Sabotagen in einer Wegwerf-Kopie von www/, jede muss eine benannte rote Zeile werfen (12 Fälle).
# Aufruf: bash tools/native/gegenprobe-sitzung-5.sh [Repo-Verzeichnis] [Unterordner der Dateien, V3: assets/]. Node 24 und CB_CHROMIUM wie bei den Proben.
set -u
REPO="${1:-.}"; SUB="${2:-}"; : "${CB_CHROMIUM:=/usr/bin/chromium}"; export CB_CHROMIUM
W=$(mktemp -d)
gefangen=0; durch=0; falsch=0; tot=0
fall(){ # name datei muster ersatz erwartet
  local name="$1" datei="$2" muster="$3" ersatz="$4" erwartet="$5"
  rm -rf "$W/www"; cp -r "$REPO/www" "$W/www"
  local f="$W/www/$SUB$datei"
  if ! grep -qF -- "$muster" "$f"; then echo "TOTER ANKER: $name ($datei: $muster)"; tot=$((tot+1)); return; fi
  python3 - "$f" "$muster" "$ersatz" <<'PY'
import sys,pathlib
p=pathlib.Path(sys.argv[1]); t=p.read_text(); assert sys.argv[2] in t; p.write_text(t.replace(sys.argv[2],sys.argv[3]))
PY
  local out; out=$(cd "$REPO" && PB_WWW="$W/www" node tools/native/test-design-26.mjs 2>&1); local rc=$?
  local rot; rot=$(echo "$out" | grep -m1 -E "AssertionError|✗|FAIL|Error" )
  if [ $rc -eq 0 ]; then echo "DURCHGERUTSCHT: $name"; durch=$((durch+1))
  elif echo "$rot" | grep -qF -- "$erwartet"; then echo "gefangen: $name -> $rot"; gefangen=$((gefangen+1))
  else echo "AUS FALSCHEM GRUND: $name -> $rot"; falsch=$((falsch+1)); fi
}
fall "keine Neigung (MAX_TILT 0)" pb-3d.js "const MAX_TILT = 3;" "const MAX_TILT = 0;" "tilt"
fall "Streifen zurück (::before schmal)" pb-3d.css "inset: 0; width: auto; height: auto; z-index: -1" "inset: 0; width: 4px; height: auto; z-index: -1" "stripe"
fall "keine Tönung (::before ohne Farbe)" pb-3d.css "background: linear-gradient(150deg, var(--acc) 0%, var(--acc) 18%, transparent 78%);" "background: none;" "gradient comes from the chosen theme"
fall "Neigung trotz weniger Bewegung" pb-3d.js "if (!node || still() || event.pointerType === 'touch') return;" "if (!node || event.pointerType === 'touch') return;" "weniger Bewegung"
fall "Neigung bleibt nach dem Verlassen" pb-3d.js "if (node && !(event.relatedTarget && node.contains(event.relatedTarget))) reset(node);" "" "resets the tilt"
fall "Vorschau wieder im Fenster" pb-zielordner.js "preview.addEventListener('click', event => { event.preventDefault(); event.stopImmediatePropagation(); showPreview(); }, true);" "" "not in a window"
fall "Zielordner nach dem Kopieren nicht gezeigt" pb-zielordner.js "state = { kind: 'done', name: handle.name, tree, cut: budget.cut };" "state = null;" "after copying"
fall "ⓘ-Satz fehlt" pb-zielordner.js "function language() { why.textContent = words().why; if (state) render(); }" "function language() { why.textContent = ''; if (state) render(); }" "Kategorien apart"
fall "Kategorien ohne 3D" pb-3d.js "const SELECTOR = '#panel-dash .tile, #groups > .grp, .pb-overview-topics > .groups > .grp';" "const SELECTOR = '#panel-dash .tile';" "same 3D buttons"
fall "Ohne Ordnerzugriff still" pb-zielordner.js "if (typeof window.showDirectoryPicker !== 'function') { state = { kind: 'note', text: 'noAccess' }; render(); return; }" "if (typeof window.showDirectoryPicker !== 'function') { return; }" "without folder access"
fall "Nebentext zu blass" pb-3d.css "color: color-mix(in srgb, var(--mut) 84%, var(--ink));" "color: color-mix(in srgb, #c4c8d0 100%, var(--ink));" "text stays readable"
fall "Tönung nur in einem Thema" pb-3d.css "background: linear-gradient(150deg, var(--acc) 0%, var(--acc) 18%, transparent 78%);" "background: linear-gradient(150deg, #2563eb 0%, #2563eb 18%, transparent 78%);" "every theme"
echo "=== $gefangen gefangen · $durch durchgerutscht · $falsch aus falschem Grund · $tot tote Anker"
rm -rf "$W"
