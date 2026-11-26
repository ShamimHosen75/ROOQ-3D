import { ScrollTrigger, gsap, reduced, lenisNow } from './core.js';
import { byId, inr } from './products.js';

/*
 * Virtual fitting runway. Six looks stand in a line that recedes into a haze;
 * one float `p` drives every model, the product rail and the rolling look number.
 * Depth is read from a seven-stop table (d = -1 … 5), not a formula.
 * Page scroll walks the line while the section is pinned; drag and arrow keys walk it too.
 *
 * Images: each look is cropped out of a transparent cut-out with an <svg viewBox>.
 * To use full-length model cut-outs later, change LOOKS (src + box) and nothing else.
 */
const SHEET = { w: 820, h: 897 };
const LOOKS = [
  { id: 'gulmohar', box: [25, 27, 819, 897], folded: 'maroon' },
  { id: 'noor', box: [50, 32, 820, 897] },
  { id: 'rajshree', box: [12, 31, 817, 897], folded: 'navy' },
  { id: 'swarna', box: [32, 21, 820, 897], folded: 'yellow' },
  { id: 'veena', box: [5, 17, 816, 897], folded: 'ivory' },
  { id: 'nilambari', box: [8, 25, 820, 897] },
];
// depth stops from d = -1 (leaving past the rail) to d = 5 (arriving out of the haze)
const KX = [1.2, 0.744, 0.496, 0.346, 0.235, 0.15, 0.085];
const KF = [1.14, 0.89, 0.777, 0.704, 0.651, 0.616, 0.59];
const KH = [1.18, 0.832, 0.574, 0.436, 0.334, 0.258, 0.19];
const KB = [0, 0, 1.5, 4, 8, 12, 17];
const KO = [1, 1, 1, 1, 0.86, 0.5, 0];

const N = LOOKS.length;
const NS = 'http://www.w3.org/2000/svg';
const wrap = (x, n) => ((x % n) + n) % n;
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

function crop(href, x0, y0, w, h, sheetW, sheetH) {
  const s = document.createElementNS(NS, 'svg');
  s.setAttribute('viewBox', `${x0} ${y0} ${w} ${h}`);
  s.setAttribute('aria-hidden', 'true');
  s.setAttribute('preserveAspectRatio', 'xMidYMax meet');
  const f = document.createElementNS(NS, 'svg');
  [['x', x0], ['y', y0], ['width', w], ['height', h], ['viewBox', `${x0} ${y0} ${w} ${h}`]].forEach(([k, v]) => f.setAttribute(k, v));
  const i = document.createElementNS(NS, 'image');
  i.setAttribute('href', href);
  i.setAttribute('width', sheetW);
  i.setAttribute('height', sheetH);
  f.append(i);
  s.append(f);
  return s;
}

// two pieces per look, so the rail holds twelve cards on one looping track (box: x, y, width, height)
function piecesFor(l) {
  const p = byId(l.id);
  const src = `/collection/${l.id}.webp`;
  const first = l.folded
    ? { href: `/drape/cut-${l.folded}.webp`, box: [36, 4, 832, 592], sheet: [900, 600], name: `${p.name}`, price: inr(p.price) }
    : { href: src, box: [120, 300, 700, 597], sheet: [SHEET.w, SHEET.h], name: `${p.name}`, price: inr(p.price) };
  const second = { href: src, box: [430, 560, 380, 337], sheet: [SHEET.w, SHEET.h], name: `${p.notes[1]}, up close`, price: p.notes[0] };
  return [first, second].map((x) => ({ ...x, id: p.id }));
}

export function setupRunway(root) {
  if (!root) return;
  const stage = root.querySelector('.rw__stage');
  const line = root.querySelector('.rw__line');
  const rail = root.querySelector('.rw__rail');
  const roll = root.querySelector('.rw__roll');
  const ring = root.querySelector('.rw__ring');
  const shop = root.querySelector('.rw__shop');
  const cartOut = root.querySelector('.rw__cart');

  const people = LOOKS.map((l, i) => {
    const [x0, y0, x1, y1] = l.box;
    const e = document.createElement('div');
    e.className = 'rw__m';
    e.dataset.i = i;
    e.append(crop(`/collection/${l.id}.webp`, x0, y0, x1 - x0, y1 - y0, SHEET.w, SHEET.h));
    line.append(e);
    return { e, r: (x1 - x0) / (y1 - y0), f: '', o: '' };
  });
  const items = LOOKS.flatMap(piecesFor);
  const cards = items.map((it, i) => {
    const e = document.createElement('article');
    e.className = 'rw__card' + (i % 2 ? ' alt' : '');
    e.innerHTML = `<button type="button" class="rw__fav" aria-pressed="false" aria-label="Save ${esc(it.name)}"><svg viewBox="0 0 24 24" aria-hidden="true"><use href="#heart" /></svg></button><a class="rw__shot" href="/product.html?id=${it.id}" tabindex="-1" aria-hidden="true" draggable="false"></a><div class="rw__meta"><h3>${esc(it.name)}</h3><span>${esc(it.price)}</span><button type="button" class="rw__add" aria-label="Add ${esc(it.name)} to bag"></button></div>`;
    e.querySelector('.rw__shot').append(crop(it.href, ...it.box, ...it.sheet));
    rail.append(e);
    return e;
  });
  for (let i = 0; i <= N; i++) {
    const b = document.createElement('b');
    b.textContent = String(1 + (i % N)).padStart(2, '0');
    roll.append(b);
  }
  let cart = 0;
  rail.addEventListener('click', (e) => {
    const f = e.target.closest('.rw__fav');
    if (f) f.setAttribute('aria-pressed', String(f.getAttribute('aria-pressed') !== 'true'));
    if (e.target.closest('.rw__add')) {
      cartOut.textContent = ++cart;
      cartOut.parentElement.classList.remove('bump');
      void cartOut.offsetWidth;
      cartOut.parentElement.classList.add('bump');
    }
  });

  /* ---- layout ---- */
  let W = 0;
  let H = 0;
  let base = 0;
  let cardS = 0;
  let side = false;
  let dirty = true;
  let p = 0;
  let target = 0;
  let last = 0;
  let scrollPart = 0; // looks walked by page scroll while pinned
  let manual = 0; // looks walked by drag, wheel-less keys and clicks
  const size = () => {
    W = stage.clientWidth;
    H = stage.clientHeight;
    base = H * 1.2;
    side = window.innerWidth <= 820;
    people.forEach((m) => {
      m.e.style.width = `${base * m.r}px`;
      m.e.style.height = `${base}px`;
    });
    cardS = side ? 160 : rail.clientHeight / 3;
    cards.forEach((c) => (c.style.height = side ? '100%' : `${cardS}px`));
    dirty = true;
  };
  window.addEventListener('resize', size);

  let front = -1;
  const paint = () => {
    people.forEach((m, i) => {
      let d = wrap(i - p, N);
      if (d > N - 1) d -= N;
      const k = clamp(d + 1, 0, 6);
      const a = Math.floor(k);
      const b = Math.min(6, a + 1);
      const t = k - a;
      const mix = (A) => A[a] + (A[b] - A[a]) * t;
      const h = mix(KH) * H;
      const s = h / base;
      const w = h * m.r;
      const x = mix(KX) * W - w / 2;
      const y = mix(KF) * H - h;
      m.e.style.transform = `translate3d(${x.toFixed(1)}px,${y.toFixed(1)}px,0) scale(${s.toFixed(4)})`;
      const f = mix(KB) / s;
      const fs = f < 0.2 ? 'none' : `blur(${f.toFixed(1)}px)`;
      const o = mix(KO).toFixed(3);
      if (fs !== m.f) {
        m.f = fs;
        m.e.style.filter = fs;
      }
      if (o !== m.o) {
        m.o = o;
        m.e.style.opacity = o;
      }
      m.e.style.zIndex = 100 - Math.round(d * 10);
    });
    const all = cardS * items.length;
    cards.forEach((c, i) => {
      let y = wrap(i * cardS - p * 2 * cardS, all);
      if (y > all - cardS) y -= all;
      c.style.transform = side ? `translate3d(${y.toFixed(1)}px,0,0)` : `translate3d(0,${y.toFixed(1)}px,0)`;
    });
    roll.style.transform = `translate3d(0,${(-wrap(p, N) * roll.firstChild.offsetHeight).toFixed(1)}px,0)`;
    const f = wrap(Math.round(p), N);
    if (f !== front) {
      front = f;
      shop.href = `/product.html?id=${LOOKS[f].id}`;
      stage.setAttribute('aria-label', `Runway, look ${String(f + 1).padStart(2, '0')}: ${byId(LOOKS[f].id).name}. Drag or use the arrow keys to change look.`);
    }
  };

  /* ---- input ---- */
  let mx = 0;
  let my = 0;
  let cx = 0;
  let cy = 0;
  let down = false;
  let sx = 0;
  let st = 0;
  let moved = 0;
  let visible = false;
  const PULL = () => Math.max(150, W * 0.2);
  const setTarget = () => (target = scrollPart + manual);

  const frame = (now) => {
    const dt = Math.min(50, now - last) || 16;
    last = now;
    const was = p;
    if (reduced()) p = target;
    else p += (target - p) * (1 - Math.exp(-dt * 0.0072));
    if (Math.abs(target - p) < 0.0004) p = target;
    if (p !== was || dirty) {
      dirty = false;
      paint();
    }
    cx += (mx - cx) * 0.32;
    cy += (my - cy) * 0.32;
    ring.style.transform = `translate3d(${cx.toFixed(1)}px,${cy.toFixed(1)}px,0)`;
  };
  gsap.ticker.add(() => visible && frame(performance.now()));

  const fine = window.matchMedia('(pointer: fine)').matches;
  stage.addEventListener('pointerenter', (e) => {
    if (e.pointerType !== 'mouse' || !fine) return;
    ring.classList.add('show');
    document.body.setAttribute('data-cursor-off', '');
  });
  stage.addEventListener('pointerleave', () => {
    ring.classList.remove('show');
    document.body.removeAttribute('data-cursor-off');
  });
  stage.addEventListener('pointermove', (e) => {
    const r = stage.getBoundingClientRect();
    mx = e.clientX - r.left;
    my = e.clientY - r.top;
    if (!down) return;
    const dx = e.clientX - sx;
    moved = Math.max(moved, Math.abs(dx));
    manual = st + dx / PULL();
    setTarget();
  });
  stage.addEventListener('pointerdown', (e) => {
    if (e.target.closest('a') || e.button !== 0) return;
    down = true;
    sx = e.clientX;
    st = manual;
    moved = 0;
    if (e.pointerType === 'mouse') stage.setPointerCapture(e.pointerId);
    ring.classList.add('drag');
  });
  const release = (e) => {
    if (!down) return;
    down = false;
    ring.classList.remove('drag');
    if (moved < 6) {
      const hit = document.elementsFromPoint(e.clientX, e.clientY).find((x) => x.classList?.contains('rw__m'));
      if (hit) {
        const d = Math.round(wrap(Number(hit.dataset.i) - target, N));
        if (d > 0 && d < N) manual = Math.round(manual) + d;
      }
    } else manual = Math.round(manual + scrollPart) - scrollPart;
    setTarget();
  };
  stage.addEventListener('pointerup', release);
  stage.addEventListener('pointercancel', release);
  stage.addEventListener('keydown', (e) => {
    if (['ArrowRight', 'ArrowDown'].includes(e.key)) {
      e.preventDefault();
      manual = Math.round(target) + 1 - scrollPart;
    } else if (['ArrowLeft', 'ArrowUp'].includes(e.key)) {
      e.preventDefault();
      manual = Math.round(target) - 1 - scrollPart;
    } else return;
    setTarget();
  });
  stage.addEventListener('dragstart', (e) => e.preventDefault());

  /* ---- page scroll walks the line: the section pins for one step per look ---- */
  const STEPS = N - 1;
  const pin = ScrollTrigger.create({
    trigger: root,
    start: 'top top',
    end: () => `+=${Math.round(window.innerHeight * 0.55 * STEPS)}`,
    pin: true,
    anticipatePin: 1,
    onUpdate: (self) => {
      scrollPart = self.progress * STEPS;
      setTarget();
    },
  });
  // 150 ms after the scroll stops inside the pin, settle on the nearest whole look
  let snapT = 0;
  lenisNow()?.on('scroll', () => {
    clearTimeout(snapT);
    snapT = setTimeout(() => {
      const l = lenisNow();
      if (!pin.isActive || !l || down) return;
      const step = (pin.end - pin.start) / STEPS;
      const to = pin.start + Math.round((l.targetScroll - pin.start) / step) * step;
      if (Math.abs(to - l.targetScroll) > 2) l.scrollTo(to, { duration: 0.6, easing: (e) => 1 - (1 - e) ** 3 });
    }, 150);
  });
  ScrollTrigger.create({
    trigger: root,
    start: 'top bottom',
    end: 'bottom top',
    onToggle: (self) => {
      visible = self.isActive;
      if (visible) dirty = true;
    },
  });

  size();
  paint();
  Promise.all(
    [...new Set([...LOOKS.map((l) => `/collection/${l.id}.webp`), ...items.map((i) => i.href)])].map((u) => {
      const i = new Image();
      i.src = u;
      return i.decode().catch(() => {});
    }),
  ).then(() => root.classList.add('is-ready'));
}
