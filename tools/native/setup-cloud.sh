#!/usr/bin/env bash
# Reusable prerequisites for this isolated cloud machine; never modifies the PWA.
set -euo pipefail
PB_SDK_DIR=/workspace/android-sdk
PB_JDK_DIR=/workspace/jdk/jdk-21.0.12.1
mkdir -p /workspace/downloads /workspace/android-user /workspace/.gradle
if [[ ! -x "$PB_JDK_DIR/bin/javac" ]]; then
  curl --fail --location --show-error --silent \
    https://download.oracle.com/java/21/archive/jdk-21.0.12.1_linux-x64_bin.tar.gz \
    -o /workspace/downloads/jdk-21.tar.gz
  echo '12f870b21301b42292558a3f872ce543affa2b86cb6458591c78388c41ddb111  /workspace/downloads/jdk-21.tar.gz' | sha256sum -c -
  mkdir -p /workspace/jdk
  tar -xzf /workspace/downloads/jdk-21.tar.gz -C /workspace/jdk
fi
if [[ ! -x "$PB_SDK_DIR/cmdline-tools/latest/bin/sdkmanager" ]]; then
  curl --fail --location --show-error --silent \
    https://dl.google.com/android/repository/commandlinetools-linux-16111833_latest.zip \
    -o /workspace/downloads/android-commandlinetools.zip
  echo 'e025545c62a8e64c7559119566a569fb1dec5f60  /workspace/downloads/android-commandlinetools.zip' | sha1sum -c -
  mkdir -p "$PB_SDK_DIR/cmdline-tools"
  PB_UNPACK=$(mktemp -d /workspace/downloads/android-tools.XXXXXX)
  unzip -q /workspace/downloads/android-commandlinetools.zip -d "$PB_UNPACK"
  mv "$PB_UNPACK/cmdline-tools" "$PB_SDK_DIR/cmdline-tools/latest"
  rmdir "$PB_UNPACK"
fi
export JAVA_HOME="$PB_JDK_DIR"
export ANDROID_HOME="$PB_SDK_DIR"
export ANDROID_USER_HOME=/workspace/android-user
export GRADLE_USER_HOME=/workspace/.gradle
# Keep the session proxy and existing CA trust; never disable verification.
if [[ -f /etc/ssl/certs/java/cacerts ]]; then
  export JAVA_TOOL_OPTIONS="${JAVA_TOOL_OPTIONS:-} -Djavax.net.ssl.trustStore=/etc/ssl/certs/java/cacerts"
fi
"$PB_SDK_DIR/cmdline-tools/latest/bin/sdkmanager" --sdk_root="$PB_SDK_DIR" \
  'platform-tools' 'platforms;android-36' 'build-tools;36.0.0' 'build-tools;35.0.0'
python3 - <<'PYENV'
import os
from pathlib import Path
from urllib.parse import urlsplit
proxy = urlsplit(os.environ.get('HTTPS_PROXY', os.environ.get('https_proxy', '')))
config=Path('/workspace/.gradle/gradle.properties')
lines=config.read_text().splitlines() if config.exists() else []
# Only update our proxy fields; preserve other user settings.
prefixes=('systemProp.http.proxyHost=', 'systemProp.http.proxyPort=', 'systemProp.https.proxyHost=', 'systemProp.https.proxyPort=')
if proxy.hostname:
 lines=[line for line in lines if not line.startswith(prefixes)]
 lines.extend([f'systemProp.{protocol}.proxy{field}={value}' for protocol in ['http','https'] for field,value in [('Host',proxy.hostname),('Port',proxy.port or 8080)]])
 config.write_text('\n'.join(lines)+'\n')
PYENV
"$JAVA_HOME/bin/javac" -version
