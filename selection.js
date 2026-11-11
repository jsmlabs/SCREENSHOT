(() => {
  if (window.__screenshotSelecting) return;
  window.__screenshotSelecting = true;
  const host = document.createElement('div');
  host.style.cssText = 'position:fixed;inset:0;z-index:2147483647;cursor:crosshair;touch-action:none';
  const shadow = host.attachShadow({mode:'closed'});
  const layer = document.createElement('div');
  layer.style.cssText = 'position:absolute;inset:0;background:rgba(0,0,0,.19)';
  const rect = document.createElement('div');
  rect.style.cssText = 'position:absolute;border:2px solid #fff;box-shadow:0 0 0 1px #111,0 0 0 99999px rgba(0,0,0,.18);display:none;pointer-events:none';
  const hint = document.createElement('div');
  hint.textContent = 'Bereich ziehen · Esc zum Abbrechen';
  hint.style.cssText = 'position:absolute;top:18px;left:50%;transform:translateX(-50%);padding:8px 12px;border-radius:7px;background:#16191e;color:#fff;font:12px system-ui;white-space:nowrap';
  shadow.append(layer,rect,hint);
  document.documentElement.append(host);
  let start=null;
  function cleanup(){host.remove();window.removeEventListener('keydown',key,true);delete window.__screenshotSelecting;}
  function key(e){if(e.key==='Escape'){e.preventDefault();e.stopPropagation();cleanup();chrome.runtime.sendMessage({type:'CANCEL_SELECTION'}).catch(()=>{});}}
  window.addEventListener('keydown',key,true);
  host.addEventListener('pointerdown',e=>{if(e.button!==0)return;start={x:e.clientX,y:e.clientY};host.setPointerCapture(e.pointerId);hint.style.display='none';rect.style.display='block';});
  host.addEventListener('pointermove',e=>{if(!start)return;const x=Math.min(start.x,e.clientX),y=Math.min(start.y,e.clientY);Object.assign(rect.style,{left:x+'px',top:y+'px',width:Math.abs(e.clientX-start.x)+'px',height:Math.abs(e.clientY-start.y)+'px'});});
  host.addEventListener('pointerup',e=>{if(!start)return;const selection={x:Math.min(start.x,e.clientX),y:Math.min(start.y,e.clientY),width:Math.abs(e.clientX-start.x),height:Math.abs(e.clientY-start.y),viewportWidth:innerWidth,viewportHeight:innerHeight};cleanup();if(selection.width<3||selection.height<3){chrome.runtime.sendMessage({type:'CANCEL_SELECTION'}).catch(()=>{});return;}setTimeout(()=>chrome.runtime.sendMessage({type:'SELECTED',selection}).catch(()=>{}),100);});
})();
