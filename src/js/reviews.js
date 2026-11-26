// SAMPLE reviews: placeholders written for the template. Replace them with real
// customer reviews (with permission) before the site goes live.
export const REVIEWS = [
  {
    product: 'gulmohar',
    name: 'Ananya R.',
    place: 'Bengaluru',
    occasion: 'Wedding reception',
    rating: 5,
    text: 'The zari has a soft glow you only notice in person. I wore it for my reception and three aunties asked where it was from before dinner was even served.',
  },
  {
    product: 'noor',
    name: 'Meher S.',
    place: 'Lucknow',
    occasion: 'Summer wedding',
    rating: 5,
    text: 'So light I forgot I was wearing organza. The embroidered roses look even prettier up close, every one is a little different.',
  },
  {
    product: 'rajshree',
    name: 'Priya K.',
    place: 'Delhi',
    occasion: 'Winter sangeet',
    rating: 5,
    text: 'Rich, heavy velvet and the zardozi catches every light in the room. The team helped me choose a blouse over a video call. Worth every rupee.',
  },
  {
    product: 'kaveri',
    name: 'Lakshmi V.',
    place: 'Chennai',
    occasion: 'Family puja',
    rating: 5,
    text: 'A proper Kanchipuram, cool and heavy with a border that will outlast me. It feels like something I will hand down to my daughter.',
  },
  {
    product: 'swarna',
    name: 'Ritika M.',
    place: 'Jaipur',
    occasion: 'Mehendi',
    rating: 4,
    text: 'The marigold is exactly as bright as the photos. Draped in minutes and stayed in place through hours of dancing.',
  },
  {
    product: 'veena',
    name: 'Sana A.',
    place: 'Hyderabad',
    occasion: 'Eid lunch',
    rating: 5,
    text: 'The chikankari is so fine it looks like lace. Packaging was beautiful too, it arrived wrapped in muslin with a handwritten note.',
  },
  {
    product: 'madhavi',
    name: 'Ishita P.',
    place: 'Mumbai',
    occasion: 'Engagement',
    rating: 5,
    text: 'Pastel without being washed out. The sequins only shimmer when you move, which is exactly what I wanted for photos.',
  },
  {
    product: 'nilambari',
    name: 'Kavya N.',
    place: 'Pune',
    occasion: 'Diwali',
    rating: 5,
    text: 'That purple is unreal in daylight. Pleats fall beautifully and the silk did not crush at all after a long evening.',
  },
];

export const reviewsFor = (id) => REVIEWS.filter((r) => r.product === id);
export const stars = (n) => '★★★★★'.slice(0, n) + '☆☆☆☆☆'.slice(0, 5 - n);
