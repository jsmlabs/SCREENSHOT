import test from 'node:test';
import assert from 'node:assert/strict';
import {initialEdit,cloneEdit,createHistory,current,commit,undo,redo,canUndo,canRedo,applyCrop,addAnnotation,rectBetween,localToSource,validateEdit} from '../src/editor/edit-model.mjs';

test('Default crop covers original image exactly',()=>{
  const edit=initialEdit(1920,1080);
  assert.deepEqual(edit.crop,{x:0,y:0,w:1920,h:1080});
  assert.ok(validateEdit(edit,1920,1080));
  assert.throws(()=>initialEdit(0,100));
});
test('Cropping uses local coordinates and preserves prior source offset',()=>{
  let edit=initialEdit(1000,600);
  edit=applyCrop(edit,{x:100,y:50},{x:700,y:500});
  assert.deepEqual(edit.crop,{x:100,y:50,w:600,h:450});
  edit=applyCrop(edit,{x:20,y:40},{x:300,y:240});
  assert.deepEqual(edit.crop,{x:120,y:90,w:280,h:200});
  assert.deepEqual(localToSource(edit,{x:10,y:15}),{x:130,y:105});
  assert.ok(validateEdit(edit,1000,600));
});
test('Crops clamp to frame and reject tiny or zero sized regions',()=>{
  const e=initialEdit(200,100);
  assert.equal(applyCrop(e,{x:20,y:20},{x:21,y:21}),null);
  assert.deepEqual(applyCrop(e,{x:-30,y:-40},{x:400,y:300}).crop,e.crop);
});
test('Undo/redo covers annotations and crop, preserving original',()=>{
  const base=initialEdit(500,400);
  let h=createHistory(base);
  h=commit(h,addAnnotation(current(h),{type:'rect',x:20,y:10,w:100,h:80,color:'#f04452'}));
  h=commit(h,applyCrop(current(h),{x:50,y:30},{x:300,y:200}));
  assert.equal(current(h).annotations.length,1);
  assert.deepEqual(current(h).crop,{x:50,y:30,w:250,h:170});
  h=undo(h);assert.deepEqual(current(h).crop,base.crop);
  h=undo(h);assert.equal(current(h).annotations.length,0);assert.equal(canUndo(h),false);
  h=redo(h);assert.equal(current(h).annotations.length,1);
  assert.equal(canRedo(h),true);
});
test('New edit after undo invalidates redo history',()=>{
  let h=createHistory(initialEdit(100,100));
  h=commit(h,addAnnotation(current(h),{type:'text',x:2,y:3,text:'A'}));
  h=commit(h,addAnnotation(current(h),{type:'text',x:4,y:5,text:'B'}));
  h=undo(h);
  h=commit(h,addAnnotation(current(h),{type:'arrow',x:1,y:1,x2:3,y2:3}));
  assert.equal(canRedo(h),false);
  assert.equal(current(h).annotations[1].type,'arrow');
});
test('History snapshots have no shared nested annotation mutation',()=>{
  const base=initialEdit(100,100);
  let h=createHistory(base);
  h=commit(h,addAnnotation(current(h),{type:'pen',points:[{x:1,y:2},{x:3,y:4}]}));
  const copy=cloneEdit(current(h));
  copy.annotations[0].points[0].x=99;
  assert.equal(current(h).annotations[0].points[0].x,1);
});
test('Rectangle is order invariant',()=>{
  assert.deepEqual(rectBetween({x:90,y:40},{x:10,y:70}),{x:10,y:40,w:80,h:30});
});
test('Bounded history retains recent states without losing undo safety',()=>{
  let h=createHistory(initialEdit(20,20));
  for(let i=0;i<75;i++)h=commit(h,addAnnotation(current(h),{type:'text',text:String(i),x:0,y:0}));
  assert.equal(h.states.length,60);
  for(let i=0;i<100;i++)h=undo(h);
  assert.equal(h.index,0);
});
