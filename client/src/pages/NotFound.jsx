import { ButtonLink } from '../components/ui/Button';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center py-20 text-center">
      <p className="text-5xl" aria-hidden>🌙</p>
      <h1 className="mt-4 text-3xl text-cream">This corner of the world doesn’t exist (yet)</h1>
      <p className="mt-2 text-muted">Let’s go back somewhere cozy.</p>
      <ButtonLink to="/" variant="primary" className="mt-6">
        Take me home
      </ButtonLink>
    </div>
  );
}
