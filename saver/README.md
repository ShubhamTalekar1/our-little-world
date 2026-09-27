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

## Get the Android app

Every push that touches `saver/` builds an APK on GitHub Actions.

1. **One-time:** add the two repository secrets `SAVER_KEYSTORE_BASE64` and
   `SAVER_KEYSTORE_PASSWORD` (repo → Settings → Secrets and variables → Actions). They hold the
   app's signing key; with the same key every time, each update installs over the last one and
   keeps your saves. Without them the build still works, but it's signed with a throwaway key.
2. On GitHub go to **Actions → Saver Android app →** the latest run → **Artifacts**, download
   `Saver-android-N`, and unzip it to get `Saver.apk`. You can also trigger a build by hand
   there with **Run workflow**.
3. Open `Saver.apk` on your phone and allow "install unknown apps" when asked.

In the app:
- **Share to Saver** from any app's share sheet, whether Saver is open or not.
- **Link previews need no setup:** the app fetches pages itself, so no proxy is involved.
- Links open in an in-app browser tab, and the back button closes sheets and then goes back.

Building locally instead needs Android Studio: `npm run android` builds and opens the project.

### iPhone

`ios/` holds the Xcode project. Building it needs a Mac with Xcode (`npm run ios`) and, to keep
the app installed for longer than 7 days, a paid Apple Developer account. Receiving shares on
iOS also needs a Share Extension added in Xcode. Until then, copy a link and use **Paste**.
Without a Mac, use the web version below (Add to Home Screen).

## Run it

```bash
cd saver
npm install
npm run dev        # http://localhost:5174
npm test           # link parsing, recipe/place extraction, sorting
npm run build      # static files in dist/
```

## Or use it as a web app

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

React + Vite + Tailwind + Zustand, data in IndexedDB, and Leaflet with OpenStreetMap/CARTO maps.
The same code ships as a PWA (`vite-plugin-pwa`) and as native apps via Capacitor 8. The app's
share handling is a small plugin in `android/app/src/main/java/.../ShareIntentPlugin.java`. The parsing logic lives in `src/lib/` and has
no network or DOM dependencies beyond a `Document`, so it's unit-tested in Node.
