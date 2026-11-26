import '../css/main.css';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { split } from './split.js';
import { HeroSlider } from './heroSlider.js';
import { HeroPetals } from './heroPetals.js';
import { Playground } from './playground.js';
import { Viewer } from './viewer.js';
import { setupCollection } from './collection.js';
import { setupReviews } from './reviewsSection.js';
import { initSite, lenis, cursor, scrollTo, reduced, $, $$, reveals } from './shared.js';

const { header: siteHeader } = initSite({ page: 'home' });

// Hero images: replace the files in public/images with your own photos (same names).
const SLIDES = [
  { image: '/images/hero-1.jpg', gold: '#e2b45a' },
  { image: '/images/hero-2.jpg', gold: '#f0d38a' },
  { image: '/images/hero-3.jpg', gold: '#e9c46a' },
  { image: '/images/hero-4.jpg', gold: '#e8bf62' },
  { image: '/images/hero-5.jpg', gold: '#f3d27a' },
];

/* ---------------- Hero ---------------- */
const slides = $$('.slide');
const dots = $$('.dots button');
const parts = slides.map((s) => ({
  eyebrow: $('.slide__eyebrow', s),
  title: split($('.slide__title', s)).chars,
  rule: $('.slide__rule', s),
  text: split($('.slide__text', s)).chars,
  btn: $('.btn', s),
}));
slides.forEach((s, i) => {
  const p = parts[i];
  gsap.set(p.title, { yPercent: 105, opacity: 0 });
  gsap.set(p.text, { opacity: 0 });
  gsap.set([p.eyebrow, p.btn], { autoAlpha: 0 });
  gsap.set(p.rule, { scaleX: 0 });
});

let current = -1;
function textIn(i, delay = 0) {
  const p = parts[i];
  slides[i].classList.add('is-active');
  const d = reduced ? 0 : 1;
  const tl = gsap.timeline({ delay: delay * d });
  tl.fromTo(p.eyebrow, { autoAlpha: 0, y: 8 }, { autoAlpha: 1, y: 0, duration: 0.8 * d, ease: 'power2.out' }, 0);
  // title: letters rise one after another, out of a soft blur
  tl.fromTo(
    p.title,
    { yPercent: 105, opacity: 0, filter: 'blur(6px)' },
    { yPercent: 0, opacity: 1, filter: 'blur(0px)', duration: 0.9 * d, stagger: 0.07 * d, ease: 'power3.out' },
    0.15,
  );
  tl.fromTo(p.rule, { scaleX: 0 }, { scaleX: 1, duration: 0.8 * d, ease: 'expo.out' }, 0.5);
  // paragraph: typed in letter by letter
  tl.fromTo(p.text, { opacity: 0, y: 4 }, { opacity: 1, y: 0, duration: 0.35 * d, stagger: 0.022 * d, ease: 'none' }, 0.55);
  tl.fromTo(p.btn, { autoAlpha: 0, y: 10 }, { autoAlpha: 1, y: 0, duration: 0.8 * d, ease: 'power2.out' }, 1.1);
  return tl;
}
function textOut(i) {
  const p = parts[i];
  const d = reduced ? 0 : 1;
  gsap.killTweensOf([p.title, p.text, p.eyebrow, p.btn, p.rule]);
  return gsap
    .timeline({ onComplete: () => slides[i].classList.remove('is-active') })
    .to(p.title, { opacity: 0, filter: 'blur(6px)', x: -10, duration: 0.45 * d, stagger: 0.02 * d, ease: 'power2.in' }, 0)
    .to([p.eyebrow, p.btn], { autoAlpha: 0, duration: 0.35 * d }, 0)
    .to(p.text, { opacity: 0, duration: 0.3 * d }, 0)
    .to(p.rule, { scaleX: 0, duration: 0.4 * d }, 0)
    .set(p.title, { x: 0 });
}

let slider;
function showSlide(i) {
  if (i === current) return;
  const prev = current;
  current = i;
  dots.forEach((d, k) => d.classList.toggle('is-active', k === i));
  if (prev >= 0) textOut(prev);
  slider.goTo(i);
  textIn(i, prev >= 0 ? 1.15 : 0.2);
}

const heroPetals = new HeroPetals($('.hero__petals'), { reduced });
let heroTrigger;

function setupHero() {
  heroTrigger = ScrollTrigger.create({
    trigger: '.hero',
    start: 'top top',
    end: 'bottom bottom',
    snap: reduced
      ? undefined
      : { snapTo: 1 / (SLIDES.length - 1), duration: { min: 0.4, max: 0.9 }, delay: 0.12, ease: 'power2.inOut', inertia: false },
    onUpdate: (self) => {
      const i = Math.min(SLIDES.length - 1, Math.round(self.progress * (SLIDES.length - 1)));
      showSlide(i);
    },
  });
  ScrollTrigger.create({
    trigger: '.hero',
    start: 'top bottom',
    end: 'bottom top',
    onToggle: (self) => {
      slider.active = self.isActive;
      heroPetals.active = self.isActive;
    },
  });
}
const slideY = (i) => heroTrigger.start + (heroTrigger.end - heroTrigger.start) * (i / (SLIDES.length - 1));
dots.forEach((d, i) => d.addEventListener('click', () => scrollTo(slideY(i) + 1)));
$$('[data-goto-slide]').forEach((a) =>
  a.addEventListener('click', (e) => {
    e.preventDefault();
    scrollTo(slideY(+a.dataset.gotoSlide) + 1, { duration: 2 });
  }),
);
$$('[data-scroll-to]').forEach((a) =>
  a.addEventListener('click', (e) => {
    e.preventDefault();
    scrollTo(a.dataset.scrollTo);
  }),
);

/* ---------------- Site header: shown on scroll-up after the hero ---------------- */
let lastY = 0;
const onScroll = (y) => {
  if (document.body.classList.contains('menu-open')) return;
  const pastHero = heroTrigger && y > heroTrigger.end - 40;
  const up = y < lastY - 2;
  if (!pastHero) siteHeader.classList.remove('is-shown');
  else if (up) siteHeader.classList.add('is-shown');
  else if (y > lastY + 2) siteHeader.classList.remove('is-shown');
  lastY = y;
};
if (lenis) lenis.on('scroll', ({ scroll }) => onScroll(scroll));
else window.addEventListener('scroll', () => onScroll(window.scrollY), { passive: true });

/* ---------------- Pick a Drape ---------------- */
let playground;
let viewer;
const detail = $('.detail');
let detailOpen = false;

function openDetail(drape) {
  $('.detail__name').textContent = drape.name;
  $('.detail__fabric').textContent = drape.fabric;
  $('.detail__note').textContent = drape.note;
  delete $('.detail__name').dataset.splitDone;
  const { chars } = split($('.detail__name'));
  detailOpen = true;
  detail.classList.add('is-open');
  detail.setAttribute('aria-hidden', 'false');
  document.body.classList.add('detail-open');
  siteHeader.classList.remove('is-shown');
  lenis?.stop();
  viewer.show(drape);
  const d = reduced ? 0 : 1;
  gsap
    .timeline()
    .fromTo('.detail__backdrop', { opacity: 0 }, { opacity: 1, duration: 0.7 * d }, 0)
    .fromTo('.detail__stage', { autoAlpha: 0, scale: 0.88 }, { autoAlpha: 1, scale: 1, duration: 1 * d, ease: 'expo.out' }, 0.05)
    .fromTo('.detail__info > *:not(.detail__name)', { autoAlpha: 0, y: 16 }, { autoAlpha: 1, y: 0, stagger: 0.06, duration: 0.8 * d, ease: 'power3.out' }, 0.25)
    .fromTo(chars, { yPercent: 105, opacity: 0 }, { yPercent: 0, opacity: 1, stagger: 0.035 * d, duration: 0.9 * d, ease: 'power3.out' }, 0.3)
    .fromTo('.detail .slide__rule', { scaleX: 0 }, { scaleX: 1, duration: 0.8 * d, ease: 'expo.out' }, 0.5);
  setTimeout(() => $('.detail__close').focus(), 60);
}
function closeDetail() {
  if (!detailOpen) return;
  detailOpen = false;
  const d = reduced ? 0 : 1;
  gsap
    .timeline({
      onComplete: () => {
        detail.classList.remove('is-open');
        detail.setAttribute('aria-hidden', 'true');
        viewer.hide();
      },
    })
    .to('.detail__info > *', { autoAlpha: 0, y: -10, stagger: 0.03, duration: 0.3 * d }, 0)
    .to('.detail__stage', { autoAlpha: 0, scale: 0.92, duration: 0.45 * d, ease: 'power2.in' }, 0)
    .to('.detail__backdrop', { opacity: 0, duration: 0.5 * d }, 0.15);
  document.body.classList.remove('detail-open');
  lenis?.start();
}
$('.detail__close').addEventListener('click', closeDetail);
$('.detail__backdrop').addEventListener('click', closeDetail);
window.addEventListener('keydown', (e) => e.key === 'Escape' && closeDetail());

const filterBtns = $$('.filter');
let activeFilter = 'all';
function applyFilter(cat) {
  activeFilter = activeFilter === cat ? 'all' : cat;
  filterBtns.forEach((b) => b.classList.toggle('is-active', b.dataset.filter === activeFilter));
  playground.setFilter(activeFilter);
}
filterBtns.forEach((b) => b.addEventListener('click', () => applyFilter(b.dataset.filter)));
$$('[data-filter-link]').forEach((a) =>
  a.addEventListener('click', (e) => {
    e.preventDefault();
    scrollTo('#drape');
    setTimeout(() => {
      activeFilter = 'all';
      applyFilter(a.dataset.filterLink);
    }, 1500);
  }),
);

function setupDrape() {
  playground = new Playground({ container: $('.drape__stage'), dropZone: $('.dropzone'), cursor, reduced, onSelect: openDetail });
  viewer = new Viewer($('.detail__stage'), { reduced });
  window.__rooq = { playground, viewer, get slider() { return slider; } }; // handy for debugging in the console
  const el = playground.renderer.domElement;
  const block = (e) => playground.held && e.preventDefault();
  el.addEventListener('touchstart', block, { passive: false });
  el.addEventListener('touchmove', block, { passive: false });

  const title = split($('.drape__title')).chars;
  gsap.set(title, { yPercent: 105, opacity: 0 });
  gsap.set('.drape__sub, .drape__foot, .dropzone, .drape__bar', { autoAlpha: 0 });
  ScrollTrigger.create({
    trigger: '.drape',
    start: 'top 70%',
    once: true,
    onEnter: () => {
      playground.start();
      const d = reduced ? 0 : 1;
      gsap.to('.drape__bar', { autoAlpha: 1, duration: 1 * d, delay: 0.2 * d });
      gsap.to(title, { yPercent: 0, opacity: 1, stagger: 0.05 * d, duration: 1 * d, ease: 'power3.out', delay: 0.3 * d });
      gsap.fromTo('.drape .slide__rule', { scaleX: 0 }, { scaleX: 1, duration: 1 * d, ease: 'expo.out', delay: 0.8 * d });
      gsap.fromTo('.drape__sub, .drape__foot', { autoAlpha: 0, y: 14 }, { autoAlpha: 1, y: 0, stagger: 0.1, duration: 0.9 * d, delay: 0.9 * d });
      gsap.fromTo('.dropzone', { autoAlpha: 0, y: 30 }, { autoAlpha: 1, y: 0, duration: 1.2 * d, ease: 'expo.out', delay: 1.1 * d });
    },
  });
  ScrollTrigger.create({
    trigger: '.drape',
    start: 'top bottom',
    end: 'bottom top',
    onToggle: (self) => playground.setActive(self.isActive),
  });
}

/* ---------------- Boot ---------------- */
window.scrollTo(0, 0);
if ('scrollRestoration' in history) history.scrollRestoration = 'manual';

slider = new HeroSlider($('.hero__media'), SLIDES, {
  reduced,
  onLoad: () => {
    slider.intro();
    showSlide(0);
  },
});
setupDrape();
setupHero();
setupCollection({ reduced });
setupReviews($('.reviews'), { reduced });
reveals();
gsap.ticker.add((time) => {
  slider.tick();
  heroPetals.tick(time);
  playground.tick();
  viewer.tick(time);
});
// arriving from another page with #drape, #collections or #reviews
if (location.hash && $(location.hash)) {
  document.fonts.ready.then(() => {
    ScrollTrigger.refresh();
    scrollTo(location.hash, { immediate: true });
  });
}
