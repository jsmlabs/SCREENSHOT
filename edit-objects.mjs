// Phase 04: source-coordinate annotation geometry and immutable object edits.
export const IMAGE_TOOLS = Object.freeze(['rect','arrow','pen','text','blur','pixelate']);
const finite = (...values) => values.every(Number.isFinite);
export function annotationBounds(a) {
  if (!a || typeof a !== 'object') return null;
  const pad = Math.max(3, Number(a.width) || 3) / 2 + 3;
  if (['rect','blur','pixelate'].includes(a.type)) {
    if (!finite(a.x,a.y,a.w,a.h) || a.w <= 0 || a.h <= 0) return null;
    return {x:a.x-pad,y:a.y-pad,w:a.w+pad*2,h:a.h+pad*2};
  }
  if (a.type === 'arrow') {
    if (!finite(a.x,a.y,a.x2,a.y2)) return null;
    return {x:Math.min(a.x,a.x2)-pad,y:Math.min(a.y,a.y2)-pad,w:Math.abs(a.x2-a.x)+pad*2,h:Math.abs(a.y2-a.y)+pad*2};
  }
  if (a.type === 'pen' && Array.isArray(a.points) && a.points.length && a.points.every(p=>finite(p.x,p.y))) {
    const xs=a.points.map(p=>p.x),ys=a.points.map(p=>p.y);
    return {x:Math.min(...xs)-pad,y:Math.min(...ys)-pad,w:Math.max(...xs)-Math.min(...xs)+pad*2,h:Math.max(...ys)-Math.min(...ys)+pad*2};
  }
  if (a.type === 'text' && finite(a.x,a.y)) {
    const size = Math.max(8,Math.min(144,Number(a.fontSize)||22));
    const lines=String(a.text||'').split('\n');
    return {x:a.x-pad,y:a.y-pad,w:Math.max(...lines.map(s=>s.length),1)*size*.7+pad*2,h:lines.length*size*1.3+pad*2};
  }
  return null;
}
function segmentDistance(p,a,b){const dx=b.x-a.x,dy=b.y-a.y,d=dx*dx+dy*dy;const t=d?Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.y-a.y)*dy)/d)):0;return Math.hypot(p.x-a.x-t*dx,p.y-a.y-t*dy);}
export function hitAnnotation(a,p,tolerance=7){
  const b=annotationBounds(a);if(!b||!finite(p.x,p.y))return false;
  if(p.x<b.x-tolerance||p.x>b.x+b.w+tolerance||p.y<b.y-tolerance||p.y>b.y+b.h+tolerance)return false;
  if(a.type==='arrow')return segmentDistance(p,{x:a.x,y:a.y},{x:a.x2,y:a.y2})<=Math.max(tolerance,(a.width||3)/2+3);
  if(a.type==='pen')return a.points.length===1 ? Math.hypot(p.x-a.points[0].x,p.y-a.points[0].y)<=tolerance : a.points.slice(1).some((v,i)=>segmentDistance(p,a.points[i],v)<=Math.max(tolerance,(a.width||3)/2+3));
  return true;
}
export function findAnnotation(annotations,point,tolerance=7){for(let i=annotations.length-1;i>=0;i--)if(hitAnnotation(annotations[i],point,tolerance))return i;return -1;}
export function translateAnnotation(a,dx,dy){
  if(!finite(dx,dy))return null;
  const next={...a};
  if(finite(a.x,a.y)){next.x+=dx;next.y+=dy;}
  if(a.type==='arrow'){next.x2+=dx;next.y2+=dy;}
  if(a.type==='pen')next.points=a.points.map(p=>({x:p.x+dx,y:p.y+dy}));
  return next;
}
export function updateAnnotation(state,index,replacement){
  if(!Number.isInteger(index)||index<0||index>=state.annotations.length||!replacement)return null;
  return {...state,annotations:state.annotations.map((a,i)=>i===index?replacement:a)};
}
export function removeAnnotation(state,index){if(!Number.isInteger(index)||index<0||index>=state.annotations.length)return null;return {...state,annotations:state.annotations.filter((_,i)=>i!==index)};}
export function moveAnnotation(state,index,dx,dy){if(!Number.isInteger(index)||index<0||index>=state.annotations.length)return null;return updateAnnotation(state,index,translateAnnotation(state.annotations[index],dx,dy));}
export function patchAnnotation(state,index,patch){
  if(!state.annotations[index])return null;
  const allowed={};
  if(typeof patch.color==='string' && /^#[0-9a-f]{6}$/i.test(patch.color))allowed.color=patch.color;
  if([2,4,8,12].includes(patch.width))allowed.width=patch.width;
  if(typeof patch.text==='string'&&patch.text.trim()&&patch.text.length<=200&&state.annotations[index].type==='text')allowed.text=patch.text;
  return Object.keys(allowed).length?updateAnnotation(state,index,{...state.annotations[index],...allowed}):null;
}
export function validAnnotation(a){
  if(!IMAGE_TOOLS.includes(a?.type))return false;
  const b=annotationBounds(a);
  if(!b||![b.x,b.y,b.w,b.h].every(Number.isFinite))return false;
  if(a.type==='text'&&(!String(a.text||'').trim()||String(a.text).length>200))return false;
  if(a.width!==undefined&&(!finite(a.width)||a.width<=0||a.width>100))return false;
  return true;
}
