// Centralised seed data for demo mode. Components never import this directly —
// stores seed themselves from here, so swapping to the real API only touches
// the store/hydration layer.
import { AVATAR_ME, AVATAR_HER } from './defaultAvatars';
import { daysAgo, daysFromNow, minutesAgo } from '../lib/time';

export const ME_ID = 'u_me';
export const PARTNER_ID = 'u_her';

export const seedPeople = () => ({
  me: { id: ME_ID, name: 'Shubham', pronouns: 'he', email: 'shubham@ourlittle.world', timezone: Intl.DateTimeFormat().resolvedOptions().timeZone },
  partner: { id: PARTNER_ID, name: 'Her', pronouns: 'she', email: 'her@ourlittle.world', timezone: 'Europe/London' },
  couple: {
    id: 'c_1',
    name: 'Our little world',
    since: daysAgo(142, 20),
    inviteCode: 'LOVE-7K4P',
    anniversary: daysAgo(142, 20),
  },
});

export const seedAvatars = () => ({ [ME_ID]: AVATAR_ME, [PARTNER_ID]: AVATAR_HER });

export const seedWardrobe = () => ({
  outfits: [
    { id: 'o1', name: 'Date Night', emoji: '❤️', favorite: true, items: { top: 'shirt-white', outer: 'jacket-leather', bottom: 'jeans-black', shoes: 'boots-brown', watch: 'watch-gold' } },
    { id: 'o2', name: 'Cozy Sunday', emoji: '☕', favorite: true, items: { top: 'hoodie-oat', bottom: 'sweats-grey', shoes: 'sneakers-white' } },
    { id: 'o3', name: 'Movie Night', emoji: '🎬', favorite: false, items: { top: 'pj-top', bottom: 'pj-pants', shoes: 'sneakers-white' } },
    { id: 'o4', name: 'Matching', emoji: '💞', favorite: false, items: { top: 'hoodie-lav', bottom: 'jeans-blue', shoes: 'sneakers-white' } },
  ],
});

export const seedGifts = () => ({
  received: [
    { id: 'g1', giftId: 'sunflower', from: PARTNER_ID, message: 'For the rainy week you’re having.', at: daysAgo(1, 8), opened: true },
    { id: 'g2', giftId: 'coffee', from: PARTNER_ID, message: 'Wake up, sleepyhead.', at: daysAgo(2, 7), opened: true },
    { id: 'g3', giftId: 'stars', from: PARTNER_ID, message: 'I counted these for you.', at: daysAgo(5, 23), opened: true },
    { id: 'g4', giftId: 'teddy', from: PARTNER_ID, message: 'Hug this until I can.', at: daysAgo(9, 22), opened: true },
    { id: 'g5', giftId: 'rose', from: PARTNER_ID, message: 'Just because.', at: daysAgo(14, 19), opened: true },
    { id: 'g6', giftId: 'cake', from: PARTNER_ID, message: 'Happy 100 days, you.', at: daysAgo(42, 20), opened: true },
    { id: 'g7', giftId: 'letter', from: PARTNER_ID, message: 'Read this one twice.', at: daysAgo(60, 21), opened: true },
  ],
  sent: [
    { id: 'gs1', giftId: 'rose', to: PARTNER_ID, message: 'Just because.', at: daysAgo(1, 21) },
    { id: 'gs2', giftId: 'moon', to: PARTNER_ID, message: 'It’s yours now.', at: daysAgo(20, 23) },
    { id: 'gs3', giftId: 'chocolate', to: PARTNER_ID, message: 'The good kind.', at: daysAgo(33, 18) },
  ],
});

export const seedRoom = () => ({
  environment: 'bedroom',
  placed: [
    { uid: 'r1', id: 'plant', x: 7, y: 72 },
    { uid: 'r2', id: 'lamp', x: 86, y: 64 },
    { uid: 'r3', id: 'fairy', x: 0, y: 0 },
    { uid: 'r4', id: 'books', x: 16, y: 84 },
    { uid: 'r5', id: 'candles', x: 78, y: 86 },
    { uid: 'r6', id: 'frame', x: 70, y: 26 },
    { uid: 'r7', id: 'teddy', x: 91, y: 84 },
  ],
});

// Memories use painted "scenes" instead of stock photos in demo mode.
export const seedMemories = () => [
  { id: 'm1', scene: 'sunset', caption: 'Our first virtual date ❤️', date: daysAgo(138), location: 'Two screens, one sunset', reactions: { [PARTNER_ID]: '🥹' }, rotation: -3 },
  { id: 'm2', scene: 'rain', caption: 'You fell asleep on call. I stayed.', date: daysAgo(131), location: '', reactions: {}, rotation: 2 },
  { id: 'm3', scene: 'city', caption: 'Your city at night, via your window', date: daysAgo(124), location: 'London', reactions: { [ME_ID]: '✨' }, rotation: -1.5 },
  { id: 'm4', scene: 'cafe', caption: 'Same coffee order, 7,000 km apart', date: daysAgo(117), location: 'Our café', reactions: {}, rotation: 3 },
  { id: 'm5', scene: 'stars', caption: 'We both saw the same moon', date: daysAgo(108), location: '', reactions: { [PARTNER_ID]: '🌙' }, rotation: -2.5 },
  { id: 'm6', scene: 'flowers', caption: 'The tulips you sent (real ones!)', date: daysAgo(101), location: 'My desk', reactions: { [PARTNER_ID]: '🥰' }, rotation: 1.5 },
  { id: 'm7', scene: 'beach', caption: 'Planning where we’ll go first', date: daysAgo(96), location: 'Someday', reactions: {}, rotation: -1 },
  { id: 'm8', scene: 'film', caption: 'First movie night. You cried first.', date: daysAgo(90), location: 'Tiny theater', reactions: { [ME_ID]: '😂' }, rotation: 2.5 },
  { id: 'm9', scene: 'sunset', caption: 'Golden hour, your side', date: daysAgo(84), location: 'Brighton', reactions: {}, rotation: -2 },
  { id: 'm10', scene: 'rain', caption: 'Rainy Sunday, matching hoodies', date: daysAgo(76), location: '', reactions: { [PARTNER_ID]: '💞' }, rotation: 1 },
  { id: 'm11', scene: 'cake', caption: '100 days 🎂', date: daysAgo(42), location: 'Everywhere', reactions: { [ME_ID]: '❤️', [PARTNER_ID]: '❤️' }, rotation: -3 },
  { id: 'm12', scene: 'city', caption: 'You showed me your walk home', date: daysAgo(38), location: 'London', reactions: {}, rotation: 2 },
  { id: 'm13', scene: 'stars', caption: 'Stargazing, both awake at 2am', date: daysAgo(31), location: 'Hill (virtual)', reactions: {}, rotation: -1 },
  { id: 'm14', scene: 'flowers', caption: 'Spring on your balcony', date: daysAgo(25), location: '', reactions: { [ME_ID]: '🌷' }, rotation: 3 },
  { id: 'm15', scene: 'cafe', caption: 'Breakfast call before your exam', date: daysAgo(18), location: '', reactions: {}, rotation: -2 },
  { id: 'm16', scene: 'beach', caption: 'The sea you want to show me', date: daysAgo(12), location: 'Cornwall', reactions: {}, rotation: 1.5 },
  { id: 'm17', scene: 'film', caption: 'Rewatched our movie', date: daysAgo(6), location: '', reactions: { [PARTNER_ID]: '🍿' }, rotation: -2.5 },
  { id: 'm18', scene: 'sunset', caption: 'Twelve days to go', date: daysAgo(1), location: '', reactions: {}, rotation: 2 },
];

export const seedMessages = () => [
  { id: 'msg1', from: PARTNER_ID, text: 'good morning from the future 🌤️', at: minutesAgo(60 * 14), type: 'text', reactions: {} },
  { id: 'msg2', from: ME_ID, text: 'it’s still night here, how is the future', at: minutesAgo(60 * 13.9), type: 'text', reactions: {} },
  { id: 'msg3', from: PARTNER_ID, text: 'rainy. you’d hate it. you’d also love it', at: minutesAgo(60 * 13.8), type: 'text', reactions: { [ME_ID]: '😂' } },
  { id: 'msg4', from: ME_ID, text: 'sounds exactly like you', at: minutesAgo(60 * 13.7), type: 'text', reactions: {} },
  { id: 'msg5', from: PARTNER_ID, text: 'rude. correct, but rude', at: minutesAgo(60 * 13.6), type: 'text', reactions: {} },
  { id: 'msg6', from: PARTNER_ID, text: 'presentation went well btw!! they liked the slides', at: minutesAgo(60 * 5), type: 'text', reactions: { [ME_ID]: '🎉' } },
  { id: 'msg7', from: ME_ID, text: 'I KNEW IT. proud of you', at: minutesAgo(60 * 4.9), type: 'text', reactions: { [PARTNER_ID]: '🥰' } },
  { id: 'msg8', from: ME_ID, text: 'movie tonight? I found one you haven’t seen', at: minutesAgo(60 * 4.8), type: 'text', reactions: {} },
  { id: 'msg9', from: PARTNER_ID, text: 'yes. 9pm your time? I’ll bring imaginary popcorn', at: minutesAgo(60 * 4.6), type: 'text', reactions: {} },
  { id: 'msg10', from: PARTNER_ID, text: 'also I’m wearing the hoodie. the matching one', at: minutesAgo(38), type: 'text', reactions: {} },
];

export const seedLetters = () => [
  {
    id: 'l1',
    from: PARTNER_ID,
    title: 'Open this tomorrow morning ☀️',
    body: 'Good morning, you.\n\nIf you’re reading this, you listened, and you waited — which I know is hard for you.\n\nI hope the coffee is strong and the day is kind. I’ll be thinking about you around lunch, and at 4pm, and definitely when I see anything blue.\n\nTwelve more days.\n\nAll of me',
    unlockAt: daysFromNow(1, 7),
    at: daysAgo(0, 1),
    openedAt: null,
    seal: 'rose',
    paper: 'cream',
  },
  {
    id: 'l2',
    from: PARTNER_ID,
    title: 'Open this on our anniversary ❤️',
    body: 'Hi love.\n\nA whole year. I wrote this months early because I wanted to remember exactly how it felt to wait for you.\n\nIt felt like this: warm, a bit silly, and completely worth it.',
    unlockAt: daysFromNow(223, 0),
    at: daysAgo(20),
    openedAt: null,
    seal: 'moon',
    paper: 'lavender',
  },
  {
    id: 'l3',
    from: PARTNER_ID,
    title: 'For when you can’t sleep',
    body: 'Close your eyes.\n\nImagine the rain on my window. I’m next to you, stealing the blanket. You’re pretending to be annoyed.\n\nBreathe with me: in… and out.\n\nGoodnight. I’m right here.',
    unlockAt: daysAgo(30),
    at: daysAgo(31),
    openedAt: daysAgo(29),
    seal: 'star',
    paper: 'cream',
  },
  {
    id: 'l4',
    from: ME_ID,
    title: 'Read this on a bad day',
    body: 'Hey.\n\nWhatever happened today, it doesn’t get to decide who you are. You are the bravest, funniest, most stubborn person I know.\n\nCall me. Or don’t — just know I’m on your side, always.',
    unlockAt: daysAgo(50),
    at: daysAgo(51),
    openedAt: daysAgo(12),
    seal: 'heart',
    paper: 'cream',
  },
];

export const seedCalendar = () => ({
  events: [
    { id: 'e1', title: 'Movie Night', emoji: '🎬', type: 'movie', at: daysFromNow(0, 21), reminder: 15, note: 'Bring (imaginary) popcorn' },
    { id: 'e2', title: 'Call', emoji: '❤️', type: 'call', at: daysFromNow(1, 20, 30), reminder: 10, note: '' },
    { id: 'e3', title: 'Rooftop date', emoji: '🌃', type: 'date', at: daysFromNow(3, 21), reminder: 30, note: 'Dress code: formal' },
    { id: 'e4', title: 'Her birthday', emoji: '🎂', type: 'birthday', at: daysFromNow(9, 0), reminder: 1440, note: 'Order the real flowers!' },
    { id: 'e5', title: 'Airport ✈️', emoji: '🧳', type: 'important', at: daysFromNow(12, 16), reminder: 60, note: 'Finally.' },
    { id: 'e6', title: 'Five months', emoji: '💞', type: 'anniversary', at: daysFromNow(10, 20), reminder: 60, note: '' },
  ],
  countdowns: [
    { id: 'cd1', title: 'Until we see each other', emoji: '✈️', target: daysFromNow(12, 16), accent: 'peach', pinned: true },
    { id: 'cd2', title: 'Until our next date', emoji: '🌙', target: daysFromNow(0, 21), accent: 'lavender', pinned: true },
    { id: 'cd3', title: 'Until her birthday', emoji: '🎂', target: daysFromNow(9, 0), accent: 'lamp', pinned: false },
  ],
});

export const seedCheckins = () => [
  { id: 'ci1', userId: PARTNER_ID, mood: 'loved', note: 'Presentation went well! Also, you.', at: minutesAgo(60 * 5) },
  { id: 'ci2', userId: ME_ID, mood: 'tired', note: 'Long day, better now', at: daysAgo(1, 22) },
  { id: 'ci3', userId: PARTNER_ID, mood: 'happy', note: 'Found a new café', at: daysAgo(1, 12) },
  { id: 'ci4', userId: ME_ID, mood: 'excited', note: 'Booked the tickets!!', at: daysAgo(2, 19) },
  { id: 'ci5', userId: PARTNER_ID, mood: 'meh', note: '', at: daysAgo(3, 18) },
  { id: 'ci6', userId: ME_ID, mood: 'happy', note: '', at: daysAgo(4, 9) },
  { id: 'ci7', userId: PARTNER_ID, mood: 'sad', note: 'Missing you extra', at: daysAgo(5, 23) },
];

export const seedPet = () => ({
  adopted: true,
  species: 'cat',
  name: 'Mochi',
  accessory: 'bow',
  hunger: 64,
  happiness: 82,
  lastTick: new Date().toISOString(),
  log: [
    { at: daysAgo(0, 9), text: 'She fed Mochi a treat 🍪' },
    { at: daysAgo(1, 22), text: 'You played with Mochi' },
  ],
});

export const seedMilestones = () => [
  { id: 'ms1', emoji: '💬', title: 'First message', note: '“is this the right person to ask about the book?” — it was.', date: daysAgo(160), kind: 'auto' },
  { id: 'ms2', emoji: '📞', title: 'First call', note: 'Three hours. Neither of us noticed.', date: daysAgo(151), kind: 'auto' },
  { id: 'ms3', emoji: '❤️', title: 'Made it official', note: 'Day one of us.', date: daysAgo(142), kind: 'manual' },
  { id: 'ms4', emoji: '🌅', title: 'First virtual date', note: 'Sunset on two screens.', date: daysAgo(138), kind: 'auto' },
  { id: 'ms5', emoji: '🎁', title: 'First gift', note: 'A rose. Obviously.', date: daysAgo(135), kind: 'auto' },
  { id: 'ms6', emoji: '🎬', title: 'First movie', note: 'She cried first. (She will deny this.)', date: daysAgo(90), kind: 'auto' },
  { id: 'ms7', emoji: '📸', title: 'First photo on the wall', note: 'The wall has begun.', date: daysAgo(138), kind: 'auto' },
  { id: 'ms8', emoji: '💃', title: 'First dance', note: 'In the rainy window room.', date: daysAgo(64), kind: 'auto' },
];

export const seedStats = () => ({ movies: 3, dances: 2, dates: 4, hugs: 18, messagesBase: 318 });

export const seedNotifications = () => [
  { id: 'n1', type: 'checkin', title: 'She’s feeling 🥰 Loved today', body: 'Presentation went well! Also, you.', at: minutesAgo(60 * 5), read: false, link: '/dates' },
  { id: 'n2', type: 'letter', title: 'A letter is waiting', body: 'Opens tomorrow morning ☀️', at: minutesAgo(60 * 20), read: false, link: '/letters' },
  { id: 'n3', type: 'gift', title: 'She sent you a Sunflower 🌻', body: 'For the rainy week you’re having.', at: daysAgo(1, 8), read: true, link: '/gifts?tab=collection' },
  { id: 'n4', type: 'event', title: 'Tonight: Movie Night 🎬', body: '9:00 PM', at: minutesAgo(90), read: true, link: '/dates' },
];

export const seedMusic = () => ({
  playlists: [
    { id: 'our-songs', name: 'Our Songs', emoji: '💞', songIds: ['s1', 's3', 's8'] },
    { id: 'her-favs', name: 'Her Favorites', emoji: '🌷', songIds: ['s4', 's6', 's1'] },
    { id: 'my-favs', name: 'My Favorites', emoji: '🎧', songIds: ['s5', 's2'] },
    { id: 'rainy', name: 'Songs for Rainy Nights', emoji: '🌧️', songIds: ['s2', 's7', 's5'] },
  ],
  favorites: ['s1', 's3'],
  queue: ['s1', 's2', 's3', 's4', 's5', 's6', 's7', 's8'],
});
