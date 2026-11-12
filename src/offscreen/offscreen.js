import {captureScale, fullTilePlan, cropPixelPlan} from '../capture/capture-fidelity.mjs';
import {isWorkerSender,validateComposeMessage} from '../shared/message-policy.mjs';
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type !== 'COMPOSE') return;
  if (!isWorkerSender(sender, chrome.runtime)) {sendResponse({ok:false,error:'Nicht autorisierter Bildauftrag.'});return;}
  try {validateComposeMessage(message);} catch(error) {sendResponse({ok:false,error:error.message});return;}
  compose(message).then(data => sendResponse({ok:true,data}))
    .catch(error => sendResponse({ok:false,error:error.message}));
  return true;
});
async function load(data) {
  if (typeof data !== 'string' || !data.startsWith('data:image/png;base64,')) throw new Error('Ungültige PNG-Aufnahme.');
  const response = await fetch(data);
  return createImageBitmap(await response.blob());
}
async function compose({shots,width,height,mode,selection,viewport}) {
  if (!Array.isArray(shots) || !shots.length || shots.length>256) throw new Error('Keine gültigen Teilaufnahmen vorhanden.');
  // Decode one tile at a time; release GPU/bitmap memory before decoding the next.
  // The full-page plan is fixed before any pixels are written, preserving seam geometry.
  let bitmap = await load(shots[0].data);
  try {
    let outputWidth, outputHeight, operations;
    const first = {width:bitmap.width,height:bitmap.height};
    if (mode === 'full') {
      const {outputPixels,items}=fullTilePlan(shots,width,height,viewport,shots.map(()=>first));
      outputWidth=outputPixels.width;outputHeight=outputPixels.height;
      operations=items;
    } else if(mode==='area'||mode==='element') {
      const rect=cropPixelPlan(selection,first,viewport);
      outputWidth=rect.width;outputHeight=rect.height;
      operations=[{sourceX:rect.x,sourceY:rect.y,sourceWidth:rect.width,sourceHeight:rect.height,
        destinationX:0,destinationTop:0,destinationWidth:rect.width,destinationHeight:rect.height}];
    } else {
      captureScale(first.width,first.height,viewport);
      outputWidth=first.width;outputHeight=first.height;
      operations=[{sourceX:0,sourceY:0,sourceWidth:outputWidth,sourceHeight:outputHeight,
        destinationX:0,destinationTop:0,destinationWidth:outputWidth,destinationHeight:outputHeight}];
    }
    if(outputWidth*outputHeight>80_000_000||outputWidth>32767||outputHeight>32767)throw new Error('Bildabmessungen überschreiten das Limit.');
    const canvas=document.createElement('canvas');canvas.width=outputWidth;canvas.height=outputHeight;
    const ctx=canvas.getContext('2d',{alpha:false});
    if(!ctx)throw new Error('Canvas nicht verfügbar.');
    ctx.imageSmoothingEnabled=false;
    for(let index=0;index<operations.length;index++) {
      if(index) bitmap=await load(shots[index].data);
      try {
        // Reject DPR/viewport changes instead of compositing corrupted stripes.
        captureScale(bitmap.width,bitmap.height,viewport);
        if(Math.abs(bitmap.width-first.width)>1||Math.abs(bitmap.height-first.height)>1)
          throw new Error('Bildauflösung hat sich während der Aufnahme verändert.');
        const op=operations[index];
        ctx.drawImage(bitmap,op.sourceX,op.sourceY,op.sourceWidth,op.sourceHeight,
          op.destinationX,op.destinationTop,op.destinationWidth,op.destinationHeight);
      } finally { bitmap.close(); bitmap=null; }
    }
    return canvas.toDataURL('image/png');
  } finally { if(bitmap) bitmap.close(); }
}
