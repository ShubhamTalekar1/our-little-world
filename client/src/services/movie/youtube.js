let apiPromise = null;

/** Lazily load the YouTube IFrame API (only when someone uses a YouTube link). */
export function loadYouTubeApi() {
  if (window.YT?.Player) return Promise.resolve(window.YT);
  if (apiPromise) return apiPromise;
  apiPromise = new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = 'https://www.youtube.com/iframe_api';
    s.onerror = () => reject(new Error('YouTube could not be loaded'));
    window.onYouTubeIframeAPIReady = () => resolve(window.YT);
    document.head.appendChild(s);
  });
  return apiPromise;
}

export function parseYouTubeId(url) {
  try {
    const u = new URL(url);
    if (u.hostname.includes('youtu.be')) return u.pathname.slice(1) || null;
    if (u.hostname.includes('youtube.com')) return u.searchParams.get('v') || u.pathname.split('/').filter(Boolean).pop() || null;
  } catch {
    return /^[\w-]{11}$/.test(url) ? url : null;
  }
  return null;
}
