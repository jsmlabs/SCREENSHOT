import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read = name => readFileSync(new URL('../'+name,import.meta.url),'utf8');
test('Phase 02 capture choices have distinct accessible SVG artwork and still trigger all five modes', () => {
 const popup=read('popup.html');
 for(const mode of ['area','element','visible','window','full']) {
   const tag=popup.match(new RegExp(`<button[^>]*data-mode="${mode}"[^>]*>([\\s\\S]*?)<\\/button>`));
   assert.ok(tag, mode);assert.match(tag[1],/<svg\b/);assert.match(tag[1],/<b>[^<]+<\/b>/);
 }
 assert.match(popup,/aria-live="polite" aria-atomic="true"/);
});
test('Phase 02 editor icons preserve accessible names at narrow widths',()=>{
 const editor=read('editor.html'),style=read('style.css');
 for(const mode of ['pan','crop','rect','arrow','pen','text'])
   assert.match(editor,new RegExp(`data-tool="${mode}" aria-label="[^"]+"`));
 for(const id of ['copy','save'])assert.match(editor,new RegExp(`id="${id}"[^>]*aria-label="[^"]+"`));
 assert.match(style,/@media\(max-width:620px\)/);
 assert.match(style,/\.editor \.edit-controls \.tool span\{display:none\}/);
 assert.match(editor,/<details class="shortcut-help">/);
 assert.match(editor,/<summary aria-label="Tastenkürzel anzeigen">/);
 assert.match(style, /\.shortcut-help summary:focus-visible/);
});
test('Phase 02 status stays semantic and capture start is guarded against repeated clicks',()=>{
 const js=read('popup.js');
 assert.match(js,/if \(starting\) return;/);
 assert.match(js,/status\.className = 'busy'/);
 assert.match(js,/status\.className = 'error'/);
 assert.match(read('style.css'),/prefers-reduced-motion/);
 assert.match(read('style.css'),/prefers-color-scheme:light/);
});
