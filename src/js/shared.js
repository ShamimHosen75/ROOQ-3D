// Shared site chrome for every page: smooth scroll, cursor, header, footer, bag drawer,
// page-to-page curtain and small reveal helpers.
import '../css/main.css';
import '../css/pages.css';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import { split } from './split.js';
import { PRODUCTS, productById, rupees } from './products.js';

gsap.registerPlugin(ScrollTrigger);

/** Store details shown in the footer and on the contact page. Edit these. */
export const STORE = {
  address: 'Store address, Street name',
  city: 'City, State 000000',
  hours: 'Open daily · 10:30 am – 9 pm',
  phone: '+91 00000 00000',
  phoneHref: 'tel:+910000000000',
  email: 'hello@example.com',
  whatsapp: 'https://wa.me/910000000000',
  instagram: '#',
  pinterest: '#',
  mapQuery: 'Store address, City',
};

export const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
export const $ = (s, el = document) => el.querySelector(s);
export const $$ = (s, el = document) => [...el.querySelectorAll(s)];
export const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
export const ARROW = '<svg viewBox="0 0 24 12"><path d="M0 6h22M17 1l5 5-5 5" /></svg>';
const MARK = '<svg viewBox="0 0 64 40" class="mark"><use href="#rooq-mark" /></svg>';
const SYMBOL = `<svg width="0" height="0" style="position:absolute" aria-hidden="true"><symbol id="rooq-mark" viewBox="0 0 64 40" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"><path d="M32 3c5.5 6 5.5 18 0 27-5.5-9-5.5-21 0-27z" /><path d="M32 30c-1.5-8-7.5-14.5-16-16 0 9.5 7 16 16 16z" /><path d="M32 30c1.5-8 7.5-14.5 16-16 0 9.5-7 16-16 16z" /><path d="M31 31C25 26 14 24 5 26c5 6 15 8 26 5z" /><path d="M33 31c6-5 17-7 26-5-5 6-15 8-26 5z" /></symbol></svg>`;
const CURSOR = `<div class="cursor" aria-hidden="true"><div class="cursor__pos">
<svg class="cursor__petal" width="28" height="34" viewBox="0 0 28 34"><defs><linearGradient id="pc-g" x1="2" y1="2" x2="22" y2="32" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#ffd4de" /><stop offset="0.55" stop-color="#f48aa6" /><stop offset="1" stop-color="#d4476f" /></linearGradient></defs><path d="M2 2 C8 4 20 8 25 17 C28.5 24 22 32.5 14 32 C6 31.4 1.5 21 1.8 12 C1.9 8 2 5 2 2Z" fill="url(#pc-g)" /><path d="M2.6 3.4 C6 12 10 22 14 30" fill="none" stroke="#fff2f5" stroke-opacity=".5" stroke-width=".8" stroke-linecap="round" /><path d="M2.6 3.4 C11 7 19 12 22 20" fill="none" stroke="#c63a62" stroke-opacity=".28" stroke-width=".7" stroke-linecap="round" /></svg>
<svg class="cursor__ring" width="34" height="34" viewBox="0 0 34 34"><circle cx="17" cy="17" r="8.5" fill="none" stroke="#fbefe6" stroke-width="3" stroke-opacity=".9" /><circle cx="17" cy="17" r="8.5" fill="none" stroke="#3a2418" stroke-width="1.1" /></svg>
<svg class="cursor__dot" width="34" height="34" viewBox="0 0 34 34"><circle cx="17" cy="17" r="7.5" fill="#3a2418" stroke="#fbefe6" stroke-width="2.2" /><circle cx="17" cy="17" r="2" fill="#c9a463" /></svg>
</div></div>`;

const NAV = [
  { href: '/', label: 'Home', page: 'home' },
  { href: '/collections.html', label: 'Collections', page: 'collections' },
  { href: '/#drape', label: 'Pick a Drape', page: 'drape' },
  { href: '/about.html', label: 'About', page: 'about' },
  { href: '/contact.html', label: 'Contact', page: 'contact' },
];

/* ---------------- Smooth scroll ---------------- */
export let lenis = null;
function setupLenis() {
  if (reduced) return;
  lenis = new Lenis({ lerp: 0.09, wheelMultiplier: 0.85 });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
}
export function scrollTo(target, opts = {}) {
  const y = typeof target === 'number' ? target : $(target).getBoundingClientRect().top + window.scrollY;
  if (lenis) lenis.scrollTo(y, { duration: 1.6, easing: (t) => 1 - Math.pow(1 - t, 4), ...opts });
  else window.scrollTo({ top: y });
}

/* ---------------- Cursor: petal, ring over links, dot while holding ---------------- */
export let cursor = null;
function setupCursor() {
  document.body.insertAdjacentHTML('afterbegin', CURSOR);
  const el = $('.cursor');
  const pos = $('.cursor__pos');
  if (matchMedia('(hover: hover) and (pointer: fine)').matches) document.documentElement.classList.add('has-cursor');
  let x = -100;
  let y = -100;
  window.addEventListener('pointermove', (e) => {
    x = e.clientX;
    y = e.clientY;
    el.classList.remove('is-hidden');
  });
  document.addEventListener('pointerleave', () => el.classList.add('is-hidden'));
  gsap.ticker.add(() => {
    pos.style.transform = `translate(${x}px, ${y}px)`;
  });
  document.addEventListener('pointerover', (e) => {
    if (el.classList.contains('is-hover') || el.classList.contains('is-hold')) return;
    el.classList.toggle('is-link', !!e.target.closest('a, button, select, label, input[type="submit"], [data-cursor]'));
  });
  cursor = {
    setState(state) {
      el.classList.remove('is-hover', 'is-hold', 'is-link');
      if (state !== 'default') el.classList.add(`is-${state}`);
    },
  };
}

/* ---------------- Bag (kept in this browser only) ---------------- */
const BAG_KEY = 'rooq-bag';
const readBag = () => {
  try {
    return JSON.parse(localStorage.getItem(BAG_KEY)) || [];
  } catch {
    return [];
  }
};
const writeBag = (items) => {
  try {
    localStorage.setItem(BAG_KEY, JSON.stringify(items));
  } catch {
    /* private mode: the bag just won't persist */
  }
};
export const bag = {
  items: [],
  add(id, opts = {}) {
    const key = `${id}|${opts.blouse || 'unstitched'}`;
    const hit = this.items.find((i) => i.key === key);
    if (hit) hit.qty += opts.qty || 1;
    else this.items.push({ key, id, blouse: opts.blouse || 'unstitched', qty: opts.qty || 1 });
    this.save();
  },
  set(key, qty) {
    const hit = this.items.find((i) => i.key === key);
    if (!hit) return;
    hit.qty = qty;
    this.items = this.items.filter((i) => i.qty > 0);
    this.save();
  },
  lineTotal: (i) => (productById(i.id)?.price || 0) * i.qty + (i.blouse === 'stitched' ? BLOUSE_STITCHING * i.qty : 0),
  get count() {
    return this.items.reduce((n, i) => n + i.qty, 0);
  },
  get total() {
    return this.items.reduce((n, i) => n + this.lineTotal(i), 0);
  },
  save() {
    writeBag(this.items);
    renderBag();
  },
};
export const BLOUSE_STITCHING = 1500;

function renderBag() {
  const count = bag.count;
  $$('.bag-count').forEach((n) => {
    n.textContent = count;
    n.classList.toggle('is-empty', !count);
  });
  const list = $('.bag__list');
  if (!list) return;
  list.innerHTML = bag.items.length
    ? bag.items
        .map((i) => {
          const p = productById(i.id);
          if (!p) return '';
          return `<li class="bag__item">
            <a class="bag__thumb" href="${p.url}"><img src="${p.image}" alt="" /></a>
            <div class="bag__meta">
              <a href="${p.url}" class="bag__name">${esc(p.name)}</a>
              <span class="bag__opt">Blouse: ${i.blouse === 'stitched' ? 'stitched to size' : 'unstitched'}</span>
              <div class="qty qty--sm" data-key="${esc(i.key)}">
                <button type="button" data-step="-1" aria-label="One less">−</button><span>${i.qty}</span><button type="button" data-step="1" aria-label="One more">+</button>
              </div>
            </div>
            <span class="bag__price">${rupees(bag.lineTotal(i))}</span>
          </li>`;
        })
        .join('')
    : `<li class="bag__empty"><p>Your bag is empty.</p><a class="link" href="/collections.html">Browse the collection ${ARROW}</a></li>`;
  $('.bag__total').textContent = rupees(bag.total);
  $('.bag__foot').hidden = !bag.items.length;
}

function setupBag() {
  bag.items = readBag();
  document.body.insertAdjacentHTML(
    'beforeend',
    `<aside class="bag" aria-hidden="true" aria-label="Your bag">
      <div class="bag__backdrop" data-bag-close></div>
      <div class="bag__panel" role="dialog" aria-modal="true" aria-label="Your bag">
        <header class="bag__head"><p class="eyebrow">Your bag</p><button class="bag__close" data-bag-close aria-label="Close bag"><svg viewBox="0 0 20 20"><path d="M3 3l14 14M17 3 3 17" /></svg></button></header>
        <ul class="bag__list"></ul>
        <footer class="bag__foot">
          <p class="bag__row"><span>Subtotal</span><strong class="bag__total"></strong></p>
          <p class="bag__note">Shipping and fittings are confirmed with you before payment.</p>
          <a class="btn btn--solid" href="/contact.html?bag=1">Enquire to order ${ARROW}</a>
        </footer>
      </div>
    </aside>
    <div class="toast" role="status" aria-live="polite"></div>`,
  );
  const el = $('.bag');
  $$('[data-bag-close]', el).forEach((b) => b.addEventListener('click', closeBag));
  window.addEventListener('keydown', (e) => e.key === 'Escape' && closeBag());
  $('.bag__list').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-step]');
    if (!btn) return;
    const key = btn.parentElement.dataset.key;
    const item = bag.items.find((i) => i.key === key);
    if (item) bag.set(key, item.qty + Number(btn.dataset.step));
  });
  window.addEventListener('storage', (e) => {
    if (e.key !== BAG_KEY) return;
    bag.items = readBag();
    renderBag();
  });
  renderBag();
}
export function openBag() {
  const el = $('.bag');
  el.classList.add('is-open');
  el.setAttribute('aria-hidden', 'false');
  lenis?.stop();
  const d = reduced ? 0 : 1;
  gsap.fromTo('.bag__backdrop', { opacity: 0 }, { opacity: 1, duration: 0.5 * d });
  gsap.fromTo('.bag__panel', { xPercent: 100 }, { xPercent: 0, duration: 0.8 * d, ease: 'expo.out' });
  gsap.fromTo('.bag__item, .bag__empty, .bag__foot', { autoAlpha: 0, x: 30 }, { autoAlpha: 1, x: 0, stagger: 0.06, duration: 0.7 * d, delay: 0.15 * d, ease: 'power3.out' });
  setTimeout(() => $('.bag__close').focus(), 50);
}
function closeBag() {
  const el = $('.bag');
  if (!el?.classList.contains('is-open')) return;
  const d = reduced ? 0 : 1;
  gsap.to('.bag__backdrop', { opacity: 0, duration: 0.4 * d });
  gsap.to('.bag__panel', {
    xPercent: 100,
    duration: 0.6 * d,
    ease: 'power3.in',
    onComplete: () => {
      el.classList.remove('is-open');
      el.setAttribute('aria-hidden', 'true');
      lenis?.start();
    },
  });
}

let toastTimer;
export function toast(html) {
  const t = $('.toast');
  t.innerHTML = html;
  t.classList.add('is-on');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('is-on'), 3200);
}

/* ---------------- Header ---------------- */
function headerHTML(page) {
  return `<header class="site-header">
    <a href="/" class="logo logo--sm" aria-label="ROOQ home">${MARK}<strong>ROOQ</strong><span>Clothing Atelier</span></a>
    <nav class="site-nav" aria-label="Main">${NAV.map((n) => `<a href="${n.href}"${n.page === page ? ' aria-current="page"' : ''}>${n.label}</a>`).join('')}</nav>
    <div class="site-tools">
      <button class="bag-btn" type="button" aria-label="Open bag"><svg viewBox="0 0 24 24"><path d="M5 8h14l-1.2 12H6.2L5 8Z" /><path d="M9 8V6.5a3 3 0 0 1 6 0V8" /></svg><span class="bag-count is-empty">0</span></button>
      <button class="menu-btn" type="button" aria-label="Open menu" aria-expanded="false"><i></i><i></i></button>
    </div>
  </header>
  <div class="menu" aria-hidden="true">
    <nav class="menu__nav" aria-label="Menu">${NAV.map((n, i) => `<a href="${n.href}"><em>0${i + 1}</em>${n.label}</a>`).join('')}</nav>
    <div class="menu__foot"><span>${esc(STORE.hours)}</span><a href="${STORE.phoneHref}">${esc(STORE.phone)}</a></div>
  </div>`;
}
function setupHeader(page) {
  const header = $('.site-header');
  $('.bag-btn').addEventListener('click', openBag);
  const menu = $('.menu');
  const btn = $('.menu-btn');
  const toggle = (open) => {
    menu.classList.toggle('is-open', open);
    document.body.classList.toggle('menu-open', open);
    btn.setAttribute('aria-expanded', String(open));
    menu.setAttribute('aria-hidden', String(!open));
    if (open) {
      lenis?.stop();
      gsap.fromTo('.menu__nav a', { yPercent: 60, autoAlpha: 0 }, { yPercent: 0, autoAlpha: 1, stagger: 0.06, duration: 0.8, ease: 'expo.out', delay: 0.15 });
    } else lenis?.start();
  };
  btn.addEventListener('click', () => toggle(!menu.classList.contains('is-open')));
  $$('a', menu).forEach((a) => a.addEventListener('click', () => toggle(false)));
  if (page !== 'home') {
    // inner pages: header is always there, tucks away on scroll down
    header.classList.add('is-shown', 'is-solid');
    let last = 0;
    const onScroll = (y) => {
      if (document.body.classList.contains('menu-open')) return;
      if (y > last + 4 && y > 120) header.classList.remove('is-shown');
      else if (y < last - 4) header.classList.add('is-shown');
      last = y;
    };
    if (lenis) lenis.on('scroll', ({ scroll }) => onScroll(scroll));
    else window.addEventListener('scroll', () => onScroll(window.scrollY), { passive: true });
  }
  return header;
}

/* ---------------- Footer with the big ROOQ wordmark ---------------- */
function footerHTML() {
  const shop = [
    ['All sarees', '/collections.html'],
    ['Silk', '/collections.html?cat=silk'],
    ['Organza', '/collections.html?cat=organza'],
    ['Velvet', '/collections.html?cat=velvet'],
    ['Festive', '/collections.html?cat=festive'],
  ];
  const house = [
    ['Our story', '/about.html'],
    ['Pick a Drape', '/#drape'],
    ['Kind words', '/#reviews'],
    ['Visit & contact', '/contact.html'],
  ];
  const col = (title, links) => `<div class="footer__col"><p class="footer__h">${title}</p>${links.map(([l, h]) => `<a href="${h}">${l}</a>`).join('')}</div>`;
  return `<footer class="footer" id="about-footer">
    <div class="footer__glow" aria-hidden="true"></div>
    <div class="footer__top">
      <div class="footer__intro">
        ${MARK}
        <p class="footer__lead">Drapes woven slowly,<br /><em>for days worth remembering.</em></p>
        <form class="footer__news" novalidate>
          <label for="news-email">Letters from the atelier: new drapes, trunk shows, nothing else.</label>
          <div class="footer__field"><input id="news-email" type="email" placeholder="Your email" autocomplete="email" required /><button type="submit" aria-label="Subscribe">${ARROW}</button></div>
        </form>
      </div>
      ${col('Shop', shop)}
      ${col('The house', house)}
      <div class="footer__col"><p class="footer__h">Visit</p>
        <span>${esc(STORE.address)}</span><span>${esc(STORE.city)}</span><span>${esc(STORE.hours)}</span>
        <a href="${STORE.phoneHref}">${esc(STORE.phone)}</a>
        <div class="footer__social">
          <a href="${STORE.instagram}" aria-label="Instagram"><svg viewBox="0 0 24 24"><rect x="3.5" y="3.5" width="17" height="17" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.3" cy="6.7" r=".6" /></svg></a>
          <a href="${STORE.pinterest}" aria-label="Pinterest"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8.5" /><path d="M10.5 20.2 12.4 12M10 13.6c-1.2-2.8.6-6 3.4-6 2.4 0 3.6 1.7 3.6 3.6 0 2.4-1.3 4.4-3 4.4-1 0-1.6-.8-1.4-1.7" /></svg></a>
          <a href="${STORE.whatsapp}" aria-label="WhatsApp"><svg viewBox="0 0 24 24"><path d="M4.5 19.5 5.6 16A8 8 0 1 1 8.4 18.6Z" /><path d="M9.2 8.6c.2 2.9 2.8 5.5 5.6 5.8l1.1-1.3-1.7-.9-.8.8c-1-.4-2.1-1.5-2.5-2.5l.8-.8-.9-1.7Z" /></svg></a>
        </div>
      </div>
    </div>
    <div class="footer__brand">
      <p class="footer__word" aria-label="ROOQ"><span>R</span><span>O</span><span>O</span><span>Q</span></p>
      <p class="footer__tag"><i></i>Clothing Atelier<i></i></p>
    </div>
    <div class="footer__bottom">
      <span>© ${new Date().getFullYear()} ROOQ Clothing Atelier. All rights reserved.</span>
      <span class="footer__made">Handwoven in India</span>
      <button class="footer__top-btn" type="button">Back to top <svg viewBox="0 0 12 24"><path d="M6 23V2M1 7l5-5 5 5" /></svg></button>
    </div>
  </footer>`;
}
function setupFooter() {
  const f = $('.footer');
  const word = $('.footer__word');
  const letters = $$('.footer__word span');
  // the gold highlight follows the pointer across the wordmark
  f.addEventListener('pointermove', (e) => {
    letters.forEach((l) => {
      const r = l.getBoundingClientRect();
      l.style.setProperty('--mx', `${((e.clientX - r.left) / r.width) * 100}%`);
      l.style.setProperty('--my', `${((e.clientY - r.top) / r.height) * 100}%`);
    });
  });
  f.addEventListener('pointerleave', () => letters.forEach((l) => l.style.setProperty('--mx', '-60%')));
  $('.footer__top-btn').addEventListener('click', () => scrollTo(0, { duration: 2.2 }));
  $('.footer__news').addEventListener('submit', (e) => {
    e.preventDefault();
    const input = $('#news-email');
    if (!input.checkValidity()) {
      input.focus();
      toast('Please enter a valid email address.');
      return;
    }
    // no mailing list is connected yet: see README
    input.value = '';
    toast('Thank you. You are on the list.');
  });
  if (reduced) return;
  gsap.set(letters, { yPercent: 110, rotate: 4 });
  gsap.set('.footer__tag, .footer__top > *, .footer__bottom', { autoAlpha: 0, y: 24 });
  ScrollTrigger.create({
    trigger: f,
    start: 'top 85%',
    once: true,
    onEnter: () => {
      gsap.to('.footer__top > *', { autoAlpha: 1, y: 0, stagger: 0.08, duration: 1, ease: 'power3.out' });
    },
  });
  ScrollTrigger.create({
    trigger: word,
    start: 'top 92%',
    once: true,
    onEnter: () => {
      gsap.to(letters, { yPercent: 0, rotate: 0, stagger: 0.09, duration: 1.4, ease: 'expo.out' });
      gsap.to('.footer__tag, .footer__bottom', { autoAlpha: 1, y: 0, duration: 1, delay: 0.5, stagger: 0.1, ease: 'power3.out' });
    },
  });
  // the wordmark drifts up a little slower than the page
  gsap.fromTo(word, { yPercent: 18 }, { yPercent: 0, ease: 'none', scrollTrigger: { trigger: f, start: 'top bottom', end: 'bottom bottom', scrub: true } });
}

/* ---------------- Page curtain between pages ---------------- */
function setupCurtain() {
  document.body.insertAdjacentHTML('beforeend', `<div class="curtain" aria-hidden="true"><div class="curtain__panel">${MARK}</div></div>`);
  const panel = $('.curtain__panel');
  if (!reduced && sessionStorage.getItem('rooq-curtain')) {
    sessionStorage.removeItem('rooq-curtain');
    gsap.set(panel, { yPercent: 0 });
    gsap.to(panel, { yPercent: -100, duration: 1.1, ease: 'expo.inOut', delay: 0.1 });
  } else gsap.set(panel, { yPercent: 100 });
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a');
    if (!a || reduced || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0 || a.target === '_blank') return;
    const url = new URL(a.href, location.href);
    if (url.origin !== location.origin) return;
    if (url.pathname === location.pathname && url.search === location.search) {
      // same page: smooth scroll to the hash
      if (url.hash && $(url.hash)) {
        e.preventDefault();
        scrollTo(url.hash);
      }
      return;
    }
    e.preventDefault();
    try {
      sessionStorage.setItem('rooq-curtain', '1');
    } catch {
      /* ignore */
    }
    gsap.fromTo(panel, { yPercent: 100 }, { yPercent: 0, duration: 0.75, ease: 'expo.inOut', onComplete: () => (location.href = url.href) });
  });
  // back/forward cache: never come back to a closed curtain
  window.addEventListener('pageshow', (e) => e.persisted && gsap.set(panel, { yPercent: 100 }));
}

/* ---------------- Reveal helpers ---------------- */
/** Elements with [data-reveal] rise in as they enter the viewport. [data-split] titles rise letter by letter. */
export function reveals(root = document) {
  const d = reduced ? 0 : 1;
  $$('[data-split]', root).forEach((el) => {
    const { chars } = split(el);
    gsap.set(chars, { yPercent: 110, opacity: 0 });
    ScrollTrigger.create({
      trigger: el,
      start: 'top 88%',
      once: true,
      onEnter: () => gsap.to(chars, { yPercent: 0, opacity: 1, stagger: 0.03 * d, duration: 1.1 * d, ease: 'expo.out' }),
    });
  });
  const items = $$('[data-reveal]', root);
  gsap.set(items, { autoAlpha: 0, y: 40 });
  ScrollTrigger.batch(items, {
    start: 'top 90%',
    once: true,
    onEnter: (batch) => gsap.to(batch, { autoAlpha: 1, y: 0, stagger: 0.1 * d, duration: 1.1 * d, ease: 'power3.out', overwrite: true }),
  });
  $$('[data-parallax]', root).forEach((el) => {
    if (reduced) return;
    const amt = Number(el.dataset.parallax) || 10;
    gsap.fromTo(el, { yPercent: -amt }, { yPercent: amt, ease: 'none', scrollTrigger: { trigger: el.parentElement, start: 'top bottom', end: 'bottom top', scrub: true } });
  });
}

/** Builds the whole shared chrome. Call once, first thing, on every page. */
export function initSite({ page }) {
  document.body.insertAdjacentHTML('afterbegin', SYMBOL);
  setupLenis();
  setupCursor();
  document.body.insertAdjacentHTML('afterbegin', headerHTML(page));
  ($('main') || document.body).insertAdjacentHTML('afterend', footerHTML());
  setupBag();
  const header = setupHeader(page);
  setupFooter();
  setupCurtain();
  document.fonts?.ready.then(() => ScrollTrigger.refresh());
  return { header };
}

export { PRODUCTS };
