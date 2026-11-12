import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {resolveLanguage,translate} from '../i18n.mjs';
import {normalizeSettings} from '../preferences.mjs';
const read=f=>readFileSync(new URL('../'+f,import.meta.url),'utf8');
test('automatic language matches browser preference and falls back to English',()=>{
  assert.equal(resolveLanguage('auto',['de-CH','en-US']),'de');
  assert.equal(resolveLanguage('auto',['pt-BR','fr-CH']),'fr');
  assert.equal(resolveLanguage('auto',['zh-CN']),'en');
  assert.equal(resolveLanguage('it',['de-CH']),'it');
  assert.equal(resolveLanguage('invalid',['es-MX']),'es');
});
test('language preference is persisted and invalid values are sanitized',()=>{
  assert.equal(normalizeSettings({}).language,'auto');
  assert.equal(normalizeSettings({language:'fr'}).language,'fr');
  assert.equal(normalizeSettings({language:'xx'}).language,'auto');
});
test('five translations cover capture and editor primary entry points',()=>{
 for(const language of ['de','en','fr','it','es']){
  for(const key of ['NEUE AUFNAHME','Einstellungen','Sprache','Kopieren','Bild wird geladen …'])assert.equal(typeof translate(language,key),'string');
  assert.ok(existsSync(new URL(`../_locales/${language}/messages.json`,import.meta.url)));
 }
 const html=read('popup.html'); assert.match(html,/id="interface-language"/);
 assert.match(read('popup.js'),/updatePreferences\(\{language:languageField.value\}\)/);
});
