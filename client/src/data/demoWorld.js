// The minimum demo mode needs: two people and their starting looks.
// There is no pre-filled history — messages, memories, gifts, plans and
// everything else start empty and fill up with what you actually do.
import { AVATAR_ME, AVATAR_HER } from './defaultAvatars';

export const ME_ID = 'u_me';
export const PARTNER_ID = 'u_partner';

export const initialPeople = () => ({
  me: { id: ME_ID, name: 'You', pronouns: 'they', email: '', timezone: Intl.DateTimeFormat().resolvedOptions().timeZone },
  partner: { id: PARTNER_ID, name: 'Your person', pronouns: 'they', timezone: Intl.DateTimeFormat().resolvedOptions().timeZone },
  couple: { id: 'c_demo', name: 'Our little world', since: new Date().toISOString(), anniversary: new Date().toISOString(), inviteCode: '' },
});

export const initialAvatars = () => ({ [ME_ID]: AVATAR_ME, [PARTNER_ID]: AVATAR_HER });

/** A cozy but bare room: a lamp, a plant and fairy lights to start with. */
export const initialRoom = () => ({
  environment: 'bedroom',
  placed: [
    { uid: 'r_lamp', id: 'lamp', x: 84, y: 70 },
    { uid: 'r_plant', id: 'plant', x: 12, y: 74 },
    { uid: 'r_fairy', id: 'fairy', x: 0, y: 0 },
  ],
});
