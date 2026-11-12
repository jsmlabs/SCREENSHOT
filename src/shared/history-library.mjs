// Pure helpers for a private, bounded screenshot library.
export function normalizedCaptureName(value, fallback='Screenshot') {
  if(typeof value!=='string')return fallback;
  if (/[\x00-\x1f\x7f]/.test(value)) return fallback;
  const name=value.trim().replace(/\s+/g,' ');
  return name && name.length<=80 ? name : fallback;
}
export function libraryEntries(entries,{query='',favoritesOnly=false}={}) {
  const fold = value => String(value||'').normalize('NFKD').replace(/\p{M}/gu,'').toLocaleLowerCase();
  const needle=fold(query).trim();
  return entries.filter(([,record])=>(!favoritesOnly||record.favorite===true) &&
    (!needle || [record.name,record.mode,new Date(record.created).toLocaleDateString()].some(v=>fold(v).includes(needle))))
    .sort((a,b)=>Number(b[1].favorite===true)-Number(a[1].favorite===true)||b[1].created-a[1].created);
}
export function bytesLabel(bytes){
  if(!Number.isFinite(bytes)||bytes<0)return '0 B';
  return bytes<1024?`${Math.round(bytes)} B`:bytes<1048576?`${(bytes/1024).toFixed(1)} KB`:`${(bytes/1048576).toFixed(1)} MB`;
}
