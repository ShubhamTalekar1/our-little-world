import { useEffect, useMemo, useSyncExternalStore } from 'react';
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Link } from 'react-router-dom';
import { kindInfo } from '../lib/classify.js';

const darkQuery = window.matchMedia('(prefers-color-scheme: dark)');
const useDarkMode = () =>
  useSyncExternalStore(
    (cb) => (darkQuery.addEventListener('change', cb), () => darkQuery.removeEventListener('change', cb)),
    () => darkQuery.matches
  );

const iconCache = new Map();
function pinIcon(kind, done) {
  const key = `${kind}-${done}`;
  if (!iconCache.has(key)) {
    const k = kindInfo(kind);
    iconCache.set(
      key,
      L.divIcon({
        className: '',
        html: `<div class="pin" style="background:${done ? '#3d8b6d' : k.color}"><span>${done ? '✓' : k.emoji}</span></div>`,
        iconSize: [34, 34],
        iconAnchor: [4, 34],
        popupAnchor: [13, -30],
      })
    );
  }
  return iconCache.get(key);
}

function FitBounds({ points }) {
  const map = useMap();
  const key = points.map((p) => `${p.lat},${p.lng}`).join('|');
  useEffect(() => {
    if (!points.length) return;
    if (points.length === 1) map.setView([points[0].lat, points[0].lng], 14);
    else map.fitBounds(L.latLngBounds(points.map((p) => [p.lat, p.lng])), { padding: [40, 40], maxZoom: 15 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, map]);
  return null;
}

/** items: saves that have place.lat/lng. `interactive` adds popups linking to each save. */
export default function PlaceMap({ items, className = '', interactive = true }) {
  const points = useMemo(
    () => items.filter((i) => i.place?.lat != null).map((i) => ({ ...i.place, item: i })),
    [items]
  );
  const dark = useDarkMode();
  const center = points[0] ? [points[0].lat, points[0].lng] : [20, 0];
  return (
    <MapContainer
      center={center}
      zoom={points.length ? 13 : 2}
      scrollWheelZoom={interactive}
      dragging={interactive || !L.Browser.mobile}
      className={className}
      attributionControl
    >
      <TileLayer
        key={dark ? 'dark' : 'light'}
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
        url={`https://{s}.basemaps.cartocdn.com/${dark ? 'dark_all' : 'rastertiles/voyager'}/{z}/{x}/{y}{r}.png`}
        subdomains="abcd"
        maxZoom={19}
      />
      {points.map((p) => (
        <Marker key={p.item.id} position={[p.lat, p.lng]} icon={pinIcon(p.item.kind, p.item.status === 'done')}>
          {interactive && (
            <Popup>
              <Link to={`/item/${p.item.id}`} className="block max-w-[200px]">
                <strong className="block text-[13px] leading-snug">{p.item.title || p.name}</strong>
                {p.address && <span className="mt-0.5 block text-[11px] opacity-70">{p.address}</span>}
              </Link>
            </Popup>
          )}
        </Marker>
      ))}
      <FitBounds points={points} />
    </MapContainer>
  );
}
