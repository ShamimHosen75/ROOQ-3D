import gsap from 'gsap';
import { initSite, reveals, reduced } from '../shared.js';

initSite({ page: 'about' });
reveals();

const d = reduced ? 0 : 1;
gsap.fromTo('.about-hero__disc', { scale: 0.4, autoAlpha: 0 }, { scale: 1, autoAlpha: 1, duration: 1.8 * d, ease: 'expo.out', delay: 0.2 });
gsap.fromTo('.about-hero__img', { yPercent: 12, autoAlpha: 0 }, { yPercent: 0, autoAlpha: 1, duration: 1.6 * d, ease: 'expo.out', delay: 0.35 });
gsap.fromTo('.about-hero__arc', { rotate: -40, autoAlpha: 0 }, { rotate: 0, autoAlpha: 1, duration: 2 * d, ease: 'expo.out', delay: 0.6 });
if (!reduced) {
  gsap.to('.about-hero__arc', { rotate: 360, duration: 60, ease: 'none', repeat: -1, delay: 2.6 });
  // the gold line fills as you read down the process steps
  gsap.fromTo(
    '.process__line i',
    { scaleY: 0 },
    { scaleY: 1, ease: 'none', scrollTrigger: { trigger: '.process__list', start: 'top 70%', end: 'bottom 60%', scrub: true } },
  );
  gsap.fromTo('.quote__arc', { rotate: -30 }, { rotate: 30, ease: 'none', scrollTrigger: { trigger: '.quote', start: 'top bottom', end: 'bottom top', scrub: true } });
}
