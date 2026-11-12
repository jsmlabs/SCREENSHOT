import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { inflateSync } from 'node:zlib';
const root = resolve(import.meta.dirname, '..');
const read = (path) => readFileSync(resolve(root, path));
test('brand masters and three independent concepts are supplied', () => {
  for (const concept of ['precision','frame','focus']) {
    const svg = read(`branding/concepts/${concept}.svg`).toString();
    assert.match(svg, /<svg\b/);
    assert.match(svg, /<\/svg>/);
  }
  for (const name of ['mark-dark','mark-light','mark-transparent','wordmark-dark','wordmark-light'])
    assert.ok(existsSync(resolve(root, `branding/logo/${name}.svg`)));
});
test('manifest icon references resolve to valid PNG signatures and dimensions', () => {
  const manifest = JSON.parse(read('manifest.json').toString());
  for (const [size, path] of Object.entries(manifest.icons)) {
    const bytes = read(path);
    assert.equal(bytes.subarray(0,8).toString('hex'), '89504e470d0a1a0a');
    assert.equal(bytes.readUInt32BE(16),Number(size));
    assert.equal(bytes.readUInt32BE(20),Number(size));
  }
});
test('both branded headers use identical vector geometry', () => {
  const popup=read('src/popup/popup.html').toString();
  const editor=read('src/editor/editor.html').toString();
  const path = /<path d="(M23 43.*?)" stroke="currentColor"/;
  assert.equal(popup.match(path)?.[1], editor.match(path)?.[1]);
  assert.match(popup, /aria-hidden="true"><svg class="brand-symbol"/);
  assert.match(editor, /aria-hidden="true"><svg class="brand-symbol"/);
});
test('store illustrations are supplied at accurate image dimensions', () => {
  for (const [name,w,h] of [['small-promo-440x280.png',440,280],['marquee-1400x560.png',1400,560]]) {
    const bytes=read(`branding/store/${name}`);
    assert.equal(bytes.readUInt32BE(16),w);
    assert.equal(bytes.readUInt32BE(20),h);
  }
});

// Regression: the frame must be symmetrical around the same x=64 as its center point.
test('precision brand mark has centered frame geometry in all live and exported vectors', () => {
  const files = [
    'branding/concepts/precision.svg',
    'branding/logo/mark-dark.svg',
    'branding/logo/mark-light.svg',
    'branding/logo/mark-transparent.svg',
    'branding/logo/wordmark-dark.svg',
    'branding/logo/wordmark-light.svg',
    'src/popup/popup.html',
    'src/editor/editor.html',
  ];
  for (const file of files) {
    const svg = read(file).toString();
    assert.match(svg, /M23 43V29.*?M105 43V29.*?M23 85V99.*?M105 85v14/, file);
    assert.match(svg, /<rect x="57" y="57" width="14" height="14"/, file);
    assert.doesNotMatch(svg, /M85 43V29|M85 85v14/, file);
  }
});

// Parse the actual PNG structure rather than trusting only its 24-byte header.
// This also detects truncated or internally corrupted image data in release assets.
const crcTable = Array.from({length: 256}, (_, n) => {
  let c = n;
  for (let i = 0; i < 8; i++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
function pngCrc(bytes) {
  let crc = 0xffffffff;
  for (const byte of bytes) crc = crcTable[(crc ^ byte) & 255] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}
function checkPng(file) {
  const bytes = read(file);
  assert.equal(bytes.subarray(0, 8).toString('hex'), '89504e470d0a1a0a', file);
  let offset = 8, header, ended = false;
  const compressed = [];
  while (offset < bytes.length) {
    assert.ok(offset + 12 <= bytes.length, `${file}: truncated chunk`);
    const length = bytes.readUInt32BE(offset);
    const end = offset + 12 + length;
    assert.ok(end <= bytes.length, `${file}: chunk exceeds file length`);
    const type = bytes.toString('ascii', offset + 4, offset + 8);
    const data = bytes.subarray(offset + 8, offset + 8 + length);
    assert.equal(pngCrc(bytes.subarray(offset + 4, offset + 8 + length)), bytes.readUInt32BE(offset + 8 + length), `${file}: bad ${type} CRC`);
    if (type === 'IHDR') {
      assert.equal(offset, 8, `${file}: IHDR must be first`);
      assert.equal(length, 13, `${file}: IHDR must be 13 bytes`);
      header = {w: data.readUInt32BE(0), h: data.readUInt32BE(4), depth: data[8], color: data[9], compression: data[10], filter: data[11], interlace: data[12]};
    }
    if (type === 'IDAT') compressed.push(data);
    if (type === 'IEND') {
      assert.equal(length, 0, `${file}: IEND must be empty`);
      assert.equal(end, bytes.length, `${file}: trailing bytes after IEND`);
      ended = true;
    }
    offset = end;
  }
  assert.ok(header && ended && compressed.length, `${file}: missing mandatory PNG chunks`);
  assert.equal(header.depth, 8, `${file}: expected 8-bit pixels`);
  assert.ok([2, 6].includes(header.color), `${file}: expected RGB/RGBA`);
  assert.equal(header.compression, 0, `${file}: unsupported compression`);
  assert.equal(header.filter, 0, `${file}: unsupported filter method`);
  assert.equal(header.interlace, 0, `${file}: unexpected interlacing`);
  const pixels = inflateSync(Buffer.concat(compressed));
  const scanline = header.w * (header.color === 6 ? 4 : 3) + 1;
  assert.equal(pixels.length, scanline * header.h, `${file}: incomplete decompressed pixels`);
  for (let row = 0; row < header.h; row++)
    assert.ok(pixels[row * scanline] <= 4, `${file}: invalid scanline filter at row ${row}`);
}
test('all browser icons and brand PNG exports have valid chunks, CRCs and decoded scanline lengths', () => {
  for (const file of [
    ...[16, 32, 48, 128, 256].map(n => `icons/icon${n}.png`),
    'branding/logo/mark-dark-512.png', 'branding/logo/mark-light-512.png',
    'branding/store/small-promo-440x280.png', 'branding/store/marquee-1400x560.png'
  ]) checkPng(file);
});
