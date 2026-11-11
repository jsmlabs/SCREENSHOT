import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {normalizeSettings,DEFAULT_SETTINGS,SETTINGS_KEY,captureEntries,keysToPrune,safeFilename} from '../preferences.mjs';
const read=name=>readFileSync(new URL('../'+name,import.meta.url),'utf8');
const id=n=>`capture:${String(n).padStart(36,'0')}`;
const now=1_800_000_000_000;
const record=(age,mode='visible')=>({created:now-age,mode,data:'data:image/png;base64,YQ=='});
test('defaults are private, bounded, and optional auto-save starts disabled',()=>{
 assert.deepEqual(normalizeSettings({}),DEFAULT_SETTINGS);
 assert.equal(SETTINGS_KEY,'settings:v1');
 assert.equal(normalizeSettings({autoSave:'true',timer:99,historyLimit:1000,historyDays:30}).autoSave,false);
 assert.deepEqual(normalizeSettings({autoSave:'true',timer:99,historyLimit:1000,historyDays:30}),DEFAULT_SETTINGS);
 assert.deepEqual(normalizeSettings({timer:3,autoSave:true,historyLimit:5,historyDays:7}),{timer:3,autoSave:true,historyLimit:5,historyDays:7});
 assert.equal(safeFilename(new Date('2026-11-11T18:00:01Z')),'screenshot-2026-11-11T18-00-01-000Z.png');
});
test('local history discards expired, malformed, error and excess records deterministically',()=>{
 const records={
  [id(1)]:record(1_000),[id(2)]:record(3_000),[id(3)]:record(4_000),
  [id(4)]:record(2*86_400_000),[id(5)]:{created:now-1000,error:'failed'},
  'capture:evil':record(100),other:'unrelated',
 };
 const settings={historyLimit:2,historyDays:1};
 assert.deepEqual(captureEntries(records,settings,now).map(([k])=>k),[id(1),id(2),id(3)]);
 const removed=keysToPrune(records,settings,now);
 assert.deepEqual(new Set(removed),new Set([id(3),id(4),id(5),'capture:evil']));
 assert.equal(removed.includes('other'),false);
});
test('popup exposes reversible settings, accessible history controls and Chrome shortcut settings',()=>{
 const html=read('popup.html'),js=read('popup.js');
 for(const selector of ['auto-save','history-limit','history-days','capture-history','clear-history','manage-shortcuts'])assert.match(html,new RegExp(`id="${selector}"`));
 assert.match(js,/SETTINGS_KEY/);assert.match(js,/captureEntries\(/);assert.match(js,/keysToPrune\(/);
 assert.match(js,/chrome:\/\/extensions\/shortcuts/);
 assert.match(js,/window\.confirm\(/);
 assert.doesNotMatch(js,/innerHTML\s*=/);
});
test('worker restricts history access to trusted extension UI, respects bounded retention and enables Chrome shortcuts',()=>{
 const js=read('background.js'),m=JSON.parse(read('manifest.json'));
 assert.match(js,/OPEN_HISTORY_CAPTURE/);
 assert.match(js,/isTrustedUiSender\(sender, chrome\.runtime\)/);
 assert.match(js,/keysToPrune\(\{\.\.\.all, \[key\]:record\}, settings\)/);
 assert.match(js,/chrome\.commands\?\.onCommand\?\.addListener/);
 assert.ok(m.permissions.includes('downloads'));
 assert.ok(m.commands['capture-visible']);assert.ok(m.commands['capture-full']);
 assert.equal(m.host_permissions,undefined);
});
test('editor auto-save is opt-in and requests downloads only after full preview render',()=>{
 const js=read('editor.js');
 assert.match(js,/normalizeSettings\(stored\[SETTINGS_KEY\]\)\.autoSave/);
 assert.match(js,/chrome\.downloads\.download\(\{url:data,filename:safeFilename\(\),saveAs:false,conflictAction:'uniquify'\}\)/);
 assert.match(js,/render\(\(\) => \{scheduleAutomaticCopy\(value\);if\(new URLSearchParams\(location.search\).get\('fresh'\)==='1'\)void autoSaveOriginal\(value\);\}\)/);
 assert.match(js,/autoSaved=true/);
});
