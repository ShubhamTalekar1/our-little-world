// Server-side prices and keys. The client catalog (client/src/catalog) holds
// the display data; the server only needs what it must enforce: what things
// cost and which keys exist. Keep the two in sync when adding items.
export const GIFT_PRICES = {
  rose: 40, tulip: 40, sunflower: 50, coffee: 30, chocolate: 60, heart: 25, letter: 35,
  balloons: 70, candle: 55, cake: 90, teddy: 120, bouquet: 150, stars: 180, moon: 300, mystery: 100,
};
export const GIFT_NAMES = {
  rose: 'Red Rose', tulip: 'Tulip', sunflower: 'Sunflower', coffee: 'Morning Coffee', chocolate: 'Chocolate', heart: 'A Whole Heart',
  letter: 'Tiny Love Note', balloons: 'Balloons', candle: 'Candle', cake: 'Tiny Cake', teddy: 'Teddy Bear', bouquet: 'Bouquet',
  stars: 'A Handful of Stars', moon: 'The Moon', mystery: 'Mystery Gift',
};
export const MYSTERY_POOL = ['bouquet', 'stars', 'teddy', 'cake', 'moon', 'balloons', 'candle'];

// Only priced clothing is listed; anything else in the client catalog is free.
export const CLOTHING_PRICES = {
  'shirt-sky': 80, 'sweater-rust': 120, 'jacket-leather': 220, 'blazer-char': 160, 'puffer-sage': 180, 'kimono-floral': 150,
  'dress-evening': 260, 'dress-wine': 260, 'dress-floral': 140, 'trousers-cream': 90, 'skirt-pleat': 70, 'heels-black': 120,
  slippers: 60, 'glasses-heart': 90, 'hat-beret': 80, 'hat-flowers': 110, 'ear-pearls': 100, 'neck-pearls': 140,
};
export const FURNITURE_PRICES = {
  plant: 0, lamp: 0, fairy: 0, books: 30, candles: 40, flowers: 60, teddy: 90, speaker: 120, frame: 50, poster: 70, cactus: 25, guitar: 150, globe: 80, 'cat-bed': 60,
};
export const PET_ACCESSORY_PRICES = { none: 0, bow: 0, scarf: 40, crown: 120, flower: 30 };
export const PET_FOOD = { treat: { price: 5, hunger: 15 }, meal: { price: 12, hunger: 40 }, berries: { price: 8, hunger: 25 } };
export const COIN_PACKS = { handful: 300, jar: 800, treasure: 2000 };
export const ENVIRONMENTS = ['bedroom', 'rooftop', 'beach', 'cafe', 'stargazing', 'campfire', 'theater'];
export const STAT_KEYS = ['movies', 'dances', 'dates', 'hugs'];
