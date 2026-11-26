import '../css/main.css';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import { split } from './split.js';
import { DRAPES, swatchDataURL } from './drapes.js';
import { Silk } from './silk.js';
import { HeroPetals } from './heroPetals.js';
import { Playground } from './playground.js';
import { Viewer } from './viewer.js';

gsap.registerPlugin(ScrollTrigger);

const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
document.body.classList.add('is-loading');

/* ---------------- Smooth scroll ---------------- */
let lenis = null;
if (!reduced) {
  lenis = new Lenis({ lerp: 0.085, wheelMultiplier: 0.9 });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
  lenis.stop();
}
const scrollTo = (target, opts = {}) => {
  if (lenis) lenis.scrollTo(target, { duration: 1.6, easing: (t) => 1 - Math.pow(1 - t, 4), ...opts });
  else {
    const y = typeof target === 'number' ? target : $(target).getBoundingClientRect().top + window.scrollY;
    window.scrollTo({ top: y });
  }
};

/* ---------------- Cursor ---------------- */
const cursor = (() => {
  const el = $('.cursor');
  const ring = $('.cursor__ring');
  const dot = $('.cursor__dot');
  const label = $('.cursor__label');
  const pos = { x: innerWidth / 2, y: innerHeight / 2 };
  const ringPos = { ...pos };
  window.addEventListener('pointermove', (e) => {
    pos.x = e.clientX;
    pos.y = e.clientY;
    dot.style.transform = `translate(${pos.x}px, ${pos.y}px) translate(-50%, -50%)`;
  });
  gsap.ticker.add(() => {
    ringPos.x += (pos.x - ringPos.x) * 0.18;
    ringPos.y += (pos.y - ringPos.y) * 0.18;
    ring.style.transform = `translate(${ringPos.x}px, ${ringPos.y}px) translate(-50%, -50%)`;
  });
  document.addEventListener('pointerover', (e) => {
    if (el.classList.contains('is-hover') || el.classList.contains('is-hold')) return;
    el.classList.toggle('is-link', !!e.target.closest('a, button, input'));
  });
  return {
    setState(state, text = '') {
      el.classList.remove('is-hover', 'is-hold', 'is-link');
      if (state !== 'default') el.classList.add(`is-${state}`);
      label.textContent = text;
    },
  };
})();

/* ---------------- Magnetic buttons ---------------- */
if (!reduced && matchMedia('(hover: hover)').matches) {
  $$('.btn, .menu-btn, .detail__close').forEach((b) => {
    b.addEventListener('pointermove', (e) => {
      const r = b.getBoundingClientRect();
      gsap.to(b, { x: (e.clientX - r.left - r.width / 2) * 0.25, y: (e.clientY - r.top - r.height / 2) * 0.3, duration: 0.5, ease: 'power3.out' });
    });
    b.addEventListener('pointerleave', () => gsap.to(b, { x: 0, y: 0, duration: 0.8, ease: 'elastic.out(1, 0.4)' }));
  });
}

/* ---------------- Menu ---------------- */
const menuBtn = $('.menu-btn');
const toggleMenu = (open = !document.body.classList.contains('menu-open')) => {
  document.body.classList.toggle('menu-open', open);
  menuBtn.setAttribute('aria-expanded', String(open));
  $('#menu').setAttribute('aria-hidden', String(!open));
  menuBtn.querySelector('span').textContent = open ? 'Close' : 'Menu';
  if (lenis) open ? lenis.stop() : lenis.start();
};
menuBtn.addEventListener('click', () => toggleMenu());

$$('[data-scroll-to]').forEach((a) =>
  a.addEventListener('click', (e) => {
    e.preventDefault();
    if (document.body.classList.contains('menu-open')) toggleMenu(false);
    scrollTo(a.dataset.scrollTo);
  }),
);

/* ---------------- WebGL scenes ---------------- */
const silk = new Silk($('.hero__silk'), { reduced });
const heroPetals = new HeroPetals($('.hero__petals'), { reduced });
let playground;
let viewer;

/* ---------------- Hero chapters ---------------- */
const chapters = $$('.chapter');
const chapterSplits = chapters.map((c) => split($('.chapter__title', c)));
const dots = $$('.hero__dots button');
const header = $('.header');
const heroNum = $('.hero__num span');
const darkChapters = new Set([2, 3, 4]);
let current = 0;

const setHeroInk = (i) => {
  const dark = darkChapters.has(i);
  gsap.to('.hero__pin', { '--hero-ink': dark ? '#f6ebe6' : '#2a1c19', duration: 0.8 });
  gsap.to('.hero__veil', { '--veil': dark ? 'rgba(10,6,6,0.55)' : 'rgba(246,235,230,0.78)', duration: 0.8 });
};

function showChapter(next, instant = false) {
  if (next === current && !instant) return;
  const prev = chapters[current];
  const nextEl = chapters[next];
  const dir = next > current ? 1 : -1;
  dots.forEach((d, i) => d.classList.toggle('is-active', i === next));
  setHeroInk(next);
  gsap.killTweensOf([...chapterSplits[current].chars, ...chapterSplits[next].chars]);
  if (prev !== nextEl) {
    const out = gsap.timeline({ onComplete: () => prev.classList.remove('is-active') });
    out.to(chapterSplits[current].chars, { yPercent: -110 * dir, rotate: -6 * dir, duration: reduced ? 0 : 0.55, stagger: 0.012, ease: 'power3.in' }, 0);
    out.to($$('.chapter__eyebrow, .rule, .chapter__text, .btn', prev), { autoAlpha: 0, y: -16 * dir, duration: reduced ? 0 : 0.4, stagger: 0.04 }, 0);
  }
  nextEl.classList.add('is-active');
  const tl = gsap.timeline({ delay: instant || reduced ? 0 : 0.3 });
  tl.fromTo(chapterSplits[next].chars, { yPercent: 110 * dir, rotate: 8 * dir }, { yPercent: 0, rotate: 0, duration: reduced ? 0 : 1.1, stagger: 0.025, ease: 'expo.out' }, 0);
  tl.fromTo($('.chapter__eyebrow', nextEl), { autoAlpha: 0, y: 14 * dir }, { autoAlpha: 0.75, y: 0, duration: 0.8 }, 0.1);
  tl.fromTo($('.rule', nextEl), { scaleX: 0, autoAlpha: 0.6 }, { scaleX: 1, autoAlpha: 0.6, duration: 1, ease: 'expo.out' }, 0.3);
  tl.fromTo($$('.chapter__text, .btn', nextEl), { autoAlpha: 0, y: 20 * dir }, { autoAlpha: 1, y: 0, duration: 0.9, stagger: 0.08, ease: 'power3.out' }, 0.35);
  gsap.fromTo(heroNum, { yPercent: 100 * dir }, { yPercent: 0, duration: reduced ? 0 : 1, ease: 'expo.out', onStart: () => (heroNum.textContent = String(next + 1).padStart(2, '0')) });
  current = next;
}
chapters.forEach((c, i) => {
  if (i !== 0) gsap.set($$('.chapter__eyebrow, .rule, .chapter__text, .btn', c), { autoAlpha: 0 });
});

let heroTrigger;
function setupHeroScroll() {
  heroTrigger = ScrollTrigger.create({
    trigger: '.hero',
    start: 'top top',
    end: 'bottom bottom',
    scrub: true,
    onUpdate: (self) => {
      const p = self.progress * (chapters.length - 1);
      silk.setPalette(p);
      gsap.set('.hero__dots-line b', { scaleY: self.progress });
      const idx = Math.min(chapters.length - 1, Math.round(p));
      if (idx !== current) showChapter(idx);
      const inHero = self.isActive || self.progress < 1;
      header.classList.toggle('is-light', inHero && darkChapters.has(idx));
      header.classList.toggle('in-hero', self.progress < 0.995);
      header.classList.toggle('is-solid', self.progress >= 0.995);
    },
  });
  dots.forEach((d, i) =>
    d.addEventListener('click', () => {
      const y = heroTrigger.start + (heroTrigger.end - heroTrigger.start) * (i / (chapters.length - 1));
      scrollTo(y + 2);
    }),
  );
  // hero recedes as the playground slides over it
  gsap.to('.hero__chapters, .hero__brand, .hero__dots, .hero__num', {
    yPercent: -30,
    autoAlpha: 0,
    ease: 'none',
    scrollTrigger: { trigger: '.drape', start: 'top bottom', end: 'top 30%', scrub: true },
  });
  ScrollTrigger.create({
    trigger: '.hero',
    start: 'top bottom',
    end: 'bottom top',
    onToggle: (self) => {
      silk.setActive(self.isActive);
      heroPetals.active = self.isActive;
    },
  });
}

/* ---------------- Pick a Drape ---------------- */
const detail = $('.detail');
let detailOpen = false;
let detailIndex = 0;

function fillDetail(d) {
  $('.detail__name').textContent = d.name;
  $('.detail__fabric').textContent = d.fabric;
  $('.detail__note').textContent = d.note;
  delete $('.detail__name').dataset.splitDone;
}

function openDetail(drape) {
  detailIndex = DRAPES.indexOf(drape);
  fillDetail(drape);
  detailOpen = true;
  detail.classList.add('is-open');
  document.body.classList.add('detail-open');
  detail.setAttribute('aria-hidden', 'false');
  lenis?.stop();
  header.classList.add('is-hidden');
  viewer.show(drape);
  const { chars } = split($('.detail__name'));
  const tl = gsap.timeline();
  tl.fromTo('.detail__backdrop', { opacity: 0 }, { opacity: 1, duration: reduced ? 0 : 0.7, ease: 'power2.out' }, 0);
  tl.fromTo('.detail__stage', { autoAlpha: 0, scale: 0.85 }, { autoAlpha: 1, scale: 1, duration: reduced ? 0 : 1, ease: 'expo.out' }, 0.1);
  tl.fromTo(chars, { yPercent: 110 }, { yPercent: 0, stagger: 0.02, duration: reduced ? 0 : 1, ease: 'expo.out' }, 0.25);
  tl.fromTo('.detail__info > *:not(.detail__name)', { autoAlpha: 0, y: 20 }, { autoAlpha: 1, y: 0, stagger: 0.06, duration: reduced ? 0 : 0.8, ease: 'power3.out' }, 0.3);
  tl.fromTo('.detail .rule', { scaleX: 0 }, { scaleX: 1, duration: 0.9, ease: 'expo.out' }, 0.45);
  setTimeout(() => $('.detail__close').focus(), 50);
}

function closeDetail() {
  if (!detailOpen) return;
  detailOpen = false;
  gsap.timeline({
    onComplete: () => {
      detail.classList.remove('is-open');
      document.body.classList.remove('detail-open');
      detail.setAttribute('aria-hidden', 'true');
      viewer.hide();
    },
  })
    .to('.detail__info > *', { autoAlpha: 0, y: -14, stagger: 0.03, duration: reduced ? 0 : 0.35 }, 0)
    .to('.detail__stage', { autoAlpha: 0, scale: 0.9, duration: reduced ? 0 : 0.5, ease: 'power2.in' }, 0)
    .to('.detail__backdrop', { opacity: 0, duration: reduced ? 0 : 0.6 }, 0.2);
  lenis?.start();
  header.classList.remove('is-hidden');
}

$('.detail__close').addEventListener('click', closeDetail);
$('.detail__backdrop').addEventListener('click', closeDetail);
$('[data-detail-next]').addEventListener('click', () => {
  const d = DRAPES[(detailIndex + 1) % DRAPES.length];
  gsap.to('.detail__info > *:not(.detail__close)', {
    autoAlpha: 0,
    x: -16,
    stagger: 0.03,
    duration: 0.3,
    onComplete: () => {
      detailIndex = DRAPES.indexOf(d);
      fillDetail(d);
      viewer.show(d);
      const { chars } = split($('.detail__name'));
      gsap.set('.detail__info > *', { x: 0 });
      gsap.fromTo(chars, { yPercent: 110 }, { yPercent: 0, stagger: 0.02, duration: 0.9, ease: 'expo.out' });
      gsap.fromTo('.detail__info > *:not(.detail__close)', { autoAlpha: 0, y: 14 }, { autoAlpha: 1, y: 0, stagger: 0.05, duration: 0.6 });
    },
  });
});
$('[data-detail-cta]').addEventListener('click', (e) => {
  e.preventDefault();
  closeDetail();
  setTimeout(() => scrollTo('#contact'), 300);
});
window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeDetail();
    if (document.body.classList.contains('menu-open')) toggleMenu(false);
  }
});

const filterBtns = $$('.filter');
function applyFilter(cat, scroll = false) {
  filterBtns.forEach((b) => b.classList.toggle('is-active', b.dataset.filter === cat));
  if (scroll) {
    const r = $('#drape').getBoundingClientRect();
    if (Math.abs(r.top) > 10) {
      scrollTo('#drape');
      setTimeout(() => playground.setFilter(cat), 1300);
      return;
    }
  }
  playground.setFilter(cat);
}
filterBtns.forEach((b) => b.addEventListener('click', () => applyFilter(b.dataset.filter, true)));
$$('[data-filter-link]').forEach((a) =>
  a.addEventListener('click', (e) => {
    e.preventDefault();
    applyFilter(a.dataset.filterLink, true);
  }),
);

function setupDrape() {
  playground = new Playground({
    container: $('.drape__stage'),
    dropZone: $('.dropzone'),
    cursor,
    reduced,
    onSelect: openDetail,
  });
  viewer = new Viewer($('.detail__stage'), { reduced });
  window.__rooq = { playground, viewer }; // handy for debugging in the console

  // on touch screens, only block scrolling when the finger lands on a drape
  playground.renderer.domElement.addEventListener(
    'touchstart',
    (e) => {
      if (playground.held) e.preventDefault();
    },
    { passive: false },
  );
  playground.renderer.domElement.addEventListener(
    'touchmove',
    (e) => {
      if (playground.held) e.preventDefault();
    },
    { passive: false },
  );

  const { chars } = split($('.drape__title'));
  gsap.set(chars, { yPercent: 110 });
  ScrollTrigger.create({
    trigger: '.drape',
    start: 'top 55%',
    once: true,
    onEnter: () => {
      playground.start();
      gsap.to(chars, { yPercent: 0, stagger: 0.03, duration: 1.2, ease: 'expo.out' });
      gsap.from('.drape .rule', { scaleX: 0, duration: 1.2, ease: 'expo.out', delay: 0.3 });
      gsap.from('.drape__sub, .drape__foot > *, .drape__hint', { autoAlpha: 0, y: 20, stagger: 0.08, duration: 1, delay: 0.4 });
      gsap.from('.dropzone', { autoAlpha: 0, y: 40, rotateX: 70, duration: 1.4, ease: 'expo.out', delay: 0.8 });
    },
  });
  ScrollTrigger.create({
    trigger: '.drape',
    start: 'top bottom',
    end: 'bottom top',
    onToggle: (self) => playground.setActive(self.isActive),
  });
  // the camera drifts gently as you scroll past
  gsap.fromTo(
    '.drape__stage',
    { yPercent: -6 },
    { yPercent: 6, ease: 'none', scrollTrigger: { trigger: '.drape', start: 'top bottom', end: 'bottom top', scrub: true } },
  );
}

/* ---------------- The Edit (horizontal gallery) ---------------- */
function setupEdit() {
  const track = $('.edit__track');
  track.innerHTML = DRAPES.map(
    (d, i) => `
    <article class="card" data-i="${i}">
      <div class="card__media">
        <span class="card__tag">${d.category}</span>
        <img src="${swatchDataURL(d)}" alt="${d.name} fabric swatch" loading="lazy" />
        <h3 class="card__title">${d.name}</h3>
      </div>
      <div class="card__meta"><span>${d.fabric}</span><button data-view="${i}">View in 3D →</button></div>
    </article>`,
  ).join('') + '<div class="card__index">06</div>';

  $$('.card', track).forEach((card) => {
    const media = $('.card__media', card);
    card.addEventListener('pointermove', (e) => {
      if (reduced) return;
      const r = media.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width;
      const y = (e.clientY - r.top) / r.height;
      media.style.transform = `rotateY(${(x - 0.5) * 14}deg) rotateX(${(0.5 - y) * 12}deg) translateZ(10px)`;
      media.style.setProperty('--mx', `${x * 100}%`);
      media.style.setProperty('--my', `${y * 100}%`);
    });
    card.addEventListener('pointerleave', () => {
      media.style.transform = '';
    });
  });
  $$('[data-view]', track).forEach((b) => b.addEventListener('click', () => openDetail(DRAPES[+b.dataset.view])));

  const head = split($('.edit__head h2'));
  gsap.fromTo(head.chars, { yPercent: 110 }, {
    yPercent: 0,
    stagger: 0.015,
    duration: 1.1,
    ease: 'expo.out',
    scrollTrigger: { trigger: '.edit', start: 'top 60%' },
  });

  const distance = () => track.scrollWidth - window.innerWidth;
  const tween = gsap.to(track, {
    x: () => -distance(),
    ease: 'none',
    scrollTrigger: {
      trigger: '.edit',
      start: 'top top',
      end: 'bottom bottom',
      scrub: reduced ? true : 0.6,
      invalidateOnRefresh: true,
      onUpdate: (self) => gsap.set('.edit__progress i', { scaleX: self.progress }),
    },
  });
  // inner parallax: each swatch slides against the track
  $$('.card img', track).forEach((img) => {
    gsap.fromTo(
      img,
      { xPercent: -6 },
      { xPercent: 6, ease: 'none', scrollTrigger: { trigger: img.closest('.card'), containerAnimation: tween, start: 'left right', end: 'right left', scrub: true } },
    );
  });
  // cards rise in as they enter from the right
  $$('.card', track).forEach((card) => {
    gsap.fromTo(card, { y: 80, rotate: 4, autoAlpha: 0.2 }, {
      y: 0,
      rotate: 0,
      autoAlpha: 1,
      ease: 'power2.out',
      scrollTrigger: { trigger: card, containerAnimation: tween, start: 'left 100%', end: 'left 65%', scrub: true },
    });
  });
}

/* ---------------- Craft / marquee / footer ---------------- */
function setupCraft() {
  const { words } = split($('.craft__statement'));
  gsap.to(words, {
    opacity: 1,
    stagger: 0.1,
    ease: 'none',
    scrollTrigger: { trigger: '.craft__statement', start: 'top 80%', end: 'bottom 45%', scrub: true },
  });
  $$('[data-count]').forEach((el) => {
    const o = { v: 0 };
    gsap.to(o, {
      v: +el.dataset.count,
      duration: reduced ? 0 : 2.2,
      ease: 'power3.out',
      scrollTrigger: { trigger: el, start: 'top 85%' },
      onUpdate: () => (el.textContent = Math.round(o.v)),
    });
  });

  const row = $('.marquee__row');
  if (!reduced) {
    const loop = gsap.to(row, { xPercent: -50, duration: 28, ease: 'none', repeat: -1 });
    lenis?.on('scroll', ({ velocity }) => {
      const v = gsap.utils.clamp(-6, 6, velocity / 6);
      gsap.to(loop, { timeScale: v < 0 ? -1 + v : 1 + v, duration: 0.3, overwrite: true });
    });
    gsap.to(row, { skewX: -6, scrollTrigger: { trigger: '.marquee', start: 'top bottom', end: 'bottom top', scrub: true } });
  }

  const foot = split($('.footer h2'));
  gsap.fromTo(foot.chars, { yPercent: 110 }, { yPercent: 0, stagger: 0.02, duration: 1.1, ease: 'expo.out', scrollTrigger: { trigger: '.footer', start: 'top 70%' } });
  gsap.fromTo('.footer__word span', { yPercent: 100, rotate: 8 }, {
    yPercent: 0,
    rotate: 0,
    stagger: 0.08,
    duration: 1.4,
    ease: 'expo.out',
    scrollTrigger: { trigger: '.footer__word', start: 'top 95%' },
  });
  $('.footer').addEventListener('pointermove', (e) => {
    $('.footer__word').style.setProperty('--fx', `${(e.clientX / innerWidth) * 100}%`);
  });
  ScrollTrigger.create({
    trigger: '.footer',
    start: 'top 60px',
    end: 'bottom top',
    onToggle: (self) => header.classList.toggle('is-light', self.isActive),
  });
}

/* ---------------- Render loop ---------------- */
function loop(time) {
  silk.tick();
  heroPetals.tick(time);
  playground?.tick();
  viewer?.tick(time);
}

/* ---------------- Loader → intro ---------------- */
function intro() {
  const tl = gsap.timeline();
  const count = { v: 0 };
  tl.to('.loader__word span', { yPercent: -110, duration: 0.01 })
    .fromTo('.loader__word span', { yPercent: 110 }, { yPercent: 0, stagger: 0.08, duration: 1, ease: 'expo.out' })
    .from('.loader__mark', { autoAlpha: 0, scale: 0.6, duration: 0.8 }, 0.2)
    .to(count, { v: 100, duration: reduced ? 0.2 : 1.6, ease: 'power2.inOut', onUpdate: () => {
      $('.loader__count').textContent = Math.round(count.v);
      gsap.set('.loader__bar i', { scaleX: count.v / 100 });
    } }, 0.2)
    .add(() => {
      // heavy setup happens behind the loader
      setupDrape();
      setupEdit();
      setupCraft();
      setupHeroScroll();
      ScrollTrigger.refresh();
    })
    .to('.loader__word span', { yPercent: -110, stagger: 0.05, duration: 0.6, ease: 'power3.in' }, '+=0.15')
    .to('.loader__meta, .loader__bar, .loader__mark', { autoAlpha: 0, duration: 0.4 }, '<')
    .to('.loader', { clipPath: 'inset(0 0 100% 0)', duration: 1.1, ease: 'expo.inOut' })
    .add(() => {
      document.body.classList.remove('is-loading');
      $('.loader').remove();
      lenis?.start();
    })
    .fromTo('.header', { yPercent: -100, autoAlpha: 0 }, { yPercent: 0, autoAlpha: 1, duration: 1, ease: 'expo.out', clearProps: 'transform' }, '-=0.6')
    .to('.hero__brand', { autoAlpha: 1, duration: 1 }, '-=0.8')
    .fromTo('.hero__dots button', { scale: 0 }, { scale: 1, stagger: 0.06, duration: 0.6, ease: 'back.out(3)', clearProps: 'transform' }, '-=0.8')
    .add(() => showChapter(0, true), '-=1');
}

window.scrollTo(0, 0);
if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
gsap.ticker.add(loop);
document.fonts.ready.then(intro);
