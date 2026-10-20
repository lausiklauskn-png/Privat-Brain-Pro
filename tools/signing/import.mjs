import { hkdfSync } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { APP_ID, UNLOCK_NAME } from './identity.mjs';

// age's standard Bech32 representation, not an alternative encryption format.
function secretEncoding(bytes) {
  const alphabet = 'qpzry9x8gf2tvdw0s3jn54khce6mua7l';
  const hrp = 'age-secret-key-';
  const words = [];
  let accumulator = 0, bits = 0;
  for (const byte of bytes) {
    accumulator = ((accumulator << 8) | byte) & 0xffff;
    bits += 8;
    while (bits >= 5) { bits -= 5; words.push((accumulator >> bits) & 31); }
  }
  if (bits) words.push((accumulator << (5 - bits)) & 31);
  const expanded = [...hrp].map(c => c.charCodeAt(0) >> 5).concat(0, [...hrp].map(c => c.charCodeAt(0) & 31));
  let checksum = 1;
  for (const word of [...expanded, ...words, 0, 0, 0, 0, 0, 0]) {
    const top = checksum >>> 25;
    checksum = ((checksum & 0x1ffffff) << 5) ^ word;
    [0x3b6a57b2, 0x26508e6d, 0x1ea119fa, 0x3d4233dd, 0x2a1462b3].forEach((g, i) => {
      if ((top >>> i) & 1) checksum ^= g;
    });
  }
  checksum ^= 1;
  for (let i = 0; i < 6; i++) words.push((checksum >>> (5 * (5 - i))) & 31);
  return (hrp + '1' + words.map(w => alphabet[w]).join('')).toUpperCase();
}

function ageIdentity(unlock) {
  if (!/^[a-f0-9]{64}$/i.test(unlock || '')) throw new Error('PB_SIGNING_UNLOCK muss 64 Hexzeichen enthalten.');
  const input = Buffer.from(unlock, 'hex');
  const derived = Buffer.from(hkdfSync('sha256', input,
    Buffer.from('private-brain-pro/import/v1'), Buffer.from(APP_ID + '/android-preview'), 32));
  try { return secretEncoding(derived); }
  finally { input.fill(0); derived.fill(0); }
}

function bridge(request) {
  const env = { ...process.env };
  for (const name of [UNLOCK_NAME, 'PB_EXISTING_STORE_PASSWORD', 'PB_EXISTING_KEY_PASSWORD']) delete env[name];
  const result = spawnSync(process.env.PB_SIGNING_PYTHON || 'python3',
    [fileURLToPath(new URL('./age-bridge.py', import.meta.url))],
    { env, input: JSON.stringify(request), maxBuffer: 4 * 1024 * 1024 });
  if (result.error || result.status !== 0) throw new Error('age-Verarbeitung fehlgeschlagen; keine geheimen Daten ausgegeben.');
  return result.stdout;
}

export function importRecipient(unlock) {
  const value = bridge({ operation: 'recipient', identity: ageIdentity(unlock) }).toString();
  if (!/^age1[023456789acdefghjklmnpqrstuvwxyz]{58}$/.test(value)) throw new Error('Ungültiger age-Empfänger.');
  return value;
}
export function encryptImport(payload, recipient) {
  if (!/^age1[023456789acdefghjklmnpqrstuvwxyz]{58}$/.test(recipient || '')) throw new Error('Öffentlicher age-Empfänger fehlt.');
  return bridge({ operation: 'encrypt', recipient, payload: JSON.stringify(payload) });
}
export function decryptImport(ciphertext, unlock) {
  if (ciphertext.length > 1024 * 1024) throw new Error('Importpaket zu groß.');
  return JSON.parse(bridge({ operation: 'decrypt', identity: ageIdentity(unlock), ciphertext: ciphertext.toString('base64') }).toString());
}
