// Product grid data. Images live in public/images/product-N.jpg; swap in your own photos.
export const PRODUCTS = [
  { name: 'Ruhani Banarasi', price: 18500, tags: 'Pure Silk | Zari Weave | Handcrafted', cats: ['silk', 'banarasi'] },
  { name: 'Gulabi Organza', price: 12800, tags: 'Organza | Thread Work | Floral Motif', cats: ['organza'] },
  { name: 'Shabnam Velvet', price: 24900, tags: 'Velvet | Zardozi | Hand Embroidery', cats: ['velvet', 'festive'] },
  { name: 'Sunehri Organza', price: 13500, tags: 'Organza | White Thread Work | Lightweight', cats: ['organza'] },
  { name: 'Panna Kanchipuram', price: 21900, tags: 'Pure Silk | Temple Border | Traditional', cats: ['silk', 'banarasi'] },
  { name: 'Lavanya Organza', price: 15200, tags: 'Organza | Sequins Work | Pastel Edit', cats: ['organza', 'festive'] },
  { name: 'Chandni Chikankari', price: 16800, tags: 'Georgette | Chikankari | Handcrafted', cats: ['festive'] },
  { name: 'Jamuni Silk', price: 20500, tags: 'Pure Silk | Butta Work | Festive Wear', cats: ['silk', 'banarasi', 'festive'] },
].map((p, i) => ({ ...p, image: `/images/product-${i + 1}.jpg` }));

export const PRODUCT_FILTERS = ['all', 'silk', 'organza', 'banarasi', 'velvet', 'festive'];
