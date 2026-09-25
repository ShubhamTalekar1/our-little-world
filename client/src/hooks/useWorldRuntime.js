import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { DEMO_MODE } from '../config/env';
import { realtime } from '../services/realtime';
import { EV } from '../services/realtime/events';
import { useSettingsStore } from '../stores/settingsStore';
import { bindRealtime } from '../services/realtime/bindings';
import { hydrateFromApi } from '../services/api/bootstrap';
import { setRemoteErrorHandler } from '../services/api/client';
import { useAuthStore } from '../stores/authStore';
import { usePresenceStore } from '../stores/presenceStore';
import { useCalendarStore } from '../stores/calendarStore';
import { useLetterStore, isUnlocked } from '../stores/letterStore';
import { useNotificationStore } from '../stores/notificationStore';
import { usePetStore } from '../stores/petStore';
import { useRoomStore } from '../stores/roomStore';
import { useUiStore, toast } from '../stores/uiStore';
import { useAchievementSnapshot } from './useAchievements';
import { ACHIEVEMENTS } from '../catalog/achievements';
import { useStoryStore } from '../stores/storyStore';
import { ROUTE_ACTIVITY } from '../lib/presence';
import { playSfx } from '../services/audio/sfx';
import { loadIceServers } from '../services/rtc/peer';

/** Everything that keeps the world alive while you're inside it. */
export function useWorldRuntime() {
  const status = useAuthStore((s) => s.status);
  const token = useAuthStore((s) => s.token);
  const location = useLocation();

  // Connect realtime + hydrate
  useEffect(() => {
    if (status !== 'ready') return;
    setRemoteErrorHandler((err) => toast(err.message || 'Couldn’t save that — try again?', { emoji: '☁️', tone: 'error' }));
    const unbind = bindRealtime();
    let cancelled = false;
    (async () => {
      if (!DEMO_MODE) {
        try {
          await hydrateFromApi();
        } catch (e) {
          if (e.status === 401) useAuthStore.getState().logout();
          else toast('Couldn’t reach our world. Retrying soon…', { emoji: '☁️', tone: 'error' });
          return;
        }
      }
      if (cancelled) return;
      loadIceServers();
      realtime.connect({ token });
    })();
    // After a dropped connection (phone asleep, wifi blip), catch up on anything missed.
    let connects = 0;
    const offOk = realtime.on('connection:ok', () => {
      connects += 1;
      // Anything said before the socket was up (like "I'm at movie night") was dropped: say it again.
      const { activity } = usePresenceStore.getState().me;
      const share = useSettingsStore.getState().privacy.showActivity;
      realtime.emit(EV.PRESENCE_UPDATE, { status: 'online', activity: share ? activity : null });
      if (connects > 1 && !DEMO_MODE) hydrateFromApi().catch(() => {});
    });
    return () => {
      cancelled = true;
      offOk();
      unbind();
      realtime.disconnect();
    };
  }, [status, token]);

  // Tell the other person what I'm up to, based on where I am.
  useEffect(() => {
    if (status !== 'ready') return;
    const match = ROUTE_ACTIVITY.find(([p]) => location.pathname.startsWith(p));
    const activity = match ? match[1] : { type: 'room', detail: useRoomStore.getState().environment };
    const t = setTimeout(() => usePresenceStore.getState().setMyActivity(activity), 400);
    return () => clearTimeout(t);
  }, [location.pathname, status]);

  // Reminders, unlocked letters, pet decay — a gentle 30s heartbeat.
  useEffect(() => {
    if (status !== 'ready') return;
    const beat = () => {
      const now = Date.now();
      const cal = useCalendarStore.getState();
      cal.events.forEach((e) => {
        const at = new Date(e.at).getTime();
        const remindAt = at - (e.reminder ?? 15) * 60_000;
        if (now >= remindAt && now < at && !cal.remindersFired.includes(e.id)) {
          cal.markReminderFired(e.id);
          useNotificationStore.getState().push({ type: 'event', title: `Soon: ${e.title} ${e.emoji ?? ''}`, body: new Date(e.at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }), link: '/dates' });
          toast(`${e.title} starts soon`, { emoji: e.emoji ?? '⏰' });
          playSfx('notification');
        }
      });
      const notifs = useNotificationStore.getState();
      useLetterStore.getState().letters.forEach((l) => {
        const key = `letter-unlocked-${l.id}`;
        if (!l.openedAt && isUnlocked(l) && !notifs.items.some((n) => n.key === key) && !localStorage.getItem(`olw:${key}`)) {
          localStorage.setItem(`olw:${key}`, '1');
          notifs.push({ key, type: 'letter', title: 'A letter just unlocked 💌', body: l.title, link: '/letters' });
        }
      });
      usePetStore.getState().tick();
    };
    beat();
    const t = setInterval(beat, 30_000);
    return () => clearInterval(t);
  }, [status]);

  // Achievements: first pass marks silently; later unlocks celebrate.
  const snapshot = useAchievementSnapshot();
  const primed = useRef(false);
  useEffect(() => {
    if (status !== 'ready') return;
    const story = useStoryStore.getState();
    ACHIEVEMENTS.forEach((a) => {
      if (!story.unlocked[a.id] && a.check(snapshot)) {
        story.markUnlocked(a.id);
        if (primed.current) {
          useNotificationStore.getState().push({ type: 'achievement', title: `${a.emoji} ${a.name}`, body: a.note, link: '/world?tab=keepsakes' });
          useUiStore.getState().toast(`New keepsake: ${a.name}`, { emoji: a.emoji });
        }
      }
    });
    primed.current = true;
  }, [snapshot, status]);
}
