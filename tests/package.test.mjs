import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {dirname,resolve} from 'node:path';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const read=name=>readFileSync(resolve(root,name),'utf8');
const manifest=JSON.parse(read('manifest.json'));
test('V3 manifest, v1.9.1, valid local entrypoints',()=>{
  assert.equal(manifest.manifest_version,3);
  assert.equal(manifest.version,'1.12.0');
  for(const name of [manifest.background.service_worker,manifest.action.default_popup,'editor.html','offscreen.html'])assert.ok(existsSync(resolve(root,name)),name);
});
test('No external scripts or host-wide permissions',()=>{
  assert.ok(!manifest.host_permissions);
  for(const page of ['popup.html','editor.html','offscreen.html'])assert.doesNotMatch(read(page),/<script[^>]+src=["']https?:/i);
});
test('Four modes and PNG save/clipboard are retained',()=>{
  for(const mode of ['area','element','visible','window','full'])assert.match(read('popup.html'),new RegExp(`data-mode="${mode}"`));
  assert.match(read('editor.js'),/copyPngToClipboard\(/);
  assert.doesNotMatch(read('offscreen.js'),/copyPngToClipboard\(/);
  assert.ok(manifest.permissions.includes('clipboardWrite'));
  assert.doesNotMatch(read('background.js'),/reasons: \[.*'CLIPBOARD'/);
  assert.match(read('editor.js'),/image\/png/);
});
test('Per-capture storage prevents stale preview and concurrent window races',()=>{
  assert.match(read('background.js'),/crypto\.randomUUID\(\)/);
  assert.match(read('background.js'),/`capture:\$\{id\}`/);
  assert.match(read('editor.js'),/params\.get\('id'\)/);
  assert.match(read('background.js'),/86_400_000/);
});
test('Popup is focused after creation; no new tabs',()=>{
  assert.match(read('background.js'),/chrome\.windows\.create\(/);
  assert.match(read('background.js'),/focused: true/);
  assert.match(read('background.js'),/chrome\.windows\.update\(preview\.id, \{focused: true\}\)/);
  assert.doesNotMatch(read('background.js'),/chrome\.tabs\.create\(/);
});
test('Full-page scroll restored before publishing image',()=>{
  const code=read('background.js');
  assert.ok(code.indexOf('window.scrollTo({left: state.x')<code.lastIndexOf('await publishCapture(result, signal)'));
  assert.match(code,/tilePositions\(height, viewport\.height\)/);
});
test('Selection can be cancelled without locking captures',()=>{
  assert.match(read('selection.js'),/CANCEL_SELECTION/);
  assert.match(read('background.js'),/CANCEL_SELECTION/);
});
test('Single 6px clipping viewport and accessible controls',()=>{
  assert.match(read('style.css'),/--preview-gap:6px/);
  assert.match(read('style.css'),/inset:var\(--preview-gap\);overflow:hidden/);
  for(const id of ['viewport','zoom-in','zoom-out','fit','actual','save','copy'])assert.match(read('editor.html'),new RegExp(`id="${id}"`));
  for(const evt of ['pointerdown','pointermove','pointerup','wheel','keydown'])assert.match(read('editor.js'),new RegExp(`'${evt}'`));
});
test('Quick Edit controls and local modules available',()=>{
  for(const tool of ['pan','crop','rect','arrow','pen','text'])assert.match(read('editor.html'),new RegExp(`data-tool="${tool}"`));
  for(const id of ['undo','redo','reset-edit','overlay','edit-color'])assert.match(read('editor.html'),new RegExp(`id="${id}"`));
  for(const file of ['edit-model.mjs','edit-render.mjs'])assert.ok(existsSync(resolve(root,file)));
  assert.match(read('editor.js'),/renderEdit\(/);
  assert.match(read('editor.js'),/renderedData/);
});

test('Smart Capture entry points and module worker are declared',()=>{
  assert.equal(manifest.background.type,'module');
  assert.ok(existsSync(resolve(root,'capture-plan.mjs')));
  assert.ok(existsSync(resolve(root,'element-selection.js')));
  assert.match(read('popup.html'),/id="capture-timer"/);
  assert.match(read('background.js'),/timerSeconds\(/);
  assert.match(read('background.js'),/tilePositions\(/);
  assert.match(read('background.js'),/screenshot-v15-hide-floating/);
});

test('Element selection has visible highlight, Escape cancellation, cleanup and selected bounds',()=>{
  const source=read('element-selection.js');
  for(const part of ['elementFromPoint','getBoundingClientRect','SELECTED','CANCEL_SELECTION','Escape','stopImmediatePropagation','pointer-events:none']) assert.ok(source.includes(part),part);
  assert.match(read('offscreen.js'),/mode==='area'\|\|mode==='element'/);
});
test('Full page restores sticky overlays and scroll position before preview',()=>{
  const code=read('background.js');
  assert.match(code,/screenshot-v15-hide-floating/);
  assert.match(code,/visibility:hidden!important/);
  assert.match(code,/document\.getElementById\('screenshot-v15-hide-floating'\)\?\.remove\(\)/);
  assert.ok(code.indexOf('document.getElementById(\'screenshot-v15-hide-floating\')?.remove()')<code.indexOf('await publishCapture(result, signal)'));
  assert.match(code,/Math\.abs\(pos\.y-y\)>2/);
});
test('v1.6 cancellation UI and bounded browser operations are integrated',()=>{
  assert.ok(existsSync(resolve(root,'capture-lifecycle.mjs')));
  assert.match(read('popup.html'),/id="cancel-capture"/);
  assert.match(read('popup.js'),/type:'CANCEL_CAPTURE'/);
  for(const operation of ['STATUS','CANCEL_CAPTURE','CANCEL_SELECTION']) assert.match(read('background.js'),new RegExp(operation));
  assert.match(read('background.js'),/withTimeout\(\(\) => chrome\.tabs\.captureVisibleTab/);
  assert.match(read('background.js'),/withTimeout\(\(\) => chrome\.runtime\.sendMessage/);
  assert.match(read('background.js'),/finally \{ lifecycle\.finish\(job\); \}/);
});

test('v1.7 pixel-fidelity renderer uses bounded source rectangles and image cleanup',()=>{
  assert.ok(existsSync(resolve(root,'capture-fidelity.mjs')));
  assert.match(read('offscreen.html'),/type="module"/);
  assert.match(read('offscreen.js'),/fullTilePlan\(/);
  assert.match(read('offscreen.js'),/ctx\.imageSmoothingEnabled=false/);
  assert.match(read('offscreen.js'),/bitmap\.close\(\)/);
});

test('v1.8 preview polish actions are wired',()=>{
  assert.match(read('editor.html'),/id="edit-width"/);
  assert.match(read('editor.js'),/navigateHistory\(/);
  assert.match(read('editor.js'),/normalisedWheelDelta\(/);
  assert.match(read('editor.js'),/toolForKey\(/);
  assert.ok(existsSync(resolve(root,'editor-interactions.mjs')));
});

test('Phase 03 watchdog and capture integrity are packaged without broad permissions',()=>{
  assert.ok(existsSync(resolve(root,'capture-recovery.js')));
  assert.ok(existsSync(resolve(root,'capture-integrity.mjs')));
  assert.match(read('background.js'),/files:\['capture-recovery.js'\]/);
  assert.match(read('background.js'),/pageMetricsStable\(/);
  assert.match(read('message-policy.mjs'),/totalCaptureBytes\(/);
});
