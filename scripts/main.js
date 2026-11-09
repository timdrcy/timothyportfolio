"use strict";
/* Timothy Darcy portfolio: visible page slides, responsive interactions,
   accessible tabs/audio, and one-time reveals. No mouse tracking, canvas,
   scrolling timers, or permanent JavaScript animation loops. */
(() => {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const wipe = document.querySelector('.page-wipe');
  const motionDuration = 705;
  const storageKey = 'timothy-portfolio-next-page';
  const pageName = location.pathname.split('/').pop() || 'index.html';

  // Unlike cross-document CSS View Transitions, this also works when the user
  // opens index.html directly (file://) rather than running a local server.
  let destination = '';
  try {
    destination = sessionStorage.getItem(storageKey) || '';
    sessionStorage.removeItem(storageKey);
  } catch (_) { /* some file:// contexts restrict sessionStorage */ }
  if (!destination && window.name.startsWith('timothy-slide:')) {
    destination = window.name.slice('timothy-slide:'.length);
  }
  if (window.name.startsWith('timothy-slide:')) window.name = '';

  if (!reducedMotion && wipe && destination === pageName) {
    document.body.classList.add('is-arriving');
    wipe.classList.add('is-entering');
    const clearArrival = () => {
      wipe.classList.remove('is-entering');
      document.body.classList.remove('is-arriving');
    };
    wipe.addEventListener('animationend', clearArrival, { once: true });
    setTimeout(clearArrival, 1000);
  }

  let navigating = false;
  document.querySelectorAll('a[href]').forEach(link => {
    link.addEventListener('click', event => {
      if (navigating || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey ||
          event.shiftKey || event.altKey || link.hasAttribute('download') || link.target === '_blank') return;
      let target;
      try { target = new URL(link.href, document.baseURI); } catch (_) { return; }
      if (target.protocol !== location.protocol || target.host !== location.host ||
          !/\.html$/i.test(target.pathname)) return;
      // Section jumps on the current page still use native smooth scrolling.
      if (target.pathname === location.pathname && target.search === location.search) return;
      if (reducedMotion || !wipe) return;
      event.preventDefault();
      navigating = true;
      document.body.classList.add('is-departing');
      wipe.classList.remove('is-entering');
      wipe.classList.add('is-exiting');
      const targetPage = target.pathname.split('/').pop();
      try { sessionStorage.setItem(storageKey, targetPage); } catch (_) {}
      // window.name works across file:// documents when sessionStorage is not shared.
      window.name = `timothy-slide:${targetPage}`;
      let hasGone = false;
      const go = () => {
        if (hasGone) return;
        hasGone = true;
        location.assign(target.href);
      };
      wipe.addEventListener('animationend', go, { once: true });
      setTimeout(go, motionDuration + 60);
    });
  });

  window.addEventListener('pageshow', event => {
    if (!event.persisted) return;
    navigating = false;
    wipe?.classList.remove('is-exiting', 'is-entering');
    document.body.classList.remove('is-departing', 'is-arriving');
  });

  // One-time scroll reveals, each element visibly lifting rather than fading
  // imperceptibly. A group of five project cards cascades left to right.
  if (!reducedMotion && 'IntersectionObserver' in window) {
    const reveal = document.querySelectorAll(
      '.projects-section .section-heading, .project-card, .about-section .section-heading, .about-card, ' +
      '.project-info-grid .content-block, .screenshots-block, .sound-heading, .audio-track, .next-project'
    );
    document.documentElement.classList.add('motion-enabled');
    reveal.forEach((element, i) => {
      element.classList.add('reveal-item');
      if (element.matches('.project-card')) {
        const projectIndex = [...element.parentElement.children].indexOf(element);
        element.style.setProperty('--reveal-delay', `${Math.min(projectIndex, 5) * 95}ms`);
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

  // Slow, transform-only motion on hero project artwork. It begins after the
  // entrance animation, so the two animations cannot overwrite each other.
  if (!reducedMotion) setTimeout(() => {
    document.querySelectorAll('.hero-showcase .float-card').forEach(card => card.classList.add('is-bobbing'));
  }, 1150);

  // Lightweight tactile feedback at the actual pointer location.
  if (!reducedMotion) {
    document.addEventListener('pointerdown', event => {
      const element = event.target.closest('.project-card,.primary-button,.tab-button,.gallery-item,.float-card,.track-play');
      if (!element || !(event.pointerType === 'touch' || event.button === 0)) return;
      const rect = element.getBoundingClientRect();
      const ripple = document.createElement('span');
      ripple.className = 'tap-ripple';
      ripple.style.left = `${event.clientX - rect.left}px`;
      ripple.style.top = `${event.clientY - rect.top}px`;
      ripple.setAttribute('aria-hidden', 'true');
      element.append(ripple);
      ripple.addEventListener('animationend', () => ripple.remove(), { once: true });
      setTimeout(() => ripple.remove(), 800);
    }, { passive: true });
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
      if (viewport && !reducedMotion) {
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
      document.querySelectorAll('.audio-track audio').forEach(audio => {
        if (!audio.closest('.tab-panel.is-active')) audio.pause();
      });
      if (viewport && !reducedMotion) {
        const targetHeight = next.scrollHeight;
        requestAnimationFrame(() => { viewport.style.height = `${targetHeight}px`; });
        clearTimeout(heightTimer);
        heightTimer = setTimeout(() => {
          viewport.style.removeProperty('height');
          viewport.classList.remove('is-switching');
        }, 620);
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

  // Native controls remain usable for seeking/volume; the added preview button
  // provides obvious play feedback, pause state, and an animated equalizer.
  const audios = [...document.querySelectorAll('.audio-track audio')];
  audios.forEach(audio => {
    const track = audio.closest('.audio-track');
    const title = track?.querySelector('.track-title');
    if (!track || !title) return;
    const name = title.querySelector('strong')?.textContent?.trim() || 'audio';
    const status = document.createElement('span');
    status.className = 'track-status';
    status.setAttribute('aria-hidden', 'true');
    status.innerHTML = '<span class="sound-bars"><i></i><i></i><i></i></span> Playing';
    title.append(status);
    const play = document.createElement('button');
    play.type = 'button';
    play.className = 'track-play';
    play.innerHTML = '<span class="play-icon" aria-hidden="true">▶</span><span class="play-text">Play</span>';
    play.setAttribute('aria-label', `Play ${name}`);
    title.append(play);
    const refresh = () => {
      const playing = !audio.paused && !audio.ended;
      track.classList.toggle('is-playing', playing);
      play.querySelector('.play-icon').textContent = playing ? 'Ⅱ' : '▶';
      play.querySelector('.play-text').textContent = playing ? 'Pause' : 'Play';
      play.setAttribute('aria-label', `${playing ? 'Pause' : 'Play'} ${name}`);
      play.setAttribute('aria-pressed', String(playing));
    };
    play.addEventListener('click', () => {
      if (!audio.paused) { audio.pause(); return; }
      const result = audio.play();
      if (result && typeof result.catch === 'function') result.catch(() => {
        play.querySelector('.play-text').textContent = 'Not available';
        play.setAttribute('aria-label', `${name} audio file not available`);
        setTimeout(refresh, 1700);
      });
    });
    audio.addEventListener('play', () => {
      audios.forEach(other => { if (other !== audio) other.pause(); });
      refresh();
    });
    for (const event of ['pause', 'ended', 'error']) audio.addEventListener(event, refresh);
    refresh();
  });

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
