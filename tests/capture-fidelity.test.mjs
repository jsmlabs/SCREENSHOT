import test from 'node:test';
import assert from 'node:assert/strict';
import {captureScale,fullTilePlan,cropPixelPlan} from '../capture-fidelity.mjs';

test('Scale reads actual captured PNG geometry rather than assumed DPR',()=>{
  assert.deepEqual(captureScale(1500,900,{width:1000,height:600}),{sx:1.5,sy:1.5});
  assert.throws(()=>captureScale(1500,900,{width:1000,height:700}),/Skalierung/);
  assert.throws(()=>captureScale(0,900,{width:1000,height:600}));
});
test('Overlapping bottom tiles are drawn as unique pixel strips without seam overwrite',()=>{
  const shots=[{x:0,y:0},{x:0,y:400},{x:0,y:600}];
  const sizes=shots.map(()=>({width:600,height:480}));
  const {outputPixels,items}=fullTilePlan(shots,500,1000,{width:500,height:400},sizes);
  assert.deepEqual(outputPixels,{width:600,height:1200});
  assert.deepEqual(items.map(p=>[p.destinationTop,p.destinationBottom,p.sourceHeight]),[[0,480,480],[480,720,240],[720,1200,480]]);
});
test('Fractional pixel mapping still provides gap-free output at 125% scaling',()=>{
  const shots=[{x:0,y:0},{x:0,y:333},{x:0,y:666},{x:0,y:667}];
  const {outputPixels,items}=fullTilePlan(shots,400,1000,{width:400,height:333},shots.map(()=>({width:500,height:416})));
  assert.equal(outputPixels.height,1249);
  assert.equal(items[0].destinationTop,0);
  assert.equal(items.at(-1).destinationBottom,1249);
  for(let i=1;i<items.length;i++)assert.equal(items[i].destinationTop,items[i-1].destinationBottom);
});
test('Full page rejects missing/overlapping malformed tiles and inconsistent capture scale',()=>{
  const vp={width:500,height:400};
  const sizes=[{width:500,height:400},{width:500,height:400}];
  assert.throws(()=>fullTilePlan([{x:0,y:0},{x:0,y:500}],500,900,vp,sizes));
  assert.throws(()=>fullTilePlan([{x:0,y:1},{x:0,y:400}],500,800,vp,sizes));
  assert.throws(()=>fullTilePlan([{x:0,y:0},{x:0,y:400}],500,800,vp,[sizes[0],{width:700,height:400}]));
});
test('Crop uses independently rounded pixel edges, correct for fractional CSS coordinates',()=>{
  const crop=cropPixelPlan({x:10.2,y:20.6,width:30.7,height:40.2},{width:1250,height:750},{width:1000,height:600});
  assert.deepEqual(crop,{x:13,y:26,width:38,height:50});
  assert.throws(()=>cropPixelPlan({x:990,y:0,width:100,height:20},{width:1250,height:750},{width:1000,height:600}));
});
