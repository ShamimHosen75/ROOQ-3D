import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { PRODUCTS, rupees } from './products.js';

export const HEART =
  '<svg viewBox="0 0 24 24"><path d="M12 20.5s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.6a4.3 4.3 0 0 1 7.5 2.7c0 5.6-7.5 10.2-7.5 10.2Z"/></svg>';

const SAVED_KEY = 'rooq-saved';
const readSaved = () => {
  try {
    return new Set(JSON.parse(localStorage.getItem(SAVED_KEY)) || []);
  } catch {
    return new Set();
  }
};
export const saved = {
  set: readSaved(),
  has(id) {
    return this.set.has(id);
  },
  toggle(id) {
    if (this.set.has(id)) this.set.delete(id);
    else this.set.add(id);
    try {
      localStorage.setItem(SAVED_KEY, JSON.stringify([...this.set]));
    } catch {
      /* ignore */
    }
    return this.set.has(id);
  },
};

const el = (tag, cls, text) => {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text) n.textContent = text;
  return n;
};

/** Wires a heart button to the saved list, with a little pop. */
export function bindHeart(heart, id, reduced) {
  const sync = () => {
    const on = saved.has(id);
    heart.classList.toggle('is-on', on);
    heart.setAttribute('aria-pressed', String(on));
  };
  sync();
  heart.addEventListener('click', (e) => {
    e.preventDefault();
    const on = saved.toggle(id);
    sync();
    if (on && !reduced) gsap.fromTo(heart, { scale: 0.6 }, { scale: 1, duration: 0.6, ease: 'back.out(4)' });
  });
}

/** A product card: photo and name link to the product page, heart saves it. */
export function buildCard(p, reduced) {
  const card = el('article', 'card');
  card.dataset.cats = p.cats.join(' ');
  card.dataset.id = p.id;
  const media = el('a', 'card__img');
  media.href = p.url;
  media.setAttribute('aria-label', p.name);
  const img = el('img');
  img.src = p.image;
  img.alt = p.name;
  img.loading = 'lazy';
  media.append(img, el('span', 'card__view', 'View'));
  const row = el('div', 'card__row');
  const name = el('a', 'card__name', p.name);
  name.href = p.url;
  const heart = el('button', 'heart');
  heart.type = 'button';
  heart.setAttribute('aria-label', `Save ${p.name}`);
  heart.innerHTML = HEART;
  bindHeart(heart, p.id, reduced);
  row.append(el('h3', 'card__title'), heart);
  row.firstChild.append(name);
  card.append(media, row, el('p', 'card__price', rupees(p.price)), el('p', 'card__tags', p.tags));
  return card;
}

/** Fade the visible cards out, swap the set, fade the new set in. */
export function filterCards(cards, match, reduced, onDone) {
  const d = reduced ? 0 : 1;
  const shown = cards.filter((c) => !c.classList.contains('is-hidden'));
  const tl = gsap.timeline();
  tl.to(shown, { autoAlpha: 0, duration: 0.35 * d, ease: 'power1.in' });
  tl.add(() => {
    cards.forEach((c) => c.classList.toggle('is-hidden', !match(c)));
    onDone?.();
    const next = cards.filter((c) => !c.classList.contains('is-hidden'));
    gsap.fromTo(next, { autoAlpha: 0, y: 14 }, { autoAlpha: 1, y: 0, duration: 0.6 * d, stagger: 0.07 * d, ease: 'power2.out' });
    ScrollTrigger.refresh();
  });
  return tl;
}

/** Cards rise in as they scroll into view. */
export function revealCards(cards, reduced) {
  const d = reduced ? 0 : 1;
  gsap.set(cards, { autoAlpha: 0, y: 40 });
  ScrollTrigger.batch(cards, {
    start: 'top 92%',
    once: true,
    onEnter: (batch) =>
      gsap.to(batch, { autoAlpha: 1, y: 0, duration: 1 * d, stagger: 0.1 * d, ease: 'power3.out', overwrite: true }),
  });
}

/** Home page "Sarees" grid: staggered reveal on scroll, fade-out / fade-in filtering. */
export function setupCollection({ reduced }) {
  const grid = document.querySelector('.grid');
  const cards = PRODUCTS.map((p) => buildCard(p, reduced));
  grid.append(...cards);
  const d = reduced ? 0 : 1;

  gsap.fromTo(
    '.collection__head > *, .pills',
    { autoAlpha: 0, y: 24 },
    {
      autoAlpha: 1,
      y: 0,
      duration: 1 * d,
      stagger: 0.08,
      ease: 'power3.out',
      scrollTrigger: { trigger: '.collection', start: 'top 75%', once: true },
    },
  );
  revealCards(cards, reduced);

  const pills = [...document.querySelectorAll('.collection .pill')];
  let tl = null;
  pills.forEach((pill) =>
    pill.addEventListener('click', () => {
      const cat = pill.dataset.cat;
      pills.forEach((p) => p.classList.toggle('is-active', p === pill));
      tl?.kill();
      tl = filterCards(cards, (c) => cat === 'all' || c.dataset.cats.split(' ').includes(cat), reduced);
    }),
  );
}
