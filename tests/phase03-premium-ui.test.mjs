import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read = name => readFileSync(new URL('../'+name,import.meta.url),'utf8');
test('Phase 03 retains five capture modes and accessible state feedback',()=>{
  const popup=read('popup.html');
  for(const mode of ['area','element','visible','window','full']) assert.match(popup,new RegExp(`data-mode="${mode}"`));
  for(const id of ['capture-timer','status','cancel-capture','interface-language','capture-history'])assert.match(popup,new RegExp(`id="${id}"`));
  assert.match(popup,/role="status" aria-live="polite"/);
  assert.match(popup,/v1\.18\.0/);
});
test('Phase 03 preserves editor controls and actual modal semantics',()=>{
  const html=read('editor.html');
  for(const id of ['new-capture','new-capture-dialog','copy','save','undo','redo','edit-color','edit-font-size','zoom-in','zoom-out','notice','viewport']) assert.match(html,new RegExp(`id="${id}"`));
  assert.match(html,/<dialog id="new-capture-dialog"/);
  assert.match(html,/aria-haspopup="dialog"/);
  assert.match(html,/aria-pressed="true"/);
});
test('Phase 03 premium presentation offers responsive, reduced-motion, high-contrast and visible focus variants',()=>{
  const css=read('style.css');
  for(const term of ['SCREENSHOT 1.15.0 - Premium interface layer','prefers-color-scheme:light','prefers-reduced-motion:reduce','forced-colors:active','focus-visible','max-width:440px','max-width:680px','.new-capture-dialog','.history-item','.edit-controls'])assert.ok(css.includes(term),`Missing ${term}`);
  assert.doesNotMatch(css,/@import\s+url\(/i);
});
