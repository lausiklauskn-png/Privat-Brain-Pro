#!/usr/bin/env bash
set -euo pipefail
# Passive, bounded diagnostics only: never change focus, unlock or retry a test.
focus_diagnostics() {
  if ! command -v adb >/dev/null || ! command -v timeout >/dev/null; then return 0; fi
  echo "--- Android focus/keyguard/power ($1) ---"
  # awk consumes the complete stream even after its output limit, avoiding
  # head/SIGPIPE failures with pipefail. Each adb query ends within four seconds.
  # AOSP prints mCurrentFocus/mFocusedApp in DisplayContent, not the window list.
  timeout -k 1s 3s adb shell dumpsys window displays 2>/dev/null |
    LC_ALL=C awk '/mCurrentFocus=|mFocusedApp=|mObscuringWindow=|mInputMethodWindow=/ {if(n++<12)print substr($0,1,400)}' || true
  timeout -k 1s 3s adb shell dumpsys window policy 2>/dev/null |
    LC_ALL=C awk '/mShowingLockscreen|mKeyguard|isKeyguard|keyguardShowing|keyguardOccluded|mScreenOn|screenOn|screenState|^[[:space:]]*(showing|inputRestricted|occluded)=/ {if(n++<20)print substr($0,1,400)}' || true
  timeout -k 1s 3s adb shell dumpsys power 2>/dev/null |
    LC_ALL=C awk '/mWakefulness=|mInteractive=|mHoldingDisplaySuspendBlocker=|Display Power: state=|mDisplayPowerRequest=|mScreenOffTimeoutSetting=|mStayOn=/ {if(n++<16)print substr($0,1,400)}' || true
}
focus_diagnostics before-instrumentation
if (cd android && ./gradlew --no-daemon --max-workers=2 :app:connectedDebugAndroidTest); then
  python3 tools/native/assert-instrumentation.py
else
  instrumentation_status=$?
  focus_diagnostics instrumentation-failed
  # These isolated tests use no real accounts. Include failures in CI logs so
  # restricted environments do not need an additional artifact-download host.
  python3 - <<'PY' || true
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
    echo '--- logcat (app, WebView, memory, window focus) ---'
    timeout -k 1s 3s adb logcat -d -v time 2>/dev/null |
      LC_ALL=C awk 'tolower($0) ~ /capacitor\/console|modul 03|privatebrainpro|nativesemantictest|chromium|cr_|lowmemorykiller|lmkd|am_kill|am_proc_died|androidruntime|fatal|out of memory|oom|windowmanager|inputdispatcher|keyguard|powermanager|displaypower/ {print substr($0,1,1000)}' |
      tail -n 400 || true
  fi
  exit "$instrumentation_status"
fi
