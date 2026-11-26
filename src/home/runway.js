import { ScrollTrigger, gsap, reduced, lenisNow } from './core.js';
import { byId, taka } from './products.js';

/*
 * Virtual fitting. One model stands in the middle; as the section is scrolled (or dragged,
 * or stepped with the arrow keys) the saree on her changes colour with a sweep that runs
 * down the drape, a line of zari light riding the edge, and a small sway of the body.
 * One float `p` drives the model, the product rail and the rolling look number.
 *
 * The six looks are the same drape recoloured (public/fitting/<id>.webp, all 610 x 897,
 * pixel-aligned) so only the saree changes. saree-mask.webp is the drape's silhouette,
 * used to keep the light on the fabric.
 */
const LOOKS = [
  { id: 'kaveri', colour: 'Parrot Green', hex: '#1f5a2c' },
  { id: 'gulmohar', colour: 'Gulmohar Maroon', hex: '#6b1426', folded: 'maroon' },
  { id: 'rajshree', colour: 'Midnight Navy', hex: '#1b2552', folded: 'navy' },
  { id: 'nilambari', colour: 'Nilambari Purple', hex: '#4b1f6e' },
  { id: 'swarna', colour: 'Marigold', hex: '#c9962a', folded: 'yellow' },
  { id: 'madhavi', colour: 'Soft Lilac', hex: '#a993d6' },
];
const SHEET = { w: 820, h: 897 };
const N = LOOKS.length;
const NS = 'http://www.w3.org/2000/svg';
const wrap = (x, n) => ((x % n) + n) % n;
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

function crop(href, x0, y0, w, h, sheetW, sheetH) {
  const s = document.createElementNS(NS, 'svg');
  s.setAttribute('viewBox', `${x0} ${y0} ${w} ${h}`);
  s.setAttribute('aria-hidden', 'true');
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
    ? { href: `/drape/cut-${l.folded}.webp`, box: [36, 4, 832, 592], sheet: [900, 600], name: p.name, price: taka(p.price) }
    : { href: src, box: [120, 300, 700, 597], sheet: [SHEET.w, SHEET.h], name: p.name, price: taka(p.price) };
  const second = { href: src, box: [430, 560, 380, 337], sheet: [SHEET.w, SHEET.h], name: `${p.notes[1]}, up close`, price: p.notes[0] };
  return [first, second].map((x) => ({ ...x, id: p.id }));
}

export function setupRunway(root) {
  if (!root) return;
  const stage = root.querySelector('.rw__stage');
  const fig = root.querySelector('.rw__fig');
  const body = root.querySelector('.rw__body');
  const glint = root.querySelector('.rw__glint');
  const rail = root.querySelector('.rw__rail');
  const roll = root.querySelector('.rw__roll');
  const ring = root.querySelector('.rw__ring');
  const shop = root.querySelector('.rw__shop');
  const cartOut = root.querySelector('.rw__cart');
  const words = root.querySelector('.rw__words');
  const dots = root.querySelector('.rw__dots');

  const layers = LOOKS.map((l) => {
    const img = document.createElement('img');
    img.className = 'rw__look-img';
    img.src = `/fitting/${l.id}.webp`;
    img.alt = '';
    img.width = 610;
    img.height = 897;
    img.draggable = false;
    img.decoding = 'async';
    body.append(img);
    return img;
  });
  const names = LOOKS.map((l) => {
    const w = document.createElement('span');
    w.textContent = l.colour;
    words.append(w);
    return w;
  });
  const swatches = LOOKS.map((l, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.style.setProperty('--c', l.hex);
    b.setAttribute('aria-label', `Try ${l.colour}`);
    b.addEventListener('click', () => jump(i));
    dots.append(b);
    return b;
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
  let cardS = 0;
  let side = false;
  let dirty = true;
  let p = 0;
  let target = 0;
  let scrollPart = 0; // looks walked by page scroll while the section is pinned
  let manual = 0; // looks walked by drag, keys and swatches
  const size = () => {
    side = window.innerWidth <= 820;
    cardS = side ? 160 : rail.clientHeight / 3;
    cards.forEach((c) => (c.style.height = side ? '100%' : `${cardS}px`));
    dirty = true;
  };
  window.addEventListener('resize', size);

  /* ---- paint: everything from p ---- */
  let front = -1;
  let lastA = -1;
  let lastB = -1;
  const paint = (time) => {
    const a = wrap(Math.floor(p), N);
    const b = wrap(a + 1, N);
    const t = p - Math.floor(p); // 0 → 1 as look a turns into look b
    if (a !== lastA || b !== lastB) {
      layers.forEach((l, i) => {
        l.style.zIndex = i === a ? 1 : i === b ? 2 : 0;
        l.style.visibility = i === a || i === b ? 'visible' : 'hidden';
      });
      lastA = a;
      lastB = b;
    }
    // the new colour runs down the drape from the shoulder to the hem
    const edge = -18 + t * 136;
    const m = `linear-gradient(172deg, #000 ${edge - 14}%, transparent ${edge + 6}%)`;
    layers[b].style.webkitMaskImage = m;
    layers[b].style.maskImage = m;
    layers[a].style.webkitMaskImage = 'none';
    layers[a].style.maskImage = 'none';
    // zari light riding the edge, only on the fabric
    const live = t > 0.002 && t < 0.998;
    glint.style.opacity = live ? String(Math.sin(t * Math.PI) * 0.95) : '0';
    glint.style.setProperty('--edge', `${edge - 4}%`);
    // her body answers the change: a lift, a half-turn of the shoulders, then settles
    const s = Math.sin(t * Math.PI);
    const dir = target >= p ? 1 : -1;
    const breathe = reduced() ? 0 : Math.sin(time / 1100);
    fig.style.transform = `translate3d(${(s * 10 * dir).toFixed(2)}px, ${(-s * 10 + breathe * 1.5).toFixed(2)}px, 0) rotate(${(s * 1.1 * dir + breathe * 0.25).toFixed(3)}deg) scale(${(1 + breathe * 0.004 - s * 0.012).toFixed(4)}, ${(1 + breathe * 0.004 + s * 0.006).toFixed(4)})`;
    // colour name behind her cross-fades and drifts
    names.forEach((w, i) => {
      const d = ((i - p + N * 10 + N / 2) % N) - N / 2; // -3 … 3
      const o = Math.max(0, 1 - Math.abs(d) * 1.4);
      w.style.opacity = o.toFixed(3);
      w.style.transform = `translate3d(${(d * 30).toFixed(1)}%, -50%, 0)`;
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
      swatches.forEach((sw, i) => sw.setAttribute('aria-pressed', String(i === f)));
      stage.setAttribute('aria-label', `Virtual fitting, look ${String(f + 1).padStart(2, '0')}: ${LOOKS[f].colour}. Drag or use the arrow keys to change the saree.`);
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
  let last = 0;
  const PULL = () => Math.max(150, stage.clientWidth * 0.2);
  const setTarget = () => (target = scrollPart + manual);
  const jump = (i) => {
    const d = Math.round(wrap(i - Math.round(target), N));
    manual = Math.round(manual) + (d > N / 2 ? d - N : d);
    setTarget();
  };

  gsap.ticker.add(() => {
    if (!visible) return;
    const now = performance.now();
    const dt = Math.min(50, now - last) || 16;
    last = now;
    if (reduced()) p = target;
    else p += (target - p) * (1 - Math.exp(-dt * 0.0072));
    if (Math.abs(target - p) < 0.0004) p = target;
    paint(now);
    dirty = false;
    cx += (mx - cx) * 0.32;
    cy += (my - cy) * 0.32;
    ring.style.transform = `translate3d(${cx.toFixed(1)}px,${cy.toFixed(1)}px,0)`;
  });

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
    if (e.target.closest('a, button') || e.button !== 0) return;
    down = true;
    sx = e.clientX;
    st = manual;
    moved = 0;
    if (e.pointerType === 'mouse') stage.setPointerCapture(e.pointerId);
    ring.classList.add('drag');
  });
  const release = () => {
    if (!down) return;
    down = false;
    ring.classList.remove('drag');
    if (moved < 6 && fig.matches(':hover')) jump(Math.round(target) + 1); // a tap on her tries the next saree
    else manual = Math.round(manual + scrollPart) - scrollPart;
    setTarget();
  };
  stage.addEventListener('pointerup', release);
  stage.addEventListener('pointercancel', release);
  stage.addEventListener('keydown', (e) => {
    if (['ArrowRight', 'ArrowDown'].includes(e.key)) manual = Math.round(target) + 1 - scrollPart;
    else if (['ArrowLeft', 'ArrowUp'].includes(e.key)) manual = Math.round(target) - 1 - scrollPart;
    else return;
    e.preventDefault();
    setTarget();
  });
  stage.addEventListener('dragstart', (e) => e.preventDefault());

  /* ---- page scroll changes the saree: the section pins for one step per look ---- */
  const STEPS = N - 1;
  const pin = ScrollTrigger.create({
    trigger: root,
    start: 'top top',
    end: () => `+=${Math.round(window.innerHeight * 0.6 * STEPS)}`,
    pin: true,
    anticipatePin: 1,
    onUpdate: (self) => {
      scrollPart = self.progress * STEPS;
      setTarget();
    },
  });
  // 160 ms after the scroll stops inside the pin, settle softly on the nearest whole look
  let snapT = 0;
  lenisNow()?.on('scroll', () => {
    clearTimeout(snapT);
    snapT = setTimeout(() => {
      const l = lenisNow();
      if (!pin.isActive || !l || down) return;
      const step = (pin.end - pin.start) / STEPS;
      const to = pin.start + Math.round((l.targetScroll - pin.start) / step) * step;
      if (Math.abs(to - l.targetScroll) > 2) l.scrollTo(to, { duration: 0.9, easing: (e) => 1 - (1 - e) ** 3 });
    }, 160);
  });
  ScrollTrigger.create({
    trigger: root,
    start: 'top bottom',
    end: 'bottom top',
    onToggle: (self) => {
      visible = self.isActive;
      last = performance.now();
    },
  });

  size();
  paint(0);
  Promise.all(
    [...new Set([...layers.map((l) => l.src), ...items.map((i) => i.href)])].map((u) => {
      const i = new Image();
      i.src = u;
      return i.decode().catch(() => {});
    }),
  ).then(() => root.classList.add('is-ready'));
}
