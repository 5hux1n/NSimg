const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const fullSource = fs.readFileSync(process.env.NSIMG_SOURCE || path.join(__dirname, '..', 'NSimg.user.js'), 'utf8');
const source = fullSource.split('const NSIMG_STYLE')[0];
function context(extra={}) {
  const values=new Map([['nodeimage_apiKey','test-key']]);
  const c=vm.createContext({
    setTimeout, clearTimeout, URL, FormData, Blob, File, Response,
    localStorage:{getItem:k=>values.get(k),setItem:(k,v)=>values.set(k,v)},
    fetch:()=>{throw new Error('unexpected page request')},
    ...extra
  });
  vm.runInContext(source,c);
  return {c,values};
}
const result={status:200,responseText:'{"success":true}'};
test('incidental legacy globals do not switch the v1.0.0 storage or request path', async()=>{
  const store=new Map();let requests=0;
  const {c,values}=context({
    GM_xmlhttpRequest:details=>{requests++;setTimeout(()=>details.onload(result),0);return {abort(){}}},
    GM_getValue:(k,fallback)=>store.get(k)??fallback,
    GM_setValue:(k,v)=>store.set(k,v),
    fetch:async()=>new Response('{"success":true}')
  });
  await c.setStoredKey('  saved-key  ');
  assert.equal(await c.getStoredKey(),'saved-key');
  assert.equal(values.get('nodeimage_apiKey'),'saved-key');
  assert.equal(store.size,0);
  assert.equal((await c.gmRequest({url:'https://api.nodeimage.com/api/v1/list'})).status,200);
  assert.equal(requests,0);
});
test('modern wrapper may resolve undefined before invoking callback',async()=>{
  const {c}=context({GM:{xmlHttpRequest:d=>{setTimeout(()=>d.onload(result),5);return Promise.resolve(undefined)}}});
  assert.equal((await c.gmRequest({url:'https://api.nodeimage.com/api/v1/list'})).data.success,true);
});
test('resolved control handle must not replace the eventual HTTP response',async()=>{
  const {c}=context({GM:{xmlHttpRequest:d=>{setTimeout(()=>d.onload(result),5);return Promise.resolve({abort(){}})}}});
  assert.equal((await c.gmRequest({url:'https://api.nodeimage.com/api/v1/list'})).status,200);
});
test('empty rejection is reported as a request error',async()=>{
  const {c}=context({GM:{xmlHttpRequest:()=>Promise.reject(undefined)}});
  await assert.rejects(c.gmRequest({url:'https://api.nodeimage.com/api/v1/list'}),/脚本管理器请求失败/);
});
test('upload preserves binary bytes and the previously working cookie policy',async()=>{
  const bytes=Uint8Array.from([0xff,0xd8,0xff,0xe0,0,0x80,0xff,0xd9]);
  let options,endpoint,requests=0;
  const {c}=context({fetch:async(url,init)=>{
    requests++;endpoint=url;options=init;
    return new Response(JSON.stringify({success:true,id:'fixture',links:{direct:'https://cdn.nodeimage.com/i/fixture.jpg'}}),{status:200});
  }});
  const output=await c.uploadImage(new File([bytes],'fixture.jpg',{type:'image/jpeg'}));
  assert.equal(endpoint,'https://api.nodeimage.com/api/upload');
  assert.equal(options.credentials,'omit');
  assert.equal(options.headers['Content-Type'],undefined);
  assert.deepEqual(new Uint8Array(await options.body.get('image').arrayBuffer()),bytes);
  assert.equal(output.markdown,'![fixture](https://cdn.nodeimage.com/i/fixture.jpg)');
  assert.equal(requests,1);
});
test('failed upload is not retried through a lossy GM body or allowed to clear the Key',async()=>{
  let requests=0,gmCalls=0;
  const {c,values}=context({
    GM:{xmlHttpRequest:()=>{gmCalls++;throw new Error('unexpected GM upload')}},
    fetch:async()=>{requests++;throw new TypeError('Load failed')}
  });
  await assert.rejects(c.uploadImage(new File(['image'],'fixture.jpg',{type:'image/jpeg'})),/Load failed/);
  assert.equal(requests,1);assert.equal(gmCalls,0);
  assert.equal(values.get('nodeimage_apiKey'),'test-key');
});

for (const status of [401,403]) {
  test(`HTTP ${status} from upload, gallery and session lookup never clears saved Key`,async()=>{
    const {c,values}=context({fetch:async()=>new Response('{"error":"rejected"}',{status})});
    await assert.rejects(c.uploadImage(new File(['image'],'fixture.jpg')),new RegExp(`HTTP ${status}`));
    assert.equal(values.get('nodeimage_apiKey'),'test-key');
    await assert.rejects(c.apiJson('https://api.nodeimage.com/api/v1/list'),new RegExp(`HTTP ${status}`));
    assert.equal(values.get('nodeimage_apiKey'),'test-key');
    assert.equal((await c.fetchApiKey()).ok,false);
    assert.equal(values.get('nodeimage_apiKey'),'test-key');
  });
}
function startup(c){
  const messages=[];
  Object.assign(c,{
    addStyle(){},bindEditor(){},replaceHeader(){},
    document:{documentElement:{}},MutationObserver:class{observe(){}},
    toast:message=>messages.push(message)
  });
  return {done:vm.runInContext(fullSource.slice(fullSource.lastIndexOf('(async()=>')),c),messages};
}
test('startup login rejection is quiet and preserves a saved Key',async()=>{
  const {c,values}=context({fetch:async()=>new Response('{}',{status:401})});
  const {done,messages}=startup(c);await done;
  assert.equal(messages.length,0);
  assert.equal(values.get('nodeimage_apiKey'),'test-key');
});
test('startup retains v1.0.0 session refresh even with a previously stored Key',async()=>{
  let requests=0;
  const {c,values}=context({fetch:async url=>{
    assert.equal(url,'https://api.nodeimage.com/api/user/api-key');requests++;
    return new Response('{"api_key":"refreshed-key"}');
  }});
  await startup(c).done;
  assert.equal(requests,1);assert.equal(values.get('nodeimage_apiKey'),'refreshed-key');
});
for(const manualValue of ['manual-key','']){
  test(`late auto-refresh cannot overwrite ${manualValue ? 'manual Save' : 'Clear Key'}`,async()=>{
    let finish;
    const {c,values}=context({fetch:()=>new Promise(resolve=>{finish=resolve})});
    const refresh=c.fetchApiKey();
    await c.setStoredKey(manualValue);
    finish(new Response('{"api_key":"late-key"}'));
    assert.equal((await refresh).superseded,true);
    assert.equal(values.get('nodeimage_apiKey'),manualValue);
  });
}
test('concurrent automatic key requests share one network request',async()=>{
  let finish,requests=0;
  const {c}=context({fetch:()=>{requests++;return new Promise(resolve=>{finish=resolve})}});
  const one=c.fetchApiKey(),two=c.fetchApiKey();
  finish(new Response('{"api_key":"fresh"}'));
  const results=await Promise.all([one,two]);
  assert.equal(requests,1);assert.ok(results.every(r=>r.ok&&r.key==='fresh'));
});
test('upload request matches the published v1.0.0 endpoint, options and file content',async()=>{
  // Fixture is the published v1.0.0 release asset, SHA-256 b05a61388ecc643428e024f96f0ae4a646de128a8a885addaebc879d8683fbee.
  const original=fs.readFileSync(path.join(__dirname,'fixtures','nsimg-v1.0.0.user.js'),'utf8').split('const NSIMG_STYLE')[0];
  const bytes=Uint8Array.from([0xff,0xd8,0,0x80,0xff,0xd9]);
  async function capture(script){
    let observed;
    const {c}=context({fetch:async(url,options)=>{
      const file=options.body.get('image');
      observed={url,method:options.method,headers:{...options.headers},credentials:options.credentials,
        mode:options.mode,cache:options.cache,fields:[...options.body.keys()],name:file.name,type:file.type,
        bytes:[...new Uint8Array(await file.arrayBuffer())]};
      return new Response('{"links":{"direct":"https://cdn.nodeimage.com/i/fixture.jpg"}}');
    }});
    // Separate realm avoids redeclaring the top-level constants.
    const originalContext=vm.createContext({...c});
    vm.runInContext(script,originalContext);
    await originalContext.uploadImage(new File([bytes],'fixture.jpg',{type:'image/jpeg'}));
    return observed;
  }
  assert.deepEqual(await capture(source),await capture(original));
});
