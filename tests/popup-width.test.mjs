import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read = file => readFileSync(new URL('../' + file, import.meta.url), 'utf8');

test('extension popup has a fixed intrinsic width rather than a viewport-dependent width', () => {
  const html = read('popup.html');
  const css = read('style.css');
  assert.match(html, /<html[^>]*class="popup-root"/);
  assert.match(css, /html\.popup-root\{width:384px;min-width:384px;max-width:none\}/);
  assert.match(css, /html\.popup-root body\.popup\{width:384px;min-width:384px;max-width:none\}/);
  assert.doesNotMatch(css, /\.popup\{width:100vw/);
});

test('extension popup has intrinsic height independent of viewport height', () => {
  const css = read('style.css');
  assert.match(css, /\.popup\{width:384px;height:600px;max-height:600px;background:var\(--bg\)\}/);
  assert.doesNotMatch(css, /\.popup\{[^}]*max-height:[^;}]*100dvh/);
  assert.match(css, /\.popup-content\{flex:1;min-height:0;overflow-y:auto/);
});
