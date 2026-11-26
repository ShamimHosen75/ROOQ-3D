# ROOQ-3D

An interactive 3D storefront for ROOQ Atelier: flowing WebGL silk, folded drapes you can lift and throw, and rose petals drifting through the scene.

## Run it

```bash
npm install
npm run dev      # local dev server
npm run build    # production build in dist/
npm run preview  # serve the build
```

Deploys as a static site (Vercel, Netlify, GitHub Pages). On Vercel, import the repo and keep the Vite defaults.

## What's on the page

| Section | What happens |
| --- | --- |
| Loader | ROOQ letters rise, counter runs while textures and shaders are prepared, then a curtain wipe. |
| Hero (pinned, 5 chapters) | Full-screen GLSL silk with travelling folds, anisotropic sheen and an embroidered lattice. Scrolling blends the fabric through saffron, ivory, midnight, ruby and noir; headlines swap with split-character reveals; the dot rail on the right jumps between chapters. The pointer sends ripples through the silk and scatters 2D petals. |
| Pick a Drape | Three.js + cannon-es physics. Six folded drapes fall in and settle with soft shadows. Grab one to lift it (it hangs from a spring, so it sways), throw it, or drop it on the **Place Drape Here** card to open the detail view. Header filters (Silk, Organza, Velvet, Bridal, Festive) fade the others and make matching drapes hop. 3D rose petals fall, land, linger and blow away from the cursor. |
| Detail view | Blurred backdrop, the chosen drape in its own 3D viewer (drag to spin), split-text name, fabric notes, "Next drape". |
| The Edit | Pinned horizontal gallery of fabric swatches with 3D tilt, inner parallax and a progress bar. "View in 3D" opens the detail view. |
| Craft | Scroll-scrubbed word reveal, counting stats, and a marquee whose speed and direction follow scroll velocity. |
| Footer | Gradient wordmark that follows the pointer, newsletter field. |

Also: Lenis smooth scrolling, a custom cursor that changes to Lift / Drop over the drapes, magnetic buttons, and a circular-reveal menu.

## Notes

- All fabric patterns are drawn on canvas at runtime (`src/js/drapes.js`), so there are no image assets. Edit the `DRAPES` list to change names, copy, colours or motifs.
- All copy is placeholder.
- `prefers-reduced-motion` turns off smooth scrolling, slows the silk, thins the petals, places drapes without the drop-in, and removes CSS animation.

## Structure

```
index.html
src/css/main.css
src/js/
  main.js        page wiring: loader, scroll, chapters, sections, detail view
  silk.js        hero silk shader
  heroPetals.js  2D petals over the hero
  playground.js  Pick a Drape scene + physics + drag/drop
  drapeMesh.js   folded-drape geometry and materials
  drapes.js      catalogue + procedural fabric textures
  petals.js      instanced 3D rose petals
  viewer.js      detail-view 3D viewer
  split.js       text splitting for reveals
```
