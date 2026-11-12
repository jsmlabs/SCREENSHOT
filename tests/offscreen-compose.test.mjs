import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const offscreenURL=pathToFileURL(resolve(root,'src/offscreen/offscreen.js')).href;

test('Offscreen stitches without overpainting seam; closes every bitmap',async()=>{
  let handler;
  const closed=[],calls=[];
  let openBitmaps=0,peakBitmaps=0;
  const original={chrome:globalThis.chrome,fetch:globalThis.fetch,createImageBitmap:globalThis.createImageBitmap,document:globalThis.document,navigator:globalThis.navigator,ClipboardItem:globalThis.ClipboardItem};
  const copied=[];
  Object.defineProperty(globalThis, 'navigator', {value:{clipboard:{write:async items=>{copied.push(items);}}}, configurable:true});
  globalThis.ClipboardItem=class {constructor(contents){this.contents=contents;}};
  globalThis.chrome={runtime:{id:'test',getURL:p=>'chrome-extension://test/'+p,onMessage:{addListener:fn=>handler=fn}}};
  globalThis.fetch=async data=>({blob:async()=>({data})});
  globalThis.createImageBitmap=async blob=>{openBitmaps++;peakBitmaps=Math.max(peakBitmaps,openBitmaps);return {width:600,height:480,close(){openBitmaps--;closed.push(blob.data)}}};
  globalThis.document={createElement:()=>({width:0,height:0,getContext(){return {imageSmoothingEnabled:true,drawImage(...args){calls.push(args)}}},toDataURL:()=>('data:image/png;base64,AA==')})};
  try {
    await import(offscreenURL+'?integration=1');
    const response=await new Promise(resolve=>handler({type:'COMPOSE',mode:'full',shots:[0,400,600].map(y=>({x:0,y,data:'data:image/png;base64,AA=='})),width:500,height:1000,viewport:{width:500,height:400}}, {id:'test',url:'chrome-extension://test/src/background/background.js'},resolve));
    assert.equal(response.ok,true,response.error);
    assert.equal(response.clipboard,undefined);
    assert.equal(copied.length,0, 'offscreen documents must not attempt clipboard writes');
    assert.equal(calls.length,3);
    assert.deepEqual(calls.map(a=>[a[2],a[3],a[6],a[7],a[8]]),[[0,600,0,600,480],[0,600,480,600,240],[0,600,720,600,480]]);
    assert.equal(closed.length,3);
    assert.equal(openBitmaps,0);
    assert.equal(peakBitmaps,1,'tiles must be decoded sequentially rather than concurrently');
  } finally {for (const [key,value] of Object.entries(original)) if(value===undefined)delete globalThis[key];else Object.defineProperty(globalThis,key,{value,configurable:true,writable:true});}
});
