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
const source = readFileSync(resolve(dirname(fileURLToPath(import.meta.url)), '../background.js'),'utf8');
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));

test('Visible capture stores unique image and focuses popup on each request', async()=>{
  const listeners = new Map(), store = {}, events = [];
  let nextId=0;
  const chrome = {
    runtime: {id:'test',
      onMessage:{addListener:f=>listeners.set('message',f)},
      getURL:p=>'chrome-extension://test/'+p,
      sendMessage:async m=>({ok:true,data:'data:image/png;base64,aGVsbG8='})
    },
    tabs: {
      onRemoved:{addListener:f=>listeners.set('removed',f)},
      get:async()=>({id:1,url:'https://example.org',active:true,windowId:7}),
      captureVisibleTab:async()=>('data:image/png;base64,aGVsbG8=')
    },
    scripting:{executeScript:async()=>[{result:{width:500,height:300,x:0,y:0}}]},
    offscreen:{hasDocument:async()=>true},
    storage:{local:{
      get:async()=>structuredClone(store),
      set:async object=>{Object.assign(store,object);events.push('stored');},
      remove:async key=>{for(const k of [key].flat())delete store[k];}
    }},
    windows:{
      create:async options=>{events.push('create');assert.equal(options.focused,true);assert.equal(options.type,'popup');return {id:++nextId};},
      update:async(id, options)=>{events.push('focus');assert.equal(options.focused,true);}
    }
  };
  const context=vm.createContext({chrome,crypto:{randomUUID:()=>String(++nextId).padStart(36,'0')},console,Promise,setTimeout,Date,Number,Math});
  context.assertCaptureSource=assertCaptureSource;context.createCaptureLifecycle=createCaptureLifecycle;context.throwIfCancelled=throwIfCancelled;context.cancellableDelay=cancellableDelay;context.withTimeout=withTimeout;context.CAPTURE_TIMEOUT_MS=CAPTURE_TIMEOUT_MS;context.pageMetricsStable=pageMetricsStable;context.totalCaptureBytes=totalCaptureBytes;context.AbortController=AbortController;context.clearTimeout=clearTimeout;context.timerSeconds=timerSeconds;context.captureBounds=captureBounds;context.tilePositions=tilePositions;context.validateFullSize=validateFullSize;context.isTrustedUiSender=isTrustedUiSender;context.isSelectionSender=isSelectionSender;context.SETTINGS_KEY=SETTINGS_KEY;context.normalizeSettings=normalizeSettings;context.keysToPrune=keysToPrune;
  vm.runInContext(source.replace(/^import .*?;\n/gm,''),context);
  const send=async message=>new Promise(resolve=>listeners.get('message')(message,{id:'test',url:'chrome-extension://test/popup.html'},resolve));
  for(let n=0;n<2;n++){
    assert.equal((await send({type:'START',mode:'visible',tabId:1})).ok,true);
    for(let i=0;i<30&&events.filter(e=>e==='focus').length<=n;i++)await pause(25);
    assert.equal(events.filter(e=>e==='focus').length,n+1);
  }
  assert.deepEqual(events,['stored','create','focus','stored','create','focus']);
  assert.equal(Object.keys(store).filter(k=>k.startsWith('capture:')).length,2);
  for (const [key, value] of Object.entries(store)) if (key.startsWith('capture:')) {
    assert.equal(value.mode, 'visible');
    assert.equal(value.data, 'data:image/png;base64,aGVsbG8=');
    assert.equal(value.error, undefined);
  }
});
