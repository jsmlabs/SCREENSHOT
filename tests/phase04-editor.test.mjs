import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {initialEdit,addAnnotation,createHistory,current,commit,undo,redo,validateEdit} from '../edit-model.mjs';
import {annotationBounds,findAnnotation,hitAnnotation,translateAnnotation,moveAnnotation,removeAnnotation,patchAnnotation} from '../edit-objects.mjs';
import {paintAnnotation,renderEdit} from '../edit-render.mjs';
const read=name=>readFileSync(new URL('../'+name,import.meta.url),'utf8');
test('Selection chooses topmost overlapping object and rejects distant points',()=>{
  const items=[{type:'rect',x:2,y:3,w:50,h:40},{type:'text',x:10,y:10,text:'Top',fontSize:20}];
  assert.equal(findAnnotation(items,{x:15,y:15}),1);
  assert.equal(findAnnotation(items,{x:900,y:900}),-1);
  assert.ok(hitAnnotation(items[0],{x:40,y:30}));
  assert.ok(!hitAnnotation({type:'arrow',x:0,y:0,x2:100,y2:0},{x:70,y:40}));
});
test('Annotation move creates independent history snapshots and can undo, redo and delete',()=>{
  let h=createHistory(addAnnotation(initialEdit(300,200),{type:'pen',points:[{x:8,y:9},{x:40,y:90}],width:4}));
  const moved=moveAnnotation(current(h),0,20,-4);h=commit(h,moved);
  assert.deepEqual(current(h).annotations[0].points,[{x:28,y:5},{x:60,y:86}]);
  assert.deepEqual(current(undo(h)).annotations[0].points[0],{x:8,y:9});
  assert.deepEqual(current(redo(undo(h))).annotations[0].points[0],{x:28,y:5});
  h=commit(h,removeAnnotation(current(h),0));assert.equal(current(h).annotations.length,0);
  assert.equal(current(undo(h)).annotations.length,1);
});
test('Editing color, size and text is validated and non-mutating',()=>{
  const state=addAnnotation(initialEdit(80,80),{type:'text',x:1,y:2,text:'A'});
  const changed=patchAnnotation(state,0,{text:'B',color:'#ff7788',width:8});
  assert.deepEqual(changed.annotations[0],{type:'text',x:1,y:2,text:'B',color:'#ff7788',width:8,points:undefined});
  assert.equal(state.annotations[0].text,'A');
  assert.equal(patchAnnotation(state,0,{text:' '.repeat(210),color:'invalid',width:-1}),null);
  assert.equal(moveAnnotation(state,99,1,1),null);
  assert.equal(translateAnnotation(state.annotations[0],NaN,2),null);
});
test('Blur and pixelate are valid non-destructive annotations, malformed shapes rejected',()=>{
  let state=initialEdit(400,300);
  state=addAnnotation(state,{type:'blur',x:30,y:40,w:80,h:70,width:4});
  state=addAnnotation(state,{type:'pixelate',x:80,y:60,w:90,h:50,width:8});
  assert.equal(validateEdit(state,400,300),true);
  assert.equal(annotationBounds(state.annotations[1]).w>90,true);
  assert.equal(validateEdit(addAnnotation(state,{type:'blur',x:0,y:0,w:-1,h:30}),400,300),false);
  assert.equal(validateEdit(addAnnotation(state,{type:'pixelate',x:NaN,y:0,w:5,h:10}),400,300),false);
});
test('Effect renderer uses source image with separate blur and pixelate operations',()=>{
  const calls=[];
  const context={save(){calls.push('save');},restore(){calls.push('restore');},beginPath(){},rect(){},clip(){},drawImage(...args){calls.push(['drawImage',...args]);},canvas:{width:0,height:0},clearRect(){},scale(){},translate(){}};
  const fakeCanvas={width:0,height:0,getContext(){return {drawImage(...args){calls.push(['sample',...args]);},set imageSmoothingEnabled(value){}};}};
  const documentBefore=globalThis.document;
  globalThis.document={createElement(){return {...fakeCanvas};}};
  try {
    const img={naturalWidth:300,naturalHeight:200};
    const state=addAnnotation(addAnnotation(initialEdit(300,200),{type:'blur',x:8,y:6,w:30,h:22,width:4}),{type:'pixelate',x:50,y:60,w:50,h:40,width:8});
    assert.doesNotThrow(()=>renderEdit(context,img,state));
    assert.ok(calls.some(c=>Array.isArray(c)&&c[0]==='sample'));
    assert.ok(calls.filter(c=>Array.isArray(c)&&c[0]==='drawImage').length>=3);
  }finally{globalThis.document=documentBefore;}
});
test('Editor wiring exposes selection, effects and semantic actions, preserving existing tools',()=>{
  const html=read('editor.html'),js=read('editor.js');
  for(const name of ['pan','select','crop','rect','arrow','pen','text','blur','pixelate'])assert.match(html,new RegExp('data-tool="'+name+'"'));
  for(const id of ['edit-object','delete-object','copy','save','undo','redo'])assert.match(html,new RegExp('id="'+id+'"'));
  assert.match(js,/function deleteSelected\(/);
  assert.match(js,/function editSelectedText\(/);
  assert.match(js,/renderEdit\(ctx, image, activeEdit\(\)\)/);
});
