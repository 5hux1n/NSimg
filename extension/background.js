const API_UPLOAD = 'https://api.nodeimage.com/api/upload';
const API_KEY_URL = 'https://api.nodeimage.com/api/user/api-key';
const API_IMAGES = 'https://api.nodeimage.com/api/v1/list';
const API_IMAGE = 'https://api.nodeimage.com/api/v1/delete/';
const KEY = 'nodeimage_apiKey';
const ENABLED = 'nodeimage_enabled';
// LOCKED UPLOAD TRANSPORT: Service Worker -> DNR removes Origin/Referer -> /api/upload.
// 已在 v1.7.0 实机验证成功，除非 NodeImage API 发生变化，不修改此上传链路。

async function installNetworkRules() {
  const own = chrome.runtime.id;
  try {
    await chrome.declarativeNetRequest.updateDynamicRules({
      removeRuleIds: [1701, 1702, 1703, 1704],
      addRules: [
        {id:1701,priority:1,action:{type:'modifyHeaders',requestHeaders:[{header:'Origin',operation:'remove'},{header:'Referer',operation:'remove'}]},condition:{regexFilter:'^https://api\\.nodeimage\\.com/api/upload(?:\\?.*)?$',resourceTypes:['xmlhttprequest'],initiatorDomains:[own]}},
        {id:1702,priority:1,action:{type:'modifyHeaders',requestHeaders:[{header:'Origin',operation:'remove'},{header:'Referer',operation:'remove'}]},condition:{regexFilter:'^https://api\\.nodeimage\\.com/api/user/api-key(?:\\?.*)?$',resourceTypes:['xmlhttprequest'],initiatorDomains:[own]}},
        {id:1703,priority:1,action:{type:'modifyHeaders',requestHeaders:[{header:'Origin',operation:'remove'},{header:'Referer',operation:'remove'}]},condition:{regexFilter:'^https://api\\.nodeimage\\.com/api/v1/list(?:\\?.*)?$',resourceTypes:['xmlhttprequest'],initiatorDomains:[own]}},
        {id:1704,priority:1,action:{type:'modifyHeaders',requestHeaders:[{header:'Origin',operation:'remove'},{header:'Referer',operation:'remove'}]},condition:{regexFilter:'^https://api\\.nodeimage\\.com/api/v1/delete/[^/?]+(?:\\?.*)?$',resourceTypes:['xmlhttprequest'],initiatorDomains:[own]}}
      ]
    });
  } catch (e) { console.warn('[NodeImage] 网络兼容规则安装失败', e); }
}
chrome.runtime.onInstalled.addListener(async()=>{await installNetworkRules(); const o=await chrome.storage.local.get(KEY); if(!o[KEY]) await autoGetApiKey();});
chrome.runtime.onStartup.addListener(async()=>{await installNetworkRules(); const o=await chrome.storage.local.get(KEY); if(!o[KEY]) await autoGetApiKey();});
installNetworkRules();

function decodeBase64(base64){const binary=atob(base64),bytes=new Uint8Array(binary.length);for(let i=0;i<binary.length;i++)bytes[i]=binary.charCodeAt(i);return bytes;}
function sniffImage(b){if(b.length>=8&&b[0]===0x89&&b[1]===0x50&&b[2]===0x4e&&b[3]===0x47&&b[4]===0x0d&&b[5]===0x0a&&b[6]===0x1a&&b[7]===0x0a)return{mime:'image/png',ext:'png'};if(b.length>=3&&b[0]===0xff&&b[1]===0xd8&&b[2]===0xff)return{mime:'image/jpeg',ext:'jpg'};if(b.length>=6&&String.fromCharCode(...b.slice(0,6)).startsWith('GIF8'))return{mime:'image/gif',ext:'gif'};if(b.length>=12&&String.fromCharCode(...b.slice(0,4))==='RIFF'&&String.fromCharCode(...b.slice(8,12))==='WEBP')return{mime:'image/webp',ext:'webp'};if(b.length>=2&&b[0]===0x42&&b[1]===0x4d)return{mime:'image/bmp',ext:'bmp'};return null;}
async function parseResponse(r){const text=await r.text();let data=null;try{data=text?JSON.parse(text):null}catch(_){}return{text,data};}
async function autoGetApiKey(){try{const r=await fetch(API_KEY_URL,{method:'GET',headers:{Accept:'application/json'},credentials:'include',cache:'no-store'});const{data}=await parseResponse(r);if(!r.ok||!data)return{ok:false,error:`HTTP ${r.status}`,status:r.status,authRequired:r.status===401||r.status===403};const key=String(data.api_key||data.apiKey||data.key||'').trim();if(!key)return{ok:false,error:data.error||data.message||'当前登录状态未返回 API Key',authRequired:Boolean(data&&(data.logged_in===false||data.authenticated===false))};await chrome.storage.local.set({[KEY]:key});return{ok:true,key};}catch(e){return{ok:false,error:e?.message||String(e),authRequired:false};}}
async function getKey(){const s=await chrome.storage.local.get(KEY);let key=String(s[KEY]||'').trim();if(!key){const got=await autoGetApiKey();if(got.ok)key=got.key;else{const e=new Error(got.error||'未获取到 API Key');e.authRequired=got.authRequired;throw e;}}return key;}
async function apiJson(url,options={}){const key=await getKey();const r=await fetch(url,{...options,headers:{Accept:'application/json','X-API-Key':key,...(options.headers||{})},credentials:'include',cache:'no-store'});const{text,data}=await parseResponse(r);if(!r.ok){const e=new Error((data&&(data.error||data.message||data.detail))||text||`HTTP ${r.status}`);e.status=r.status;throw e;}if(data?.success===false)throw new Error(data.error||data.message||'NodeImage 操作失败');return data??{};}
async function doUpload(message,apiKey){if(!message.base64)throw new Error('没有收到图片数据');const bytes=decodeBase64(message.base64);if(!bytes.length)throw new Error('图片数据为空');const detected=sniffImage(bytes);if(!detected)throw new Error(`无法识别真实图片格式（${bytes.length} bytes）`);const original=String(message.name||'clipboard').trim()||'clipboard';const base=original.replace(/\.[^.]+$/,'').replace(/[^a-zA-Z0-9._-]+/g,'_')||'clipboard';const blob=new Blob([bytes],{type:detected.mime});const form=new FormData();form.append('image',blob,`${base}.${detected.ext}`);const r=await fetch(API_UPLOAD,{method:'POST',headers:{Accept:'application/json','X-API-Key':apiKey},credentials:'include',body:form});const{text,data}=await parseResponse(r);if(!r.ok){const detail=data&&(data.error||data.message||data.detail);const err=new Error(`HTTP ${r.status}${detail||text?`：${detail||text}`:''}`);err.status=r.status;throw err;}if(!data)throw new Error(`NodeImage 返回了非 JSON 响应：${text||'(空响应)'}`);if(data.success===false)throw new Error(data.error||data.message||'NodeImage 上传失败');return data;}
async function uploadWithAuth(message){let stored=await chrome.storage.local.get(KEY);let key=String(stored[KEY]||'').trim();if(!key){const got=await autoGetApiKey();key=got.ok?got.key:'';}if(!key)throw new Error('未获取到 API Key，请打开扩展设置自动获取或手动填写');try{return await doUpload(message,key)}catch(e){if(e.status===401||/invalid api key|无效.*密钥/i.test(e.message||'')){const got=await autoGetApiKey();if(got.ok)return await doUpload(message,got.key);}throw e;}}
async function updateAction(){const o=await chrome.storage.local.get(ENABLED),on=o[ENABLED]!==false;await chrome.action.setBadgeText({text:on?'':'OFF'});if(!on)await chrome.action.setBadgeBackgroundColor({color:'#777777'});}
chrome.storage.onChanged.addListener((c,a)=>{if(a==='local'&&c[ENABLED])updateAction();});updateAction();
chrome.runtime.onMessage.addListener((m,s,sendResponse)=>{if(!m||!['NODEIMAGE_UPLOAD','NODEIMAGE_REFRESH_KEY','NODEIMAGE_GET_STATUS','NODEIMAGE_LIST','NODEIMAGE_DELETE'].includes(m.type))return;(async()=>{try{const settings=await chrome.storage.local.get([KEY,ENABLED]);if(m.type==='NODEIMAGE_GET_STATUS'){sendResponse({ok:true,enabled:settings[ENABLED]!==false,hasKey:Boolean(settings[KEY])});return;}if(settings[ENABLED]===false)throw new Error('扩展当前已停止');if(m.type==='NODEIMAGE_REFRESH_KEY'){sendResponse(await autoGetApiKey());return;}if(m.type==='NODEIMAGE_LIST'){sendResponse({ok:true,data:await apiJson(API_IMAGES)});return;}if(m.type==='NODEIMAGE_DELETE'){if(!m.id)throw new Error('缺少图片 ID');sendResponse({ok:true,data:await apiJson(API_IMAGE+encodeURIComponent(m.id),{method:'DELETE'})});return;}sendResponse({ok:true,data:await uploadWithAuth(m)});}catch(e){sendResponse({ok:false,error:e?.message||String(e),authRequired:Boolean(e?.authRequired||e?.status===401||e?.status===403)});}})();return true;});
