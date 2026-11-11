import {timerSeconds, captureBounds, tilePositions, validateFullSize} from './capture-plan.mjs';
import {createCaptureLifecycle, throwIfCancelled, cancellableDelay, withTimeout, CAPTURE_TIMEOUT_MS} from './capture-lifecycle.mjs';
import {isTrustedUiSender, isSelectionSender} from './message-policy.mjs';
import {pageMetricsStable, totalCaptureBytes} from './capture-integrity.mjs';
import {SETTINGS_KEY,normalizeSettings,keysToPrune} from './preferences.mjs';
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
const lifecycle = createCaptureLifecycle();
let selectionTimer = 0;
let selectionExpiry = null;
function clearSelectionExpiry() { if (selectionExpiry !== null) clearTimeout(selectionExpiry); selectionExpiry = null; }
function expireSelection(job) { clearSelectionExpiry(); selectionExpiry = setTimeout(() => { if (lifecycle.active === job && lifecycle.state === 'selecting') { selectionTimer = 0; lifecycle.abort('Auswahl-Zeitlimit erreicht.'); chrome.scripting.executeScript({target:{tabId:job.tabId},func:()=>window.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true}))}).catch(()=>{}); } }, 120_000); }


async function openPreview(query = '') {
  const preview = await chrome.windows.create({
    url: chrome.runtime.getURL('editor.html' + query),
    type: 'popup', width: 520, height: 590, focused: true
  });
  // Focus requests are best-effort: Windows/Chromium may reject foreground activation.
  if (Number.isInteger(preview?.id)) {
    try { await chrome.windows.update(preview.id, {focused: true}); }
    catch (error) { console.warn('SCREENSHOT focus request:', error); }
  }
  return preview;
}

async function run(tabId, func, args = []) {
  const result = await chrome.scripting.executeScript({target: {tabId}, func, args});
  if (!result?.[0]) throw new Error('Diese Webseite ist nicht erreichbar.');
  return result[0].result;
}
async function snapshot(tabId, signal) {
  const tab = await chrome.tabs.get(tabId);
  if (!tab.active) throw new Error('Der Quelltab ist nicht mehr aktiv.');
  return withTimeout(() => chrome.tabs.captureVisibleTab(tab.windowId, {format:'png'}), 20_000, signal, 'Bildaufnahme');
}
async function ensureOffscreen() {
  if (await chrome.offscreen.hasDocument()) return;
  try {
    await chrome.offscreen.createDocument({
      url: 'offscreen.html', reasons: ['BLOBS'],
      justification: 'Lokale Screenshots in einem Offscreen-Canvas zusammensetzen.'
    });
  } catch (error) {
    // Another capture might have created it while this call was pending.
    if (!(await chrome.offscreen.hasDocument())) throw error;
  }
}
function captureId() { return crypto.randomUUID(); }
async function publishCapture(payload, signal) {
  throwIfCancelled(signal);
  // Keep only the configured bounded local history. Always reserve one slot for the new capture.
  const all = await chrome.storage.local.get(null);
  const settings = normalizeSettings(all[SETTINGS_KEY]);
    const id = captureId();
  const key = `capture:${id}`;
  const record = {...payload, created: Date.now()};
  // Commit and open the new capture before deleting existing history. If the
  // storage write or preview fails, the previous history remains intact.
  await chrome.storage.local.set({[key]: record});
  try {
    throwIfCancelled(signal);
    await openPreview(`?id=${encodeURIComponent(id)}&fresh=1`);
  } catch (error) {
    await chrome.storage.local.remove(key);
    throw error;
  }
  const overflow = keysToPrune({...all, [key]:record}, settings).filter(item => item !== key);
  if (overflow.length) {
    try { await chrome.storage.local.remove(overflow); }
    catch (error) { console.warn('SCREENSHOT history cleanup:', error); }
  }
}
async function publishError(error) {
  try { await publishCapture({error: error?.message || 'Aufnahme fehlgeschlagen.'}); }
  catch (previewError) { console.error('SCREENSHOT error preview:', previewError); }
}
async function capture(job, selection, timer = 0) {
  const {tabId, mode} = job;
  const signal = job.controller.signal;
  let original = null;
  let result = null;
  let error = null;
  let capturedBytes = 0;
  try {
    if (!Number.isInteger(tabId)) throw new Error('Quelltab nicht gefunden.');
    const tab = await chrome.tabs.get(tabId);
    if (!/^https?:/.test(tab.url || '')) throw new Error('Nur HTTP(S)-Webseiten werden unterstützt.');
    if (timer) await cancellableDelay(timer * 1000, signal);
    throwIfCancelled(signal);
    const viewport = await run(tabId, () => ({width: innerWidth, height: innerHeight, x: scrollX, y: scrollY}));
    if (viewport.width <= 0 || viewport.height <= 0) throw new Error('Ungültige Fenstergrösse.');
    let shots = [];
    let width = viewport.width, height = viewport.height;
    if (mode === 'area' || mode === 'element') selection = captureBounds(selection, viewport);
    if (mode === 'full') {
      const metrics = await run(tabId, () => {
        const root = document.documentElement, body = document.body;
        return {
          width: Math.max(root.scrollWidth, body?.scrollWidth || 0),
          height: Math.max(root.scrollHeight, body?.scrollHeight || 0),
          x: scrollX, y: scrollY,
          scrollBehavior: root.style.scrollBehavior,
          bodyScrollBehavior: body?.style.scrollBehavior || ''
        };
      });
      original = metrics;
      width = metrics.width; height = metrics.height;
      if (width > viewport.width + 2) throw new Error('Horizontal überbreite Webseiten werden nicht unterstützt.');
      const dpr = (await run(tabId, () => devicePixelRatio)) || 1;
      validateFullSize(width, height, dpr);
      await run(tabId, state => {
        const root = document.documentElement, body = document.body;
        root.style.scrollBehavior = 'auto';
        if (body) body.style.scrollBehavior = 'auto';
        // Only hide floating elements after the first tile. The marker is restored
        // in finally even after a partial capture/error.
        // Preserve pre-existing application attributes instead of removing them.
        for (const el of document.querySelectorAll('body *')) {
          if (el.closest('[data-screenshot-v15-floating]')) continue;
          const style = getComputedStyle(el);
          if ((style.position === 'fixed' || style.position === 'sticky') && !el.hasAttribute('data-screenshot-v15-floating')) el.setAttribute('data-screenshot-v15-floating', 'capture');
        }
        const rule = document.createElement('style'); rule.id = 'screenshot-v15-hide-floating';
        rule.textContent = '[data-screenshot-v15-floating=\"capture\"]{visibility:hidden!important}';
        rule.disabled = true;
        rule.dataset.started = String(Date.now());
        rule.dataset.restore = JSON.stringify({x:state.x,y:state.y,rootBehavior:state.scrollBehavior,bodyBehavior:state.bodyScrollBehavior});
        document.documentElement.appendChild(rule);
      }, [metrics]);
      // The page-owned watchdog remains alive if the MV3 service worker is suspended.
      await chrome.scripting.executeScript({target:{tabId},files:['capture-recovery.js']});
      const positions = tilePositions(height, viewport.height);
      for (let index=0; index<positions.length; index++) {
        throwIfCancelled(signal);
        if (Date.now() - job.startedAt > CAPTURE_TIMEOUT_MS) throw new Error('Vollseitenaufnahme: Zeitlimit überschritten.');
        const y = positions[index];
        const pos = await run(tabId, (target, hideFloating) => {
          const rule = document.getElementById('screenshot-v15-hide-floating');
          if (rule) rule.disabled = !hideFloating;
          window.scrollTo({left:0,top:target,behavior:'instant'});
          return {x:scrollX,y:scrollY,width:innerWidth,height:innerHeight};
        }, [y, index > 0]);
        if (pos.width !== viewport.width || pos.height !== viewport.height || Math.abs(pos.y-y)>2 || Math.abs(pos.x)>2)
          throw new Error('Die Seite hat ihre Grösse oder Scrollposition während der Aufnahme verändert.');
        await cancellableDelay(650, signal);
        // Re-read after settling: lazy content or scroll anchoring can move the viewport.
        const stable = await run(tabId, () => ({x:scrollX,y:scrollY,width:innerWidth,height:innerHeight,
          pageWidth:Math.max(document.documentElement.scrollWidth, document.body?.scrollWidth || 0),
          pageHeight:Math.max(document.documentElement.scrollHeight, document.body?.scrollHeight || 0)}));
        pageMetricsStable(stable, {x:0,y,width:viewport.width,height:viewport.height,pageWidth:width,pageHeight:height});
        const data = await snapshot(tabId, signal);
        capturedBytes = totalCaptureBytes(capturedBytes, data.length);
        shots.push({data, x: stable.x, y: stable.y});
        throwIfCancelled(signal);
      }
    } else {
      await cancellableDelay(mode === 'area' || mode === 'element' ? 220 : 80, signal);
      const data = await snapshot(tabId, signal);
      totalCaptureBytes(0, data.length);
      shots = [{data, x: 0, y: 0}];
    }
    throwIfCancelled(signal);
    const endViewport = await run(tabId, () => ({width:innerWidth,height:innerHeight}));
    if (endViewport.width !== viewport.width || endViewport.height !== viewport.height)
      throw new Error('Der sichtbare Bereich hat sich während der Aufnahme verändert.');
    lifecycle.transition('capturing', 'composing');
    await ensureOffscreen();
    const response = await withTimeout(() => chrome.runtime.sendMessage({type:'COMPOSE',shots,width,height,mode,selection,viewport}), 45_000, signal, 'Bildverarbeitung');
    if (!response?.ok || !response.data) throw new Error(response?.error || 'Bildverarbeitung fehlgeschlagen.');
    if (typeof response.data !== 'string' || !/^data:image\/png;base64,[A-Za-z0-9+/]+={0,2}$/.test(response.data))
      throw new Error('Bildverarbeitung lieferte ungültige PNG-Daten.');
    throwIfCancelled(signal);
    result = {data: response.data, mode};
  } catch (cause) { error = cause; }
  finally {
    // Restore source-page state BEFORE preview focus is requested.
    if (original) {
      try {
        await run(tabId, state => {
          document.getElementById('screenshot-v15-hide-floating')?.remove();
          document.querySelectorAll('[data-screenshot-v15-floating="capture"]').forEach(el => el.removeAttribute('data-screenshot-v15-floating'));
          document.documentElement.style.scrollBehavior = 'auto';
          if (document.body) document.body.style.scrollBehavior = 'auto';
          window.scrollTo({left: state.x, top: state.y, behavior: 'instant'});
          document.documentElement.style.scrollBehavior = state.scrollBehavior;
          if (document.body) document.body.style.scrollBehavior = state.bodyScrollBehavior;
        }, [original]);
      } catch (restoreError) { console.warn('SCREENSHOT scroll restore:', restoreError); }
    }
  }
  // Aborted jobs must not create an error popup, even after async callbacks finish.
  if (signal.aborted) return;
  if (lifecycle.active === job) lifecycle.transition(lifecycle.state, 'publishing');
  if (error) {
    console.error('SCREENSHOT capture:', error);
    await publishError(error);
  } else {
    try { await publishCapture(result, signal); }
    catch (previewError) { if (!signal.aborted) { console.error('SCREENSHOT preview:', previewError); await publishError(previewError); } }
  }
}

async function startJob(job, selection, timer) {
  try { await capture(job, selection, timer); }
  catch (error) { if (!job.controller.signal.aborted) { console.error('SCREENSHOT job:', error); await publishError(error); } }
  finally { lifecycle.finish(job); }
}
chrome.runtime.onMessage.addListener((message, sender, respond) => {
  const uiCommand = ['STATUS', 'CANCEL_CAPTURE', 'START', 'OPEN_WINDOW_PREVIEW', 'OPEN_HISTORY_CAPTURE'].includes(message?.type);
  if (uiCommand && !isTrustedUiSender(sender, chrome.runtime)) {
    respond({ok:false,error:'Nicht autorisierter Aufruf.'});return;
  }
  if (message?.type === 'OPEN_HISTORY_CAPTURE') {
    if (typeof message.id!=='string'|| !/^[a-f0-9-]{36}$/.test(message.id)) {respond({ok:false,error:'Ungültige Aufnahme-ID.'});return;}
    const key='capture:'+message.id;
    chrome.storage.local.get([key,SETTINGS_KEY]).then(result=>{
      const record=result[key], settings=normalizeSettings(result[SETTINGS_KEY]);
      if(!record||typeof record.data!=='string'||!record.data.startsWith('data:image/png;base64,')||
         !Number.isFinite(record.created)||Date.now()-record.created>settings.historyDays*86_400_000)
        throw new Error('Screenshot nicht mehr verfügbar.');
      return openPreview('?id='+encodeURIComponent(message.id));
    }).then(()=>respond({ok:true})).catch(error=>respond({ok:false,error:error.message}));
    return true;
  }
  if (message?.type === 'STATUS') {
    respond({ok: true, state: lifecycle.state, mode: lifecycle.active?.mode || null});
    return;
  }
  if (message?.type === 'CANCEL_CAPTURE') {
    clearSelectionExpiry();
    selectionTimer = 0;
    // Remove selection overlays by injecting an Escape event into the original tab.
    const job = lifecycle.active;
    if (job?.state === 'selecting') {
      chrome.scripting.executeScript({target:{tabId:job.tabId},func:()=>window.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true}))}).catch(()=>{});
    }
    respond({ok: true, cancelled: lifecycle.abort()});
    return;
  }
  if (message?.type === 'START') {
    if (!['area', 'element', 'visible', 'full'].includes(message.mode) || !Number.isInteger(message.tabId)) {
      respond({ok: false, error: 'Ungültiger Aufnahmemodus.'}); return;
    }
    let timer;
    try { timer = timerSeconds(message.timer ?? 0); } catch (error) { respond({ok:false,error:error.message}); return; }
    const selecting = message.mode === 'area' || message.mode === 'element';
    let job;
    try {job = lifecycle.begin(selecting ? 'selecting' : 'capturing', message.tabId, message.mode);}
    catch(error) {respond({ok:false,error:error.message});return;}
    if (selecting) {
      selectionTimer = timer;
      expireSelection(job);
      chrome.scripting.executeScript({target:{tabId:message.tabId},files:[message.mode === 'area' ? 'selection.js' : 'element-selection.js']})
        .then(() => {
          if (lifecycle.active !== job) {
            chrome.scripting.executeScript({target:{tabId:job.tabId},func:()=>window.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true}))}).catch(()=>{});
          }
          respond({ok:true});
        })
        .catch(error => {clearSelectionExpiry();lifecycle.finish(job);selectionTimer = 0;respond({ok:false,error:error.message});});
      return true;
    }
    void startJob(job, null, timer);
    respond({ok:true});return;
  }
  if (message?.type === 'CANCEL_SELECTION' && isSelectionSender(sender, lifecycle.active) && lifecycle.state === 'selecting') {
    clearSelectionExpiry();selectionTimer=0;lifecycle.abort();respond({ok:true});return;
  }
  if (message?.type === 'SELECTED' && isSelectionSender(sender, lifecycle.active) && lifecycle.state === 'selecting') {
    const job = lifecycle.active;
    if (message.mode && message.mode !== job.mode) {respond({ok:false,error:'Auswahlmodus stimmt nicht überein.'});return;}
    clearSelectionExpiry();
    const timer = selectionTimer;selectionTimer=0;
    lifecycle.transition('selecting', 'capturing');
    void startJob(job, message.selection, timer);
    respond({ok:true});return;
  }
  if (message?.type === 'OPEN_WINDOW_PREVIEW') {
    let timer;try {timer=timerSeconds(message.timer ?? 0);}catch(error){respond({ok:false,error:error.message});return;}
    openPreview('?window=1&timer='+timer).then(()=>respond({ok:true})).catch(error=>respond({ok:false,error:error.message}));
    return true;
  }
});
chrome.tabs.onRemoved.addListener(tabId => {
  if (lifecycle.active?.tabId === tabId) {clearSelectionExpiry();selectionTimer=0;lifecycle.abort('Quelltab geschlossen.');}
});

// Chrome manages actual user-defined capture shortcuts in chrome://extensions/shortcuts.
chrome.commands?.onCommand?.addListener(async command => {
  const mode=command==='capture-visible'?'visible':command==='capture-full'?'full':null;
  if(!mode)return;
  try {
    const [tab]=await chrome.tabs.query({active:true,lastFocusedWindow:true});
    if(!tab?.id||!/^https?:/.test(tab.url||''))throw new Error('Bitte eine HTTP(S)-Webseite öffnen.');
    const data=await chrome.storage.local.get(SETTINGS_KEY);
    const timer=normalizeSettings(data[SETTINGS_KEY]).timer;
    const job=lifecycle.begin('capturing',tab.id,mode);
    void startJob(job,null,timer);
  }catch(error){console.warn('SCREENSHOT shortcut:',error.message);}
});
