# ROOQ-3D

The ROOQ Clothing Atelier site. The home page is a one-page scroll: a pinned five-slide hero, the "Pick a Drape" physics playground, the Sarees collection with a quick view, and the footer. It is built to match the Anubhav reference site (anubhav-eta.vercel.app) section for section.

## Run it

```bash
npm install
npm run dev      # local dev server
npm run build    # production build in dist/
npm run preview  # serve the build
```

Deploys as a static site (Vercel, Netlify, GitHub Pages). On Vercel, import the repo and keep the Vite defaults.

## Home page (`index.html`, `src/home/`)

| File | What it does |
| --- | --- |
| `main.js` | Boot order: loader → Lenis smooth scroll → hero intro → reveals → section snapping |
| `core.js` | GSAP + ScrollTrigger + SplitText, Lenis (lerp 0.085), `scrollTo`, section snap between hero end / drapes / collections / footer |
| `chrome.js` | Header (logo only on the hero; hides on scroll down, compact frosted bar on scroll up), mobile menu, custom scrollbar, petal cursor (turns into a dot over links and a grab ring over drapes) |
| `hero.js`, `heroGL.js`, `heroData.js` | Pinned hero, 1.5 screens of scroll per slide, scrubbed. WebGL shader sways the loose fabric in each photo and sweeps a length of the next saree across the screen between slides. Split-text titles, rail dots, two petal layers (the back one passes behind the model) |
| `drapes.js`, `drapeScene.js`, `drapeData.js` | Pick a Drape: three.js + Rapier physics. Three bundles hover and dodge the cursor, two rest. Lift, throw, double-click to float again. Filter tabs dim the others and make matches hop. Drop one on "Place Drape Here" → "Unfolding" → Your selection. Rose petals are physical too |
| `collection.js` | Sarees grid, filter pills, save hearts, Kaveri's pose-wipe hover, quick view with thumbnails, quantity, Buy Now / Add to Cart |
| `home.css` | All home styles (colours: blush `#f3e4dc`, ink `#3a2418`, gold `#b08440`) |

## Images

| Folder | Used for |
| --- | --- |
| `public/hero/01–05.webp` | Hero slides |
| `public/drape/` | Folded-saree textures (`top-<id>-col/-rm/-h`, `edge-<id>-col/-rm`), cut-outs for the selection view (`cut-<id>`), drop panel, gold arcs |
| `public/collection/` | Product cut-outs (820×897) |

Slide copy and the fabric/silhouette regions are in `src/home/heroData.js`; product names and prices in `src/home/collection.js`; drape names and notes in `src/home/drapeData.js`. Store address and phone in the footer are placeholders.

## Other pages

`collections.html`, `product.html`, `about.html` and `contact.html` are still in the build (code in `src/js/`), but the home page doesn't link to them, to match the reference.
