import { House, UserRound, Shirt, Gift, MessageCircle, Clapperboard, Images, CalendarHeart, Mail, TreePine, Settings, Music, Video } from 'lucide-react';
import { featureState } from '../../config/features';

// `feature` ties a nav item to config/features.js.
const ALL = [
  { to: '/', label: 'Home', icon: House, end: true },
  { to: '/together/movie', label: 'Movie night', icon: Clapperboard, feature: 'movie' },
  { to: '/chat', label: 'Chat', icon: MessageCircle, feature: 'chat' },
  { to: '/together/call', label: 'Video call', icon: Video, feature: 'call' },
  { to: '/together/music', label: 'Music', icon: Music, feature: 'music' },
  { to: '/gifts', label: 'Gifts', icon: Gift, feature: 'gifts' },
  { to: '/memories', label: 'Memories', icon: Images, feature: 'memories' },
  { to: '/dates', label: 'Calendar', icon: CalendarHeart, feature: 'dates' },
  { to: '/letters', label: 'Letters', icon: Mail, feature: 'letters' },
  { to: '/avatar', label: 'Avatar', icon: UserRound, feature: 'avatar' },
  { to: '/wardrobe', label: 'Wardrobe', icon: Shirt, feature: 'wardrobe' },
  { to: '/world', label: 'Our World', icon: TreePine, feature: 'world' },
  { to: '/settings', label: 'Settings', icon: Settings },
];

export const NAV = ALL.filter((n) => featureState(n.feature) === 'enabled');
export const NAV_LOCKED = ALL.filter((n) => featureState(n.feature) === 'locked');

/** Up to four open places go in the phone tab bar; the rest live under "More". */
export const MOBILE_PRIMARY = NAV.filter((n) => n.to !== '/settings')
  .slice(0, 4)
  .map((n) => n.to);
