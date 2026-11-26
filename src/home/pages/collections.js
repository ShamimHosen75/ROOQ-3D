import { gsap, ScrollTrigger, $, $$, reduced } from '../core.js';
import { bootPage } from '../page.js';
import { leaveTo } from '../chrome.js';
import { card } from '../collection.js';
import { PIECES, FILTERS } from '../products.js';

bootPage('collections', () => {
  const section = $('#collections');
  const grid = $('.coll__grid', section);
  const pills = $('.coll__pills', section);
  const sort = $('.js-sort', section);
  const count = $('.coll__count', section);
  const empty = $('.coll__empty', section);
  const params = new URLSearchParams(location.search);
  let filter = FILTERS.includes(params.get('c')) ? params.get('c') : 'All';
  const go = (p) => leaveTo(`/product.html?id=${p.id}`);

  const SORTS = {
    featured: () => 0,
    low: (a, b) => a.price - b.price,
    high: (a, b) => b.price - a.price,
    name: (a, b) => a.name.localeCompare(b.name),
  };
  let first = true;
  const draw = () => {
    const list = PIECES.filter((p) => filter === 'All' || p.tags.includes(filter)).sort(SORTS[sort.value]);
    grid.innerHTML = '';
    list.forEach((p) => grid.appendChild(card(p, go)));
    count.textContent = `${list.length} ${list.length === 1 ? 'drape' : 'drapes'}${filter === 'All' ? '' : ` in ${filter}`}`;
    empty.hidden = list.length > 0;
    const cards = $$('.js-piece', grid);
    if (!reduced()) {
      if (first) {
        gsap.set(cards, { autoAlpha: 0, y: 50 });
        ScrollTrigger.batch(cards, {
          start: 'top 92%',
          once: true,
          onEnter: (els) => gsap.to(els, { autoAlpha: 1, y: 0, duration: 1.1, ease: 'power3.out', stagger: 0.08 }),
        });
      } else gsap.fromTo(cards, { y: 26, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.7, ease: 'power3.out', stagger: 0.06, overwrite: true });
    }
    first = false;
    requestAnimationFrame(() => ScrollTrigger.refresh());
  };
  const syncUrl = () => {
    const url = new URL(location.href);
    if (filter === 'All') url.searchParams.delete('c');
    else url.searchParams.set('c', filter);
    history.replaceState(null, '', url);
  };
  const btns = FILTERS.map((f) => {
    const b = document.createElement('button');
    b.className = 'pill';
    b.type = 'button';
    b.textContent = f;
    b.setAttribute('aria-pressed', String(f === filter));
    b.addEventListener('click', () => {
      filter = f;
      btns.forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
      syncUrl();
      draw();
    });
    pills.appendChild(b);
    return b;
  });
  sort.addEventListener('change', draw);
  $('.js-count').textContent = PIECES.length;
  draw();

  // the three cut-outs in the header fan out
  if (!reduced()) {
    gsap.from($$('.ph__fan img:not(.ph__arc)'), { y: 80, autoAlpha: 0, duration: 1.6, ease: 'expo.out', stagger: 0.12, delay: 0.2 });
    gsap.from('.ph__disc', { scale: 0.6, autoAlpha: 0, duration: 1.8, ease: 'expo.out' });
  }
});
