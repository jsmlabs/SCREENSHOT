import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const source = name => readFileSync(new URL('../'+name, import.meta.url),'utf8');
test('Clipboard is written only from focused editor, never from offscreen', () => {
  const editor = source('src/editor/editor.js');
  const offscreen = source('src/offscreen/offscreen.js');
  const worker = source('src/background/background.js');
  assert.match(editor,/document\.hasFocus\(\)/);
  assert.match(editor,/window\.addEventListener\('focus'/);
  assert.match(editor,/document\.addEventListener\('keydown', \(\) => void automaticClipboard\.flush\(\)\)/);
  assert.match(editor,/render\(\(\) => \{scheduleAutomaticCopy\(value\);if\(new URLSearchParams\(location.search\).get\('fresh'\)==='1'\)void autoSaveOriginal\(value\);\}\)/);
  assert.match(editor,/document\.addEventListener\('visibilitychange'/);
  assert.match(editor,/render\(\(\) => \{scheduleAutomaticCopy\(value\);if\(new URLSearchParams\(location.search\).get\('fresh'\)==='1'\)void autoSaveOriginal\(value\);\}\)/);
  assert.match(editor,/automaticClipboard\.cancelAndWait\(\)/);
  assert.match(editor,/createAutomaticClipboard/);
  assert.doesNotMatch(offscreen,/copyPngToClipboard/);
  assert.doesNotMatch(worker,/response\.clipboard/);
});
test('Popup uses compact capture rows', () => {
  const css=source('src/shared/style.css');
  assert.match(css,/\.capture-options button\s*\{[^}]*min-height:48px/s);
});
