// =========================================
// INTERACTIONS, TRANSITIONS & TABS
// =========================================
document.addEventListener('DOMContentLoaded', () => {
    const cursor = document.querySelector('.custom-cursor');
    const hero = document.querySelector('.hero');
    const hiddenSections = document.querySelectorAll('.section-hidden');
    const navLinks = document.querySelectorAll('a[href^="#"]');
    const projectDetail = document.querySelector('.project-detail');

    let isTransitioning = false;

    // Fade in page
    requestAnimationFrame(() => {
        document.body.classList.add('page-loaded');
        // Project page content slide-up
        if (projectDetail) {
            setTimeout(() => {
                projectDetail.classList.add('is-visible');
            }, 80);
        }
    });

    // -----------------------------
    // Custom Cursor (optimized)
    // -----------------------------
    (function setupCustomCursor() {
        if (!cursor) return;

        const hasCoarsePointer = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
        if (hasCoarsePointer) {
            cursor.style.display = 'none';
            document.body.style.cursor = 'auto';
            return;
        }

        let mouseX = window.innerWidth / 2;
        let mouseY = window.innerHeight / 2;
        let cursorActive = false;

        function renderCursor() {
            cursor.style.left = `${mouseX}px`;
            cursor.style.top = `${mouseY}px`;
            requestAnimationFrame(renderCursor);
        }

        document.addEventListener('mousemove', (e) => {
            mouseX = e.clientX;
            mouseY = e.clientY;

            if (!cursorActive) {
                cursorActive = true;
                requestAnimationFrame(renderCursor);
            }
        });

        const hoverables = document.querySelectorAll('a, button, .project');
        hoverables.forEach(el => {
            el.addEventListener('mouseenter', () => cursor.classList.add('is-hovering'));
            el.addEventListener('mouseleave', () => cursor.classList.remove('is-hovering'));
        });
    })();

    // -----------------------------
    // Hero Entrance (home page)
    // -----------------------------
    if (hero) {
        requestAnimationFrame(() => {
            hero.classList.add('hero-visible');
        });
    }

    // -----------------------------
    // Section Scroll Reveal (home)
    // -----------------------------
    if ('IntersectionObserver' in window && hiddenSections.length > 0) {
        const observer = new IntersectionObserver(
            (entries, obs) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('section-visible');
                        obs.unobserve(entry.target);
                    }
                });
            },
            {
                threshold: 0.15
            }
        );

        hiddenSections.forEach(section => observer.observe(section));
    } else {
        hiddenSections.forEach(section => {
            section.classList.add('section-visible');
        });
    }

    // -----------------------------
    // Smooth Scroll for same-page anchors
    // (Home page: #about, #projects)
    // -----------------------------
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            const targetId = link.getAttribute('href');
            if (!targetId || !targetId.startsWith('#')) return;

            const target = document.querySelector(targetId);
            if (!target) return;

            e.preventDefault();

            const top = target.getBoundingClientRect().top + window.scrollY - 80;
            window.scrollTo({
                top,
                behavior: 'smooth'
            });
        });
    });

    // -----------------------------
    // Simple Fade Page Transition
    // (index <-> project pages)
    // -----------------------------
    function runPageFadeTransition(url) {
        if (isTransitioning || !url) return;
        isTransitioning = true;

        document.body.classList.remove('page-loaded'); // triggers opacity: 0

        setTimeout(() => {
            window.location.href = url;
        }, 300); // matches body transition 0.3s
    }

    // Any internal navigation (non-#, non-target=_blank)
    const pageLinks = document.querySelectorAll(
        'a[href]:not([href^="#"]):not([target="_blank"])'
    );

    pageLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            // Allow ctrl/cmd/shift/alt or middle-click to open in new tab
            if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;

            const href = link.getAttribute('href');
            if (!href) return;

            // Basic check: only fade for same-site relative links (.html etc.)
            if (href.startsWith('http')) {
                return; // external link, let browser handle
            }

            e.preventDefault();
            runPageFadeTransition(href);
        });
    });

    // Reset when page is shown from bfcache
    window.addEventListener('pageshow', () => {
        isTransitioning = false;
        document.body.classList.add('page-loaded');
        if (projectDetail) {
            projectDetail.classList.add('is-visible');
        }
    });

    // -----------------------------
    // Project Tabs (Technical / Sound)
    // -----------------------------
    (function setupProjectTabs() {
        const tabGroups = document.querySelectorAll('.project-tabs');
        if (!tabGroups.length) return;

        tabGroups.forEach(group => {
            const buttons = group.querySelectorAll('.tab-button');
            const panelsWrapper = group.nextElementSibling; // .tab-panels
            if (!panelsWrapper) return;

            const panels = panelsWrapper.querySelectorAll('.tab-panel');
            if (!buttons.length || !panels.length) return;

            function activate(button) {
                const targetId = button.getAttribute('data-tab-target');
                if (!targetId) return;

                // Deactivate all buttons + panels in this group
                buttons.forEach(btn => btn.classList.remove('is-active'));
                panels.forEach(panel => panel.classList.remove('is-active'));

                // Activate selected
                button.classList.add('is-active');
                const panel = panelsWrapper.querySelector(`#${targetId}`);
                if (panel) {
                    panel.classList.add('is-active');
                }
            }

            // Click handlers
            buttons.forEach(button => {
                button.addEventListener('click', () => {
                    if (button.classList.contains('is-active')) return;
                    activate(button);
                });
            });
        });
    })();

    // -----------------------------
    // Image Lightbox for galleries
    // -----------------------------
    (function setupImageLightbox() {
        const galleryImages = document.querySelectorAll('.project-gallery img');
        if (!galleryImages.length) return;

        const overlay = document.createElement('div');
        overlay.className = 'image-lightbox-overlay';
        overlay.innerHTML = `
            <div class="image-lightbox-inner">
                <button class="image-lightbox-close" aria-label="Close image">&times;</button>
                <img class="image-lightbox-img" src="" alt="">
            </div>
        `;
        document.body.appendChild(overlay);

        const overlayImg = overlay.querySelector('.image-lightbox-img');
        const closeBtn = overlay.querySelector('.image-lightbox-close');

        function openLightbox(img) {
            if (!img) return;
            overlayImg.src = img.src;
            overlayImg.alt = img.alt || '';
            overlay.classList.add('is-open');
            document.body.classList.add('image-lightbox-open');
        }

        function closeLightbox() {
            overlay.classList.remove('is-open');
            document.body.classList.remove('image-lightbox-open');

            // Clear image after fade-out to avoid flash on reopen
            setTimeout(() => {
                overlayImg.src = '';
                overlayImg.alt = '';
            }, 200);
        }

        galleryImages.forEach(image => {
            image.style.cursor = 'pointer';
            image.addEventListener('click', (e) => {
                e.preventDefault();
                openLightbox(image);
            });
        });

        closeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            closeLightbox();
        });

        // Close when clicking on the dark background
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                closeLightbox();
            }
        });

        // Close on Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && overlay.classList.contains('is-open')) {
                closeLightbox();
            }
        });
    })();

    // -----------------------------
    // Pause background animation while scrolling (home)
    // -----------------------------
    let scrollTimeout;
    window.addEventListener(
        'scroll',
        () => {
            document.body.classList.add('is-scrolling');
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(() => {
                document.body.classList.remove('is-scrolling');
            }, 150);
        },
        { passive: true }
    );
});
