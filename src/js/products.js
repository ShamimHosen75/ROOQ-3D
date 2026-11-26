// Product grid data. Photos live in public/images/sarees/<id>.webp (transparent cut-outs, 820x897).
// To change a product, replace its photo and edit the row below.
export const PRODUCTS = [
  { id: 'gulmohar', name: 'Gulmohar Banarasi', price: 18500, tags: 'Pure Silk | Zari Weave | Handcrafted', cats: ['silk', 'banarasi', 'festive'] },
  { id: 'noor', name: 'Noor Organza', price: 12800, tags: 'Organza | Thread Work | Floral Motif', cats: ['organza'] },
  { id: 'rajshree', name: 'Rajshree Velvet', price: 24900, tags: 'Velvet | Zardozi | Hand Embroidery', cats: ['velvet', 'festive'] },
  { id: 'swarna', name: 'Swarna Organza', price: 13500, tags: 'Organza | White Thread Work | Lightweight', cats: ['organza'] },
  { id: 'kaveri', name: 'Kaveri Kanchipuram', price: 21900, tags: 'Pure Silk | Temple Border | Traditional', cats: ['silk', 'banarasi'] },
  { id: 'madhavi', name: 'Madhavi Organza', price: 15200, tags: 'Organza | Sequins Work | Pastel Edit', cats: ['organza'] },
  { id: 'veena', name: 'Veena Chikankari', price: 16800, tags: 'Georgette | Chikankari | Handcrafted', cats: ['festive'] },
  { id: 'nilambari', name: 'Nilambari Silk', price: 20500, tags: 'Pure Silk | Butta Work | Festive Wear', cats: ['silk', 'festive'] },
].map((p) => ({ ...p, image: `/images/sarees/${p.id}.webp` }));

export const PRODUCT_FILTERS = ['all', 'silk', 'organza', 'banarasi', 'velvet', 'festive'];
