import { gsap, ScrollTrigger, $, $$, reduced } from './core.js';
import { REVIEWS } from './reviewsData.js';
import { byId } from './products.js';

const stars = (n) =>
  `<span class="stars" role="img" aria-label="${n} out of 5">${[1, 2, 3, 4, 5].map((i) => `<svg class="${i <= n ? 'on' : ''}" aria-hidden="true"><use href="#star" /></svg>`).join('')}</span>`;

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

function cardHtml(r, i) {
  const p = byId(r.product);
  return `<article class="rv__card js-rv-card" style="--i:${i}">
    <div class="rv__top">
      ${stars(r.rating)}
      <span class="rv__occ">${esc(r.occasion)}</span>
    </div>
    <blockquote class="rv__quote"><span class="rv__mark" aria-hidden="true">“</span>${esc(r.text)}</blockquote>
    <div class="rv__who">
      <span class="rv__avatar" aria-hidden="true">${esc(r.name[0])}</span>
      <span><b>${esc(r.name)}</b><small>${esc(r.place)}</small></span>
    </div>
    ${
      p
        ? `<a class="rv__piece" href="/product.html?id=${p.id}" draggable="false">
        <img src="/collection/${p.id}.webp" alt="" loading="lazy" width="820" height="897" draggable="false" />
        <span><small>Wore</small>${esc(p.name)}</span>
        <svg aria-hidden="true"><use href="#arrow" /></svg>
      </a>`
        : ''
    }
  </article>`;
}

/**
 * Customer reviews: a rating summary and a draggable carousel.
 * opts.list narrows the reviews (the product page shows that piece first).
 */
export function setupReviews(root, opts = {}) {
  if (!root) return;
  const list = opts.list ?? REVIEWS;
  const avg = list.reduce((s, r) => s + r.rating, 0) / list.length;
  const fives = list.filter((r) => r.rating === 5).length;
  root.innerHTML = `
    <div class="rv__in">
      <div class="rv__head">
        <div class="rv__title js-rv-reveal">
          <p class="kicker">${opts.kicker ?? 'Kind words'}</p>
          <h2>${opts.title ?? 'Worn once,<br /><em>remembered always.</em>'}</h2>
        </div>
        <div class="rv__score js-rv-reveal">
          <p class="rv__avg">${avg.toFixed(1)}<small>/5</small></p>
          <div>
            ${stars(Math.round(avg))}
            <p>${list.length} reviews · ${Math.round((fives / list.length) * 100)}% gave five stars</p>
          </div>
        </div>
      </div>
      <div class="rv__viewport js-rv-reveal">
        <div class="rv__track">${list.map(cardHtml).join('')}</div>
      </div>
      <div class="rv__ctrl js-rv-reveal">
        <span class="rv__bar"><i></i></span>
        <span class="rv__count" aria-live="polite"></span>
        <button type="button" class="rv__btn" data-dir="-1" aria-label="Previous review"><svg aria-hidden="true"><use href="#arrow" /></svg></button>
        <button type="button" class="rv__btn" data-dir="1" aria-label="Next review"><svg aria-hidden="true"><use href="#arrow" /></svg></button>
      </div>
    </div>
    ${
      opts.marquee === false
        ? ''
        : `<div class="rv__marquee" aria-hidden="true"><div>${Array(2)
            .fill(['Handloom silk', 'Real zari', 'Finished by hand', 'Small batches', 'Blouse stitching', 'Video fittings', 'Wrapped in muslin'].map((t) => `<span>${t}</span><svg><use href="#lotus" /></svg>`).join(''))
            .join('')}</div></div>`
    }`;

  const vp = $('.rv__viewport', root);
  const track = $('.rv__track', root);
  const cards = $$('.js-rv-card', root);
  const bar = $('.rv__bar i', root);
  const count = $('.rv__count', root);
  const [prev, next] = $$('.rv__btn', root);
  let index = 0;
  let x = 0;
  const step = () => (cards[1] ? cards[1].offsetLeft - cards[0].offsetLeft : cards[0].offsetWidth);
  const maxX = () => Math.max(0, track.scrollWidth - vp.clientWidth);
  const lastIndex = () => Math.min(cards.length - 1, Math.ceil(maxX() / step() - 0.01));
  const xFor = (i) => Math.min(maxX(), i * step());

  const sync = () => {
    const last = lastIndex();
    const p = last ? index / last : 1;
    bar.style.transform = `scaleX(${Math.max(0.08, p)})`;
    count.textContent = `${String(index + 1).padStart(2, '0')} / ${String(last + 1).padStart(2, '0')}`;
    prev.disabled = index <= 0;
    next.disabled = index >= last;
  };
  const go = (i, dur = 1.1) => {
    index = Math.max(0, Math.min(lastIndex(), i));
    x = xFor(index);
    gsap.to(track, { x: -x, duration: reduced() ? 0 : dur, ease: 'expo.out', overwrite: true });
    sync();
  };
  prev.addEventListener('click', () => go(index - 1));
  next.addEventListener('click', () => go(index + 1));
  vp.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') go(index + 1);
    if (e.key === 'ArrowLeft') go(index - 1);
  });
  vp.tabIndex = 0;
  vp.setAttribute('aria-label', 'Reviews, use the arrow keys to browse');

  // drag (the petal cursor turns into the grab ring, same as Pick a Drape)
  let down = null;
  let moved = false;
  const cursor = (c) => (document.body.style.cursor = c);
  vp.addEventListener('pointerenter', (e) => e.pointerType === 'mouse' && !down && cursor('grab'));
  vp.addEventListener('pointerleave', () => !down && cursor(''));
  vp.addEventListener('pointerdown', (e) => {
    if (e.button !== 0) return;
    down = { x: e.clientX, y: e.clientY, t: performance.now(), start: x, id: e.pointerId, axis: null };
    moved = false;
    if (e.pointerType === 'mouse') cursor('grabbing');
  });
  window.addEventListener('pointermove', (e) => {
    if (!down || e.pointerId !== down.id) return;
    const dx = e.clientX - down.x;
    const dy = e.clientY - down.y;
    if (!down.axis && Math.hypot(dx, dy) > 6) {
      down.axis = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
      if (down.axis === 'x') vp.setPointerCapture?.(e.pointerId);
    }
    if (down.axis !== 'x') return;
    moved = true;
    let nx = down.start - dx;
    const m = maxX();
    if (nx < 0) nx *= 0.35;
    else if (nx > m) nx = m + (nx - m) * 0.35;
    x = nx;
    gsap.set(track, { x: -x });
  });
  const up = (e) => {
    if (!down || (e.pointerId != null && e.pointerId !== down.id)) return;
    const dx = e.clientX - down.x;
    const v = dx / Math.max(1, performance.now() - down.t);
    const wasX = down.axis === 'x';
    down = null;
    cursor(vp.matches(':hover') ? 'grab' : '');
    if (!wasX) return;
    const flick = Math.abs(v) > 0.45 ? -Math.sign(v) : 0;
    go(Math.round(x / step()) + (Math.abs(dx) > step() * 0.5 ? 0 : flick), 0.9);
  };
  window.addEventListener('pointerup', up);
  window.addEventListener('pointercancel', up);
  // a drag should not also follow the "Wore …" link
  vp.addEventListener('click', (e) => moved && (e.preventDefault(), e.stopPropagation()), true);
  vp.addEventListener('dragstart', (e) => e.preventDefault());

  window.addEventListener('resize', () => go(index, 0));
  sync();

  if (!reduced()) {
    gsap.from($$('.js-rv-reveal', root), {
      y: 50,
      autoAlpha: 0,
      duration: 1.1,
      ease: 'power3.out',
      stagger: 0.1,
      scrollTrigger: { trigger: root, start: 'top 75%' },
    });
    // fromTo + clearProps: the cards also have a CSS transform transition for hover
    gsap.fromTo(cards, { xPercent: 18, autoAlpha: 0 }, {
      xPercent: 0,
      autoAlpha: 1,
      duration: 1.3,
      ease: 'expo.out',
      stagger: 0.08,
      clearProps: 'transform,opacity,visibility',
      scrollTrigger: { trigger: vp, start: 'top 85%' },
    });
  }
  requestAnimationFrame(() => ScrollTrigger.refresh());
}
