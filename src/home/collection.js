import { gsap, ScrollTrigger, $, $$, lenisNow } from './core.js';

import { PIECES, FILTERS, photos, inr } from './products.js';

export { PIECES };
const heart = '<svg viewBox="0 0 24 24" aria-hidden="true"><use href="#heart" /></svg>';
const el = (tag, cls, html) => {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (html != null) e.innerHTML = html;
  return e;
};

const saved = {};
const savers = new Map(); // id → [buttons]
function toggleSave(id) {
  saved[id] = !saved[id];
  (savers.get(id) ?? []).forEach((b) => syncSave(b, id));
}
function syncSave(b, id) {
  b.setAttribute('aria-pressed', String(!!saved[id]));
  b.setAttribute('aria-label', saved[id] ? 'Remove from saved' : 'Save');
}
export function saveButton(id) {
  const b = el('button', 'save', heart);
  b.type = 'button';
  syncSave(b, id);
  if (!savers.has(id)) savers.set(id, []);
  savers.get(id).push(b);
  b.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleSave(id);
  });
  return b;
}

/* Pieces with extra poses wipe through them on hover. */
function poseWipe(media, p) {
  const base = $('.piece__base', media);
  const b = $('.piece__b', media);
  const c = $('.piece__c', media);
  const rm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const tl = gsap.timeline({ paused: true, defaults: { ease: 'power2.inOut' } });
  if (rm) {
    tl.to(base, { autoAlpha: 0, duration: 0.35, ease: 'none' }, 0).to(c, { autoAlpha: 1, duration: 0.35, ease: 'none' }, 0);
  } else {
    gsap.set(b, { autoAlpha: 0, xPercent: 3, scale: 1.04, '--wipe': -34 });
    gsap.set(c, { autoAlpha: 1, '--wipe': -34, xPercent: 2.5, scale: 1.045 });
    tl.to(base, { autoAlpha: 0, xPercent: -2.5, scale: 1.025, duration: 1, ease: 'sine.inOut' }, 0)
      .to(b, { autoAlpha: 1, xPercent: 0, scale: 1, duration: 1.1, ease: 'sine.out' }, 0.05)
      .to(c, { '--wipe': 134, duration: 1.7, ease: 'sine.inOut' }, 0.55)
      .to(b, { '--wipe': 134, xPercent: -2, scale: 1.015, duration: 1.7, ease: 'sine.inOut' }, 0.55)
      .to(c, { xPercent: 0, scale: 1, duration: 2, ease: 'expo.out' }, 0.55);
  }
  const card = media.closest('.piece');
  card.addEventListener('pointerenter', () => tl.timeScale(1).play());
  card.addEventListener('pointerleave', () => tl.timeScale(1.7).reverse());
  card.addEventListener('focus', () => tl.timeScale(1).play());
  card.addEventListener('blur', () => tl.timeScale(1.7).reverse());
}

export function card(p, open) {
  const a = el('article', 'piece js-reveal js-piece' + (p.poses ? ' has-poses' : ''));
  a.tabIndex = 0;
  a.setAttribute('role', 'button');
  a.setAttribute('aria-label', `${p.name}, quick view`);
  const media = el('div', 'piece__media');
  media.innerHTML = `<img class="piece__base" src="/collection/${p.id}.webp" alt="${p.name} saree" loading="lazy" width="820" height="897" draggable="false" />`;
  if (p.poses)
    media.insertAdjacentHTML(
      'beforeend',
      `<img class="piece__b" src="/collection/${p.poses[0]}.webp" alt="" aria-hidden="true" width="820" height="897" draggable="false" decoding="async" />
       <img class="piece__c" src="/collection/${p.poses[1]}.webp" alt="" aria-hidden="true" width="820" height="897" draggable="false" decoding="async" />`,
    );
  a.appendChild(media);
  const row = el('div', 'piece__row');
  row.append(el('h3', '', p.name), saveButton(p.id));
  a.append(row, el('p', 'piece__price', inr(p.price)), el('p', 'piece__notes', p.notes.join('  |  ')));
  a.addEventListener('click', () => open(p));
  a.addEventListener('keydown', (e) => (e.key === 'Enter' || e.key === ' ') && e.target === a && (e.preventDefault(), open(p)));
  if (p.poses) poseWipe(media, p);
  return a;
}

/* ---------- quick view ---------- */
export function quickView() {
  const root = $('.qv');
  let piece = null;
  let qty = 1;
  let photo = 0;
  let flashT = 0;
  let hideT = 0;
  let prevOverflow = '';

  const render = () => {
    const list = photos(piece);
    root.innerHTML = '';
    const cardEl = el('div', 'qv__card');
    cardEl.addEventListener('click', (e) => e.stopPropagation());
    const x = el('button', 'qv__x', '<svg aria-hidden="true"><use href="#close" /></svg>');
    x.type = 'button';
    x.setAttribute('aria-label', 'Close');
    x.addEventListener('click', close);
    const grid = el('div', 'qv__grid');
    const left = el('div', 'qv__left');
    const ph = el('div', 'qv__photo');
    const big = el('img');
    big.src = list[photo];
    big.alt = piece.name;
    big.draggable = false;
    ph.appendChild(big);
    left.appendChild(ph);
    if (list.length > 1) {
      const th = el('div', 'qv__thumbs');
      [...list].reverse().forEach((src) => {
        const i = list.indexOf(src);
        const b = el('button');
        b.type = 'button';
        b.setAttribute('aria-label', `View ${i + 1}`);
        b.setAttribute('aria-current', String(i === photo));
        const im = el('img');
        im.src = src;
        im.alt = '';
        im.draggable = false;
        b.appendChild(im);
        b.addEventListener('click', () => {
          photo = i;
          big.src = list[i];
          $$('button', th).forEach((t) => t.setAttribute('aria-current', String(t === b)));
        });
        th.appendChild(b);
      });
      left.appendChild(th);
    }
    const right = el('div', 'qv__right');
    const top = el('div', 'qv__top');
    top.append(el('h3', '', piece.name), saveButton(piece.id));
    const notes = el('div', 'qv__notes');
    piece.notes.forEach((n) => notes.appendChild(el('span', '', n)));
    const qtyRow = el('div', 'qv__qty');
    qtyRow.innerHTML = '<span>Quantity</span><div class="qv__stepper"><button type="button" aria-label="Fewer">−</button><output aria-live="polite">1</output><button type="button" aria-label="More">+</button></div>';
    const out = $('output', qtyRow);
    const [minus, plus] = $$('button', qtyRow);
    minus.addEventListener('click', () => (out.textContent = qty = Math.max(1, qty - 1)));
    plus.addEventListener('click', () => (out.textContent = qty = Math.min(9, qty + 1)));
    const buy = el('button', 'qv__buy', 'Buy Now');
    buy.type = 'button';
    const cart = el('button', 'qv__cart', 'Add to Cart');
    cart.type = 'button';
    const flash = (which) => {
      buy.textContent = which === 'buy' ? 'Reserved ✓' : 'Buy Now';
      cart.textContent = which === 'cart' ? 'Added ✓' : 'Add to Cart';
      clearTimeout(flashT);
      flashT = setTimeout(() => {
        buy.textContent = 'Buy Now';
        cart.textContent = 'Add to Cart';
      }, 1800);
    };
    buy.addEventListener('click', () => flash('buy'));
    cart.addEventListener('click', () => flash('cart'));
    const trust = el('div', 'qv__trust', ['Secure Payment', 'Easy Returns', 'Authentic Silk'].map((t, i) => `<span>${i ? '<i></i>' : ''}${t}</span>`).join(''));
    const more = el('a', 'qv__more', 'View full details <svg aria-hidden="true"><use href="#arrow" /></svg>');
    more.href = `/product.html?id=${piece.id}`;
    right.append(top, el('p', 'qv__price', inr(piece.price)), notes, el('p', 'qv__desc', piece.desc), el('div', 'qv__hr'), qtyRow, buy, cart, trust, more);
    grid.append(left, right);
    const orn = el('div', 'qv__orn', '<i></i><svg aria-hidden="true"><use href="#lotus" /></svg><i></i>');
    cardEl.append(x, grid, orn);
    root.appendChild(cardEl);
  };

  const onKey = (e) => e.key === 'Escape' && close();
  function open(p) {
    clearTimeout(hideT);
    piece = p;
    qty = 1;
    photo = photos(p).length - 1;
    render();
    root.setAttribute('aria-label', p.name);
    root.hidden = false;
    requestAnimationFrame(() => requestAnimationFrame(() => root.classList.add('is-shown')));
    lenisNow()?.stop();
    prevOverflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
  }
  function close() {
    if (!piece) return;
    piece = null;
    root.classList.remove('is-shown');
    hideT = setTimeout(() => {
      root.hidden = true;
      root.innerHTML = '';
    }, 700);
    lenisNow()?.start();
    document.documentElement.style.overflow = prevOverflow;
    window.removeEventListener('keydown', onKey);
  }
  root.addEventListener('click', close);
  return open;
}

export function setupCollection() {
  const section = $('#collections');
  const grid = $('.coll__grid', section);
  const pills = $('.coll__pills', section);
  const open = quickView();
  let filter = 'All';
  let first = true;

  const draw = () => {
    grid.innerHTML = '';
    savers.forEach((list, id) => savers.set(id, list.filter((b) => b.closest('.qv'))));
    PIECES.filter((p) => filter === 'All' || p.tags.includes(filter)).forEach((p) => grid.appendChild(card(p, open)));
    if (first) {
      first = false;
      return;
    }
    gsap.fromTo($$('.js-piece', grid), { y: 26, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.7, ease: 'power3.out', stagger: 0.06, overwrite: true });
    requestAnimationFrame(() => ScrollTrigger.refresh());
  };
  const btns = FILTERS.map((f) => {
    const b = el('button', 'pill', f);
    b.type = 'button';
    b.setAttribute('aria-pressed', String(f === filter));
    b.addEventListener('click', () => {
      filter = f;
      btns.forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
      draw();
    });
    pills.appendChild(b);
    return b;
  });
  draw();

  gsap.from($$('.js-reveal', section), {
    y: 50,
    autoAlpha: 0,
    duration: 1.1,
    ease: 'power3.out',
    stagger: 0.09,
    scrollTrigger: { trigger: section, start: 'top 72%' },
  });
}
