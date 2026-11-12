import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {dirname,resolve} from 'node:path';
const code=readFileSync(resolve(dirname(fileURLToPath(import.meta.url)),'../src/capture/capture-recovery.js'),'utf8');
function harness(connected=true) {
  const events=[],attrs=[{removeAttribute(k){events.push('remove-attribute:'+k)}}];
  const rule={isConnected:connected,dataset:{started:'1000',restore:JSON.stringify({x:20,y:50,rootBehavior:'smooth',bodyBehavior:'auto'})},remove(){events.push('remove-rule');this.isConnected=false}};
  const document={getElementById(){return rule},querySelectorAll(){return attrs},documentElement:{style:{scrollBehavior:'auto'}},body:{style:{scrollBehavior:'auto'}}};
  let scheduled;
  const context={document,Date:{now:()=>1000},Number,JSON,Math,console,setTimeout:(fn,ms)=>{scheduled={fn,ms};}};
  context.window={scrollTo(args){events.push(args)}};
  vm.runInNewContext(code,context);
  return {events,rule,document,get scheduled(){return scheduled}};
}
test('Page watchdog restores page state after worker disappears',()=>{
  const h=harness();assert.equal(h.scheduled.ms,125000);
  h.scheduled.fn();
  assert.equal(h.events[0],'remove-rule');
  assert.equal(h.events[1],'remove-attribute:data-screenshot-v15-floating');
  assert.equal(h.events[2].left,20);assert.equal(h.events[2].top,50);
  assert.equal(h.document.documentElement.style.scrollBehavior,'smooth');
  assert.equal(h.document.body.style.scrollBehavior,'auto');
});
test('Page watchdog never mutates a normally cleaned capture',()=>{
  const h=harness();h.rule.isConnected=false;h.scheduled.fn();assert.equal(h.events.length,0);
});
