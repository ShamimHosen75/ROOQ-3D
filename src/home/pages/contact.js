import { $, $$ } from '../core.js';
import { bootPage } from '../page.js';
import { STORE } from '../store.js';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

bootPage('contact', () => {
  $$('[data-store]').forEach((el) => {
    const k = el.dataset.store;
    if (k === 'phone') {
      el.textContent = STORE.phone;
      el.href = `tel:${STORE.phone.replace(/\s/g, '')}`;
    } else if (k === 'email') {
      el.textContent = STORE.email;
      el.href = `mailto:${STORE.email}`;
    } else if (k === 'map' || k === 'whatsapp') el.href = STORE[k];
    else el.textContent = STORE[k];
  });

  const form = $('.ct__form');
  const note = $('.ct__note', form);
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const bad = $$('[required]', form).filter((f) => !f.value.trim() || (f.type === 'email' && !EMAIL.test(f.value.trim())));
    $$('.field', form).forEach((f) => f.classList.toggle('is-bad', bad.includes($('input, textarea, select', f))));
    if (bad.length) {
      note.textContent = 'Please fill in your name, a valid email and a message.';
      bad[0].focus();
      return;
    }
    const f = Object.fromEntries(new FormData(form));
    const body = `${f.message}\n\n${f.name}${f.phone ? `\n${f.phone}` : ''}\n${f.email}`;
    note.textContent = 'Opening your email app…';
    window.location.assign(`mailto:${STORE.email}?subject=${encodeURIComponent(`${f.topic} · ROOQ`)}&body=${encodeURIComponent(body)}`);
  });
  $$('.field input, .field textarea', form).forEach((i) => i.addEventListener('input', () => i.closest('.field').classList.remove('is-bad')));

  // one answer open at a time
  $$('.acc').forEach((d) => d.addEventListener('toggle', () => d.open && $$('.acc').forEach((o) => o !== d && (o.open = false))));
});
