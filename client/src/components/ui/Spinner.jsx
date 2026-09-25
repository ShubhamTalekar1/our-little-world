export default function Spinner({ label = 'Loading' }) {
  return (
    <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted" role="status">
      <span className="relative flex h-3 w-3">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-peach/60" />
        <span className="relative inline-flex h-3 w-3 rounded-full bg-peach" />
      </span>
      {label}…
    </div>
  );
}
