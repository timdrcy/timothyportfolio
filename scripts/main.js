"use strict";
(() => {
  const local = location.protocol === 'file:';
  const initial = location.pathname.split('/').pop() || 'index.html';
  let current = initial;
  let loading = false;
  let disposePage = () => {};
  const stages = [
    ['.banner-art:not(.project-panorama),.hero-showcase,.card-art',0],
    ['.art-heading h1,.banner-title h1,.hero-copy h1,.section-heading,.project-breadcrumb',55],
    ['.art-heading p,.banner-title p,.hero-role,.card-bottom,.about-copy',110],
    ['.project-lead,.primary-button,.project-info-grid > *',155]
  ];
  function liftContent() {
    for (const [selector, delay] of stages) {
      document.querySelectorAll(selector).forEach(node => {
        const rect = node.getBoundingClientRect();
        if (rect.height && rect.bottom > 0 && rect.top < innerHeight)
          node.animate([{translate:'0 32px',opacity:.35},{translate:'0 0',opacity:1}],
            {duration:360,delay,easing:'cubic-bezier(.2,.76,.22,1)',fill:'backwards'});
      });
    }
  }
  function address() {
    if (local && location.hash.startsWith('#/')) {
      const [page,anchor=''] = location.hash.slice(2).split('#');
      if (Object.hasOwn(portfolioPages,page)) return {page,anchor};
    }
    return {page:location.pathname.split('/').pop() || 'index.html',anchor:location.hash.slice(1)};
  }
  function show(page,anchor,y) {
    const data = portfolioPages[page];
    disposePage();
    document.querySelectorAll('audio,video').forEach(media => media.pause());
    document.body.className = data.classes;
    document.body.style.cssText = data.style;
    document.body.innerHTML = data.html;
    document.title = data.title;
    document.querySelector('meta[name="description"]').content = data.description;
    current = page;
    document.documentElement.classList.add('slide-landed');
    initializePage();
    const section = anchor && document.getElementById(anchor);
    window.scrollTo({top:y ?? (section ? section.getBoundingClientRect().top + scrollY - 24 : 0), behavior:'instant'});
    document.querySelector('main')?.setAttribute('tabindex','-1');
    document.querySelector('main')?.focus({preventScroll:true});
  }
  // Each bar fully covers its column before the content underneath is switched.
  async function brandHome(update) {
    const curtain = document.createElement('div');
    curtain.className = 'brand-curtain';
    curtain.setAttribute('aria-hidden','true');
    document.documentElement.append(curtain);
    try {
      const bars = Array.from({length:8},(_,index) => {
        const bar = document.createElement('i');
        bar.style.setProperty('--column',index);
        curtain.append(bar);
        return bar;
      });
      async function sweep(from,to) {
        await Promise.all(bars.map((bar,index) => bar.animate(
          [{transform:'translateY('+from+'%)'},{transform:'translateY('+to+'%)'}],
          {duration:290,delay:index*19,fill:'both',easing:'cubic-bezier(.48,.04,.2,1)'}
        ).finished));
      }
      await sweep(101,0);
      update();
      liftContent();
      await sweep(0,-101);
    } finally { curtain.remove(); }
  }
  let generation = 0;
  async function navigate(page,anchor,{brand=false,restore=false,y}={}) {
    const ticket = ++generation;
    loading = true;
    const update = () => {
      if (ticket !== generation) return;
      if (!restore) {
        history.replaceState({...history.state,y:scrollY},'');
        const hash = anchor ? '#' + anchor : '';
        const dest = local ? '#/' + page + hash : page + hash;
        if (page !== current || address().anchor !== anchor)
          history.pushState({y:null},'',dest);
      }
      show(page,anchor,y);
    };
    try {
      if (brand) await brandHome(update);
      else if (document.startViewTransition) {
        document.documentElement.dataset.travel = page === 'index.html' ? 'back' : 'forward';
        const transition = document.startViewTransition(update);
        await transition.ready.catch(() => {});
        if (ticket === generation) liftContent();
        await transition.finished;
      } else {
        const main = document.querySelector('main');
        await main.animate([{opacity:1,translate:'0 0'},{opacity:.25,translate:'0 -32px'}],{duration:160,fill:'both'}).finished;
        update();
        if (ticket === generation) liftContent();
      }
    } finally { if (ticket === generation) loading=false; }
  }
  history.scrollRestoration='manual';
  document.addEventListener('click',event => {
    const link = event.target.closest('a[href]');
    if (!link || event.defaultPrevented || event.button!==0 || event.ctrlKey || event.metaKey ||
        event.shiftKey || event.altKey || link.target || link.hasAttribute('download')) return;
    const url = new URL(link.href);
    if (url.protocol !== location.protocol || url.host !== location.host) return;
    const raw = link.getAttribute('href');
    const page = raw.startsWith('#') ? current : url.pathname.split('/').pop();
    if (!Object.hasOwn(portfolioPages,page)) return;
    event.preventDefault();
    if (loading) return;
    const anchor = raw.startsWith('#') ? raw.slice(1) : url.hash.slice(1);
    const brand = link.matches('.brand');
    if (!brand && page===current && anchor) {
      const section=document.getElementById(anchor);
      if (section) {
        history.replaceState({...history.state,y:scrollY},'');
        history.pushState({y:null},'',local?'#/'+page+'#'+anchor:page+'#'+anchor);
        section.scrollIntoView({behavior:'smooth'});
        return;
      }
    }
    navigate(page,anchor,{brand});
  });
  addEventListener('popstate',event => {
    const {page,anchor}=address();
    if (Object.hasOwn(portfolioPages,page)) navigate(page,anchor,{restore:true,y:event.state?.y});
  });
  // A quick tap remains visible after the pointer is released.
  document.addEventListener('click', event => {
    const control = event.target.closest('.material-tab,.transport,.volume,.primary-button,.gallery-item,.next-project a,.project-card,.float-card');
    if (!control || !control.animate) return;
    control.animate([{scale:'.955'},{scale:'1.018',offset:.65},{scale:'1'}],
      {duration:290,easing:'cubic-bezier(.22,.68,.3,1)'});
  });

  function initializePage() {
  // One-time scroll reveals, each element visibly lifting rather than fading
  // imperceptibly. A group of five project cards cascades left to right.
  if ('IntersectionObserver' in window) {
    const reveal = document.querySelectorAll(
      '.projects-section .section-heading, .project-card, .about-section .section-heading, .about-card, ' +
      '.project-info-grid .content-block, .screenshots-block, .sound-heading, .audio-track, .next-project'
    );
    document.documentElement.classList.add('motion-enabled');
    reveal.forEach((element, i) => {
      element.classList.add('reveal-item');
      if (document.documentElement.classList.contains('slide-landed')) {
        const bounds = element.getBoundingClientRect();
        if (bounds.height && bounds.bottom > 0 && bounds.top < innerHeight) element.classList.add('is-seen');
      }
      if (element.matches('.project-card')) {
        const projectIndex = [...element.parentElement.children].indexOf(element);
        element.style.setProperty('--reveal-delay', `${Math.min(projectIndex, 5) * 45}ms`);
      } else if (element.matches('.audio-track')) {
        const siblingIndex = [...element.parentElement.children].indexOf(element);
        element.style.setProperty('--reveal-delay', `${Math.min(siblingIndex, 4) * 60}ms`);
      }
    });
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-seen');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: .08, rootMargin: '0px 0px -6px 0px' });
    reveal.forEach(element => observer.observe(element));
    disposePage = () => observer.disconnect();
  }

  // A genuinely sliding segmented switch with content movement AND a smooth
  // height change when switching between the longer and shorter panels.
  document.querySelectorAll('.material-switch').forEach(group => {
    const buttons = [...group.querySelectorAll('[role="tab"]')];
    const viewport = group.closest('.project-main')?.querySelector('.tab-viewport');
    let heightTimer = 0;
    const activate = (chosen, focus = false) => {
      const id = chosen.dataset.tabTarget;
      const next = document.getElementById(id);
      if (!next || chosen.classList.contains('is-active')) return;
      const oldHeight = viewport?.getBoundingClientRect().height || 0;
      // Lock the previous height before changing hidden panels.
      if (viewport) {
        viewport.style.height = `${oldHeight}px`;
        viewport.classList.add('is-switching');
      }
      buttons.forEach(button => {
        const active = button === chosen;
        button.classList.toggle('is-active', active);
        button.setAttribute('aria-selected', String(active));
        button.tabIndex = active ? 0 : -1;
        const panel = document.getElementById(button.dataset.tabTarget);
        if (panel) {
          panel.hidden = !active;
          panel.classList.toggle('is-active', active);
        }
      });
      const thumb = group.querySelector('.material-indicator');
      const start = getComputedStyle(thumb).transform;
      thumb.getAnimations().forEach(animation => animation.cancel());
      group.dataset.selected = id;
      if (thumb.animate) {
        const end = id === 'sound' ? 'translateX(100%)' : 'translateX(0)';
        thumb.animate([{transform:start},{transform:end}], {
          duration:410, easing:'cubic-bezier(.22,.75,.2,1.06)'
        });
      }
      if (focus) chosen.focus();
      group.closest('main')?.querySelectorAll('video').forEach(video => {
        if (video.closest('[hidden]')) video.pause();
      });
      next.querySelectorAll('audio[preload="none"]').forEach(audio => { audio.preload = 'metadata'; });
      document.querySelectorAll('.audio-track audio').forEach(audio => {
        if (!audio.closest('.tab-panel.is-active')) audio.pause();
      });
      if (viewport) {
        const targetHeight = next.offsetHeight + parseFloat(getComputedStyle(viewport).paddingTop);
        requestAnimationFrame(() => { viewport.style.height = `${targetHeight}px`; });
        clearTimeout(heightTimer);
        heightTimer = setTimeout(() => {
          viewport.style.removeProperty('height');
          viewport.classList.remove('is-switching');
        }, 390);
      }
    };
    buttons.forEach((button, index) => {
      button.addEventListener('click', () => activate(button));
      button.addEventListener('keydown', event => {
        if (!['ArrowLeft','ArrowRight','Home','End'].includes(event.key)) return;
        event.preventDefault();
        const indexNext = event.key === 'Home' ? 0 : event.key === 'End' ? buttons.length-1 :
          (index + (event.key === 'ArrowRight' ? 1 : -1) + buttons.length) % buttons.length;
        activate(buttons[indexNext], true);
      });
    });
  });

  const audios = [...document.querySelectorAll('.audio-track audio')];
  const clock = seconds => Number.isFinite(seconds)
    ? Math.floor(seconds / 60) + ':' + String(Math.floor(seconds % 60)).padStart(2, '0') : '–:––';
  const icon = paths => '<svg aria-hidden="true" viewBox="0 0 24 24">' + paths + '</svg>';
  for (const audio of audios) {
    const track = audio.closest('.audio-track');
    const name = track.querySelector('strong').textContent;
    const player = document.createElement('div');
    player.className = 'audio-player';
    player.innerHTML = '<button type="button" class="transport">' +
      icon('<path class="play-shape" d="M8 5l11 7-11 7z"/><path class="pause-shape" d="M6 5h4v14H6zm8 0h4v14h-4z"/>') +
      '</button><input type="range" min="0" max="0" step="0.1" value="0" disabled>' +
      '<span class="time"></span><button type="button" class="volume">' +
      icon('<path d="M3 9h4l5-4v14l-5-4H3z"/><g fill="none" stroke="currentColor" stroke-width="1.6"><path class="waves" d="M15 8q4 4 0 8m3-11q7 7 0 14"/><path class="silent" d="m16 9 6 6m0-6-6 6"/></g>') +
      '</button>';
    const [play, mute] = player.querySelectorAll('button');
    const seek = player.querySelector('input');
    const level = document.createElement('input');
    level.type = 'range';
    level.className = 'volume-level';
    level.min = 0;
    level.max = 100;
    level.setAttribute('aria-label', 'Volume for ' + name);
    player.append(level);
    let lastVolume = 1;
    level.oninput = () => {
      const value = Number(level.value) / 100;
      audio.volume = value;
      audio.muted = value === 0;
      if (value) lastVolume = value;
    };
    const time = player.querySelector('.time');
    seek.setAttribute('aria-label', 'Seek ' + name);
    function update() {
      const duration = audio.duration;
      const valid = Number.isFinite(duration) && duration > 0;
      seek.disabled = !valid;
      seek.max = valid ? duration : 0;
      seek.value = audio.currentTime;
      seek.style.setProperty('--played', (valid ? audio.currentTime / duration * 100 : 0) + '%');
      seek.setAttribute('aria-valuetext', clock(audio.currentTime) + ' of ' + clock(duration));
      time.textContent = clock(audio.currentTime) + ' / ' + clock(duration);
      level.value = Math.round((audio.muted ? 0 : audio.volume)*100);
      level.setAttribute('aria-valuetext', level.value + '%');
      level.style.setProperty('--played',level.value+'%');
      player.classList.toggle('muted', audio.muted || audio.volume === 0);
      mute.setAttribute('aria-label', (audio.muted ? 'Unmute ' : 'Mute ') + name);
      track.classList.toggle('is-playing', !audio.paused && !audio.ended);
      play.setAttribute('aria-label', (audio.paused ? 'Play ' : 'Pause ') + name);
      if (audio.error) time.textContent = 'Unavailable';
    }
    play.onclick = async () => {
      if (!audio.paused) return audio.pause();
      try { await audio.play(); } catch (error) {
        if (error.name !== 'AbortError') time.textContent = 'Unavailable';
      }
    };
    mute.onclick = () => {
      if (!audio.volume) { audio.volume = lastVolume; audio.muted = false; }
      else audio.muted = !audio.muted;
    };
    seek.oninput = () => { if (!seek.disabled) audio.currentTime = Number(seek.value); };
    audio.addEventListener('play', () => audios.forEach(other => { if (other !== audio) other.pause(); }));
    for (const event of ['play','pause','ended','timeupdate','durationchange','volumechange','error']) {
      audio.addEventListener(event, update);
    }
    audio.after(player);
    audio.controls = false;
    update();
  }

  // Broken media references in the incomplete sample ZIP have helpful fallback
  // text; uploading the original audio/videos/screenshots restores them.
  document.querySelectorAll('.project-video-frame video').forEach(video => {
    const box = video.closest('.project-video-frame');
    video.addEventListener('error', () => box?.classList.add('is-missing'));
    video.querySelectorAll('source').forEach(source => {
      source.addEventListener('error', () => box?.classList.add('is-missing'));
    });
  });
  document.querySelectorAll('.gallery-item img').forEach(img => {
    img.addEventListener('error', () => img.closest('.gallery-item')?.classList.add('is-missing'));
  });

  const dialog = document.querySelector('.image-dialog');
  if (dialog && typeof dialog.showModal === 'function') {
    const expanded = dialog.querySelector('img');
    document.querySelectorAll('.gallery-item').forEach(button => {
      button.addEventListener('click', () => {
        const picture = button.querySelector('img');
        if (!picture?.complete || !picture.naturalWidth) return;
        expanded.src = picture.src;
        expanded.alt = picture.alt;
        dialog.showModal();
      });
    });
    dialog.querySelector('.dialog-close')?.addEventListener('click', () => dialog.close());
    dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
    dialog.addEventListener('close', () => expanded.removeAttribute('src'));
  }
  }
  const entry = address();
  if (entry.page !== initial) show(entry.page,entry.anchor,history.state?.y);
  else initializePage();
})();
