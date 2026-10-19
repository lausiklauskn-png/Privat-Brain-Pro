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
  exit 1
fi
