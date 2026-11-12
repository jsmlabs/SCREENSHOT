// Versioned local preferences. Images never leave the browser.
export const SETTINGS_KEY = 'settings:v1';
export const DEFAULT_SETTINGS = Object.freeze({timer:0,autoSave:false,historyLimit:10,historyDays:1,language:'auto'});
export function normalizeSettings(value) {
  const input = value && typeof value === 'object' && !Array.isArray(value) ? value : {};
  const timer = Number(input.timer);
  const historyLimit = Number(input.historyLimit);
  const historyDays = Number(input.historyDays);
  return {
    timer:[0,3,5,10].includes(timer) ? timer : DEFAULT_SETTINGS.timer,
    autoSave:input.autoSave === true,
    historyLimit:Number.isInteger(historyLimit)&&historyLimit>=1&&historyLimit<=20?historyLimit:DEFAULT_SETTINGS.historyLimit,
    historyDays:[1,3,7].includes(historyDays)?historyDays:DEFAULT_SETTINGS.historyDays,
    language:['auto','de','en','fr','it','es'].includes(input.language)?input.language:DEFAULT_SETTINGS.language
  };
}
export function captureEntries(records, settings = DEFAULT_SETTINGS, now=Date.now()) {
  const s=normalizeSettings(settings);
  return Object.entries(records || {}).filter(([key,v]) =>
    /^capture:[a-f0-9-]{36}$/.test(key) && v && typeof v === 'object' &&
    typeof v.data === 'string' && v.data.startsWith('data:image/png;base64,') &&
    Number.isFinite(v.created) && v.created>0 && v.created<=now &&
    now-v.created<=s.historyDays*86_400_000)
    .sort((a,b)=>b[1].created-a[1].created || a[0].localeCompare(b[0]));
}
export function keysToPrune(records, settings=DEFAULT_SETTINGS, now=Date.now()) {
  const allowed=new Set(captureEntries(records,settings,now).slice(0,normalizeSettings(settings).historyLimit).map(([k])=>k));
  return Object.keys(records||{}).filter(key=>key.startsWith('capture:')&&!allowed.has(key));
}
export function safeFilename(now=new Date()) {
  return 'screenshot-'+now.toISOString().replace(/[:.]/g,'-')+'.png';
}
