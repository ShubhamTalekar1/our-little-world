# Saver 🔖

A personal "save it for later, then actually do it" app, in the spirit of
[Albo](https://albo.inc/). It's separate from Our Little World and
runs entirely on your device: no account, no server, no tracking.

- **Save anything.** Paste a link or a note, or on Android share straight to Saver from any app.
- **Smart collections.** Links are sorted into Recipes, Places, Videos, Books, Reads, Workouts,
  Music and Shopping automatically. You can also make your own collections (e.g. "Goa trip").
- **Recipe extraction.** Ingredients (with tick-boxes), method, time and servings are pulled from
  recipe pages. Cooking videos go in Recipes, where you can add the recipe yourself.
- **Map of places.** Google/Apple Maps links, restaurant and hotel pages become pins. Anything
  else can be found by name or address.
- **To-do → done.** Mark things done ("Cooked it", "Been there"), rate them and note how it went.
  The Done tab keeps the history.
- Search across titles, notes, tags and ingredients; automatic tags like `#quick` or `#vegan`;
  JSON backup and restore; dark mode; works offline once installed.

## Run it

```bash
cd saver
npm install
npm run dev        # http://localhost:5174
npm test           # link parsing, recipe/place extraction, sorting
npm run build      # static files in dist/
```

## Put it on your phone

`dist/` is a static site, so any static host works: Netlify Drop, Cloudflare Pages, GitHub
Pages or Vercel. It needs HTTPS to install. Then:

- **Android (Chrome):** ⋮ → *Install app*. Saver then shows up in the share sheet.
- **iPhone (Safari):** Share → *Add to Home Screen*. iOS doesn't let web apps receive shares,
  so copy the link and tap *Paste* in the + sheet.

Your saves live in that browser's storage on that device. Use **Settings → Export backup** now and
then, and to move phones.

## Link previews

Browsers can't read other sites' HTML directly, so pages are fetched through a proxy. Saver falls
back to free public proxies, which are slow and sometimes blocked. For reliable previews, deploy
the tiny Cloudflare Worker in [`worker/`](worker/README.md) (free, about 5 minutes) and paste its URL in
Settings. Video titles come from noembed.com, and place search uses OpenStreetMap's Nominatim.

## How it's built

React + Vite + Tailwind + Zustand, data in IndexedDB, Leaflet + OpenStreetMap for maps, and
`vite-plugin-pwa` for install/offline/share-target. The parsing logic lives in `src/lib/` and has
no network or DOM dependencies beyond a `Document`, so it's unit-tested in Node.
