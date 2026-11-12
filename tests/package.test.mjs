import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {dirname,resolve} from 'node:path';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const read=name=>readFileSync(resolve(root,name),'utf8');
const manifest=JSON.parse(read('manifest.json'));
test('MV3 manifest, v1.18.3, valid local entrypoints',()=>{
  assert.equal(manifest.manifest_version,3);
  assert.equal(manifest.version,'1.18.3');
  for(const name of [manifest.background.service_worker,manifest.action.default_popup,'src/editor/editor.html','src/offscreen/offscreen.html'])assert.ok(existsSync(resolve(root,name)),name);
});
test('No external scripts or host-wide permissions',()=>{
  assert.ok(!manifest.host_permissions);
  for(const page of ['src/popup/popup.html','src/editor/editor.html','src/offscreen/offscreen.html'])assert.doesNotMatch(read(page),/<script[^>]+src=["']https?:/i);
});
test('Four modes and PNG save/clipboard are retained',()=>{
  for(const mode of ['area','element','visible','window','full'])assert.match(read('src/popup/popup.html'),new RegExp(`data-mode="${mode}"`));
  assert.match(read('src/editor/editor.js'),/copyPngToClipboard\(/);
  assert.doesNotMatch(read('src/offscreen/offscreen.js'),/copyPngToClipboard\(/);
  assert.ok(manifest.permissions.includes('clipboardWrite'));
  assert.doesNotMatch(read('src/background/background.js'),/reasons: \[.*'CLIPBOARD'/);
  assert.match(read('src/editor/editor.js'),/image\/png/);
});
test('Per-capture storage prevents stale preview and concurrent window races',()=>{
  assert.match(read('src/background/background.js'),/crypto\.randomUUID\(\)/);
  assert.match(read('src/background/background.js'),/`capture:\$\{id\}`/);
  assert.match(read('src/editor/editor.js'),/params\.get\('id'\)/);
  assert.match(read('src/background/background.js'),/86_400_000/);
});
test('Popup is focused after creation; no new tabs',()=>{
  assert.match(read('src/background/background.js'),/chrome\.windows\.create\(/);
  assert.match(read('src/background/background.js'),/focused:\s*true/);
  assert.match(read('src/background/background.js'),/chrome\.windows\.update\(preview\.id, \{focused:\s*true\}\)/);
  assert.doesNotMatch(read('src/background/background.js'),/chrome\.tabs\.create\(/);
});
test('Full-page scroll restored before publishing image',()=>{
  const code=read('src/background/background.js');
  assert.ok(code.indexOf('window.scrollTo({left: state.x')<code.lastIndexOf('await publishCapture(result, signal)'));
  assert.match(code,/tilePositions\(height, viewport\.height\)/);
});
test('Selection can be cancelled without locking captures',()=>{
  assert.match(read('src/capture/selection.js'),/CANCEL_SELECTION/);
  assert.match(read('src/background/background.js'),/CANCEL_SELECTION/);
});
test('Single 6px clipping viewport and accessible controls',()=>{
  assert.match(read('src/shared/style.css'),/--preview-gap:6px/);
  assert.match(read('src/shared/style.css'),/inset:var\(--preview-gap\);overflow:hidden/);
  for(const id of ['viewport','zoom-in','zoom-out','fit','actual','save','copy'])assert.match(read('src/editor/editor.html'),new RegExp(`id="${id}"`));
  for(const evt of ['pointerdown','pointermove','pointerup','wheel','keydown'])assert.match(read('src/editor/editor.js'),new RegExp(`'${evt}'`));
});
test('Quick Edit controls and local modules available',()=>{
  for(const tool of ['pan','crop','rect','arrow','pen','text'])assert.match(read('src/editor/editor.html'),new RegExp(`data-tool="${tool}"`));
  for(const id of ['undo','redo','reset-edit','overlay','edit-color'])assert.match(read('src/editor/editor.html'),new RegExp(`id="${id}"`));
  for(const file of ['src/editor/edit-model.mjs','src/editor/edit-render.mjs'])assert.ok(existsSync(resolve(root,file)));
  assert.match(read('src/editor/editor.js'),/renderEdit\(/);
  assert.match(read('src/editor/editor.js'),/renderedData/);
});

test('Smart Capture entry points and module worker are declared',()=>{
  assert.equal(manifest.background.type,'module');
  assert.ok(existsSync(resolve(root,'src/capture/capture-plan.mjs')));
  assert.ok(existsSync(resolve(root,'src/capture/element-selection.js')));
  assert.match(read('src/popup/popup.html'),/id="capture-timer"/);
  assert.match(read('src/background/background.js'),/timerSeconds\(/);
  assert.match(read('src/background/background.js'),/tilePositions\(/);
  assert.match(read('src/background/background.js'),/screenshot-v15-hide-floating/);
});

test('Element selection has visible highlight, Escape cancellation, cleanup and selected bounds',()=>{
  const source=read('src/capture/element-selection.js');
  for(const part of ['elementFromPoint','getBoundingClientRect','SELECTED','CANCEL_SELECTION','Escape','stopImmediatePropagation','pointer-events:none']) assert.ok(source.includes(part),part);
  assert.match(read('src/offscreen/offscreen.js'),/mode==='area'\|\|mode==='element'/);
});
test('Full page restores sticky overlays and scroll position before preview',()=>{
  const code=read('src/background/background.js');
  assert.match(code,/screenshot-v15-hide-floating/);
  assert.match(code,/visibility:hidden!important/);
  assert.match(code,/document\.getElementById\('screenshot-v15-hide-floating'\)\?\.remove\(\)/);
  assert.ok(code.indexOf('document.getElementById(\'screenshot-v15-hide-floating\')?.remove()')<code.indexOf('await publishCapture(result, signal)'));
  assert.match(code,/Math\.abs\(pos\.y-y\)>2/);
});
test('v1.6 cancellation UI and bounded browser operations are integrated',()=>{
  assert.ok(existsSync(resolve(root,'src/capture/capture-lifecycle.mjs')));
  assert.match(read('src/popup/popup.html'),/id="cancel-capture"/);
  assert.match(read('src/popup/popup.js'),/type:'CANCEL_CAPTURE'/);
  for(const operation of ['STATUS','CANCEL_CAPTURE','CANCEL_SELECTION']) assert.match(read('src/background/background.js'),new RegExp(operation));
  assert.match(read('src/background/background.js'),/withTimeout\(\(\) => chrome\.tabs\.captureVisibleTab/);
  assert.match(read('src/background/background.js'),/withTimeout\(\(\) => chrome\.runtime\.sendMessage/);
  assert.match(read('src/background/background.js'),/finally \{ lifecycle\.finish\(job\); runningJobs--; \}/);
});

test('v1.7 pixel-fidelity renderer uses bounded source rectangles and image cleanup',()=>{
  assert.ok(existsSync(resolve(root,'src/capture/capture-fidelity.mjs')));
  assert.match(read('src/offscreen/offscreen.html'),/type="module"/);
  assert.match(read('src/offscreen/offscreen.js'),/fullTilePlan\(/);
  assert.match(read('src/offscreen/offscreen.js'),/ctx\.imageSmoothingEnabled=false/);
  assert.match(read('src/offscreen/offscreen.js'),/bitmap\.close\(\)/);
});

test('v1.8 preview polish actions are wired',()=>{
  assert.match(read('src/editor/editor.html'),/id="edit-width"/);
  assert.match(read('src/editor/editor.js'),/navigateHistory\(/);
  assert.match(read('src/editor/editor.js'),/normalisedWheelDelta\(/);
  assert.match(read('src/editor/editor.js'),/toolForKey\(/);
  assert.ok(existsSync(resolve(root,'src/editor/editor-interactions.mjs')));
});

test('Phase 03 watchdog and capture integrity are packaged without broad permissions',()=>{
  assert.ok(existsSync(resolve(root,'src/capture/capture-recovery.js')));
  assert.ok(existsSync(resolve(root,'src/capture/capture-integrity.mjs')));
  assert.match(read('src/background/background.js'),/files:\['src\/capture\/capture-recovery.js'\]/);
  assert.match(read('src/background/background.js'),/pageMetricsStable\(/);
  assert.match(read('src/shared/message-policy.mjs'),/totalCaptureBytes\(/);
});
