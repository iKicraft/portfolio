'use strict';

(() => {
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const root = document.documentElement;

  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const hasGsap = typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined';
  const animated = hasGsap && !reduceMotion;

  // Estado compartido (fondo, scroll y efectos)
  const state = { hue: 0, hueT: 0, vel: 0, mx: innerWidth * 0.6, my: innerHeight * 0.4, intro: 1, sp: 0 };

  /*-----------------------------------*\
    UTILIDADES
  \*-----------------------------------*/

  // Divide en palabras (que no se parten) y letras
  function splitText(el) {
    const text = el.textContent.trim();
    el.setAttribute('aria-label', text);
    el.textContent = '';
    const chars = [];
    text.split(/\s+/).forEach((word, i, arr) => {
      const w = document.createElement('span');
      w.className = 'split-w mask';
      w.setAttribute('aria-hidden', 'true');
      for (const c of word) {
        const s = document.createElement('span');
        s.className = 'ch';
        s.textContent = c;
        w.appendChild(s);
        chars.push(s);
      }
      el.appendChild(w);
      if (i < arr.length - 1) el.appendChild(document.createTextNode(' '));
    });
    return chars;
  }

  function splitWords(el) {
    const out = [];
    const walk = (node, hl) => {
      [...node.childNodes].forEach((n) => {
        if (n.nodeType === 3) {
          const frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach((part) => {
            if (!part) return;
            if (/^\s+$/.test(part)) {
              frag.appendChild(document.createTextNode(' '));
              return;
            }
            const w = document.createElement('span');
            w.className = 'w' + (hl ? ' hl' : '');
            w.textContent = part;
            frag.appendChild(w);
            out.push(w);
          });
          n.replaceWith(frag);
        } else if (n.nodeType === 1) {
          walk(n, hl || n.tagName === 'EM');
        }
      });
    };
    walk(el, false);
    return out;
  }

  // Letras con onda para "tecnología"
  function waveLetters(el) {
    const text = el.textContent;
    el.setAttribute('aria-label', text);
    el.textContent = '';
    [...text].forEach((c, i) => {
      const s = document.createElement('span');
      s.className = 'wl';
      s.setAttribute('aria-hidden', 'true');
      s.style.animationDelay = `${(i * 0.08).toFixed(2)}s`;
      s.textContent = c;
      el.appendChild(s);
    });
  }

  /*-----------------------------------*\
    FONDO: auroras rojas + partículas que reaccionan al scroll
  \*-----------------------------------*/

  function makeBackground() {
    const cv = $('#bg');
    const ctx = cv.getContext('2d', { alpha: false });
    let W = 0, H = 0, parts = [];
    const small = innerWidth < 720;
    const mb = { x: state.mx, y: state.my };

    const blobs = [
      { x: 0.2, y: 0.28, r: 0.55, o: 0, s: 0.11, ax: 0.12, ay: 0.1, p: 0 },
      { x: 0.8, y: 0.25, r: 0.5, o: 14, s: 0.09, ax: 0.1, ay: 0.14, p: 2 },
      { x: 0.62, y: 0.78, r: 0.6, o: -10, s: 0.13, ax: 0.14, ay: 0.08, p: 4 },
      { x: 0.18, y: 0.82, r: 0.45, o: 6, s: 0.1, ax: 0.1, ay: 0.1, p: 1 },
    ];

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, small ? 1.25 : 1.5);
      W = innerWidth;
      H = innerHeight;
      cv.width = Math.round(W * dpr);
      cv.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = small ? 45 : Math.round(Math.min(130, (W * H) / 12500));
      parts = Array.from({ length: count }, () => ({ x: Math.random() * W, y: Math.random() * H, z: 0.2 + Math.random() * 0.8 }));
    }

    function draw(t) {
      state.hue += (state.hueT - state.hue) * 0.04;
      const h = state.hue;

      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = '#08080a';
      ctx.fillRect(0, 0, W, H);
      ctx.globalCompositeOperation = 'lighter';

      const base = Math.max(W, H) * (0.5 + 0.5 * state.intro);
      blobs.forEach((b, i) => {
        const x = W * (b.x + Math.sin(t * b.s + b.p) * b.ax);
        const y = H * (b.y + Math.cos(t * b.s * 1.3 + b.p) * b.ay + (state.sp - 0.5) * 0.25 * (i % 2 ? 1 : -1));
        const r = base * b.r;
        const hh = h + b.o;
        const g = ctx.createRadialGradient(x, y, 0, x, y, r);
        g.addColorStop(0, `hsla(${hh},90%,46%,${0.26 * state.intro})`);
        g.addColorStop(1, `hsla(${hh},90%,46%,0)`);
        ctx.fillStyle = g;
        ctx.fillRect(x - r, y - r, r * 2, r * 2);
      });

      mb.x += (state.mx - mb.x) * 0.06;
      mb.y += (state.my - mb.y) * 0.06;
      const mr = Math.max(W, H) * 0.24;
      const mg = ctx.createRadialGradient(mb.x, mb.y, 0, mb.x, mb.y, mr);
      mg.addColorStop(0, `hsla(${h + 6},100%,52%,${0.26 * state.intro})`);
      mg.addColorStop(1, `hsla(${h + 6},100%,52%,0)`);
      ctx.fillStyle = mg;
      ctx.fillRect(mb.x - mr, mb.y - mr, mr * 2, mr * 2);

      const v = state.vel;
      const av = Math.min(Math.abs(v), 70);
      const dir = v >= 0 ? 1 : -1;
      ctx.lineCap = 'round';
      for (const p of parts) {
        p.y -= (0.15 + v * 0.3) * (0.3 + p.z * 1.4);
        if (p.y < -30) p.y = H + 30;
        else if (p.y > H + 30) p.y = -30;

        const dx = p.x - state.mx;
        const dy = p.y - state.my;
        const d2 = dx * dx + dy * dy;
        if (d2 < 22500) {
          const d = Math.sqrt(d2) || 1;
          const f = (150 - d) / 150;
          p.x += (dx / d) * f * 1.6;
          p.y += (dy / d) * f * 1.6;
          ctx.strokeStyle = `hsla(${h + 8},100%,72%,${f * 0.35})`;
          ctx.lineWidth = 0.7;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(state.mx, state.my);
          ctx.stroke();
        }
        if (p.x < -10) p.x = W + 10;
        else if (p.x > W + 10) p.x = -10;

        ctx.strokeStyle = `hsla(${h + p.z * 18},95%,${68 + p.z * 15}%,${0.1 + p.z * 0.45})`;
        ctx.lineWidth = 0.6 + p.z * 1.3;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x, p.y + (2 + av * p.z * 1.6) * dir);
        ctx.stroke();
      }
    }

    resize();
    let rz;
    addEventListener('resize', () => {
      clearTimeout(rz);
      rz = setTimeout(() => {
        resize();
        if (!animated) draw(0);
      }, 120);
    });

    return { draw };
  }

  /*-----------------------------------*\
    INICIO
  \*-----------------------------------*/

  const bg = makeBackground();

  addEventListener('pointermove', (e) => {
    state.mx = e.clientX;
    state.my = e.clientY;
  }, { passive: true });

  // Menú móvil
  const menuBtn = $('[data-menu-btn]');
  const setMenu = (open) => {
    root.classList.toggle('menu-open', open);
    menuBtn.setAttribute('aria-expanded', String(open));
  };
  menuBtn.addEventListener('click', () => setMenu(!root.classList.contains('menu-open')));
  $$('[data-menu] a').forEach((a) => a.addEventListener('click', () => setMenu(false)));

  // Navbar con fondo al hacer scroll
  const nav = $('.nav');
  const syncNav = () => nav.classList.toggle('is-solid', scrollY > 40);
  addEventListener('scroll', syncNav, { passive: true });

  $$('[data-wave]').forEach(waveLetters);

  // Sin librerías o con movimiento reducido: página estática y funcional
  if (!animated) {
    root.classList.add('static');
    root.classList.remove('is-loading');
    bg.draw(0);
    return;
  }

  /*-----------------------------------*\
    ANIMACIONES (GSAP + ScrollTrigger + Lenis)
  \*-----------------------------------*/

  gsap.registerPlugin(ScrollTrigger);
  ScrollTrigger.config({ ignoreMobileResize: true });

  let lenis = null;
  if (typeof Lenis !== 'undefined') {
    lenis = new Lenis({
      duration: 1.15,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });
    lenis.on('scroll', ScrollTrigger.update);
    lenis.stop();
  }

  const progressBar = $('.progress i');
  let lastY = scrollY;
  let maxScroll = 1;
  ScrollTrigger.addEventListener('refresh', () => {
    maxScroll = Math.max(1, ScrollTrigger.maxScroll(window));
  });

  const marquees = [];

  gsap.ticker.add((time, deltaTime) => {
    if (lenis) lenis.raf(time * 1000);

    const y = scrollY;
    state.vel += (y - lastY - state.vel) * 0.12;
    lastY = y;
    state.sp = Math.min(1, y / maxScroll);

    bg.draw(time);
    progressBar.style.transform = `scaleX(${state.sp.toFixed(4)})`;

    marquees.forEach((m) => {
      m.x += m.dir * (m.speed + Math.min(Math.abs(state.vel), 80) * 1.6) * (deltaTime / 1000);
      if (m.x <= -m.w) m.x += m.w;
      if (m.x > 0) m.x -= m.w;
      m.track.style.transform = `translate3d(${m.x.toFixed(1)}px,0,0)`;
    });
  });
  gsap.ticker.lagSmoothing(0);

  /* ---------- Marquesinas ---------- */
  $$('[data-marquee]').forEach((el) => {
    const group = $('.mq__group', el);
    const w0 = group.getBoundingClientRect().width || 1;
    const copies = Math.ceil((innerWidth * 2) / w0) + 1;
    const track = document.createElement('div');
    track.style.cssText = 'display:flex;flex:none;width:max-content;will-change:transform';
    el.appendChild(track);
    track.appendChild(group);
    for (let i = 0; i < copies; i++) {
      const c = group.cloneNode(true);
      c.setAttribute('aria-hidden', 'true');
      track.appendChild(c);
    }
    const m = { track, dir: Number(el.dataset.dir) || -1, speed: Number(el.dataset.marquee) || 40, x: 0, w: w0 };
    const measure = () => {
      m.w = group.getBoundingClientRect().width || 1;
    };
    if (document.fonts) document.fonts.ready.then(measure);
    addEventListener('load', measure);
    addEventListener('resize', measure);
    marquees.push(m);
  });

  /* ---------- Cursor, botones magnéticos, reveals ---------- */
  if (finePointer) {
    root.classList.add('has-cursor');
    const dotX = gsap.quickTo('.cursor__dot', 'x', { duration: 0.08, ease: 'none' });
    const dotY = gsap.quickTo('.cursor__dot', 'y', { duration: 0.08, ease: 'none' });
    const ringX = gsap.quickTo('.cursor__ring', 'x', { duration: 0.4, ease: 'power3' });
    const ringY = gsap.quickTo('.cursor__ring', 'y', { duration: 0.4, ease: 'power3' });
    addEventListener('pointermove', (e) => {
      dotX(e.clientX);
      dotY(e.clientY);
      ringX(e.clientX);
      ringY(e.clientY);
    }, { passive: true });
    document.addEventListener('mouseover', (e) => {
      root.classList.toggle('cursor-hover', !!e.target.closest('a, button, [data-hover]'));
    });

    $$('[data-magnetic]').forEach((el) => {
      const mx = gsap.quickTo(el, 'x', { duration: 0.5, ease: 'power3' });
      const my = gsap.quickTo(el, 'y', { duration: 0.5, ease: 'power3' });
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        mx((e.clientX - (r.left + r.width / 2)) * 0.28);
        my((e.clientY - (r.top + r.height / 2)) * 0.4);
      });
      el.addEventListener('pointerleave', () => {
        mx(0);
        my(0);
      });
    });
  }

  gsap.set('[data-reveal]', { y: 44, opacity: 0 });
  ScrollTrigger.batch('[data-reveal]', {
    start: 'top 90%',
    once: true,
    onEnter: (batch) => gsap.to(batch, { y: 0, opacity: 1, duration: 1, ease: 'power3.out', stagger: 0.1, overwrite: true }),
  });

  $$('[data-chars]').forEach((el) => {
    const chars = splitText(el);
    gsap.set(chars, { yPercent: 115 });
    ScrollTrigger.create({
      trigger: el,
      start: 'top 88%',
      once: true,
      onEnter: () =>
        gsap.to(chars, {
          yPercent: 0,
          duration: 1.1,
          stagger: 0.025,
          ease: 'expo.out',
          onComplete: () => $$('.split-w', el).forEach((w) => w.classList.remove('mask')),
        }),
    });
  });

  /*-----------------------------------*\
    LAPTOP 3D
  \*-----------------------------------*/

  const cam = $('.lap__cam');
  const lid = $('.lid');
  const baseEl = $('.base');
  const screenUI = $('.screen__ui');

  // Escala para que la laptop abierta entre en pantalla
  const fitK = () => Math.max(0.3, Math.min(1.05, (innerWidth - 36) / 800, (innerHeight - 260) / 610));
  let K = fitK();
  const YCLOSED = () => -145 * K;
  const YOPEN = () => 165 * K;

  gsap.set(lid, { rotationX: -90 });
  gsap.set(cam, { rotationX: -40, scale: K * 0.92, y: YCLOSED() });
  gsap.set(baseEl, { '--kb': 0 });
  gsap.set('.hero__intro .eyebrow', { y: 14 });
  gsap.set('.nav > *', { y: -24, opacity: 0 });

  // Parallax suave de la laptop con el cursor (solo mientras está en reposo)
  const tilt = { x: 0, y: 0 };
  if (finePointer) {
    addEventListener('pointermove', (e) => {
      tilt.x = (e.clientX / innerWidth - 0.5) * 2;
      tilt.y = (e.clientY / innerHeight - 0.5) * 2;
    }, { passive: true });
  }

  /*-----------------------------------*\
    SECCIONES CON SCROLL
  \*-----------------------------------*/

  /* ---------- Acerca: palabras que se encienden ---------- */
  const words = splitWords($('[data-words]'));
  const aboutST = ScrollTrigger.create({
    trigger: '.about__pin',
    start: 'top top',
    end: '+=130%',
    pin: true,
    scrub: true,
    animation: gsap.timeline({ defaults: { ease: 'none' } }).to(words, { opacity: 1, stagger: 0.16, duration: 0.3 }),
  });

  /* ---------- Soluciones: scroll horizontal ---------- */
  const hs = $('.hs');
  const hsBar = $('.hs__bar i');
  const hsDist = () => Math.max(0, hs.scrollWidth - innerWidth);
  const hsST = ScrollTrigger.create({
    trigger: '#solutions',
    start: 'top top',
    end: () => '+=' + hsDist(),
    pin: true,
    scrub: 0.5,
    invalidateOnRefresh: true,
    animation: gsap.to(hs, { x: () => -hsDist(), ease: 'none' }),
    onUpdate: (self) => (hsBar.style.transform = `scaleX(${self.progress.toFixed(4)})`),
  });

  /* ---------- Sistemas: escaparate ---------- */
  const panels = $$('.panel');
  const sysBtns = $$('.sys__list button');
  let sysIdx = 0;
  const setSys = (i) => {
    if (i === sysIdx) return;
    sysIdx = i;
    panels.forEach((p, k) => p.classList.toggle('is-active', k === i));
    sysBtns.forEach((b, k) => b.classList.toggle('is-active', k === i));
  };
  const sysST = ScrollTrigger.create({
    trigger: '#systems',
    start: 'top top',
    end: () => '+=' + Math.round(innerHeight * panels.length * 0.75),
    pin: true,
    invalidateOnRefresh: true,
    onUpdate: (self) => setSys(Math.min(panels.length - 1, Math.floor(self.progress * panels.length))),
  });
  sysBtns.forEach((b, i) =>
    b.addEventListener('click', () => scrollToY(sysST.start + ((i + 0.5) / panels.length) * (sysST.end - sysST.start)))
  );

  /* ---------- Equipo: foto que se abre ---------- */
  gsap.fromTo(
    '.person',
    { clipPath: 'inset(10% 8% 10% 8% round 30px)' },
    {
      clipPath: 'inset(0% 0% 0% 0% round 30px)',
      ease: 'none',
      scrollTrigger: { trigger: '.person', start: 'top 92%', end: 'top 35%', scrub: true },
    }
  );
  gsap.fromTo('.person__img', { yPercent: -5 }, { yPercent: 5, ease: 'none', scrollTrigger: { trigger: '.person', start: 'top bottom', end: 'bottom top', scrub: true } });

  /* ---------- Fondo por sección + navegación activa ---------- */
  const sectionHue = { hero: 0, about: 6, solutions: 10, systems: 356, testimonials: 0, clients: 4, team: 8, contact: 2 };
  Object.entries(sectionHue).forEach(([id, hue]) => {
    ScrollTrigger.create({
      trigger: document.getElementById(id),
      start: 'top 55%',
      end: 'bottom 55%',
      onToggle: (self) => self.isActive && (state.hueT = hue),
    });
  });

  const navLinks = $$('[data-nav]');
  let lastNav = '';
  const setNav = (id) => {
    if (id === lastNav) return;
    lastNav = id;
    navLinks.forEach((a) => a.classList.toggle('is-active', a.dataset.nav === id));
  };
  const navMap = [
    ['hero', ''],
    ['about', 'about'],
    ['solutions', 'solutions'],
    ['systems', 'systems'],
    ['testimonials', ''],
    ['contact', 'contact'],
  ];
  navMap.forEach(([id, nav], i) => {
    ScrollTrigger.create({
      trigger: document.getElementById(id),
      start: 'top 55%',
      onEnter: () => setNav(nav),
      onLeaveBack: () => setNav(i > 0 ? navMap[i - 1][1] : ''),
    });
  });

  /* ---------- Anclas con scroll suave ---------- */
  function scrollToY(y) {
    if (lenis) lenis.scrollTo(y, { duration: 1.6, easing: (t) => 1 - Math.pow(1 - t, 4) });
    else scrollTo({ top: y, behavior: 'smooth' });
  }

  const anchorY = (id) => {
    if (id === 'hero') return 0;
    if (id === 'about') return aboutST.start;
    if (id === 'solutions') return hsST.start;
    if (id === 'systems') return sysST.start;
    const el = document.getElementById(id);
    return el ? el.getBoundingClientRect().top + scrollY - 10 : null;
  };

  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    const y = anchorY(a.getAttribute('href').slice(1));
    if (y === null) return;
    e.preventDefault();
    scrollToY(y);
  });

  addEventListener('load', () => ScrollTrigger.refresh());

  /*-----------------------------------*\
    SECUENCIA DE ENTRADA: preloader → laptop que se abre → zoom a la pantalla
  \*-----------------------------------*/

  const pre = $('.pre');
  const preNum = $('.pre__num');
  const preBar = $('.pre__bar i');

  const counter = new Promise((res) => {
    const o = { v: 0 };
    gsap.to(o, {
      v: 100,
      duration: 1.4,
      ease: 'power2.inOut',
      onUpdate: () => {
        preNum.textContent = String(Math.round(o.v)).padStart(3, '0');
        preBar.style.transform = `scaleX(${(o.v / 100).toFixed(3)})`;
      },
      onComplete: res,
    });
  });
  const assetsReady = Promise.race([
    Promise.all([
      document.fonts ? document.fonts.ready : Promise.resolve(),
      ...[...document.images].filter((i) => i.closest('.pre, .nav, .lap')).map((i) => (i.decode ? i.decode().catch(() => {}) : Promise.resolve())),
    ]),
    new Promise((r) => setTimeout(r, 3000)),
  ]);

  // Una vez abierta, el scroll hace el "zoom" hacia la pantalla
  function buildHeroScroll() {
    K = fitK();
    // escala necesaria para que la pantalla cubra todo el viewport
    const S = Math.max(innerWidth / 732, innerHeight / 447) * 1.05;
    // en pantallas verticales la pantalla es más ancha que el viewport: mostrar su lado izquierdo (donde está el texto)
    const xEnd = Math.max(0, 366 * S - innerWidth / 2 + 12);
    const tl = gsap.timeline({ defaults: { ease: 'none' } });
    tl.to('.hero__hint', { opacity: 0, duration: 0.08 }, 0)
      .to(cam, { scale: S, rotationX: 0, y: 237.5 * S, x: xEnd, duration: 0.8, ease: 'power1.inOut' }, 0)
      .to(lid, { rotationX: 0, duration: 0.6 }, 0)
      .to('.hero__floor', { opacity: 0, duration: 0.3 }, 0.1)
      .to('.hero-real', { opacity: 1, duration: 0.22 }, 0.66)
      .to('.lap', { opacity: 0, duration: 0.2 }, 0.8)
      .to({}, { duration: 0.28 }, 0.92);

    return ScrollTrigger.create({
      trigger: '#hero',
      start: 'top top',
      end: '+=230%',
      pin: true,
      scrub: 0.6,
      animation: tl,
      refreshPriority: 10, // se mide primero: su pin empuja al resto de las secciones
      invalidateOnRefresh: true,
      onUpdate: (self) => $('.hero-real').classList.toggle('is-live', self.progress > 0.88),
    });
  }

  Promise.all([counter, assetsReady]).then(() => {
    // Recalcular por si el viewport cambió de tamaño durante la carga
    K = fitK();
    gsap.set(cam, { y: YCLOSED(), scale: K * 0.92 });
    const t = gsap.timeline();

    // 1) Persianas: se abren arriba y abajo
    t.to('.pre__inner', { opacity: 0, y: -20, duration: 0.35, ease: 'power2.in' })
      .to('.pre__half--t', { yPercent: -101, duration: 1, ease: 'expo.inOut' }, '>-0.05')
      .to('.pre__half--b', { yPercent: 101, duration: 1, ease: 'expo.inOut' }, '<')
      .fromTo(state, { intro: 0.25 }, { intro: 1, duration: 2.4, ease: 'power2.out' }, '<')
      .to('.nav > *', { y: 0, opacity: 1, duration: 0.9, stagger: 0.1, ease: 'power3.out' }, '<0.5')
      // 2) La laptop cerrada aparece con su brillo
      .to('.hero__floor', { opacity: 1, duration: 1.4, ease: 'power2.out' }, '<0.2')
      .to('.hero__intro .eyebrow', { opacity: 1, y: 0, duration: 0.9, ease: 'power3.out' }, '<0.2')
      .to(cam, { scale: K, duration: 1.8, ease: 'power3.out' }, '<')
      // 3) Se abre la tapa
      .to(lid, { rotationX: 12, duration: 2.4, ease: 'power3.inOut' }, '+=0.35')
      .to(cam, { rotationX: -17, y: YOPEN(), duration: 2.4, ease: 'power3.inOut' }, '<')
      .to('.hero__intro .eyebrow', { opacity: 0, y: -10, duration: 0.5, ease: 'power2.in' }, '<0.1')
      // 4) La pantalla se enciende
      .to(screenUI, { keyframes: { opacity: [0, 0.4, 0.1, 0.85, 0.6, 1] }, duration: 0.9, ease: 'none' }, '<1.5')
      .to(baseEl, { '--kb': 1, duration: 1.4, ease: 'power2.out' }, '<0.2')
      .to('.hero__hint', { opacity: 1, duration: 0.8 }, '>-0.3');

    t.eventCallback('onComplete', () => {
      pre.remove();
      root.classList.remove('is-loading');
      buildHeroScroll();
      ScrollTrigger.refresh();
      if (lenis) lenis.start();

      // La laptop sigue "viva": gira un poco con el cursor mientras está en reposo
      const camRY = gsap.quickTo(cam, 'rotationY', { duration: 1.2, ease: 'power3' });
      gsap.ticker.add(() => camRY(scrollY > 30 ? 0 : tilt.x * 7));
    });
  });
})();
