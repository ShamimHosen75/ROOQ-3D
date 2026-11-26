// The catalogue. Images are /public/collection/<id>.webp (+ any extra poses).
// Copy, prices and details are placeholders to replace with the real ones.
export const PIECES = [
  {
    id: 'gulmohar', name: 'Gulmohar Banarasi', price: 18500, tags: ['Silk', 'Banarasi'],
    desc: 'A Banarasi in deep maroon with a rich zari border and woven gold motifs.',
    notes: ['Pure Silk', 'Zari Weave', 'Handcrafted'],
    story: 'Woven in Varanasi on a pit loom over three weeks, Gulmohar carries kadhua buttas across the body and a heavy brocade border that frames the pallu like a doorway. The zari is real silver, gold-washed, so it warms with wear instead of tarnishing.',
    details: { Fabric: 'Pure katan silk with gold zari', Length: '6.3 m with 0.8 m unstitched blouse', Weave: 'Kadhua Banarasi, handloom', Care: 'Dry clean only. Store folded in muslin and refold every few months.' },
  },
  {
    id: 'noor', name: 'Noor Organza', price: 12800, tags: ['Organza'],
    desc: 'Featherlight organza with hand-stitched pink floral thread work.',
    notes: ['Organza', 'Thread Work', 'Floral Motif'],
    story: 'Noor is the drape we reach for when the day is warm and the guest list is long. Soft blush organza is scattered with resham roses, each one stitched by hand, and finished with a fine scalloped edge.',
    details: { Fabric: 'Silk organza', Length: '5.5 m with 0.8 m blouse piece', Work: 'Hand resham embroidery', Care: 'Dry clean only. Steam on low, never iron directly.' },
  },
  {
    id: 'rajshree', name: 'Rajshree Velvet', price: 24900, tags: ['Velvet', 'Festive'],
    desc: 'Midnight velvet with raised zardozi vines, made for long evenings.',
    notes: ['Velvet', 'Zardozi', 'Hand Embroidery'],
    story: 'A winter drape with real weight. Deep navy silk velvet is worked with raised zardozi vines in antique gold, so the border catches candlelight from across the room.',
    details: { Fabric: 'Silk velvet', Length: '5.5 m with 0.8 m blouse piece', Work: 'Zardozi and dabka, by hand', Care: 'Dry clean only. Store rolled, never on a hanger.' },
  },
  {
    id: 'swarna', name: 'Swarna Organza', price: 13500, tags: ['Organza', 'Festive'],
    desc: 'Sunlit mustard organza finished with fine white thread work.',
    notes: ['Organza', 'White Thread Work', 'Lightweight'],
    story: 'Made for haldi mornings and mehendi afternoons. Swarna is sunlit mustard organza with ivory thread florals that read almost like lace from a step away.',
    details: { Fabric: 'Silk organza', Length: '5.5 m with 0.8 m blouse piece', Work: 'Machine and hand thread work', Care: 'Dry clean only.' },
  },
  {
    id: 'kaveri', name: 'Kaveri Kanchipuram', price: 21900, tags: ['Silk', 'Festive'], poses: ['kaveri-b', 'kaveri-c'],
    desc: 'A classic Kanchipuram in rich green with authentic temple border and gold motifs.',
    notes: ['Pure Silk', 'Temple Border', 'Traditional'],
    story: 'Kaveri is a proper Kanchipuram: body and border woven separately and interlocked by hand, so the temple border will never come loose. Heavy, cool silk in parrot green with a contrasting gold pallu.',
    details: { Fabric: 'Pure mulberry silk with zari', Length: '6.2 m with 0.8 m blouse piece', Weave: 'Korvai Kanchipuram, handloom', Care: 'Dry clean only. Refold along new lines every few months.' },
  },
  {
    id: 'madhavi', name: 'Madhavi Organza', price: 15200, tags: ['Organza'],
    desc: 'Soft lilac organza with delicate sequin work, a pastel favourite.',
    notes: ['Organza', 'Sequins Work', 'Pastel Edit'],
    story: 'Pastel without being washed out. Tiny sequins are set into the lilac organza so they only shimmer when you move, which makes it a favourite for engagement photographs.',
    details: { Fabric: 'Silk organza', Length: '5.5 m with 0.8 m blouse piece', Work: 'Hand-set sequins', Care: 'Dry clean only.' },
  },
  {
    id: 'veena', name: 'Veena Chikankari', price: 16800, tags: ['Festive'],
    desc: 'Cream georgette with intricate Chikankari embroidery, finished by hand.',
    notes: ['Georgette', 'Chikankari', 'Handcrafted'],
    story: 'From Lucknow, where chikankari has been stitched for centuries. Thirty-two kinds of stitch, all by hand, on fluid cream georgette. It takes one artisan close to two months.',
    details: { Fabric: 'Pure georgette', Length: '5.5 m with 0.8 m blouse piece', Work: 'Hand chikankari', Care: 'Gentle dry clean.' },
  },
  {
    id: 'nilambari', name: 'Nilambari Silk', price: 20500, tags: ['Silk', 'Festive'],
    desc: 'Pure silk in deep purple with gold butta work for festive days.',
    notes: ['Pure Silk', 'Butta Work', 'Festive Wear'],
    story: 'That purple is unreal in daylight. Nilambari is soft pure silk with small gold buttas woven through the body and a slim zari border that drapes into neat, crisp pleats.',
    details: { Fabric: 'Pure silk with zari', Length: '6.2 m with 0.8 m blouse piece', Weave: 'Handloom butta', Care: 'Dry clean only.' },
  },
];

export const FILTERS = ['All', 'Silk', 'Organza', 'Banarasi', 'Velvet', 'Festive'];
export const photos = (p) => [p.id, ...(p.poses ?? [])].map((id) => `/collection/${id}.webp`);
export const inr = (n) => '₹' + n.toLocaleString('en-IN');
export const byId = (id) => PIECES.find((p) => p.id === id);
