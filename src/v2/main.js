'use strict';

(() => {
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const root = document.documentElement;

  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const hasGsap = typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined';
  const animated = hasGsap && !reduceMotion;

  // Estado compartido entre el fondo, el scroll y los efectos
  const state = {
    hue: 268,
    hueT: 268,
    vel: 0,
    mx: innerWidth * 0.6,
    my: innerHeight * 0.4,
    intro: 0,
    tunnelOn: false,
    tp: 0,
    sp: 0,
  };

  /*-----------------------------------*\
    UTILIDADES
  \*-----------------------------------*/

  function splitChars(el) {
    const text = el.textContent;
    el.setAttribute('aria-label', text);
    el.textContent = '';
    const chars = [];
    for (const c of text) {
      const s = document.createElement('span');
      s.className = 'ch';
      s.setAttribute('aria-hidden', 'true');
      s.textContent = c === ' ' ? ' ' : c;
      el.appendChild(s);
      chars.push(s);
    }
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

  // Rebote al pasar el cursor por encima de cada letra
  function bounceOnHover(chars) {
    if (!finePointer) return;
    chars.forEach((c) => {
      c.addEventListener('mouseenter', () => {
        gsap.killTweensOf(c, 'y,scale');
        gsap.to(c, { y: -22, scale: 1.08, duration: 0.22, ease: 'power2.out' });
        gsap.to(c, { y: 0, scale: 1, duration: 1.1, ease: 'elastic.out(1, 0.35)', delay: 0.22 });
      });
    });
  }

  /*-----------------------------------*\
    FONDO: auroras + partículas que reaccionan al scroll
  \*-----------------------------------*/

  function makeBackground() {
    const cv = $('#bg');
    const ctx = cv.getContext('2d', { alpha: false });
    let W = 0, H = 0, parts = [];
    const small = innerWidth < 720;
    const mb = { x: state.mx, y: state.my };
    let lastCss = -1;

    const blobs = [
      { x: 0.25, y: 0.3, r: 0.55, o: 0, s: 0.11, ax: 0.12, ay: 0.1, p: 0 },
      { x: 0.75, y: 0.25, r: 0.5, o: 55, s: 0.09, ax: 0.1, ay: 0.14, p: 2 },
      { x: 0.6, y: 0.75, r: 0.6, o: -30, s: 0.13, ax: 0.14, ay: 0.08, p: 4 },
      { x: 0.2, y: 0.8, r: 0.45, o: 25, s: 0.1, ax: 0.1, ay: 0.1, p: 1 },
    ];

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, small ? 1.25 : 1.5);
      W = innerWidth;
      H = innerHeight;
      cv.width = Math.round(W * dpr);
      cv.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = small ? 55 : Math.round(Math.min(150, (W * H) / 11000));
      parts = Array.from({ length: count }, () => ({
        x: Math.random() * W,
        y: Math.random() * H,
        z: 0.2 + Math.random() * 0.8,
      }));
    }

    function draw(t) {
      state.hue += (state.hueT - state.hue) * 0.04;
      const h = state.hue;

      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = '#06030d';
      ctx.fillRect(0, 0, W, H);
      ctx.globalCompositeOperation = 'lighter';

      const base = Math.max(W, H) * (0.5 + 0.5 * state.intro);
      blobs.forEach((b, i) => {
        const x = W * (b.x + Math.sin(t * b.s + b.p) * b.ax);
        const y = H * (b.y + Math.cos(t * b.s * 1.3 + b.p) * b.ay + (state.sp - 0.5) * 0.25 * (i % 2 ? 1 : -1));
        const r = base * b.r;
        const hh = h + b.o;
        const g = ctx.createRadialGradient(x, y, 0, x, y, r);
        g.addColorStop(0, `hsla(${hh},95%,56%,${0.3 * state.intro})`);
        g.addColorStop(1, `hsla(${hh},95%,56%,0)`);
        ctx.fillStyle = g;
        ctx.fillRect(x - r, y - r, r * 2, r * 2);
      });

      // Luz que sigue al cursor
      mb.x += (state.mx - mb.x) * 0.06;
      mb.y += (state.my - mb.y) * 0.06;
      const mr = Math.max(W, H) * 0.26;
      const mg = ctx.createRadialGradient(mb.x, mb.y, 0, mb.x, mb.y, mr);
      mg.addColorStop(0, `hsla(${h + 30},100%,66%,${0.3 * state.intro})`);
      mg.addColorStop(1, `hsla(${h + 30},100%,66%,0)`);
      ctx.fillStyle = mg;
      ctx.fillRect(mb.x - mr, mb.y - mr, mr * 2, mr * 2);

      // Partículas: se estiran en líneas con la velocidad del scroll
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
          // Telaraña hacia el cursor
          ctx.strokeStyle = `hsla(${h + 20},100%,78%,${f * 0.35})`;
          ctx.lineWidth = 0.7;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(state.mx, state.my);
          ctx.stroke();
        }
        if (p.x < -10) p.x = W + 10;
        else if (p.x > W + 10) p.x = -10;

        ctx.strokeStyle = `hsla(${h + p.z * 50},100%,${70 + p.z * 15}%,${0.12 + p.z * 0.5})`;
        ctx.lineWidth = 0.6 + p.z * 1.4;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x, p.y + (2 + av * p.z * 1.6) * dir);
        ctx.stroke();
      }

      if (Math.abs(h - lastCss) > 0.4) {
        root.style.setProperty('--hue', h.toFixed(1));
        lastCss = h;
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
  state.intro = 1;

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

  // Copiar Discord
  $$('[data-copy]').forEach((b) => {
    const original = b.textContent;
    b.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(b.dataset.copy);
        b.textContent = '¡Copiado!';
      } catch (_) {
        b.textContent = '@' + b.dataset.copy;
      }
      setTimeout(() => (b.textContent = original), 1800);
    });
  });

  // Sin librerías o con movimiento reducido: página estática y funcional
  if (!animated) {
    root.classList.add('static');
    root.classList.remove('is-loading');
    $$('.line--grad').forEach((el) => {
      const chars = splitChars(el);
      chars.forEach((c, i) => (c.style.color = `hsl(${266 + (62 * i) / Math.max(chars.length - 1, 1)},100%,74%)`));
    });
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

  let lastY = scrollY;
  let lastNav = '';
  let maxScroll = 1;
  ScrollTrigger.addEventListener('refresh', () => {
    maxScroll = Math.max(1, ScrollTrigger.maxScroll(window));
  });
  gsap.ticker.add((time, deltaTime) => {
    if (lenis) lenis.raf(time * 1000);

    // Velocidad de scroll suavizada (alimenta fondo y marquesinas)
    const y = scrollY;
    state.vel += (y - lastY - state.vel) * 0.12;
    lastY = y;
    state.sp = Math.min(1, y / maxScroll);

    bg.draw(time);

    // Barra de progreso
    progressBar.style.transform = `scaleX(${state.sp.toFixed(4)})`;

    // Efectos del túnel
    if (state.tunnelOn) {
      const n = rings.length;
      rings.forEach((r, k) => {
        const t = (((state.tp * 9 + k / n + time * 0.03) % 1) + 1) % 1;
        r.style.transform = `translate(-50%,-50%) scale(${(0.05 + t * t * 3.4).toFixed(3)})`;
        r.style.opacity = (Math.sin(Math.PI * t) * 0.6).toFixed(3);
      });
      floorGrid.style.transform = `rotateX(72deg) translate3d(0,${((state.tp * 1100 + time * 14) % 70).toFixed(1)}px,0)`;
    }

    // Marquesinas
    marquees.forEach((m) => {
      m.x += m.dir * (m.speed + Math.min(Math.abs(state.vel), 80) * 1.6) * (deltaTime / 1000);
      if (m.x <= -m.w) m.x += m.w;
      if (m.x > 0) m.x -= m.w;
      m.track.style.transform = `translate3d(${m.x.toFixed(1)}px,0,0)`;
    });
  });
  gsap.ticker.lagSmoothing(0);

  const progressBar = $('.progress i');
  const rings = $$('.rings span');
  const floorGrid = $('.floor__grid');

  /* ---------- Marquesinas ---------- */
  const marquees = $$('[data-marquee]').map((el) => {
    const group = $('.mq__group', el);
    // Duplicar el contenido las veces necesarias para cubrir el ancho
    let w = group.getBoundingClientRect().width || 1;
    const copies = Math.ceil((innerWidth * 2) / w) + 1;
    const clones = [];
    for (let i = 0; i < copies; i++) {
      const c = group.cloneNode(true);
      clones.push(c);
      el.appendChild(c);
    }
    const track = document.createElement('div');
    track.style.display = 'flex';
    track.style.flex = 'none';
    track.style.willChange = 'transform';
    el.appendChild(track);
    [group, ...clones].forEach((g) => track.appendChild(g));
    el.style.display = 'block';
    const dir = Number(el.dataset.dir) || -1;
    const m = { el, track, dir, speed: Number(el.dataset.marquee) || 40, x: 0, w };
    const measure = () => {
      m.w = group.getBoundingClientRect().width || 1;
    };
    document.fonts && document.fonts.ready.then(measure);
    addEventListener('resize', measure);
    return m;
  });

  /* ---------- Texto del hero y títulos ---------- */
  const heroLines = $$('.hero__title .line');
  const heroChars = [];
  heroLines.forEach((line) => {
    line.classList.add('is-masked');
    const chars = splitChars(line);
    chars.forEach((c, i) => {
      if (line.classList.contains('line--grad')) {
        const hue = 266 + (62 * i) / Math.max(chars.length - 1, 1);
        c.style.color = `hsl(${hue.toFixed(0)},100%,${74 - i}%)`;
      }
      heroChars.push(c);
    });
  });
  gsap.set(heroChars, { yPercent: 118, rotation: 7 });
  gsap.set('.nav > *', { y: -30, opacity: 0 });
  gsap.set('.hero__top, .hero__bottom', { opacity: 0 });
  gsap.set('.hero__role', { y: 24, opacity: 0 });
  gsap.set('.badge', { scale: 0.5, opacity: 0, rotation: -60 });

  // Rotación de la frase del hero
  const swaps = $$('.hero__role-swap span');
  gsap.set(swaps, { yPercent: 110, opacity: 0 });
  gsap.set(swaps[0], { yPercent: 0, opacity: 1 });
  let swapIdx = 0;
  const swapNext = () => {
    const cur = swaps[swapIdx];
    swapIdx = (swapIdx + 1) % swaps.length;
    const nxt = swaps[swapIdx];
    gsap.to(cur, { yPercent: -110, opacity: 0, duration: 0.6, ease: 'power3.in' });
    gsap.fromTo(nxt, { yPercent: 110, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.7, ease: 'power3.out', delay: 0.35 });
    gsap.delayedCall(2.6, swapNext);
  };

  // Títulos grandes (letra por letra)
  $$('[data-chars]').forEach((el) => {
    el.classList.add('mask');
    const chars = splitChars(el);
    if (el.classList.contains('contact__title')) {
      el.classList.add('is-split');
      chars.forEach((c, i) => (c.style.animationDelay = `${(-i * 0.45).toFixed(2)}s`));
    }
    gsap.set(chars, { yPercent: 115 });
    ScrollTrigger.create({
      trigger: el,
      start: 'top 88%',
      once: true,
      onEnter: () =>
        gsap.to(chars, {
          yPercent: 0,
          duration: 1.1,
          stagger: 0.035,
          ease: 'expo.out',
          onComplete: () => {
            el.classList.remove('mask');
            bounceOnHover(chars);
          },
        }),
    });
  });

  // Elementos que aparecen al entrar en pantalla
  gsap.set('[data-reveal]', { y: 44, opacity: 0 });
  ScrollTrigger.batch('[data-reveal]', {
    start: 'top 90%',
    once: true,
    onEnter: (batch) => gsap.to(batch, { y: 0, opacity: 1, duration: 1, ease: 'power3.out', stagger: 0.1, overwrite: true }),
  });

  /* ---------- Hero: inclinación 3D con el cursor ---------- */
  if (finePointer) {
    const title = $('.hero__title');
    const rx = gsap.quickTo(title, 'rotationX', { duration: 0.8, ease: 'power3' });
    const ry = gsap.quickTo(title, 'rotationY', { duration: 0.8, ease: 'power3' });
    addEventListener('pointermove', (e) => {
      if (scrollY > innerHeight) return;
      ry(((e.clientX / innerWidth) - 0.5) * 8);
      rx(-((e.clientY / innerHeight) - 0.5) * 6);
    }, { passive: true });
  }

  /* ---------- Cursor personalizado ---------- */
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
  }

  /* ---------- Botones magnéticos ---------- */
  if (finePointer) {
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

    // Luz que sigue al cursor dentro de las tarjetas del stack
    $$('[data-spot]').forEach((card) => {
      card.addEventListener('pointermove', (e) => {
        const r = card.getBoundingClientRect();
        card.style.setProperty('--mx', `${e.clientX - r.left}px`);
        card.style.setProperty('--my', `${e.clientY - r.top}px`);
      });
    });
  }

  /* ---------- Manifiesto: palabras que se encienden ---------- */
  const words = splitWords($('[data-words]'));
  const manifestoST = ScrollTrigger.create({
    trigger: '.manifesto',
    start: 'top top',
    end: '+=130%',
    pin: true,
    animation: gsap
      .timeline({ defaults: { ease: 'none' } })
      .to(words, { opacity: 1, stagger: 0.16, duration: 0.3 })
      .fromTo('.manifesto__sub', { opacity: 0.1, y: 24 }, { opacity: 1, y: 0, duration: 1.6 }, '>-0.8'),
    scrub: true,
  });
  gsap.set('.manifesto__sub', { opacity: 0.1, y: 24 });

  /* ---------- Números ---------- */
  $$('[data-count]').forEach((el) => {
    const target = Number(el.dataset.count);
    const o = { v: 0 };
    ScrollTrigger.create({
      trigger: el,
      start: 'top 90%',
      once: true,
      onEnter: () =>
        gsap.to(o, {
          v: target,
          duration: 1.8,
          ease: 'power3.out',
          onUpdate: () => (el.textContent = String(Math.round(o.v)).padStart(2, '0')),
        }),
    });
  });

  /* ---------- El recorrido (túnel de proyectos) ---------- */
  const tunnel = $('#proyectos');
  const scenes = $$('.scene', tunnel);
  const N = scenes.length;
  const D = N - 0.4;
  const sceneHue = scenes.map((s) => Number(s.dataset.hue));

  const tl = gsap.timeline({ defaults: { ease: 'none' } });
  scenes.forEach((s, i) => {
    const ghost = $('.scene__ghost', s);
    // Entrada: la escena llega desde el fondo, justo cuando la anterior ya casi se fue
    if (i > 0) tl.fromTo(s, { scale: 0.7, autoAlpha: 0 }, { scale: 1, autoAlpha: 1, duration: 0.3, ease: 'power2.out' }, i - 0.3);
    else gsap.set(s, { scale: 1, autoAlpha: 1 });
    // Salida: se acerca a la cámara y se desvanece rápido para no tapar a la siguiente
    if (i < N - 1) {
      tl.to(s, { scale: 1.5, duration: 0.4, ease: 'power2.in' }, i + 0.6);
      tl.to(s, { autoAlpha: 0, duration: 0.25, ease: 'power1.in' }, i + 0.6);
    }
    if (ghost) tl.fromTo(ghost, { scale: 0.7 }, { scale: 1.4, duration: 1.3 }, i - 0.3);
  });
  tl.to({}, { duration: 0.6 }, N - 1);

  // HUD
  const hudList = $('.hud__list');
  const hudCount = $('.hud__count b');
  const hudBar = $('.hud__bar i');
  const hudBtns = scenes.slice(1).map((s, k) => {
    const li = document.createElement('li');
    const b = document.createElement('button');
    b.type = 'button';
    b.dataset.hover = '';
    b.textContent = s.dataset.title;
    b.addEventListener('click', () => goToScene(k + 1));
    li.appendChild(b);
    hudList.appendChild(li);
    return b;
  });

  let activeIdx = -1;
  const setActive = (idx) => {
    if (idx === activeIdx) return;
    activeIdx = idx;
    state.hueT = sceneHue[idx];
    hudCount.textContent = String(idx).padStart(2, '0');
    hudBtns.forEach((b, k) => b.classList.toggle('is-active', k + 1 === idx));
  };

  const tunnelST = ScrollTrigger.create({
    trigger: tunnel,
    start: 'top top',
    end: () => '+=' + Math.round(innerHeight * D * 0.95),
    pin: true,
    scrub: 0.4,
    animation: tl,
    invalidateOnRefresh: true,
    onToggle: (self) => {
      state.tunnelOn = self.isActive;
    },
    onUpdate: (self) => {
      state.tp = self.progress;
      hudBar.style.transform = `scaleX(${self.progress.toFixed(4)})`;
      setActive(Math.max(0, Math.min(N - 1, Math.round(self.progress * D))));
    },
  });

  function goToScene(i) {
    const y = tunnelST.start + (i / D) * (tunnelST.end - tunnelST.start);
    scrollToY(y);
  }

  // Inclinación 3D de la tarjeta activa con el cursor
  if (finePointer) {
    const setters = scenes.map((s) => {
      const t = $('.scene__tilt', s);
      return t ? { rx: gsap.quickTo(t, 'rotationX', { duration: 0.7, ease: 'power3' }), ry: gsap.quickTo(t, 'rotationY', { duration: 0.7, ease: 'power3' }) } : null;
    });
    tunnel.addEventListener('pointermove', (e) => {
      const nx = (e.clientX / innerWidth - 0.5) * 2;
      const ny = (e.clientY / innerHeight - 0.5) * 2;
      setters.forEach((s) => {
        if (!s) return;
        s.ry(nx * 8);
        s.rx(-ny * 6);
      });
    });
  }

  /* ---------- Colores del fondo por sección + navegación activa ---------- */
  const sectionHue = { hero: 268, sobre: 286, servicios: 320, stack: 262, contacto: 326 };
  Object.entries(sectionHue).forEach(([id, hue]) => {
    const el = document.getElementById(id);
    if (!el) return;
    ScrollTrigger.create({
      trigger: el,
      start: 'top 55%',
      end: 'bottom 55%',
      onToggle: (self) => self.isActive && (state.hueT = hue),
    });
  });
  // Al volver al túnel desde el stack, restaurar el tono de la escena activa
  ScrollTrigger.create({
    trigger: tunnel,
    start: 'top top',
    end: () => tunnelST.end,
    onToggle: (self) => self.isActive && (state.hueT = sceneHue[Math.max(0, activeIdx)]),
  });

  const navLinks = $$('[data-nav]');
  const setNav = (id) => {
    if (id === lastNav) return;
    lastNav = id;
    navLinks.forEach((a) => a.classList.toggle('is-active', a.dataset.nav === id));
  };
  const order = ['hero', 'sobre', 'proyectos', 'stack', 'contacto'];
  order.forEach((id, i) => {
    ScrollTrigger.create({
      trigger: document.getElementById(id),
      start: 'top 55%',
      onEnter: () => setNav(id),
      onLeaveBack: () => setNav(order[i - 1] || ''),
    });
  });

  /* ---------- Anclas con scroll suave ---------- */
  function scrollToY(y) {
    if (lenis) lenis.scrollTo(y, { duration: 1.6, easing: (t) => 1 - Math.pow(1 - t, 4) });
    else scrollTo({ top: y, behavior: 'smooth' });
  }

  const anchorY = (id) => {
    if (id === 'hero') return 0;
    if (id === 'sobre') return manifestoST.start;
    if (id === 'proyectos') return tunnelST.start;
    const el = document.getElementById(id);
    return el ? el.getBoundingClientRect().top + scrollY : null;
  };

  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    const id = a.getAttribute('href').slice(1);
    const y = anchorY(id);
    if (y === null) return;
    e.preventDefault();
    scrollToY(y);
  });

  /*-----------------------------------*\
    SECUENCIA DE ENTRADA
  \*-----------------------------------*/

  const pre = $('.pre');
  const preNum = $('.pre__num');
  const preBar = $('.pre__bar i');

  const counter = new Promise((res) => {
    const o = { v: 0 };
    gsap.to(o, {
      v: 100,
      duration: 1.6,
      ease: 'power2.inOut',
      onUpdate: () => {
        preNum.textContent = String(Math.round(o.v)).padStart(3, '0');
        preBar.style.transform = `scaleX(${(o.v / 100).toFixed(3)})`;
      },
      onComplete: res,
    });
  });
  const fontsReady = Promise.race([
    document.fonts ? document.fonts.ready : Promise.resolve(),
    new Promise((r) => setTimeout(r, 3000)),
  ]);

  Promise.all([counter, fontsReady]).then(() => {
    const t = gsap.timeline({
      onComplete: () => {
        pre.remove();
        heroLines.forEach((l) => l.classList.remove('is-masked'));
        bounceOnHover(heroChars);
        root.classList.remove('is-loading');
        if (lenis) lenis.start();
        ScrollTrigger.refresh();

        // Al hacer scroll, las letras del hero se dispersan
        gsap.to(heroChars, {
          yPercent: () => gsap.utils.random(-40, -110),
          rotation: () => gsap.utils.random(-22, 22),
          opacity: 0,
          ease: 'none',
          stagger: { each: 0.02, from: 'random' },
          scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom 25%', scrub: true },
        });
        gsap.to('.hero__role, .badge', {
          opacity: 0,
          y: -60,
          ease: 'none',
          scrollTrigger: { trigger: '.hero', start: '10% top', end: '60% top', scrub: true },
        });
        gsap.delayedCall(2.4, swapNext);
      },
    });

    t.to('.pre__inner', { opacity: 0, y: -30, duration: 0.35, ease: 'power2.in' })
      .to(pre, { yPercent: -100, duration: 1.1, ease: 'expo.inOut' }, '>-0.05')
      .fromTo(state, { intro: 0.25 }, { intro: 1, duration: 2.4, ease: 'power2.out' }, '<')
      .to(heroChars, { yPercent: 0, rotation: 0, duration: 1.2, stagger: 0.05, ease: 'expo.out' }, '<0.55')
      .to('.nav > *', { y: 0, opacity: 1, duration: 0.9, stagger: 0.1, ease: 'power3.out' }, '<0.3')
      .to('.hero__role', { y: 0, opacity: 1, duration: 0.9, ease: 'power3.out' }, '<0.25')
      .to('.badge', { scale: 1, opacity: 1, rotation: 0, duration: 1.2, ease: 'back.out(1.5)' }, '<0.1')
      .to('.hero__top, .hero__bottom', { opacity: 1, duration: 0.9 }, '<0.2');
  });
})();
