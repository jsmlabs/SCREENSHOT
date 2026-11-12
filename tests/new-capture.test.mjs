import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {findCaptureTab,isCaptureMode} from '../new-capture.mjs';
const read=name=>readFileSync(new URL('../'+name,import.meta.url),'utf8');
test('new capture supports all five modes and rejects unknown commands',()=>{
 for(const mode of ['area','element','visible','window','full'])assert.equal(isCaptureMode(mode),true);
 for(const mode of ['',null,'history','javascript'])assert.equal(isCaptureMode(mode),false);
});
test('new capture prefers the original website over active unrelated tabs',()=>{
 const tabs=[{id:1,windowId:10,active:true,url:'https://example.org'},{id:2,windowId:20,active:false,url:'https://origin.example'}];
 assert.equal(findCaptureTab(tabs,2).id,2);
 assert.equal(findCaptureTab(tabs,99).id,1);
});
test('new capture never targets browser internal or extension UI and handles no tabs',()=>{
 const tabs=[{id:4,windowId:1,active:true,url:'chrome-extension://x/editor.html'},{id:5,windowId:2,active:true,url:'https://ok.example'}, {id:6,windowId:3,active:false,url:'chrome://settings'}];
 assert.equal(findCaptureTab(tabs,4).id,5);
 assert.equal(findCaptureTab(tabs.filter(x=>x.id!==5)),null);
 assert.equal(findCaptureTab(null),null);
});
test('editor provides accessible mode chooser and preserves existing editing flow',()=>{
 const html=read('editor.html'),editor=read('editor.js'),worker=read('background.js');
 assert.match(html,/id="new-capture"/);
 assert.match(html,/<dialog id="new-capture-dialog"/);
 for(const mode of ['area','element','visible','window','full'])assert.match(html,new RegExp('data-new-mode="'+mode+'"'));
 assert.match(editor,/captureSourceTabId/);
 assert.match(editor,/chrome\.runtime\.sendMessage\(\{type:'START'/);
 assert.match(worker,/sourceTabId: tabId/);
});
