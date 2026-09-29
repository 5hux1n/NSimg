const KEY='nodeimage_apiKey',ENABLED='nodeimage_enabled',$=id=>document.getElementById(id);
let lastSaved='';
function message(t,type=''){const e=$('message');e.textContent=t;e.className=type;}
function keyUI(v){$('keyHint').textContent=v?'已配置':'未配置';$('keyHint').className=v?'ready':'';}
async function saveKey({quiet=false}={}){const v=$('key').value.trim();if(v===lastSaved)return; if(v){await chrome.storage.local.set({[KEY]:v});lastSaved=v;keyUI(true);if(!quiet)message('已自动保存','ok');}else{await chrome.storage.local.remove(KEY);lastSaved='';keyUI(false);if(!quiet)message('已清除');}}
async function load(){const o=await chrome.storage.local.get([KEY,ENABLED]);lastSaved=o[KEY]||'';$('key').value=lastSaved;$('enabled').checked=o[ENABLED]!==false;keyUI(Boolean(lastSaved));}
$('enabled').addEventListener('change',async e=>{await chrome.storage.local.set({[ENABLED]:e.target.checked});message(e.target.checked?'已启用':'已停止',e.target.checked?'ok':'');});
$('key').addEventListener('blur',()=>saveKey());
$('key').addEventListener('keydown',e=>{if(e.key==='Enter'){$('key').blur();}});
$('clear').addEventListener('click',async()=>{$('key').value='';await saveKey();});
$('refresh').addEventListener('click',async()=>{message('正在获取…');$('refresh').disabled=true;try{const r=await chrome.runtime.sendMessage({type:'NODEIMAGE_REFRESH_KEY'});if(r?.ok&&r.key){$('key').value=r.key;lastSaved=r.key;keyUI(true);message('已获取 API Key','ok');}else if(r?.authRequired){message('请先登录 NodeImage','err');}else message(`获取失败${r?.error?'：'+r.error:''}`,'err');}catch(e){message('获取失败：'+e.message,'err');}finally{$('refresh').disabled=false;}});
$('toggle').addEventListener('click',()=>{const i=$('key'),show=i.type==='password';i.type=show?'text':'password';$('toggle').classList.toggle('visible',show);$('toggle').title=show?'隐藏 API Key':'显示 API Key';$('toggle').setAttribute('aria-label',$('toggle').title);});
$('openNodeImage').addEventListener('click',()=>chrome.tabs.create({url:'https://www.nodeimage.com'}));
$('openGithub').addEventListener('click',()=>chrome.tabs.create({url:'https://github.com/5hux1n/nsimg'}));
window.addEventListener('beforeunload',()=>{const v=$('key').value.trim();if(v!==lastSaved){if(v)chrome.storage.local.set({[KEY]:v});else chrome.storage.local.remove(KEY);}});
load();
