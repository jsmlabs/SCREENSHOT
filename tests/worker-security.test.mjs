import {assertCaptureSource} from '../src/capture/capture-source.mjs';
import {SETTINGS_KEY,normalizeSettings,keysToPrune} from '../src/shared/preferences.mjs';
import {pageMetricsStable,totalCaptureBytes} from '../src/capture/capture-integrity.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {dirname,resolve} from 'node:path';
import {timerSeconds,captureBounds,tilePositions,validateFullSize} from '../src/capture/capture-plan.mjs';
import {createCaptureLifecycle,throwIfCancelled,cancellableDelay,withTimeout,CAPTURE_TIMEOUT_MS} from '../src/capture/capture-lifecycle.mjs';
import {isTrustedUiSender,isSelectionSender} from '../src/shared/message-policy.mjs';
const source=readFileSync(resolve(dirname(fileURLToPath(import.meta.url)),'../src/background/background.js'),'utf8').replace(/^import .*?;\r?\n/gm,'');
test('Untrusted runtime messages cannot start, cancel or open capture window',async()=>{
  let handler, called=0;
  const chrome={
    runtime:{id:'test',getURL:path=>'chrome-extension://test/'+path,onMessage:{addListener:f=>handler=f}},
    scripting:{executeScript:async()=>{called++;return[];}},
    windows:{create:async()=>{called++;return{id:1};}},
    tabs:{onRemoved:{addListener:()=>{}}}
  };
  vm.runInNewContext(source,{chrome,console,Date,Number,Math,Promise,setTimeout,clearTimeout,AbortController,assertCaptureSource,createCaptureLifecycle,throwIfCancelled,cancellableDelay,withTimeout,CAPTURE_TIMEOUT_MS,pageMetricsStable,totalCaptureBytes,timerSeconds,captureBounds,tilePositions,validateFullSize,isTrustedUiSender,isSelectionSender,SETTINGS_KEY,normalizeSettings,keysToPrune});
  const send=(type,sender)=>new Promise(resolve=>handler({type,mode:'visible',tabId:1},sender,resolve));
  for(const type of ['START','CANCEL_CAPTURE','STATUS','OPEN_WINDOW_PREVIEW']){
    const response=await send(type,{id:'test',tab:{id:1},url:'https://example.org',frameId:0});
    assert.equal(response.ok,false);
  }
  assert.equal(called,0);
});
