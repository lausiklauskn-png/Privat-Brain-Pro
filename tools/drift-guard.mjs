// Drift-Guard: die aus dem SBKIM-Baukasten byte-1:1 übernommenen Module dürfen
// hier NICHT abgewandelt werden ("Kopieren, nicht klonen"). Ändert sich der Inhalt,
// schlägt der Test an — dann bewusst die Quelle in Sage-Protokol pflegen und neu kopieren.
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { join } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;
// Erwartete Hashes der 1:1-Kopien aus Sage-Protokol/src/modules/*.
const EXPECT = {
  'modules/25_pseudonym.js': '8c3092babee80b8fce2c6607cc4c8ced4bbef4addf31a5f0f3de6ba5c92c2ad7',
  'modules/pruefer-anhang.js': 'c31ddb5cebc293b542e781a5d1f3bca6d558da227db997822c73b2b8a4c1ea17',
  'modules/pruefer-formate.js': 'c7206f163521fd3cf1b09845a7e547e912564838ff1bf899c2575366764d15cd',
  'modules/pruefer.js': '9b004f0c76bf8d79b75d361b5b8d4cae87d2b2becd229f2d37391e93566300fd',
  'modules/01_storage.js':      '5a5a4bf64dfcc107da7ed70fb755d7db5cce7d80e963b3e2fbc2004537747820',
  'modules/02_spore.js':        '0cbf0664e2a79f1301c03e52f7ac0030d4b2961f03b97b38e8634827a52353c5',
  'modules/03_embedding.js':    '2e31baa09a2959c95efff8eecd224e8343e75695b4b293aa35209d8f96d1f3b5',
  'modules/04_match.js':        '721eecc3c0d6ea4c259259e6071215ec1cd16f1c43c87b42ce9e72e9a0b5e41c',
  'modules/pruefer-mail.js':     'cdf3ca7881bfa68763a2c0be7436d35a65bea4dbd03f606e02eaec5c613632d7', // Prüfliste (Auslieferungsprüfer, über Sage assets/), Bau 04.J
  'modules/reinigung.js':        'c3420fb57875db193096b13bd586387d41b383bd9625b54145dece8c4b65ac0e', // Reinigung vor der KI, byte-1:1 aus Workflow-PDF assets/reinigung.js
  'modules/05_anastomose.js':   '255ac79aeb3b0203e92f0cebd0a905e47c488b43efe18f41332a7d35520bbf23',
  'modules/05b_nostr_relay.js': '37eee5b196b3efad57131edd1cc3c0ee23acb97b5ca40740d6a0771db4b4a421',
  'modules/noble-secp256k1.js': '8f3879ca422c4fdfe7ca0361688636fa7cc550a59bd94d512ed6ec79aa3d55d1',
  'modules/dm_crypto.js':       'e9c973f0459c5f03fa80b47d3cd4505ef6d4bd689e409569370a59db2586ba63',
  'modules/23_rendezvous.js':   '5aa8262638eeaf70f5e5563592a730f240a95ed80daf41a4df5d7d51824afb74',
  'modules/20_schluessel_safe.js': 'e7e25c9070e93f8267171d2b626109cfd90cb481c2781242f5f7dfc203f031f3',
  'modules/21_spracheingabe.js':   '020ca26ff52f2ed726f6344bd3ac55eb52e3472a7f97bdd41bdd0d54132777ba',
  'modules/07_apoptose.js':        '0acdd6ab2d95e131fa6953061cc0e95a2396e05fff091a7dc690b2668a4c035a',
  'modules/15_membran.js':         '829a5bc01976b59c5ce428125314b87b314b6212cd5a473634c2d22c02579397',
  'modules/16_siegel.js':          'd26a262f593a75c44d22377059d4d076e4455e9f6bcc68b0c2ea992cd3380d37',
  'modules/17_floating_widget.js': 'e4ee076c1295910d0e83470ebda327e7419f29bc06f6718148369c8369e1a5ce',
};
let fail = 0;
for (const [rel, want] of Object.entries(EXPECT)) {
  const buf = await readFile(join(ROOT, rel));
  const got = createHash('sha256').update(buf).digest('hex');
  const ok = got === want;
  if (!ok) fail++;
  console.log(`${ok ? '✅' : '❌'} byte-1:1 ${rel}  ${ok ? '' : `(erwartet ${want.slice(0,12)}…, ist ${got.slice(0,12)}…)`}`);
}
console.log(`\n${Object.keys(EXPECT).length - fail} byte-identisch, ${fail} abgewichen`);
if (fail) process.exit(1);
