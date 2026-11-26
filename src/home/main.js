import './home.css';
import { gsap, ScrollTrigger, getLenis, sectionSnap, $ } from './core.js';
import { setupNav, setupScrollbar, setupCursor, finishLoader } from './chrome.js';
import { setupHero } from './hero.js';
import { setupDrapes, revealDrapes } from './drapes.js';
import { setupCollection } from './collection.js';

$('.js-year').textContent = new Date().getFullYear();
if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
window.scrollTo(0, 0);
const lenis = getLenis();
lenis?.stop();

setupNav();
setupScrollbar();
setupCursor();

let started = false;
const startHero = setupHero({
  onReady: () =>
    document.fonts.ready.then(() => {
      if (started) return;
      started = true;
      window.scrollTo(0, 0);
      finishLoader();
      lenis?.start();
      startHero();
      revealDrapes();
      setupCollection();
      sectionSnap();
      requestAnimationFrame(() => ScrollTrigger.refresh());
    }),
});
setupDrapes();
