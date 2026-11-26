// Renders the five stand-in hero images into public/images. Replace them with real photos any time.
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const SLIDES = [
  { base: '#7d1430', deep: '#3a0614', zari: '#d9a74a', motif: '#e6bb62', sky1: '#d9bcc2', sky2: '#efdcd6', seed: 1.3, kind: 8 },
  { base: '#f0dcc4', deep: '#c9a586', zari: '#d8b070', motif: '#e58d98', sky1: '#dcc4c2', sky2: '#f1e2db', seed: 4.1, kind: 5 },
  { base: '#27305e', deep: '#0c1030', zari: '#d7b26a', motif: '#efd9a6', sky1: '#d4c3c8', sky2: '#eee0dc', seed: 7.7, kind: 6 },
  { base: '#231a1c', deep: '#070405', zari: '#c99a45', motif: '#c8303e', sky1: '#d6bfbf', sky2: '#efdfd9', seed: 2.9, kind: 6 },
  { base: '#e9b52f', deep: '#a96c0e', zari: '#f4dc9a', motif: '#fbecc4', sky1: '#e0c4bb', sky2: '#f2e2d8', seed: 5.5, kind: 8 },
];
// product cards (match the PRODUCTS list in src/js/products.js)
const CARDS = [
  { base: '#86152b', deep: '#3e0712', zari: '#d9a64c', motif: '#e8bd63', kind: 8 },
  { base: '#f1d9c6', deep: '#cfa892', zari: '#e0bf86', motif: '#e07b8c', kind: 5 },
  { base: '#1d2459', deep: '#090c2a', zari: '#d4ad62', motif: '#e6c57c', kind: 6 },
  { base: '#ebb62c', deep: '#b07a10', zari: '#f6dd98', motif: '#fff1c8', kind: 6 },
  { base: '#16603a', deep: '#06301a', zari: '#d8b24f', motif: '#e5c25e', kind: 8 },
  { base: '#b9a4e2', deep: '#7d68b0', zari: '#ece3f6', motif: '#f6f0ff', kind: 5 },
  { base: '#f2e2cc', deep: '#d3bca0', zari: '#f6ead6', motif: '#fffaf0', kind: 6 },
  { base: '#5a1b7a', deep: '#260838', zari: '#d4a04a', motif: '#e3b45c', kind: 8 },
].map((c, i) => ({ ...c, sky1: '#f4e2db', sky2: '#f4e2db', seed: 3 + i * 1.7, sheer: 0, card: true, w: 840, h: 880 }));
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const p = await b.newPage({ viewport: { width: 1920, height: 1080 } });
  await p.goto('file://' + path.join(__dirname, 'standins.html'));
  const out = path.join(__dirname, '..', 'public', 'images');
  fs.mkdirSync(out, { recursive: true });
  for (let i = 0; i < SLIDES.length; i++) {
    const url = await p.evaluate((o) => window.render(o), SLIDES[i]);
    // the canvas is rendered a little wider than 1920 and cropped, to drop a seam on the right edge
    const cropped = await p.evaluate(async (src) => {
      const img = new Image();
      img.src = src;
      await img.decode();
      const c = document.createElement('canvas');
      c.width = 1920;
      c.height = 1080;
      c.getContext('2d').drawImage(img, 0, 0);
      return c.toDataURL('image/jpeg', 0.86);
    }, url);
    fs.writeFileSync(path.join(out, `hero-${i + 1}.jpg`), Buffer.from(cropped.split(',')[1], 'base64'));
  }
  for (let i = 0; i < CARDS.length; i++) {
    const url = await p.evaluate((o) => window.render(o), CARDS[i]);
    fs.writeFileSync(path.join(out, `product-${i + 1}.jpg`), Buffer.from(url.split(',')[1], 'base64'));
  }
  await b.close();
})();
