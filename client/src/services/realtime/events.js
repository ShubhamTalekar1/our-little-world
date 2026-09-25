// The realtime contract shared by the client, the demo partner and the
// server (server/src/realtime/events.js mirrors this list).
export const EV = {
  USER_ONLINE: 'user:online',
  USER_OFFLINE: 'user:offline',
  PRESENCE_UPDATE: 'presence:update',

  GIFT_SENT: 'gift:sent',
  GIFT_RECEIVED: 'gift:received',
  GIFT_OPENED: 'gift:opened',

  ACTIVITY_INVITE: 'activity:invite',
  ACTIVITY_ACCEPTED: 'activity:accepted',
  ACTIVITY_DECLINED: 'activity:declined',
  ACTIVITY_LEAVE: 'activity:leave',

  MOVIE_LOAD: 'movie:load',
  MOVIE_PLAY: 'movie:play',
  MOVIE_PAUSE: 'movie:pause',
  MOVIE_SEEK: 'movie:seek',
  MOVIE_STATE: 'movie:state',
  MOVIE_REACTION: 'movie:reaction',
  CALL_REACTION: 'call:reaction',

  MUSIC_PLAY: 'music:play',
  MUSIC_PAUSE: 'music:pause',
  MUSIC_TRACK: 'music:track',

  DANCE_START: 'dance:start',
  DANCE_STOP: 'dance:stop',

  INTERACTION: 'interaction', // payload.type = hug | kiss | wave | love | highfive | pat
  ROOM_UPDATE: 'room:update',
  AVATAR_UPDATE: 'avatar:update',

  CHAT_MESSAGE: 'chat:message',
  CHAT_TYPING: 'chat:typing',
  CHAT_READ: 'chat:read',
  CHAT_REACTION: 'chat:reaction',

  LETTER_SENT: 'letter:sent',
  MEMORY_ADDED: 'memory:added',
  MEMORY_REACTION: 'memory:reaction',
  CHECKIN_NEW: 'checkin:new',
  EVENT_CREATED: 'event:created',
  PET_UPDATE: 'pet:update',

  RTC_CALL: 'rtc:call',
  RTC_ACCEPT: 'rtc:accept',
  RTC_END: 'rtc:end',
  RTC_OFFER: 'rtc:offer',
  RTC_ANSWER: 'rtc:answer',
  RTC_ICE: 'rtc:ice',
};

/** Spec-style names for interactions, e.g. interaction:hug. */
export const interactionEvent = (type) => `interaction:${type}`;
