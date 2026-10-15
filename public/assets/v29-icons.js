
(()=>{
 const paths={leaf:'<path d="M20 4c-7 0-14 3-14 11a5 5 0 0 0 5 5c8 0 11-7 9-16Z"/><path d="M4 21c3-5 7-9 13-12"/>',book:'<path d="M12 7c-3-2-6-2-9-1v13c3-1 6-1 9 1 3-2 6-2 9-1V6c-3-1-6-1-9 1Z"/><path d="M12 7v13"/>',star:'<path d="m12 2 2.7 6.8L22 12l-7.3 3.2L12 22l-2.7-6.8L2 12l7.3-3.2Z"/>',mail:'<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>',camera:'<path d="M3 7h4l2-3h6l2 3h4v13H3Z"/><circle cx="12" cy="13" r="4"/>',pen:'<path d="m4 20 4.5-1 11-11a2.5 2.5 0 0 0-3.5-3.5l-11 11L4 20Z"/><path d="m14 6 4 4"/>'};
 const marks=[['.cat-new-title','book'],['.cat-edit-head h2','star'],['.about20 .b23-contact h2','mail'],['.about20 .b21-featured .section-heading h2','star']];
 function decorate(){for(const [sel,kind] of marks){document.querySelectorAll(sel).forEach(el=>{if(el.querySelector('.theme-inline-icon'))return;const span=document.createElement('span');span.className='theme-inline-icon';span.setAttribute('aria-hidden','true');span.innerHTML='<svg viewBox="0 0 24 24">'+paths[kind]+'</svg>';el.prepend(span)})}}
 document.addEventListener('DOMContentLoaded',()=>{decorate();const root=document.getElementById('app');if(root)new MutationObserver(decorate).observe(root,{childList:true,subtree:true})});
})();
