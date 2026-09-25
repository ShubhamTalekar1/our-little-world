// Everything an avatar can be made of. Pure data — the renderer lives in
// components/avatar. New items only need an entry here plus (for brand-new
// `style`s) a small drawing branch in the renderer.

export const SKIN_TONES = [
  { id: 'porcelain', color: '#F6DCCB' },
  { id: 'fair', color: '#F0CDB4' },
  { id: 'light', color: '#E6B999' },
  { id: 'wheat', color: '#D9A37F' },
  { id: 'honey', color: '#C68A62' },
  { id: 'caramel', color: '#A86E4A' },
  { id: 'cocoa', color: '#855437' },
  { id: 'espresso', color: '#5E3A26' },
];

export const HAIR_COLORS = [
  { id: 'black', color: '#1E1A1D', name: 'Soft black' },
  { id: 'espresso', color: '#3A2621', name: 'Espresso' },
  { id: 'chestnut', color: '#6B3F2A', name: 'Chestnut' },
  { id: 'auburn', color: '#8E3F2C', name: 'Auburn' },
  { id: 'honey', color: '#B7824C', name: 'Honey' },
  { id: 'blonde', color: '#D8B67E', name: 'Blonde' },
  { id: 'ash', color: '#9C9591', name: 'Ash' },
  { id: 'lavender', color: '#A993CF', name: 'Lavender' },
  { id: 'rose', color: '#C98B98', name: 'Dusty rose' },
  { id: 'midnight', color: '#2B3450', name: 'Midnight' },
];

export const EYE_COLORS = [
  { id: 'dark', color: '#2A1E1C' },
  { id: 'brown', color: '#5A3825' },
  { id: 'hazel', color: '#7A6232' },
  { id: 'green', color: '#4E6E4E' },
  { id: 'blue', color: '#4A6A92' },
  { id: 'grey', color: '#636B74' },
];

export const BODY_TYPES = [
  { id: 'slim', name: 'Slim' },
  { id: 'average', name: 'Average' },
  { id: 'soft', name: 'Soft' },
];

export const HEIGHTS = [
  { id: 'petite', name: 'Petite', scale: 0.94 },
  { id: 'average', name: 'Average', scale: 1 },
  { id: 'tall', name: 'Tall', scale: 1.05 },
];

export const FACE_SHAPES = [
  { id: 'round', name: 'Round' },
  { id: 'oval', name: 'Oval' },
  { id: 'heart', name: 'Heart' },
  { id: 'square', name: 'Soft square' },
];

export const HAIR_STYLES = [
  { id: 'short', name: 'Short' },
  { id: 'sidepart', name: 'Side part' },
  { id: 'messy', name: 'Messy' },
  { id: 'buzz', name: 'Buzz' },
  { id: 'curly', name: 'Curly' },
  { id: 'bob', name: 'Bob' },
  { id: 'long', name: 'Long' },
  { id: 'wavy', name: 'Wavy' },
  { id: 'ponytail', name: 'Ponytail' },
  { id: 'buns', name: 'Space buns' },
];

export const EYE_STYLES = [
  { id: 'round', name: 'Round' },
  { id: 'sparkle', name: 'Sparkly' },
  { id: 'lashes', name: 'Lashes' },
  { id: 'sleepy', name: 'Sleepy' },
  { id: 'happy', name: 'Happy' },
];

export const BROW_STYLES = [
  { id: 'soft', name: 'Soft' },
  { id: 'arched', name: 'Arched' },
  { id: 'straight', name: 'Straight' },
  { id: 'thick', name: 'Thick' },
];

export const NOSE_STYLES = [
  { id: 'button', name: 'Button' },
  { id: 'dot', name: 'Dot' },
  { id: 'line', name: 'Line' },
];

export const MOUTH_STYLES = [
  { id: 'smile', name: 'Smile' },
  { id: 'grin', name: 'Grin' },
  { id: 'cat', name: 'Cat' },
  { id: 'smirk', name: 'Smirk' },
  { id: 'o', name: 'Oh' },
];

export const FACE_EXTRAS = [
  { id: 'blush', name: 'Blush' },
  { id: 'freckles', name: 'Freckles' },
  { id: 'blush-freckles', name: 'Both' },
  { id: 'mole', name: 'Beauty mark' },
  { id: 'none', name: 'None' },
];

// Equip slots. `dress` replaces top + bottom while worn.
export const SLOTS = {
  top: { name: 'Tops', group: 'clothing' },
  outer: { name: 'Layers', group: 'clothing' },
  dress: { name: 'Dresses', group: 'clothing' },
  bottom: { name: 'Bottoms', group: 'clothing' },
  shoes: { name: 'Shoes', group: 'clothing' },
  glasses: { name: 'Glasses', group: 'accessories' },
  hat: { name: 'Hats', group: 'accessories' },
  earrings: { name: 'Earrings', group: 'accessories' },
  necklace: { name: 'Necklaces', group: 'accessories' },
  watch: { name: 'Watches', group: 'accessories' },
  bag: { name: 'Bags', group: 'accessories' },
};

const item = (id, slot, style, name, color, extra = {}) => ({
  id,
  slot,
  style,
  name,
  color,
  accent: extra.accent,
  rarity: extra.rarity ?? 'common',
  tags: extra.tags ?? [],
});

export const CLOTHING = [
  // Tops
  item('tee-cream', 'top', 'tee', 'Cream tee', '#EDE3D3', { tags: ['casual'] }),
  item('tee-sage', 'top', 'tee', 'Sage tee', '#9DB8A0', { tags: ['casual'] }),
  item('tee-ink', 'top', 'tee', 'Ink tee', '#2E3142', { tags: ['casual'] }),
  item('shirt-white', 'top', 'shirt', 'Crisp white shirt', '#F2F0EA', { tags: ['formal', 'date'] }),
  item('shirt-sky', 'top', 'shirt', 'Oxford blue shirt', '#A9C1DB', { tags: ['casual'] }),
  item('hoodie-lav', 'top', 'hoodie', 'Lavender hoodie', '#B8A7D9', { tags: ['cozy', 'matching'] }),
  item('hoodie-oat', 'top', 'hoodie', 'Oat hoodie', '#CDBBA2', { tags: ['cozy'] }),
  item('sweater-rust', 'top', 'sweater', 'Rust knit sweater', '#B8664A', { tags: ['winter', 'cozy'] }),
  item('sweater-cream', 'top', 'sweater', 'Cream cable knit', '#EFE4D2', { tags: ['winter', 'cozy'] }),
  item('blouse-peach', 'top', 'blouse', 'Peach puff blouse', '#E8B4A0', { tags: ['date'] }),
  item('tank-white', 'top', 'tank', 'White tank', '#F4F1EA', { tags: ['beach'] }),
  item('pj-top', 'top', 'pajama', 'Cloud pajama top', '#C5CFE6', { tags: ['pajamas'], accent: '#F5EBDD' }),

  // Layers
  item('jacket-denim', 'outer', 'jacket', 'Denim jacket', '#5E7AA0', { tags: ['casual'] }),
  item('jacket-leather', 'outer', 'jacket', 'Leather jacket', '#2A2427', { tags: ['date'], rarity: 'rare' }),
  item('blazer-char', 'outer', 'blazer', 'Charcoal blazer', '#3B3E4C', { tags: ['formal'] }),
  item('cardigan-cream', 'outer', 'cardigan', 'Cream cardigan', '#E9DCC6', { tags: ['cozy'] }),
  item('puffer-sage', 'outer', 'puffer', 'Sage puffer', '#8FA890', { tags: ['winter'] }),
  item('kimono-floral', 'outer', 'kimono', 'Festival kimono', '#D98E96', { tags: ['festival'], accent: '#F2C98B', rarity: 'rare' }),

  // Dresses
  item('dress-sun', 'dress', 'sundress', 'Butter sundress', '#EFD58F', { tags: ['beach', 'casual'] }),
  item('dress-evening', 'dress', 'evening', 'Midnight slip dress', '#2B2F4A', { tags: ['date', 'formal'], rarity: 'rare' }),
  item('dress-wine', 'dress', 'evening', 'Wine slip dress', '#7A2E3F', { tags: ['date'], rarity: 'rare' }),
  item('dress-knit', 'dress', 'knit', 'Oat knit dress', '#CDBBA2', { tags: ['winter', 'cozy'] }),
  item('dress-floral', 'dress', 'floral', 'Lilac floral dress', '#C9B8E6', { tags: ['festival', 'date'], accent: '#F5EBDD' }),

  // Bottoms
  item('jeans-blue', 'bottom', 'jeans', 'Straight jeans', '#4D6389', { tags: ['casual'] }),
  item('jeans-black', 'bottom', 'jeans', 'Black jeans', '#25262F', { tags: ['date'] }),
  item('trousers-char', 'bottom', 'pants', 'Tailored trousers', '#3B3E4C', { tags: ['formal'] }),
  item('trousers-cream', 'bottom', 'pants', 'Linen trousers', '#E3D6C1', { tags: ['beach', 'casual'] }),
  item('shorts-denim', 'bottom', 'shorts', 'Denim shorts', '#6A86AE', { tags: ['beach'] }),
  item('skirt-plum', 'bottom', 'skirt', 'Plum midi skirt', '#6E4A6F', { tags: ['date'] }),
  item('skirt-pleat', 'bottom', 'skirt', 'Pleated cream skirt', '#EAE0CF', { tags: ['casual'] }),
  item('pj-pants', 'bottom', 'pajama', 'Cloud pajama pants', '#C5CFE6', { tags: ['pajamas'], accent: '#F5EBDD' }),
  item('sweats-grey', 'bottom', 'sweats', 'Grey sweatpants', '#8C8A94', { tags: ['cozy'] }),

  // Shoes
  item('sneakers-white', 'shoes', 'sneakers', 'White sneakers', '#F4F1EA', { tags: ['casual'] }),
  item('boots-brown', 'shoes', 'boots', 'Chelsea boots', '#5A3B2C', { tags: ['winter', 'date'] }),
  item('heels-black', 'shoes', 'heels', 'Black heels', '#1F1C22', { tags: ['date', 'formal'] }),
  item('loafers', 'shoes', 'loafers', 'Brown loafers', '#6B432E', { tags: ['formal'] }),
  item('slippers', 'shoes', 'slippers', 'Bunny slippers', '#F2E9EE', { tags: ['pajamas'] }),
  item('sandals', 'shoes', 'sandals', 'Woven sandals', '#C8A27A', { tags: ['beach', 'festival'] }),

  // Accessories
  item('glasses-round', 'glasses', 'round', 'Round glasses', '#3A2E2A', { tags: ['casual'] }),
  item('glasses-square', 'glasses', 'square', 'Square frames', '#1E1B20', { tags: ['formal'] }),
  item('glasses-sun', 'glasses', 'sun', 'Sunglasses', '#141319', { tags: ['beach'] }),
  item('glasses-heart', 'glasses', 'heart', 'Heart shades', '#C45E74', { tags: ['festival'], rarity: 'rare' }),
  item('hat-beanie', 'hat', 'beanie', 'Rust beanie', '#B8664A', { tags: ['winter'] }),
  item('hat-cap', 'hat', 'cap', 'Navy cap', '#2D3A5A', { tags: ['casual'] }),
  item('hat-beret', 'hat', 'beret', 'Wine beret', '#7A2E3F', { tags: ['date'] }),
  item('hat-sun', 'hat', 'sunhat', 'Straw sun hat', '#D8BC8A', { tags: ['beach'], accent: '#3B3E4C' }),
  item('hat-flowers', 'hat', 'flowers', 'Flower crown', '#E8B4A0', { tags: ['festival'], accent: '#B8A7D9', rarity: 'rare' }),
  item('ear-studs', 'earrings', 'studs', 'Gold studs', '#E8C27A', { tags: ['casual'] }),
  item('ear-hoops', 'earrings', 'hoops', 'Gold hoops', '#E8C27A', { tags: ['date'] }),
  item('ear-pearls', 'earrings', 'pearls', 'Pearl drops', '#F5EFE6', { tags: ['formal'] }),
  item('neck-pendant', 'necklace', 'pendant', 'Little heart pendant', '#E8C27A', { tags: ['date'] }),
  item('neck-pearls', 'necklace', 'pearls', 'Pearl strand', '#F5EFE6', { tags: ['formal'], rarity: 'rare' }),
  item('neck-chain', 'necklace', 'chain', 'Silver chain', '#C9CDD6', { tags: ['casual'] }),
  item('watch-gold', 'watch', 'classic', 'Gold watch', '#E0B96B', { tags: ['formal'] }),
  item('watch-leather', 'watch', 'classic', 'Leather strap watch', '#6B432E', { tags: ['casual'] }),
  item('bag-cross', 'bag', 'crossbody', 'Tan crossbody', '#B98B62', { tags: ['casual'] }),
  item('bag-tote', 'bag', 'tote', 'Canvas tote', '#E3D6C1', { tags: ['beach'], accent: '#9DB8A0' }),
];

export const CLOTHING_BY_ID = Object.fromEntries(CLOTHING.map((i) => [i.id, i]));

// Themed looks. Applying one equips these slots and clears the others listed
// in `clear`, leaving anything unmentioned as the person had it.
export const THEMED_OUTFITS = [
  {
    id: 'date-night',
    name: 'Date night',
    emoji: '🌙',
    variants: {
      feminine: { dress: 'dress-evening', shoes: 'heels-black', earrings: 'ear-hoops', necklace: 'neck-pendant' },
      masculine: { top: 'shirt-white', outer: 'jacket-leather', bottom: 'jeans-black', shoes: 'boots-brown', watch: 'watch-gold' },
    },
  },
  {
    id: 'casual',
    name: 'Casual',
    emoji: '☕',
    variants: {
      feminine: { top: 'tee-cream', outer: 'jacket-denim', bottom: 'skirt-pleat', shoes: 'sneakers-white', bag: 'bag-cross' },
      masculine: { top: 'tee-sage', bottom: 'jeans-blue', shoes: 'sneakers-white', watch: 'watch-leather' },
    },
  },
  {
    id: 'formal',
    name: 'Formal',
    emoji: '🥂',
    variants: {
      feminine: { dress: 'dress-wine', shoes: 'heels-black', earrings: 'ear-pearls', necklace: 'neck-pearls' },
      masculine: { top: 'shirt-white', outer: 'blazer-char', bottom: 'trousers-char', shoes: 'loafers', watch: 'watch-gold' },
    },
  },
  {
    id: 'pajamas',
    name: 'Pajamas',
    emoji: '😴',
    variants: {
      feminine: { top: 'pj-top', bottom: 'pj-pants', shoes: 'slippers' },
      masculine: { top: 'pj-top', bottom: 'pj-pants', shoes: 'slippers' },
    },
  },
  {
    id: 'festival',
    name: 'Festival',
    emoji: '🪷',
    variants: {
      feminine: { dress: 'dress-floral', outer: 'kimono-floral', shoes: 'sandals', hat: 'hat-flowers', glasses: 'glasses-heart' },
      masculine: { top: 'tee-cream', outer: 'kimono-floral', bottom: 'trousers-cream', shoes: 'sandals', glasses: 'glasses-heart' },
    },
  },
  {
    id: 'beach',
    name: 'Beach',
    emoji: '🌊',
    variants: {
      feminine: { dress: 'dress-sun', shoes: 'sandals', hat: 'hat-sun', glasses: 'glasses-sun', bag: 'bag-tote' },
      masculine: { top: 'tank-white', bottom: 'shorts-denim', shoes: 'sandals', glasses: 'glasses-sun' },
    },
  },
  {
    id: 'winter',
    name: 'Winter',
    emoji: '❄️',
    variants: {
      feminine: { dress: 'dress-knit', outer: 'puffer-sage', shoes: 'boots-brown', hat: 'hat-beanie' },
      masculine: { top: 'sweater-rust', outer: 'puffer-sage', bottom: 'jeans-blue', shoes: 'boots-brown', hat: 'hat-beanie' },
    },
  },
  {
    id: 'matching',
    name: 'Matching',
    emoji: '💞',
    variants: {
      feminine: { top: 'hoodie-lav', bottom: 'jeans-blue', shoes: 'sneakers-white' },
      masculine: { top: 'hoodie-lav', bottom: 'jeans-blue', shoes: 'sneakers-white' },
    },
  },
];

// Slots a themed outfit resets before applying (so e.g. a leftover jacket
// doesn't sit on top of a slip dress).
export const OUTFIT_SLOTS = ['top', 'outer', 'dress', 'bottom', 'shoes', 'glasses', 'hat', 'earrings', 'necklace', 'watch', 'bag'];
