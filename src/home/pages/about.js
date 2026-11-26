import { gsap, $, reduced } from '../core.js';
import { bootPage } from '../page.js';

bootPage('about', () => {
  if (reduced()) return;
  gsap.from('.ab__cut', { y: 90, autoAlpha: 0, duration: 1.7, ease: 'expo.out', delay: 0.15 });
  gsap.from('.ab .ph__disc', { scale: 0.6, autoAlpha: 0, duration: 1.8, ease: 'expo.out' });
  gsap.fromTo(
    '.process__line i',
    { scaleX: 0 },
    { scaleX: 1, ease: 'none', scrollTrigger: { trigger: $('.process__list'), start: 'top 80%', end: 'bottom 55%', scrub: true } },
  );
});
