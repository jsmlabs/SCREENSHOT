(() => {
  if (window.__screenshotElementSelecting) return;
  window.__screenshotElementSelecting = true;
  const host = document.createElement('div');
  host.style.cssText = 'position:fixed;inset:0;z-index:2147483647;pointer-events:none';
  const shadow = host.attachShadow({mode:'closed'});
  const outline = document.createElement('div');
  outline.style.cssText = 'position:absolute;border:2px solid #4d9df7;background:rgba(77,157,247,.14);box-shadow:0 0 0 1px #fff8;pointer-events:none;display:none';
  const hint = document.createElement('div');
  hint.textContent = 'Element anklicken · Esc zum Abbrechen';
  hint.style.cssText = 'position:absolute;left:50%;top:14px;transform:translateX(-50%);background:#16191e;color:#fff;padding:7px 12px;border-radius:7px;font:12px system-ui;pointer-events:none;white-space:nowrap';
  shadow.append(outline,hint);document.documentElement.append(host);
  let current = null, lastBounds = null;
  const send = (type, selection) => chrome.runtime.sendMessage({type,mode:'element',selection}).catch(() => {});
  function cleanup() {
    window.removeEventListener('mousemove', move, true);
    window.removeEventListener('click', click, true);
    window.removeEventListener('keydown', key, true);
    window.removeEventListener('scroll', refresh, true);
    window.removeEventListener('resize', refresh, true);
    host.remove();delete window.__screenshotElementSelecting;
  }
  function inspect(target) {
    if (!(target instanceof Element) || target === host || host.contains(target)) return;
    const r = target.getBoundingClientRect();
    const x = Math.max(0, r.left), y = Math.max(0, r.top);
    const right = Math.min(innerWidth, r.right), bottom = Math.min(innerHeight, r.bottom);
    if (right-x < 3 || bottom-y < 3) {current=null;outline.style.display='none';return;}
    current=target;
    lastBounds={x,y,width:right-x,height:bottom-y,viewportWidth:innerWidth,viewportHeight:innerHeight};
    Object.assign(outline.style,{display:'block',left:x+'px',top:y+'px',width:lastBounds.width+'px',height:lastBounds.height+'px'});
  }
  function move(e) {inspect(document.elementFromPoint(e.clientX,e.clientY));}
  function refresh() {if(current?.isConnected)inspect(current);}
  function key(e) {
    if(e.key==='Escape') {e.preventDefault();e.stopImmediatePropagation();cleanup();send('CANCEL_SELECTION');}
  }
  function click(e) {
    if(e.button!==0) return;
    inspect(document.elementFromPoint(e.clientX,e.clientY));
    if(!current || !lastBounds) return;
    e.preventDefault();e.stopImmediatePropagation();
    const selection={...lastBounds};cleanup();
    setTimeout(()=>send('SELECTED',selection),100);
  }
  window.addEventListener('mousemove',move,true);
  window.addEventListener('click',click,true);
  window.addEventListener('keydown',key,true);
  window.addEventListener('scroll',refresh,true);
  window.addEventListener('resize',refresh,true);
})();
