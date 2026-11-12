import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {translations} from '../src/shared/locales.mjs';
import {createHistoryUndo} from '../src/shared/history-undo.mjs';

const popup = readFileSync(new URL('../src/popup/popup.js', import.meta.url),'utf8');
const html = readFileSync(new URL('../src/popup/popup.html', import.meta.url),'utf8');
const record = {data:'data:image/png;base64,abc',name:'sample',created:100,mode:'visible',favorite:true};
function harness() {
  const entries = new Map([['capture:one',record]]);
  let failRemove=false,failSet=false;
  const storage = {
    async remove(key){if(failRemove)throw Error('delete failed');entries.delete(key);},
    async get(key){return {[key]:entries.get(key)};},
    async set(obj){if(failSet)throw Error('restore failed');for(const [key,value] of Object.entries(obj))entries.set(key,value);}
  };
  const history = createHistoryUndo(storage);
  return {history,entries,set failRemove(v){failRemove=v;},set failSet(v){failSet=v;}};
}
test('a deleted capture can be recovered with original image, name and favorite metadata',async()=>{
  const h=harness();await h.history.remove('capture:one',record);
  assert.equal(h.entries.has('capture:one'),false);assert.equal(h.history.canUndo,true);
  assert.equal(await h.history.undo(),true);
  assert.deepEqual(h.entries.get('capture:one'),record);
  assert.equal(h.history.canUndo,false);assert.equal(await h.history.undo(),false);
});
test('failed deletion does not offer undo; failed restore keeps recovery possible',async()=>{
  const h=harness();h.failRemove=true;
  await assert.rejects(h.history.remove('capture:one',record),/delete failed/);
  assert.equal(h.history.canUndo,false);assert.ok(h.entries.has('capture:one'));
  h.failRemove=false;await h.history.remove('capture:one',record);
  h.failSet=true;await assert.rejects(h.history.undo(),/restore failed/);
  assert.equal(h.history.canUndo,true);h.failSet=false;
  assert.equal(await h.history.undo(),true);
});
test('undo never overwrites a later record at the same key, and can be cleared',async()=>{
  const h=harness();await h.history.remove('capture:one',record);
  h.entries.set('capture:one',{name:'newer'});
  assert.equal(await h.history.undo(),false);
  assert.deepEqual(h.entries.get('capture:one'),{name:'newer'});
  await h.history.remove('capture:one',record);h.history.clear();
  assert.equal(h.history.canUndo,false);
});
test('multiple captures can be restored in reverse deletion order',async()=>{
  const h=harness();
  const second={...record,name:'second',created:200};
  h.entries.set('capture:two',second);
  await h.history.remove('capture:one',record);
  await h.history.remove('capture:two',second);
  assert.equal(h.history.count,2);
  assert.equal(await h.history.undo(),true);
  assert.deepEqual(h.entries.get('capture:two'),second);
  assert.equal(h.history.count,1);
  assert.equal(await h.history.undo(),true);
  assert.deepEqual(h.entries.get('capture:one'),record);
  assert.equal(h.history.canUndo,false);
});
test('only the five most recent deletions remain recoverable',async()=>{
  const h=harness();
  for(let i=0;i<7;i++){
    const key=`capture:${i}`;
    await h.history.remove(key,{...record,name:String(i)});
  }
  assert.equal(h.history.count,5);
  for(let i=6;i>=2;i--){
    assert.equal(await h.history.undo(),true);
    assert.equal(h.entries.get(`capture:${i}`).name,String(i));
  }
  assert.equal(await h.history.undo(),false);
  assert.equal(h.entries.has('capture:0'),false);
  assert.equal(h.entries.has('capture:1'),false);
});
test('failed restore and key collision preserve earlier pending recoveries',async()=>{
  const h=harness();
  await h.history.remove('capture:one',record);
  await h.history.remove('capture:two',{...record,name:'second'});
  h.failSet=true;
  await assert.rejects(h.history.undo(),/restore failed/);
  assert.equal(h.history.count,2);
  h.failSet=false;
  h.entries.set('capture:two',{name:'replacement'});
  assert.equal(await h.history.undo(),false);
  assert.equal(h.history.count,1);
  assert.equal(await h.history.undo(),true);
  assert.deepEqual(h.entries.get('capture:one'),record);
});
test('repeated deletion of the same key replaces its stale undo entry',async()=>{
  const h=harness();
  await h.history.remove('capture:one',record);
  const replacement={...record,name:'replacement'};
  await h.history.remove('capture:one',replacement);
  assert.equal(h.history.count,1);
  await h.history.undo();
  assert.deepEqual(h.entries.get('capture:one'),replacement);
});
test('popup wires session-scoped undo and retains confirmation for clearing all captures',()=>{
  assert.match(popup,/historyUndo\.remove\(key,record\)/);
  assert.match(popup,/historyUndo\.undo\(\)/);
  assert.match(popup,/historyUndo\.clear\(\)/);
  assert.match(popup,/window\.confirm\(t\('Möchtest du alle Aufnahmen/);
  assert.match(html,/id="history-undo-button"/);
});
test('undo feedback is available in every supported language',()=>{
  for(const language of ['de','en','fr','it','es']) {
    for(const key of ['Aufnahme gelöscht.','Rückgängig']) assert.ok(translations[language]?.[key],`${language}: ${key}`);
  }
});
