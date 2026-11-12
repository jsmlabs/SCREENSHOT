import {assertCaptureSource} from '../capture-source.mjs';
import {SETTINGS_KEY,normalizeSettings,keysToPrune} from '../preferences.mjs';
import {pageMetricsStable,totalCaptureBytes} from '../capture-integrity.mjs';
import {isTrustedUiSender,isSelectionSender} from '../message-policy.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {dirname,resolve} from 'node:path';
import vm from 'node:vm';
import {timerSeconds,captureBounds,tilePositions,validateFullSize} from '../capture-plan.mjs';
import {createCaptureLifecycle,throwIfCancelled,cancellableDelay,withTimeout,CAPTURE_TIMEOUT_MS} from '../capture-lifecycle.mjs';
const source=readFileSync(resolve(dirname(fileURLToPath(import.meta.url)),'../background.js'),'utf8').replace(/^import .*?;\n/gm,'');
const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));
test('worker rejects concurrent delayed capture, allows cancel/retry without stale preview',async()=>{
  let listener, tabRemoved, captures=0, previews=0;
  const chrome={
    runtime:{id:'test',onMessage:{addListener:fn=>listener=fn},getURL:p=>'chrome-extension://test/'+p,sendMessage:async()=>({ok:true,data:'data:image/png;base64,aGVsbG8='})},
    tabs:{onRemoved:{addListener:fn=>tabRemoved=fn},get:async()=>({id:1,active:true,url:'https://example.org',windowId:4}),captureVisibleTab:async()=>{captures++;return 'data:image/png;base64,aGVsbG8=';}},
    scripting:{executeScript:async()=>[{result:{width:100,height:100,x:0,y:0}}]},
    storage:{local:{get:async()=>({}),set:async()=>{},remove:async()=>{}}},
    offscreen:{hasDocument:async()=>true},windows:{getAll:async()=>[],create:async()=>{previews++;return{id:6};},update:async()=>{}}
  };
  const context=vm.createContext({chrome,crypto:{randomUUID:()=>String(previews).padStart(36,'0')},console,Promise,setTimeout,clearTimeout,AbortController,Date,Number,Math,assertCaptureSource,createCaptureLifecycle,throwIfCancelled,cancellableDelay,withTimeout,CAPTURE_TIMEOUT_MS,pageMetricsStable,totalCaptureBytes,timerSeconds,captureBounds,tilePositions,validateFullSize,isTrustedUiSender,isSelectionSender,SETTINGS_KEY,normalizeSettings,keysToPrune});
  vm.runInContext(source,context);
  const send=m=>new Promise(resolve=>listener(m,{id:'test',url:'chrome-extension://test/popup.html'},resolve));
  assert.equal((await send({type:'START',mode:'visible',tabId:1,timer:10})).ok,true);
  assert.equal((await send({type:'STATUS'})).state,'capturing');
  assert.equal((await send({type:'START',mode:'visible',tabId:1})).ok,false);
  assert.equal((await send({type:'CANCEL_CAPTURE'})).cancelled,true);
  assert.equal((await send({type:'STATUS'})).state,'idle');
  await delay(10);
  assert.equal(captures,0); assert.equal(previews,0);
  assert.equal((await send({type:'START',mode:'visible',tabId:1})).ok,true);
  await delay(150);
  assert.equal(captures,1);assert.equal(previews,1);
  tabRemoved(1);
});
