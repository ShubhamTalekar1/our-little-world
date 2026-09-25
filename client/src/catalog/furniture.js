// Room decorations. Positions are percentages of the room canvas.
export const FURNITURE = [
  { id: 'plant', name: 'Monstera', emoji: '🪴', size: 64, layer: 'floor' },
  { id: 'lamp', name: 'Paper lamp', emoji: 'lamp', size: 70, layer: 'floor', glow: true },
  { id: 'fairy', name: 'Fairy lights', emoji: 'fairy', size: 0, layer: 'wall', special: true },
  { id: 'books', name: 'Stack of books', emoji: '📚', size: 40, layer: 'floor' },
  { id: 'candles', name: 'Candles', emoji: '🕯️', size: 36, layer: 'floor', glow: true },
  { id: 'flowers', name: 'Vase of tulips', emoji: '💐', size: 44, layer: 'floor' },
  { id: 'teddy', name: 'Big teddy', emoji: '🧸', size: 52, layer: 'floor' },
  { id: 'speaker', name: 'Record player', emoji: '📻', size: 44, layer: 'floor' },
  { id: 'frame', name: 'Our photo', emoji: '🖼️', size: 44, layer: 'wall' },
  { id: 'poster', name: 'Moon poster', emoji: '🌙', size: 46, layer: 'wall' },
  { id: 'cactus', name: 'Tiny cactus', emoji: '🌵', size: 34, layer: 'floor' },
  { id: 'guitar', name: 'Guitar', emoji: '🎸', size: 58, layer: 'floor' },
  { id: 'globe', name: 'Little globe', emoji: '🌍', size: 36, layer: 'floor' },
  { id: 'cat-bed', name: 'Pet bed', emoji: '🧺', size: 44, layer: 'floor' },
];
export const FURNITURE_BY_ID = Object.fromEntries(FURNITURE.map((f) => [f.id, f]));
