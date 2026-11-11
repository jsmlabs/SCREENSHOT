import test from 'node:test';
import assert from 'node:assert/strict';
import {copyPngToClipboard} from '../clipboard.mjs';

class FakeClipboardItem { constructor(data) { this.data=data; } }

test('PNG clipboard writer sends image/png blob, never a URL or text',async()=>{
  const original=globalThis.fetch;
  const value={type:'image/png'};
  globalThis.fetch=async()=>({blob:async()=>value});
  let written;
  try {
    await copyPngToClipboard('data:image/png;base64,AA==',{write:async items=>{written=items;}},FakeClipboardItem);
    assert.equal(written.length,1);
    assert.equal(written[0].data['image/png'],value);
  } finally {globalThis.fetch=original;}
});
test('Reject malformed image or unavailable/failed clipboard without pretending success',async()=>{
  await assert.rejects(copyPngToClipboard('https://example.org/img.png',{},FakeClipboardItem),/Ungültiges PNG/);
  await assert.rejects(copyPngToClipboard('data:image/png;base64,AA==',null,FakeClipboardItem),/nicht unterstützt/);
  const original=globalThis.fetch;
  globalThis.fetch=async()=>({blob:async()=>({})});
  try {
    await assert.rejects(copyPngToClipboard('data:image/png;base64,AA==',{write:async()=>{throw new Error('denied');}},FakeClipboardItem),/denied/);
  } finally {globalThis.fetch=original;}
});
