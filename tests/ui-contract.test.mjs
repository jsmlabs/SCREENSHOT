import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read = name => readFileSync(new URL('../'+name,import.meta.url),'utf8');
test('popup 2.0 retains capture entry points, timer, cancellation and live status',()=>{
  const html=read('popup.html');
  for(const mode of ['area','element','visible','window','full']) assert.match(html,new RegExp(`data-mode="${mode}"`));
  for(const id of ['capture-timer','cancel-capture','status']) assert.match(html,new RegExp(`id="${id}"`));
  assert.match(html,/Automatisch in die Zwischenablage/);
  assert.match(html,/aria-live="polite"/);
});
test('editor 2.0 retains all working controls, viewport geometry and live feedback',()=>{
  const html=read('editor.html'),css=read('style.css');
  for(const id of ['window','copy','save','zoom-out','zoom-in','zoom-value','fit','actual','view-hint','edit-color','edit-width','undo','redo','reset-edit','notice','stage','viewport','preview','overlay'])
    assert.match(html,new RegExp(`id="${id}"`));
  for(const tool of ['pan','crop','rect','arrow','pen','text']) assert.match(html,new RegExp(`data-tool="${tool}"`));
  assert.match(css,/--preview-gap:6px/);
  assert.match(css,/inset:var\(--preview-gap\)/);
  assert.match(css,/@media\s*\(prefers-color-scheme:light\)/);
  assert.match(css,/:focus-visible/);
  assert.match(css, /prefers-reduced-motion/);
});
