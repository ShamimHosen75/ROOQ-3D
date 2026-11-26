// Product data for the grid, the collection page and the single product page.
// Photos live in public/images/sarees/<id>.webp (transparent cut-outs, 820x897).
// To change a product, replace its photo and edit its row. `gallery` lists extra shots.
export const PRODUCTS = [
  {
    id: 'gulmohar',
    name: 'Gulmohar Banarasi',
    price: 18500,
    tags: 'Pure Silk | Zari Weave | Handcrafted',
    cats: ['silk', 'banarasi', 'festive'],
    colour: 'Garnet red',
    fabric: 'Pure Banarasi silk',
    work: 'Zari weave',
    blurb: 'A deep garnet Banarasi with gold zari buttas and a heavy woven pallu, made for the evening of a wedding.',
    story:
      'Woven on a pit loom over several weeks, the zari is laid in one thread at a time so the gold sits soft against the silk rather than stiff. The border carries a classic kalga pattern that runs into a full pallu.',
  },
  {
    id: 'noor',
    name: 'Noor Organza',
    price: 12800,
    tags: 'Organza | Thread Work | Floral Motif',
    cats: ['organza'],
    colour: 'Blush ivory',
    fabric: 'Silk organza',
    work: 'Resham thread embroidery',
    blurb: 'Featherlight blush organza scattered with hand-embroidered rose sprays, light enough for a long summer day.',
    story:
      'Each spray of roses is worked by hand in fine resham thread, shaded from pink to coral, so no two florals are quite the same. A sheer scalloped edge keeps the drape soft.',
  },
  {
    id: 'rajshree',
    name: 'Rajshree Velvet',
    price: 24900,
    tags: 'Velvet | Zardozi | Hand Embroidery',
    cats: ['velvet', 'festive'],
    colour: 'Midnight navy',
    fabric: 'Silk velvet',
    work: 'Zardozi and dabka',
    blurb: 'Midnight velvet with raised zardozi vines in antique gold, for winter weddings and grand evenings.',
    story:
      'Zardozi is built up by hand from coiled metal wire, beads and sequins, so the vines stand slightly proud of the pile and catch the light as you move.',
  },
  {
    id: 'swarna',
    name: 'Swarna Organza',
    price: 13500,
    tags: 'Organza | White Thread Work | Lightweight',
    cats: ['organza'],
    colour: 'Marigold',
    fabric: 'Silk organza',
    work: 'White thread embroidery',
    blurb: 'Sunlit marigold organza with tone-on-tone white florals. Bright, easy and made for a mehendi afternoon.',
    story:
      'The florals are worked in a single white thread so the colour of the organza does the talking. It packs light and holds its shape all day.',
  },
  {
    id: 'kaveri',
    name: 'Kaveri Kanchipuram',
    price: 21900,
    tags: 'Pure Silk | Temple Border | Traditional',
    cats: ['silk', 'banarasi'],
    colour: 'Emerald green',
    fabric: 'Kanchipuram silk',
    work: 'Temple border, zari buttas',
    blurb: 'Emerald Kanchipuram silk with a wide temple border and gold buttas, a quiet heirloom in the making.',
    story:
      'The border and body are woven separately and interlocked by hand, the Korvai technique, so the border never tears away from the drape. Heavy, cool and lustrous.',
    gallery: ['kaveri-b', 'kaveri-c'],
  },
  {
    id: 'madhavi',
    name: 'Madhavi Organza',
    price: 15200,
    tags: 'Organza | Sequins Work | Pastel Edit',
    cats: ['organza'],
    colour: 'Lilac',
    fabric: 'Silk organza',
    work: 'Sequins and thread work',
    blurb: 'Soft lilac organza scattered with tiny sequins and silver florals, from our pastel edit.',
    story:
      'Hand-set sequins are stitched one by one between the florals so the drape shimmers gently instead of glittering. Pair it with silver for a sangeet.',
  },
  {
    id: 'veena',
    name: 'Veena Chikankari',
    price: 16800,
    tags: 'Georgette | Chikankari | Handcrafted',
    cats: ['festive'],
    colour: 'Champagne',
    fabric: 'Georgette',
    work: 'Lucknowi chikankari',
    blurb: 'Champagne georgette covered in fine Lucknowi chikankari, airy and graceful from morning to night.',
    story:
      'Chikankari is shadow work done by hand from the reverse of the fabric. This one carries jaal, phanda and bakhiya stitches across the whole body.',
  },
  {
    id: 'nilambari',
    name: 'Nilambari Silk',
    price: 20500,
    tags: 'Pure Silk | Butta Work | Festive Wear',
    cats: ['silk', 'festive'],
    colour: 'Royal purple',
    fabric: 'Pure silk',
    work: 'Butta work',
    blurb: 'Royal purple silk with gold buttas and a contrast border, our favourite for festive mornings.',
    story:
      'Small gold buttas are woven across the body in a half-drop repeat so the pattern reads evenly however you drape the pleats.',
  },
].map((p) => ({
  ...p,
  image: `/images/sarees/${p.id}.webp`,
  images: [p.id, ...(p.gallery || [])].map((n) => `/images/sarees/${n}.webp`),
  url: `/product.html?id=${p.id}`,
}));

export const PRODUCT_FILTERS = ['all', 'silk', 'organza', 'banarasi', 'velvet', 'festive'];
export const FILTER_LABELS = { all: 'All', silk: 'Silk', organza: 'Organza', banarasi: 'Banarasi', velvet: 'Velvet', festive: 'Festive' };

export const productById = (id) => PRODUCTS.find((p) => p.id === id);
export const rupees = (n) => '₹' + n.toLocaleString('en-IN');

/** Same-category products first, then the rest. */
export function relatedTo(p, n = 4) {
  const others = PRODUCTS.filter((q) => q.id !== p.id);
  const score = (q) => q.cats.filter((c) => p.cats.includes(c)).length;
  return others.sort((a, b) => score(b) - score(a)).slice(0, n);
}
