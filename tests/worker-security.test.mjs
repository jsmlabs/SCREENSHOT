import {SETTINGS_KEY,normalizeSettings,keysToPrune} from '../preferences.mjs';
import {pageMetricsStable,totalCaptureBytes} from '../capture-integrity.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {dirname,resolve} from 'node:path';
import {timerSeconds,captureBounds,tilePositions,validateFullSize} from '../capture-plan.mjs';
import {createCaptureLifecycle,throwIfCancelled,cancellableDelay,withTimeout,CAPTURE_TIMEOUT_MS} from '../capture-lifecycle.mjs';
import {isTrustedUiSender,isSelectionSender} from '../message-policy.mjs';
const source=readFileSync(resolve(dirname(fileURLToPath(import.meta.url)),'../background.js'),'utf8').replace(/^import .*?;\n/gm,'');
test('Untrusted runtime messages cannot start, cancel or open capture window',async()=>{
  let handler, called=0;
  const chrome={
    runtime:{id:'test',getURL:path=>'chrome-extension://test/'+path,onMessage:{addListener:f=>handler=f}},
    scripting:{executeScript:async()=>{called++;return[];}},
    windows:{create:async()=>{called++;return{id:1};}},
    tabs:{onRemoved:{addListener:()=>{}}}
  };
  vm.runInNewContext(source,{chrome,console,Date,Number,Math,Promise,setTimeout,clearTimeout,AbortController,createCaptureLifecycle,throwIfCancelled,cancellableDelay,withTimeout,CAPTURE_TIMEOUT_MS,pageMetricsStable,totalCaptureBytes,timerSeconds,captureBounds,tilePositions,validateFullSize,isTrustedUiSender,isSelectionSender,SETTINGS_KEY,normalizeSettings,keysToPrune});
  const send=(type,sender)=>new Promise(resolve=>handler({type,mode:'visible',tabId:1},sender,resolve));
  for(const type of ['START','CANCEL_CAPTURE','STATUS','OPEN_WINDOW_PREVIEW']){
    const response=await send(type,{id:'test',tab:{id:1},url:'https://example.org',frameId:0});
    assert.equal(response.ok,false);
  }
  assert.equal(called,0);
});
