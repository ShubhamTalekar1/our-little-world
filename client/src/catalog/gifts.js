// The gift shop. `anim` picks the idle animation used by <GiftArt/>.
export const RARITY = {
  common: { label: 'Common', color: '#A39DB0' },
  rare: { label: 'Rare', color: '#8FB3D9' },
  epic: { label: 'Epic', color: '#B8A7D9' },
  legendary: { label: 'Legendary', color: '#F2C98B' },
};

export const GIFTS = [
  { id: 'rose', emoji: '🌹', name: 'Red Rose', description: "Because apparently one rose isn't enough.", price: 40, rarity: 'common', anim: 'bloom', hue: '#D98E96' },
  { id: 'tulip', emoji: '🌷', name: 'Tulip', description: 'Soft, a little shy, and entirely for you.', price: 40, rarity: 'common', anim: 'bloom', hue: '#E8B4A0' },
  { id: 'sunflower', emoji: '🌻', name: 'Sunflower', description: 'For the days you need a bit of sun.', price: 50, rarity: 'common', anim: 'bloom', hue: '#F2C98B' },
  { id: 'coffee', emoji: '☕', name: 'Morning Coffee', description: "Pretend I brought it to bed. It's still warm.", price: 30, rarity: 'common', anim: 'steam', hue: '#C8A27A' },
  { id: 'chocolate', emoji: '🍫', name: 'Chocolate', description: 'The good kind. You deserve the good kind.', price: 60, rarity: 'common', anim: 'bounce', hue: '#A86E4A' },
  { id: 'heart', emoji: '❤️', name: 'A Whole Heart', description: 'Mine. Please keep it somewhere safe.', price: 25, rarity: 'common', anim: 'pulse', hue: '#D98E96' },
  { id: 'letter', emoji: '💌', name: 'Tiny Love Note', description: 'Folded twice, sealed with something sweet.', price: 35, rarity: 'common', anim: 'float', hue: '#E8B4A0' },
  { id: 'balloons', emoji: '🎈', name: 'Balloons', description: 'For no reason at all. Those are the best reasons.', price: 70, rarity: 'rare', anim: 'float', hue: '#D98E96' },
  { id: 'candle', emoji: '🕯️', name: 'Candle', description: 'A little light for a long evening apart.', price: 55, rarity: 'rare', anim: 'flicker', hue: '#F2C98B' },
  { id: 'cake', emoji: '🎂', name: 'Tiny Cake', description: 'Make a wish. I already know mine.', price: 90, rarity: 'rare', anim: 'bounce', hue: '#F5EBDD' },
  { id: 'teddy', emoji: '🧸', name: 'Teddy Bear', description: 'For hugging when I physically cannot.', price: 120, rarity: 'rare', anim: 'bounce', hue: '#C8A27A' },
  { id: 'bouquet', emoji: '💐', name: 'Bouquet', description: 'A whole armful. Arranged badly, with love.', price: 150, rarity: 'epic', anim: 'bloom', hue: '#B8A7D9' },
  { id: 'stars', emoji: '✨', name: 'A Handful of Stars', description: 'I asked the sky. It said yes.', price: 180, rarity: 'epic', anim: 'sparkle', hue: '#F2C98B' },
  { id: 'moon', emoji: '🌙', name: 'The Moon', description: "It's yours now. I'll visit.", price: 300, rarity: 'legendary', anim: 'glow', hue: '#F5EBDD' },
  { id: 'mystery', emoji: '🎁', name: 'Mystery Gift', description: 'Even I don’t know what’s inside.', price: 100, rarity: 'epic', anim: 'shake', hue: '#B8A7D9', mystery: true },
];

export const GIFTS_BY_ID = Object.fromEntries(GIFTS.map((g) => [g.id, g]));

// Mystery gifts resolve to one of these.
export const MYSTERY_POOL = ['bouquet', 'stars', 'teddy', 'cake', 'moon', 'balloons', 'candle'];

export const GIFT_MESSAGES = ['Just because.', 'Thinking of you.', 'For later tonight.', 'Miss you.', 'You make everything softer.'];

const PHRASES = { balloons: 'some Balloons', chocolate: 'some Chocolate', coffee: 'a Morning Coffee', moon: 'the Moon', stars: 'a Handful of Stars', heart: 'a Whole Heart', letter: 'a Tiny Love Note' };
/** "She sent you ___" */
export const giftPhrase = (g) => PHRASES[g.id] ?? `${/^[AEIOU]/i.test(g.name) ? 'an' : 'a'} ${g.name}`;
