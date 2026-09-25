import { Component } from 'react';

/** Last line of defence: a friendly page instead of a blank screen. */
export default class ErrorBoundary extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    // eslint-disable-next-line no-console
    console.error('Our Little World crashed:', error, info?.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <main className="grid min-h-dvh place-items-center bg-ink p-6 text-center text-cream">
        <div className="max-w-sm">
          <p className="text-4xl" aria-hidden>
            🌙
          </p>
          <h1 className="mt-3 font-display text-2xl">Something tripped over the rug.</h1>
          <p className="mt-2 text-sm text-muted">Nothing you did — a reload usually fixes it. Your messages are safe.</p>
          <button type="button" onClick={() => window.location.reload()} className="mt-5 rounded-full bg-peach px-5 py-2.5 text-sm font-medium text-ink">
            Reload
          </button>
        </div>
      </main>
    );
  }
}
