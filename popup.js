import {resolveLanguage,browserLanguages,applyTranslations,translate,translateError} from './i18n.mjs';
import {normalizedCaptureName,libraryEntries,bytesLabel} from './history-library.mjs';
import {safeFilename,SETTINGS_KEY, DEFAULT_SETTINGS, normalizeSettings, captureEntries, keysToPrune} from './preferences.mjs';
const status = document.querySelector('#status');
const languageField=document.querySelector('#interface-language');
let language='en';
const t = text => translate(language,text);
function setInterfaceLanguage(){language=resolveLanguage(preferences.language,browserLanguages());applyTranslations(document.body,language);if(status.classList.contains('error')&&lastError)status.textContent=translateError(language,lastError);}
const captureTimer = document.querySelector('#capture-timer');
const autoSaveField=document.querySelector('#auto-save');
const limitField=document.querySelector('#history-limit');
const daysField=document.querySelector('#history-days');
const historyList=document.querySelector('#capture-history');
const clearHistoryButton=document.querySelector('#clear-history');
const searchField=document.querySelector('#history-search');
const favoritesField=document.querySelector('#history-favorites');
const countField=document.querySelector('#history-count');
const storageField=document.querySelector('#history-storage');
const prefixField=document.querySelector('#export-prefix');
const askWhereField=document.querySelector('#export-ask-where');
let lastError=null;
let preferences={...DEFAULT_SETTINGS};
let ready=false;
// Capture PNG payloads are expensive to read. Filter an in-memory snapshot while the popup is open.
let cachedHistory = [];
let cachedHistoryBytes = null;
let historyRefreshToken = 0;
function syncPreferenceFields(){
  languageField.value=preferences.language;
  captureTimer.value=String(preferences.timer);
  autoSaveField.checked=preferences.autoSave;
  limitField.value=String(preferences.historyLimit);
  daysField.value=String(preferences.historyDays);
  prefixField.value=preferences.exportPrefix;
  askWhereField.checked=preferences.exportAskWhere;
}
function displayError(error){console.warn('SCREENSHOT popup:',error);lastError=error;status.className='error';status.textContent=translateError(language,error);}
async function loadPreferences(){
  try{
    preferences=normalizeSettings((await chrome.storage.local.get(SETTINGS_KEY))[SETTINGS_KEY]);
    syncPreferenceFields();
    setInterfaceLanguage();
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
    setInterfaceLanguage();
    // Only history retention changes need a full PNG-library read and prune.
    // Language changes can repaint the already-cached list instantly.
    if ('historyLimit' in patch || 'historyDays' in patch) await refreshHistory(true);
    else if ('language' in patch) renderHistory();
    if(status.classList.contains('error')){status.className='';status.textContent='';lastError=null;}
  }catch(error){preferences=previous;syncPreferenceFields();setInterfaceLanguage();displayError(error);}
}
async function refreshHistory(prune=false){
  const token=++historyRefreshToken;
  const all=await chrome.storage.local.get(null);
  if(prune){const remove=keysToPrune(all,preferences);if(remove.length)await chrome.storage.local.remove(remove);for(const key of remove)delete all[key];}
  const available=captureEntries(all,preferences);
  let usage=null;
  try {usage=await chrome.storage.local.getBytesInUse(available.map(([key])=>key));} catch {}
  if(token!==historyRefreshToken)return;
  cachedHistory=available;
  cachedHistoryBytes=usage;
  renderHistory();
}
function renderHistory(){
  const available=cachedHistory;
  const entries=libraryEntries(available,{query:searchField.value,favoritesOnly:favoritesField.checked}).slice(0,preferences.historyLimit);
  historyList.replaceChildren();
  clearHistoryButton.hidden=!available.length;
  countField.textContent=`${entries.length} / ${available.length} ${t('Aufnahmen')}`;
  storageField.textContent=cachedHistoryBytes===null?'':bytesLabel(cachedHistoryBytes);
  if(!entries.length){const empty=document.createElement('p');empty.className='empty-history';empty.textContent=t(available.length?'Keine passenden Aufnahmen.':'Deine letzten Aufnahmen erscheinen hier.');historyList.append(empty);return;}
  const labels={area:'Bereich',element:'Element',visible:'Sichtbarer Tab',window:'Fenster',full:'Ganze Seite'};
  for(const [key,record] of entries){
    const item=document.createElement('div');item.className='history-item';
    const open=document.createElement('button');open.type='button';open.className='history-open';
    const mode=document.createElement('strong');mode.textContent=record.name||t(labels[record.mode]||'Aufnahme');
    const time=document.createElement('small');time.textContent=new Date(record.created).toLocaleString(language);
    open.append(mode,time);
    open.addEventListener('click',async()=>{
      open.disabled=true;
      try{const response=await chrome.runtime.sendMessage({type:'OPEN_HISTORY_CAPTURE',id:key.slice(8)});if(!response?.ok)throw new Error(response?.error||'Die Aufnahme konnte nicht geöffnet werden. Versuche es erneut.');window.close();}
      catch(error){displayError(error);open.disabled=false;}
    });
    const actions=document.createElement('div');actions.className='history-actions';
    const action=(text,title,callback)=>{const button=document.createElement('button');button.type='button';button.textContent=text;button.title=t(title);button.setAttribute('aria-label',t(title));button.addEventListener('click',async()=>{if(button.disabled)return;button.disabled=true;try{await callback();}catch(error){displayError(error);}finally{button.disabled=false;}});actions.append(button);return button;};
    action(record.favorite?'★':'☆',record.favorite?'Favorit entfernen':'Als Favorit markieren',async()=>{
      await chrome.storage.local.set({[key]:{...record,favorite:!record.favorite}});await refreshHistory();
    });
    action('✎','Umbenennen',async()=>{
      const proposed=window.prompt(t('Neuer Name der Aufnahme'),record.name||t(labels[record.mode]||'Aufnahme'));
      if(proposed===null)return;
      const name=normalizedCaptureName(proposed,'');
      if(!name){throw new Error('Name muss zwischen 1 und 80 Zeichen lang sein.');}
      await chrome.storage.local.set({[key]:{...record,name}});await refreshHistory();
    });
    action('↓','PNG exportieren',async()=>{
      await chrome.downloads.download({url:record.data,filename:safeFilename(new Date(),preferences.exportPrefix),saveAs:preferences.exportAskWhere,conflictAction:'uniquify'});
    });
    action('×','Aufnahme löschen',async()=>{await chrome.storage.local.remove(key);await refreshHistory();});
    item.append(open,actions);historyList.append(item);
  }
}
searchField.addEventListener('input',renderHistory);
favoritesField.addEventListener('change',renderHistory);
languageField.addEventListener('change',()=>void updatePreferences({language:languageField.value}));
autoSaveField.addEventListener('change',()=>void updatePreferences({autoSave:autoSaveField.checked}));
limitField.addEventListener('change',()=>void updatePreferences({historyLimit:Number(limitField.value)}));
daysField.addEventListener('change',()=>void updatePreferences({historyDays:Number(daysField.value)}));
prefixField.addEventListener('change',()=>{if(!prefixField.checkValidity()){prefixField.value=preferences.exportPrefix;return;}void updatePreferences({exportPrefix:prefixField.value});});
askWhereField.addEventListener('change',()=>void updatePreferences({exportAskWhere:askWhereField.checked}));
captureTimer.addEventListener('change',()=>void updatePreferences({timer:Number(captureTimer.value)}));
clearHistoryButton.addEventListener('click',async()=>{
  if(!window.confirm(t('Möchtest du alle Aufnahmen aus deinem lokalen Verlauf löschen? Diese Aktion kann nicht rückgängig gemacht werden.')))return;
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
  status.textContent = t(mode === 'full' ? 'Die gesamte Seite wird aufgenommen …' : 'Aufnahme wird vorbereitet …');
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
    displayError(error);
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
      status.textContent = t(labels[result.state] || 'Aufnahme wird erstellt');
    } else {
      buttons.forEach(button => button.disabled = false);
      captureTimer.disabled = false;
      if (status.classList.contains('busy')) {status.className = ''; status.textContent = '';}
    }
  } catch(error) {displayError(error);}
}
cancelButton.addEventListener('click', async () => {
  cancelButton.disabled = true;
  try {await chrome.runtime.sendMessage({type:'CANCEL_CAPTURE'});status.textContent=t('Aufnahme abgebrochen.');}
  catch(error) {displayError(error);}
  finally {cancelButton.disabled = false;await refreshCaptureStatus();}
});
void refreshCaptureStatus();
