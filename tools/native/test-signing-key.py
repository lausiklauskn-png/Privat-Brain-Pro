#!/usr/bin/env python3
# Exercises only the existing disposable Android DEVELOPMENT key, never a preview key.
# EXPECTED is overridden in this test process for positive fixture cases; the
# production script always pins the real preview fingerprint.
import base64, contextlib, hashlib, importlib.util, io, os, subprocess, sys, tempfile
from pathlib import Path
sys.dont_write_bytecode=True
source=Path(__file__).with_name('prepare-signing-key.py')
key_path=Path(os.environ.get('ANDROID_USER_HOME',str(Path.home()/'.android')))/'debug.keystore'
key=key_path.read_bytes()
cert=subprocess.check_output(['keytool','-exportcert','-keystore',str(key_path),'-storepass','android','-alias','androiddebugkey'],stderr=subprocess.DEVNULL)
fixture_digest=hashlib.sha256(cert).hexdigest()
spec=importlib.util.spec_from_file_location('signing',source);m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
original=m.EXPECTED
cases=[('canonical',base64.b64encode(key),fixture_digest,'android',True),('double-base64',base64.b64encode(base64.b64encode(key)),fixture_digest,'android',True),('wrong signer',base64.b64encode(key),original,'android',False),('wrong password',base64.b64encode(key),fixture_digest,'wrong-test-password',False),('invalid Base64',b'!invalid!',fixture_digest,'android',False),('not a keystore',base64.b64encode(b'synthetic-invalid-file'),fixture_digest,'android',False)]
for label,payload,expected,password,success in cases:
 with tempfile.TemporaryDirectory(prefix='pb-signing-test-',) as directory:
  os.environ.update(PB_KEYSTORE_BASE64=payload.decode(),PB_KEYSTORE_PASSWORD=password,PB_KEY_ALIAS='androiddebugkey',PB_KEY_PASSWORD='android',RELEASE_CHANNEL='test',RUNNER_TEMP=directory,GITHUB_ENV=directory+'/env',GITHUB_STEP_SUMMARY=directory+'/summary')
  m.EXPECTED=expected
  try:
   with contextlib.redirect_stdout(io.StringIO()):m.main()
   actual=True
  except SystemExit:actual=False
  assert actual==success,label
  assert (Path(directory)/'private-brain.jks').exists()==success,label
  print('PASS:',label)
