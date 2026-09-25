import { EV } from './events';
import { PARTNER_ID } from '../../data/mockData';
import { GIFTS, GIFT_MESSAGES } from '../../catalog/gifts';
import { useSettingsStore } from '../../stores/settingsStore';
import { uid } from '../../lib/id';

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

const REPLIES = [
  [/love|miss/i, ['I miss you more. It’s not a competition but I’m winning 🥹', 'love you, you big softie', 'come here 🤍', 'missing you is my full-time job now']],
  [/movie|film|watch/i, ['yes!! I’ll get comfy, give me two minutes 🍿', 'only if you don’t talk during the good parts', 'movie night is my favourite night']],
  [/dance/i, ['you can’t dance. I love that you try', 'okay but slow song only 💃']],
  [/sleep|tired|night/i, ['go to sleep, I’ll be here in the morning 🌙', 'stay on call till you fall asleep?', 'sleepy you is my favourite you']],
  [/morning|coffee/i, ['good morning sunshine ☀️', 'coffee first, feelings second']],
  [/food|eat|dinner|lunch/i, ['did you actually eat or did you just have coffee', 'I made pasta and thought of you 🍝']],
  [/\?$/, ['hmm… yes. definitely yes', 'ask me again on call', 'depends. are you being cute about it?']],
  [/haha|lol|😂/i, ['😂😂', 'stop I’m laughing in public']],
];
const DEFAULT_REPLIES = [
  'tell me more 🤍',
  'this is why I like you',
  'you’re very distracting, you know that',
  'smiling at my phone like an idiot',
  'hehe',
  'okay but when can I see your face',
];

const ACTIVITIES = [
  { type: 'room' },
  { type: 'room' },
  { type: 'avatar' },
  { type: 'music' },
  { type: 'memories' },
  { type: 'room', detail: 'rooftop' },
  { type: 'letters' },
];

/**
 * A believable stand-in for the other person in demo mode. Reacts to what
 * you do (replies, reciprocates hugs, accepts invitations, follows the movie)
 * and occasionally does small things on their own.
 */
export class DemoPartner {
  constructor(deliver) {
    this.deliver = (event, payload = {}) => deliver(event, { from: PARTNER_ID, ...payload });
    this.timers = [];
    this.inCall = false;
  }

  get spontaneous() {
    return useSettingsStore.getState().simulatePartner;
  }

  schedule(ms, fn) {
    this.timers.push(setTimeout(fn, ms));
  }

  start() {
    // She arrives shortly after you do.
    this.schedule(1800, () => this.deliver(EV.USER_ONLINE, { activity: { type: 'room' } }));
    // A little welcome gift so the gift-opening moment happens early.
    this.schedule(16000, () => {
      if (!this.spontaneous) return;
      this.sendGift(pick(['rose', 'tulip', 'coffee', 'stars', 'mystery']));
    });
    this.schedule(45000, () => this.spontaneous && this.deliver(EV.INTERACTION, { type: pick(['wave', 'love']) }));
    // Drift between activities now and then.
    this.presenceLoop = setInterval(() => {
      if (!this.spontaneous || this.inCall) return;
      const r = Math.random();
      if (r < 0.12) this.deliver(EV.PRESENCE_UPDATE, { status: 'away', activity: null });
      else this.deliver(EV.PRESENCE_UPDATE, { status: 'online', activity: pick(ACTIVITIES) });
    }, 70000);
    // Occasional unprompted affection.
    this.affectionLoop = setInterval(() => {
      if (!this.spontaneous) return;
      const r = Math.random();
      if (r < 0.35) this.deliver(EV.INTERACTION, { type: pick(['love', 'wave', 'kiss', 'hug']) });
      else if (r < 0.5) this.say(pick(['thinking about you', 'what are you doing rn', 'hi 🤍', 'I just looked at our memory wall again']));
      else if (r < 0.58) this.sendGift(pick(['heart', 'coffee', 'tulip', 'letter', 'chocolate']));
    }, 150000);
  }

  stop() {
    this.timers.forEach(clearTimeout);
    clearInterval(this.presenceLoop);
    clearInterval(this.affectionLoop);
  }

  say(text, delay = 0) {
    this.schedule(delay, () => {
      this.deliver(EV.CHAT_TYPING, { typing: true });
      this.schedule(900 + text.length * 35, () => {
        this.deliver(EV.CHAT_MESSAGE, { message: { id: uid('msg'), from: PARTNER_ID, type: 'text', text, at: new Date().toISOString(), reactions: {} } });
      });
    });
  }

  sendGift(giftId, message) {
    const gift = GIFTS.find((g) => g.id === giftId) ?? GIFTS[0];
    this.deliver(EV.GIFT_RECEIVED, { id: uid('g'), giftId: gift.id, message: message ?? pick(GIFT_MESSAGES), at: new Date().toISOString() });
  }

  receive(event, payload) {
    switch (event) {
      case EV.CHAT_MESSAGE: {
        this.schedule(700, () => this.deliver(EV.CHAT_READ, { at: new Date().toISOString() }));
        const text = payload.message?.text ?? '';
        if (payload.message?.type === 'image') return this.say(pick(['omg look at you 🥹', 'saving this forever', 'wait send more']), 1200);
        if (payload.message?.type === 'voice') return this.say(pick(['your voice 🥹', 'play that again (I did, 4 times)']), 1400);
        if (Math.random() < 0.3) this.schedule(1500, () => this.deliver(EV.CHAT_REACTION, { id: payload.message.id, emoji: pick(['❤️', '🥰', '😂']) }));
        const match = REPLIES.find(([re]) => re.test(text));
        this.say(pick(match ? match[1] : DEFAULT_REPLIES), 1200 + Math.random() * 1500);
        break;
      }
      case EV.GIFT_SENT: {
        this.schedule(3500, () => {
          this.deliver(EV.GIFT_OPENED, { id: payload.id });
          this.say(pick(['you did NOT 🥹', 'okay I’m blushing', 'I’m keeping this forever', 'you’re too much. never stop']));
        });
        this.schedule(6500, () => this.deliver(EV.INTERACTION, { type: pick(['kiss', 'love', 'hug']) }));
        break;
      }
      case EV.INTERACTION: {
        const back = { hug: 'hug', kiss: 'kiss', wave: 'wave', love: 'love', highfive: 'highfive', pat: 'love' }[payload.type];
        if (back && Math.random() < 0.8) this.schedule(3600 + Math.random() * 1500, () => this.deliver(EV.INTERACTION, { type: back }));
        break;
      }
      case EV.ACTIVITY_INVITE: {
        const accept = Math.random() < 0.92;
        this.schedule(2200 + Math.random() * 1800, () => {
          this.deliver(accept ? EV.ACTIVITY_ACCEPTED : EV.ACTIVITY_DECLINED, { id: payload.id, type: payload.type });
          if (accept) {
            const activity = { movie: { type: 'movie' }, dance: { type: 'dance' }, date: { type: 'date' }, call: { type: 'call' }, music: { type: 'music' } }[payload.type];
            this.deliver(EV.PRESENCE_UPDATE, { status: 'online', activity });
          } else {
            this.say('give me 10 minutes? I’m just finishing something 🤍', 600);
          }
        });
        break;
      }
      case EV.RTC_CALL: {
        this.schedule(2000, () => {
          this.inCall = true;
          this.deliver(EV.RTC_ACCEPT, {});
        });
        break;
      }
      case EV.CALL_REACTION:
        if (Math.random() < 0.5) this.schedule(900 + Math.random() * 900, () => this.deliver(EV.CALL_REACTION, { emoji: pick(['❤️', '😂', '🥹']) }));
        break;
      case EV.MOVIE_LOAD:
        this.say(pick(['ooh good choice', 'I’ve wanted to see this!', 'okay getting blanket']), 1500);
        break;
      case EV.RTC_END:
        this.inCall = false;
        break;
      case EV.MOVIE_PLAY:
        if (Math.random() < 0.35) this.schedule(8000 + Math.random() * 10000, () => this.deliver(EV.MOVIE_REACTION, { emoji: pick(['😂', '🥹', '😮', '❤️', '🍿']) }));
        break;
      case EV.MOVIE_PAUSE:
        if (Math.random() < 0.3) this.say(pick(['bathroom break?', 'noooo it was getting good', 'snack run?']), 1200);
        break;
      case EV.DANCE_START:
        this.deliver(EV.PRESENCE_UPDATE, { status: 'online', activity: { type: 'dance' } });
        break;
      case EV.LETTER_SENT:
        this.say(pick(['a LETTER? for me?', 'I’m going to read this slowly', 'you and your letters 🥹']), 2500);
        break;
      case EV.MEMORY_ADDED:
        this.schedule(3000, () => this.deliver(EV.MEMORY_REACTION, { id: payload.memory?.id, emoji: pick(['🥹', '❤️', '✨']) }));
        break;
      case EV.CHECKIN_NEW:
        if (['sad', 'tired'].includes(payload.checkin?.mood)) this.say(pick(['hey. want to talk? 🤍', 'sending you the biggest hug', 'call me when you can']), 2500);
        else if (['happy', 'loved', 'excited'].includes(payload.checkin?.mood)) this.say(pick(['love that for you!!', 'tell me everything']), 2500);
        break;
      case EV.AVATAR_UPDATE:
        if (Math.random() < 0.25) this.say(pick(['wait new outfit?? cute', 'who gave you permission to look that good']), 3000);
        break;
      default:
        break;
    }
  }
}
