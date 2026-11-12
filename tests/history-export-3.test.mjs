import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {normalizedCaptureName,libraryEntries,bytesLabel} from '../src/shared/history-library.mjs';
import {captureEntries,keysToPrune,normalizeSettings,safeFilename} from '../src/shared/preferences.mjs';
import {translations} from '../src/shared/locales.mjs';
const read=name=>readFileSync(new URL('../'+name,import.meta.url),'utf8');
const now=1_800_000_000_000;
const id=n=>`capture:${String(n).padStart(36,'0')}`;
const rec=(n,extra={})=>({created:now-n*1000,mode:'visible',data:'data:image/png;base64,YQ==',...extra});
test('search supports names and mode, case-insensitively, without mutating source',()=>{
 const all=[[id(1),rec(1,{name:'Homepage'})],[id(2),rec(2,{name:'Error Case',favorite:true})]];
 assert.deepEqual(libraryEntries(all,{query:'HOME'}).map(([key])=>key),[id(1)]);
 assert.deepEqual(libraryEntries(all,{query:'visible',favoritesOnly:true}).map(([key])=>key),[id(2)]);
 assert.deepEqual(all.map(([key])=>key),[id(1),id(2)]);
});
test('validates names, safe export filenames and export configuration',()=>{
 assert.equal(normalizedCaptureName('  Product   landing  '),'Product landing');
 assert.equal(normalizedCaptureName('\u0000invalid',''), '');
 assert.equal(normalizedCaptureName('x'.repeat(81),''),'');
 assert.equal(safeFilename(new Date('2026-11-11T12:00:00Z'),'project_01'),'project_01-2026-11-11T12-00-00-000Z.png');
 assert.equal(safeFilename(new Date('2026-11-11T12:00:00Z'),'../evil'),'screenshot-2026-11-11T12-00-00-000Z.png');
 assert.equal(normalizeSettings({exportPrefix:'../../unsafe',exportAskWhere:'true'}).exportPrefix,'screenshot');
 assert.equal(normalizeSettings({exportPrefix:'work',exportAskWhere:true}).exportAskWhere,true);
});
test('favorites survive age expiration but bounded history still prunes by priority',()=>{
 const entries={[id(1)]:rec(99_999,{favorite:true,name:'Pinned'}),[id(2)]:rec(1),[id(3)]:rec(2),[id(4)]:rec(3)};
 const settings={historyLimit:2,historyDays:1};
 const available=captureEntries(entries,settings,now);
 assert.equal(available.length,4);
 assert.deepEqual(keysToPrune(entries,settings,now),[id(3),id(4)]);
 const only={[id(1)]:rec(99_999,{favorite:true}),[id(2)]:rec(99_998,{favorite:true}),[id(3)]:rec(99_997,{favorite:true})};
 assert.deepEqual(keysToPrune(only,{historyLimit:2,historyDays:1},now),[id(1)]);
});
test('storage label handles tiny and large sizes',()=>{
 assert.equal(bytesLabel(0),'0 B');assert.equal(bytesLabel(1024),'1.0 KB');assert.equal(bytesLabel(2*1048576),'2.0 MB');
});
test('popup and editor wire search, rename, favorites, export and storage metadata',()=>{
 const html=read('src/popup/popup.html'),js=read('src/popup/popup.js'),editor=read('src/editor/editor.js');
 for(const id of ['history-search','history-favorites','history-count','history-storage','export-prefix','export-ask-where'])assert.match(html,new RegExp(`id="${id}"`));
 for(const call of ['libraryEntries','normalizedCaptureName','getBytesInUse','chrome.downloads.download'])assert.ok(js.includes(call));
 assert.match(js,/chrome\.storage\.local\.set\(\{\[key\]:\{\.\.\.record,favorite:!record\.favorite\}\}\)/);
 assert.match(editor,/chrome\.downloads\.download\(\{url:renderedData/);
 assert.doesNotMatch(js,/innerHTML\s*=/);
});
test('all new UI identifiers exist in each locale',()=>{
 const keys=['Als Favorit markieren','Favorit entfernen','Umbenennen','PNG exportieren','Dateiname (Präfix)','Speicherort beim Export wählen','Aufnahmen durchsuchen','Nur Favoriten','Keine passenden Aufnahmen.'];
 for(const lang of ['de','en','fr','it','es'])for(const key of keys)assert.ok(translations[lang][key],`${lang} ${key}`);
});
