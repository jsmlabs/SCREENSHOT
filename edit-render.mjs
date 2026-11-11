import {validateEdit} from './edit-model.mjs';
export function paintAnnotation(ctx, a, image = null) {
  const stroke = a.color || '#F04452';
  ctx.save(); ctx.strokeStyle = stroke; ctx.fillStyle = stroke;
  ctx.lineWidth = a.width || 3; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  if (a.type === 'rect') {
    ctx.strokeRect(a.x, a.y, a.w, a.h);
  } else if (a.type === 'blur' || a.type === 'pixelate') {
    if (!image || !globalThis.document?.createElement) { ctx.restore(); return; }
    const x=Math.max(0,Math.floor(a.x)),y=Math.max(0,Math.floor(a.y));
    const maxW=image.naturalWidth-x,maxH=image.naturalHeight-y;
    const w=Math.min(maxW,Math.ceil(a.w+a.x-x)),h=Math.min(maxH,Math.ceil(a.h+a.y-y));
    if(w>0&&h>0) {
      ctx.beginPath();ctx.rect(a.x,a.y,a.w,a.h);ctx.clip();
      if(a.type==='blur') {
        // Draw the original through the blur filter, clipped to the redaction.
        ctx.filter=`blur(${Math.max(4,Math.min(36,(a.width||4)*2))}px)`;
        ctx.drawImage(image,0,0);
      } else {
        const cell=Math.max(6,Math.min(48,(a.width||4)*3));
        const tw=Math.max(1,Math.ceil(w/cell)),th=Math.max(1,Math.ceil(h/cell));
        const temp=document.createElement('canvas');temp.width=tw;temp.height=th;
        const tctx=temp.getContext('2d',{alpha:false});
        if(tctx){tctx.imageSmoothingEnabled=true;tctx.drawImage(image,x,y,w,h,0,0,tw,th);ctx.imageSmoothingEnabled=false;ctx.drawImage(temp,x,y,w,h);ctx.imageSmoothingEnabled=true;}
      }
    }
  } else if (a.type === 'arrow') {
    const dx = a.x2-a.x, dy = a.y2-a.y, len = Math.hypot(dx,dy);
    if (len >= 1) {
      ctx.beginPath(); ctx.moveTo(a.x,a.y); ctx.lineTo(a.x2,a.y2); ctx.stroke();
      const angle = Math.atan2(dy,dx), head = Math.min(22,Math.max(9,len*.23));
      ctx.beginPath(); ctx.moveTo(a.x2,a.y2);
      ctx.lineTo(a.x2-head*Math.cos(angle-Math.PI/6), a.y2-head*Math.sin(angle-Math.PI/6));
      ctx.moveTo(a.x2,a.y2);
      ctx.lineTo(a.x2-head*Math.cos(angle+Math.PI/6), a.y2-head*Math.sin(angle+Math.PI/6)); ctx.stroke();
    }
  } else if (a.type === 'pen') {
    if (a.points?.length) {
      ctx.beginPath();ctx.moveTo(a.points[0].x,a.points[0].y);
      for(const p of a.points.slice(1))ctx.lineTo(p.x,p.y);
      if(a.points.length===1)ctx.lineTo(a.points[0].x+.01,a.points[0].y+.01);
      ctx.stroke();
    }
  } else if (a.type === 'text') {
    ctx.font = `600 ${a.fontSize || 22}px system-ui, sans-serif`;
    ctx.textBaseline='top';
    for (const [i,line] of String(a.text || '').split('\n').entries()) ctx.fillText(line,a.x,a.y+i*(a.fontSize||22)*1.3);
  }
  ctx.restore();
}
export function renderEdit(ctx, image, state) {
  if (!validateEdit(state, image.naturalWidth, image.naturalHeight)) throw new Error('Invalid edit state');
  const {crop,annotations}=state;
  ctx.canvas.width = Math.max(1,Math.round(crop.w));
  ctx.canvas.height = Math.max(1,Math.round(crop.h));
  ctx.clearRect(0,0,ctx.canvas.width,ctx.canvas.height);
  ctx.drawImage(image,crop.x,crop.y,crop.w,crop.h,0,0,ctx.canvas.width,ctx.canvas.height);
  ctx.save(); ctx.scale(ctx.canvas.width/crop.w,ctx.canvas.height/crop.h);
  ctx.translate(-crop.x,-crop.y);
  for(const annotation of annotations)paintAnnotation(ctx,annotation,image);
  ctx.restore();
}
