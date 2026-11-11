import test from 'node:test';
import assert from 'node:assert/strict';
import {TOOLS,strokeWidth,toolForKey,shouldHandleShortcut,normalisedWheelDelta,sameCrop} from '../editor-interactions.mjs';
test('Toolbar shortcuts map only allowed tools',()=>{
  for(const [key,tool] of [['v','pan'],['s','select'],['b','blur'],['i','pixelate'],['C','crop'],['r','rect'],['a','arrow'],['p','pen'],['t','text']]) assert.equal(toolForKey(key),tool);
  assert.equal(toolForKey('x'),null);assert.equal(TOOLS.length,9);
});
test('Editor shortcuts do not hijack typing, controls or modifiers',()=>{
  assert.equal(shouldHandleShortcut({closest:()=>true},{ctrlKey:false,altKey:false,metaKey:false}),false);
  assert.equal(shouldHandleShortcut({closest:()=>false},{ctrlKey:true,altKey:false,metaKey:false}),false);
  assert.equal(shouldHandleShortcut({closest:()=>false},{ctrlKey:false,altKey:false,metaKey:false}),true);
});
test('Brush sizes are fixed in source pixels and invalid values default safely',()=>{
  for(const value of [2,4,8,12])assert.equal(strokeWidth(String(value)),value);
  assert.equal(strokeWidth('500'),4);assert.equal(strokeWidth('bad'),4);
});
test('Wheel deltas normalise pixel, line and page units and clamp extremes',()=>{
  assert.equal(normalisedWheelDelta(2,0,300),2);
  assert.equal(normalisedWheelDelta(2,1,300),32);
  assert.equal(normalisedWheelDelta(2,2,300),500);
  assert.equal(normalisedWheelDelta(-9999,0,300),-500);
  assert.equal(normalisedWheelDelta(NaN,0,300),0);
});
test('Annotation-only history is distinguished from crop history',()=>{
  const a={x:0,y:0,w:640,h:480};assert.ok(sameCrop(a,{...a}));
  assert.equal(sameCrop(a,{...a,w:320}),false);
  assert.equal(sameCrop(null,a),false);
});
