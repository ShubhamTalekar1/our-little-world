import { House, UserRound, Shirt, Gift, MessageCircle, Clapperboard, Images, CalendarHeart, Mail, TreePine, Settings } from 'lucide-react';

export const NAV = [
  { to: '/', label: 'Home', icon: House, end: true },
  { to: '/together', label: 'Together', icon: Clapperboard },
  { to: '/chat', label: 'Chat', icon: MessageCircle },
  { to: '/gifts', label: 'Gifts', icon: Gift },
  { to: '/memories', label: 'Memories', icon: Images },
  { to: '/dates', label: 'Dates', icon: CalendarHeart },
  { to: '/letters', label: 'Letters', icon: Mail },
  { to: '/avatar', label: 'Avatar', icon: UserRound },
  { to: '/wardrobe', label: 'Wardrobe', icon: Shirt },
  { to: '/world', label: 'Our World', icon: TreePine },
  { to: '/settings', label: 'Settings', icon: Settings },
];

export const MOBILE_PRIMARY = ['/', '/together', '/chat', '/gifts'];
