// What's open in this world right now. Build-time config, so it can change
// without code changes:
//   VITE_RELATIONSHIP=friends | couple      (default: friends)
//   VITE_FEATURES=chat,movie                 (default: chat,movie)
//
// Every feature is one of:
//   enabled — usable
//   locked  — shown with a lock ("not open yet")
//   hidden  — not shown at all (romantic features while in friends mode)
const env = import.meta.env;

export const RELATIONSHIP = env.VITE_RELATIONSHIP === 'couple' ? 'couple' : 'friends';
export const FRIENDS = RELATIONSHIP === 'friends';

const ENABLED = new Set(
  (env.VITE_FEATURES ?? 'chat,movie')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),
);
const ALL = ENABLED.has('all');

// Features that only make sense for a couple — hidden entirely for friends.
const ROMANTIC = new Set(['dance', 'date', 'letters', 'gifts', 'story']);

export const FEATURES = {
  chat: 'Chat',
  movie: 'Movie night',
  call: 'Video calls',
  music: 'Music room',
  avatar: 'Avatar',
  wardrobe: 'Wardrobe',
  memories: 'Memories',
  dates: 'Calendar',
  world: 'Decorating & pet',
  gifts: 'Gifts',
  letters: 'Letters',
  dance: 'Slow dance',
  date: 'Date night',
  story: 'Our story',
};

export function featureState(name) {
  if (!name) return 'enabled';
  if (FRIENDS && ROMANTIC.has(name)) return 'hidden';
  if (ALL || ENABLED.has(name)) return 'enabled';
  return 'locked';
}
export const isEnabled = (name) => featureState(name) === 'enabled';
export const isHidden = (name) => featureState(name) === 'hidden';

/** Little gestures allowed in this mode. */
export const INTERACTIONS_ALLOWED = FRIENDS ? ['wave', 'highfive'] : ['hug', 'kiss', 'wave', 'love', 'highfive', 'pat'];
