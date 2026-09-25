// End-to-end API test. Needs DATABASE_URL pointing at a disposable database:
//   npm test
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { io as connect } from 'socket.io-client';
import { createApp } from '../src/app.js';
import { attachRealtime } from '../src/realtime/socket.js';
import { prisma } from '../src/db.js';
import { config } from '../src/config.js';

let server;
let io;
let base;
const stamp = Date.now().toString(36);

async function call(method, path, { token, body, form } = {}) {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body) headers['Content-Type'] = 'application/json';
  const res = await fetch(`${base}/api${path}`, { method, headers, body: form ?? (body ? JSON.stringify(body) : undefined) });
  const data = res.status === 204 ? null : await res.json().catch(() => null);
  return { status: res.status, data };
}
const once = (socket, event) => new Promise((resolve) => socket.once(event, resolve));

let A;
let B;
let C;

before(async () => {
  server = http.createServer(createApp());
  io = attachRealtime(server);
  await new Promise((r) => server.listen(0, r));
  base = `http://localhost:${server.address().port}`;
});

after(async () => {
  await prisma.user.deleteMany({ where: { email: { contains: stamp } } });
  await prisma.$disconnect();
  io.close();
  server.closeAllConnections();
  server.close();
});

test('register a couple with a single-use invite code', async () => {
  const a = await call('POST', '/auth/register', { body: { name: 'Shubham', email: `a-${stamp}@x.io`, password: 'correct-horse' } });
  assert.equal(a.status, 201);
  assert.match(a.data.couple.inviteCode, /^LOVE-[A-Z0-9]{4}$/);
  A = { token: a.data.token, id: a.data.user.id, code: a.data.couple.inviteCode };

  const b = await call('POST', '/auth/register', { body: { name: 'Her', email: `b-${stamp}@x.io`, password: 'correct-horse', inviteCode: A.code } });
  assert.equal(b.status, 201);
  B = { token: b.data.token, id: b.data.user.id };

  const third = await call('POST', '/auth/register', { body: { name: 'Third', email: `c-${stamp}@x.io`, password: 'correct-horse', inviteCode: A.code } });
  assert.equal(third.status, 400, 'a world only has room for two');

  const c = await call('POST', '/auth/register', { body: { name: 'Other', email: `d-${stamp}@x.io`, password: 'correct-horse' } });
  C = { token: c.data.token, id: c.data.user.id };
});

test('login rejects bad passwords without revealing accounts', async () => {
  const bad = await call('POST', '/auth/login', { body: { email: `a-${stamp}@x.io`, password: 'nope-nope' } });
  const ghost = await call('POST', '/auth/login', { body: { email: `ghost-${stamp}@x.io`, password: 'nope-nope' } });
  assert.equal(bad.status, 401);
  assert.equal(bad.data.error, ghost.data.error);
  assert.equal((await call('GET', '/bootstrap')).status, 401);
});

test('bootstrap returns the shared world', async () => {
  const { status, data } = await call('GET', '/bootstrap', { token: A.token });
  assert.equal(status, 200);
  assert.equal(data.partner.id, B.id);
  assert.equal(data.wallet, undefined, 'no currency in this world');
  assert.equal(data.room.environment, 'bedroom');
});

test('gifts reach the partner in realtime and can be opened once', async () => {
  const sockB = connect(base, { auth: { token: B.token }, transports: ['websocket'] });
  await once(sockB, 'connect');
  const received = once(sockB, 'gift:received');
  const sent = await call('POST', '/gifts/send', { token: A.token, body: { giftId: 'rose', message: '<b>Just because.</b>' } });
  assert.equal(sent.status, 201);
  const g = await received;
  assert.equal(g.giftId, 'rose');
  assert.equal(g.from, A.id);
  assert.equal(g.message, '<b>Just because.</b>', 'stored as text; React escapes on render');

  assert.equal((await call('POST', `/gifts/${g.id}/open`, { token: A.token })).status, 404, 'only the recipient opens it');
  const opened = await call('POST', `/gifts/${g.id}/open`, { token: B.token });
  assert.equal(opened.data.gift.opened, true);
  assert.equal((await call('POST', '/gifts/send', { token: A.token, body: { giftId: 'moon' } })).status, 201);
  assert.equal((await call('POST', '/gifts/send', { token: A.token, body: { giftId: 'diamond-yacht' } })).status, 400, 'unknown gifts are rejected');
  sockB.close();
});

test('sockets relay ephemeral events to the partner only, with a trusted sender', async () => {
  const sA = connect(base, { auth: { token: A.token }, transports: ['websocket'] });
  const sB = connect(base, { auth: { token: B.token }, transports: ['websocket'] });
  const sC = connect(base, { auth: { token: C.token }, transports: ['websocket'] });
  await Promise.all([once(sA, 'connect'), once(sB, 'connect'), once(sC, 'connect')]);
  let leaked = false;
  sC.on('interaction', () => (leaked = true));
  const hug = once(sB, 'interaction');
  sA.emit('interaction', { type: 'hug', from: 'someone-else' });
  const got = await hug;
  assert.equal(got.type, 'hug');
  assert.equal(got.from, A.id);

  let fakeGift = false;
  sB.on('gift:received', () => (fakeGift = true));
  sA.emit('gift:sent', { giftId: 'moon' });
  await new Promise((r) => setTimeout(r, 300));
  assert.equal(fakeGift, false, 'gifts only arrive via the REST path, after saving');
  assert.equal(leaked, false, 'other couples never see our events');
  [sA, sB, sC].forEach((s) => s.close());
});

test('sealed letters keep their contents until they unlock', async () => {
  const later = new Date(Date.now() + 86_400_000).toISOString();
  const res = await call('POST', '/letters', { token: A.token, body: { title: 'Open this tomorrow ☀️', body: 'secret words', unlockAt: later } });
  assert.equal(res.status, 201);
  const boot = await call('GET', '/bootstrap', { token: B.token });
  const letter = boot.data.letters.find((l) => l.id === res.data.letter.id);
  assert.equal(letter.body, '');
  assert.equal(letter.sealed, true);
  assert.equal((await call('POST', `/letters/${letter.id}/open`, { token: B.token })).status, 403);
});

test('couples cannot touch each other’s data', async () => {
  const m = await call('POST', '/memories', { token: A.token, body: { caption: 'Our first virtual date', date: new Date().toISOString(), scene: 'sunset' } });
  assert.equal(m.status, 201);
  assert.equal((await call('POST', `/memories/${m.data.memory.id}/react`, { token: C.token, body: { emoji: '❤️' } })).status, 404);
  await call('DELETE', `/memories/${m.data.memory.id}`, { token: C.token });
  const boot = await call('GET', '/bootstrap', { token: A.token });
  assert.ok(boot.data.memories.some((x) => x.id === m.data.memory.id), 'still there');
});

test('input is validated', async () => {
  const r = await call('POST', '/events', { token: A.token, body: { title: '', type: 'nope', at: 'soon' } });
  assert.equal(r.status, 400);
  assert.ok(Array.isArray(r.data.details));
  const avatar = await call('PUT', '/avatars/me', { token: A.token, body: { config: { skin: 'red' } } });
  assert.equal(avatar.status, 400);
});

test('uploads are checked by content, not name', async () => {
  const fake = new FormData();
  fake.append('file', new Blob(['<script>alert(1)</script>'], { type: 'image/png' }), 'cute.png');
  assert.equal((await call('POST', '/media', { token: A.token, form: fake })).status, 400);

  const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');
  const form = new FormData();
  form.append('file', new Blob([png], { type: 'image/png' }), 'dot.png');
  const up = await call('POST', '/media', { token: A.token, form });
  assert.equal(up.status, 201);
  const own = await fetch(`${base}${up.data.url}`, { headers: { Authorization: `Bearer ${B.token}` } });
  assert.equal(own.status, 200);
  const other = await fetch(`${base}${up.data.url}`, { headers: { Authorization: `Bearer ${C.token}` } });
  assert.equal(other.status, 404);
});

test('locked features are closed on the server too', async () => {
  const saved = { features: config.features, relationship: config.relationship };
  config.features = new Set(['chat', 'movie']);
  config.relationship = 'friends';
  try {
    assert.equal((await call('GET', '/gifts', { token: A.token })).status, 403);
    assert.equal((await call('GET', '/letters', { token: A.token })).status, 403);
    assert.equal((await call('GET', '/memories', { token: A.token })).status, 403);
    const msg = await call('POST', '/messages', { token: A.token, body: { type: 'text', text: 'hi friend' } });
    assert.equal(msg.status, 201);
    const ice = await call('GET', '/rtc/ice-servers', { token: A.token });
    assert.equal(ice.status, 200);
    assert.ok(ice.data.iceServers.length >= 1);
  } finally {
    Object.assign(config, saved);
  }
});

test('cinema: showings, adjacent seats, tickets are private', async () => {
  const bad = await call('POST', '/cinema/showings', { token: A.token, body: { title: 'Nope', kind: 'link', source: 'javascript:alert(1)' } });
  assert.equal(bad.status, 400);
  const s = await call('POST', '/cinema/showings', { token: A.token, body: { title: 'Our film', tagline: 'Tonight only', kind: 'stream', palette: 3 } });
  assert.equal(s.status, 201);
  assert.equal(s.data.showing.hostId, A.id);

  const listB = await call('GET', '/cinema/showings', { token: B.token });
  assert.ok(listB.data.showings.some((x) => x.id === s.data.showing.id));
  assert.equal((await call('GET', '/cinema/showings', { token: C.token })).data.showings.length, 0);

  const ta = await call('POST', '/cinema/tickets', { token: A.token, body: { showingKey: s.data.showing.id } });
  const tb = await call('POST', '/cinema/tickets', { token: B.token, body: { showingKey: s.data.showing.id } });
  assert.equal(ta.status, 201);
  assert.deepEqual([ta.data.ticket.seat, tb.data.ticket.seat].sort(), ['F7', 'F8']);
  const again = await call('POST', '/cinema/tickets', { token: A.token, body: { showingKey: s.data.showing.id } });
  assert.equal(again.data.ticket.id, ta.data.ticket.id, 'one ticket per person per film');
  assert.equal((await call('POST', '/cinema/tickets', { token: C.token, body: { showingKey: s.data.showing.id } })).status, 400);
  assert.equal((await call('POST', `/cinema/tickets/${ta.data.ticket.id}/check-in`, { token: B.token })).status, 404);
  const used = await call('POST', `/cinema/tickets/${ta.data.ticket.id}/check-in`, { token: A.token });
  assert.ok(used.data.ticket.usedAt);
  const house = await call('POST', '/cinema/tickets', { token: B.token, body: { showingKey: 'film:bbb' } });
  assert.equal(house.data.ticket.title, 'Big Buck Bunny');
  assert.equal((await call('DELETE', `/cinema/showings/${s.data.showing.id}`, { token: B.token })).status, 403);
  assert.equal((await call('GET', '/cinema/tickets', { token: A.token })).data.tickets.length, 1);
});
