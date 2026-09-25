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

Everything you do is saved in `localStorage`. **Settings → Couple** has "Reset demo world" and a switch to turn the simulated partner's spontaneous activity off.

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

The first person signs up at `/welcome` and gets a single-use invite code (`LOVE-7K4P`) and a private link. The second person uses `/join` with it. A world holds exactly two people.

Run the API tests (they need a disposable database in `DATABASE_URL`):

```bash
npm test
```

---

## What's inside

| Area | Where | Notes |
| --- | --- | --- |
| Home | `pages/Home.jsx` | The room, presence, "What should we do tonight?", tonight's plan, countdowns, check-in, pet |
| Avatars | `components/avatar/` | Layered SVG renderer (`Avatar`) with poses & expressions, `AvatarCustomizer` |
| Wardrobe | `pages/Wardrobe.jsx` | Closet, boutique (Love Coins), saved/renamed/favourite outfits |
| Gifts | `pages/Gifts.jsx`, `components/gifts/` | Shop, send animation, full-screen opening, "send a kiss back" |
| Together | `pages/Together.jsx` | Movie night (sync + reactions + video bubbles), slow dance, call, music, date night |
| Call | `stores/callStore.js`, `services/rtc/peer.js` | WebRTC with camera/mic/screen share/PiP |
| Chat | `components/chat/` | Emoji, stickers, photos, voice notes, reactions, receipts, typing |
| Letters | `pages/Letters.jsx` | Wax-sealed letters that unlock "tomorrow morning" or on your anniversary |
| Memories | `pages/Memories.jsx` | Polaroid wall, timeline, scrapbook |
| Dates | `pages/Dates.jsx` | Shared calendar with reminders, countdowns, daily check-in |
| Our World | `pages/OurWorld.jsx` | Decorate (drag furniture), pet, keepsakes (achievements) |
| Our Story | `pages/Story.jsx` | Scrapbook timeline of firsts + hand-added moments |

### Client architecture

- **Catalogs** (`client/src/catalog/`) — clothing, gifts, environments, furniture, songs, pets, achievements. Pure data. Adding a gift or an item is one entry.
- **Mock data** (`client/src/data/mockData.js`) — the only place demo values live (142 days together, 1,250 coins, 18 memories…). Stores seed from it; components never import it.
- **Stores** (`client/src/stores/`) — one Zustand store per domain: auth, people, avatar, wardrobe, wallet, gifts, room, presence, activity, chat, notifications, memories, letters, calendar, check-ins, pet, music, story, call, settings, ui. Each action does an optimistic local update, emits a realtime event if the other person should know, and calls `remote(() => api…)` (a no-op in demo mode).
- **Realtime** (`client/src/services/realtime/`) — a transport-agnostic hub. `DemoTransport` + `DemoPartner` in demo mode, `SocketTransport` otherwise. `bindings.js` routes incoming events into stores. Event names are in `events.js` (`gift:received`, `movie:play`, `interaction`, `dance:start`, `rtc:offer`, …).
- **Environments** (`components/room/scenes/`) — seven hand-drawn SVG scenes with rain, stars, fireflies, fire, a live wall clock. New place = new scene component + catalog entry.

### Server architecture

- `routes/` — `/api/auth`, `/users`, `/avatars`, `/wardrobe`, `/gifts`, `/wallet`, `/rooms`, `/activities`, `/messages`, `/memories`, `/letters`, `/events`, `/notifications`, `/presence`, `/media`, `/bootstrap` (the whole small world in one request).
- `services/` — wallet (atomic spends), notifications, payments, serializers.
- `realtime/` — Socket.IO auth, a relay for ephemeral events, and presence (Redis if `REDIS_URL` is set, memory otherwise).
- `prisma/schema.prisma` — User, Couple, Avatar, WardrobeItem, Outfit, Wallet, Transaction, Gift, Room, Pet, Activity, ActivityParticipant, Message, Media, Memory, Letter, SharedEvent, Countdown, CheckIn, Milestone, Achievement, Notification. Catalog items are keys, not tables; presence isn't stored in Postgres.

### Security & privacy

- Email/password with bcrypt; JWT sessions (bearer + httpOnly cookie), `tokenVersion` for "log out everywhere"; rate-limited auth.
- Every private query is scoped by the signed-in user's `coupleId` (tests check that another couple gets 404s).
- Invite codes are single-use; a couple can never have a third member.
- zod validation on every write; text is trimmed/cleaned and always rendered through React (escaped).
- Prices are enforced server-side with conditional updates, so coins can't be overdrawn or double-claimed.
- Anything persisted or paid for (messages, gifts, letters, memories, plans, check-ins) reaches the other person **from the server after it's saved** — the socket relay only forwards ephemeral events and always stamps the real sender.
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
| Movies | Openly licensed Blender films, local files, or YouTube links; play/pause/seek synced | `components/activities/MoviePlayer.jsx` player adapters |
| GIFs | Local animated sticker set | `services/media/gifs.js` (`search(query)`) — add Giphy/Tenor with a server-side key |
| Payments | Love Coins only; "top-ups" are free | `server/src/services/payments.js` — add Stripe Checkout + webhook crediting |
| Photos (demo) | Resized in-browser and kept locally | `services/media/upload.js` → `POST /api/media` |

## Decisions worth knowing

- **2.5D SVG instead of 3D avatars.** Three.js/R3F would have meant low-poly characters that feel colder than the hand-drawn look, plus a large bundle. The avatar renderer is isolated behind `<Avatar config pose expression />`, so a 3D renderer can replace it later without touching the rest of the app.
- **Sockets relay, REST persists.** It keeps realtime cheap and makes the server the single source of truth for anything that matters.
- **Music is generated** so the music room and slow dance actually make sound without shipping or streaming anyone's songs.

## Room to grow

The structure leaves obvious doors open: more scenes (`scenes/index.js`), a full house (Room already takes an `environment`), mini-games as new `activity` types over the same invite/accept flow, seasonal catalog drops, AI date ideas behind a server route, and a 3D/VR renderer behind the same avatar config.
