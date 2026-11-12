import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const source = readFileSync(new URL('../background.js', import.meta.url),'utf8');
const openPreviewSource = source.slice(source.indexOf('let previewQueue ='),source.indexOf('\nasync function run('));

function harness(initial=[]) {
  const windows=structuredClone(initial), events=[];
  let next=100;
  const chrome={
    runtime:{getURL:path=>'chrome-extension://test/'+path},
    windows:{
      getAll:async()=>structuredClone(windows),
      create:async options=>{events.push(['create',options.url]);const item={id:++next,tabs:[{id:++next,url:options.url}]};windows.push(item);return structuredClone(item);},
      update:async(id,options)=>{events.push(['focus',id]);assert.equal(options.focused,true);return {};}
    },
    tabs:{
      update:async(id,options)=>{events.push(['reuse',id,options.url]);const tab=windows.flatMap(w=>w.tabs).find(t=>t.id===id);assert.ok(tab);tab.url=options.url;return tab;},
      remove:async id=>{events.push(['remove',id]);for(const w of windows)w.tabs=w.tabs.filter(t=>t.id!==id);}
    }
  };
  const context=vm.createContext({chrome,console,Promise,Number});
  vm.runInContext(openPreviewSource,context);
  return {openPreview:query=>vm.runInContext(`openPreview(${JSON.stringify(query)})`,context),windows,events};
}

test('concurrent preview requests create only one editor window',async()=>{
  const app=harness();
  await Promise.all([app.openPreview('?id=one'),app.openPreview('?id=two'),app.openPreview('?id=three')]);
  assert.equal(app.windows.length,1);
  assert.equal(app.events.filter(e=>e[0]==='create').length,1);
  assert.match(app.windows[0].tabs[0].url,/id=three$/);
});

test('existing editor is reused and focused; redundant editor tabs are removed without closing browser windows',async()=>{
  const app=harness([
    {id:9,tabs:[{id:10,url:'https://example.com'},{id:11,url:'chrome-extension://test/editor.html?id=old'}]},
    {id:12,tabs:[{id:13,url:'chrome-extension://test/editor.html?window=1'}]}
  ]);
  await app.openPreview('?id=latest');
  assert.equal(app.events.filter(e=>e[0]==='create').length,0);
  assert.deepEqual(app.events.filter(e=>e[0]==='remove').map(e=>e[1]),[13]);
  assert.equal(app.windows[0].tabs[0].url,'https://example.com');
  assert.equal(app.windows[0].tabs[1].url,'chrome-extension://test/editor.html?id=latest');
  assert.equal(app.windows[1].tabs.length,0);
  assert.ok(app.events.some(e=>e[0]==='focus'&&e[1]===9));
});

test('a closed editor tab is skipped and a second existing editor is reused',async()=>{
  // Emulate a tab disappearing after getAll() but before tabs.update().
  // The second editor may be the only usable one; use a fresh isolated context
  // with a deterministic stale-first update mock.
  const js=openPreviewSource;
  const events=[];
  const chrome={runtime:{getURL:p=>'chrome-extension://test/'+p},
    windows:{getAll:async()=>[{id:9,tabs:[{id:11,url:'chrome-extension://test/editor.html'}]},
      {id:12,tabs:[{id:13,url:'chrome-extension://test/editor.html'}]}],
      create:async()=>{throw Error('Must not open a new window');},
      update:async id=>{events.push(['focus',id]);}},
    tabs:{update:async id=>{events.push(['update',id]);if(id===11)throw Error('No tab with id');},
      remove:async id=>{events.push(['remove',id]);}}};
  const context=vm.createContext({chrome,console,Promise,Number});vm.runInContext(js,context);
  await vm.runInContext('openPreview("?id=recovered")',context);
  assert.deepEqual(events.filter(e=>e[0]==='update').map(e=>e[1]),[11,13]);
  assert.ok(events.some(e=>e[0]==='focus'&&e[1]===12));
});

test('duplicate editor cleanup failure does not invalidate successful reuse',async()=>{
  const events=[];
  const chrome={runtime:{getURL:p=>'chrome-extension://test/'+p},
    windows:{getAll:async()=>[{id:1,tabs:[{id:2,url:'chrome-extension://test/editor.html'},{id:3,url:'chrome-extension://test/editor.html'}]}],
      create:async()=>{throw Error('Must reuse editor');},update:async()=>{}},
    tabs:{update:async id=>{events.push(['update',id]);},remove:async id=>{events.push(['remove',id]);throw Error('Tab closed');}}};
  const context=vm.createContext({chrome,console,Promise,Number});vm.runInContext(openPreviewSource,context);
  await vm.runInContext('openPreview("?id=new")',context);
  assert.deepEqual(events,[['update',2],['remove',3]]);
});
