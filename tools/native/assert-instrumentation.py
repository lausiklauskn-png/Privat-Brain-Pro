#!/usr/bin/env python3
"""Reject missing, skipped or failed Android smoke tests before release."""
from pathlib import Path
import sys
import xml.etree.ElementTree as ET

report_root = Path(sys.argv[1] if len(sys.argv) > 1 else
                   'android/app/build/outputs/androidTest-results/connected')
reports = list(report_root.rglob('TEST-*.xml'))
if not reports:
    raise SystemExit('Android smoke result missing: no current JUnit XML reports')
cases = []
for path in reports:
    suite = ET.parse(path).getroot()
    if any(node.tag in ('failure', 'error', 'skipped') for node in suite.iter()):
        raise SystemExit('Android smoke test failed or was skipped')
    for node in suite.iter('testsuite'):
        if any(int(node.get(key, '0')) for key in ('failures', 'errors', 'skipped')):
            raise SystemExit('Android JUnit suite reports a failure or skipped test')
    cases.extend(suite.iter('testcase'))
expected = [case for case in cases
            if case.get('classname') == 'de.familyprojekt.privatebrain.pro.NativeStartupTest'
            and case.get('name') == 'bundledSearchAndNativeBridgeWork']
if len(expected) != 1:
    raise SystemExit('Expected exactly one executed native startup test')
print(f'Android startup test executed and passed; {len(cases)} test case(s), no failures/skips.')
