import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {translations} from '../locales.mjs';
import {translate, translateError, resolveLanguage} from '../i18n.mjs';
const read = file => readFileSync(new URL(`../${file}`,import.meta.url),'utf8');
const languages=['de','en','fr','it','es'];
const required = Object.keys(translations.de);
test('all five locale dictionaries have identical nonempty coverage',()=>{
  for(const lang of languages){
    assert.deepEqual(Object.keys(translations[lang]).sort(),required.slice().sort(),`Missing or surplus ${lang} keys`);
    for(const key of required) assert.ok(translations[lang][key]?.trim(),`${lang}: ${key}`);
  }
});
test('user-facing static HTML strings and labels have translations',()=>{
  const ignored=new Set(['SCREENSHOT','Deutsch','English','Français','Italiano','Español','›','⌄','1:1','100%']);
  for(const file of ['popup.html','editor.html']){
    const html=read(file).replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,'').replace(/<svg\b[^>]*>[\s\S]*?<\/svg>/gi,'').replace(/<kbd\b[^>]*>[\s\S]*?<\/kbd>/gi,'');
    const attrs=[...html.matchAll(/(?:title|aria-label|placeholder|alt)="([^"]+)"/g)].map(m=>m[1]);
    const nodes=[...html.matchAll(/>([^<>]+)</g)].map(m=>m[1].trim());
    for(let key of [...attrs,...nodes]){
      key=key.replace(/&amp;/g,'&').replace(/&nbsp;/g,' ');
      if (!key || key.startsWith('+ ') || ignored.has(key) || /^v?\d+(?:[.\d:%+\s]| px)*$/.test(key)|| /^[+×−\d\s%]+$/.test(key))continue;
      assert.ok(required.includes(key),`${file}: untranslated: ${key}`);
    }
  }
});
test('dynamic literal keys used by popup and editor exist in all dictionaries',()=>{
  for(const file of ['popup.js','editor.js']){
    for(const [,key] of read(file).matchAll(/\bt\('([^'\n]+)'\)/g)) assert.ok(required.includes(key),`${file}: ${key}`);
  }
});
test('all five locales translate extension errors and timeout labels, with safe unknown fallback',()=>{
  for(const lang of languages){
    assert.equal(resolveLanguage('auto',[`${lang}-CH`]),lang);
    assert.equal(translateError(lang,'Die vorherige Aufnahme wird noch abgeschlossen.'),translate(lang,'Die vorherige Aufnahme wird noch abgeschlossen.'));
    assert.equal(translateError(lang,'Quelltab: Zeitlimit überschritten.'),`${translate(lang,'Quelltab')}: ${translate(lang,'Zeitlimit überschritten.')}`);
    assert.equal(translateError(lang,new Error('Fensteraufnahme: Canvas nicht verfügbar.')),`${translate(lang,'Fensteraufnahme:')} ${translate(lang,'Canvas nicht verfügbar.')}`);
    assert.equal(translateError(lang,'unexpected internal exception / private path'),translate(lang,'Unbekannter Fehler. Bitte erneut versuchen.'));
  }
});
test('UI routes all error surfaces through language-aware rendering',()=>{
  const popup=read('popup.js'), editor=read('editor.js');
  assert.match(popup,/function displayError\(error\).*translateError\(language,error\)/);
  assert.match(popup,/setInterfaceLanguage\(\).*lastError/);
  assert.match(editor,/notice\.textContent = error \? translateError\(language,message\)/);
  assert.match(editor,/newCaptureError\.textContent = translateError\(language,error/);
  assert.match(editor,/void languageReady\.then\(load\)/);
});
