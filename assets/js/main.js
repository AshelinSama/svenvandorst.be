/* Studio Sven Van Dorst — interactions (no dependencies) */
(() => {
  'use strict';

  const root = document.documentElement;
  const body = document.body;
  const motionOK = window.matchMedia('(prefers-reduced-motion: no-preference)').matches;
  window.SVD = true;

  const ICON = {
    close: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>',
    next: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 12h17M14 6l6 6-6 6"/></svg>',
    zoomIn: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.5 15.5 20 20M10.5 7.5v6M7.5 10.5h6"/></svg>',
    zoomOut: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.5 15.5 20 20M7.5 10.5h6"/></svg>',
  };

  // Resolves once the images inside el have loaded (or failed), but waits at most `max` ms.
  // Used so an animation reveals the actual picture instead of an empty frame that the
  // photo then pops into a moment later (very visible on phones).
  const imagesReady = (el, max = 2500) => {
    const pending = [...el.querySelectorAll('img')].filter((i) => !i.complete);
    if (!pending.length) return Promise.resolve();
    const loads = pending.map((i) => new Promise((done) => {
      i.addEventListener('load', () => (i.decode ? i.decode().catch(() => {}) : Promise.resolve()).then(done), { once: true });
      i.addEventListener('error', done, { once: true });
      i.loading = 'eager';   // about to be shown: start loading now
    }));
    return Promise.race([Promise.all(loads), new Promise((r) => setTimeout(r, max))]);
  };

  /* ---------- Homepage opening: wait for the fonts and the painting, allow skipping ---------- */
  if (root.classList.contains('intro-wait')) {
    const fonts = document.fonts ? document.fonts.ready : Promise.resolve();
    const painting = document.querySelector('.hero__media');
    Promise.race([Promise.all([fonts, painting ? imagesReady(painting) : null]), new Promise((r) => setTimeout(r, 2500))])
      .then(() => root.classList.remove('intro-wait'));
  }
  if (root.classList.contains('intro-full')) {
    const skip = () => root.classList.add('intro-skip');
    ['pointerdown', 'keydown', 'wheel', 'touchstart'].forEach((type) =>
      window.addEventListener(type, skip, { once: true, passive: true }));
  }

  /* ---------- Header: solid after the hero, hides on scroll down ---------- */
  const header = document.querySelector('.site-header');
  const hero = document.querySelector('.hero');
  const heroMedia = hero && hero.querySelector('.hero__media');
  const heroTitle = hero && hero.querySelector('.hero__title');
  let lastY = window.scrollY;
  let ticking = false;

  const onScroll = () => {
    const y = window.scrollY;
    const solidAt = hero ? hero.offsetHeight - header.offsetHeight : 4;
    header.classList.toggle('is-scrolled', y > solidAt);

    if (!body.classList.contains('nav-open')) {
      if (y > lastY + 4 && y > 260) header.classList.add('is-hidden');
      else if (y < lastY - 4 || y <= 260) header.classList.remove('is-hidden');
    }
    lastY = y;

    if (hero && motionOK && y <= hero.offsetHeight) {
      heroMedia.style.transform = `translate3d(0, ${y * 0.32}px, 0)`;
      heroTitle.style.transform = `translate3d(0, ${y * 0.5}px, 0)`;
      heroTitle.style.opacity = String(Math.max(0, 1 - y / (hero.offsetHeight * 0.55)));
    }
    ticking = false;
  };
  window.addEventListener('scroll', () => {
    if (!ticking) { ticking = true; requestAnimationFrame(onScroll); }
  }, { passive: true });
  onScroll();

  /* ---------- Mobile menu ---------- */
  const toggle = document.querySelector('.nav-toggle');
  const menu = document.getElementById('menu');
  const setMenu = (open) => {
    body.classList.toggle('nav-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Menu');
    menu.inert = !open;
    if (open) header.classList.remove('is-hidden');
  };
  if (toggle && menu) {
    toggle.addEventListener('click', () => setMenu(!body.classList.contains('nav-open')));
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && body.classList.contains('nav-open')) { setMenu(false); toggle.focus(); }
    });
    window.matchMedia('(min-width: 961px)').addEventListener('change', (e) => { if (e.matches) setMenu(false); });
  }

  /* ---------- Reveal on scroll ---------- */
  const revealEls = document.querySelectorAll('[data-reveal]');
  const reveal = (el, n) => {
    el.style.setProperty('--d', Math.min(n, 6));
    el.classList.add('is-in');
    el.dispatchEvent(new CustomEvent('reveal'));
    setTimeout(() => el.classList.add('is-done'), 1900 + Math.min(n, 6) * 90);
  };
  if ('IntersectionObserver' in window && motionOK) {
    const io = new IntersectionObserver((entries) => {
      entries
        .filter((e) => e.isIntersecting)
        .sort((a, b) => (a.boundingClientRect.top - b.boundingClientRect.top) ||
                        (a.boundingClientRect.left - b.boundingClientRect.left))
        .forEach((e, n) => {
          io.unobserve(e.target);
          imagesReady(e.target).then(() => reveal(e.target, n));   // reveal the picture, not an empty frame
        });
    }, { rootMargin: '0px 0px -7% 0px', threshold: 0.08 });
    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => reveal(el, 0));   // nothing is hidden without motion: no need to wait
  }

  /* ---------- Lightbox, with zoom ----------
     Desktop: click the image to zoom in on that spot, drag or scroll to move/zoom, click again to zoom out.
     Phones: pinch to zoom, drag to move, double-tap to zoom in or out, swipe (when not zoomed) for next. */
  const links = [...document.querySelectorAll('[data-lightbox]')];
  if (links.length) {
    const groups = {};
    links.forEach((a) => (groups[a.dataset.lightbox] ||= []).push(a));

    const lb = document.createElement('div');
    lb.className = 'lightbox';
    lb.hidden = true;
    lb.setAttribute('role', 'dialog');
    lb.setAttribute('aria-modal', 'true');
    lb.setAttribute('aria-label', 'Image viewer');
    lb.innerHTML = `
      <div class="lightbox__bar">
        <span class="lightbox__count" aria-live="polite"></span>
        <div class="lightbox__tools">
          <button class="lightbox__btn lightbox__zoom" type="button" aria-label="Zoom in">${ICON.zoomIn}</button>
          <button class="lightbox__btn lightbox__close" type="button" aria-label="Close">${ICON.close}</button>
        </div>
      </div>
      <button class="lightbox__btn lightbox__prev" type="button" aria-label="Previous image">${ICON.next}</button>
      <div class="lightbox__stage"><img class="lightbox__img" alt="" draggable="false"></div>
      <div class="lightbox__caption"></div>
      <button class="lightbox__btn lightbox__next" type="button" aria-label="Next image">${ICON.next}</button>`;
    body.appendChild(lb);

    const img = lb.querySelector('.lightbox__img');
    const stage = lb.querySelector('.lightbox__stage');
    const cap = lb.querySelector('.lightbox__caption');
    const count = lb.querySelector('.lightbox__count');
    const closeBtn = lb.querySelector('.lightbox__close');
    const zoomBtn = lb.querySelector('.lightbox__zoom');
    let list = [];
    let index = 0;
    let opener = null;

    /* zoom: the image is scaled by `scale` around its centre, then moved by (tx, ty) */
    let scale = 1;
    let tx = 0;
    let ty = 0;
    const zoomed = () => scale > 1.01;
    // how far in we can go: up to the photo's real resolution, at least 2x, at most 5x
    const maxScale = () => Math.max(2, Math.min(5, (img.naturalWidth || 0) / (img.offsetWidth || 1)));
    const clampPan = () => {
      const mx = Math.max(0, (img.offsetWidth * scale - stage.clientWidth) / 2);
      const my = Math.max(0, (img.offsetHeight * scale - stage.clientHeight) / 2);
      tx = Math.min(mx, Math.max(-mx, tx));
      ty = Math.min(my, Math.max(-my, ty));
    };
    const applyZoom = () => {
      lb.classList.toggle('is-zoomed', zoomed());
      img.style.transform = zoomed() ? `translate(${tx}px, ${ty}px) scale(${scale})` : '';
      zoomBtn.setAttribute('aria-label', zoomed() ? 'Zoom out' : 'Zoom in');
      zoomBtn.innerHTML = zoomed() ? ICON.zoomOut : ICON.zoomIn;
    };
    // zoom to `s` while keeping the screen point (px, py) under the finger or cursor
    const zoomAt = (s, px, py) => {
      const next = Math.min(maxScale(), Math.max(1, s));
      const r = stage.getBoundingClientRect();
      const cx = px - (r.left + r.width / 2);
      const cy = py - (r.top + r.height / 2);
      tx = cx - (cx - tx) * (next / scale);
      ty = cy - (cy - ty) * (next / scale);
      scale = next;
      if (!zoomed()) { scale = 1; tx = 0; ty = 0; }
      clampPan();
      applyZoom();
    };
    const resetZoom = () => { scale = 1; tx = 0; ty = 0; applyZoom(); };
    const stageCentre = () => {
      const r = stage.getBoundingClientRect();
      return [r.left + r.width / 2, r.top + r.height / 2];
    };
    const toggleZoom = (px, py) => {
      if (zoomed()) resetZoom();
      else zoomAt(maxScale(), ...(px === undefined ? stageCentre() : [px, py]));
    };

    const line = (text, cls) => {
      const s = document.createElement('span');
      if (cls) s.className = cls;
      s.textContent = text;
      return s;
    };

    const show = (i) => {
      index = (i + list.length) % list.length;
      const a = list[index];
      const d = a.dataset;
      resetZoom();
      img.classList.remove('is-loaded');
      img.alt = d.title || d.caption || '';
      img.onload = () => img.classList.add('is-loaded');
      img.src = a.href;
      if (img.complete && img.naturalWidth) img.classList.add('is-loaded');

      cap.replaceChildren();
      if (d.title) cap.append(line(d.title, 'lb-title'));
      if (d.medium) cap.append(line(d.medium));
      if (d.dims) cap.append(line(d.dims));
      if (d.caption) cap.append(line(d.caption));
      if ('sold' in d) cap.append(line('Sold', 'lb-sold'));
      count.textContent = `${index + 1} / ${list.length}`;

      // preload the neighbours
      [index + 1, index - 1].forEach((j) => { new Image().src = list[(j + list.length) % list.length].href; });
    };

    const open = (group, i) => {
      list = groups[group];
      opener = document.activeElement;
      lb.classList.toggle('is-single', list.length < 2);
      lb.hidden = false;
      body.classList.add('lb-open');
      show(i);
      requestAnimationFrame(() => lb.classList.add('is-open'));
      closeBtn.focus({ preventScroll: true });
    };

    const close = () => {
      lb.classList.remove('is-open');
      body.classList.remove('lb-open');
      setTimeout(() => { lb.hidden = true; img.removeAttribute('src'); resetZoom(); }, 450);
      if (opener) opener.focus({ preventScroll: true });
    };

    links.forEach((a) => a.addEventListener('click', (e) => {
      e.preventDefault();
      const g = a.dataset.lightbox;
      open(g, groups[g].indexOf(a));
    }));
    closeBtn.addEventListener('click', close);
    zoomBtn.addEventListener('click', () => toggleZoom());
    lb.querySelector('.lightbox__prev').addEventListener('click', () => show(index - 1));
    lb.querySelector('.lightbox__next').addEventListener('click', () => show(index + 1));
    // a click on the dark background around the stage closes
    lb.addEventListener('click', (e) => { if (e.target === lb) close(); });

    document.addEventListener('keydown', (e) => {
      if (lb.hidden) return;
      if (e.key === 'Escape') close();
      else if (e.key === 'ArrowRight' && !zoomed()) show(index + 1);
      else if (e.key === 'ArrowLeft' && !zoomed()) show(index - 1);
      else if (e.key === '+' || e.key === '=') zoomAt(scale * 1.5, ...stageCentre());
      else if (e.key === '-') zoomAt(scale / 1.5, ...stageCentre());
      else if (e.key === 'Tab') {
        const focusables = [...lb.querySelectorAll('button')].filter((b) => b.offsetParent !== null);
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });

    // scroll wheel / trackpad: zoom on the spot under the cursor
    stage.addEventListener('wheel', (e) => {
      e.preventDefault();
      zoomAt(scale * (e.deltaY < 0 ? 1.15 : 1 / 1.15), e.clientX, e.clientY);
    }, { passive: false });
    window.addEventListener('resize', () => { if (!lb.hidden) { clampPan(); applyZoom(); } });

    // pointers: drag to move, two fingers to pinch, taps, and swipes for next/previous
    const pointers = new Map();
    let gesture = null;
    let moved = false;
    let lastTap = 0;
    const onImage = (x, y) => {
      const r = img.getBoundingClientRect();
      return x >= r.left && x <= r.right && y >= r.top && y <= r.bottom;
    };
    const tap = (e) => {
      const hit = onImage(e.clientX, e.clientY);
      if (e.pointerType === 'mouse') {
        if (hit) toggleZoom(e.clientX, e.clientY);
        else if (zoomed()) resetZoom();
        else close();
        return;
      }
      const now = Date.now();
      if (hit && now - lastTap < 320) { lastTap = 0; toggleZoom(e.clientX, e.clientY); return; }   // double-tap
      lastTap = now;
      if (!hit && !zoomed()) close();
    };
    stage.addEventListener('pointerdown', (e) => {
      if (e.button > 0) return;
      try { stage.setPointerCapture(e.pointerId); } catch (_) { /* pointer already gone */ }
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      moved = false;
      if (pointers.size === 2) {
        const [a, b] = [...pointers.values()];
        gesture = { type: 'pinch', dist: Math.hypot(a.x - b.x, a.y - b.y) || 1, scale };
      } else {
        gesture = { type: zoomed() ? 'pan' : 'swipe', x: e.clientX, y: e.clientY, tx, ty };
      }
    });
    stage.addEventListener('pointermove', (e) => {
      if (!pointers.has(e.pointerId) || !gesture) return;
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (gesture.type === 'pinch' && pointers.size === 2) {
        const [a, b] = [...pointers.values()];
        lb.classList.add('is-dragging');
        zoomAt(gesture.scale * Math.hypot(a.x - b.x, a.y - b.y) / gesture.dist, (a.x + b.x) / 2, (a.y + b.y) / 2);
        moved = true;
      } else if (gesture.type === 'pan') {
        const dx = e.clientX - gesture.x;
        const dy = e.clientY - gesture.y;
        if (Math.abs(dx) + Math.abs(dy) > 4) { moved = true; lb.classList.add('is-dragging'); }
        tx = gesture.tx + dx;
        ty = gesture.ty + dy;
        clampPan();
        applyZoom();
      } else if (gesture.type === 'swipe' && Math.abs(e.clientX - gesture.x) > 8) {
        moved = true;
      }
    });
    const endPointer = (e) => {
      if (!pointers.has(e.pointerId)) return;
      pointers.delete(e.pointerId);
      lb.classList.remove('is-dragging');
      if (e.type === 'pointerup' && gesture && gesture.type !== 'pinch') {
        const dx = e.clientX - gesture.x;
        if (gesture.type === 'swipe' && Math.abs(dx) > 50 && list.length > 1) show(index + (dx < 0 ? 1 : -1));
        else if (!moved) tap(e);
      }
      if (!pointers.size) gesture = null;
      else if (gesture && gesture.type === 'pinch') {   // one finger left after pinching: keep moving
        const [p] = [...pointers.values()];
        gesture = { type: 'pan', x: p.x, y: p.y, tx, ty };
        moved = true;
      }
    };
    stage.addEventListener('pointerup', endPointer);
    stage.addEventListener('pointercancel', endPointer);
  }

  /* ---------- Before / after comparison ---------- */
  document.querySelectorAll('.compare').forEach((c) => {
    const input = c.querySelector('input');
    let touched = false;
    const set = (v) => {
      c.style.setProperty('--pos', `${v}%`);
      c.classList.toggle('is-left', v < 16);
      c.classList.toggle('is-right', v > 84);
    };
    input.addEventListener('input', () => { touched = true; set(Number(input.value)); });
    input.addEventListener('pointerdown', () => { touched = true; });

    // a little sweep the first time it scrolls into view, to show it can be dragged
    c.addEventListener('reveal', () => {
      if (!motionOK) return;
      const stops = [50, 26, 70, 50];
      const seg = 800;
      const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
      let start = null;
      const step = (ts) => {
        if (touched) return;
        if (start === null) start = ts;
        const t = (ts - start) / seg;
        const i = Math.floor(t);
        if (i >= stops.length - 1) { set(50); input.value = 50; return; }
        const v = stops[i] + (stops[i + 1] - stops[i]) * ease(t - i);
        set(v);
        input.value = v;
        requestAnimationFrame(step);
      };
      setTimeout(() => requestAnimationFrame(step), 700);
    }, { once: true });
  });

  /* ---------- CV index: highlight the section in view ---------- */
  const spyLinks = [...document.querySelectorAll('.cv__index a[href^="#"]')];
  if (spyLinks.length && 'IntersectionObserver' in window) {
    const byId = new Map(spyLinks.map((a) => [a.getAttribute('href').slice(1), a]));
    const spy = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        spyLinks.forEach((a) => a.classList.remove('is-active'));
        byId.get(e.target.id)?.classList.add('is-active');
      });
    }, { rootMargin: '-25% 0px -65% 0px' });
    byId.forEach((_, id) => { const s = document.getElementById(id); if (s) spy.observe(s); });
  }
})();
