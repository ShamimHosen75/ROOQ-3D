import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import Lenis from 'lenis';

gsap.registerPlugin(ScrollTrigger, SplitText);

export { gsap, ScrollTrigger, SplitText };
export const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
export const $ = (s, el = document) => el.querySelector(s);
export const $$ = (s, el = document) => [...el.querySelectorAll(s)];
export const clamp01 = (v) => Math.min(1, Math.max(0, v));

let lenis = null;
export function getLenis() {
  if (lenis || reduced()) return lenis;
  lenis = new Lenis({ lerp: 0.085, wheelMultiplier: 0.85, touchMultiplier: 1.4, autoRaf: false });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((t) => lenis?.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
  return lenis;
}
export const lenisNow = () => lenis;

export function scrollTo(target, opts = {}) {
  if (lenis) {
    lenis.scrollTo(target, { duration: opts.duration ?? 1.6, immediate: opts.immediate, easing: (e) => 1 - (1 - e) ** 4 });
  } else if (typeof target === 'number') window.scrollTo({ top: target });
  else document.querySelector(target)?.scrollIntoView();
}

/* Gentle section snapping between hero end, drapes, collections and the footer. */
export function sectionSnap() {
  const l = lenis;
  if (!l) return () => {};
  const DOWN = 0.6;
  const LAST = 0.3;
  const EDGE = 12;
  let t1 = 0;
  let t2 = 0;
  let busy = false;
  const points = () => {
    const vh = window.innerHeight;
    const top = (id) => {
      const el = document.getElementById(id);
      return el ? el.getBoundingClientRect().top + window.scrollY : null;
    };
    const d = top('drapes');
    const c = top('collections');
    const v = top('visit');
    const hero = document.getElementById('top');
    if (d == null || c == null || !hero) return null;
    const max = document.documentElement.scrollHeight - vh;
    const end = Math.min(v ?? max, max);
    const pts = [d - hero.offsetHeight, d, c];
    const r = top('reviews');
    if (r != null && r > c + EDGE && r < end - EDGE) pts.push(r);
    if (end > pts[pts.length - 1] + EDGE) pts.push(end);
    return { pts, vh };
  };
  const settle = () => {
    if (!l || l.isStopped) return;
    const r = points();
    if (!r) return;
    const { pts, vh } = r;
    const y = l.targetScroll;
    if (y <= pts[0] + 2 || y >= pts[pts.length - 1] - 2) return;
    let i = 0;
    while (i < pts.length - 2 && y > pts[i + 1]) i++;
    const a = pts[i];
    const b = pts[i + 1];
    if (y - a < EDGE || b - y < EDGE) return;
    const down = l.direction >= 0;
    const to = down ? b : a;
    const dist = Math.abs(to - y);
    const span = b - a;
    const last = down && i + 1 === pts.length - 1;
    if (dist > (i === 0 ? span * 0.97 : (last ? LAST : DOWN) * vh)) return;
    busy = true;
    l.scrollTo(to, {
      duration: 1.4 + 0.8 * Math.min(1, dist / vh),
      easing: (e) => 1 - (1 - e) ** 3,
      onComplete: () => (busy = false),
    });
  };
  const onWheel = () => {
    busy = false;
    clearTimeout(t1);
    t1 = setTimeout(settle, 90);
  };
  const onScroll = () => {
    clearTimeout(t2);
    if (!busy) t2 = setTimeout(settle, 220);
  };
  window.addEventListener('wheel', onWheel, { passive: true });
  l.on('scroll', onScroll);
  return () => {
    window.removeEventListener('wheel', onWheel);
    l.off('scroll', onScroll);
  };
}
