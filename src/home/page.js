// Boot for the inner pages (Collections, Product, About, Contact): same chrome as home, lighter loader.
import './home.css';
import './pages.css';
import { gsap, ScrollTrigger, SplitText, getLenis, reduced, $$ } from './core.js';
import { renderLayout } from './layout.js';
import { setupNav, setupScrollbar, setupCursor, finishLoader } from './chrome.js';
import { setupFooter } from './footer.js';

export function reveals(scope = document) {
  if (reduced()) return;
  $$('[data-split]', scope).forEach((el) => {
    const split = SplitText.create(el, { type: 'lines', mask: 'lines', linesClass: 'split-line' });
    gsap.from(split.lines, {
      yPercent: 110,
      duration: 1.3,
      ease: 'expo.out',
      stagger: 0.1,
      scrollTrigger: { trigger: el, start: 'top 88%' },
    });
  });
  ScrollTrigger.batch($$('[data-reveal]', scope), {
    start: 'top 90%',
    once: true,
    onEnter: (els) => gsap.fromTo(els, { y: 40, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 1.1, ease: 'power3.out', stagger: 0.08, overwrite: true, clearProps: 'transform' }),
  });
  $$('[data-reveal]', scope).forEach((el) => gsap.set(el, { autoAlpha: 0 }));
  $$('[data-parallax]', scope).forEach((el) => {
    const amt = Number(el.dataset.parallax) || 8;
    gsap.fromTo(el, { yPercent: -amt }, { yPercent: amt, ease: 'none', scrollTrigger: { trigger: el.parentElement, start: 'top bottom', end: 'bottom top', scrub: true } });
  });
}

export function bootPage(page, setup) {
  renderLayout(page);
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  window.scrollTo(0, 0);
  const lenis = getLenis();
  setupNav();
  setupScrollbar();
  setupCursor();
  document.fonts.ready.then(() => {
    setup?.();
    reveals();
    setupFooter();
    finishLoader();
    lenis?.start();
    requestAnimationFrame(() => ScrollTrigger.refresh());
  });
}
