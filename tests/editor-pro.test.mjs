import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {initialEdit,addAnnotation,createHistory,commit,current,undo,redo} from '../src/editor/edit-model.mjs';
import {annotationBounds,resizeAnnotation,resizeObject,patchAnnotation,moveAnnotation} from '../src/editor/edit-objects.mjs';
import {translate} from '../src/shared/i18n.mjs';
const source=name=>readFileSync(new URL('../'+name,import.meta.url),'utf8');
test('resizing rectangle does not mutate source, supports history undo/redo',()=>{
 const original=addAnnotation(initialEdit(500,500),{type:'rect',x:20,y:30,w:100,h:80,width:4});
 const bound=annotationBounds(original.annotations[0]);
 const next=resizeObject(original,0,bound,{x:bound.x+bound.w*2,y:bound.y+bound.h*1.5});
 assert.equal(next.annotations[0].w,200);assert.equal(next.annotations[0].h,120);
 assert.equal(original.annotations[0].w,100);
 let h=createHistory(original);h=commit(h,next);
 assert.equal(current(undo(h)).annotations[0].w,100);
 assert.equal(current(redo(undo(h))).annotations[0].w,200);
});
test('resizing pen and arrow preserves geometry with independent points',()=>{
 const pen={type:'pen',points:[{x:2,y:3},{x:12,y:13}],width:4};
 const b=annotationBounds(pen),next=resizeAnnotation(pen,b,{x:b.x+b.w*2,y:b.y+b.h*2});
 assert.notDeepEqual(next.points,pen.points);assert.deepEqual(pen.points,[{x:2,y:3},{x:12,y:13}]);
 const arrow={type:'arrow',x:1,y:1,x2:20,y2:30,width:4};
 assert.ok(resizeAnnotation(arrow,annotationBounds(arrow),{x:90,y:90}));
});
test('text size is validated, bounded, and undoable',()=>{
 const state=addAnnotation(initialEdit(500,500),{type:'text',x:10,y:12,text:'Hello',fontSize:24});
 const updated=patchAnnotation(state,0,{fontSize:48});
 assert.equal(updated.annotations[0].fontSize,48);assert.equal(state.annotations[0].fontSize,24);
 assert.equal(patchAnnotation(state,0,{fontSize:0}),null);
 assert.equal(patchAnnotation(state,0,{fontSize:145}),null);
 assert.equal(patchAnnotation(state,0,{fontSize:12.5}),null);
 const enlarged=resizeAnnotation(state.annotations[0],annotationBounds(state.annotations[0]),{x:140,y:70});
 assert.ok(enlarged.fontSize>=8&&enlarged.fontSize<=144);
});
test('resizing rejects malformed geometry and invalid indices',()=>{
 const s=initialEdit(100,100);
 assert.equal(resizeObject(s,0,{x:0,y:0,w:10,h:10},{x:20,y:20}),null);
 assert.equal(resizeAnnotation({type:'rect',x:1,y:1,w:10,h:10},{x:0,y:0,w:0,h:5},{x:10,y:10}),null);
 assert.equal(resizeAnnotation({type:'rect',x:1,y:1,w:10,h:10},{x:0,y:0,w:10,h:10},{x:Infinity,y:20}),null);
});
test('keyboard nudge uses immutable model and supports fine/coarse increments',()=>{
 const state=addAnnotation(initialEdit(100,100),{type:'rect',x:10,y:10,w:20,h:10});
 const fine=moveAnnotation(state,0,1,0),coarse=moveAnnotation(fine,0,0,-10);
 assert.deepEqual([state.annotations[0].x,fine.annotations[0].x,coarse.annotations[0].y],[10,11,0]);
});
test('editor Pro UI wiring and five translations available',()=>{
 const html=source('src/editor/editor.html'),js=source('src/editor/editor.js');
 assert.match(html,/id="edit-font-size"/);assert.match(js,/dragging\.mode==='resize'/);
 assert.match(js,/event\.shiftKey\?10:1/);assert.match(js,/fontSizePicker\.addEventListener/);
 for(const lang of ['de','en','fr','it','es'])for(const phrase of ['Textgrösse','Auswahlgriff ziehen: Skalieren'])assert.ok(typeof translate(lang,phrase)==='string' && translate(lang,phrase).length>0);
 for(const lang of ['en','fr','it','es'])assert.notEqual(translate(lang,'Textgrösse'),'Textgrösse');
});
