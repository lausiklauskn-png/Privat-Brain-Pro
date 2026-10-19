#!/usr/bin/env python3
"""Sabotage only disposable copies; require the expected behavioral failure."""
import os
from pathlib import Path
import shutil
import subprocess
import tempfile

ROOT = Path(__file__).resolve().parents[1]
CASES = [
    ("ki-klartext", "assets/mail-workspace.js", "boundary+'\\n'+p.text+'\\nENDE-'+boundary", "boundary+'\\n'+fullText(r)+'\\nENDE-'+boundary", "tools/e2e-mail-workspace.mjs", "KI erhält Platzhalter und keine Anhänge oder persönlichen Werte"),
    ("falscher-versandstatus", "assets/mail-workspace.js", "r.mailFolder='outbox'", "r.mailFolder='sent'", "tools/e2e-mail-workspace.mjs", "Postausgang ist eine Warteschlange und meldet keinen Versand"),
    ("entwurf-verloren", "assets/mail-workspace.js", "if(!dirty)return true;if(!confirm(T('discard')))return false;", "if(true)return true;", "tools/e2e-mail-workspace.mjs", "Nicht gespeicherte KI-Antwort bleibt bei Abbruch erhalten"),
    ("zuordnung-verloren", "assets/mail-workspace.js", "SbkimPseudonym.rehydrate(response.value,responseMap||pseudo.map)", "SbkimPseudonym.rehydrate(response.value,{})", "tools/e2e-mail-workspace.mjs", "Antwort bekommt echte Angaben lokal zurück"),
    ("kopie-falsche-bytes", "assets/workspace.js", "await writer.write(item.file)", "await writer.write(new Blob(['kaputt']))", "tools/e2e-workspace.mjs", "Kopie enthält die echten Dateibytes im gewählten Ordner"),
    ("datei-ueberschrieben", "assets/workspace.js", "for (let n=0;;n++)", "for (let n=0;n<0;n++)", "tools/e2e-workspace.mjs", "Namenskollision überschreibt keine Datei"),
    ("falscher-schluesselanbieter", "assets/mail-workspace.js", "if(!AI.key || AI.provider!=='mistral')", "if(!AI.key)", "tools/e2e-mail-workspace.mjs", "Schlüssel eines anderen Anbieters wird nicht an Mistral gesendet"),
    ("header-injektion", "assets/mail-workspace.js", "if(/[\\r\\n\\x00-\\x1f\\x7f]/.test(s))throw new Error('Invalid mail header');", "", "tools/e2e-mail-workspace.mjs", "Header-Injektion wird vor dem Export zurückgewiesen"),
]


def run(root, script, name):
    env = os.environ.copy()
    env.setdefault("CB_CHROMIUM", "/usr/bin/chromium")
    result = subprocess.run(["node", script], cwd=root, env=env, capture_output=True, text=True, timeout=120)
    output = result.stdout + result.stderr
    Path(f"/tmp/brain-counterproof-{name}.log").write_text(output)
    return result.returncode, output


def main():
    # A crashing starting point cannot demonstrate that sabotage was detected.
    for script in ("tools/e2e-mail-workspace.mjs", "tools/e2e-workspace.mjs"):
        code, _ = run(ROOT, script, Path(script).stem + "-baseline")
        if code:
            raise SystemExit("Ausgangsprobe ist nicht grün: " + script)
    print("Beide Ausgangsproben grün", flush=True)
    caught = wrong = missed = 0
    for name, filename, old, new, script, marker in CASES:
        with tempfile.TemporaryDirectory(prefix="brain-gegenprobe-") as temporary:
            copy = Path(temporary) / "repo"
            shutil.copytree(ROOT, copy, ignore=shutil.ignore_patterns(".git", "node_modules", "*.log", "*.onnx"))
            (copy / "node_modules").symlink_to(ROOT / "node_modules", target_is_directory=True)
            file = copy / filename
            text = file.read_text()
            if text.count(old) != 1:
                raise SystemExit("Kein eindeutiger Anker: " + name)
            file.write_text(text.replace(old, new, 1))
            code, output = run(copy, script, name)
            if code and "AssertionError" in output and marker in output:
                caught += 1
                print("GEFANGEN: " + name + " — " + marker, flush=True)
            elif code:
                wrong += 1
                print("FALSCHER GRUND: " + name, flush=True)
            else:
                missed += 1
                print("DURCHGERUTSCHT: " + name, flush=True)
    print(f"{caught} gefangen · {missed} durchgerutscht · {wrong} aus falschem Grund", flush=True)
    return int(bool(wrong or missed))


if __name__ == "__main__":
    raise SystemExit(main())
