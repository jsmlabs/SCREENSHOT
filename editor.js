import {copyPngToClipboard} from './clipboard.mjs';
import {createAutomaticClipboard} from './clipboard-flow.mjs';
import {MIN_ZOOM, MAX_ZOOM, clamp, fitScale, anchoredPan, imagePosition} from './viewport.mjs';
import {initialEdit, createHistory, current, commit, undo, redo, canUndo, canRedo, cloneEdit, applyCrop, addAnnotation, boundedPoint, rectBetween, localToSource} from './edit-model.mjs';
import {findAnnotation,annotationBounds,translateAnnotation,moveAnnotation,removeAnnotation,patchAnnotation} from './edit-objects.mjs';
import {paintAnnotation, renderEdit} from './edit-render.mjs';
import {TOOLS,strokeWidth,toolForKey,shouldHandleShortcut,normalisedWheelDelta,sameCrop} from './editor-interactions.mjs';
import {SETTINGS_KEY,normalizeSettings,safeFilename,keysToPrune} from './preferences.mjs';

const $ = id => document.getElementById(id);
const preview = $('preview'), stage = $('viewport'), notice = $('notice'), overlay = $('overlay');
const copy = $('copy'), save = $('save'), windowButton = $('window');
const zoomIn = $('zoom-in'), zoomOut = $('zoom-out'), fitButton = $('fit'), actualButton = $('actual');
const zoomValue = $('zoom-value'), undoButton = $('undo'), redoButton = $('redo'), resetButton = $('reset-edit');
const colorPicker = $('edit-color'), widthPicker = $('edit-width'), toolButtons = [...document.querySelectorAll('[data-tool]')];
const deleteButton = $('delete-object'), editObjectButton = $('edit-object');
let selectedIndex = -1;
const image = new Image(), outputCanvas = document.createElement('canvas');
let originalData = null, renderedData = null, history = null;
let autoSaved = false;
let scale = 1, panX = 0, panY = 0, dragging = null, fitMode = true, tool = 'pan';
let drawGeneration = 0;
const dimensions = () => ({iw: preview.naturalWidth, ih: preview.naturalHeight, vw: stage.clientWidth, vh: stage.clientHeight});
function status(message, error = false) {
  notice.textContent = message;
  notice.classList.toggle('error', error);
  notice.classList.toggle('success', !error && /(?:automatisch kopiert|in zwischenablage kopiert)/i.test(message));
}
function draw() {
  const {iw, ih, vw, vh} = dimensions();
  if (!iw || !ih || !vw || !vh) return;
  const pos = imagePosition(iw, ih, vw, vh, scale, panX, panY);
  panX = pos.x; panY = pos.y;
  preview.style.width = iw + 'px'; preview.style.height = ih + 'px';
  preview.style.transform = `translate(${pos.left}px, ${pos.top}px) scale(${scale})`;
  zoomValue.textContent = Math.round(scale * 100) + '%';
  zoomOut.disabled = scale <= MIN_ZOOM; zoomIn.disabled = scale >= MAX_ZOOM;
  drawOverlay();
}
function setScale(next, ax = 0, ay = 0) {
  if (!history) return;
  const target = clamp(next, MIN_ZOOM, MAX_ZOOM);
  if (Math.abs(target - scale) < 1e-9) return;
  ({x: panX, y: panY} = anchoredPan(panX, panY, scale, target, ax, ay));
  scale = target; fitMode = false; draw();
}
function fit() {
  if (!history) return;
  const {iw, ih, vw, vh} = dimensions();
  scale = clamp(fitScale(iw, ih, vw, vh), MIN_ZOOM, MAX_ZOOM);
  panX = 0; panY = 0; fitMode = true; draw();
}
function actual() {
  if (!history) return;
  scale = 1; panX = 0; panY = 0; fitMode = false; draw();
}
function activeEdit() { return current(history); }
function updateControls() {
  undoButton.disabled = !history || !canUndo(history);
  redoButton.disabled = !history || !canRedo(history);
  resetButton.disabled = !history || !canUndo(history);
  for (const button of toolButtons) button.disabled = !history;
  deleteButton.disabled = !history || selectedIndex < 0;
  editObjectButton.disabled = !history || selectedIndex < 0 || activeEdit().annotations[selectedIndex]?.type !== 'text';
}
function setTool(next) {
  if (!TOOLS.includes(next)) return;
  tool = next;
  dragging = null;
  if (tool !== 'select') selectedIndex = -1;
  updateControls();
  stage.classList.toggle('editing', tool !== 'pan'); stage.classList.remove('dragging');
  for (const button of toolButtons) {
    const selected = button.dataset.tool === tool;
    button.classList.toggle('active', selected);
    button.setAttribute('aria-pressed', String(selected));
  }
  $('view-hint').textContent = tool === 'pan' ? 'Mausrad: Zoom · Ziehen: Bewegen · Doppelklick: Anpassen' :
    tool === 'crop' ? 'Bereich ziehen: Zuschneiden · Esc: Hand' :
    tool === 'text' ? 'Position anklicken: Text · Esc: Hand' :
    tool === 'select' ? 'Objekt anklicken und verschieben · Entf: Löschen · Doppelklick: Text bearbeiten' :
    ['blur','pixelate'].includes(tool) ? 'Bereich ziehen: Bildbereich unkenntlich machen' : 'Ziehen: Annotation · Esc: Hand';
  drawOverlay();
}
let clipboardNotice = '';
let clipboardFailed = false;
function clipboardFeedback(message, failed = false) {
  clipboardNotice = message; clipboardFailed = failed; status(message, failed);
}
// Clipboard writes require a foreground document in Chromium. Never report success
// before navigator.clipboard.write resolves. Re-focus will retry pending captures.
const automaticClipboard = createAutomaticClipboard({
  write: copyPngToClipboard,
  canWrite: () => document.hasFocus() && document.visibilityState === 'visible',
  onStatus: (state, detail) => {
    if (state === 'copied') clipboardFeedback('Automatisch kopiert');
    else if (state === 'pending') clipboardFeedback('Kopieren ausstehend - Editor fokussieren');
    else if (state === 'blocked') clipboardFeedback('Zwischenablage blockiert - Editor fokussieren oder klicken und erneut versuchen', true);
    else clipboardFeedback('Automatisches Kopieren fehlgeschlagen: ' + detail, true);
  }
});
function scheduleAutomaticCopy(data) { automaticClipboard.schedule(data); }
window.addEventListener('focus', () => void automaticClipboard.flush());
document.addEventListener('visibilitychange', () => void automaticClipboard.flush());
document.addEventListener('pointerdown', () => void automaticClipboard.flush());
document.addEventListener('keydown', () => void automaticClipboard.flush());
function render(onPreviewReady = null) {
  if (!history) return;
  const ctx = outputCanvas.getContext('2d', {alpha: false});
  if (!ctx) throw new Error('Canvas nicht verfügbar.');
  renderEdit(ctx, image, activeEdit());
  try { renderedData = outputCanvas.toDataURL('image/png'); }
  catch (error) { renderedData = null; status('PNG konnte nicht gerendert werden: '+(error.message||error),true); return; }
  const generation = ++drawGeneration;
  preview.onload = () => {
    if (generation !== drawGeneration) return;
    preview.hidden = false;
    stage.classList.add('ready');
    for (const button of [copy, save, zoomIn, zoomOut, fitButton, actualButton]) button.disabled = false;
    updateControls();
    if (fitMode) fit(); else draw();
    if (onPreviewReady) onPreviewReady();
    const crop = activeEdit().crop;
    status(`Bereit · PNG · ${Math.round(crop.w)} × ${Math.round(crop.h)} · ${activeEdit().annotations.length} Annotationen${clipboardNotice ? ' · '+clipboardNotice : ''}`, clipboardFailed);
  };
  preview.onerror = () => { if(generation===drawGeneration)status('Bearbeitetes Bild konnte nicht geladen werden.',true); };
  preview.src = renderedData;
}
function commitEdit(next, shouldFit = false) {
  if (!next) return;
  const cropUnchanged = sameCrop(activeEdit().crop, next.crop);
  history = commit(history, next);
  selectedIndex = -1;
  if (!shouldFit && cropUnchanged && fitMode) fitMode = false;
  if (shouldFit) { fitMode = true; panX = 0; panY = 0; }
  render();
}
async function autoSaveOriginal(data){
  if(autoSaved)return;
  try {
    const stored=await chrome.storage.local.get(SETTINGS_KEY);
    if(!normalizeSettings(stored[SETTINGS_KEY]).autoSave)return;
    // Mark before the async download to avoid duplicate exports from subsequent renders.
    autoSaved=true;
    await chrome.downloads.download({url:data,filename:safeFilename(),saveAs:false,conflictAction:'uniquify'});
  }catch(error){autoSaved=false;status('Auto-Save fehlgeschlagen: '+(error.message||error),true);}
}
function setImage(value) {
  if (!value?.startsWith('data:image/png;base64,')) { status('Ungültiges Screenshot-Format.', true); return; }
  originalData = value;
  autoSaved = false;
  image.onload = () => {
    try {
      history = createHistory(initialEdit(image.naturalWidth, image.naturalHeight));
      fitMode = true; render(() => {scheduleAutomaticCopy(value);if(new URLSearchParams(location.search).get('fresh')==='1')void autoSaveOriginal(value);}); setTool('pan');
      // Copy only after both source decoding and preview rendering have succeeded.
    } catch (error) { status('Screenshot konnte nicht verarbeitet werden: '+error.message,true); }
  };
  image.onerror = () => status('Bild konnte nicht geladen werden.',true);
  image.src = value;
}
async function load() {
  const params = new URLSearchParams(location.search);
  if (params.has('window')) {
    windowButton.hidden = false;
    status('Fenster auswählen und Freigabe bestätigen.'); return;
  }
  const id = params.get('id');
  if (!id || !/^[a-f0-9-]{36}$/.test(id)) { status('Keine Aufnahme für dieses Fenster vorhanden.',true); return; }
  const key = `capture:${id}`;
  try {
    const stored = (await chrome.storage.local.get(key))[key];
    if (!stored) throw new Error('Screenshot nicht mehr verfügbar.');
    if (stored.error) throw new Error(stored.error);
    setImage(stored.data);
  } catch (error) { status(error.message || String(error),true); }
}
void load();
zoomIn.addEventListener('click', () => setScale(scale * 1.25));
zoomOut.addEventListener('click', () => setScale(scale / 1.25));
fitButton.addEventListener('click', fit);
actualButton.addEventListener('click', actual);
for (const button of toolButtons) button.addEventListener('click', () => setTool(button.dataset.tool));
function navigateHistory(direction) {
  if(!history || !(direction === -1 ? canUndo(history) : canRedo(history)))return;
  const before=activeEdit().crop;
  history=direction === -1 ? undo(history) : redo(history);selectedIndex=-1;
  if(!sameCrop(before,activeEdit().crop)){fitMode=true;panX=0;panY=0;}
  else if(fitMode) fitMode=false; // Annotation-only changes preserve exact viewport.
  render();
}
undoButton.addEventListener('click', () => navigateHistory(-1));
redoButton.addEventListener('click', () => navigateHistory(1));
resetButton.addEventListener('click', () => {
  if(!history || !canUndo(history))return;
  commitEdit(initialEdit(image.naturalWidth,image.naturalHeight),true);
  setTool('pan');
});
stage.addEventListener('dblclick',event=>{if(!history || event.button!==0 || tool!=='pan')return;fit();});
stage.addEventListener('wheel', event => {
  if (!history) return;
  event.preventDefault();
  const rect = stage.getBoundingClientRect();
  setScale(scale * Math.exp(-normalisedWheelDelta(event.deltaY,event.deltaMode,stage.clientHeight) * .0015),event.clientX-rect.left-rect.width/2,event.clientY-rect.top-rect.height/2);
},{passive:false});
function imagePoint(event) {
  const {iw,ih,vw,vh}=dimensions();
  const rect = stage.getBoundingClientRect();
  const pos=imagePosition(iw,ih,vw,vh,scale,panX,panY);
  return {x:(event.clientX-rect.left-pos.left)/scale, y:(event.clientY-rect.top-pos.top)/scale};
}
function clampPoint(point) {
  const c=activeEdit().crop;
  return boundedPoint(point,c.w,c.h);
}
function drawOverlay() {
  const ctx=overlay.getContext('2d');if(!ctx)return;
  const vw=stage.clientWidth,vh=stage.clientHeight;
  if(!vw||!vh)return;
  const dpr=window.devicePixelRatio||1;
  if(overlay.width!==Math.round(vw*dpr)||overlay.height!==Math.round(vh*dpr)) {
    overlay.width=Math.round(vw*dpr);overlay.height=Math.round(vh*dpr);
  }
  ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,vw,vh);
  if(!dragging && (tool!=='select' || selectedIndex<0))return;
  if(dragging?.mode==='pan')return;
  const {iw,ih}=dimensions(), pos=imagePosition(iw,ih,vw,vh,scale,panX,panY);
  ctx.save();ctx.translate(pos.left,pos.top);ctx.scale(scale,scale);
  ctx.beginPath();ctx.rect(0,0,iw,ih);ctx.clip();
  const color=colorPicker.value;
  if(dragging?.mode==='select' || (!dragging && selectedIndex>=0)) {
    const a = dragging?.candidate || activeEdit().annotations[selectedIndex];
    const bounds=annotationBounds(a);
    if(bounds){ctx.strokeStyle='#71aaff';ctx.lineWidth=Math.max(1,1.5/scale);ctx.setLineDash([5/scale,3/scale]);ctx.strokeRect(bounds.x-activeEdit().crop.x,bounds.y-activeEdit().crop.y,bounds.w,bounds.h);}
  } else if(dragging.mode==='crop') {
    const r=rectBetween(dragging.start,dragging.end);
    ctx.strokeStyle='#ffffff';ctx.lineWidth=Math.max(1,2/scale);
    ctx.setLineDash([7/scale,4/scale]);ctx.strokeRect(r.x,r.y,r.w,r.h);
    ctx.fillStyle='rgba(50,130,255,.15)';ctx.fillRect(r.x,r.y,r.w,r.h);
  } else {
    const a=buildAnnotation(dragging,color);
    if(a) {
      ctx.translate(-activeEdit().crop.x,-activeEdit().crop.y);
      paintAnnotation(ctx,a);
    }
  }
  ctx.restore();
}
function buildAnnotation(drag,color) {
  const c=activeEdit().crop;
  const start=localToSource(activeEdit(),drag.start),end=localToSource(activeEdit(),drag.end);
  const width=strokeWidth(widthPicker.value);
  if(['blur','pixelate','rect'].includes(drag.mode)) {
    const r=rectBetween(start,end);if(r.w<2||r.h<2)return null;
    return {type:drag.mode,...r,color,width};
  }
  if(drag.mode==='arrow') {
    if(Math.hypot(end.x-start.x,end.y-start.y)<2)return null;
    return {type:'arrow',x:start.x,y:start.y,x2:end.x,y2:end.y,color,width};
  }
  if(drag.mode==='pen') {
    return {type:'pen',points:drag.points.map(p=>({x:p.x+c.x,y:p.y+c.y})),color,width};
  }
  return null;
}
stage.addEventListener('pointerdown', event => {
  if (!history || event.button !== 0) return;
  if(tool==='text') {
    // Prompt is user initiated, not run during extension startup.
    const point=imagePoint(event);
    if(point.x<0||point.y<0||point.x>preview.naturalWidth||point.y>preview.naturalHeight)return;
    const text=window.prompt('Text für Screenshot (max. 200 Zeichen):','');
    if(text?.trim()) {
      const source=localToSource(activeEdit(),clampPoint(point));
      commitEdit(addAnnotation(activeEdit(),{type:'text',x:source.x,y:source.y,text:text.slice(0,200),color:colorPicker.value,fontSize:Math.max(16,Math.min(72,24/Math.max(.5,scale)))}));
    }
    return;
  }
  if(tool==='select') {
    const point=imagePoint(event), source=localToSource(activeEdit(),point);
    selectedIndex=findAnnotation(activeEdit().annotations,source,7/scale);
    updateControls();drawOverlay();
    if(selectedIndex<0)return;
    dragging={mode:'select',id:event.pointerId,start:source,index:selectedIndex,original:activeEdit().annotations[selectedIndex],candidate:activeEdit().annotations[selectedIndex]};
  } else if(tool==='pan') {
    dragging={mode:'pan',id:event.pointerId,x:event.clientX,y:event.clientY,panX,panY};
  } else {
    const point=imagePoint(event);
    if(point.x<0||point.y<0||point.x>preview.naturalWidth||point.y>preview.naturalHeight)return;
    const start=clampPoint(point);
    dragging={mode:tool,id:event.pointerId,start,end:{...start},points:[start]};
  }
  stage.setPointerCapture(event.pointerId);stage.classList.add('dragging');stage.focus({preventScroll:true});
});
stage.addEventListener('pointermove', event => {
  if (!dragging || dragging.id !== event.pointerId) return;
  if(dragging.mode==='select') {
    const source=localToSource(activeEdit(),clampPoint(imagePoint(event)));
    dragging.candidate=translateAnnotation(dragging.original,source.x-dragging.start.x,source.y-dragging.start.y);
    drawOverlay();
  } else if(dragging.mode==='pan') {
    panX=dragging.panX+event.clientX-dragging.x;
    panY=dragging.panY+event.clientY-dragging.y;
    fitMode=false;draw();
  } else {
    const p=clampPoint(imagePoint(event));dragging.end=p;
    if(dragging.mode==='pen')dragging.points.push(p);
    drawOverlay();
  }
});
function stopDrag(event, cancel=false) {
  if (!dragging || event.pointerId!==dragging.id)return;
  if(!cancel && dragging.mode!=='pan'){const p=clampPoint(imagePoint(event));dragging.end=p;if(dragging.mode==='pen')dragging.points.push(p);if(dragging.mode==='select'){const source=localToSource(activeEdit(),p);dragging.candidate=translateAnnotation(dragging.original,source.x-dragging.start.x,source.y-dragging.start.y);}}
  const completed=dragging;dragging=null;stage.classList.remove('dragging');
  if(stage.hasPointerCapture(event.pointerId))stage.releasePointerCapture(event.pointerId);
  drawOverlay();
  if(cancel || completed.mode==='pan')return;
  if(completed.mode==='select'){
    if(completed.candidate && JSON.stringify(completed.candidate)!==JSON.stringify(completed.original)){
      const moved=moveAnnotation(activeEdit(),completed.index,completed.candidate.x !== undefined ? completed.candidate.x-completed.original.x : completed.candidate.points[0].x-completed.original.points[0].x, completed.candidate.y !== undefined ? completed.candidate.y-completed.original.y : completed.candidate.points[0].y-completed.original.points[0].y);
      if(moved){commitEdit(moved);selectedIndex=completed.index;updateControls();}
    }drawOverlay();return;
  }
  try {
    if(completed.mode==='crop') {
      const edit=applyCrop(activeEdit(),completed.start,completed.end);
      if(edit) {commitEdit(edit,true);setTool('pan');}
      else status('Zuschneidebereich zu klein.',true);
    } else {
      const annotation=buildAnnotation(completed,colorPicker.value);
      if(annotation)commitEdit(addAnnotation(activeEdit(),annotation));
    }
  } catch(error){status('Bearbeitung fehlgeschlagen: '+error.message,true);}
}
stage.addEventListener('pointerup',event=>stopDrag(event));
stage.addEventListener('pointercancel',event=>stopDrag(event,true));
stage.addEventListener('lostpointercapture',()=>{if(dragging){dragging=null;stage.classList.remove('dragging');drawOverlay();}});
window.addEventListener('keydown',event=>{
  if(!history || ['INPUT','TEXTAREA','SELECT'].includes(document.activeElement?.tagName))return;
  if((event.ctrlKey||event.metaKey) && !event.altKey && event.key.toLowerCase()==='z') {
    event.preventDefault();navigateHistory(event.shiftKey ? 1 : -1);
    return;
  }
  if((event.ctrlKey||event.metaKey) && !event.altKey && event.key.toLowerCase()==='y') {
    event.preventDefault();navigateHistory(1);return;
  }
  if(event.key==='Escape'){setTool('pan');return;}
  if(tool==='select' && selectedIndex>=0 && (event.key==='Delete'||event.key==='Backspace')){event.preventDefault();deleteSelected();return;}
  if(!shouldHandleShortcut(document.activeElement,event))return;
  const selectedTool=toolForKey(event.key);
  if(selectedTool){event.preventDefault();setTool(selectedTool);return;}
  if(tool!=='pan')return;
  const steps={ArrowLeft:[-45,0],ArrowRight:[45,0],ArrowUp:[0,-45],ArrowDown:[0,45]};
  if(steps[event.key]){event.preventDefault();panX-=steps[event.key][0];panY-=steps[event.key][1];fitMode=false;draw();}
  else if(event.key==='+'||event.key==='='){event.preventDefault();setScale(scale*1.25);}
  else if(event.key==='-'){event.preventDefault();setScale(scale/1.25);}
  else if(event.key==='0'){event.preventDefault();fit();}
  else if(event.key==='1'){event.preventDefault();actual();}
});
function deleteSelected(){if(!history||selectedIndex<0)return;const next=removeAnnotation(activeEdit(),selectedIndex);if(next){commitEdit(next);setTool('select');}}
function editSelectedText(){const a=activeEdit()?.annotations[selectedIndex];if(a?.type!=='text')return;const text=window.prompt('Text bearbeiten (max. 200 Zeichen):',a.text);if(text?.trim()){const next=patchAnnotation(activeEdit(),selectedIndex,{text:text.slice(0,200)});if(next){const index=selectedIndex;commitEdit(next);setTool('select');selectedIndex=index;updateControls();drawOverlay();}}}
deleteButton.addEventListener('click',deleteSelected);
editObjectButton.addEventListener('click',editSelectedText);
colorPicker.addEventListener('change',()=>{if(tool!=='select'||selectedIndex<0)return;const index=selectedIndex,next=patchAnnotation(activeEdit(),index,{color:colorPicker.value});if(next){commitEdit(next);setTool('select');selectedIndex=index;updateControls();drawOverlay();}});
widthPicker.addEventListener('change',()=>{if(tool!=='select'||selectedIndex<0)return;const index=selectedIndex,next=patchAnnotation(activeEdit(),index,{width:strokeWidth(widthPicker.value)});if(next){commitEdit(next);setTool('select');selectedIndex=index;updateControls();drawOverlay();}});
stage.addEventListener('dblclick',event=>{if(tool==='select'&&history){const source=localToSource(activeEdit(),imagePoint(event));selectedIndex=findAnnotation(activeEdit().annotations,source,7/scale);editSelectedText();}});
new ResizeObserver(()=>{if(fitMode)fit();else draw();}).observe(stage);
windowButton.addEventListener('click',async()=>{
  let stream;windowButton.disabled=true;status('Fensterfreigabe wird angefordert ...');
  try {
    stream=await navigator.mediaDevices.getDisplayMedia({video:{displaySurface:'window'},audio:false,preferCurrentTab:false});
    const video=document.createElement('video');video.srcObject=stream;video.muted=true;
    await video.play();if(!video.videoWidth||!video.videoHeight)throw new Error('Fensterbild ist noch nicht verfügbar.');
    const timer = Number(new URLSearchParams(location.search).get('timer') || 0);
    if ([3,5,10].includes(timer)) { status('Fensteraufnahme in ' + timer + ' Sekunden ...'); await new Promise(resolve => setTimeout(resolve, timer * 1000)); }
    const canvas=document.createElement('canvas');canvas.width=video.videoWidth;canvas.height=video.videoHeight;
    const ctx=canvas.getContext('2d');if(!ctx)throw new Error('Canvas nicht verfügbar.');
    ctx.drawImage(video,0,0);
    const data = canvas.toDataURL('image/png');
    // Local history is best-effort; a storage failure must not lose the captured window.
    try {
      const id=crypto.randomUUID();
      const created=Date.now();
      await chrome.storage.local.set({['capture:'+id]:{data,mode:'window',created}});
      const local=await chrome.storage.local.get(null);
      const expired=keysToPrune(local,normalizeSettings(local[SETTINGS_KEY]));
      if(expired.length)await chrome.storage.local.remove(expired);
    } catch (storageError) { console.warn('SCREENSHOT local history:',storageError); }
    setImage(data);
  } catch(error){status('Fensteraufnahme: '+(error.message||error),true);}
  finally{stream?.getTracks().forEach(track=>track.stop());windowButton.disabled=false;}
});
save.addEventListener('click',()=>{
  if(!renderedData)return;
  const a=document.createElement('a');a.href=renderedData;
  a.download='screenshot-'+new Date().toISOString().replace(/[:.]/g,'-')+'.png';a.click();
});
copy.addEventListener('click',async()=>{
  if(!renderedData)return;
  copy.disabled=true;
  try {
    // A later focus event must not overwrite the manually copied edited PNG.
    await automaticClipboard.cancelAndWait();
    await copyPngToClipboard(renderedData);
    clipboardFeedback('Bearbeiteten Screenshot kopiert');
  }catch(error){clipboardFeedback('Kopieren nicht möglich: '+error.message,true);}
  finally{copy.disabled=false;}
});
