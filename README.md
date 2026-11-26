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

Slide copy and the fabric/silhouette regions are in `src/home/heroData.js`; drape names and notes in `src/home/drapeData.js`.

## Content you will want to replace

- `src/home/products.js`: the catalogue (names, prices, tags, story, details). Images are `public/collection/<id>.webp`.
- `src/home/reviewsData.js`: sample reviews. Replace with real ones (with permission) before going live.
- `src/home/store.js`: address, hours, phone, email and social links used in the footer and on Contact.

## Pages

Every page calls `renderLayout()` (`src/home/layout.js`) first, which adds the header, mobile menu, petal cursor, scrollbar and footer, so they stay identical. Links to other pages leave through a short curtain.

- `index.html` (`src/home/main.js`): hero, Pick a Drape, collection grid with quick view, customer reviews.
- `collections.html`: every saree, filter pills (`?c=Silk` etc.) and sorting. Cards open the product page.
- `product.html?id=<id>`: gallery with hover zoom, blouse option, quantity, story, details, reviews and related pieces.
- `about.html`, `contact.html`: story, values, process; contact cards, a form that opens the visitor's email app, FAQ.

Inner pages share `src/home/page.js` (boot and scroll reveals) and `src/home/pages.css`. The footer (`src/home/footer.js`) has the newsletter form and the large ROOQ wordmark with its rise-in and pointer light. Buy Now, Add to Cart and the newsletter are front-end only for now.
