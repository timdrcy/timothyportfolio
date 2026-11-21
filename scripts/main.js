"use strict";
(() => {
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const root = document.documentElement;
  const home = url => /\/(?:index\.html)?$/.test(new URL(url).pathname);
  function direction(from, to, backward) {
    if (home(to)) return 'return';
    if (home(from)) return 'open';
    return backward ? 'previous' : 'next';
  }

  // Let the browser own history, scroll restoration and both page snapshots.
  function prepareSnapshot(event, arriving) {
    const transition = event.viewTransition;
    if (!transition) return;
    const activation = event.activation || window.navigation?.activation;
    if (!activation?.from?.url || !activation.entry?.url || motion.matches) {
      transition.skipTransition();
      return;
    }
    const { from, entry } = activation;
    root.dataset.route = direction(from.url, entry.url, activation.navigationType === 'traverse' && entry.index < from.index);
    const other = new URL(arriving ? from.url : entry.url);
    const artwork = document.body.classList.contains('home-page')
      ? [...document.querySelectorAll('.project-card, .float-card')].filter(link => {
          const rect = link.getBoundingClientRect();
          return new URL(link.href).pathname === other.pathname && rect.bottom > 0 && rect.top < innerHeight;
        }).sort((a,b) => Number(b === document.activeElement) - Number(a === document.activeElement))[0]?.querySelector('img')
      : document.querySelector('.banner-art img');
    const share = artwork?.naturalWidth && home(from.url) !== home(entry.url);
    if (share) artwork.style.viewTransitionName = 'game-art';
    transition.finished.finally(() => {
      if (share) artwork.style.removeProperty('view-transition-name');
      delete root.dataset.route;
    });
  }
  addEventListener('pageswap', event => prepareSnapshot(event, false));
  addEventListener('pagereveal', event => prepareSnapshot(event, true));

  // Use the same axes for direct file previews and browsers without page snapshots.
  if (location.protocol === 'file:' || !('onpagereveal' in window && 'onpageswap' in window)) {
    const offsets = { open:[0,1], return:[0,-1], next:[1,0], previous:[-1,0] };
    const prefix = 'portfolio-arrival/';
    let leaving = false;
    document.addEventListener('click', event => {
      const link = event.target.closest('a[href]');
      if (!link || event.defaultPrevented || event.button || event.ctrlKey || event.metaKey ||
          event.shiftKey || event.altKey || link.target || link.hasAttribute('download') || motion.matches) return;
      const target = new URL(link.href);
      if (target.host !== location.host || target.protocol !== location.protocol ||
          target.pathname === location.pathname || !target.pathname.endsWith('.html')) return;
      event.preventDefault();
      if (leaving) return;
      leaving = true;
      const route = direction(location.href, target.href, false);
      if (!window.name) window.name = prefix + route;
      const [x,y] = offsets[route];
      document.querySelector('main')?.animate([
        {transform:'none',opacity:1}, {transform:`translate(${-28*x}px,${-28*y}px)`,opacity:.52}
      ], {duration:165,fill:'forwards',easing:'ease-in'});
      setTimeout(() => location.assign(target.href), 165);
    });
    addEventListener('pageshow', event => {
      leaving = false;
      const main = document.querySelector('main');
      if (event.persisted) main?.getAnimations().forEach(animation => animation.cancel());
      const stored = window.name.startsWith(prefix) ? window.name.slice(prefix.length) : '';
      if (stored) window.name = '';
      if (motion.matches || !main) return;
      const [x,y] = offsets[stored] || (home(location.href) ? offsets.return : offsets.open);
      main.animate([{opacity:.6,transform:`translate(${40*x}px,${40*y}px)`},{opacity:1,transform:'none'}],
        {duration:340,easing:'cubic-bezier(.16,.8,.2,1)'});
    });
  }

  // One-time scroll reveals, each element visibly lifting rather than fading
  // imperceptibly. A group of five project cards cascades left to right.
  if (!motion.matches && 'IntersectionObserver' in window) {
    const reveal = document.querySelectorAll(
      '.projects-section .section-heading, .project-card, .about-section .section-heading, .about-card, ' +
      '.project-info-grid .content-block, .screenshots-block, .sound-heading, .audio-track, .next-project'
    );
    document.documentElement.classList.add('motion-enabled');
    reveal.forEach((element, i) => {
      element.classList.add('reveal-item');
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
  document.querySelectorAll('.segmented').forEach(group => {
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
      group.classList.toggle('sound-selected', id === 'sound');
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
