import { ENV_BY_ID } from '../catalog/environments';
import { timeAgo } from './time';

export function presenceLabel(presence, w) {
  if (!presence || presence.status === 'offline') return `${w.Subject} ${w.plural ? 'were' : 'was'} here ${timeAgo(presence?.lastSeen ?? Date.now())}`;
  if (presence.status === 'away') return `${w.Theyre} away for a bit`;
  const a = presence.activity ?? { type: 'room' };
  switch (a.type) {
    case 'room':
      if (a.detail && a.detail !== 'bedroom') return `${w.Theyre} ${ENV_BY_ID[a.detail]?.presence ?? 'somewhere nice'} ${ENV_BY_ID[a.detail]?.emoji ?? ''}`;
      return `${w.Theyre} here with you 🤍`;
    case 'movie':
      return `${w.Theyre} watching a movie 🎬`;
    case 'dance':
      return `${w.Theyre} dancing 💃`;
    case 'avatar':
      return `${w.Theyre} customizing ${w.their} outfit 👗`;
    case 'music':
      return `${w.Theyre} listening to music 🎶`;
    case 'memories':
      return `${w.Theyre} looking at your memories 📸`;
    case 'letters':
      return `${w.Theyre} writing something… 💌`;
    case 'chat':
      return `${w.Theyre} in the chat 💬`;
    case 'date':
      return `${w.Theyre} on a date with you 🌃`;
    case 'call':
      return `${w.Theyre} sitting with you ❤️`;
    case 'gifts':
      return `${w.Theyre} up to something 🎁`;
    default:
      return `${w.Theyre} online`;
  }
}

export const ROUTE_ACTIVITY = [
  ['/together/movie', { type: 'movie' }],
  ['/together/dance', { type: 'dance' }],
  ['/together/music', { type: 'music' }],
  ['/together/call', { type: 'call' }],
  ['/date-night', { type: 'date' }],
  ['/avatar', { type: 'avatar' }],
  ['/wardrobe', { type: 'avatar' }],
  ['/memories', { type: 'memories' }],
  ['/letters', { type: 'letters' }],
  ['/chat', { type: 'chat' }],
  ['/gifts', { type: 'gifts' }],
];
