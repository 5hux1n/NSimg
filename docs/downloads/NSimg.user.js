// ==UserScript==
// @name         NSimg助手 JS
// @namespace    https://github.com/5hux1n/nsimg
// @version      1.0.2
// @description  为 NodeSeek 提供 NodeImage 图片上传与管理的跨平台 Userscript 版本
// @match        https://www.nodeseek.com/*
// @match        https://nodeseek.com/*
// @run-at       document-end
// @inject-into  content
// @grant        GM.getValue
// @grant        GM.setValue
// @grant        GM.deleteValue
// @grant        GM.xmlHttpRequest
// @grant        GM.openInTab
// ==/UserScript==
const NSIMG_API = {
  upload: 'https://api.nodeimage.com/api/upload',
  key: 'https://api.nodeimage.com/api/user/api-key',
  images: 'https://api.nodeimage.com/api/v1/list',
  delete: 'https://api.nodeimage.com/api/v1/delete/'
};
const NSIMG_KEY = 'nodeimage_apiKey';
const NSIMG_HAS_GM = typeof GM !== 'undefined';
let nsimgKeyRevision=0;
let nsimgKeyRefresh=null;

async function gmRequest(details) {
  const request=NSIMG_HAS_GM && typeof GM.xmlHttpRequest==='function' ? GM.xmlHttpRequest.bind(GM) : null;
  if (request) {
    const response = await new Promise((resolve, reject) => {
      let settled = false, handle;
      const finish = (error, value) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        if (error) reject(error); else resolve(value);
      };
      const timer = setTimeout(() => {
        finish(new Error('脚本管理器请求超时'));
        try{handle?.abort?.()}catch(_){}
      }, 32000);
      try {
        handle = request({
          timeout: 30000,
          ...details,
          onload: value => finish(null, value),
          onerror: () => finish(new Error('脚本管理器请求失败')),
          onabort: () => finish(new Error('脚本管理器请求已取消')),
          ontimeout: () => finish(new Error('脚本管理器请求超时'))
        });
        if (handle && typeof handle.then === 'function') {
          handle.then(value => {
            // Some managers resolve with a request handle before invoking onload.
            if (value && typeof value === 'object' && value.status != null) finish(null, value);
          }, error => finish(error instanceof Error ? error : new Error(String(error || '脚本管理器请求失败'))));
        }
      } catch (error) { finish(error); }
    });
    if (!response || typeof response !== 'object') throw new Error('脚本管理器未返回 HTTP 响应');
    const text = response.responseText ?? (typeof response.response === 'string' ? response.response : '');
    let data = null;
    try { data = text ? JSON.parse(text) : response.response; } catch (_) { data = response.response; }
    return { status: Number(response.status) || 0, text, data, response };
  }
  const response = await fetch(details.url, {
    method: details.method || 'GET',
    headers: details.headers || {},
    body: details.data ?? undefined,
    credentials: 'include',
    mode: 'cors',
    cache: 'no-store'
  });
  return parseFetchResponse(response);
}

async function parseFetchResponse(response){
  const text=await response.text(); let data=null;
  try{data=text?JSON.parse(text):null}catch(_){data=null}
  return {status:response.status,text,data,response};
}
async function safariMutation(url,{method='POST',headers={},data=null}={}){
  // Safari/Userscripts: mutations intentionally use native fetch with credentials
  // omitted. A Safari-compatible NodeImage userscript uses this path; unlike
  // GM.xmlHttpRequest it does not introduce the extension request context that
  // caused NodeImage POST/DELETE to return HTTP 500 on iOS.
  const response=await fetch(url,{method,headers,body:data,credentials:'omit',mode:'cors',cache:'no-store'});
  return parseFetchResponse(response);
}
async function getStoredKey(){
  if(NSIMG_HAS_GM && typeof GM.getValue === 'function') return String(await GM.getValue(NSIMG_KEY, '') || '').trim();
  return String(localStorage.getItem(NSIMG_KEY) || '').trim();
}
async function setStoredKey(key){
  nsimgKeyRevision++;
  const value=String(key || '').trim();
  if(NSIMG_HAS_GM && typeof GM.setValue === 'function') return GM.setValue(NSIMG_KEY, value);
  localStorage.setItem(NSIMG_KEY, value);
}
async function fetchApiKey(){
  if(nsimgKeyRefresh)return nsimgKeyRefresh;
  const task=refreshApiKey();
  nsimgKeyRefresh=task;
  try{return await task}finally{if(nsimgKeyRefresh===task)nsimgKeyRefresh=null}
}
async function refreshApiKey(){
  const revision=nsimgKeyRevision;
  const r = await gmRequest({ method:'GET', url:NSIMG_API.key, headers:{Accept:'application/json'} });
  if (r.status === 401 || r.status === 403) return {ok:false, authRequired:true, error:`HTTP ${r.status}`};
  if (r.status < 200 || r.status >= 300) return {ok:false, authRequired:false, error:(r.data?.error||r.data?.message||r.text||`HTTP ${r.status}`)};
  const key = String(r.data?.api_key || r.data?.apiKey || r.data?.key || '').trim();
  if (!key) return {ok:false, authRequired:Boolean(r.data?.logged_in===false||r.data?.authenticated===false), error:'未获取到 API Key'};
  // A late session response must not replace a Key the user just saved or cleared.
  if(revision!==nsimgKeyRevision)return {ok:false,superseded:true,error:'设置已更新，已忽略旧请求'};
  await setStoredKey(key); return {ok:true,key};
}
async function ensureKey(){ const k=await getStoredKey(); if(k)return k; const r=await fetchApiKey(); return r.ok?r.key:''; }
async function apiJson(url, options={}){
  const key=await ensureKey(); if(!key) throw new Error('NO_API_KEY');
  const method=(options.method||'GET').toUpperCase();
  const headers={Accept:'application/json','X-API-Key':key,...(options.headers||{})};
  // GET stays on the privileged Userscripts transport. Safari mutations use
  // native fetch; this is the same transport already verified for uploads.
  const r=(method==='GET')
    ? await gmRequest({method,url,headers,data:options.data})
    : await safariMutation(url,{method,headers,data:options.data});
  if(r.status===401||r.status===403){const e=new Error(`HTTP ${r.status}：${r.data?.error||r.data?.message||'接口拒绝了请求'}（已保留 API Key）`);e.status=r.status;throw e;}
  if(r.status<200||r.status>=300) throw new Error(r.data?.error||r.data?.message||r.text||`HTTP ${r.status}`);
  if(r.data?.success===false) throw new Error(r.data.error||r.data.message||'NodeImage 操作失败');
  return r.data ?? {};
}

async function uploadImage(file){
  const key=await ensureKey(); if(!key) throw new Error('NO_API_KEY');
  const form=new FormData();
  form.append('image',file,file.name||`image-${Date.now()}.jpg`);
  // Do not set Content-Type manually. Safari must generate the multipart boundary.
  const r=await safariMutation(NSIMG_API.upload,{
    method:'POST',
    headers:{Accept:'application/json','X-API-Key':key},
    data:form
  });
  if(r.status===401||r.status===403)throw new Error(`HTTP ${r.status}：${r.data?.error||r.data?.message||'上传请求被拒绝'}（已保留 API Key）`);
  if(r.status<200||r.status>=300) throw new Error(r.data?.error||r.data?.message||r.text||`HTTP ${r.status}`);
  if(r.data?.success===false) throw new Error(r.data.error||r.data.message||'NodeImage 上传失败');
  const links=r.data?.links||{};
  const url=String(links.direct||links.url||links.original||r.data?.url||r.data?.image_url||'').trim();
  let imageId=String(r.data?.id||r.data?.image_id||r.data?.imageId||r.data?.uuid||r.data?.key||'').trim();
  if(!imageId && url){
    try{
      const pathname=new URL(url,location.href).pathname;
      const m=pathname.match(/\/i\/([^/?#]+?)(?:\.[A-Za-z0-9]+)?$/);
      if(m) imageId=m[1];
    }catch(_){}
  }
  // Some NodeImage responses only expose links.markdown. Recover its URL when needed.
  let finalUrl=url;
  if(!finalUrl && links.markdown){
    const m=String(links.markdown).match(/\((https?:\/\/[^)]+)\)/);
    if(m) finalUrl=m[1];
  }
  if(!imageId && finalUrl){
    try{
      const pathname=new URL(finalUrl,location.href).pathname;
      const m=pathname.match(/\/i\/([^/?#]+?)(?:\.[A-Za-z0-9]+)?$/);
      if(m) imageId=m[1];
    }catch(_){}
  }
  if(!finalUrl) throw new Error(r.data?.error||r.data?.message||'NodeImage 未返回图片链接');
  const alt=imageId||String(file.name||'image').replace(/\.[^.]+$/,'')||'image';
  return {...links,url:finalUrl,id:imageId,markdown:`![${alt}](${finalUrl})`};
}



async function deleteImage(imageId) {
  const key = await ensureKey();
  if (!key) throw new Error('AUTH_REQUIRED');

  const response = await fetch(
    `https://api.nodeimage.com/api/v1/delete/${encodeURIComponent(imageId)}`,
    {
      method: 'DELETE',
      mode: 'cors',
      credentials: 'omit',
      cache: 'no-store',
      headers: {
        'Accept': 'application/json',
        'X-API-Key': key
      }
    }
  );

  const text = await response.text();
  let data = null;
  try { data = text ? JSON.parse(text) : {}; } catch (_) {}

  if (!response.ok || (data && data.success === false)) {
    const message = data?.error || data?.message || text || `HTTP ${response.status}`;
    throw new Error(message);
  }
  return data || { success: true };
}
const NSIMG_STYLE = `
:root{--ns-bg:var(--body-bg,#fff);--ns-card:var(--block-bg,#fff);--ns-text:var(--font-color,#24292f);--ns-muted:var(--font-secondary-color,#7a7f87);--ns-line:var(--border-color,#e7e9ec);--ns-soft:rgba(127,127,127,.09);--ns-accent:#2f6feb}
.nsimg-toast{position:fixed;left:50%;bottom:calc(18px + env(safe-area-inset-bottom));transform:translate(-50%,18px);z-index:2147483647;box-sizing:border-box;max-width:calc(100vw - 28px);min-height:42px;padding:9px 10px 9px 13px;border:1px solid var(--ns-line);border-radius:12px;background:var(--ns-card);color:var(--ns-text);box-shadow:0 8px 28px rgba(0,0,0,.14);font-size:14px;line-height:20px;opacity:0;pointer-events:none;transition:.18s;display:flex;align-items:center;gap:9px}.nsimg-toast.show{opacity:1;transform:translate(-50%,0);pointer-events:auto}.nsimg-toast>span{min-width:0;overflow-wrap:anywhere}.nsimg-toast button{flex:0 0 auto;white-space:nowrap;border:1px solid var(--ns-line);border-radius:8px;padding:5px 9px;background:var(--ns-soft);color:var(--ns-text);font:inherit;line-height:18px}
.nsimg-modal{position:fixed;inset:0;z-index:2147483646;display:none}.nsimg-modal.show{display:block}.nsimg-backdrop{position:absolute;inset:0;background:rgba(0,0,0,.28);backdrop-filter:blur(2px)}.nsimg-panel{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);box-sizing:border-box;width:min(760px,calc(100vw - 28px));height:min(82vh,760px);max-height:82vh;display:flex;flex-direction:column;background:var(--ns-card);color:var(--ns-text);border:1px solid var(--ns-line);border-radius:16px;overflow:hidden;box-shadow:0 18px 60px rgba(0,0,0,.18)}.nsimg-head{display:flex;justify-content:space-between;align-items:center;gap:12px;padding:14px 16px;border-bottom:1px solid var(--ns-line)}.nsimg-head strong{font-size:16px}.nsimg-head small{display:block;color:var(--ns-muted);margin-top:2px;font-size:12px}.nsimg-iconbtn{display:inline-grid;place-items:center;width:32px;height:32px;padding:0;border:1px solid var(--ns-line);border-radius:9px;background:var(--ns-soft);color:var(--ns-text)}.nsimg-iconbtn svg{width:16px;height:16px;display:block}.nsimg-body{flex:1 1 auto;min-height:0;padding:12px 14px calc(14px + env(safe-area-inset-bottom));overflow-y:auto;overscroll-behavior:contain;-webkit-overflow-scrolling:touch;touch-action:pan-y;max-height:calc(82vh - 62px);box-sizing:border-box}.nsimg-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:9px}.nsimg-card{position:relative;aspect-ratio:1;border:1px solid var(--ns-line);border-radius:11px;overflow:hidden;background:var(--ns-soft)}.nsimg-card>img{width:100%;height:100%;object-fit:cover;display:block}.nsimg-tools{position:absolute;right:5px;top:5px;display:flex;gap:4px}.nsimg-tool{display:grid;place-items:center;width:27px;height:27px;padding:0;border:1px solid rgba(255,255,255,.72);border-radius:8px;background:rgba(255,255,255,.9);color:#343a40;box-shadow:0 1px 5px rgba(0,0,0,.12)}.nsimg-tool svg{width:14px;height:14px;display:block}.nsimg-empty{text-align:center;padding:36px 10px;color:var(--ns-muted);overflow-wrap:anywhere}.nsimg-settings{display:grid;gap:13px}.nsimg-settings label{display:grid;gap:6px;font-size:13px;color:var(--ns-muted)}.nsimg-settings textarea{box-sizing:border-box;width:100%;font:16px/1.5 ui-monospace,SFMono-Regular,Menlo,monospace;resize:vertical;min-height:96px;overflow-wrap:anywhere;padding:10px 12px;border:1px solid var(--ns-line);border-radius:10px;background:var(--ns-bg);color:var(--ns-text);outline:none}.nsimg-actions{display:grid;grid-template-columns:1fr 1fr;gap:8px}.nsimg-actions button{min-height:42px;padding:9px 10px;border:1px solid var(--ns-line);border-radius:10px;background:var(--ns-soft);color:var(--ns-text);font:inherit}.nsimg-actions button[data-a=save]{background:var(--ns-text);color:var(--ns-card);border-color:transparent}.nsimg-note{font-size:12px;line-height:1.6;color:var(--ns-muted)}.nsimg-entry{display:inline-flex;align-items:center;gap:5px;border:0;background:transparent;color:inherit;padding:0;font:inherit}.nsimg-entry svg{width:15px;height:15px;display:block}
.nsimg-lightbox{position:fixed;inset:0;z-index:2147483647;background:rgba(0,0,0,.88);display:flex;align-items:center;justify-content:center;padding:calc(14px + env(safe-area-inset-top)) 14px calc(14px + env(safe-area-inset-bottom));box-sizing:border-box}.nsimg-lightbox img{display:block;max-width:100%;max-height:100%;object-fit:contain;border-radius:5px}.nsimg-lightbox button{position:absolute;right:calc(12px + env(safe-area-inset-right));top:calc(12px + env(safe-area-inset-top));width:38px;height:38px;border:0;border-radius:50%;background:rgba(255,255,255,.92);color:#222;display:grid;place-items:center}.nsimg-lightbox button svg{width:18px;height:18px;display:block;position:absolute;left:50%;top:50%;transform:translate(-50%,-50%)}
@media(max-width:600px){.nsimg-panel{left:8px;right:8px;bottom:calc(8px + env(safe-area-inset-bottom));top:auto;transform:none;width:auto;height:calc(88dvh - env(safe-area-inset-bottom) - 8px);max-height:88dvh;border-radius:17px}.nsimg-head{padding:13px 14px}.nsimg-body{max-height:calc(88dvh - 61px);padding:11px 12px 14px}.nsimg-grid{grid-template-columns:repeat(3,minmax(0,1fr));gap:7px}.nsimg-tool{width:25px;height:25px;border-radius:7px}.nsimg-tool svg{width:13px;height:13px}.nsimg-toast{bottom:calc(14px + env(safe-area-inset-bottom));font-size:13px}.nsimg-actions{grid-template-columns:1fr 1fr}}
.nsimg-head-actions{display:flex;align-items:center;gap:6px;flex:0 0 auto;margin-left:auto}
.nsimg-settings-modal .nsimg-panel{width:min(460px,calc(100vw - 28px));height:auto;max-height:82vh;max-height:82dvh}
.nsimg-settings-modal .nsimg-body{flex:0 1 auto;padding:16px}
.nsimg-settings{gap:10px}.nsimg-settings textarea:focus{border-color:var(--ns-accent);outline:2px solid var(--ns-soft);outline-offset:1px}
.nsimg-settings .nsimg-actions button{min-height:38px;padding:7px 12px;font-size:14px;cursor:pointer}
.nsimg-settings button:disabled{opacity:.5;cursor:default}
.nsimg-settings-modal .nsimg-head>div:first-child{min-width:0}
.nsimg-settings-modal .nsimg-settings-subtitle{display:flex;align-items:center;flex-wrap:wrap;gap:4px 10px}
.nsimg-settings-modal .nsimg-text-button{all:unset;box-sizing:border-box;display:inline-flex;align-items:center;min-height:28px;color:var(--ns-muted);font:12px/1.4 -apple-system,BlinkMacSystemFont,sans-serif;cursor:pointer;white-space:nowrap}
.nsimg-settings-modal .nsimg-text-button:hover{color:var(--ns-text)}
.nsimg-settings-modal .nsimg-key-label{display:flex;align-items:center;justify-content:space-between;gap:12px;min-width:0;font-size:13px;color:var(--ns-muted)}
.nsimg-settings-modal .nsimg-key-field{display:grid;gap:4px;min-width:0}
.nsimg-settings-modal .nsimg-settings-footer{all:unset;box-sizing:border-box;display:flex;justify-content:flex-end;min-width:0;max-width:100%;padding:8px 0 0;margin:2px 0 0;border-top:1px solid var(--ns-line);background:var(--ns-card);color:var(--ns-muted)}
.nsimg-settings-modal .nsimg-profile-links{all:unset;box-sizing:border-box;display:flex;justify-content:flex-end;align-items:center;flex-wrap:wrap;gap:4px 14px;min-width:0;max-width:100%}
.nsimg-settings-modal .nsimg-github{all:unset;box-sizing:border-box;display:inline-flex;align-items:center;gap:5px;min-height:32px;max-width:100%;color:var(--ns-muted);font:12px/1.4 -apple-system,BlinkMacSystemFont,sans-serif;cursor:pointer;white-space:nowrap}
.nsimg-settings-modal .nsimg-github:hover{color:var(--ns-text)}
.nsimg-settings-modal .nsimg-github svg{display:block;width:17px;height:17px;fill:currentColor;flex-shrink:0}
.nsimg-settings-modal .nsimg-github:focus-visible,.nsimg-settings-modal .nsimg-text-button:focus-visible{outline:2px solid var(--ns-accent);outline-offset:2px;border-radius:3px}
@media(max-width:600px){.nsimg-settings-modal .nsimg-panel{width:auto}.nsimg-settings-modal .nsimg-body{padding:14px}}
`;
const ICON={close:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>',eye:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z"/><circle cx="12" cy="12" r="2.6"/></svg>',trash:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M4 7h16M9 7V4h6v3M7 7l1 13h8l1-13M10 11v5M14 11v5"/></svg>',image:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="9" r="1.5"/><path d="m4 17 5-5 4 4 2-2 5 5"/></svg>'};
function addStyle(){const s=document.createElement('style');s.textContent=NSIMG_STYLE;document.documentElement.appendChild(s)}
let toastEl;
function toast(msg,action){if(!toastEl){toastEl=document.createElement('div');toastEl.className='nsimg-toast';document.body.appendChild(toastEl)}toastEl.replaceChildren();const t=document.createElement('span');t.textContent=msg;toastEl.appendChild(t);if(action){const b=document.createElement('button');b.textContent=action.label;b.onclick=action.onClick;toastEl.appendChild(b)}toastEl.classList.add('show');clearTimeout(toastEl._t);toastEl._t=setTimeout(()=>toastEl.classList.remove('show'),action?6000:2400)}
function openNodeImage(){try{if(NSIMG_HAS_GM&&typeof GM.openInTab==='function')return GM.openInTab('https://www.nodeimage.com',false)}catch(_){}window.open('https://www.nodeimage.com','_blank')}
let nsimgModalCount=0,nsimgScrollY=0;
function lockPage(){if(nsimgModalCount++>0)return;nsimgScrollY=window.scrollY||0;document.documentElement.style.overflow='hidden';document.body.style.position='fixed';document.body.style.top=`-${nsimgScrollY}px`;document.body.style.left='0';document.body.style.right='0';document.body.style.width='100%'}
function unlockPage(){if(--nsimgModalCount>0)return;nsimgModalCount=0;document.documentElement.style.overflow='';document.body.style.position='';document.body.style.top='';document.body.style.left='';document.body.style.right='';document.body.style.width='';window.scrollTo(0,nsimgScrollY)}
function modal(title,subtitle){lockPage();const r=document.createElement('div');r.className='nsimg-modal show';r.innerHTML=`<div class="nsimg-backdrop"></div><section class="nsimg-panel"><header class="nsimg-head"><div><strong>${title}</strong><small>${subtitle||''}</small></div><div class="nsimg-head-actions"><button class="nsimg-iconbtn" type="button" aria-label="关闭">${ICON.close}</button></div></header><div class="nsimg-body"></div></section>`;document.body.appendChild(r);const close=()=>{r.remove();unlockPage()};r.querySelector('.nsimg-backdrop').onclick=close;r.querySelector('.nsimg-head button').onclick=close;return{root:r,body:r.querySelector('.nsimg-body'),close}}
function lightbox(url){lockPage();const r=document.createElement('div');r.className='nsimg-lightbox';const img=document.createElement('img');img.src=url;img.alt='NodeImage 原图';const b=document.createElement('button');b.innerHTML=ICON.close;b.setAttribute('aria-label','关闭');r.append(img,b);const close=()=>{r.remove();unlockPage()};b.onclick=close;r.onclick=e=>{if(e.target===r)close()};document.body.appendChild(r)}
function showError(title,message){const m=modal(title,'可长按复制错误信息');const pre=document.createElement('pre');pre.className='nsimg-error';pre.textContent=String(message||'未知错误');pre.style.cssText='white-space:pre-wrap;word-break:break-word;margin:0;font-size:12px;line-height:1.55;user-select:text;-webkit-user-select:text';m.body.appendChild(pre);return m}
async function openSettings(){
  const m=modal('NSimg助手','NodeImage 设置 · 1.0.2');
  const key=await getStoredKey();
  m.root.classList.add('nsimg-settings-modal');
  const subtitle=m.root.querySelector('.nsimg-head small');
  subtitle.classList.add('nsimg-settings-subtitle');
  subtitle.innerHTML='<span>设置 · 1.0.2</span><button type="button" class="nsimg-text-button" data-a="login">打开 NodeImage ↗</button>';
  subtitle.querySelector('[data-a=login]').onclick=openNodeImage;
  m.body.innerHTML=`<div class="nsimg-settings"><div class="nsimg-key-field"><div class="nsimg-key-label"><span>API Key</span><button type="button" class="nsimg-text-button" data-a="clear">清除</button></div><textarea aria-label="API Key" rows="3" placeholder="粘贴 NodeImage API Key" autocomplete="off" autocapitalize="off" spellcheck="false"></textarea></div><div class="nsimg-actions"><button type="button" data-a="retry">获取 apikey</button><button type="button" data-a="save">保存</button></div><div class="nsimg-note">粘贴后点击保存。获取失败不会清除已保存的 Key。</div><div class="nsimg-settings-footer"><div class="nsimg-profile-links" role="navigation" aria-label="作者主页"><a class="nsimg-github" href="https://github.com/5hux1n/nsimg" target="_blank" rel="noopener noreferrer" title="GitHub · 5hux1n/nsimg" aria-label="打开 GitHub 项目"><svg viewBox="0 0 24 24" aria-hidden="true"><path fill-rule="evenodd" d="M12 2C6.48 2 2 6.58 2 12.23c0 4.52 2.87 8.35 6.84 9.7.5.1.68-.22.68-.49 0-.24-.01-1.05-.01-1.9-2.78.62-3.37-1.21-3.37-1.21-.45-1.18-1.11-1.49-1.11-1.49-.91-.64.07-.63.07-.63 1 .08 1.53 1.06 1.53 1.06.9 1.56 2.35 1.11 2.92.85.09-.66.35-1.11.64-1.37-2.22-.26-4.56-1.14-4.56-5.06 0-1.12.39-2.03 1.03-2.75-.1-.26-.45-1.3.1-2.71 0 0 .84-.28 2.75 1.05A9.35 9.35 0 0 1 12 6.94c.85 0 1.71.12 2.51.35 1.91-1.33 2.75-1.05 2.75-1.05.55 1.41.2 2.45.1 2.71.64.72 1.03 1.63 1.03 2.75 0 3.93-2.34 4.8-4.57 5.05.36.32.68.95.68 1.92 0 1.39-.01 2.5-.01 2.84 0 .27.18.59.69.49A10.23 10.23 0 0 0 22 12.23C22 6.58 17.52 2 12 2Z"/></svg><span>GitHub</span></a><a class="nsimg-github" href="https://www.nodeseek.com/space/6666" target="_blank" rel="noopener noreferrer" title="NodeSeek · 个人主页" aria-label="打开 NodeSeek 个人主页"><svg viewBox="0 0 128 128" aria-hidden="true"><g fill="none" stroke="#d2d2d2" stroke-width="8"><path d="M18 34C-2 57-2 73 18 96M35 34C8 54 8 76 35 96M110 34c20 23 20 39 0 62M93 34c27 20 27 42 0 62"/></g><circle cx="64" cy="64" r="35" fill="#0a0a0a"/><g fill="#fff"><rect x="49" y="51" width="8" height="17" rx="4"/><rect x="71" y="51" width="8" height="17" rx="4"/></g></svg><span>NodeSeek</span></a></div></div></div>`;
  const input=m.body.querySelector('textarea');input.value=key;
  const retry=m.body.querySelector('[data-a=retry]');
  retry.onclick=async()=>{
    retry.disabled=true;
    try{
      const r=await fetchApiKey();
      if(r.ok){input.value=r.key;toast('API Key 已获取')}
      else if(r.authRequired)toast('自动获取需要登录；已有 Key 可直接填写保存');
      else if(!r.superseded)toast('自动获取失败，已保留原 Key');
    }catch(_){toast('自动获取失败，已保留原 Key')}
    finally{retry.disabled=false}
  };
  m.body.querySelector('[data-a=save]').onclick=async()=>{
    try{await setStoredKey(input.value);toast('已保存');m.close()}
    catch(e){showError('保存失败',e.message||String(e))}
  };
  m.body.querySelector('[data-a=clear]').onclick=async()=>{
    try{await setStoredKey('');input.value='';toast('已清除 API Key')}
    catch(e){showError('保存失败',e.message||String(e))}
  };
}
const NSIMG_BRIDGE_CHANNEL='nsimg-editor-bridge-v1';
let nsimgBridgeReady=false;
function installEditorBridge(){
  if(nsimgBridgeReady)return; nsimgBridgeReady=true;
  const code=`(()=>{if(window.__NSIMG_EDITOR_BRIDGE__)return;window.__NSIMG_EDITOR_BRIDGE__=1;window.addEventListener('message',e=>{const d=e.data;if(e.source!==window||!d||d.channel!=='${NSIMG_BRIDGE_CHANNEL}'||d.type!=='insert')return;let ok=false;try{const cm=window.codemirrorInstance;if(cm&&typeof cm.replaceSelection==='function'){cm.replaceSelection(String(d.markdown||''));cm.focus();ok=true}}catch(_){}window.postMessage({channel:'${NSIMG_BRIDGE_CHANNEL}',type:'result',id:d.id,ok},'*')})})();`;
  const s=document.createElement('script');s.textContent=code;(document.head||document.documentElement).appendChild(s);s.remove();
}
function editorTextarea(){return document.querySelector('#editor-body .CodeMirror textarea, #code-mirror-editor .CodeMirror textarea, .CodeMirror textarea')}
function insertMarkdown(md){
  const raw=String(md||'').trim();
  const block=raw?`\n${raw}\n`:'';
  installEditorBridge();
  return new Promise(resolve=>{
    const id=`${Date.now()}-${Math.random()}`; let done=false;
    const finish=ok=>{if(done)return;done=true;window.removeEventListener('message',onMessage);clearTimeout(timer);resolve(ok)};
    const onMessage=e=>{const d=e.data;if(e.source===window&&d?.channel===NSIMG_BRIDGE_CHANNEL&&d?.type==='result'&&d.id===id)finish(Boolean(d.ok))};
    window.addEventListener('message',onMessage);
    window.postMessage({channel:NSIMG_BRIDGE_CHANNEL,type:'insert',id,markdown:block},'*');
    const timer=setTimeout(()=>{
      // Last-resort fallback for pages where inline bridge injection is blocked.
      const ta=editorTextarea(); if(!ta)return finish(false); ta.focus();
      try{const text=block;const a=ta.selectionStart||0,b=ta.selectionEnd||a;ta.setRangeText(text,a,b,'end');ta.dispatchEvent(new InputEvent('input',{bubbles:true,inputType:'insertText',data:text}));finish(true)}catch(_){finish(false)}
    },450);
  });
}
async function handleFiles(files){const imgs=[...files].filter(f=>(f.type||'').startsWith('image/'));if(!imgs.length)return;try{for(let i=0;i<imgs.length;i++){toast(imgs.length>1?`正在上传 ${i+1}/${imgs.length}…`:'正在上传…');const links=await uploadImage(imgs[i]);if(!(await insertMarkdown(links.markdown)))throw new Error('图片已上传，但未能插入编辑器；可在图库中找回链接')}toast('图片上传成功')}catch(e){if(e.message==='NO_API_KEY'||e.message==='AUTH_REQUIRED')toast('请配置 NodeImage API Key',{label:'设置',onClick:openSettings});else showError('上传失败',e.message||String(e))}}
function chooseImages(){const i=document.createElement('input');i.type='file';i.accept='image/*';i.multiple=true;i.onchange=()=>i.files?.length&&handleFiles(i.files);i.click()}
function bindEditor(){installEditorBridge();document.addEventListener('paste',e=>{const ta=editorTextarea();if(!ta||document.activeElement!==ta)return;const files=[...(e.clipboardData?.files||[])].filter(f=>(f.type||'').startsWith('image/'));if(files.length){e.preventDefault();handleFiles(files)}},true);document.addEventListener('click',e=>{const b=e.target.closest?.('.mde-toolbar .toolbar-item[title="图片"]');if(!b)return;e.preventDefault();e.stopImmediatePropagation();chooseImages()},true)}
function normalizeImages(data){let a=Array.isArray(data)?data:(data?.images||data?.data||data?.items||data?.results||[]);if(!Array.isArray(a))a=[];return a.map(x=>{const l=x?.links||{};const url=x?.url||x?.image_url||x?.imageUrl||x?.direct_url||x?.directUrl||l.direct||l.url||l.original||l.image||'';return{id:String(x?.id||x?.image_id||x?.imageId||x?.uuid||x?.key||''),url:String(url),thumb:String(x?.thumbnail_url||x?.thumbnailUrl||x?.thumb_url||x?.thumbUrl||l.thumbnail||l.thumb||url),markdown:String(url?`![${String(x?.filename||x?.file_name||x?.name||x?.id||x?.image_id||x?.imageId||x?.uuid||x?.key||'image')}](${url})`:(l.markdown||x?.markdown||''))}}).filter(x=>x.url||x.thumb)}
async function openGallery(){const m=modal('NodeImage 图片','点击缩略图插入编辑器');const settings=document.createElement('button');settings.type='button';settings.className='nsimg-iconbtn';settings.textContent='⚙';settings.title='设置 API Key';settings.setAttribute('aria-label','设置 API Key');settings.onclick=openSettings;m.root.querySelector('.nsimg-head button').before(settings);m.body.innerHTML='<div class="nsimg-empty">正在加载图片…</div>';try{const images=normalizeImages(await apiJson(NSIMG_API.images));if(!images.length){m.body.innerHTML='<div class="nsimg-empty">还没有上传图片</div>';return}m.body.replaceChildren();const g=document.createElement('div');g.className='nsimg-grid';m.body.appendChild(g);const PAGE=30;let cursor=0,loading=false;const renderMore=()=>{if(loading||cursor>=images.length)return;loading=true;const end=Math.min(cursor+PAGE,images.length);const frag=document.createDocumentFragment();for(;cursor<end;cursor++){const x=images[cursor];const c=document.createElement('div');c.className='nsimg-card';const im=document.createElement('img');im.src=x.thumb||x.url;im.loading='lazy';im.onclick=async()=>{if(await insertMarkdown(x.markdown)){toast('图片已插入');m.close()}else toast('未找到编辑器')};c.appendChild(im);const tools=document.createElement('div');tools.className='nsimg-tools';const v=document.createElement('button');v.className='nsimg-tool';v.innerHTML=ICON.eye;v.title='查看原图';v.onclick=e=>{e.stopPropagation();lightbox(x.url)};tools.appendChild(v);if(x.id){const d=document.createElement('button');d.className='nsimg-tool';d.innerHTML=ICON.trash;d.title='删除';d.onclick=async e=>{e.stopPropagation();if(!confirm('确定删除这张图片吗？'))return;try{await deleteImage(x.id);c.remove();toast('图片已删除')}catch(err){showError('删除失败',err.message||String(err))}};tools.appendChild(d)}c.appendChild(tools);frag.appendChild(c)}g.appendChild(frag);loading=false};renderMore();m.body.addEventListener('scroll',()=>{if(m.body.scrollTop+m.body.clientHeight>=m.body.scrollHeight-240)renderMore()},{passive:true})}catch(e){if(e.message==='NO_API_KEY'||e.message==='AUTH_REQUIRED'){m.close();toast('需要 NodeImage API Key',{label:'设置',onClick:openSettings})}else{m.body.replaceChildren();const error=document.createElement('div');error.className='nsimg-empty';error.textContent=`加载失败：${String(e.message||e)}`;m.body.appendChild(error)}}}
function replaceHeader(){const slot=document.querySelector('#editor-body .window_header a[href*="markdown"]')?.parentElement;if(!slot||(slot.dataset.nsimg==='1'&&slot.querySelector('.nsimg-entry')))return;if(!slot.dataset.nsimgOriginal)slot.dataset.nsimgOriginal=slot.innerHTML;slot.dataset.nsimg='1';slot.replaceChildren();const b=document.createElement('button');b.className='nsimg-entry';b.innerHTML=`${ICON.image}<span>图片</span>`;b.onclick=openGallery;slot.appendChild(b)}
(async()=>{'use strict';addStyle();bindEditor();const scan=()=>replaceHeader();scan();new MutationObserver(scan).observe(document.documentElement,{childList:true,subtree:true});await fetchApiKey().catch(()=>null);})();
