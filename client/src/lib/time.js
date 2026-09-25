const DAY = 86_400_000;

export const now = () => Date.now();
export const daysAgo = (d, hour) => {
  const t = new Date(Date.now() - d * DAY);
  if (hour !== undefined) t.setHours(hour, 0, 0, 0);
  return t.toISOString();
};
export const daysFromNow = (d, hour = null, minute = 0) => {
  const t = new Date(Date.now() + d * DAY);
  if (hour !== null) t.setHours(hour, minute, 0, 0);
  return t.toISOString();
};
export const minutesAgo = (m) => new Date(Date.now() - m * 60_000).toISOString();

export function daysBetween(a, b = Date.now()) {
  const start = new Date(a);
  start.setHours(0, 0, 0, 0);
  const end = new Date(b);
  end.setHours(0, 0, 0, 0);
  return Math.round((end - start) / DAY);
}

export function countdownParts(target, from = Date.now()) {
  let ms = Math.max(0, new Date(target) - from);
  const days = Math.floor(ms / DAY);
  ms -= days * DAY;
  const hours = Math.floor(ms / 3_600_000);
  ms -= hours * 3_600_000;
  const minutes = Math.floor(ms / 60_000);
  ms -= minutes * 60_000;
  const seconds = Math.floor(ms / 1000);
  return { days, hours, minutes, seconds, done: new Date(target) <= from };
}

export function timeAgo(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 45_000) return 'just now';
  const m = Math.round(diff / 60_000);
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.round(h / 24);
  if (d === 1) return 'yesterday';
  if (d < 7) return `${d} days ago`;
  return formatDate(iso);
}

export const formatDate = (iso, opts = { month: 'long', day: 'numeric' }) =>
  new Date(iso).toLocaleDateString(undefined, opts);

export const formatTime = (iso) =>
  new Date(iso).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });

export function dayLabel(iso) {
  const d = daysBetween(Date.now(), iso);
  if (d === 0) return 'Today';
  if (d === 1) return 'Tomorrow';
  if (d === -1) return 'Yesterday';
  if (d > 1 && d < 7) return new Date(iso).toLocaleDateString(undefined, { weekday: 'long' });
  return formatDate(iso);
}

export const isSameDay = (a, b) => daysBetween(a, b) === 0;

export function partOfDay(date = new Date()) {
  const h = date.getHours();
  if (h < 5) return 'night';
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  if (h < 21) return 'evening';
  return 'night';
}
