'use strict';
// Standard system cursor, no continuous requestAnimationFrame loops or scroll listeners.
(() => {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const wipe = document.querySelector('.page-wipe');
  const wipeKey = 'td-navigation-wipe';
  let entering = false;
  try { entering = sessionStorage.getItem(wipeKey) === 'yes'; sessionStorage.removeItem(wipeKey); } catch (_) {}
  if (entering && wipe && !reduced) {
    wipe.classList.add('is-entering');
    wipe.addEventListener('animationend', () => wipe.classList.remove('is-entering'), { once: true });
  }
  document.querySelectorAll('a[href]').forEach(a => {
    a.addEventListener('click', e => {
      if (reduced || !wipe || e.defaultPrevented || e.button !== 0 || e.ctrlKey || e.metaKey || e.altKey || e.shiftKey || a.target === '_blank' || a.hasAttribute('download')) return;
      const target = new URL(a.href, document.baseURI);
      if (target.origin !== location.origin || !/\.html$/i.test(target.pathname)) return;
      if (target.pathname === location.pathname && target.hash === location.hash) return;
      e.preventDefault();
      if (wipe.classList.contains('is-exiting')) return;
      wipe.classList.add('is-exiting');
      try { sessionStorage.setItem(wipeKey, 'yes'); } catch (_) {}
      const go = () => { location.href = target.href; };
      wipe.addEventListener('animationend', go, { once:true });
      setTimeout(go, 650);
    });
  });
  window.addEventListener('pageshow', e => { if(e.persisted && wipe){wipe.className='page-wipe';} });
  document.querySelectorAll('.segmented').forEach(group => {
    const buttons = [...group.querySelectorAll('[role=tab]')];
    const setActive = (chosen,focus=false) => {
      const panel = document.getElementById(chosen.dataset.tabTarget);
      if (!panel) return;
      for (const btn of buttons) {
        const active = btn === chosen;
        btn.classList.toggle('is-active', active);
        btn.setAttribute('aria-selected', String(active));
        btn.tabIndex = active ? 0 : -1;
        const p=document.getElementById(btn.dataset.tabTarget);
        if(p){p.hidden = !active;p.classList.toggle('is-active',active);}
      }
      group.classList.toggle('sound-selected',chosen.dataset.tabTarget === 'sound');
      if (focus) chosen.focus();
      document.querySelectorAll('audio').forEach(a => {if (!a.closest('.tab-panel.is-active')) a.pause();});
    };
    buttons.forEach((btn,index) => {
      btn.addEventListener('click',() => setActive(btn));
      btn.addEventListener('keydown',e=>{
        if(!['ArrowRight','ArrowLeft','Home','End'].includes(e.key))return;
        e.preventDefault();
        const next=e.key==='Home'?0:e.key==='End'?buttons.length-1:(index+(e.key==='ArrowRight'?1:-1)+buttons.length)%buttons.length;
        setActive(buttons[next],true);
      });
    });
  });
  // Existing media files are referenced but were not supplied in this chat.
  // Show readable placeholders until the original media folders are copied in.
  document.querySelectorAll('.project-video-frame video').forEach(video => {
    const parent=video.closest('.project-video-frame');
    const source=video.querySelector('source');
    if(!source)return;
    video.addEventListener('error',()=>parent.classList.add('is-missing'));
    source.addEventListener('error',()=>parent.classList.add('is-missing'));
    // Images can be missing in a standalone ZIP; browsers report the asset error.
  });
  document.querySelectorAll('.gallery-item img').forEach(img=>{
    img.addEventListener('error',()=>img.closest('.gallery-item').classList.add('is-missing'));
  });
  const dialog=document.querySelector('.image-dialog');
  if(dialog && typeof dialog.showModal === 'function') {
    const large=dialog.querySelector('img');
    document.querySelectorAll('.gallery-item').forEach(btn=>{
      btn.addEventListener('click',()=>{
        const img=btn.querySelector('img');
        if(!img || !img.complete || !img.naturalWidth)return;
        large.src=img.src;large.alt=img.alt;dialog.showModal();
      });
    });
    dialog.querySelector('.dialog-close')?.addEventListener('click',()=>dialog.close());
    dialog.addEventListener('click',e=>{if(e.target===dialog)dialog.close();});
  }
})();
