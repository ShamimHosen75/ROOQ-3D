// Shared page chrome: icon sprite, loader, cursor, scrollbar, header, menu and footer.
// Every page calls renderLayout() first, so they all stay identical.
import { STORE } from './store.js';

export const NAV = [
  { label: 'Pick a Drape', href: '/#drapes', id: 'drapes' },
  { label: 'Collections', href: '/collections.html', id: 'collections' },
  { label: 'About', href: '/about.html', id: 'about' },
  { label: 'Contact', href: '/contact.html', id: 'contact' },
];

const SPRITE = `<svg width="0" height="0" style="position:absolute" aria-hidden="true">
  <symbol id="lotus" viewBox="0 0 64 40"><g fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round">
    <path d="M32 3c5.5 6 5.5 18 0 27-5.5-9-5.5-21 0-27z" /><path d="M32 30c-1.5-8-7.5-14.5-16-16 0 9.5 7 16 16 16z" />
    <path d="M32 30c1.5-8 7.5-14.5 16-16 0 9.5-7 16-16 16z" /><path d="M31 31C25 26 14 24 5 26c5 6 15 8 26 5z" />
    <path d="M33 31c6-5 17-7 26-5-5 6-15 8-26 5z" /></g></symbol>
  <symbol id="arrow" viewBox="0 0 24 12"><path d="M0 6h22M17 1l5 5-5 5" fill="none" stroke="currentColor" stroke-width="1.4" /></symbol>
  <symbol id="heart" viewBox="0 0 24 24"><path d="M12 20.5s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.6a4.3 4.3 0 0 1 7.5 2.7c0 5.6-7.5 10.2-7.5 10.2Z" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round" /></symbol>
  <symbol id="close" viewBox="0 0 24 24"><path d="M5 5l14 14M19 5L5 19" fill="none" stroke="currentColor" stroke-width="1.2" /></symbol>
  <symbol id="star" viewBox="0 0 24 24"><path d="M12 2.8l2.75 5.9 6.45.75-4.78 4.4 1.3 6.37L12 17.02 6.28 20.2l1.3-6.37L2.8 9.45l6.45-.75z" fill="currentColor" /></symbol>
  <symbol id="ig" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="1.4"><rect x="3.5" y="3.5" width="17" height="17" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.3" cy="6.7" r=".6" fill="currentColor" /></g></symbol>
  <symbol id="pin" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="1.4"><circle cx="12" cy="12" r="8.5" /><path d="M11 7.5l-2.6 10M10.4 13.2c3.8.9 6-1.2 5.6-3.6-.5-3-5.5-3.3-6.8-.4" /></g></symbol>
  <symbol id="wa" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="1.4"><path d="M4.5 19.5l1.2-3.9A8 8 0 1 1 8.6 18.4z" /><path d="M9.3 8.8c.3 2.6 2.9 5.4 5.6 5.9l1-1.2-1.6-.9-.8.8c-1-.4-2.2-1.6-2.6-2.6l.8-.8-.9-1.6z" /></g></symbol>
</svg>`;

const CURSOR = `<div class="pc pc--petal" aria-hidden="true"><svg width="28" height="34" viewBox="0 0 28 34">
    <defs><linearGradient id="pc-g" x1="2" y1="2" x2="22" y2="32" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#ffd4de" /><stop offset="0.55" stop-color="#f48aa6" /><stop offset="1" stop-color="#d4476f" /></linearGradient></defs>
    <path d="M2 2 C8 4 20 8 25 17 C28.5 24 22 32.5 14 32 C6 31.4 1.5 21 1.8 12 C1.9 8 2 5 2 2Z" fill="url(#pc-g)" />
    <path d="M2.6 3.4 C6 12 10 22 14 30" fill="none" stroke="#fff2f5" stroke-opacity=".5" stroke-width=".8" stroke-linecap="round" />
    <path d="M2.6 3.4 C11 7 19 12 22 20" fill="none" stroke="#c63a62" stroke-opacity=".28" stroke-width=".7" stroke-linecap="round" /></svg></div>
  <div class="pc pc--dot" aria-hidden="true"></div>
  <div class="pc pc--grab" aria-hidden="true">
    <svg class="pc__open" width="34" height="34" viewBox="0 0 34 34"><circle cx="17" cy="17" r="8.5" fill="none" stroke="#fbefe6" stroke-width="3" stroke-opacity=".9" /><circle cx="17" cy="17" r="8.5" fill="none" stroke="#3a2418" stroke-width="1.1" /></svg>
    <svg class="pc__closed" width="34" height="34" viewBox="0 0 34 34"><circle cx="17" cy="17" r="7.5" fill="#3a2418" stroke="#fbefe6" stroke-width="2.2" /><circle cx="17" cy="17" r="2" fill="#c9a463" /></svg>
  </div>`;

const WORDMARK = `<span class="wordmark"><svg class="wordmark__mark"><use href="#lotus" /></svg><span class="wordmark__name">ROOQ</span><span class="wordmark__sub">CLOTHING ATELIER</span></span>`;

function header(page) {
  const links = NAV.map((l) => `<li><a href="${l.href}"${l.id === page ? ' aria-current="page"' : ''}>${l.label}<span></span></a></li>`).join('');
  return `<header class="nav ${page === 'home' ? 'is-hero' : 'is-top'}">
    <a href="/" class="nav__logo" aria-label="Rooq home">${WORDMARK}</a>
    <nav class="nav__links"><ul>${links}</ul>
      <button type="button" class="burger" aria-label="Menu" aria-expanded="false"><span></span><span></span><span></span></button>
    </nav>
  </header>
  <div class="menu" aria-hidden="true" inert>
    <a href="/">Home</a>${NAV.map((l) => `<a href="${l.href}">${l.label}</a>`).join('')}
  </div>`;
}

function footer() {
  const col = (title, items) => `<div class="ft__col"><p class="ft__label">${title}</p><ul>${items.map(([t, h]) => `<li><a href="${h}">${t}</a></li>`).join('')}</ul></div>`;
  return `<footer class="ft" id="visit">
    <div class="ft__glow" aria-hidden="true"></div>
    <div class="ft__top">
      <div class="ft__intro" id="about-short">
        <p class="kicker ft__kicker">The atelier letter</p>
        <h2 class="ft__lead">Drapes woven slowly,<br /><em>for days worth remembering.</em></h2>
        <form class="ft__form" novalidate>
          <label class="sr" for="ft-email">Email address</label>
          <input id="ft-email" type="email" placeholder="Your email address" autocomplete="email" required />
          <button type="submit" aria-label="Join"><svg><use href="#arrow" /></svg></button>
        </form>
        <p class="ft__note" aria-live="polite">New drapes, trunk shows and the odd story from the looms. Nothing else.</p>
      </div>
      ${col('Shop', [['All sarees', '/collections.html'], ['Silk', '/collections.html?c=Silk'], ['Organza', '/collections.html?c=Organza'], ['Banarasi', '/collections.html?c=Banarasi'], ['Velvet', '/collections.html?c=Velvet']])}
      ${col('The house', [['Our story', '/about.html'], ['Pick a Drape', '/#drapes'], ['Kind words', '/#reviews'], ['Contact', '/contact.html']])}
      <div class="ft__col" id="atelier">
        <p class="ft__label">Visit</p>
        <ul class="ft__visit">
          <li>${STORE.address}</li><li>${STORE.city}</li><li>${STORE.hours}</li>
          <li><a href="tel:${STORE.phone.replace(/\s/g, '')}">${STORE.phone}</a></li>
        </ul>
        <div class="ft__social">
          <a href="${STORE.instagram}" target="_blank" rel="noopener" aria-label="Instagram"><svg><use href="#ig" /></svg></a>
          <a href="${STORE.pinterest}" target="_blank" rel="noopener" aria-label="Pinterest"><svg><use href="#pin" /></svg></a>
          <a href="${STORE.whatsapp}" target="_blank" rel="noopener" aria-label="WhatsApp"><svg><use href="#wa" /></svg></a>
        </div>
      </div>
    </div>
    <div class="ft__brand" aria-label="Rooq Clothing Atelier">
      <svg class="ft__mark" aria-hidden="true"><use href="#lotus" /></svg>
      <p class="ft__word" data-word="ROOQ" aria-hidden="true">${[...'ROOQ'].map((c, i) => `<span style="--i:${i}">${c}</span>`).join('')}</p>
      <p class="ft__tag" aria-hidden="true"><i></i>Clothing Atelier<i></i></p>
    </div>
    <div class="ft__bottom">
      <p>© <span class="js-year"></span> Rooq Clothing Atelier</p>
      <p>Handloom · Finished by hand · Developed by Shamim</p>
      <a href="#top" class="ft__up" data-top>Back to top <svg><use href="#arrow" /></svg></a>
    </div>
  </footer>`;
}

export function renderLayout(page) {
  const b = document.body;
  b.insertAdjacentHTML('afterbegin', SPRITE + (page === 'home' ? '' : '<div class="loader is-quick" aria-hidden="true"><div class="loader__in"><svg class="loader__mark"><use href="#lotus" /></svg><span class="loader__name">ROOQ</span><span class="loader__bar"><span></span></span></div></div>') + CURSOR + '<div class="sbar" aria-hidden="true"><div class="sbar__thumb"></div></div>' + header(page));
  const slot = document.querySelector('[data-footer]');
  if (slot) slot.outerHTML = footer();
  else b.insertAdjacentHTML('beforeend', footer());
  document.querySelectorAll('.js-year').forEach((e) => (e.textContent = new Date().getFullYear()));
}
