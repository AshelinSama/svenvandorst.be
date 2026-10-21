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

  /* ---------- Lightbox ---------- */
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
        <button class="lightbox__btn lightbox__close" type="button" aria-label="Close">${ICON.close}</button>
      </div>
      <button class="lightbox__btn lightbox__prev" type="button" aria-label="Previous image">${ICON.next}</button>
      <div class="lightbox__stage"><img class="lightbox__img" alt=""></div>
      <div class="lightbox__caption"></div>
      <button class="lightbox__btn lightbox__next" type="button" aria-label="Next image">${ICON.next}</button>`;
    body.appendChild(lb);

    const img = lb.querySelector('.lightbox__img');
    const cap = lb.querySelector('.lightbox__caption');
    const count = lb.querySelector('.lightbox__count');
    const closeBtn = lb.querySelector('.lightbox__close');
    let list = [];
    let index = 0;
    let opener = null;

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
      setTimeout(() => { lb.hidden = true; img.removeAttribute('src'); }, 450);
      if (opener) opener.focus({ preventScroll: true });
    };

    links.forEach((a) => a.addEventListener('click', (e) => {
      e.preventDefault();
      const g = a.dataset.lightbox;
      open(g, groups[g].indexOf(a));
    }));
    closeBtn.addEventListener('click', close);
    lb.querySelector('.lightbox__prev').addEventListener('click', () => show(index - 1));
    lb.querySelector('.lightbox__next').addEventListener('click', () => show(index + 1));
    let swiped = false;
    lb.addEventListener('click', (e) => {
      if (swiped) { swiped = false; return; }
      if (e.target === lb || e.target.classList.contains('lightbox__stage')) close();
    });

    document.addEventListener('keydown', (e) => {
      if (lb.hidden) return;
      if (e.key === 'Escape') close();
      else if (e.key === 'ArrowRight') show(index + 1);
      else if (e.key === 'ArrowLeft') show(index - 1);
      else if (e.key === 'Tab') {
        const focusables = [...lb.querySelectorAll('button')].filter((b) => b.offsetParent !== null);
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });

    // swipe
    let x0 = null;
    lb.addEventListener('pointerdown', (e) => { x0 = e.clientX; });
    lb.addEventListener('pointerup', (e) => {
      if (x0 === null) return;
      const dx = e.clientX - x0;
      x0 = null;
      if (Math.abs(dx) > 50 && list.length > 1) { swiped = true; show(index + (dx < 0 ? 1 : -1)); }
    });
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
