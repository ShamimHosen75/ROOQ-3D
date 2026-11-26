import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { REVIEWS, stars } from './reviews.js';
import { productById } from './products.js';
import { split } from './split.js';
import { esc, ARROW } from './shared.js';

/**
 * "Kind words": one large quote at a time (auto-advancing, with a progress line),
 * the saree it was about beside it, and a slow marquee of short quotes below.
 */
export function setupReviews(section, { reduced, list = REVIEWS, title = 'Loved, worn,<br />remembered', marquee = true } = {}) {
  const d = reduced ? 0 : 1;
  const avg = (list.reduce((n, r) => n + r.rating, 0) / list.length).toFixed(1);
  section.innerHTML = `
    <div class="reviews__head">
      <p class="eyebrow">Kind words</p>
      <h2 class="reviews__title" data-split>${title}</h2>
      <p class="reviews__score"><span class="stars" aria-hidden="true">★★★★★</span><strong>${avg}</strong> average from ${list.length} reviews</p>
    </div>
    <div class="reviews__stage">
      <figure class="reviews__photo"><img alt="" /><img alt="" class="is-next" /><span class="reviews__ring" aria-hidden="true"></span></figure>
      <div class="reviews__quote" aria-live="polite">
        <span class="reviews__mark" aria-hidden="true">“</span>
        <blockquote class="reviews__text"></blockquote>
        <p class="reviews__who"><strong class="reviews__name"></strong><span class="reviews__meta"></span></p>
        <a class="link reviews__product"></a>
      </div>
      <div class="reviews__nav">
        <button type="button" class="reviews__btn" data-dir="-1" aria-label="Previous review"><svg viewBox="0 0 24 12"><path d="M24 6H2M7 1 2 6l5 5" /></svg></button>
        <span class="reviews__count"><em>01</em> / ${String(list.length).padStart(2, '0')}</span>
        <button type="button" class="reviews__btn" data-dir="1" aria-label="Next review">${ARROW}</button>
        <span class="reviews__bar"><i></i></span>
      </div>
    </div>
    ${
      marquee
        ? `<div class="reviews__marquee" aria-hidden="true"><div class="reviews__track">${[...list, ...list]
            .map((r) => `<span class="reviews__chip"><span class="stars">${stars(r.rating)}</span>${esc(r.text.split('.')[0])}.<em>${esc(r.name)}</em></span>`)
            .join('')}</div></div>`
        : ''
    }`;

  const $ = (s) => section.querySelector(s);
  const imgs = [...section.querySelectorAll('.reviews__photo img')];
  let i = 0;
  let front = 0;
  let timer;
  const DUR = 7;

  const fill = (r) => {
    const p = productById(r.product);
    $('.reviews__text').textContent = r.text;
    $('.reviews__name').textContent = r.name;
    $('.reviews__meta').textContent = `${r.place} · ${r.occasion} · ${stars(r.rating)}`;
    const a = $('.reviews__product');
    a.innerHTML = `${esc(p.name)} ${ARROW}`;
    a.href = p.url;
    $('.reviews__count em').textContent = String(i + 1).padStart(2, '0');
    return p;
  };

  const show = (n, first = false) => {
    i = (n + list.length) % list.length;
    const r = list[i];
    const p = productById(r.product);
    // photo crossfade
    const next = imgs[1 - front];
    next.src = p.image;
    gsap.fromTo(next, { autoAlpha: 0, scale: 1.06, yPercent: 4 }, { autoAlpha: 1, scale: 1, yPercent: 0, duration: 1.2 * d, ease: 'expo.out' });
    gsap.to(imgs[front], { autoAlpha: 0, scale: 0.97, duration: 0.6 * d });
    front = 1 - front;
    // text: out, swap, words rise in
    const q = $('.reviews__quote');
    gsap.timeline()
      .to(q.children, { autoAlpha: first ? 0 : 0, y: -10, duration: first ? 0 : 0.35 * d, stagger: 0.03 })
      .add(() => {
        fill(r);
        const text = $('.reviews__text');
        delete text.dataset.splitDone;
        const { words } = split(text);
        gsap.set(q.children, { autoAlpha: 1, y: 0 });
        gsap.fromTo(words, { autoAlpha: 0, y: 14, filter: 'blur(4px)' }, { autoAlpha: 1, y: 0, filter: 'blur(0px)', stagger: 0.025 * d, duration: 0.8 * d, ease: 'power3.out' });
        gsap.fromTo(['.reviews__who', '.reviews__product'].map((s) => $(s)), { autoAlpha: 0, y: 10 }, { autoAlpha: 1, y: 0, stagger: 0.08, duration: 0.8 * d, delay: 0.35 * d });
      });
    // progress line
    gsap.killTweensOf($('.reviews__bar i'));
    if (!reduced) gsap.fromTo($('.reviews__bar i'), { scaleX: 0 }, { scaleX: 1, duration: DUR, ease: 'none' });
    clearTimeout(timer);
    if (!reduced) timer = setTimeout(() => show(i + 1), DUR * 1000);
  };

  section.querySelectorAll('.reviews__btn').forEach((b) => b.addEventListener('click', () => show(i + Number(b.dataset.dir))));
  // pause while the pointer rests on the quote
  const stage = $('.reviews__stage');
  stage.addEventListener('pointerenter', () => {
    clearTimeout(timer);
    gsap.getTweensOf($('.reviews__bar i')).forEach((t) => t.pause());
  });
  stage.addEventListener('pointerleave', () => {
    const t = gsap.getTweensOf($('.reviews__bar i'))[0];
    if (!t || reduced) return;
    t.resume();
    timer = setTimeout(() => show(i + 1), (1 - t.progress()) * DUR * 1000);
  });

  gsap.set(imgs, { autoAlpha: 0 });
  ScrollTrigger.create({
    trigger: section,
    start: 'top 70%',
    once: true,
    onEnter: () => {
      gsap.fromTo('.reviews__ring', { scale: 0.6, autoAlpha: 0 }, { scale: 1, autoAlpha: 1, duration: 1.6 * d, ease: 'expo.out' });
      gsap.fromTo('.reviews__score, .reviews__nav', { autoAlpha: 0, y: 16 }, { autoAlpha: 1, y: 0, duration: 1 * d, stagger: 0.1, delay: 0.3 * d });
      show(0, true);
    },
  });

  if (marquee && !reduced) {
    const track = $('.reviews__track');
    const tween = gsap.to(track, { xPercent: -50, duration: 60, ease: 'none', repeat: -1 });
    const m = $('.reviews__marquee');
    m.addEventListener('pointerenter', () => gsap.to(tween, { timeScale: 0.2, duration: 0.6 }));
    m.addEventListener('pointerleave', () => gsap.to(tween, { timeScale: 1, duration: 0.6 }));
  }
}
