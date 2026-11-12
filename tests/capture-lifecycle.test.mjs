import test from 'node:test';
import assert from 'node:assert/strict';
import {createCaptureLifecycle,throwIfCancelled,cancellableDelay,withTimeout} from '../src/capture/capture-lifecycle.mjs';

test('lifecycle enforces one active job and explicit state transitions', () => {
  const life = createCaptureLifecycle(() => 42);
  const job = life.begin('selecting', 7, 'area');
  assert.equal(job.startedAt,42);
  assert.equal(life.state,'selecting');
  assert.throws(()=>life.begin('capturing',7,'visible'),/läuft bereits/);
  assert.throws(()=>life.transition('composing','publishing'),/Zustandswechsel/);
  life.transition('selecting','capturing');
  life.transition('capturing','composing');
  life.transition('composing','publishing');
  life.finish(job);
  assert.equal(life.state,'idle');
  const next = life.begin('capturing',8,'full');
  life.finish(job); // Late callback must not clear a subsequent job.
  assert.equal(life.active,next);
  life.finish(next);
});
test('cancellation rejects timers, clears lock, allows new capture', async () => {
  const life=createCaptureLifecycle();
  const job=life.begin('capturing',1,'full');
  const pending=cancellableDelay(10_000,job.controller.signal);
  life.abort();
  await assert.rejects(pending,/abgebrochen/);
  assert.throws(()=>throwIfCancelled(job.controller.signal),/abgebrochen/);
  const next=life.begin('capturing',2,'visible');
  assert.equal(life.active,next);
  life.finish(next);
});
test('bounded operation times out and leaves no continuing lock', async()=>{
  const life=createCaptureLifecycle();
  const job=life.begin('capturing',1,'full');
  await assert.rejects(withTimeout(()=>new Promise(()=>{}),10,job.controller.signal,'Test'),/Zeitlimit/);
  life.finish(job);
  assert.equal(life.state,'idle');
});
test('abort interrupts in-flight API request without waiting for response',async()=>{
  const life=createCaptureLifecycle();
  const job=life.begin('capturing',1,'full');
  const pending=withTimeout(()=>new Promise(()=>{}),10_000,job.controller.signal);
  job.controller.abort(new Error('Abbruch'));
  await assert.rejects(pending,/Abbruch/);
});
test('rejects invalid states, ids, timeouts',async()=>{
  const life=createCaptureLifecycle();
  assert.throws(()=>life.begin('idle',1,'visible'),/Ungültig/);
  assert.throws(()=>life.begin('capturing',null,'visible'),/Ungültig/);
  await assert.rejects(withTimeout(()=>1,-1),/Zeitlimit/);
  assert.equal(life.abort(),false);
});
