import { initSite, reveals, toast, bag, STORE, $, $$, esc } from '../shared.js';
import { productById, rupees } from '../products.js';

initSite({ page: 'contact' });

// store details come from STORE in shared.js
$$('[data-store]').forEach((el) => {
  const k = el.dataset.store;
  if (k === 'map') el.href = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(STORE.mapQuery)}`;
  else if (k === 'phone') {
    el.textContent = STORE.phone;
    el.href = STORE.phoneHref;
  } else if (k === 'email') {
    el.textContent = STORE.email;
    el.href = `mailto:${STORE.email}`;
  } else if (k === 'whatsapp') el.href = STORE.whatsapp;
  else el.textContent = STORE[k];
});

const form = $('.contact__form');
// arriving from the bag: pre-fill an order enquiry
if (new URLSearchParams(location.search).has('bag') && bag.items.length) {
  $('#c-topic').value = 'An order enquiry';
  const lines = bag.items.map((i) => {
    const p = productById(i.id);
    return `- ${p.name} x${i.qty} (blouse ${i.blouse === 'stitched' ? 'stitched to size' : 'unstitched'}) ${rupees(bag.lineTotal(i))}`;
  });
  $('#c-msg').value = `Hello, I would like to order:\n${lines.join('\n')}\nSubtotal: ${rupees(bag.total)}\n`;
}

form.addEventListener('submit', (e) => {
  e.preventDefault();
  const bad = [...form.querySelectorAll('[required]')].find((f) => !f.checkValidity());
  form.classList.add('was-checked');
  if (bad) {
    bad.focus();
    toast(`Please fill in ${esc(bad.labels[0]?.textContent.toLowerCase() || 'this field')}.`);
    return;
  }
  const f = Object.fromEntries(new FormData(form));
  const body = `${f.message}\n\n${f.name}\n${f.email}${f.phone ? `\n${f.phone}` : ''}`;
  location.href = `mailto:${STORE.email}?subject=${encodeURIComponent(`${f.topic} · ROOQ`)}&body=${encodeURIComponent(body)}`;
  toast('Your email app should open with the message ready to send.');
});

reveals();
