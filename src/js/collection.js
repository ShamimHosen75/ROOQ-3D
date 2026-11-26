import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { PRODUCTS } from './products.js';

const rupees = (n) => '₹' + n.toLocaleString('en-IN');
const HEART =
  '<svg viewBox="0 0 24 24"><path d="M12 19s-7-4.4-9.2-8.6C1.3 7.4 3 4 6.4 4c2 0 3.3 1.1 4 2.3h3.2C14.3 5.1 15.6 4 17.6 4 21 4 22.7 7.4 21.2 10.4 19 14.6 12 19 12 19Z"/></svg>';

const el = (tag, cls, text) => {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text) n.textContent = text;
  return n;
};

function buildCard(p, reduced) {
  const card = el('article', 'card');
  card.dataset.cats = p.cats.join(' ');
  const media = el('div', 'card__img');
  const img = el('img');
  img.src = p.image;
  img.alt = p.name;
  img.loading = 'lazy';
  media.appendChild(img);
  const row = el('div', 'card__row');
  const heart = el('button', 'heart');
  heart.setAttribute('aria-label', `Save ${p.name}`);
  heart.setAttribute('aria-pressed', 'false');
  heart.innerHTML = HEART;
  heart.addEventListener('click', () => {
    const on = heart.classList.toggle('is-on');
    heart.setAttribute('aria-pressed', String(on));
    if (on && !reduced) gsap.fromTo(heart, { scale: 0.6 }, { scale: 1, duration: 0.6, ease: 'back.out(4)' });
  });
  row.append(el('h3', 'card__name', p.name), heart);
  card.append(media, row, el('p', 'card__price', rupees(p.price)), el('p', 'card__tags', p.tags));
  return card;
}

/** "Sarees" product grid: staggered reveal on scroll, fade-out / fade-in filtering. */
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
  gsap.set(cards, { autoAlpha: 0, y: 40 });
  ScrollTrigger.batch(cards, {
    start: 'top 92%',
    once: true,
    onEnter: (batch) =>
      gsap.to(batch, { autoAlpha: 1, y: 0, duration: 1 * d, stagger: 0.1 * d, ease: 'power3.out', overwrite: true }),
  });

  const pills = [...document.querySelectorAll('.pill')];
  let tl = null;
  pills.forEach((pill) =>
    pill.addEventListener('click', () => {
      const cat = pill.dataset.cat;
      pills.forEach((p) => p.classList.toggle('is-active', p === pill));
      tl?.kill();
      const shown = cards.filter((c) => !c.classList.contains('is-hidden'));
      tl = gsap.timeline();
      tl.to(shown, { autoAlpha: 0, duration: 0.35 * d, ease: 'power1.in' });
      tl.add(() => {
        cards.forEach((c) => c.classList.toggle('is-hidden', !(cat === 'all' || c.dataset.cats.split(' ').includes(cat))));
        const next = cards.filter((c) => !c.classList.contains('is-hidden'));
        gsap.fromTo(next, { autoAlpha: 0, y: 14 }, { autoAlpha: 1, y: 0, duration: 0.6 * d, stagger: 0.07 * d, ease: 'power2.out' });
        ScrollTrigger.refresh();
      });
    }),
  );
}
