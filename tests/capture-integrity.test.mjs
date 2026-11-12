import test from 'node:test';
import assert from 'node:assert/strict';
import {pageMetricsStable,totalCaptureBytes,MAX_CAPTURE_DATA_CHARS} from '../src/capture/capture-integrity.mjs';
import {validateComposeMessage} from '../src/shared/message-policy.mjs';

const stable={x:0,y:400,width:640,height:400,pageWidth:640,pageHeight:1200};
test('Stable full-page metrics are accepted after tile settles',()=>{
  assert.equal(pageMetricsStable({...stable},{...stable}),true);
  assert.equal(pageMetricsStable({...stable,y:401.5},{...stable}),true);
});
test('Scroll anchoring, dynamic height, changed viewport and sideways scroll fail instead of corrupting image',()=>{
  for(const change of [{y:404},{x:3},{height:399},{pageHeight:1230},{pageWidth:650}])
    assert.throws(()=>pageMetricsStable({...stable,...change},stable),/Seitenlayout/);
  assert.throws(()=>pageMetricsStable({...stable,x:NaN},stable),/Ungültige/);
});
test('Cumulative capture payload is bounded at the source and the composition boundary',()=>{
  assert.equal(totalCaptureBytes(MAX_CAPTURE_DATA_CHARS-4,4),MAX_CAPTURE_DATA_CHARS);
  assert.throws(()=>totalCaptureBytes(MAX_CAPTURE_DATA_CHARS-4,5),/Speicherlimit/);
  assert.throws(()=>totalCaptureBytes(0,NaN),/Speicherlimit/);
  const data='data:image/png;base64,AA==';
  assert.doesNotThrow(()=>validateComposeMessage({mode:'visible',width:10,height:10,viewport:{width:10,height:10},shots:[{x:0,y:0,data}]}));
});
