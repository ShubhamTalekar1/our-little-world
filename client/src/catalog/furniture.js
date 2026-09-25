// Room decorations. Positions are percentages of the room canvas.
export const FURNITURE = [
  { id: 'plant', name: 'Monstera', emoji: '🪴', price: 0, size: 64, layer: 'floor' },
  { id: 'lamp', name: 'Paper lamp', emoji: 'lamp', price: 0, size: 70, layer: 'floor', glow: true },
  { id: 'fairy', name: 'Fairy lights', emoji: 'fairy', price: 0, size: 0, layer: 'wall', special: true },
  { id: 'books', name: 'Stack of books', emoji: '📚', price: 30, size: 40, layer: 'floor' },
  { id: 'candles', name: 'Candles', emoji: '🕯️', price: 40, size: 36, layer: 'floor', glow: true },
  { id: 'flowers', name: 'Vase of tulips', emoji: '💐', price: 60, size: 44, layer: 'floor' },
  { id: 'teddy', name: 'Big teddy', emoji: '🧸', price: 90, size: 52, layer: 'floor' },
  { id: 'speaker', name: 'Record player', emoji: '📻', price: 120, size: 44, layer: 'floor' },
  { id: 'frame', name: 'Our photo', emoji: '🖼️', price: 50, size: 44, layer: 'wall' },
  { id: 'poster', name: 'Moon poster', emoji: '🌙', price: 70, size: 46, layer: 'wall' },
  { id: 'cactus', name: 'Tiny cactus', emoji: '🌵', price: 25, size: 34, layer: 'floor' },
  { id: 'guitar', name: 'Guitar', emoji: '🎸', price: 150, size: 58, layer: 'floor' },
  { id: 'globe', name: 'Little globe', emoji: '🌍', price: 80, size: 36, layer: 'floor' },
  { id: 'cat-bed', name: 'Pet bed', emoji: '🧺', price: 60, size: 44, layer: 'floor' },
];
export const FURNITURE_BY_ID = Object.fromEntries(FURNITURE.map((f) => [f.id, f]));
