import {translations} from './locales.mjs';
export const SUPPORTED_LANGUAGES = Object.freeze(['de','en','fr','it','es']);
export function resolveLanguage(preference='auto', candidates=[]) {
  if (SUPPORTED_LANGUAGES.includes(preference)) return preference;
  for (const candidate of candidates) {
    const tag = String(candidate || '').trim().toLowerCase().split(/[-_]/)[0];
    if (SUPPORTED_LANGUAGES.includes(tag)) return tag;
  }
  return 'en';
}
export const browserLanguages = () => [
  ...(typeof navigator !== 'undefined' ? (navigator.languages || []) : []),
  typeof chrome !== 'undefined' && chrome.i18n?.getUILanguage ? chrome.i18n.getUILanguage() : '',
  typeof navigator !== 'undefined' ? navigator.language : ''
];
export function translate(language, text) { return translations[language]?.[text] || text; }
const originalText=new WeakMap();
const originalAttributes=new WeakMap();
export function applyTranslations(root,language) {
  if (!root) return;
  const t = text => translate(language,text);
  const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);
  let node;
  while((node=walker.nextNode())){
    const parent=node.parentElement;
    if (!parent || ['SCRIPT','STYLE','KBD'].includes(parent.tagName)) continue;
    if(!originalText.has(node))originalText.set(node,node.nodeValue);
    const match=originalText.get(node).match(/^(\s*)(.*?)(\s*)$/s);
    if (!match || !match[2]) continue;
    const translated=t(match[2]);
    node.nodeValue=match[1]+translated+match[3];
  }
  for(const el of root.querySelectorAll('*')) {
    for(const attr of ['title','aria-label','placeholder','alt']) {
      if(!originalAttributes.has(el)) originalAttributes.set(el,{});
      const originals=originalAttributes.get(el);
      if(!(attr in originals)) originals[attr]=el.getAttribute(attr);
      const value=originals[attr]; if(value)el.setAttribute(attr,t(value));
    }
  }
  document.documentElement.lang=language;
}
