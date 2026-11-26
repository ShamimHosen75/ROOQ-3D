import { gsap, $, $$, reduced, lenisNow, scrollTo } from './core.js';

/* ---------- header + mobile menu ---------- */
export function setupNav({ home = false } = {}) {
  const nav = $('.nav');
  const links = $('.nav__links');
  const menu = $('.menu');
  const burger = $('.burger');
  let open = false;
  let prevOverflow = '';

  const setMode = (mode, leaving) => {
    nav.classList.toggle('is-hero', mode === 'hero');
    nav.classList.toggle('is-top', mode === 'top');
    nav.classList.toggle('is-solid', mode === 'solid');
    nav.classList.toggle('is-hidden', mode === 'hidden');
    nav.classList.toggle('is-leaving', leaving);
    const hide = mode === 'hero' && !open;
    links.toggleAttribute('inert', hide);
    links.setAttribute('aria-hidden', String(hide));
  };
  let last = window.scrollY;
  const onScroll = () => {
    const y = window.scrollY;
    if (home) {
      const pinH = document.getElementById('top')?.parentElement?.offsetHeight ?? window.innerHeight;
      const edge = pinH - window.innerHeight * 0.5;
      setMode(y < edge ? 'hero' : y > last ? 'hidden' : 'solid', y > edge - window.innerHeight * 0.5 + 30);
    } else setMode(y < 60 ? 'top' : y > last ? 'hidden' : 'solid', false);
    last = y;
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  const setOpen = (v) => {
    open = v;
    nav.classList.toggle('is-open', v);
    menu.classList.toggle('is-open', v);
    menu.toggleAttribute('inert', !v);
    menu.setAttribute('aria-hidden', String(!v));
    burger.setAttribute('aria-expanded', String(v));
    $$('a', menu).forEach((a, i) => (a.style.transitionDelay = v ? `${120 + i * 70}ms` : '0ms'));
    const l = lenisNow();
    if (v) {
      l?.stop();
      prevOverflow = document.documentElement.style.overflow;
      document.documentElement.style.overflow = 'hidden';
    } else {
      l?.start();
      document.documentElement.style.overflow = prevOverflow;
    }
    onScroll();
  };
  burger.addEventListener('click', () => setOpen(!open));
  window.addEventListener('keydown', (e) => e.key === 'Escape' && open && setOpen(false));
  window.matchMedia('(min-width: 768px)').addEventListener('change', (e) => e.matches && open && setOpen(false));

  // same-page anchors scroll smoothly; links to other pages leave through the curtain
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href]');
    if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || a.target === '_blank') return;
    if (a.hasAttribute('data-top')) {
      e.preventDefault();
      scrollTo(0, { duration: 2 });
      return;
    }
    const url = new URL(a.href, location.href);
    if (url.origin !== location.origin || url.protocol.startsWith('mailto') || url.protocol.startsWith('tel')) return;
    const path = (p) => p.replace(/index\.html$/, '');
    const samePage = path(url.pathname) === path(location.pathname) && url.search === location.search;
    if (samePage) {
      e.preventDefault();
      if (open) setOpen(false);
      document.documentElement.style.overflow = '';
      lenisNow()?.start();
      if (url.hash && document.querySelector(url.hash)) scrollTo(url.hash);
      else if (!url.hash) scrollTo(0);
      return;
    }
    e.preventDefault();
    leaveTo(url.href);
  });
  window.addEventListener('pageshow', (e) => e.persisted && $('.curtain')?.classList.remove('is-on'));
}

export function leaveTo(href) {
  let c = $('.curtain');
  if (!c) {
    c = document.createElement('div');
    c.className = 'curtain';
    c.innerHTML = '<svg><use href="#lotus" /></svg>';
    document.body.appendChild(c);
  }
  if (reduced()) {
    window.location.assign(href);
    return;
  }
  requestAnimationFrame(() => c.classList.add('is-on'));
  setTimeout(() => window.location.assign(href), 560);
}

/* ---------- loader ---------- */
export function finishLoader() {
  $('.loader').classList.add('is-done');
}

/* ---------- custom scrollbar ---------- */
export function setupScrollbar() {
  const thumb = $('.sbar__thumb');
  const place = () => {
    const vh = window.innerHeight;
    const max = document.documentElement.scrollHeight - vh;
    const h = Math.max(36, (vh / (max + vh)) * vh);
    const y = max > 0 ? (window.scrollY / max) * (vh - h) : 0;
    thumb.style.height = `${h}px`;
    thumb.style.transform = `translate3d(0, ${y}px, 0)`;
  };
  let drag = false;
  let y0 = 0;
  let s0 = 0;
  thumb.addEventListener('pointerdown', (e) => {
    drag = true;
    y0 = e.clientY;
    s0 = window.scrollY;
    thumb.setPointerCapture(e.pointerId);
    e.preventDefault();
  });
  thumb.addEventListener('pointermove', (e) => {
    if (!drag) return;
    const vh = window.innerHeight;
    const max = document.documentElement.scrollHeight - vh;
    const to = s0 + ((e.clientY - y0) / (vh - thumb.offsetHeight)) * max;
    const l = lenisNow();
    if (l) l.scrollTo(to, { immediate: true });
    else window.scrollTo(0, to);
  });
  thumb.addEventListener('pointerup', () => (drag = false));
  place();
  window.addEventListener('scroll', place, { passive: true });
  window.addEventListener('resize', place);
  new ResizeObserver(place).observe(document.body);
}

/* ---------- petal cursor ---------- */
export function setupCursor() {
  if (!window.matchMedia('(pointer: fine)').matches || reduced()) return;
  const petal = $('.pc--petal');
  const grab = $('.pc--grab');
  const dot = $('.pc--dot');
  const open = $('.pc__open');
  const closed = $('.pc__closed');
  document.documentElement.classList.add('petal-cursor');

  const target = { x: -100, y: -100, seen: false };
  const pos = { x: -100, y: -100, vx: 0, vy: 0 };
  let rot = -18;
  let scrollMix = 0;
  let speedMix = 0;
  let tiltX = 0;
  let tiltY = 0;
  let pressed = 0;
  let hover = 0;
  let hoverT = 0;
  let frame = 0;
  let lastY = window.scrollY;

  window.addEventListener(
    'pointermove',
    (e) => {
      target.x = e.clientX;
      target.y = e.clientY;
      if (!target.seen) {
        target.seen = true;
        pos.x = target.x;
        pos.y = target.y;
        petal.style.opacity = '1';
      }
    },
    { passive: true },
  );
  window.addEventListener('pointerdown', () => (pressed = 1));
  window.addEventListener('pointerup', () => (pressed = 0));
  document.documentElement.addEventListener('pointerleave', () => {
    petal.style.opacity = '0';
    target.seen = false;
  });

  const CLICKABLE = 'a[href], button, [role="button"], [role="tab"], input, select, textarea, label, summary, [data-clickable]';
  gsap.ticker.add((_, deltaMs) => {
    const dt = Math.min(deltaMs, 50) / 1000;
    const sy = window.scrollY;
    const sv = (sy - lastY) / Math.max(dt, 0.001);
    lastY = sy;
    const speed = Math.abs(lenisNow()?.velocity ?? 0) * 60 + Math.abs(sv) * 0.02;
    const sm = Math.min(1, speed / 900);
    scrollMix += (sm - scrollMix) * (sm > scrollMix ? 0.18 : 0.045);
    const t = performance.now() / 1000;
    const px = pos.x;
    const py = pos.y;
    pos.vx += ((target.x - pos.x) * 260 - pos.vx * 15) * dt;
    pos.vy += ((target.y - pos.y) * 260 - pos.vy * 15) * dt;
    pos.x += pos.vx * dt;
    pos.y += pos.vy * dt;
    const vx = (pos.x - px) / Math.max(dt, 0.001);
    const vy = (pos.y - py) / Math.max(dt, 0.001);
    const v = Math.hypot(vx, vy);
    speedMix += (Math.min(1, v / 1400) - speedMix) * (v / 1400 > speedMix ? 0.25 : 0.06);
    const bobX = Math.sin(t * 4.2) * 10 * scrollMix;
    const bobY = Math.sin(t * 5.6 + 1) * 5 * scrollMix + scrollMix * 6;
    const squash = 1 - 0.55 * scrollMix * Math.abs(Math.sin(t * 3.4));
    const lean = Math.max(-40, Math.min(40, vx * 0.03));
    const flutter = Math.sin(t * 9) * 9 * speedMix;
    const goal = -18 + lean + Math.max(-22, Math.min(22, vy * 0.012)) + Math.sin(t * 4.2 + 0.6) * 28 * scrollMix + flutter;
    rot += (goal - rot) * 0.22;
    tiltY += (Math.max(-60, Math.min(60, vx * 0.045)) - tiltY) * 0.18;
    tiltX += (Math.max(-60, Math.min(60, -vy * 0.045)) - tiltX) * 0.18;
    const sc = (1 - 0.16 * pressed) * (1 - 0.45 * hover);
    if (!(frame++ & 3) && target.seen) {
      const el = document.elementFromPoint(target.x, target.y);
      hoverT = el && el.closest(CLICKABLE) && !el.closest('[data-no-dot]') ? 1 : 0;
    }
    hover += (hoverT - hover) * (1 - Math.exp(-dt * 16));
    const bc = document.body.style.cursor;
    const g = bc === 'grabbing' ? 2 : bc === 'grab' ? 1 : 0;
    petal.style.visibility = g ? 'hidden' : 'visible';
    petal.style.opacity = target.seen ? String(Math.max(0, 1 - hover * 1.25)) : '0';
    dot.style.opacity = target.seen && !g ? String(Math.min(0.82, hover * 1.25)) : '0';
    dot.style.transform = `translate3d(${pos.x - 8}px, ${pos.y - 8}px, 0) scale(${(0.35 + 0.65 * hover) * (1 - 0.18 * pressed)})`;
    grab.style.visibility = g ? 'visible' : 'hidden';
    open.style.display = g === 1 ? 'block' : 'none';
    closed.style.display = g === 2 ? 'block' : 'none';
    grab.style.transform = `translate3d(${(target.seen ? pos.x : -100) - 17}px, ${(target.seen ? pos.y : -100) - 17}px, 0)`;
    petal.style.transform = `translate3d(${(pos.x + bobX).toFixed(1)}px, ${(pos.y + bobY).toFixed(1)}px, 0) perspective(260px) rotateX(${tiltX.toFixed(1)}deg) rotateY(${tiltY.toFixed(1)}deg) rotate(${rot.toFixed(1)}deg) scale(${sc.toFixed(3)}, ${(sc * squash).toFixed(3)})`;
  });
}
