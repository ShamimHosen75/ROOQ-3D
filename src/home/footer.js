import { gsap, $, $$, reduced } from './core.js';

/* Footer: the newsletter form, the ROOQ letters rising in, and a light that follows the pointer across them. */
export function setupFooter() {
  const ft = $('.ft');
  if (!ft) return;

  const form = $('.ft__form', ft);
  const note = $('.ft__note', ft);
  const input = $('input', form);
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value.trim());
    form.classList.toggle('is-bad', !ok);
    if (!ok) {
      note.textContent = 'That email does not look right. Try again?';
      input.focus();
      return;
    }
    form.classList.add('is-sent');
    input.value = '';
    note.textContent = 'Thank you. The next letter is on its way to you.';
  });
  input.addEventListener('input', () => form.classList.remove('is-bad'));

  const brand = $('.ft__brand', ft);
  const word = $('.ft__word', ft);
  const letters = $$('.ft__word span', ft);

  if (!reduced()) {
    gsap.set(letters, { yPercent: 110, rotate: 6 });
    gsap.set([$('.ft__mark', ft), $('.ft__tag', ft)], { autoAlpha: 0, y: 24 });
    gsap
      .timeline({ scrollTrigger: { trigger: brand, start: 'top 88%' } })
      .to(letters, { yPercent: 0, rotate: 0, duration: 1.5, ease: 'expo.out', stagger: 0.09 })
      .to([$('.ft__mark', ft), $('.ft__tag', ft)], { autoAlpha: 1, y: 0, duration: 1.1, ease: 'power3.out', stagger: 0.12 }, 0.35);
    gsap.from($$('.ft__top > *', ft), {
      y: 40,
      autoAlpha: 0,
      duration: 1.1,
      ease: 'power3.out',
      stagger: 0.08,
      scrollTrigger: { trigger: ft, start: 'top 85%' },
    });
  }

  // pointer light over the wordmark
  let tx = 50;
  let ty = 50;
  let x = 50;
  let y = 50;
  let on = 0;
  let onT = 0;
  brand.addEventListener('pointermove', (e) => {
    const r = word.getBoundingClientRect();
    tx = ((e.clientX - r.left) / r.width) * 100;
    ty = ((e.clientY - r.top) / r.height) * 100;
    onT = 1;
  });
  brand.addEventListener('pointerleave', () => (onT = 0));
  gsap.ticker.add(() => {
    if (Math.abs(onT - on) < 0.001 && Math.abs(tx - x) < 0.05 && Math.abs(ty - y) < 0.05) return;
    x += (tx - x) * 0.12;
    y += (ty - y) * 0.12;
    on += (onT - on) * 0.08;
    word.style.setProperty('--mx', `${x.toFixed(2)}%`);
    word.style.setProperty('--my', `${y.toFixed(2)}%`);
    word.style.setProperty('--lit', on.toFixed(3));
  });
}
