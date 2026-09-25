import { Lock } from 'lucide-react';
import { featureState, FEATURES } from '../../config/features';
import { ButtonLink } from '../ui/Button';

/** Renders children only when the feature is open in this world. */
export default function FeatureGate({ name, children }) {
  const state = featureState(name);
  if (state === 'enabled') return children;
  const hidden = state === 'hidden';
  return (
    <div className="flex flex-col items-center py-20 text-center">
      <span className="grid h-16 w-16 place-items-center rounded-3xl bg-surface-2 ring-1 ring-line" aria-hidden>
        <Lock className="h-7 w-7 text-muted" />
      </span>
      <h1 className="mt-5 text-3xl text-cream">{hidden ? 'Nothing here' : `${FEATURES[name] ?? 'This'} isn’t open yet`}</h1>
      <p className="mt-2 max-w-sm text-muted">{hidden ? 'This corner of the world doesn’t exist.' : 'It’s coming later. For now there’s chat and movie nights.'}</p>
      <div className="mt-6 flex gap-2">
        <ButtonLink to="/chat">Chat</ButtonLink>
        <ButtonLink to="/together/movie" variant="primary">
          Movie night 🎬
        </ButtonLink>
      </div>
    </div>
  );
}
