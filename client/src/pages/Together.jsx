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

  return (
    <div>
      <PageHeader eyebrow="Together" title="Spend time together" subtitle="Pick something. The best part is who it’s with." />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <ActivityCard
          index={0}
          emoji="🎬"
          title="Movie Night"
          subtitle="Synced playback, reactions and little video bubbles."
          status={is('movie') ? `${w.Theyre} waiting for you 🍿` : nextMovie ? `${dayLabel(nextMovie.at)} · ${formatTime(nextMovie.at)}` : 'Pick a film'}
          tone="sky"
          onClick={() => go('movie', '/together/movie')}
        />
        <ActivityCard index={1} emoji="💃" title="Slow Dance" subtitle="Warm light, one song, no audience." status={is('dance') ? `${w.Theyre} on the dance floor` : `Ask ${w.them}`} tone="peach" onClick={() => go('dance', '/together/dance')} />
        <ActivityCard index={2} emoji="❤️" title="Come sit with me" subtitle="Video call on the couch. Camera optional." status={callStatus !== 'idle' ? 'You’re on a call' : is('call') ? `${w.Theyre} on the couch` : 'Camera · mic · screen share'} tone="rose" onClick={() => go('call', '/together/call')} />
        <ActivityCard index={3} emoji="🌃" title="Date Night" subtitle="Plan the place, the music and the dress code." status="Rooftop, beach, café…" tone="lavender" to="/date-night" />
        <ActivityCard index={4} emoji="🎶" title="Music Room" subtitle="Shared playback of songs that feel like you two." status={is('music') ? `${w.Theyre} listening` : 'Our Songs · Rainy Nights'} tone="lamp" onClick={() => go('music', '/together/music')} />
        <ActivityCard index={5} emoji="🌳" title="Our World" subtitle="Decorate the room, look after the pet." status={petName ? `${petName} misses you` : 'Adopt a little companion'} tone="sage" to="/world" />
      </div>
      <div className="mt-8">
        <p className="eyebrow mb-3">Now playing</p>
        <MiniPlayer />
      </div>
    </div>
  );
}
