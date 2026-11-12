import {readFileSync,readdirSync,statSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=resolve(fileURLToPath(new URL('..',import.meta.url)));
const manifest=JSON.parse(readFileSync(join(root,'manifest.json')));
if(manifest.manifest_version!==3 || manifest.version!=='1.12.0')throw new Error('Unexpected manifest version');
if(manifest.host_permissions?.length || manifest.externally_connectable)throw new Error('Unexpected external access');
if(manifest.content_security_policy?.extension_pages?.includes('unsafe-eval'))throw new Error('Unsafe CSP');
function walk(dir){for(const entry of readdirSync(dir,{withFileTypes:true})){
 const path=join(dir,entry.name);
 if(entry.isDirectory())walk(path);
 else if(/\.(?:js|mjs|html)$/.test(entry.name)){
  const content=readFileSync(path,'utf8');
  if(/<script\b[^>]*\bsrc\s*=\s*["']https?:/i.test(content))throw new Error('Remote script '+path);
  if(/\b(?:eval|new Function)\s*\(/.test(content) && !path.includes('/tests/'))throw new Error('Dynamic evaluation '+path);
 }
}}
walk(root);
for(const entry of [manifest.background.service_worker,manifest.action.default_popup,'editor.html','offscreen.html','message-policy.mjs'])
 if(!statSync(join(root,entry)).isFile())throw new Error('Missing '+entry);
console.log('PASS release structure, minimum permissions, no remote scripts or dynamic evaluation');
