import { createStore } from './createStore';
import { uid } from '../lib/id';
import { cleanText } from '../lib/sanitize';
import { DEMO_MODE } from '../config/env';
import { api } from '../services/api/client';
import { HOUSE_FILMS, HOUSE_BY_KEY } from '../catalog/videos';

const SEATS = ['F7', 'F8'];
const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const code = () => `ADMIT-${Array.from({ length: 6 }, () => ALPHABET[Math.floor(Math.random() * ALPHABET.length)]).join('')}`;

/** A showing as the UI sees it: the couple's own films plus the house films. */
export const filmFromShowing = (s) => ({ key: s.id, ...s });

/**
 * The little cinema: what's showing, my tickets, and which seats the other
 * person holds. With a backend the server issues tickets (and seats); in demo
 * mode they're made here.
 */
export const useCinemaStore = createStore('cinema', (set, get) => ({
  showings: [],
  tickets: [],
  partnerSeats: {}, // showingKey -> seat
  loaded: false,

  async load() {
    if (DEMO_MODE) return set({ loaded: true });
    try {
      const [{ showings }, { tickets }] = await Promise.all([api.get('/cinema/showings'), api.get('/cinema/tickets')]);
      set({ showings, tickets, loaded: true });
    } catch {
      set({ loaded: true });
    }
  },

  films() {
    return [...get().showings.map(filmFromShowing), ...HOUSE_FILMS];
  },
  film(key) {
    return HOUSE_BY_KEY[key] ?? (get().showings.find((s) => s.id === key) ? filmFromShowing(get().showings.find((s) => s.id === key)) : null);
  },
  ticketFor: (key) => get().tickets.find((t) => t.showingKey === key) ?? null,

  async addShowing(input, hostId) {
    const showing = {
      id: uid('show'),
      title: cleanText(input.title, 60),
      tagline: cleanText(input.tagline ?? '', 120),
      genre: cleanText(input.genre ?? '', 30),
      poster: input.poster ?? null,
      palette: input.palette ?? 0,
      kind: input.kind,
      source: input.kind === 'stream' ? null : input.source,
      startsAt: input.startsAt ?? null,
      hostId,
      createdAt: new Date().toISOString(),
    };
    if (!DEMO_MODE) {
      const res = await api.post('/cinema/showings', showing);
      set((s) => ({ showings: [res.showing, ...s.showings] }));
      return res.showing;
    }
    set((s) => ({ showings: [showing, ...s.showings] }));
    return showing;
  },
  receiveShowing: (showing) => set((s) => (s.showings.some((x) => x.id === showing.id) ? s : { showings: [showing, ...s.showings] })),
  async removeShowing(id) {
    if (!DEMO_MODE) await api.delete(`/cinema/showings/${id}`);
    set((s) => ({ showings: s.showings.filter((x) => x.id !== id) }));
  },
  dropShowing: (id) => set((s) => ({ showings: s.showings.filter((x) => x.id !== id) })),

  /** Get (or re-print) my ticket for a film. */
  async getTicket(key, userId) {
    const have = get().ticketFor(key);
    if (have) return have;
    let ticket;
    if (!DEMO_MODE) {
      ticket = (await api.post('/cinema/tickets', { showingKey: key })).ticket;
    } else {
      const film = get().film(key);
      if (!film) throw new Error('That film isn’t showing anymore');
      const theirs = get().partnerSeats[key];
      ticket = { id: uid('tix'), userId, showingKey: key, title: film.title, poster: film.poster ?? null, palette: film.palette ?? 0, seat: SEATS.find((x) => x !== theirs) ?? SEATS[0], code: code(), createdAt: new Date().toISOString(), usedAt: null };
    }
    set((s) => ({ tickets: [ticket, ...s.tickets.filter((t) => t.id !== ticket.id)] }));
    return ticket;
  },
  async checkIn(id) {
    const at = new Date().toISOString();
    set((s) => ({ tickets: s.tickets.map((t) => (t.id === id ? { ...t, usedAt: t.usedAt ?? at } : t)) }));
    if (!DEMO_MODE) await api.post(`/cinema/tickets/${id}/check-in`).catch(() => {});
  },
  partnerGotTicket: (key, seat) => set((s) => ({ partnerSeats: { ...s.partnerSeats, [key]: seat } })),
  /** The seat next to mine is theirs. */
  partnerSeat(key) {
    const mine = get().ticketFor(key)?.seat;
    return get().partnerSeats[key] ?? (mine ? SEATS.find((x) => x !== mine) : SEATS[1]);
  },
}));
