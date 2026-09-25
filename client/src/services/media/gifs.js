/**
 * GIF/sticker provider abstraction. The default provider is local and needs
 * no API key: a set of animated stickers. A Giphy/Tenor provider can be added
 * with the same `search(query)` shape and selected via env.
 */
const STICKERS = [
  { id: 'hug', emoji: '🤗', label: 'hug', anim: 'bounce' },
  { id: 'love', emoji: '🥰', label: 'love', anim: 'pulse' },
  { id: 'kiss', emoji: '😘', label: 'kiss', anim: 'pulse' },
  { id: 'cry', emoji: '🥹', label: 'emotional', anim: 'wobble' },
  { id: 'laugh', emoji: '😂', label: 'lol', anim: 'bounce' },
  { id: 'sleep', emoji: '😴', label: 'sleepy', anim: 'float' },
  { id: 'miss', emoji: '🫂', label: 'miss you', anim: 'pulse' },
  { id: 'party', emoji: '🥳', label: 'yay', anim: 'spin' },
  { id: 'cat', emoji: '🐈', label: 'cat', anim: 'float' },
  { id: 'coffee', emoji: '☕', label: 'coffee', anim: 'wobble' },
  { id: 'moon', emoji: '🌙', label: 'goodnight', anim: 'float' },
  { id: 'sun', emoji: '🌞', label: 'good morning', anim: 'spin' },
  { id: 'heart', emoji: '💗', label: 'heart', anim: 'pulse' },
  { id: 'shy', emoji: '🙈', label: 'shy', anim: 'wobble' },
  { id: 'fire', emoji: '🔥', label: 'hot', anim: 'wobble' },
  { id: 'star', emoji: '🌟', label: 'proud', anim: 'spin' },
];

export const localStickerProvider = {
  name: 'local',
  async search(query = '') {
    const q = query.trim().toLowerCase();
    return q ? STICKERS.filter((s) => s.label.includes(q) || s.id.includes(q)) : STICKERS;
  },
};

export const STICKERS_BY_ID = Object.fromEntries(STICKERS.map((s) => [s.id, s]));
export const gifProvider = localStickerProvider;
