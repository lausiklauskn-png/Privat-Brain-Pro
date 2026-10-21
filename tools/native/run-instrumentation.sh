#!/usr/bin/env bash
set -euo pipefail
if (cd android && ./gradlew --no-daemon --max-workers=2 :app:connectedDebugAndroidTest); then
  python3 tools/native/assert-instrumentation.py
else
  # These isolated tests use no real accounts. Include failures in CI logs so
  # restricted environments do not need an additional artifact-download host.
  python3 - <<'PY'
from pathlib import Path
import xml.etree.ElementTree as ET
for path in Path('android/app/build/outputs/androidTest-results/connected').rglob('TEST-*.xml'):
    for case in ET.parse(path).getroot().iter('testcase'):
        for failure in list(case):
            if failure.tag in ('failure', 'error'):
                print(case.get('classname'), case.get('name'))
                print((failure.text or failure.get('message', ''))[:8000])
PY
  # What Android said about the app and its WebView process (memory, crashes), for a crash without message.
  if command -v adb >/dev/null; then
    echo '--- logcat (app, WebView, memory) ---'
    adb logcat -d -v time 2>/dev/null | grep -iE 'PrivateBrainPro|NativeSemanticTest|chromium|cr_|lowmemorykiller|lmkd|am_kill|am_proc_died|AndroidRuntime|FATAL|Out of memory|OOM' | tail -n 400 || true
  fi
  exit 1
fi
