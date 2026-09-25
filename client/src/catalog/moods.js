export const MOODS = [
  { id: 'happy', emoji: '😊', label: 'Happy' },
  { id: 'loved', emoji: '🥰', label: 'Loved' },
  { id: 'tired', emoji: '😴', label: 'Tired' },
  { id: 'sad', emoji: '😔', label: 'Sad' },
  { id: 'excited', emoji: '😎', label: 'Excited' },
  { id: 'meh', emoji: '😐', label: 'Meh' },
];
export const MOODS_BY_ID = Object.fromEntries(MOODS.map((m) => [m.id, m]));
