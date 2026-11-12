import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read = path => readFileSync(new URL('../'+path,import.meta.url),'utf8');
const css=read('style.css');
const popup=read('popup.js');
test('popup scroll is bounded and footer remains available on short extension windows',()=>{
  assert.match(css,/\.popup\{[^}]*max-height:600px;[^}]*overflow:hidden/);
  assert.match(css,/\.popup-content\{[^}]*min-height:0;overflow-y:auto/);
  assert.match(css,/\.popup-header,\.popup footer\{flex:none\}/);
});
test('editor workspace controls cannot consume unbounded stage height',()=>{
  assert.match(css,/\.editor\{height:100dvh;min-height:0\}/);
  assert.match(css,/\.editor \.edit-controls\{max-height:min\(38vh,230px\);overflow-y:auto/);
  assert.match(css,/\.editor \.stage\{min-height:0;flex:1 1 0\}/);
  assert.match(css,/@media\(max-height:480px\)/);
});
test('failed preference writes restore displayed values, not just internal settings',()=>{
  assert.match(popup,/function syncPreferenceFields\(\)/);
  assert.match(popup,/catch\(error\)\{preferences=previous;syncPreferenceFields\(\);setInterfaceLanguage\(\);displayError\(error\);\}/);
  assert.match(popup,/const captureTimer = document\.querySelector\('#capture-timer'\)/);
});
test('UI version matches extension manifest',()=>{
  const manifest=JSON.parse(read('manifest.json'));
  assert.equal(manifest.version,'1.18.0');
  assert.match(read('popup.html'),/v1\.18\.0/);
});
