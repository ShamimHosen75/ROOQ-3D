import { gsap, $, $$, reduced } from '../core.js';
import { bootPage } from '../page.js';
import { leaveTo } from '../chrome.js';
import { card, saveButton } from '../collection.js';
import { PIECES, photos, inr, byId } from '../products.js';
import { REVIEWS, reviewsFor } from '../reviewsData.js';
import { setupReviews } from '../reviews.js';

const id = new URLSearchParams(location.search).get('id');
const piece = byId(id) ?? PIECES[0];
if (!byId(id)) history.replaceState(null, '', `/product.html?id=${piece.id}`);

bootPage('product', () => {
  const p = piece;
  document.title = `${p.name} — Rooq Clothing Atelier`;
  $('meta[name="description"]').setAttribute('content', p.desc);

  /* ---- info ---- */
  $('.js-crumb').textContent = p.name;
  $('.pd__tags').textContent = p.tags.join(' · ');
  $('.pd__name').textContent = p.name;
  $('.js-save').replaceWith(saveButton(p.id));
  $('.pd__price').textContent = inr(p.price);
  $('.pd__desc').textContent = p.desc;
  p.notes.forEach((n) => {
    const s = document.createElement('span');
    s.textContent = n;
    $('.pd__notes').appendChild(s);
  });
  const own = reviewsFor(p.id);
  const rated = own.length ? own : REVIEWS;
  const avg = rated.reduce((s, r) => s + r.rating, 0) / rated.length;
  $('.pd__rating').innerHTML = `<span class="stars" aria-hidden="true">${[1, 2, 3, 4, 5].map((i) => `<svg class="${i <= Math.round(avg) ? 'on' : ''}"><use href="#star" /></svg>`).join('')}</span>${avg.toFixed(1)} · ${own.length ? `${own.length} review${own.length > 1 ? 's' : ''}` : 'Read reviews'}`;

  // blouse option
  const seg = $$('.seg button');
  seg.forEach((b) => b.addEventListener('click', () => seg.forEach((x) => x.setAttribute('aria-checked', String(x === b)))));

  // quantity + buttons
  let qty = 1;
  const out = $('.pd__qty output');
  const [minus, plus] = $$('.pd__qty button');
  minus.addEventListener('click', () => (out.textContent = qty = Math.max(1, qty - 1)));
  plus.addEventListener('click', () => (out.textContent = qty = Math.min(9, qty + 1)));
  const buy = $('.js-buy');
  const cart = $('.js-cart');
  let flashT = 0;
  const flash = (which) => {
    buy.textContent = which === 'buy' ? 'Reserved ✓' : 'Buy Now';
    cart.textContent = which === 'cart' ? `Added ${qty > 1 ? `${qty} ` : ''}✓` : 'Add to Cart';
    clearTimeout(flashT);
    flashT = setTimeout(() => {
      buy.textContent = 'Buy Now';
      cart.textContent = 'Add to Cart';
    }, 1800);
  };
  buy.addEventListener('click', () => flash('buy'));
  cart.addEventListener('click', () => flash('cart'));

  /* ---- gallery ---- */
  const list = photos(p);
  const img = $('.pd__img');
  const zoom = $('.pd__zoom');
  const thumbs = $('.pd__thumbs');
  let cur = list.length - 1;
  img.src = list[cur];
  img.alt = `${p.name} saree`;
  const show = (i) => {
    if (i === cur) return;
    cur = i;
    $$('button', thumbs).forEach((t) => t.setAttribute('aria-selected', String(Number(t.dataset.i) === i)));
    if (reduced()) {
      img.src = list[i];
      return;
    }
    gsap.to(img, {
      autoAlpha: 0,
      xPercent: -3,
      duration: 0.3,
      ease: 'power2.in',
      onComplete: () => {
        img.src = list[i];
        gsap.fromTo(img, { autoAlpha: 0, xPercent: 3 }, { autoAlpha: 1, xPercent: 0, duration: 0.8, ease: 'expo.out' });
      },
    });
  };
  if (list.length > 1) {
    [...list].reverse().forEach((src) => {
      const i = list.indexOf(src);
      const b = document.createElement('button');
      b.type = 'button';
      b.setAttribute('role', 'tab');
      b.dataset.i = i;
      b.setAttribute('aria-label', `Photo ${list.length - i}`);
      b.setAttribute('aria-selected', String(i === cur));
      const t = document.createElement('img');
      t.src = src;
      t.alt = '';
      t.draggable = false;
      b.appendChild(t);
      b.addEventListener('click', () => show(i));
      thumbs.appendChild(b);
    });
  } else thumbs.remove();

  // look closer: the photo scales toward the pointer
  if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    const stage = $('.pd__stage');
    stage.addEventListener('pointerenter', () => stage.classList.add('is-zoom'));
    stage.addEventListener('pointerleave', () => {
      stage.classList.remove('is-zoom');
      gsap.to(zoom, { scale: 1, x: 0, y: 0, duration: 0.9, ease: 'expo.out', overwrite: true });
    });
    stage.addEventListener('pointermove', (e) => {
      const r = stage.getBoundingClientRect();
      const nx = (e.clientX - r.left) / r.width - 0.5;
      const ny = (e.clientY - r.top) / r.height - 0.5;
      gsap.to(zoom, { scale: 1.7, x: -nx * r.width * 0.7, y: -ny * r.height * 0.7, duration: 0.9, ease: 'expo.out', overwrite: true });
    });
  }

  /* ---- story + details ---- */
  $('.pd__storytext').textContent = p.story;
  const acc = $('.pd__acc');
  Object.entries(p.details).forEach(([k, v], i) => {
    const d = document.createElement('details');
    d.className = 'acc';
    if (i === 0) d.open = true;
    d.innerHTML = '<summary><span></span><i></i></summary><div class="acc__body"><p></p></div>';
    $('summary span', d).textContent = k;
    $('p', d).textContent = v;
    acc.appendChild(d);
  });

  /* ---- reviews: this piece first, then the rest ---- */
  setupReviews($('#reviews'), {
    list: [...own, ...REVIEWS.filter((r) => r.product !== p.id)],
    kicker: own.length ? `Kind words · ${p.name}` : 'Kind words',
    title: 'Worn, loved,<br /><em>and kept.</em>',
    marquee: false,
  });

  /* ---- you may also like ---- */
  const more = $('.pd__more .coll__grid');
  const others = PIECES.filter((x) => x.id !== p.id);
  const related = [...others.filter((x) => x.tags.some((t) => p.tags.includes(t))), ...others.filter((x) => !x.tags.some((t) => p.tags.includes(t)))].slice(0, 4);
  related.forEach((x) => more.appendChild(card(x, (q) => leaveTo(`/product.html?id=${q.id}`))));
  $$('.js-piece', more).forEach((c) => c.setAttribute('data-reveal', ''));

  /* ---- entrance ---- */
  if (!reduced()) {
    gsap.from('.pd__disc', { scale: 0.55, autoAlpha: 0, duration: 1.8, ease: 'expo.out' });
    gsap.from(img, { y: 80, autoAlpha: 0, duration: 1.6, ease: 'expo.out', delay: 0.15 });
    gsap.from('.pd__arc', { autoAlpha: 0, rotate: -20, duration: 1.6, ease: 'expo.out', stagger: 0.1, delay: 0.3 });
    gsap.from($$('.pd__info > *'), { y: 30, autoAlpha: 0, duration: 1, ease: 'power3.out', stagger: 0.05, delay: 0.25 });
    gsap.fromTo($$('.pd__thumbs button'), { y: 20, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.9, ease: 'power3.out', stagger: 0.07, delay: 0.5, clearProps: 'transform,opacity,visibility' });
  }
});
