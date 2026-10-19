// LEGACY / DO NOT RUN — superseded 2026-07-22.
// The live app icons (icon-192.png / icon-512.png) are now a hand-designed
// image: a 3D cluster of glass cells linked by glowing synapse filaments
// around a warm-gold central node (no brain, no box). Running this generator
// would OVERWRITE that designed icon with the old box+lens draft — don't.
// Kept only as a historical reference of the earlier generated icon.
//
// (Original: offline icon generator, no deps — Node zlib only. Drew a
//  deep-indigo rounded "box" with a light lens accent.)
import { deflateSync } from 'node:zlib';
import { writeFileSync } from 'node:fs';

function crc32(buf) {
  let c, crc = 0xffffffff;
  for (let n = 0; n < buf.length; n++) {
    c = (crc ^ buf[n]) & 0xff;
    for (let k = 0; k < 8; k++) c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    crc = (crc >>> 8) ^ c;
  }
  return (crc ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const t = Buffer.from(type, 'ascii');
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length, 0);
  const body = Buffer.concat([t, data]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(body), 0);
  return Buffer.concat([len, body, crc]);
}
function png(width, height, rgba) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0); ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  const stride = width * 4;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (stride + 1)] = 0;
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, y * stride + stride);
  }
  const idat = deflateSync(raw, { level: 9 });
  return Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', idat), chunk('IEND', Buffer.alloc(0))]);
}

function lerp(a, b, t) { return Math.round(a + (b - a) * t); }
function draw(size) {
  const buf = Buffer.alloc(size * size * 4);
  const R = size * 0.20; // corner radius
  const set = (x, y, r, g, b, a = 255) => {
    if (x < 0 || y < 0 || x >= size || y >= size) return;
    const i = (y * size + x) * 4; buf[i] = r; buf[i + 1] = g; buf[i + 2] = b; buf[i + 3] = a;
  };
  const inRounded = (x, y) => {
    const rx = Math.min(x, size - 1 - x), ry = Math.min(y, size - 1 - y);
    if (rx >= R || ry >= R) return true;
    const dx = R - rx, dy = R - ry;
    return dx * dx + dy * dy <= R * R;
  };
  // background gradient (indigo -> violet)
  for (let y = 0; y < size; y++) {
    const t = y / (size - 1);
    const r = lerp(0x1a, 0x3b, t), g = lerp(0x1f, 0x2d, t), b = lerp(0x3b, 0x6b, t);
    for (let x = 0; x < size; x++) {
      if (inRounded(x, y)) set(x, y, r, g, b, 255);
      else set(x, y, 0, 0, 0, 0);
    }
  }
  // the "box" — light rounded rectangle outline
  const cx = size / 2, cy = size / 2;
  const bw = size * 0.52, bh = size * 0.40;
  const bx0 = cx - bw / 2, bx1 = cx + bw / 2, by0 = cy - bh / 2, by1 = cy + bh / 2;
  const thick = Math.max(2, size * 0.035);
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const onV = (Math.abs(x - bx0) < thick || Math.abs(x - bx1) < thick) && y > by0 && y < by1;
    const onH = (Math.abs(y - by0) < thick || Math.abs(y - by1) < thick) && x > bx0 && x < bx1;
    // lid line
    const lidY = by0 + bh * 0.30;
    const onLid = Math.abs(y - lidY) < thick && x > bx0 && x < bx1;
    if (onV || onH || onLid) set(x, y, 0xf3, 0xf5, 0xff, 255);
  }
  // the "lens / brain" accent circle
  const lr = size * 0.11, lcx = cx, lcy = by0 + bh * 0.63;
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const d = Math.hypot(x - lcx, y - lcy);
    if (d < lr) { const t = d / lr; set(x, y, lerp(0x8b, 0x4f, t), lerp(0xd9, 0x8e, t), lerp(0xff, 0xff, t), 255); }
    else if (d < lr + thick) set(x, y, 0xf3, 0xf5, 0xff, 255);
  }
  return buf;
}

for (const size of [192, 512]) {
  writeFileSync(new URL(`../icon-${size}.png`, import.meta.url), png(size, size, draw(size)));
  console.log(`wrote icon-${size}.png`);
}
