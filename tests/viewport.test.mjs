import test from 'node:test';
import assert from 'node:assert/strict';
import {fitScale,constrainPan,anchoredPan,axisLimit,imagePosition,PREVIEW_GAP,clamp,MIN_ZOOM,MAX_ZOOM} from '../viewport.mjs';

test('Fit never upscales and ignores invalid geometry', () => {
  assert.equal(fitScale(2000,1000,500,500),.25);
  assert.equal(fitScale(200,100,500,500),1);
  assert.equal(fitScale(0,100,500,500),1);
});
test('Preview gap is fixed and separate from zoom geometry', () => assert.equal(PREVIEW_GAP,6));
test('Small image stops at each edge of inset viewport', () => {
  const p = constrainPan(999,-999,100,100,500,400,1);
  assert.deepEqual(p,{x:200,y:-150});
  assert.equal(imagePosition(100,100,500,400,1,p.x,p.y).left,400);
  assert.equal(imagePosition(100,100,500,400,1,-200,150).top,300);
});
test('Large image entirely covers the clipping viewport at limits', () => {
  assert.deepEqual(constrainPan(999,-999,1000,800,500,400,1),{x:250,y:-200});
  const p=imagePosition(1000,800,500,400,1,999,-999);
  assert.equal(p.left,0);
  assert.equal(p.top,-400);
});
test('Mixed axes and zoom threshold clamp independently', () => {
  assert.deepEqual(constrainPan(500,-500,600,100,400,300,1),{x:100,y:-100});
  assert.equal(axisLimit(100,500,.5),225);
  assert.equal(axisLimit(100,500,5),0);
  assert.equal(axisLimit(100,500,6),50);
});
test('Pan never produces NaN with invalid geometry or inputs', () => {
  const p = constrainPan(NaN,Infinity,0,100,500,400,1);
  assert.equal(Math.abs(p.x),0); assert.equal(p.y,-150);
  assert.equal(axisLimit(1,0,1),0);
});
test('Anchor position preserved before clamping',()=>{
  assert.deepEqual(anchoredPan(10,20,1,2,100,50),{x:-80,y:-10});
  assert.deepEqual(anchoredPan(10,20,0,2,100,50),{x:0,y:0});
});
test('Zoom bounded to 10%-800%',()=>{
  assert.equal(clamp(.01,MIN_ZOOM,MAX_ZOOM),.1);
  assert.equal(clamp(99,MIN_ZOOM,MAX_ZOOM),8);
});
test('Every rendered edge stays within viewport or fully covers it',()=>{
  for (const [iw,ih,vw,vh] of [[120,200,1200,750],[2000,3000,450,300],[450,2000,700,400]]) {
    for(const scale of [.1,.5,1,2,3.32,8]){
      for(const [x,y] of [[-1e6,1e6],[0,0],[1e6,-1e6]]){
        const p=imagePosition(iw,ih,vw,vh,scale,x,y);
        for(const [start,extent,viewport] of [[p.left,iw*scale,vw],[p.top,ih*scale,vh]]){
          if(extent<=viewport)assert.ok(start>=-1e-7&&start+extent<=viewport+1e-7);
          else assert.ok(start<=1e-7&&start+extent>=viewport-1e-7);
        }
      }
    }
  }
});
