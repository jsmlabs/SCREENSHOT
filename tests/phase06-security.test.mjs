import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=name=>readFileSync(new URL('../'+name,import.meta.url),'utf8');
test('auto-save only runs for a newly captured image, never while reopening history',()=>{
  const worker=read('background.js'),editor=read('editor.js');
  assert.match(worker,/openPreview\(`\?id=\$\{encodeURIComponent\(id\)\}&fresh=1`\)/);
  assert.match(editor,/new URLSearchParams\(location.search\).get\('fresh'\)==='1'/);
  assert.match(editor,/scheduleAutomaticCopy\(value\)/);
});
test('release does not grant remote origin access, external messaging or injected code',()=>{
  const manifest=JSON.parse(read('manifest.json'));
  assert.equal(manifest.manifest_version,3);
  assert.equal(manifest.host_permissions,undefined);
  assert.equal(manifest.externally_connectable,undefined);
  assert.ok(!manifest.permissions.includes('debugger'));
  assert.ok(!manifest.permissions.includes('webRequest'));
  for(const filename of ['popup.js','editor.js','background.js','offscreen.js']){
    assert.doesNotMatch(read(filename),/\beval\s*\(|new Function\s*\(/);
  }
});
