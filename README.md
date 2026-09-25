# Our Little World 🌙

> Even when we're far apart, we can open this little world and spend time together.

A private virtual world for two people: avatars, a shared cozy room, gifts, movie nights, slow dances, letters that unlock later, a memory wall, a shared pet, and a lot of small gestures in between.

```
client/   React + Vite + Tailwind + Zustand + Framer Motion  (deploy anywhere static)
server/   Node + Express + Socket.IO + Prisma/PostgreSQL + Redis  (deploy separately)
```

---

## Quick start — demo mode (no setup)

```bash
npm run setup      # installs client + server deps
npm run dev        # http://localhost:5173
```

Demo mode (`VITE_DEMO_MODE=true`, the default) runs **entirely in the browser**. You don't need Postgres, Redis, a TURN server or API keys. A simulated partner:

- comes online, drifts between rooms ("She's customizing her outfit 👗")
- replies to messages (with typing indicator and read receipts)
- sends you a gift shortly after you arrive, so you see the opening animation
- hugs and waves back, accepts movie/dance/date invitations, reacts during films

It starts empty — no fake history — and everything you do is saved in `localStorage`. **Settings → Couple** has "Reset demo world" and a switch to turn the simulated partner's spontaneous activity off.

## Running with the real backend

```bash
npm run db:up                         # Postgres + Redis via docker compose
cp server/.env.example server/.env    # set JWT_SECRET
npm run db:migrate
npm run server                        # http://localhost:4000

# in client/.env
VITE_DEMO_MODE=false
npm run dev                           # Vite proxies /api and /socket.io to :4000
```

The first person signs up at `/welcome` and gets a single-use invite code (`HI-7K4P`, or `LOVE-7K4P` with `RELATIONSHIP=couple`) and a private link. The second person uses `/join` with it. A world holds exactly two people.

Run the API tests (they need a disposable database in `DATABASE_URL`):

```bash
npm test
```

---

## Deploying it for real

The production setup is **one container**: the Node server serves the API, the realtime socket and the built web app from the same origin, so cookies and websockets just work. You also need PostgreSQL (Redis is optional).

### What's open right now

Only **chat** and **movie night** are open; everything else shows as "coming later" with a lock, and anything romantic (slow dance, date night, letters, gifts, kisses, "our story") is hidden entirely. The server enforces the same locks (locked APIs return 403).

| Setting | Web app (build time) | Server (run time) | Default |
| --- | --- | --- | --- |
| What's open | `VITE_FEATURES` | `ENABLED_FEATURES` | `chat,movie` |
| Friends or couple | `VITE_RELATIONSHIP` | `RELATIONSHIP` | `friends` |

Feature names: `chat, movie, call, music, gifts, memories, dates, letters, avatar, wardrobe, world, dance, date, story`, or `all`. Keep both sides in sync. With `friends`, the romantic ones stay hidden even if listed.

### Option A — Docker on any small server (VPS)

```bash
cp .env.prod.example .env.prod      # set JWT_SECRET and POSTGRES_PASSWORD
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d --build
```

That starts the app on port 4000 with Postgres, Redis and a volume for uploaded photos. Database migrations run automatically on start. Put HTTPS in front, for example with [Caddy](https://caddyserver.com):

```
ourworld.example.com {
  reverse_proxy localhost:4000
}
```

### Option B — a platform (Render, Railway, Fly.io, …)

1. Create a PostgreSQL database and copy its connection string.
2. Create a web service from this repo using the root `Dockerfile`.
3. Set the environment variables below. Attach a persistent disk at `/data/uploads` if you want chat photos to survive redeploys.
4. The health check is `GET /api/health`.

### Environment variables

| Variable | Required | Notes |
| --- | --- | --- |
| `DATABASE_URL` | ✅ | `postgresql://user:pass@host:5432/db` |
| `JWT_SECRET` | ✅ | At least 32 random characters. The server refuses to start in production without it. `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"` |
| `COOKIE_SECURE` | | `true` by default in production (needs HTTPS). Set `false` only to try it over plain http. |
| `ENABLED_FEATURES`, `RELATIONSHIP` | | See above |
| `UPLOAD_DIR` | | `/data/uploads` in the container; mount a volume there |
| `REDIS_URL` | | Presence is kept in memory without it (fine for one instance) |
| `STUN_URLS`, `TURN_URLS`, `TURN_USERNAME`, `TURN_CREDENTIAL` | | Only needed once video is open; add TURN for strict networks |
| `PORT` | | Default `4000` |

To build the web app with different switches: `docker build --build-arg VITE_FEATURES=chat,movie,music .`

### Without Docker

```bash
npm run build:prod        # builds the web app into server/public, installs the server
NODE_ENV=production DATABASE_URL=... JWT_SECRET=... npm start
```

### Inviting her

1. Open your site, tap **Come in** and create your account.
2. You'll get a code like `HI-7K4P` and a link like `https://your-site/join?code=HI-7K4P`. Send her the link (**Settings → Your world** shows it again).
3. She opens it, picks her name and look, and creates her account. Your screen updates the moment she's in. The code only works once, and a world holds exactly two people.

### Movie night: the cinema

1. **Now Showing** (`/together/movie`) is a wall of posters. Two open films are always on, and **Put a film on** adds your own with a title, tagline, genre, optional showtime, and a painted poster or your own image.
2. Tap a poster, then **Get my ticket**. The ticket prints with your seat (you get F7 and F8, side by side) and is kept under **Settings → Tickets**.
3. **Go to Screen 1** takes you into the 3D cinema. The usher checks your ticket, tears the stub and points you to your seat. You walk down the steps and sit, and she does the same.
4. Once you're both seated, the curtains open and the film plays on the big screen in the theatre. **Enlarge screen** zooms in to a full player (with a full-screen button); **Theatre view** zooms back out.

How the film gets to her:

- **"I'll stream it" (recommended):** in your seat, choose the file on your computer. It streams live from your browser to hers over WebRTC, picture and sound, so she needs nothing and it's always in sync. Only you control play and pause; her buttons ask you. Use Chrome or Edge on a laptop to stream (Safari can't capture video); she can watch on anything, including a phone. Keep the theatre open while you stream, because leaving the page stops the film.
- **YouTube / video link:** both of you play the same video, and play, pause and seeking stay in sync. Whoever arrives second catches up automatically.
- If your networks are strict (some mobile carriers, office wifi) and the stream never connects, add a TURN server (`TURN_URLS`, `TURN_USERNAME`, `TURN_CREDENTIAL`).

---

## What's inside

| Area | Where | Notes |
| --- | --- | --- |
| Home | `pages/Home.jsx` | The room, presence, "What should we do tonight?", tonight's plan, countdowns, check-in, pet |
| Avatars | `components/avatar/` | 3D chibi characters (Three.js / React Three Fiber) with poses & expressions, `AvatarCustomizer` |
| Wardrobe | `pages/Wardrobe.jsx` | Closet, saved/renamed/favourite outfits |
| Gifts | `pages/Gifts.jsx`, `components/gifts/` | Shop, send animation, full-screen opening, "send a kiss back" |
| Cinema | `pages/NowShowing.jsx`, `pages/Theatre.jsx`, `components/cinema/` | Posters, tickets, a 3D theatre with an usher and stadium seats, film streamed host → viewer over WebRTC (`services/rtc/filmStream.js`) |
| Together | `pages/Together.jsx` | Slow dance, call, music, date night |
| Call | `stores/callStore.js`, `services/rtc/peer.js` | WebRTC with camera/mic/screen share/PiP |
| Chat | `components/chat/` | Emoji, stickers, photos, voice notes, reactions, receipts, typing |
| Letters | `pages/Letters.jsx` | Wax-sealed letters that unlock "tomorrow morning" or on your anniversary |
| Memories | `pages/Memories.jsx` | Polaroid wall, timeline, scrapbook |
| Dates | `pages/Dates.jsx` | Shared calendar with reminders, countdowns, daily check-in |
| Our World | `pages/OurWorld.jsx` | Decorate (drag furniture), pet, keepsakes (achievements) |
| Our Story | `pages/Story.jsx` | Scrapbook timeline of firsts + hand-added moments |

### Client architecture

- **Catalogs** (`client/src/catalog/`) — clothing, gifts, environments, furniture, songs, pets, achievements. Pure data. Adding a gift or an item is one entry.
- **No sample content.** Demo mode starts with an empty world — just two people (`client/src/data/demoWorld.js`) and a lamp, a plant and fairy lights in the room. Everything else fills up with what you actually do.
- **Stores** (`client/src/stores/`) — one Zustand store per domain: auth, people, avatar, wardrobe, gifts, room, presence, activity, chat, notifications, memories, letters, calendar, check-ins, pet, music, story, call, settings, ui. Each action does an optimistic local update, emits a realtime event if the other person should know, and calls `remote(() => api…)` (a no-op in demo mode).
- **Realtime** (`client/src/services/realtime/`) — a transport-agnostic hub. `DemoTransport` + `DemoPartner` in demo mode, `SocketTransport` otherwise. `bindings.js` routes incoming events into stores. Event names are in `events.js` (`gift:received`, `movie:play`, `interaction`, `dance:start`, `rtc:offer`, …).
- **3D world** (`components/world3d/`) — the room is a real Three.js scene: seven environments (rainy bedroom, rooftop, sunset beach, café, stargazing hill, campfire, theater) with rain, stars, a moving sea, flickering firelight and a live wall clock, plus both chibis, draggable 3D decorations and the pet, all in one canvas. New place = one component in `world3d/envs/` + a catalog entry. The older 2D scenes remain for small thumbnails and as a no-WebGL fallback.

### Server architecture

- `routes/` — `/api/auth`, `/users`, `/avatars`, `/wardrobe`, `/gifts`, `/rooms`, `/activities`, `/messages`, `/memories`, `/letters`, `/events`, `/notifications`, `/presence`, `/media`, `/bootstrap` (the whole small world in one request).
- `services/` — notifications and serializers.
- `realtime/` — Socket.IO auth, a relay for ephemeral events, and presence (Redis if `REDIS_URL` is set, memory otherwise).
- `prisma/schema.prisma` — User, Couple, Avatar, Outfit, Gift, Room, Pet, Activity, ActivityParticipant, Message, Media, Memory, Letter, SharedEvent, Countdown, CheckIn, Milestone, Achievement, Notification. Catalog items are keys, not tables; presence isn't stored in Postgres.

### Security & privacy

- Email/password with bcrypt; JWT sessions (bearer + httpOnly cookie), `tokenVersion` for "log out everywhere"; rate-limited auth.
- Every private query is scoped by the signed-in user's `coupleId` (tests check that another couple gets 404s).
- Invite codes are single-use; a couple can never have a third member.
- zod validation on every write; text is trimmed/cleaned and always rendered through React (escaped).
- Anything persisted (messages, gifts, letters, memories, plans, check-ins) reaches the other person **from the server after it's saved** — the socket relay only forwards ephemeral events and always stamps the real sender.
- Sealed letters are sent without their text until they unlock.
- Uploads are checked by magic bytes (not file name), stored per couple and served only to that couple.
- No secrets in the frontend; configuration via env files.

### Accessibility

Semantic landmarks and headings, skip link, labelled controls, focus-visible styles, focus-trapped modals with Escape, keyboard-movable room decorations, `aria-live` presence/toasts/chat, reduced motion (system/on/off) applied to both CSS and Framer Motion, and no audio until you ask for it (with a global mute).

---

## Mocked today → where the real thing plugs in

| Feature | Now | Integration point |
| --- | --- | --- |
| Partner (demo) | `DemoPartner` | Already swaps to Socket.IO with `VITE_DEMO_MODE=false` |
| Video call | Real WebRTC for your own camera/mic/screen; in demo the other person is a live avatar | `services/rtc/peer.js` (signaling over the realtime hub). Add TURN servers via `VITE_ICE_SERVERS` for strict NATs |
| Music | Generative arrangements via Web Audio (no copyrighted audio) | `services/audio/synth.js` exposes `play/stop` — replace with a provider SDK |
| Movies | Openly licensed Blender films, YouTube or direct video links, or each person's own local copy; play/pause/seek synced, late joiners catch up | `components/activities/MoviePlayer.jsx` player adapters |
| GIFs | Local animated sticker set | `services/media/gifs.js` (`search(query)`) — add Giphy/Tenor with a server-side key |
| Photos (demo) | Resized in-browser and kept locally | `services/media/upload.js` → `POST /api/media` |

## Decisions worth knowing

- **3D chibi avatars, built from code.** Each character is assembled procedurally from the avatar config (`components/avatar/chibi/buildChibi.js`) — no model files to download, and every clothing item and hairstyle is a few lines. Big animated avatars get a live WebGL canvas; thumbnails are rendered once by a shared renderer and cached as images, because browsers only allow a handful of live WebGL canvases per page. Devices without WebGL fall back to the older 2D drawing.
- **No currency.** Everything in the gift shop, wardrobe, room and pet corner is simply available — nothing to earn or buy.
- **Sockets relay, REST persists.** It keeps realtime cheap and makes the server the single source of truth for anything that matters.
- **Music is generated** so the music room and slow dance actually make sound without shipping or streaming anyone's songs.

## Room to grow

The structure leaves obvious doors open: more scenes (`scenes/index.js`), a full house (Room already takes an `environment`), mini-games as new `activity` types over the same invite/accept flow, seasonal catalog drops, AI date ideas behind a server route, and a 3D/VR renderer behind the same avatar config.
