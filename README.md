# ROOQ-3D

The ROOQ Clothing Atelier site: a full-screen hero gallery with fabric-sweep transitions, followed by "Pick a Drape", an interactive 3D scene of floating folded drapes and falling rose petals.

## Run it

```bash
npm install
npm run dev      # local dev server
npm run build    # production build in dist/
npm run preview  # serve the build
```

Deploys as a static site (Vercel, Netlify, GitHub Pages). On Vercel, import the repo and keep the Vite defaults.

## Put in your own photos

The hero uses five images in `public/images/`:

| File | Slide |
| --- | --- |
| `hero-1.jpg` | Step into Rooq |
| `hero-2.jpg` | Sarees |
| `hero-3.jpg` | Lehengas |
| `hero-4.jpg` | Fusion Wear |
| `hero-5.jpg` | Our Collections |

The files there now are generated stand-ins (flowing fabric on a blush sky). Replace them with your own model photos, 1920x1080 or larger, landscape, with the subject on the right and space on the left for the text. Keep the same file names and nothing else needs to change. To regenerate the stand-ins: `node tools/render-standins.cjs`.

The "Sarees" product grid uses `public/images/product-1.jpg` to `product-8.jpg` (square-ish portrait crops, about 800x830, on the `#f4e2db` background). Product names, prices, tags and filter categories are in `src/js/products.js`.

Slide copy lives in `index.html`; drape names, notes and colours in `src/js/drapes.js`. All copy is placeholder.

## What's on the page

**Hero (5 slides, pinned while you scroll).** Each scroll step snaps to the next slide. The change plays a fabric sweep in WebGL: a close-up of the next garment flows in from the left behind a wavy gold-edged front, then pulls back and settles while the image slowly zooms out. Titles rise letter by letter out of a blur and the paragraph types in. Dots on the right jump between slides; petals drift and scatter from the cursor.

**Pick a Drape.** Five folded drapes float and bob above a soft floor with large shadows while 3D rose petals fall. Grab one to lift it (it sways from a spring), let go and it drops and settles, or drop it on the **Place Drape Here** card to open the detail view. The filters (Silk, Organza, Velvet, Bridal, Festive) fade the others and make matching drapes hop.

**Sarees (product grid).** Eyebrow, title and description, then filter pills (All, Silk, Organza, Banarasi, Velvet, Festive) and a 4-column grid of cards with name, price, tags and a save heart. Cards rise in as they scroll into view; filtering fades the grid out, reflows it and fades the matches back in.

**Footer.** Dark brown band with the logo, store address, hours and phone.

**Detail view.** Blurred background, the chosen drape turning in 3D (drag to spin), name, fabric and a short note.

A small header with Pick a Drape / Collections / About slides in when you scroll up past the hero. Lenis provides smooth scrolling. `prefers-reduced-motion` turns off smoothing, snapping and the sweeps.

## Structure

```
index.html
public/images/hero-*.jpg   hero photos (replace with your own)
src/css/main.css
src/js/
  main.js        page wiring: hero slides, text reveals, scroll, filters, detail view
  heroSlider.js  WebGL image slider with the fabric-sweep transition
  heroPetals.js  2D petals over the hero
  playground.js  Pick a Drape scene, floating + physics + drag/drop
  drapeMesh.js   folded-drape geometry and materials
  drapes.js      drape catalogue + procedural fabric textures
  petals.js      instanced 3D rose petals
  viewer.js      detail-view 3D viewer
  collection.js  product grid: cards, reveal, filtering
  products.js    product data
  split.js       text splitting for reveals
tools/           stand-in image renderer
```
