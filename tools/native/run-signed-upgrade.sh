#!/usr/bin/env bash
# Disposable emulator only: both application APKs are the unchanged signed releases.
set -euo pipefail
test "$#" -eq 3
old_apk=$1
new_apk=$2
probe_apk=$3
package=${PB_UPGRADE_TEST_PACKAGE:-de.familyprojekt.privatebrain.pro.preview}
component=de.familyprojekt.privatebrain.upgradeprobe/.UpgradeProbe
mkdir -p upgrade-results
# Capture the disposable emulator before the runner shuts it down. Preserve the
# failing status; diagnostics must never turn a failed preservation check green.
diagnostics() {
  local status=$?
  trap - EXIT
  if (( status != 0 )); then
    adb logcat -d -v threadtime > upgrade-results/logcat.txt 2>&1 || true
    adb shell dumpsys activity activities > upgrade-results/activities.txt 2>&1 || true
    adb shell dumpsys webviewupdate > upgrade-results/webview.txt 2>&1 || true
    adb shell uiautomator dump /sdcard/upgrade-window.xml >/dev/null 2>&1 || true
    adb pull /sdcard/upgrade-window.xml upgrade-results/window.xml >/dev/null 2>&1 || true
    adb exec-out screencap -p > upgrade-results/screen.png 2>/dev/null || true
  fi
  exit "$status"
}
trap diagnostics EXIT
probe() {
  adb shell am instrument -w -e phase "$1" "$component" > "upgrade-results/$1.txt"
  cat "upgrade-results/$1.txt"
  grep -q "SIGNED_UPGRADE_${1^^}_PASS" "upgrade-results/$1.txt"
  ! grep -q 'SIGNED_UPGRADE_FAIL' "upgrade-results/$1.txt"
}
# A pre-existing installation would invalidate the controlled initial state.
if adb shell pm path "$package" | grep -q '^package:'; then
  echo 'Use a clean CI emulator; refusing to erase existing app data.' >&2
  exit 1
fi
adb install "$old_apk"
adb install "$probe_apk"
probe seed
adb shell am force-stop "$package"
probe baseline
adb shell am force-stop "$package"
adb install -r "$new_apk"
adb shell am force-stop "$package"
# Both OS networking and the persisted app switch must be offline on cold start.
adb shell svc wifi disable
adb shell svc data disable
probe verify
