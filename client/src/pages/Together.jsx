import { useNavigate } from 'react-router-dom';
import PageHeader from '../components/ui/PageHeader';
import ActivityCard from '../components/activities/ActivityCard';
import MiniPlayer from '../components/music/MiniPlayer';
import { usePresenceStore } from '../stores/presenceStore';
import { useActivityStore } from '../stores/activityStore';
import { useCalendarStore } from '../stores/calendarStore';
import { useCallStore } from '../stores/callStore';
import { usePetStore } from '../stores/petStore';
import { usePartnerWords } from '../lib/words';
import { dayLabel, formatTime } from '../lib/time';
import { FRIENDS, featureState, isEnabled } from '../config/features';
import { Lock } from 'lucide-react';

export default function Together() {
  const partner = usePresenceStore((s) => s.partner);
  const invite = useActivityStore((s) => s.invite);
  const events = useCalendarStore((s) => s.events);
  const callStatus = useCallStore((s) => s.status);
  const petName = usePetStore((s) => (s.pet.adopted ? s.pet.name : null));
  const navigate = useNavigate();
  const w = usePartnerWords();
  const online = partner.status !== 'offline';
  const is = (t) => online && partner.activity?.type === t;
  const nextMovie = events.filter((e) => e.type === 'movie' && new Date(e.at) > Date.now() - 3600_000).sort((a, b) => new Date(a.at) - new Date(b.at))[0];

  const go = (type, path) => {
    if (online && !is(type)) invite(type);
    navigate(path);
  };

  const cards = [
    { feature: 'movie', emoji: '🎬', title: 'Movie Night', subtitle: 'Synced playback and reactions, like sitting on the same couch.', status: is('movie') ? `${w.Theyre} waiting for you 🍿` : nextMovie ? `${dayLabel(nextMovie.at)} · ${formatTime(nextMovie.at)}` : 'Pick a film', tone: 'sky', onClick: () => go('movie', '/together/movie') },
    { feature: 'dance', emoji: '💃', title: 'Slow Dance', subtitle: 'Warm light, one song, no audience.', status: is('dance') ? `${w.Theyre} on the dance floor` : `Ask ${w.them}`, tone: 'peach', onClick: () => go('dance', '/together/dance') },
    { feature: 'call', emoji: FRIENDS ? '📹' : '❤️', title: FRIENDS ? 'Video call' : 'Come sit with me', subtitle: 'Camera optional.', status: callStatus !== 'idle' ? 'You’re on a call' : 'Camera · mic · screen share', tone: 'rose', onClick: () => go('call', '/together/call') },
    { feature: 'date', emoji: '🌃', title: 'Date Night', subtitle: 'Plan the place, the music and the dress code.', status: 'Rooftop, beach, café…', tone: 'lavender', to: '/date-night' },
    { feature: 'music', emoji: '🎶', title: 'Music Room', subtitle: 'Shared playback, same song at the same time.', status: is('music') ? `${w.Theyre} listening` : 'Put something on', tone: 'lamp', onClick: () => go('music', '/together/music') },
    { feature: 'world', emoji: '🌳', title: 'Our World', subtitle: 'Decorate the room, look after the pet.', status: petName ? `${petName} misses you` : 'Adopt a little companion', tone: 'sage', to: '/world' },
  ].filter((c) => featureState(c.feature) !== 'hidden');

  return (
    <div>
      <PageHeader eyebrow="Together" title="Spend time together" subtitle="Pick something to do." />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map(({ feature, ...c }, i) =>
          isEnabled(feature) ? (
            <ActivityCard key={feature} index={i} {...c} />
          ) : (
            <div key={feature} className="rounded-3xl border border-dashed border-line p-5 opacity-60" aria-disabled="true">
              <span className="text-3xl grayscale" aria-hidden>{c.emoji}</span>
              <p className="mt-4 font-display text-lg text-cream-dim">{c.title}</p>
              <p className="mt-1 flex items-center gap-1.5 text-[13px] text-faint">
                <Lock className="h-3.5 w-3.5" aria-hidden /> Coming later
              </p>
            </div>
          ),
        )}
      </div>
      {isEnabled('music') && (
        <div className="mt-8">
          <p className="eyebrow mb-3">Now playing</p>
          <MiniPlayer />
        </div>
      )}
    </div>
  );
}
