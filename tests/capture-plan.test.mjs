import test from 'node:test';
import assert from 'node:assert/strict';
import {timerSeconds, captureBounds, tilePositions, validateFullSize} from '../capture-plan.mjs';
test('Only approved timer delays accepted',()=>{
  for(const t of [0,3,5,10])assert.equal(timerSeconds(t),t);
  for(const t of [-1,2,11,3.5,'5',null,Infinity])assert.throws(()=>timerSeconds(t));
});
test('Element/area capture bounds are clipped to visible viewport',()=>{
  assert.deepEqual(captureBounds({x:-15,y:10,width:60,height:120},{width:100,height:100}),{x:0,y:10,width:45,height:90});
  assert.deepEqual(captureBounds({x:8,y:12,width:30,height:25},{width:100,height:100}),{x:8,y:12,width:30,height:25});
  assert.throws(()=>captureBounds({x:99,y:20,width:50,height:1},{width:100,height:100}));
});
test('Full page tiling covers first pixel and exact bottom with no gap',()=>{
  assert.deepEqual(tilePositions(300,400),[0]);
  assert.deepEqual(tilePositions(1000,400),[0,400,600]);
  assert.deepEqual(tilePositions(800,400),[0,400]);
  assert.throws(()=>tilePositions(0,400));
  assert.throws(()=>tilePositions(999999,100));
});
test('Full page pixel caps account for device pixel ratio',()=>{
  validateFullSize(1920,8000,1);
  assert.throws(()=>validateFullSize(1920,30000,2));
  assert.throws(()=>validateFullSize(10000,10000,1));
  assert.throws(()=>validateFullSize(200,100,0));
});
