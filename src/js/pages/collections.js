import { initSite, reveals, reduced, $, $$ } from '../shared.js';
import { PRODUCTS, PRODUCT_FILTERS, FILTER_LABELS } from '../products.js';
import { buildCard, filterCards, revealCards } from '../collection.js';

initSite({ page: 'collections' });

const params = new URLSearchParams(location.search);
let cat = PRODUCT_FILTERS.includes(params.get('cat')) ? params.get('cat') : 'all';
let sort = 'featured';

const pillsEl = $('.pills');
pillsEl.innerHTML = PRODUCT_FILTERS.map(
  (c) => `<button class="pill${c === cat ? ' is-active' : ''}" data-cat="${c}" type="button">${FILTER_LABELS[c]}</button>`,
).join('');
const pills = $$('.pill', pillsEl);

const grid = $('.shop__grid');
const cards = PRODUCTS.map((p) => buildCard(p, reduced));
grid.append(...cards);
const matches = (c) => cat === 'all' || c.dataset.cats.split(' ').includes(cat);
const count = () => {
  const n = cards.filter(matches).length;
  $('.shop__count').textContent = `${n} ${n === 1 ? 'saree' : 'sarees'}`;
};
const order = () => {
  const price = (c) => PRODUCTS.find((p) => p.id === c.dataset.id).price;
  const sorted = [...cards].sort((a, b) => {
    if (sort === 'low') return price(a) - price(b);
    if (sort === 'high') return price(b) - price(a);
    if (sort === 'name') return a.dataset.id.localeCompare(b.dataset.id);
    return cards.indexOf(a) - cards.indexOf(b);
  });
  grid.append(...sorted);
};
cards.forEach((c) => c.classList.toggle('is-hidden', !matches(c)));
count();

let tl;
const apply = () => {
  tl?.kill();
  tl = filterCards(cards, matches, reduced, () => {
    order();
    count();
  });
  const url = new URL(location.href);
  if (cat === 'all') url.searchParams.delete('cat');
  else url.searchParams.set('cat', cat);
  history.replaceState(null, '', url);
};
pills.forEach((pill) =>
  pill.addEventListener('click', () => {
    cat = pill.dataset.cat;
    pills.forEach((p) => p.classList.toggle('is-active', p === pill));
    apply();
  }),
);
$('.shop__sort').addEventListener('change', (e) => {
  sort = e.target.value;
  apply();
});

reveals();
revealCards(cards.filter(matches), reduced);
