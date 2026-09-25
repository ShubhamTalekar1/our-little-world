// Shared keepsakes, not trophies. `check` receives a snapshot of counts.
export const ACHIEVEMENTS = [
  { id: 'first-movie', emoji: '🎬', name: 'First Movie Together', note: 'Popcorn optional, company essential.', check: (s) => s.movies >= 1 },
  { id: 'messages-100', emoji: '💌', name: '100 Messages', note: 'A hundred little hellos.', check: (s) => s.messages >= 100 },
  { id: 'first-dance', emoji: '💃', name: 'First Dance', note: 'Nobody stepped on anybody’s toes.', check: (s) => s.dances >= 1 },
  { id: 'gifts-10', emoji: '🎁', name: '10 Virtual Gifts', note: 'A small, growing pile of love.', check: (s) => s.gifts >= 10 },
  { id: 'first-date', emoji: '🌃', name: 'First Date Night', note: 'Dressed up for each other.', check: (s) => s.dates >= 1 },
  { id: 'days-30', emoji: '❤️', name: '30 Days Together', note: 'A whole month of us.', check: (s) => s.days >= 30 },
  { id: 'days-100', emoji: '💯', name: '100 Days Together', note: 'Triple digits.', check: (s) => s.days >= 100 },
  { id: 'first-memory', emoji: '📸', name: 'First Shared Memory', note: 'The wall has begun.', check: (s) => s.memories >= 1 },
  { id: 'first-letter', emoji: '✉️', name: 'First Letter', note: 'Ink, even if it’s pixels.', check: (s) => s.letters >= 1 },
  { id: 'pet-named', emoji: '🐾', name: 'A Little Family', note: 'You named them together.', check: (s) => s.petNamed },
  { id: 'checkins-7', emoji: '🌤️', name: 'Seven Check-ins', note: 'Knowing how each other’s days went.', check: (s) => s.checkins >= 7 },
  { id: 'hugs-25', emoji: '🤗', name: '25 Hugs', note: 'Long-distance hugs still count.', check: (s) => s.hugs >= 25 },
];
