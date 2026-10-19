#!/usr/bin/env bash
# Gegenprobe zur Sprach-Probe des Mycel-Fensters.
#
# ⚠ SIE LÄUFT IN EINER WEGWERF-KOPIE, nicht im echten Baum — eine liegengebliebene
# Sabotage sieht danach wie ein Baufehler aus (Sage-Lehre, 2026-09-14). node_modules
# wird VERWIESEN, nicht kopiert.
#
# ⚠ SIE URTEILT AN DER ROTEN ZEILE, nicht an „rot ja/nein". Ein Fall, der die Probe
# an einer FREMDEN Zusicherung umwirft, ist NICHT gefangen — er misst etwas anderes,
# als er zu messen glaubt.
set -u
WURZEL="$(cd "$(dirname "$0")/.." && pwd)"
KOPIE="$(mktemp -d)"; trap 'rm -rf "$KOPIE"' EXIT
cp -a "$WURZEL/." "$KOPIE/kopie" 2>/dev/null
rm -rf "$KOPIE/kopie/node_modules"
ln -s "$WURZEL/node_modules" "$KOPIE/kopie/node_modules"
cd "$KOPIE/kopie" || exit 2

W=modules/net-widget.js
P=tools/e2e-netwidget-sprache.mjs
gefangen=0; durch=0; falsch=0; tot=0

# Ausgangslage MUSS grün sein, sonst misst keiner der Fälle etwas.
if ! node "$P" 2>&1 | grep -q "0 fehlgeschlagen"; then
  echo "✗ ABBRUCH: die Probe ist schon OHNE Eingriff rot — kein Fall würde etwas messen."
  exit 2
fi
echo "Ausgangslage grün."; echo

fall () {           # $1 Name  $2 Anker  $3 Ersatz  $4 erwartete rote Zeile (Muster)
  local name="$1" anker="$2" ersatz="$3" trifft="$4"
  cp "$W" "$W.sicher"; cp "$P" "$P.sicher"
  local ziel="$W"; case "$anker" in PROBE:*) ziel="$P"; anker="${anker#PROBE:}";; esac
  # ⚠ GEMESSEN WIRD, OB SICH DIE DATEI WIRKLICH GEÄNDERT HAT — nicht, ob ein
  # grep den Anker findet. Ein Ersatztext darf den Anker enthalten (Einfügungen
  # tun das), und dann fände die Anker-Suche ihn danach immer noch. Genau daran
  # haben beim ersten Lauf zwei Fälle als "toter Anker" gemeldet, obwohl sie
  # tadellos sabotierten. (PWA-Toolpoint-Lehre, 2026-09-09.)
  local ergebnis
  ergebnis=$(python3 - "$ziel" "$anker" "$ersatz" <<'PYIN'
import sys
p,a,e = sys.argv[1], sys.argv[2], sys.argv[3]
s = open(p, encoding='utf-8').read()
if s.count(a) == 0: print("ANKER_FEHLT"); raise SystemExit
if s.count(a) > 1:  print("ANKER_MEHRFACH"); raise SystemExit
n = s.replace(a, e, 1)
if n == s: print("OHNE_WIRKUNG"); raise SystemExit
open(p, 'w', encoding='utf-8').write(n); print("GEAENDERT")
PYIN
)
  if [ "$ergebnis" != "GEAENDERT" ]; then
    echo "⊘ TOTER ANKER ($ergebnis): $name"; tot=$((tot+1))
    mv "$W.sicher" "$W"; mv "$P.sicher" "$P"; return
  fi
  local aus; aus=$(node "$P" 2>&1)
  local rot; rot=$(printf '%s\n' "$aus" | grep -m1 '^❌' || true)
  if [ -z "$rot" ]; then
    echo "✗ NICHT GEFANGEN: $name"; durch=$((durch+1))
  elif printf '%s' "$rot" | grep -q "$trifft"; then
    echo "✓ gefangen: $name"; gefangen=$((gefangen+1))
  else
    echo "⚠ ROT AUS FALSCHEM GRUND: $name"; echo "      $rot"; falsch=$((falsch+1))
  fi
  mv "$W.sicher" "$W"; mv "$P.sicher" "$P"
}

# 1 · eine englische Fassung leeren
fall "eine englische Fassung fehlt" \
  '"👥 Wer ist im Raum?":
      "👥 Who is in the room?"' \
  '"👥 Wer ist im Raum?":
      ""' \
  'Jeder Eintrag hat eine englische Fassung'

# 2 · eine Übersetzung wortgleich mit dem Deutschen
fall "eine Übersetzung ist wortgleich" \
  '"🗑 leeren":
      "🗑 clear"' \
  '"🗑 leeren":
      "🗑 leeren"' \
  'wortgleich'

# 3 · das abschließende Leerzeichen eines Bruchstücks fällt weg
fall "ein Bruchstück verliert sein Leerzeichen" \
  '"Fehler: ":
      "Error: "' \
  '"Fehler: ":
      "Error:"' \
  'Bruchstücke behalten ihre Form'

# 4 · ein T()-Aufruf auf einen Satz, den die Tabelle nicht kennt
fall "ein T()-Aufruf steht nicht in der Tabelle" \
  'T("🗑 leeren")' \
  'T("🗑 alles wegwerfen")' \
  'steht in der Tabelle'

# 5 · ein verwaister Eintrag (Übersetzung ohne deutschen Satz im Code)
fall "ein verwaister Tabellen-Eintrag" \
  '  var TEXTE = { en: {' \
  '  var TEXTE = { en: {
    "Diesen Satz sagt niemand":
      "Nobody says this sentence",' \
  'verwaist'

# 6 · der Sprachwechsel kommt nicht mehr an (Beobachter ausgebaut)
fall "der Sprachwechsel-Beobachter ist ausgebaut" \
  'new MutationObserver(beiSprachwechsel).observe(document.documentElement,' \
  'if (false) new MutationObserver(beiSprachwechsel).observe(document.documentElement,' \
  'Connect & sign in'

# 7 · die Rück-Abbildung fällt aus → englischer Rest im deutschen Fenster
fall "die Rück-Abbildung EN→DE fällt aus" \
  '    return Object.prototype.hasOwnProperty.call(RUECK, txt) ? RUECK[txt] : txt;' \
  '    return txt;' \
  'EN→DE'

# 8 · sprache() liefert immer Deutsch
fall "sprache() liefert immer Deutsch" \
  '      return l === "en" ? "en" : "de";' \
  '      return "de";' \
  'Connect & sign in'

# 9 · die benannte Grenze bricht: ru bekäme Englisch
fall "ru bekäme Englisch statt des deutschen Rückfalls" \
  '      return l === "en" ? "en" : "de";' \
  '      return l === "de" ? "de" : "en";' \
  'RU'

echo
echo "$gefangen gefangen · $durch durchgerutscht · $falsch aus falschem Grund · $tot tote Anker"
[ "$durch" -eq 0 ] && [ "$falsch" -eq 0 ] && [ "$tot" -eq 0 ]
