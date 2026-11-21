"use strict";
(() => {
  // The destination renders in a temporary viewport using its own HTML and media.
  // This works with file URLs without fetching or reading another document.
  const embedded = window.parent !== window;
  const home = url => /\/(index\.html)?$/.test(new URL(url).pathname);
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const picker = document.querySelector('.motion-choice');
  let preference = 'system';
  try { preference = localStorage.getItem('td-motion-choice') || 'system'; } catch (_) {}
  // Direct file previews can give each HTML file a separate storage area.
  const incoming = new URL(location.href).searchParams.get('motion');
  if (location.protocol === 'file:' && ['system','full','reduce'].includes(incoming)) preference = incoming;
  if (picker) picker.value = preference;
  const motion = { get matches() { return preference === 'reduce' || (preference !== 'full' && reduced.matches); } };
  function applyPreference() {
    document.documentElement.dataset.motion = motion.matches ? 'reduce' : 'full';
    if (location.protocol === 'file:') {
      for (const link of document.querySelectorAll('a[href]')) {
        const target = new URL(link.href);
        if (target.protocol !== 'file:' || target.pathname === location.pathname || !target.pathname.endsWith('.html')) continue;
        target.searchParams.set('motion', preference);
        link.href = target.href;
      }
    }
    const source = document.querySelector('.home-sky source');
    if (source) source.media = motion.matches ? 'all' : 'not all';
  }
  applyPreference();
  reduced.addEventListener('change', applyPreference);
  picker?.addEventListener('change', () => {
    preference = picker.value;
    try { localStorage.setItem('td-motion-choice', preference); } catch (_) {}
    applyPreference();
  });
  if (embedded) {
    document.documentElement.classList.add('slide-preview');
    requestAnimationFrame(() => parent.postMessage('td-page-painted', '*'));
  }
  let pending = null;
  function stopSlide() {
    if (!pending) return;
    clearTimeout(pending.readyTimer);
    clearTimeout(pending.finishTimer);
    pending.animations.forEach(animation => animation.cancel());
    pending.frame.remove();
    pending = null;
  }
  function enterSlide() {
    const slide = pending;
    if (!slide || slide.started) return;
    slide.started = true;
    clearTimeout(slide.readyTimer);
    const {frame, url, direction} = slide;
    const start = direction === 'open' ? '0,100%' : direction === 'return' ? '0,-100%' : '100%,0';
    const end = direction === 'open' ? '0,-18vh' : direction === 'return' ? '0,18vh' : '-18vw,0';
    const curve = {duration:550, easing:'cubic-bezier(.52,.02,.17,1)', fill:'both'};
    const commit = () => {
      if (pending !== slide || slide.committed) return;
      slide.committed = true;
      if (!window.name) window.name = 'td-painted';
      location.assign(url.href);
    };
    try {
      const page = frame.animate([{transform:'translate(' + start + ')'}, {transform:'translate(0,0)'}],curve);
      slide.animations.push(page);
      frame.style.visibility = 'visible';
      for (const region of document.querySelectorAll('body > header,body > main,body > footer')) {
        slide.animations.push(region.animate([{transform:'none',opacity:1},{transform:'translate(' + end + ')',opacity:.45}],curve));
      }
      page.onfinish = commit;
    } catch (_) {
      commit();
    } finally {
      slide.finishTimer = setTimeout(commit, 615);
    }
  }
  addEventListener('message', event => {
    if (pending && event.source === pending.frame.contentWindow && event.data === 'td-page-painted') enterSlide();
  });
  document.addEventListener('click', event => {
    const link = event.target.closest('a[href]');
    if (embedded || !link || event.defaultPrevented || event.button !== 0 || motion.matches ||
        event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || link.hasAttribute('download') ||
        (link.target && link.target !== '_self') || !Element.prototype.animate) return;
    const url = new URL(link.href);
    if (url.protocol !== location.protocol || (url.protocol !== 'file:' && url.origin !== location.origin) ||
        url.pathname === location.pathname || !url.pathname.endsWith('.html')) return;
    event.preventDefault();
    if (pending) return;
    const frame = document.createElement('iframe');
    frame.className = 'destination-slide';
    frame.tabIndex = -1;
    frame.inert = true;
    frame.title = 'Page transition';
    frame.setAttribute('aria-hidden','true');
    frame.src = url.href;
    pending = {frame, url, direction:home(url.href) ? 'return' : home(location.href) ? 'open' : 'next', animations:[]};
    frame.addEventListener('load',enterSlide,{once:true});
    // Slow or unavailable resources must never strand a navigation.
    pending.readyTimer = setTimeout(() => {
      // Frame embedding can be restricted by hosting settings; animate the real
      // current page before following its normal link in that case.
      const main = document.querySelector('main');
      main?.animate([{opacity:1,transform:'none'},{opacity:.25,transform:'translateY(-48px)'}],
        {duration:220, easing:'ease-in', fill:'both'});
      stopSlide();
      setTimeout(() => location.assign(url.href), 225);
    }, 1000);
    document.body.append(frame);
  });
  addEventListener('pagehide',stopSlide);
  addEventListener('pageshow', event => {
    if (embedded || motion.matches || !Element.prototype.animate) return;
    if (event.persisted || performance.getEntriesByType('navigation')[0]?.type === 'back_forward') {
      const offset = home(location.href) ? '-16vh' : '16vh';
      document.querySelector('main')?.animate([{transform:'translateY('+offset+')',opacity:.5},{transform:'none',opacity:1}],
        {duration:460,easing:'cubic-bezier(.2,.72,.22,1)'});
    }
  });

  // A quick tap remains visible after the pointer is released.
  document.addEventListener('click', event => {
    const control = event.target.closest('.material-tab,.transport,.volume,.primary-button,.gallery-item,.next-project a,.project-card,.float-card');
    if (!control || motion.matches || !control.animate) return;
    control.animate([{scale:'.955'},{scale:'1.018',offset:.65},{scale:'1'}],
      {duration:290,easing:'cubic-bezier(.22,.68,.3,1)'});
  });

  // One-time scroll reveals, each element visibly lifting rather than fading
  // imperceptibly. A group of five project cards cascades left to right.
  if (!embedded && !motion.matches && 'IntersectionObserver' in window) {
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
      if (viewport && !motion.matches) {
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
      if (!motion.matches && thumb.animate) {
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
      if (viewport && !motion.matches) {
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
      player.classList.toggle('muted', audio.muted);
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
    mute.onclick = () => { audio.muted = !audio.muted; };
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
})();
