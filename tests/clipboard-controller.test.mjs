import test from 'node:test';
import assert from 'node:assert/strict';
import {createAutomaticClipboard} from '../src/shared/clipboard-flow.mjs';
const settle = () => new Promise(resolve => setImmediate(resolve));
test('focused editor writes original PNG and acknowledges only after success', async () => {
  const states=[]; let resolve;
  const clipboard=createAutomaticClipboard({canWrite:()=>true, write:()=>new Promise(r=>{resolve=r;}),onStatus:s=>states.push(s)});
  clipboard.schedule('png-A');
  assert.deepEqual(states,['pending']); assert.equal(clipboard.pending,true);
  resolve(); await settle();
  assert.deepEqual(states,['pending','copied']); assert.equal(clipboard.pending,false);
});
test('unfocused editor retains pending screenshot until focus',async()=>{
  let focused=false;const written=[];const states=[];
  const clipboard=createAutomaticClipboard({canWrite:()=>focused,write:async data=>written.push(data),onStatus:s=>states.push(s)});
  clipboard.schedule('png');await settle();assert.deepEqual(written,[]);
  focused=true;await clipboard.flush();
  assert.deepEqual(written,['png']);assert.deepEqual(states,['pending','copied']);
});
test('new capture wins race against in-flight write without false success',async()=>{
  let resolveFirst;const writes=[];const states=[];
  const clipboard=createAutomaticClipboard({canWrite:()=>true,write:data=>{
    writes.push(data);return data==='old'?new Promise(r=>resolveFirst=r):Promise.resolve();
  },onStatus:s=>states.push(s)});
  clipboard.schedule('old');clipboard.schedule('new');resolveFirst();await settle();
  assert.deepEqual(writes,['old','new']);assert.deepEqual(states,['pending','pending','copied']);
});
test('write failure reports error and retains screenshot in editor',async()=>{
  const states=[];
  const clipboard=createAutomaticClipboard({canWrite:()=>true,write:async()=>{throw new Error('denied');},onStatus:(s,d)=>states.push([s,d])});
  clipboard.schedule('png');await settle();
  assert.equal(clipboard.pending,false);assert.deepEqual(states.at(-1),['failed','denied']);
});

test('clipboard policy denial remains retryable after user activation', async()=>{
  let attempts=0; const states=[];
  const clipboard=createAutomaticClipboard({canWrite:()=>true,write:async()=>{if(++attempts===1){const error=new Error('gesture required');error.name='NotAllowedError';throw error;}},onStatus:s=>states.push(s)});
  clipboard.schedule('png');await settle();
  assert.equal(clipboard.pending,true);assert.equal(states.at(-1),'blocked');
  await clipboard.flush();assert.equal(clipboard.pending,false);assert.equal(states.at(-1),'copied');
});
test('manual copy cancels pending automatic copy', async()=>{
  let focused=false;const writes=[];
  const clipboard=createAutomaticClipboard({canWrite:()=>focused,write:async d=>writes.push(d),onStatus:()=>{}});
  clipboard.schedule('original');clipboard.cancel();focused=true;await clipboard.flush();
  assert.deepEqual(writes,[]);assert.equal(clipboard.pending,false);
});

test('manual copy waits for in-flight automatic write to finish',async()=>{
  let release;const writes=[];
  const clipboard=createAutomaticClipboard({canWrite:()=>true,write:async d=>{await new Promise(r=>{release=r;});writes.push(d);},onStatus:()=>{}});
  clipboard.schedule('original');await settle();
  let manualStarted=false;const manual=(async()=>{await clipboard.cancelAndWait();manualStarted=true;writes.push('edited');})();
  await settle();assert.equal(manualStarted,false);
  release();await manual;assert.deepEqual(writes,['original','edited']);
});

test('SecurityError remains retryable on a later foreground activation', async()=>{
  let attempts=0;const states=[];
  const clipboard=createAutomaticClipboard({canWrite:()=>true,write:async()=>{if(++attempts===1){const e=new Error('security restriction');e.name='SecurityError';throw e;}},onStatus:s=>states.push(s)});
  clipboard.schedule('png');await settle();
  assert.equal(clipboard.pending,true);assert.equal(states.at(-1),'blocked');
  await clipboard.flush();assert.equal(attempts,2);assert.equal(states.at(-1),'copied');
});
test('permission rejection never causes an uncontrolled immediate retry loop', async()=>{
  let attempts=0;
  const clipboard=createAutomaticClipboard({canWrite:()=>true,write:async()=>{attempts++;const e=new Error('not allowed');e.name='NotAllowedError';throw e;},onStatus:()=>{}});
  clipboard.schedule('png');await settle();await settle();
  assert.equal(attempts,1);assert.equal(clipboard.pending,true);
});
test('cancelled write cannot report copied after completion', async()=>{
  let finish;const states=[];
  const clipboard=createAutomaticClipboard({canWrite:()=>true,write:()=>new Promise(resolve=>{finish=resolve;}),onStatus:s=>states.push(s)});
  clipboard.schedule('png');clipboard.cancel();finish();await settle();
  assert.deepEqual(states,['pending']);assert.equal(clipboard.pending,false);
});
