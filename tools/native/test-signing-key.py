#!/usr/bin/env python3
"""Real keytool checks with a disposable TEST key; never use a preview key."""
import base64
import contextlib
import hashlib
import importlib.util
import io
import os
from pathlib import Path
import subprocess
import sys
import tempfile

sys.dont_write_bytecode = True
source = Path(__file__).with_name('prepare-signing-key.py')
spec = importlib.util.spec_from_file_location('signing', source)
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)
original = module.EXPECTED
# Only this test process overrides the certificate fingerprint for positive cases.
# The production program keeps the original preview fingerprint pinned.
with tempfile.TemporaryDirectory(prefix='pb-test-key-') as fixture:
    key_path = Path(fixture) / 'fixture.jks'
    subprocess.run([
        'keytool', '-genkeypair', '-keystore', str(key_path), '-storetype', 'JKS',
        '-storepass', 'fixture-only', '-keypass', 'fixture-only', '-alias', 'fixture',
        '-keyalg', 'RSA', '-keysize', '2048', '-validity', '2',
        '-dname', 'CN=Disposable signing test, O=Not a preview key', '-noprompt',
    ], check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    key = key_path.read_bytes()
    cert = subprocess.check_output([
        'keytool', '-exportcert', '-keystore', str(key_path), '-storepass', 'fixture-only',
        '-alias', 'fixture',
    ], stderr=subprocess.DEVNULL)
    digest = hashlib.sha256(cert).hexdigest()
    cases = [
        ('canonical', base64.b64encode(key), digest, 'fixture-only', True),
        ('double-base64', base64.b64encode(base64.b64encode(key)), digest, 'fixture-only', True),
        ('wrong signer', base64.b64encode(key), original, 'fixture-only', False),
        ('wrong password', base64.b64encode(key), digest, 'wrong-test-password', False),
        ('invalid Base64', b'!invalid!', digest, 'fixture-only', False),
        ('not a keystore', base64.b64encode(b'synthetic-invalid-file'), digest, 'fixture-only', False),
    ]
    for label, payload, expected, password, success in cases:
        with tempfile.TemporaryDirectory(prefix='pb-signing-check-') as directory:
            os.environ.update(
                PB_KEYSTORE_BASE64=payload.decode(), PB_KEYSTORE_PASSWORD=password,
                PB_KEY_ALIAS='fixture', PB_KEY_PASSWORD='fixture-only', RELEASE_CHANNEL='test',
                RUNNER_TEMP=directory, GITHUB_ENV=directory+'/env', GITHUB_STEP_SUMMARY=directory+'/summary',
            )
            module.EXPECTED = expected
            try:
                with contextlib.redirect_stdout(io.StringIO()):
                    module.main()
                actual = True
            except SystemExit:
                actual = False
            assert actual == success, label
            assert (Path(directory)/'private-brain.jks').exists() == success, label
            print('PASS:', label)
