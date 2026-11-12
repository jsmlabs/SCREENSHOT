import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {normalizedCaptureName,libraryEntries} from '../src/shared/history-library.mjs';

const records = [
  ['capture:a',{name:'Café résumé',mode:'area',created:1,favorite:true}],
  ['capture:b',{name:'Plain image',mode:'full',created:2,favorite:false}]
];

test('library matching is accent-insensitive without mutating originals',()=>{
  assert.deepEqual(libraryEntries(records,{query:'CAFE'}).map(([key])=>key),['capture:a']);
  assert.deepEqual(libraryEntries(records,{query:'resume'}).map(([key])=>key),['capture:a']);
  assert.deepEqual(libraryEntries(records,{favoritesOnly:true}).map(([key])=>key),['capture:a']);
  assert.equal(records[0][1].name,'Café résumé');
});
test('control characters are rejected before normalization',()=>{
  assert.equal(normalizedCaptureName('ok\nunsafe',''), '');
  assert.equal(normalizedCaptureName('ok\tunsafe',''), '');
  assert.equal(normalizedCaptureName('  clean   screenshot  ',''),'clean screenshot');
});
test('history filtering runs on cached records and does not issue a storage read per keystroke',()=>{
  const js=readFileSync(new URL('../src/popup/popup.js',import.meta.url),'utf8');
  assert.match(js,/searchField\.addEventListener\('input',renderHistory\)/);
  assert.match(js,/favoritesField\.addEventListener\('change',renderHistory\)/);
  assert.match(js,/if\(token!==historyRefreshToken\)return/);
  assert.match(js,/cachedHistory=available/);
  assert.match(js,/if\(button\.disabled\)return;button\.disabled=true/);
});
