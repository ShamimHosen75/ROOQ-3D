import './home.css';
import { ScrollTrigger, getLenis, sectionSnap, scrollTo } from './core.js';
import { renderLayout } from './layout.js';
import { setupNav, setupScrollbar, setupCursor, finishLoader } from './chrome.js';
import { setupFooter } from './footer.js';
import { setupHero } from './hero.js';
import { setupDrapes, revealDrapes } from './drapes.js';
import { setupCollection } from './collection.js';
import { setupReviews } from './reviews.js';

renderLayout('home');
const hash = location.hash;
if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
window.scrollTo(0, 0);
const lenis = getLenis();
lenis?.stop();

setupNav({ home: true });
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
      setupReviews(document.getElementById('reviews'));
      setupFooter();
      sectionSnap();
      requestAnimationFrame(() => {
        ScrollTrigger.refresh();
        // arriving from another page with /#drapes or /#reviews
        if (hash && document.querySelector(hash)) setTimeout(() => scrollTo(hash, { duration: 1.8 }), 450);
      });
    }),
});
setupDrapes();
