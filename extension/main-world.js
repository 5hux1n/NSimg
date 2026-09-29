(()=>{
  document.addEventListener('nsimg:insert-markdown',event=>{
    const {id,markdown}=event.detail||{};
    if(typeof id!=='string'||typeof markdown!=='string'||!markdown)return;
    let ok=false;
    try{
      const active=document.activeElement?.closest?.('.CodeMirror')?.CodeMirror;
      const visible=[...document.querySelectorAll('.CodeMirror')]
        .filter(el=>el.isConnected&&el.offsetParent!==null).map(el=>el.CodeMirror);
      const cm=[active,...visible,window.codemirrorInstance].find(editor=>
        editor&&typeof editor.replaceSelection==='function'&&
        (!editor.getWrapperElement||editor.getWrapperElement()?.isConnected));
      if(cm){
        cm.replaceSelection(markdown);
        cm.focus();
        ok=true;
      }
    }catch(_){/* The content script reports failure to the user. */}
    document.dispatchEvent(new CustomEvent('nsimg:insert-result',{detail:{id,ok}}));
  });
})();
