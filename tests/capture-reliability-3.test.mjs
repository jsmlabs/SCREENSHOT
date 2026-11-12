import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {assertCaptureSource} from '../src/capture/capture-source.mjs';
import {createCaptureLifecycle,throwIfCancelled,cancellableDelay,withTimeout,CAPTURE_TIMEOUT_MS} from '../src/capture/capture-lifecycle.mjs';
import {pageMetricsStable,totalCaptureBytes} from '../src/capture/capture-integrity.mjs';
import {timerSeconds,captureBounds,tilePositions,validateFullSize} from '../src/capture/capture-plan.mjs';
import {isTrustedUiSender,isSelectionSender} from '../src/shared/message-policy.mjs';
import {SETTINGS_KEY,normalizeSettings,keysToPrune} from '../src/shared/preferences.mjs';

const tab={id:3,windowId:6,active:true,url:'https://example.com/a#before'};
test('only active, accessible HTTP(S) tabs can be captured',()=>{
  assert.deepEqual(assertCaptureSource(tab),{id:3,windowId:6,url:tab.url});
  for (const invalid of [{...tab,active:false},{...tab,url:'chrome://settings'}, {...tab,url:'file:///tmp/x'}, {...tab,id:undefined},{...tab,windowId:null}])
    assert.throws(()=>assertCaptureSource(invalid),/Quell/);
});
test('source continuity accepts hash-only navigation and rejects origin/window/document changes',()=>{
  const expected=assertCaptureSource(tab);
  assert.doesNotThrow(()=>assertCaptureSource({...tab,url:'https://example.com/a#after'},expected));
  for (const mismatch of [{...tab,url:'https://example.com/b'}, {...tab,url:'https://elsewhere.com/a'}, {...tab,windowId:8}, {...tab,id:4}])
    assert.throws(()=>assertCaptureSource(mismatch,expected),/gewechselt/);
});
function boot({capturePng, storePng}={}){
  let handle;let captures=0;let previews=0;let records=[];let current={...tab};
  const data='data:image/png;base64,aGVsbG8=';
  const chrome={
    runtime:{id:'test',getURL:p=>'chrome-extension://test/'+p,onMessage:{addListener:f=>handle=f},sendMessage:async()=>({ok:true,data})},
    tabs:{onRemoved:{addListener:()=>{}},get:async()=>({...current}),captureVisibleTab:async()=>{captures++;if(capturePng)return capturePng(()=>current,v=>current=v,data);return data;}},
    scripting:{executeScript:async()=>[{result:{width:100,height:100,x:0,y:0}}]},
    offscreen:{hasDocument:async()=>true},
    storage:{local:{get:async()=>({}),set:async item=>{if(storePng)await storePng();records.push(...Object.values(item));},remove:async()=>{}}},
    windows:{getAll:async()=>[],create:async()=>{previews++;return{id:13};},update:async()=>{}}
  };
  const sandbox={chrome,crypto:{randomUUID:()=> 'b'.repeat(36)},console,Promise,setTimeout,clearTimeout,AbortController,Date,Number,Math,assertCaptureSource,createCaptureLifecycle,throwIfCancelled,cancellableDelay,withTimeout,CAPTURE_TIMEOUT_MS,pageMetricsStable,totalCaptureBytes,timerSeconds,captureBounds,tilePositions,validateFullSize,isTrustedUiSender,isSelectionSender,SETTINGS_KEY,normalizeSettings,keysToPrune};
  const source=readFileSync(new URL('../src/background/background.js',import.meta.url),'utf8').replace(/^import .*?;\n/gm,'');
  vm.runInNewContext(source,sandbox);
  const send=m=>new Promise(resolve=>handle(m,{id:'test',url:'chrome-extension://test/src/editor/editor.html'},resolve));
  return {send, setTab:v=>{current=v;},get captures(){return captures;},get previews(){return previews;},get records(){return records;}};
}
const settle=()=>new Promise(resolve=>setTimeout(resolve,35));
test('navigation during PNG capture fails closed; old screenshot is not overwritten by a new successful image',async()=>{
  const h=boot({capturePng:async(get,set,data)=>{set({...get(),url:'https://example.com/elsewhere'});return data;}});
  assert.equal((await h.send({type:'START',mode:'visible',tabId:3})).ok,true);
  await new Promise(resolve=>setTimeout(resolve,140));
  assert.equal(h.captures,1);
  assert.ok(h.records.every(record=>!record.data),"Navigation must not publish a screenshot as successful");
  assert.equal((await h.send({type:'STATUS'})).state,'idle');
});
test('cancel while previous capture is still publishing blocks a second capture until cleanup finishes',async()=>{
  let release;
  const gate=new Promise(resolve=>{release=resolve;});
  const h=boot({storePng:()=>gate});
  assert.equal((await h.send({type:'START',mode:'visible',tabId:3})).ok,true);
  await settle();
  assert.equal((await h.send({type:'CANCEL_CAPTURE'})).cancelled,true);
  const retry=await h.send({type:'START',mode:'visible',tabId:3});
  assert.equal(retry.ok,false);
  assert.match(retry.error,/abgeschlossen/);
  release();
  await settle();
  assert.equal((await h.send({type:'START',mode:'visible',tabId:3})).ok,true);
});
test('failed capture keeps prior history rather than pruning it at the retention limit',async()=>{
  const old='capture:'+'a'.repeat(36);
  const existing={[SETTINGS_KEY]:{historyLimit:1,historyDays:7},[old]:{data:'data:image/png;base64,aGVsbG8=',mode:'visible',created:Date.now()}};
  let handler;
  const chrome={
    runtime:{id:'test',getURL:p=>'chrome-extension://test/'+p,onMessage:{addListener:f=>handler=f},sendMessage:async()=>{throw Error('image processing failed');}},
    tabs:{onRemoved:{addListener:()=>{}},get:async()=>({...tab}),captureVisibleTab:async()=> 'data:image/png;base64,aGVsbG8='},
    scripting:{executeScript:async()=>[{result:{width:100,height:100,x:0,y:0}}]},
    offscreen:{hasDocument:async()=>true},
    storage:{local:{get:async()=>({...existing}),set:async item=>Object.assign(existing,item),remove:async keys=>{for(const key of [keys].flat())delete existing[key];}}},
    windows:{getAll:async()=>[],create:async()=>({id:14}),update:async()=>{}}
  };
  const sandbox={chrome,crypto:{randomUUID:()=> 'b'.repeat(36)},console,Promise,setTimeout,clearTimeout,AbortController,Date,Number,Math,assertCaptureSource,createCaptureLifecycle,throwIfCancelled,cancellableDelay,withTimeout,CAPTURE_TIMEOUT_MS,pageMetricsStable,totalCaptureBytes,timerSeconds,captureBounds,tilePositions,validateFullSize,isTrustedUiSender,isSelectionSender,SETTINGS_KEY,normalizeSettings,keysToPrune};
  vm.runInNewContext(readFileSync(new URL('../src/background/background.js',import.meta.url),'utf8').replace(/^import .*?;\n/gm,''),sandbox);
  await new Promise(resolve=>handler({type:'START',mode:'visible',tabId:3},{id:'test',url:'chrome-extension://test/src/editor/editor.html'},resolve));
  await new Promise(resolve=>setTimeout(resolve,140));
  assert.ok(existing[old], 'Existing capture must survive a failed new attempt');
  assert.match(existing['capture:'+'b'.repeat(36)]?.error||'',/image processing failed/);
});
