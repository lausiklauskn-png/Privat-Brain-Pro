import { readFile, writeFile, appendFile, copyFile, chmod, lstat } from 'node:fs/promises';
import { randomBytes } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { UNLOCK_NAME, EXPECTED_FINGERPRINT, APP_ID, publicCertificate, checkPrivateKey,
  sealIdentity, withIdentity, saveNewIdentity, verifyPinnedIdentity } from './identity.mjs';
import { importRecipient, encryptImport, decryptImport } from './import.mjs';

const root = fileURLToPath(new URL('../../', import.meta.url));
const directory = path.join(root, 'signing');
const [command, ...args] = process.argv.slice(2);
const unlock = process.env[UNLOCK_NAME];
try {
  if (command === 'recipient') {
    const recipient = importRecipient(unlock);
    console.log(recipient); // ONLY public material.
    if (process.env.GITHUB_STEP_SUMMARY) await appendFile(process.env.GITHUB_STEP_SUMMARY,
      `Öffentlicher Import-Empfänger (keine Freigabe):\n\n\`${recipient}\`\n`);
  } else if (command === 'encrypt-import') {
    const [file, recipient] = args;
    if (!file) throw new Error('Vorhandene Original-Schlüsseldatei erforderlich; kein neuer Schlüssel wird erzeugt.');
    const password = process.env.PB_EXISTING_STORE_PASSWORD;
    const keyPassword = process.env.PB_EXISTING_KEY_PASSWORD;
    const alias = process.env.PB_EXISTING_KEY_ALIAS;
    const cert = await publicCertificate(file, password, alias);
    if (cert.fingerprint !== EXPECTED_FINGERPRINT) throw new Error('Original-Vorschau-Zertifikat stimmt nicht.');
    checkPrivateKey(file, password, keyPassword, alias);
    const bytes = await readFile(file);
    try {
      const payload = { applicationId: APP_ID, certificateSha256: EXPECTED_FINGERPRINT,
        keystore: bytes.toString('base64'), password, keyPassword, alias };
      await writeFile(path.join(directory, 'import.age'), encryptImport(payload, recipient), { flag: 'wx', mode: 0o644 });
    } finally { bytes.fill(0); }
    console.log('Nur age-verschlüsseltes Original-Importpaket gespeichert.');
  } else if (command === 'import') {
    for (const name of ['android-release.enc.json', 'android-certificate.json']) {
      try { await lstat(path.join(directory, name)); throw new Error('Identität vorhanden; Import darf sie niemals ersetzen.'); }
      catch (error) { if (error.code !== 'ENOENT') throw error; }
    }
    const payload = decryptImport(await readFile(path.join(directory, 'import.age')), unlock);
    if (payload.applicationId !== APP_ID || payload.certificateSha256 !== EXPECTED_FINGERPRINT) throw new Error('Import ist nicht die bestehende Vorschau-Identität.');
    const bytes = Buffer.from(payload.keystore, 'base64');
    try {
      const envelope = await sealIdentity({ keystore: bytes, password: payload.password,
        keyPassword: payload.keyPassword, alias: payload.alias, key: unlock });
      await withIdentity(envelope, unlock, () => true);
      await saveNewIdentity(directory, envelope);
      await verifyPinnedIdentity(directory, unlock);
    } finally { bytes.fill(0); payload.password = ''; payload.keyPassword = ''; payload.keystore = ''; }
    console.log('Original-Zertifikat, privater Schlüssel und Wiederherstellung geprüft: ' + EXPECTED_FINGERPRINT);
  } else if (command === 'check') {
    await verifyPinnedIdentity(directory, unlock);
    console.log('Original-Identität wiederhergestellt und geprüft: ' + EXPECTED_FINGERPRINT);
  } else if (command === 'prepare-gradle') {
    if (process.env.RELEASE_CHANNEL !== 'test') throw new Error('Dieses Paket ist ausschließlich für die bestehende Vorschau freigegeben.');
    if (!process.env.GITHUB_ENV || !process.env.RUNNER_TEMP) throw new Error('Gradle-Freigabe nur in GitHub Actions.');
    await verifyPinnedIdentity(directory, unlock, async identity => {
      const file = path.join(process.env.RUNNER_TEMP, 'private-brain.jks');
      await copyFile(identity.file, file); await chmod(file, 0o600);
      const values = { PB_KEYSTORE_FILE: file, PB_KEYSTORE_PASSWORD: identity.password,
        PB_KEY_ALIAS: identity.alias, PB_KEY_PASSWORD: identity.keyPassword };
      for (const [name, value] of Object.entries(values)) {
        if (name !== 'PB_KEYSTORE_FILE') console.log('::add-mask::' + value.replaceAll('%', '%25').replaceAll('\r', '%0D').replaceAll('\n', '%0A'));
        const delimiter = 'PB_' + randomBytes(24).toString('hex');
        await appendFile(process.env.GITHUB_ENV, `${name}<<${delimiter}\n${value}\n${delimiter}\n`);
      }
    });
    console.log('Vorschau-Signierer geprüft und nur für diesen Actions-Job freigegeben.');
  } else throw new Error('Aufruf: recipient | encrypt-import <Original-Keystore> <öffentlicher-age-Empfänger> | import | check | prepare-gradle. Keine Schlüsselerzeugung.');
} catch {
  // Do not echo JSON, subprocess output, paths, passwords or unexpected parser errors.
  console.error('Signieroperation abgebrochen. Original-Schlüssel, Zertifikats-Pin, Paket und Freigabe prüfen; keine geheimen Daten ausgegeben.');
  process.exitCode = 1;
}
