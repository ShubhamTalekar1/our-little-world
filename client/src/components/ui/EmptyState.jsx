export default function EmptyState({ emoji = '🌙', title, children, action }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-line px-6 py-12 text-center">
      <div className="mb-3 text-4xl animate-float-slow" aria-hidden>{emoji}</div>
      <h3 className="text-lg text-cream">{title}</h3>
      {children && <p className="mt-1 max-w-sm text-sm text-muted">{children}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
