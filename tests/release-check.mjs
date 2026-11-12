import {readFileSync,readdirSync,statSync} from 'node:fs';
import {dirname,isAbsolute,join,relative,resolve,sep} from 'node:path';
import {fileURLToPath} from 'node:url';

const root=resolve(fileURLToPath(new URL('..',import.meta.url)));
const manifest=JSON.parse(readFileSync(join(root,'manifest.json')));
if(manifest.manifest_version!==3 || manifest.version!=='1.18.3')throw new Error('Unexpected manifest version');
if(manifest.host_permissions?.length || manifest.externally_connectable)throw new Error('Unexpected external access');
if(manifest.content_security_policy?.extension_pages?.includes('unsafe-eval'))throw new Error('Unsafe CSP');

function checkFile(base, name) {
  const file=resolve(base,name);
  const local=relative(root,file);
  if(local==='..' || local.startsWith('..'+sep) || isAbsolute(local) || !statSync(file,{throwIfNoEntry:false})?.isFile()){
    throw new Error('Missing or non-local reference: '+name+' (from '+relative(root,base)+')');
  }
}

function walk(dir) {
  for(const entry of readdirSync(dir,{withFileTypes:true})){
    const file=join(dir,entry.name);
    if(entry.isDirectory()){walk(file);continue;}
    if(!/\.(?:js|mjs|html)$/.test(entry.name))continue;
    const content=readFileSync(file,'utf8');
    if(/\b(?:eval|new Function)\s*\(/.test(content))throw new Error('Dynamic evaluation '+file);
    for(const match of content.matchAll(/\b(?:from\s*|import\s*)["'](\.[^"']+)["']/g)){
      checkFile(dirname(file),match[1]);
    }
    if(entry.name.endsWith('.html')){
      for(const match of content.matchAll(/<(?:script|link)\b[^>]*?\b(?:src|href)\s*=\s*["']([^"']+)["']/gi)){
        if(/^(?:[a-z]+:|\/\/)/i.test(match[1]))throw new Error('Remote resource '+file);
        checkFile(dirname(file),match[1]);
      }
    }
  }
}

for(const entry of [manifest.background.service_worker,manifest.action.default_popup,...Object.values(manifest.icons),
  'src/editor/editor.html','src/offscreen/offscreen.html','src/capture/selection.js',
  'src/capture/element-selection.js','src/capture/capture-recovery.js']){
  checkFile(root,entry);
}
walk(join(root,'src'));
console.log('PASS release structure, local imports and assets, permissions, and CSP checks');
