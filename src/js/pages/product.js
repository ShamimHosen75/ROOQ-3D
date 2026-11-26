import gsap from 'gsap';
import { initSite, reveals, reduced, $, $$, esc, ARROW, bag, openBag, toast, BLOUSE_STITCHING } from '../shared.js';
import { PRODUCTS, productById, rupees, relatedTo, FILTER_LABELS } from '../products.js';
import { reviewsFor, REVIEWS, stars } from '../reviews.js';
import { buildCard, revealCards, bindHeart, HEART } from '../collection.js';
import { setupReviews } from '../reviewsSection.js';
import { split } from '../split.js';

initSite({ page: 'product' });

const id = new URLSearchParams(location.search).get('id');
const p = productById(id) || PRODUCTS[0];
document.title = `${p.name} · ROOQ Clothing Atelier`;
document.querySelector('meta[name="description"]').content = p.blurb;

const own = reviewsFor(p.id);
const avg = own.length ? own.reduce((n, r) => n + r.rating, 0) / own.length : 5;
const cat = p.cats[0];

$('.pdp').innerHTML = `
  <nav class="crumbs" aria-label="Breadcrumb"><a href="/">Home</a><span>/</span><a href="/collections.html">Sarees</a><span>/</span><a href="/collections.html?cat=${cat}">${FILTER_LABELS[cat]}</a><span>/</span><span aria-current="page">${esc(p.name)}</span></nav>
  <div class="pdp__gallery">
    <div class="pdp__stage" data-cursor>
      <span class="pdp__disc" aria-hidden="true"></span>
      <img class="pdp__arc pdp__arc--a" src="/images/ui/arc-big.png" alt="" aria-hidden="true" />
      <img class="pdp__arc pdp__arc--b" src="/images/ui/arc-small.png" alt="" aria-hidden="true" />
      ${p.images.map((src, i) => `<img class="pdp__img${i === 0 ? ' is-active' : ''}" src="${src}" alt="${esc(p.name)}, view ${i + 1}" />`).join('')}
    </div>
    ${
      p.images.length > 1
        ? `<div class="pdp__thumbs" role="tablist" aria-label="Photos">${p.images
            .map((src, i) => `<button type="button" class="pdp__thumb${i === 0 ? ' is-active' : ''}" data-i="${i}" aria-label="View ${i + 1}"><img src="${src}" alt="" /></button>`)
            .join('')}</div>`
        : ''
    }
  </div>
  <div class="pdp__info">
    <p class="eyebrow">${esc(p.fabric)}</p>
    <h1 class="pdp__name">${esc(p.name)}</h1>
    <a class="pdp__rating" href="#reviews"><span class="stars">${stars(Math.round(avg))}</span>${own.length ? `${own.length} review${own.length > 1 ? 's' : ''}` : 'Be the first to review'}</a>
    <span class="slide__rule"></span>
    <p class="pdp__price"><span class="pdp__amount">${rupees(p.price)}</span><small>Inclusive of all taxes</small></p>
    <p class="pdp__blurb">${esc(p.blurb)}</p>
    <dl class="pdp__facts">
      <div><dt>Fabric</dt><dd>${esc(p.fabric)}</dd></div>
      <div><dt>Work</dt><dd>${esc(p.work)}</dd></div>
      <div><dt>Colour</dt><dd>${esc(p.colour)}</dd></div>
      <div><dt>Length</dt><dd>5.5 m saree + 0.8 m blouse piece</dd></div>
    </dl>
    <fieldset class="pdp__opt">
      <legend>Blouse</legend>
      <label class="chip"><input type="radio" name="blouse" value="unstitched" checked /><span>Unstitched piece</span></label>
      <label class="chip"><input type="radio" name="blouse" value="stitched" /><span>Stitched to size <em>+ ${rupees(BLOUSE_STITCHING)}</em></span></label>
    </fieldset>
    <div class="pdp__buy">
      <div class="qty" aria-label="Quantity"><button type="button" data-step="-1" aria-label="One less">−</button><span class="pdp__qty">1</span><button type="button" data-step="1" aria-label="One more">+</button></div>
      <button type="button" class="btn btn--solid pdp__add"><span class="pdp__add-label">Add to bag</span> ${ARROW}</button>
      <button type="button" class="heart heart--lg" aria-label="Save ${esc(p.name)}">${HEART}</button>
    </div>
    <ul class="pdp__promises">
      <li><svg viewBox="0 0 24 24"><path d="M3 7h11v9H3zM14 10h4l3 3v3h-7" /><circle cx="7" cy="17.5" r="1.6" /><circle cx="17" cy="17.5" r="1.6" /></svg>Free shipping in India</li>
      <li><svg viewBox="0 0 24 24"><path d="M4 12a8 8 0 1 0 2.4-5.7M4 4v4h4" /></svg>7-day exchange</li>
      <li><svg viewBox="0 0 64 40"><use href="#rooq-mark" /></svg>Handcrafted</li>
    </ul>
    <div class="pdp__accs">
      <details class="acc" open><summary>The story<i></i></summary><div class="acc__body"><p>${esc(p.story)}</p></div></details>
      <details class="acc"><summary>Fabric &amp; care<i></i></summary><div class="acc__body"><p>Dry clean only. Store folded in muslin, away from damp and direct sun, and refold along new lines every few months so the zari does not crease.</p></div></details>
      <details class="acc"><summary>Shipping &amp; exchange<i></i></summary><div class="acc__body"><p>Ready to ship in 2 to 4 days; a stitched blouse adds about a week. Unworn sarees with tags can be exchanged within 7 days of delivery.</p></div></details>
    </div>
  </div>`;

/* gallery */
const imgs = $$('.pdp__img');
const thumbs = $$('.pdp__thumb');
let cur = 0;
const showImg = (n) => {
  if (n === cur) return;
  const d = reduced ? 0 : 1;
  const prev = imgs[cur];
  cur = n;
  thumbs.forEach((t, i) => t.classList.toggle('is-active', i === n));
  gsap.to(prev, { autoAlpha: 0, scale: 0.96, duration: 0.5 * d, onComplete: () => prev.classList.remove('is-active') });
  imgs[n].classList.add('is-active');
  gsap.fromTo(imgs[n], { autoAlpha: 0, scale: 1.05, yPercent: 3 }, { autoAlpha: 1, scale: 1, yPercent: 0, duration: 1.1 * d, ease: 'expo.out' });
};
thumbs.forEach((t) => t.addEventListener('click', () => showImg(Number(t.dataset.i))));
gsap.set(imgs.slice(1), { autoAlpha: 0 });

// soft tilt toward the pointer
const stage = $('.pdp__stage');
if (!reduced) {
  const qx = gsap.quickTo(imgs, 'x', { duration: 0.9, ease: 'power3.out' });
  const qr = gsap.quickTo(imgs, 'rotation', { duration: 0.9, ease: 'power3.out' });
  const qa = gsap.quickTo('.pdp__arc--a', 'rotation', { duration: 1.4, ease: 'power3.out' });
  stage.addEventListener('pointermove', (e) => {
    const r = stage.getBoundingClientRect();
    const nx = (e.clientX - r.left) / r.width - 0.5;
    qx(nx * 18);
    qr(nx * 1.6);
    qa(nx * 40);
  });
  stage.addEventListener('pointerleave', () => {
    qx(0);
    qr(0);
    qa(0);
  });
}

/* buy box */
let qty = 1;
$$('.pdp__buy .qty button').forEach((b) =>
  b.addEventListener('click', () => {
    qty = Math.max(1, Math.min(9, qty + Number(b.dataset.step)));
    $('.pdp__qty').textContent = qty;
  }),
);
$$('input[name="blouse"]').forEach((r) =>
  r.addEventListener('change', () => {
    const extra = r.value === 'stitched' && r.checked ? BLOUSE_STITCHING : 0;
    $('.pdp__amount').textContent = rupees(p.price + extra);
  }),
);
bindHeart($('.heart--lg'), p.id, reduced);
$('.pdp__add').addEventListener('click', (e) => {
  const blouse = $('input[name="blouse"]:checked').value;
  bag.add(p.id, { blouse, qty });
  const btn = e.currentTarget;
  btn.classList.add('is-added');
  $('.pdp__add-label').textContent = 'Added';
  setTimeout(() => {
    btn.classList.remove('is-added');
    $('.pdp__add-label').textContent = 'Add to bag';
  }, 1800);
  toast(`<strong>${esc(p.name)}</strong> is in your bag. <button type="button" class="toast__link">View bag</button>`);
  document.querySelector('.toast__link')?.addEventListener('click', openBag, { once: true });
  if (!reduced) gsap.fromTo('.bag-btn', { scale: 1 }, { scale: 1.25, duration: 0.25, yoyo: true, repeat: 1, ease: 'power2.out' });
});

/* story band */
$('.pdp-story').innerHTML = `
  <figure class="pdp-story__media"><img src="${p.images[p.images.length - 1]}" alt="" data-parallax="8" /></figure>
  <div class="pdp-story__copy">
    <p class="eyebrow" data-reveal>Made by hand</p>
    <h2 class="pdp-story__title" data-split>${esc(p.work)}</h2>
    <p data-reveal>${esc(p.story)}</p>
    <a class="link" href="/about.html" data-reveal>How our drapes are made ${ARROW}</a>
  </div>`;

/* reviews: this saree's first, then the rest */
setupReviews($('.reviews--pdp'), {
  reduced,
  list: [...own, ...REVIEWS.filter((r) => r.product !== p.id)].slice(0, 5),
  title: own.length ? 'Worn and loved' : 'Kind words',
  marquee: false,
});

/* related */
const rel = relatedTo(p).map((q) => buildCard(q, reduced));
$('.related__grid').append(...rel);

/* entrance */
const d = reduced ? 0 : 1;
const { chars } = split($('.pdp__name'));
gsap
  .timeline({ delay: 0.15 })
  .fromTo('.pdp__disc', { scale: 0.5, autoAlpha: 0 }, { scale: 1, autoAlpha: 1, duration: 1.6 * d, ease: 'expo.out' }, 0)
  .fromTo(imgs[0], { yPercent: 10, autoAlpha: 0 }, { yPercent: 0, autoAlpha: 1, duration: 1.4 * d, ease: 'expo.out' }, 0.1)
  .fromTo('.pdp__arc', { rotate: -60, autoAlpha: 0 }, { rotate: 0, autoAlpha: 1, duration: 1.8 * d, stagger: 0.15, ease: 'expo.out' }, 0.3)
  .fromTo('.pdp__thumb', { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, stagger: 0.08, duration: 0.8 * d }, 0.6)
  .fromTo(chars, { yPercent: 110, opacity: 0 }, { yPercent: 0, opacity: 1, stagger: 0.03 * d, duration: 1 * d, ease: 'expo.out' }, 0.2)
  .fromTo('.pdp__info .slide__rule', { scaleX: 0 }, { scaleX: 1, duration: 0.9 * d, ease: 'expo.out' }, 0.5)
  .fromTo('.pdp__info > *:not(.pdp__name):not(.slide__rule)', { autoAlpha: 0, y: 18 }, { autoAlpha: 1, y: 0, stagger: 0.06, duration: 0.9 * d, ease: 'power3.out' }, 0.3);

reveals();
revealCards(rel, reduced);
