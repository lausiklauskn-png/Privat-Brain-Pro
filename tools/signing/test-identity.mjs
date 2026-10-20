import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { readFile, writeFile, mkdtemp, rm, access, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { spawnSync } from 'node:child_process';
import * as production from './identity.mjs';
import { importRecipient, encryptImport, decryptImport } from './import.mjs';

const key = randomBytes(32).toString('hex');
const password = randomBytes(24).toString('hex'), keyPassword = randomBytes(24).toString('hex');
let sandbox, fixture, bytes, envelope, identity;
before(async () => {
  sandbox = await mkdtemp(path.join(tmpdir(), 'pb-signing-test-'));
  fixture = path.join(sandbox, 'disposable-test.jks');
  production.checked('keytool', ['-genkeypair', '-storetype', 'JKS', '-keystore', fixture,
    '-storepass:env', 'PB_TEST_STORE', '-keypass:env', 'PB_TEST_KEY', '-alias', 'test-only',
    '-keyalg', 'RSA', '-keysize', '2048', '-validity', '2', '-dname', 'CN=Disposable test only', '-noprompt'],
    { PB_TEST_STORE: password, PB_TEST_KEY: keyPassword });
  bytes = await readFile(fixture);
  const { fingerprint } = await production.publicCertificate(fixture, password, 'test-only');
  assert.notEqual(fingerprint, production.EXPECTED_FINGERPRINT);
  // Positive encryption tests use an isolated COPY pinned to the disposable fixture.
  // Production exports no pin override and must reject this key (tested below).
  const source = (await readFile(new URL('./identity.mjs', import.meta.url), 'utf8'))
    .replace(production.EXPECTED_FINGERPRINT, fingerprint);
  const module = path.join(sandbox, 'test-only-identity.mjs');
  await writeFile(module, source);
  identity = await import(pathToFileURL(module));
  envelope = await identity.sealIdentity({ keystore: bytes, password, keyPassword, alias: 'test-only', key });
});
after(async () => { bytes?.fill(0); if (sandbox) await rm(sandbox, { recursive: true, force: true }); });

test('Produktionsweg lehnt den Testschlüssel ab; kein Ersatz für 362ee70d', async () => {
  await assert.rejects(production.sealIdentity({ keystore: bytes, password, keyPassword, alias: 'test-only', key }), /Zertifikat/);
  await assert.rejects(production.withIdentity(envelope, key, () => assert.fail()), /Falsches Signierpaket/);
  assert.equal(production.createIdentity, undefined);
});
test('Deterministischer öffentlicher age-Empfänger und getrennte Freigaben', () => {
  assert.equal(importRecipient('11'.repeat(32)), 'age12tghsk2uvfy2z72jgnsmruj08xkyxcth8lspwxcy4gpk4wn5t3ssdkg3mm');
  assert.equal(importRecipient(key), importRecipient(key));
  assert.notEqual(importRecipient(key), importRecipient('22'.repeat(32)));
  assert.throws(() => importRecipient('missing'), /64 Hexzeichen/);
});
test('Einweg-Import verwendet Standard-age und erhält beide unterschiedlichen Passwörter', () => {
  const payload = { keystore: bytes.toString('base64'), password, keyPassword, alias: 'test-only' };
  const encrypted = encryptImport(payload, importRecipient(key));
  assert.ok(encrypted.subarray(0, 22).toString().startsWith('age-encryption.org/v1\n'));
  assert.deepEqual(decryptImport(encrypted, key), payload);
  assert.throws(() => decryptImport(encrypted, randomBytes(32).toString('hex')), /age-Verarbeitung/);
  const changed = Buffer.from(encrypted); changed[changed.length - 1] ^= 1;
  assert.throws(() => decryptImport(changed, key), /age-Verarbeitung/);
  assert.ok(!encrypted.includes(Buffer.from(password)));
});
test('AES-GCM-Paket enthält keine Passwörter oder Freigabe im Klartext', () => {
  const text = JSON.stringify(envelope);
  for (const secret of [password, keyPassword, key, bytes.toString('base64')]) assert.ok(!text.includes(secret));
  assert.equal(envelope.algorithm, 'aes-256-gcm');
  assert.equal(Buffer.from(envelope.nonce, 'base64').length, 12);
});
test('JKS wird bytegleich mit getrennten Store-/Key-Passwörtern wiederhergestellt und benutzt', async () => {
  let directory;
  await identity.withIdentity(envelope, key, async restored => {
    directory = restored.directory;
    assert.equal(restored.password, password); assert.equal(restored.keyPassword, keyPassword);
    assert.deepEqual(await readFile(restored.file), bytes);
    assert.equal((await stat(restored.file)).mode & 0o777, 0o600);
    assert.equal((await stat(directory)).mode & 0o777, 0o700);
    // Async callback must finish BEFORE its temporary key and backing bytes are removed.
    await new Promise(resolve => setTimeout(resolve, 20));
    production.checkPrivateKey(restored.file, password, keyPassword, restored.alias);
  });
  await assert.rejects(access(directory));
});
test('Falsches Store- oder Schlüsselpasswort und falscher Alias brechen ab', async () => {
  for (const patch of [{ password: 'wrong' }, { keyPassword: 'wrong' }, { alias: 'missing' }]) {
    await assert.rejects(identity.sealIdentity({ keystore: bytes, password, keyPassword, alias: 'test-only', key, ...patch }));
  }
});
test('Falsche Freigabe, manipulierte Verschlüsselung und fremde App werden abgewiesen', async () => {
  await assert.rejects(identity.withIdentity(envelope, randomBytes(32).toString('hex'), () => assert.fail()), /authentisch/);
  for (const field of ['nonce', 'ciphertext', 'tag']) {
    const changed = structuredClone(envelope), value = Buffer.from(changed[field], 'base64');
    value[0] ^= 1; changed[field] = value.toString('base64');
    await assert.rejects(identity.withIdentity(changed, key, () => assert.fail()));
  }
  await assert.rejects(identity.withIdentity({ ...envelope, applicationId: 'de.familyprojekt.workflowpdf.pro' }, key, () => assert.fail()));
});
test('Identität wird nie überschrieben; öffentlicher Pin wird geprüft', async () => {
  const directory = path.join(sandbox, 'sealed');
  await identity.saveNewIdentity(directory, envelope);
  assert.equal(await identity.verifyPinnedIdentity(directory, key), true);
  await assert.rejects(identity.saveNewIdentity(directory, envelope), /niemals automatisch ersetzen/);
  assert.deepEqual(JSON.parse(await readFile(path.join(directory, 'android-release.enc.json'), 'utf8')), envelope);
  await writeFile(path.join(directory, 'android-certificate.json'), JSON.stringify({ applicationId: production.APP_ID, certificateSha256: '0'.repeat(64) }));
  await assert.rejects(identity.verifyPinnedIdentity(directory, key), /Pin stimmt nicht/);
});
test('Temporärer privater Schlüssel wird auch bei fehlgeschlagenem Verbraucher entfernt', async () => {
  let directory;
  await assert.rejects(identity.withIdentity(envelope, key, async restored => {
    directory = restored.directory; throw new Error('synthetic abort');
  }), /synthetic abort/);
  await assert.rejects(access(directory));
});
test('PKCS12 bleibt PKCS12 und behält dasselbe Zertifikat', async () => {
  const p12 = path.join(sandbox, 'disposable-test.p12');
  production.checked('keytool', ['-importkeystore', '-srckeystore', fixture, '-srcstoretype', 'JKS',
    '-srcstorepass:env', 'PB_TEST_STORE', '-srckeypass:env', 'PB_TEST_KEY', '-srcalias', 'test-only',
    '-destkeystore', p12, '-deststoretype', 'PKCS12', '-deststorepass:env', 'PB_TEST_DEST',
    '-destkeypass:env', 'PB_TEST_DEST', '-noprompt'],
    { PB_TEST_STORE: password, PB_TEST_KEY: keyPassword, PB_TEST_DEST: password });
  const original = await readFile(p12);
  const sealed = await identity.sealIdentity({ keystore: original, password, keyPassword: password, alias: 'test-only', key });
  await identity.withIdentity(sealed, key, async restored => assert.deepEqual(await readFile(restored.file), original));
});
test('Actions-CLI importiert age, verweigert Ersatz und gibt Gradle nur maskierte Jobwerte', async () => {
  const root = path.join(sandbox, 'actions');
  const { mkdir, copyFile } = await import('node:fs/promises');
  await mkdir(path.join(root, 'tools/signing'), { recursive: true });
  await mkdir(path.join(root, 'signing'));
  const here = new URL('./', import.meta.url);
  for (const name of ['cli.mjs', 'import.mjs', 'age-bridge.py'])
    await copyFile(new URL(name, here), path.join(root, 'tools/signing', name));
  await copyFile(path.join(sandbox, 'test-only-identity.mjs'), path.join(root, 'tools/signing/identity.mjs'));
  const payload = { applicationId: production.APP_ID, certificateSha256: envelope.certificateSha256,
    keystore: bytes.toString('base64'), password, keyPassword, alias: 'test-only' };
  await writeFile(path.join(root, 'signing/import.age'), encryptImport(payload, importRecipient(key)));
  const envFile = path.join(root, 'job-env');
  const run = command => spawnSync(process.execPath, [path.join(root, 'tools/signing/cli.mjs'), command],
    { env: { ...process.env, PB_SIGNING_UNLOCK: key, RUNNER_TEMP: root, GITHUB_ENV: envFile, RELEASE_CHANNEL: 'test' }, encoding: 'utf8' });
  const imported = run('import'); assert.equal(imported.status, 0, imported.stderr);
  assert.ok(!imported.stdout.includes(password)); assert.ok(!imported.stdout.includes(key));
  const original = await readFile(path.join(root, 'signing/android-release.enc.json'));
  assert.equal(run('check').status, 0);
  assert.equal(run('import').status, 1);
  assert.deepEqual(await readFile(path.join(root, 'signing/android-release.enc.json')), original);
  const prepared = run('prepare-gradle'); assert.equal(prepared.status, 0, prepared.stderr);
  for (const line of prepared.stdout.split('\n').filter(Boolean)) {
    if (line.includes(password) || line.includes(keyPassword)) assert.ok(line.startsWith('::add-mask::'));
    assert.ok(!line.includes(key));
  }
  const job = await readFile(envFile, 'utf8');
  assert.ok(job.includes(password)); assert.ok(job.includes(keyPassword)); assert.ok(!job.includes(key));
  assert.deepEqual(await readFile(path.join(root, 'private-brain.jks')), bytes);
});
