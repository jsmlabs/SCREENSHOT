import test from 'node:test';
import assert from 'node:assert/strict';
import {renderEdit,paintAnnotation} from '../edit-render.mjs';
import {initialEdit,applyCrop,addAnnotation} from '../edit-model.mjs';
function ctxStub(){
  const calls=[];
  const ctx={canvas:{width:0,height:0}};
  for(const name of ['save','restore','clearRect','drawImage','scale','translate','strokeRect','beginPath','moveTo','lineTo','stroke','fillText'])
    ctx[name]=(...args)=>calls.push([name,...args]);
  ctx.calls=calls;
  return ctx;
}
test('Renderer exports source pixel dimensions and crop origin',()=>{
  const img={naturalWidth:800,naturalHeight:600};
  let state=initialEdit(800,600);
  state=applyCrop(state,{x:50,y:80},{x:300,y:200});
  const ctx=ctxStub();renderEdit(ctx,img,state);
  assert.equal(ctx.canvas.width,250);assert.equal(ctx.canvas.height,120);
  assert.deepEqual(ctx.calls.find(c=>c[0]==='drawImage'),['drawImage',img,50,80,250,120,0,0,250,120]);
});
test('Renderer clips using crop offset when painting earlier annotations',()=>{
  const img={naturalWidth:400,naturalHeight:300};
  let state=addAnnotation(initialEdit(400,300),{type:'rect',x:100,y:100,w:40,h:40,color:'#000'});
  state=applyCrop(state,{x:80,y:70},{x:260,y:200});
  const ctx=ctxStub();renderEdit(ctx,img,state);
  assert.deepEqual(ctx.calls.find(c=>c[0]==='translate'),['translate',-80,-70]);
  assert.deepEqual(ctx.calls.find(c=>c[0]==='strokeRect'),['strokeRect',100,100,40,40]);
});
test('Arrow, pen and text operations paint without changing crop dimensions',()=>{
  const ctx=ctxStub();
  paintAnnotation(ctx,{type:'arrow',x:0,y:0,x2:50,y2:30});
  paintAnnotation(ctx,{type:'pen',points:[{x:1,y:2},{x:3,y:4}]});
  paintAnnotation(ctx,{type:'text',x:2,y:10,text:'Hello\nWorld'});
  assert.equal(ctx.calls.filter(c=>c[0]==='fillText').length,2);
  assert.ok(ctx.calls.filter(c=>c[0]==='lineTo').length>=4);
});
test('Malformed crop rejected before drawing',()=>{
  const ctx=ctxStub();
  assert.throws(()=>renderEdit(ctx,{naturalWidth:100,naturalHeight:100},{crop:{x:0,y:0,w:101,h:10},annotations:[]}),/Invalid edit state/);
});
