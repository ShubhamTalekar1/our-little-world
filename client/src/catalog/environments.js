// Places the two of you can be. Each maps to a scene component in
// components/room/scenes. Adding a place = add a scene + an entry here.
export const ENVIRONMENTS = [
  { id: 'bedroom', name: 'Rainy window room', short: 'Our room', emoji: '🌧️', mood: 'Rain on the glass, the lamp on low.', presence: 'in our room' },
  { id: 'rooftop', name: 'Rooftop under the stars', short: 'Rooftop', emoji: '🌃', mood: 'City hum below, string lights above.', presence: 'on the rooftop' },
  { id: 'beach', name: 'Sunset beach', short: 'Beach', emoji: '🌅', mood: 'Warm sand and a slow tide.', presence: 'at the beach' },
  { id: 'cafe', name: 'Rainy café', short: 'Café', emoji: '☕', mood: 'Two cups, one corner table.', presence: 'at the café' },
  { id: 'stargazing', name: 'Stargazing hill', short: 'Stargazing', emoji: '🌌', mood: 'Blanket, grass, and too many stars.', presence: 'stargazing' },
  { id: 'campfire', name: 'Campfire', short: 'Campfire', emoji: '🔥', mood: 'Crackling wood, pine and sparks.', presence: 'by the campfire' },
  { id: 'theater', name: 'Tiny movie theater', short: 'Theater', emoji: '🎬', mood: 'Two seats, one screen, all ours.', presence: 'at the movies' },
];

export const ENV_BY_ID = Object.fromEntries(ENVIRONMENTS.map((e) => [e.id, e]));
