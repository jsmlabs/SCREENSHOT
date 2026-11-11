import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {createCaptureLifecycle,throwIfCancelled,cancellableDelay,withTimeout,CAPTURE_TIMEOUT_MS} from '../capture-lifecycle.mjs';
import {pageMetricsStable,totalCaptureBytes} from '../capture-integrity.mjs';
import {timerSeconds,captureBounds,tilePositions,validateFullSize} from '../capture-plan.mjs';
import {isTrustedUiSender,isSelectionSender} from '../message-policy.mjs';
import {SETTINGS_KEY,normalizeSettings,keysToPrune} from '../preferences.mjs';

function harness({failSet=false,failPreview=false}={}) {
  const oldKey='capture:'+'a'.repeat(36);
  const store={[SETTINGS_KEY]:{historyLimit:1,historyDays:7},[oldKey]:{data:'data:image/png;base64,aGVsbG8=',created:Date.now(),mode:'visible'}};
  let previews=0;
  const chrome={
    runtime:{id:'test',getURL:p=>'chrome-extension://test/'+p,onMessage:{addListener:()=>{}}},
    tabs:{onRemoved:{addListener:()=>{}}},
    windows:{create:async()=>{previews++;if(failPreview)throw Error('preview rejected');return{id:1};},update:async()=>{}},
    storage:{local:{get:async()=>({...store}),set:async obj=>{if(failSet)throw Error('storage full');Object.assign(store,obj);},remove:async keys=>{for(const key of [keys].flat())delete store[key];}}}
  };
  const sandbox={chrome,crypto:{randomUUID:()=> 'b'.repeat(36)},console,Promise,setTimeout,clearTimeout,AbortController,Date,Number,Math,createCaptureLifecycle,throwIfCancelled,cancellableDelay,withTimeout,CAPTURE_TIMEOUT_MS,pageMetricsStable,totalCaptureBytes,timerSeconds,captureBounds,tilePositions,validateFullSize,isTrustedUiSender,isSelectionSender,SETTINGS_KEY,normalizeSettings,keysToPrune};
  const context=vm.createContext(sandbox);
  const source=readFileSync(new URL('../background.js',import.meta.url),'utf8').replace(/^import .*?;\n/gm,'');
  vm.runInContext(source+'\nglobalThis.__publishCapture = publishCapture;',context);
  return {publish:()=>context.__publishCapture({data:'data:image/png;base64,aGVsbG8=',mode:'visible'}),store,oldKey,get previews(){return previews;}};
}

test('storage failure retains previous capture',async()=>{
  const h=harness({failSet:true});
  await assert.rejects(h.publish(),/storage full/);
  assert.ok(h.store[h.oldKey]);assert.equal(h.previews,0);
});
test('preview failure rolls back new image without pruning prior capture',async()=>{
  const h=harness({failPreview:true});
  await assert.rejects(h.publish(),/preview rejected/);
  assert.ok(h.store[h.oldKey]);assert.equal(Object.keys(h.store).filter(x=>x.startsWith('capture:')).length,1);
});
test('successful preview commits then prunes excess history',async()=>{
  const h=harness();await h.publish();
  assert.equal(h.previews,1);assert.equal(h.store[h.oldKey],undefined);
  assert.equal(Object.keys(h.store).filter(x=>x.startsWith('capture:')).length,1);
});
