#!/usr/bin/env python3
"""Validate GitHub-only signing material without printing/copying it to the agent.

Accept canonical Base64 and diagnose a single accidental extra Base64 layer.
Recovered material stays in RUNNER_TEMP; the expected public preview certificate
and actual private-key password are mandatory before accepting a recovery.
"""
import base64
import hashlib
import os
from pathlib import Path
import subprocess
import sys

EXPECTED = "362ee70d28da9c4b51e37057c3519a3e6eb2c679059dfb9f56b4003f9374fa80"


def decode(value):
    return base64.b64decode(b"".join(value.split()), validate=True)


def keytool(path, operation, extra=()):
    return subprocess.run([
        "keytool", "-J-Duser.language=en", "-J-Duser.country=US", operation,
        "-keystore", str(path), "-storepass:env", "PB_KEYSTORE_PASSWORD",
        "-alias", os.environ["PB_KEY_ALIAS"], *extra,
    ], stdout=subprocess.PIPE, stderr=subprocess.PIPE, check=False)


def main():
    for name in ("PB_KEYSTORE_BASE64", "PB_KEYSTORE_PASSWORD", "PB_KEY_ALIAS", "PB_KEY_PASSWORD"):
        if not os.environ.get(name):
            sys.exit("::error::A required GitHub signing secret is missing; no values were printed.")
    path = Path(os.environ["RUNNER_TEMP"]) / "private-brain.jks"
    preview = os.environ.get("RELEASE_CHANNEL", "test") == "test"
    try:
        raw = decode(os.environ["PB_KEYSTORE_BASE64"].encode("ascii"))
    except (ValueError, UnicodeError):
        sys.exit("::error::ANDROID_KEYSTORE_BASE64 is not valid Base64.")
    candidates = [("canonical", raw)]
    if preview:
        try:
            candidates.append(("double-base64", decode(raw)))
        except ValueError:
            pass
    for mode, data in candidates:
        # Open with restrictive permissions from the first byte, without a window
        # in which a newly written key has default file permissions.
        descriptor = os.open(path, os.O_WRONLY | os.O_CREAT | os.O_TRUNC, 0o600)
        with os.fdopen(descriptor, "wb") as output:
            output.write(data)
        listing = keytool(path, "-list", ("-v",))
        if listing.returncode or b"PrivateKeyEntry" not in listing.stdout:
            print(f"Signing diagnostic: {mode} cannot open the requested private-key entry.")
            path.unlink(missing_ok=True)
            continue
        certificate = keytool(path, "-exportcert")
        if certificate.returncode:
            path.unlink(missing_ok=True)
            continue
        digest = hashlib.sha256(certificate.stdout).hexdigest()
        if preview and digest != EXPECTED:
            path.unlink(missing_ok=True)
            sys.exit("::error::The keystore certificate is not the existing preview signer. Refusing it.")
        # Producing a certificate request exercises the private key and key password.
        # Neither the request nor tool output is printed; no new key is generated.
        request = keytool(path, "-certreq", ("-keypass:env", "PB_KEY_PASSWORD"))
        if request.returncode:
            path.unlink(missing_ok=True)
            sys.exit("::error::The existing private key cannot be used with the supplied key password.")
        if mode != "canonical":
            print("::warning::Recovered the existing preview key from double Base64 encoding inside GitHub. The stored secret still needs canonical single Base64 encoding.")
        print(f"Signing diagnostic passed: {mode}; certificate SHA-256 {digest}.")
        with open(os.environ["GITHUB_ENV"], "a") as output:
            output.write(f"PB_KEYSTORE_FILE={path}\n")
        with open(os.environ["GITHUB_STEP_SUMMARY"], "a") as output:
            output.write(f"Signing material validated inside GitHub: {mode}; certificate `{digest}`.\n")
        return
    path.unlink(missing_ok=True)
    sys.exit("::error::Neither canonical nor double Base64 yields a usable existing keystore/alias. Restore the original GitHub signing secrets; no new key was generated.")


if __name__ == "__main__":
    main()
