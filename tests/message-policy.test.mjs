import test from 'node:test';
import assert from 'node:assert/strict';
import {isTrustedUiSender,isWorkerSender,isSelectionSender,validateComposeMessage} from '../message-policy.mjs';
const runtime={id:'extension-id',getURL:path=>'chrome-extension://extension-id/'+path};
const popup={id:'extension-id',url:runtime.getURL('popup.html')};
const worker={id:'extension-id',url:runtime.getURL('background.js')};
const job={tabId:8};
const png='data:image/png;base64,AA==';
const base={type:'COMPOSE',mode:'visible',width:20,height:10,viewport:{width:20,height:10},shots:[{x:0,y:0,data:png}]};
test('Only extension popup is authorized for privileged worker commands',()=>{
  assert.equal(isTrustedUiSender(popup,runtime),true);
  for(const sender of [{},{...popup,id:'foreign'},{...popup,url:'https://evil.invalid/'},worker,{...popup,url:runtime.getURL('editor.html')}])
    assert.equal(isTrustedUiSender(sender,runtime),false);
});
test('Offscreen processing accepts only worker messages',()=>{
  assert.equal(isWorkerSender(worker,runtime),true);
  for(const sender of [popup,{}, {...worker,id:'other'}, {...worker,url:'https://invalid/' }])
    assert.equal(isWorkerSender(sender,runtime),false);
});
test('Selection messages must originate from selected top-level web tab',()=>{
  assert.equal(isSelectionSender({tab:{id:8},url:'https://example.org',frameId:0},job),true);
  for(const sender of [{tab:{id:9},url:'https://example.org',frameId:0},{tab:{id:8},url:'https://example.org',frameId:3},{tab:{id:8},url:'chrome-extension://test/',frameId:0},{}])
    assert.equal(isSelectionSender(sender,job),false);
});
test('Valid PNG tiles and every supported mode validate',()=>{
  validateComposeMessage(base);
  for(const mode of ['area','element'])validateComposeMessage({...base,mode,selection:{x:0,y:0,width:10,height:5}});
  validateComposeMessage({...base,mode:'full'});
});
test('Reject invalid mode, image data and dimensions',()=>{
  for(const specimen of [
    {...base,mode:'unsafe'},
    {...base,width:NaN},
    {...base,shots:[]},
    {...base,shots:[...base.shots,...base.shots]},
    {...base,shots:[{x:0,y:0,data:'data:image/svg+xml,<svg/>'}]},
    {...base,shots:[{x:0,y:0,data:'data:image/png;base64,###'}]},
    {...base,shots:[{x:Infinity,y:0,data:png}]},
    {...base,mode:'area'},
    {...base,mode:'full',height:25},
  ])assert.throws(()=>validateComposeMessage(specimen));
});
