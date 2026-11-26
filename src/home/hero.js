import { gsap, ScrollTrigger, SplitText, $, $$, reduced, lenisNow, scrollTo } from './core.js';
import { SLIDES, SILHOUETTES } from './heroData.js';
import { HeroGL } from './heroGL.js';

const COUNT = SLIDES.length;
const PER_SLIDE = 1.5; // viewport heights of scroll per slide change
const br = (s) => s.split('\n').join('<br />');
const ARROW = '<svg><use href="#arrow" /></svg>';

function buildSlides(root) {
  root.innerHTML = SLIDES.map((s, i) => {
    const T = i === 0 ? 'h1' : 'h2';
    const label = s.cta.label ?? `Explore ${s.title.replace('\n', ' ')}`;
    return `<div class="slide js-slide" style="visibility:${i === 0 ? 'visible' : 'hidden'}">
      ${s.kicker ? `<p class="kicker slide__kicker js-kicker">${s.kicker}</p>` : ''}
      <${T} class="slide__title js-title">${br(s.title)}</${T}>
      <span class="slide__rule js-rule"></span>
      <p class="slide__body js-body">${br(s.body)}</p>
      <a href="${s.cta.href}" class="slide__cta js-cta ${s.cta.label ? '' : 'slide__cta--icon'}" aria-label="${label}">${s.cta.label ?? ''}${ARROW}</a>
    </div>`;
  }).join('');
}

/* Two canvases of drifting rose petals: the back layer passes behind the model. */
function petals(back, front, { count, getProgress, project }) {
  const fc = front.getContext('2d');
  const bc = back.getContext('2d');
  let w = 0;
  let h = 0;
  let dpr = 1;
  const size = () => {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = front.clientWidth;
    h = front.clientHeight;
    for (const c of [front, back]) {
      c.width = w * dpr;
      c.height = h * dpr;
    }
  };
  size();
  window.addEventListener('resize', size);
  const rnd = (a, b) => a + Math.random() * (b - a);
  const list = Array.from({ length: count }, () => ({
    x: rnd(0, 1), y: rnd(0, 1), z: rnd(0.35, 1), r: rnd(0, Math.PI * 2), vr: rnd(-0.6, 0.6),
    flip: rnd(0, Math.PI * 2), vf: rnd(0.8, 2), hue: rnd(340, 356), back: Math.random() < 0.7,
  }));
  let gust = 0;
  gsap.ticker.add((_, dms) => {
    const dt = Math.min(dms, 50) / 1000;
    const vel = lenisNow()?.velocity ?? 0;
    gust += (Math.min(Math.abs(vel), 60) / 60 - gust) * 0.08;
    fc.setTransform(dpr, 0, 0, dpr, 0, 0);
    fc.clearRect(0, 0, w, h);
    bc.setTransform(dpr, 0, 0, dpr, 0, 0);
    bc.clearRect(0, 0, w, h);
    for (const p of list) {
      const sp = (0.018 + gust * 0.12) * p.z;
      p.x += (sp * 0.9 + Math.sin(p.flip * 0.5) * 0.004) * dt * 3;
      p.y += (sp * 0.55 - (vel > 0 ? gust * 0.05 : -gust * 0.05) * p.z) * dt * 3;
      p.r += p.vr * dt;
      p.flip += p.vf * dt;
      if (p.x > 1.08) { p.x = -0.08; p.y = rnd(-0.1, 0.9); }
      if (p.y > 1.08) { p.y = -0.08; p.x = rnd(-0.1, 0.9); }
      if (p.y < -0.1) p.y = 1.05;
      const s = 7 + p.z * 11;
      const g = p.back ? bc : fc;
      g.save();
      g.translate(p.x * w, p.y * h);
      g.rotate(p.r);
      g.scale(1, 0.35 + 0.65 * Math.abs(Math.cos(p.flip)));
      g.globalAlpha = 0.35 + p.z * 0.5;
      const grad = g.createLinearGradient(-s, 0, s, 0);
      grad.addColorStop(0, `hsl(${p.hue} 55% 62%)`);
      grad.addColorStop(1, `hsl(${p.hue} 60% 78%)`);
      g.fillStyle = grad;
      g.beginPath();
      g.moveTo(-s, 0);
      g.bezierCurveTo(-s * 0.4, -s * 0.75, s * 0.6, -s * 0.55, s, 0);
      g.bezierCurveTo(s * 0.5, s * 0.55, -s * 0.4, s * 0.6, -s, 0);
      g.fill();
      g.restore();
    }
    // cut the model's silhouette out of the back layer, only while a slide is settled
    const prog = getProgress();
    const idx = Math.round(prog);
    const vis = 1 - Math.min(1, Math.abs(prog - idx) / 0.18);
    back.style.opacity = String(Math.max(0, vis));
    const poly = SILHOUETTES[idx];
    if (poly && vis > 0.01) {
      const pts = poly.map(([x, y]) => project(idx, x, y));
      if (pts.every(Boolean)) {
        bc.save();
        bc.globalCompositeOperation = 'destination-out';
        bc.filter = 'blur(9px)';
        bc.fillStyle = '#000';
        bc.beginPath();
        pts.forEach((p, k) => (k ? bc.lineTo(p[0] * w, p[1] * h) : bc.moveTo(p[0] * w, p[1] * h)));
        bc.closePath();
        bc.fill();
        bc.restore();
      }
    }
  });
}

export function setupHero({ onReady }) {
  const section = $('#top');
  const canvas = $('.hero__gl', section);
  buildSlides($('.hero__slides', section));
  const state = { p: 0 };
  let renderer = null;

  // rail
  const rail = $('.rail__in', section);
  const labels = SLIDES.map((s) => s.title.replace('\n', ' '));
  const dots = labels.map((l, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.setAttribute('aria-label', `Go to ${l}`);
    b.setAttribute('aria-current', String(i === 0));
    rail.appendChild(b);
    return b;
  });
  let active = 0;
  const setActive = (i) => {
    if (i === active) return;
    active = i;
    dots.forEach((d, k) => d.setAttribute('aria-current', String(k === i)));
  };

  // WebGL
  const lowPower = window.matchMedia('(max-width: 768px)').matches || (navigator.hardwareConcurrency ?? 8) <= 4;
  try {
    renderer = HeroGL.create(canvas, { reduceMotion: reduced(), lowPower });
  } catch (e) {
    console.error(e);
    renderer = null;
  }
  const fallback = () => {
    const img = document.createElement('img');
    img.src = SLIDES[0].image;
    img.alt = '';
    img.className = 'hero__fallback';
    canvas.after(img);
    onReady();
  };
  if (!renderer) fallback();
  else {
    let visible = true;
    new IntersectionObserver(([e]) => (visible = e.isIntersecting)).observe(section);
    const shift = { x: 0, y: 0 };
    const goal = { x: 0, y: 0 };
    window.addEventListener('pointermove', (e) => {
      goal.x = (e.clientX / window.innerWidth) * 2 - 1;
      goal.y = (e.clientY / window.innerHeight) * 2 - 1;
    }, { passive: true });
    renderer
      .load(SLIDES)
      .then(() => {
        gsap.ticker.add((t) => {
          if (!visible) return;
          shift.x += (goal.x - shift.x) * 0.045;
          shift.y += (goal.y - shift.y) * 0.045;
          renderer.render(state.p, t, shift);
        });
        onReady();
      })
      .catch((e) => {
        console.error(e);
        fallback();
      });
  }

  petals($('.hero__petals--back', section), $('.hero__petals--front', section), {
    count: window.matchMedia('(max-width: 768px)').matches ? 16 : 30,
    getProgress: () => state.p,
    project: (i, x, y) => renderer?.uvToScreen(i, x, y) ?? null,
  });

  let trigger = null;
  dots.forEach((d, i) =>
    d.addEventListener('click', () => {
      if (!trigger) return;
      scrollTo(trigger.start + (i / (COUNT - 1)) * (trigger.end - trigger.start), { duration: 1.4 + Math.abs(i - active) * 0.25 });
    }),
  );
  $$('.js-cta', section).forEach((a) =>
    a.addEventListener('click', (e) => {
      e.preventDefault();
      const href = a.getAttribute('href');
      scrollTo(document.querySelector(href) ? href : '#collections');
    }),
  );

  // called once the loader has gone: intro + scroll-scrubbed timeline
  return function start() {
    const rm = reduced();
    const blocks = $$('.js-slide', section).map((block) => {
      const title = SplitText.create($('.js-title', block), { type: 'lines,chars', mask: 'lines' });
      const body = SplitText.create($('.js-body', block), { type: 'lines', mask: 'lines' });
      [...title.masks, ...body.masks].forEach((m) => m.classList.add('split-mask'));
      return { block, kicker: $('.js-kicker', block), chars: title.chars, rule: $('.js-rule', block), body: body.lines, cta: $('.js-cta', block) };
    });
    const textIn = (tl, b, at, k = 1) => {
      if (b.kicker) tl.fromTo(b.kicker, { autoAlpha: 0, y: 18, letterSpacing: '0.55em' }, { autoAlpha: 1, y: 0, letterSpacing: '0.32em', duration: 0.3 * k, ease: 'power2.out' }, at);
      tl.fromTo(b.chars, { yPercent: 118, rotate: 5 }, { yPercent: 0, rotate: 0, duration: 0.28 * k, stagger: { amount: 0.12 * k }, ease: 'power3.out' }, at + 0.03 * k);
      tl.fromTo(b.rule, { scaleX: 0 }, { scaleX: 1, duration: 0.24 * k, ease: 'power2.out' }, at + 0.16 * k);
      tl.fromTo(b.body, { yPercent: 108 }, { yPercent: 0, duration: 0.26 * k, stagger: 0.04 * k, ease: 'power3.out' }, at + 0.12 * k);
      tl.fromTo(b.cta, { autoAlpha: 0, y: 16 }, { autoAlpha: 1, y: 0, duration: 0.2 * k, ease: 'power2.out' }, at + 0.2 * k);
    };
    const intro = gsap.timeline({ delay: 0.15 });
    intro.from('.nav', { autoAlpha: 0, y: -16, duration: 1.1, ease: 'power3.out', clearProps: 'all' }, 0);
    intro.from('.rail', { autoAlpha: 0, x: 16, duration: 1.1, ease: 'power3.out' }, 0.3);
    textIn(intro, blocks[0], 0.1, 3.2);

    const scrim = $('.hero__scrim', section);
    const tl = gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: {
        trigger: section,
        start: 'top top',
        end: () => `+=${window.innerHeight * PER_SLIDE * (COUNT - 1)}`,
        pin: true,
        scrub: rm ? true : 0.6,
        invalidateOnRefresh: true,
        snap: lenisNow() ? undefined : { snapTo: 1 / (COUNT - 1), duration: { min: 0.3, max: 0.8 }, ease: 'power2.inOut' },
        onUpdate: () => setActive(Math.round(state.p)),
      },
    });
    trigger = tl.scrollTrigger;
    tl.to(state, { p: COUNT - 1, duration: COUNT - 1 }, 0);
    blocks.forEach((b, i) => {
      if (i > 0) {
        const at = i - 1 + 0.62;
        tl.set(b.block, { autoAlpha: 1 }, at);
        textIn(tl, b, at);
      }
      if (i < COUNT - 1) {
        tl.to(b.block, { autoAlpha: 0, y: -30, filter: 'blur(8px)', duration: 0.24, ease: 'power2.in' }, i + 0.03);
        tl.to(scrim, { opacity: 0.15, duration: 0.2 }, i + 0.05);
        tl.to(scrim, { opacity: 1, duration: 0.3 }, i + 0.6);
      }
    });
    blocks.slice(1).forEach((b) => gsap.set(b.block, { autoAlpha: 0 }));

    // after the wheel stops between two slides, glide on to the next one
    const l = lenisNow();
    if (!l) return;
    let t1 = 0;
    let t2 = 0;
    let busy = false;
    const settle = () => {
      const st = trigger;
      if (!st) return;
      const y = l.targetScroll;
      if (y < st.start - 2 || y > st.end + 2) return;
      const span = st.end - st.start;
      const pos = ((y - st.start) / span) * (COUNT - 1);
      const frac = pos - Math.floor(pos);
      if (frac < 0.003 || frac > 0.997) return;
      const to = l.direction >= 0 ? (frac > 0.03 ? Math.ceil(pos) : Math.floor(pos)) : frac < 0.97 ? Math.floor(pos) : Math.ceil(pos);
      busy = true;
      l.scrollTo(st.start + (to / (COUNT - 1)) * span, { duration: 2.4, easing: (e) => 1 - (1 - e) ** 2.2, onComplete: () => (busy = false) });
    };
    const onWheel = () => {
      busy = false;
      clearTimeout(t1);
      t1 = setTimeout(settle, 90);
    };
    window.addEventListener('wheel', onWheel, { passive: true });
    window.addEventListener('touchend', onWheel, { passive: true });
    l.on('scroll', () => {
      clearTimeout(t2);
      if (!busy) t2 = setTimeout(settle, 220);
    });
  };
}
