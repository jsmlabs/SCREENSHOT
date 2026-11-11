import {SETTINGS_KEY, DEFAULT_SETTINGS, normalizeSettings, captureEntries, keysToPrune} from './preferences.mjs';
const status = document.querySelector('#status');
const captureTimer = document.querySelector('#capture-timer');
const autoSaveField=document.querySelector('#auto-save');
const limitField=document.querySelector('#history-limit');
const daysField=document.querySelector('#history-days');
const historyList=document.querySelector('#capture-history');
const clearHistoryButton=document.querySelector('#clear-history');
let preferences={...DEFAULT_SETTINGS};
let ready=false;
function syncPreferenceFields(){
  captureTimer.value=String(preferences.timer);
  autoSaveField.checked=preferences.autoSave;
  limitField.value=String(preferences.historyLimit);
  daysField.value=String(preferences.historyDays);
}
function displayError(error){status.className='error';status.textContent=error?.message||String(error);}
async function loadPreferences(){
  try{
    preferences=normalizeSettings((await chrome.storage.local.get(SETTINGS_KEY))[SETTINGS_KEY]);
    syncPreferenceFields();
    ready=true;
    await refreshHistory(true);
  }catch(error){displayError(error);}
}
async function updatePreferences(patch){
  if(!ready)return;
  const previous=preferences;
  preferences=normalizeSettings({...preferences,...patch});
  try{
    await chrome.storage.local.set({[SETTINGS_KEY]:preferences});
    await refreshHistory(true);
    if(status.classList.contains('error')){status.className='';status.textContent='';}
  }catch(error){preferences=previous;syncPreferenceFields();displayError(error);}
}
async function refreshHistory(prune=false){
  const all=await chrome.storage.local.get(null);
  if(prune){const remove=keysToPrune(all,preferences);if(remove.length)await chrome.storage.local.remove(remove);for(const k of remove)delete all[k];}
  const entries=captureEntries(all,preferences).slice(0,preferences.historyLimit);
  historyList.replaceChildren();
  clearHistoryButton.hidden=!entries.length;
  if(!entries.length){const empty=document.createElement('p');empty.className='empty-history';empty.textContent='Deine letzten Aufnahmen erscheinen hier.';historyList.append(empty);return;}
  const labels={area:'Bereich',element:'Element',visible:'Sichtbarer Tab',window:'Fenster',full:'Ganze Seite'};
  for(const [key,record] of entries){
    const item=document.createElement('div');item.className='history-item';
    const open=document.createElement('button');open.type='button';open.className='history-open';
    const mode=document.createElement('strong');mode.textContent=labels[record.mode]||'Aufnahme';
    const time=document.createElement('small');time.textContent=new Date(record.created).toLocaleString('de-CH');
    open.append(mode,time);
    open.addEventListener('click',async()=>{
      open.disabled=true;
      try{const response=await chrome.runtime.sendMessage({type:'OPEN_HISTORY_CAPTURE',id:key.slice(8)});if(!response?.ok)throw new Error(response?.error||'Die Aufnahme konnte nicht geöffnet werden. Versuche es erneut.');window.close();}
      catch(error){displayError(error);open.disabled=false;}
    });
    const del=document.createElement('button');del.type='button';del.className='history-delete';del.textContent='×';del.title='Aufnahme löschen';del.setAttribute('aria-label','Aufnahme löschen');
    del.addEventListener('click',async()=>{try{await chrome.storage.local.remove(key);await refreshHistory();}catch(error){displayError(error);}});
    item.append(open,del);historyList.append(item);
  }
}
autoSaveField.addEventListener('change',()=>void updatePreferences({autoSave:autoSaveField.checked}));
limitField.addEventListener('change',()=>void updatePreferences({historyLimit:Number(limitField.value)}));
daysField.addEventListener('change',()=>void updatePreferences({historyDays:Number(daysField.value)}));
captureTimer.addEventListener('change',()=>void updatePreferences({timer:Number(captureTimer.value)}));
clearHistoryButton.addEventListener('click',async()=>{
  if(!window.confirm('Möchtest du alle Aufnahmen aus deinem lokalen Verlauf löschen? Diese Aktion kann nicht rückgängig gemacht werden.'))return;
  try{const all=await chrome.storage.local.get(null);const keys=Object.keys(all).filter(k=>k.startsWith('capture:'));if(keys.length)await chrome.storage.local.remove(keys);await refreshHistory();}
  catch(error){displayError(error);}
});
document.querySelector('#manage-shortcuts').addEventListener('click',()=>void chrome.tabs.create({url:'chrome://extensions/shortcuts'}).catch(displayError));
void loadPreferences();
const buttons = [...document.querySelectorAll('[data-mode]')];
let starting = false;
buttons.forEach(button => button.addEventListener('click', async () => {
  if (starting) return;
  starting = true;
  const mode = button.dataset.mode;
  const timer = Number(captureTimer.value);
  buttons.forEach(b => b.disabled = true); captureTimer.disabled = true;
  status.className = 'busy';
  status.textContent = mode === 'full' ? 'Die gesamte Seite wird aufgenommen …' : 'Aufnahme wird vorbereitet …';
  try {
    if (mode === 'window') {
      const response = await chrome.runtime.sendMessage({type:'OPEN_WINDOW_PREVIEW',timer});
      if (!response?.ok) throw new Error(response?.error || 'Die Aufnahme konnte nicht geöffnet werden. Versuche es erneut.');
    } else {
      const [tab] = await chrome.tabs.query({active:true,currentWindow:true});
      if (!tab?.id || !/^https?:/.test(tab.url || '')) throw new Error('Diese Seite kann nicht aufgenommen werden. Öffne eine normale Webseite (https:// oder http://).');
      const response = await chrome.runtime.sendMessage({type:'START',mode,tabId:tab.id,timer});
      if (!response?.ok) throw new Error(response?.error || 'Die Aufnahme ist fehlgeschlagen. Bitte versuche es erneut.');
    }
    window.close();
  } catch(error) {
    status.className = 'error'; status.textContent = error.message;
    starting = false;
    buttons.forEach(b => b.disabled = false); captureTimer.disabled = false;
  }
}));

const cancelButton = document.querySelector('#cancel-capture');
async function refreshCaptureStatus() {
  try {
    const result = await chrome.runtime.sendMessage({type:'STATUS'});
    if (starting) return;
    const active = result?.ok && result.state !== 'idle';
    cancelButton.hidden = !active;
    if(active) {
      buttons.forEach(button => button.disabled = true);
      captureTimer.disabled = true;
      status.className = 'busy';
      const labels = {selecting:'Bitte wähle den gewünschten Bereich aus',capturing:'Aufnahme wird erstellt',processing:'Bild wird vorbereitet',publishing:'Editor wird geöffnet'};
      status.textContent = labels[result.state] || 'Aufnahme wird erstellt';
    } else {
      buttons.forEach(button => button.disabled = false);
      captureTimer.disabled = false;
      if (status.classList.contains('busy')) {status.className = ''; status.textContent = '';}
    }
  } catch(error) {status.textContent = error.message;}
}
cancelButton.addEventListener('click', async () => {
  cancelButton.disabled = true;
  try {await chrome.runtime.sendMessage({type:'CANCEL_CAPTURE'});status.textContent='Aufnahme abgebrochen.';}
  catch(error) {status.className='error';status.textContent=error.message;}
  finally {cancelButton.disabled = false;await refreshCaptureStatus();}
});
void refreshCaptureStatus();
