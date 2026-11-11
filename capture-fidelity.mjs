// Pure pixel mapping. One image strip is painted per tile, never an overlapping bitmap.
export function captureScale(bitmapWidth, bitmapHeight, viewport) {
  if (![bitmapWidth, bitmapHeight, viewport?.width, viewport?.height].every(v => Number.isSafeInteger(v) && v > 0))
    throw new Error('Ungültige Aufnahmeabmessungen.');
  const sx = bitmapWidth / viewport.width;
  const sy = bitmapHeight / viewport.height;
  if (Math.abs(sx - sy) / Math.max(sx, sy) > 0.015)
    throw new Error('Aufnahme hat unterschiedliche horizontale und vertikale Skalierung.');
  return {sx, sy};
}
export function fullTilePlan(shots, outputWidth, outputHeight, viewport, bitmapSizes) {
  if (!Array.isArray(shots) || !shots.length || shots.length !== bitmapSizes?.length)
    throw new Error('Teilaufnahmen fehlen.');
  const first = bitmapSizes[0];
  const {sx,sy} = captureScale(first.width, first.height, viewport);
  if (![outputWidth,outputHeight].every(v=>Number.isSafeInteger(v)&&v>0))throw new Error('Ungültige Seitengrösse.');
  if (outputWidth > viewport.width)throw new Error('Horizontale Überbreite wird nicht unterstützt.');
  const outputPixels = {width:Math.round(outputWidth*sx),height:Math.round(outputHeight*sy)};
  if (!outputPixels.width || !outputPixels.height || outputPixels.width > 32767 || outputPixels.height > 32767 || outputPixels.width*outputPixels.height > 80_000_000)
    throw new Error('Bildabmessungen überschreiten das Limit.');
  const items=[];
  for(let i=0;i<shots.length;i++) {
    const shot=shots[i], bitmap=bitmapSizes[i];
    captureScale(bitmap.width,bitmap.height,viewport);
    if (Math.abs(bitmap.width-first.width)>1 || Math.abs(bitmap.height-first.height)>1)
      throw new Error('Bildauflösung hat sich während der Aufnahme verändert.');
    if (![shot?.x,shot?.y].every(Number.isFinite)||Math.abs(shot.x)>1)
      throw new Error('Ungültige Kachelposition.');
    const y=shot.y;
    const next=i+1<shots.length?shots[i+1].y:outputHeight;
    if (i===0 && Math.abs(y)>0.01)throw new Error('Erste Kachel beginnt nicht oben.');
    if (next<=y || next>outputHeight || next-y>viewport.height)
      throw new Error('Lücke oder ungültige Überlappung zwischen Kacheln.');
    const destinationTop=Math.round(y*sy);
    const destinationBottom=Math.round(next*sy);
    const sourceBottom=destinationBottom-destinationTop;
    if (destinationTop<0 || sourceBottom<1 || sourceBottom>bitmap.height+1 || (i && destinationTop!==items[i-1].destinationBottom))
      throw new Error('Pixelkacheln sind nicht lückenlos.');
    const sourceHeight=Math.min(bitmap.height,sourceBottom);
    items.push({sourceX:0,sourceY:0,sourceWidth:outputPixels.width,sourceHeight,
      destinationX:0,destinationTop,destinationWidth:outputPixels.width,
      destinationHeight:sourceBottom,destinationBottom});
  }
  if (items.at(-1).destinationBottom!==outputPixels.height)throw new Error('Unterer Seitenrand fehlt.');
  return {outputPixels,items};
}
export function cropPixelPlan(selection, bitmapSize, viewport) {
  const {sx,sy}=captureScale(bitmapSize.width,bitmapSize.height,viewport);
  if (!selection || ![selection.x,selection.y,selection.width,selection.height].every(Number.isFinite) || selection.width<=0 || selection.height<=0)
    throw new Error('Ungültiger Zuschnitt.');
  const x0=Math.round(selection.x*sx),y0=Math.round(selection.y*sy);
  const x1=Math.round((selection.x+selection.width)*sx),y1=Math.round((selection.y+selection.height)*sy);
  if(x0<0||y0<0||x1>bitmapSize.width||y1>bitmapSize.height||x1<=x0||y1<=y0)
    throw new Error('Zuschnitt liegt ausserhalb des Bildes.');
  return {x:x0,y:y0,width:x1-x0,height:y1-y0};
}
