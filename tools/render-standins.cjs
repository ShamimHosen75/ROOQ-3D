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
  await b.close();
})();
