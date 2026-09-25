// A small Matroska (.mkv / .webm) reader, just enough to list a film's audio
// and subtitle tracks and pull text subtitles out of it — browsers play MKV
// files but don't expose the subtitle tracks inside them.
import { assEventText, cleanCueText, languageName } from './subtitles';

const ID = {
  EBML: 0x1a45dfa3,
  Segment: 0x18538067,
  Info: 0x1549a966,
  TimecodeScale: 0x2ad7b1,
  Tracks: 0x1654ae6b,
  TrackEntry: 0xae,
  TrackNumber: 0xd7,
  TrackType: 0x83,
  CodecID: 0x86,
  Language: 0x22b59c,
  LanguageBCP47: 0x22b59d,
  Name: 0x536e,
  FlagDefault: 0x88,
  FlagForced: 0x55aa,
  Cluster: 0x1f43b675,
  Timecode: 0xe7,
  SimpleBlock: 0xa3,
  BlockGroup: 0xa0,
  Block: 0xa1,
  BlockDuration: 0x9b,
};
// Elements that sit directly in the Segment: seeing one ends an unknown-size cluster.
const LEVEL1 = new Set([0x114d9b74, ID.Info, ID.Tracks, ID.Cluster, 0x1c53bb6b, 0x1941a469, 0x1043a770, 0x1254c367]);
const TEXT_CODECS = new Set(['S_TEXT/UTF8', 'S_TEXT/ASS', 'S_TEXT/SSA', 'S_TEXT/WEBVTT', 'S_ASS', 'S_SSA']);
const CHUNK = 8 * 1024 * 1024;

/** Reads a File through an 8 MB window so millions of tiny reads stay cheap. */
class Reader {
  constructor(file) {
    this.file = file;
    this.start = 0;
    this.buf = new Uint8Array(0);
  }
  async ensure(pos, n) {
    if (pos >= this.start && pos + n <= this.start + this.buf.length) return true;
    if (pos >= this.file.size) return false;
    this.start = pos;
    this.buf = new Uint8Array(await this.file.slice(pos, Math.min(this.file.size, pos + Math.max(n, CHUNK))).arrayBuffer());
    return this.buf.length >= Math.min(n, this.file.size - pos);
  }
  byte(pos) {
    return this.buf[pos - this.start];
  }
  bytes(pos, n) {
    return this.buf.subarray(pos - this.start, pos - this.start + n);
  }
}

const vlen = (b) => {
  for (let i = 0; i < 8; i++) if (b & (0x80 >> i)) return i + 1;
  return 0;
};

/** Element header at pos → { id, size (−1 = unknown), data (payload start) }. */
async function header(r, pos) {
  if (!(await r.ensure(pos, 12))) return null;
  const il = vlen(r.byte(pos));
  if (!il || il > 4) return null;
  let id = 0;
  for (let i = 0; i < il; i++) id = id * 256 + r.byte(pos + i);
  const sp = pos + il;
  const sl = vlen(r.byte(sp));
  if (!sl) return null;
  let size = r.byte(sp) & (0xff >> sl);
  let allOnes = size === 0xff >> sl;
  for (let i = 1; i < sl; i++) {
    const b = r.byte(sp + i);
    size = size * 256 + b;
    if (b !== 0xff) allOnes = false;
  }
  return { id, size: allOnes ? -1 : size, data: sp + sl };
}

async function uint(r, pos, size) {
  await r.ensure(pos, size);
  let v = 0;
  for (let i = 0; i < size; i++) v = v * 256 + r.byte(pos + i);
  return v;
}
async function str(r, pos, size) {
  await r.ensure(pos, size);
  return new TextDecoder().decode(r.bytes(pos, size)).replace(/\0+$/, '');
}

async function readTracks(r, pos, end) {
  const tracks = [];
  while (pos < end) {
    const h = await header(r, pos);
    if (!h) break;
    if (h.id === ID.TrackEntry) {
      const t = { number: 0, type: 0, codec: '', language: 'eng', name: '', isDefault: true, forced: false };
      let p = h.data;
      while (p < h.data + h.size) {
        const c = await header(r, p);
        if (!c) break;
        if (c.id === ID.TrackNumber) t.number = await uint(r, c.data, c.size);
        else if (c.id === ID.TrackType) t.type = await uint(r, c.data, c.size);
        else if (c.id === ID.CodecID) t.codec = await str(r, c.data, c.size);
        else if (c.id === ID.Language) t.language = await str(r, c.data, c.size);
        else if (c.id === ID.LanguageBCP47) t.language = await str(r, c.data, c.size);
        else if (c.id === ID.Name) t.name = await str(r, c.data, c.size);
        else if (c.id === ID.FlagDefault) t.isDefault = (await uint(r, c.data, c.size)) === 1;
        else if (c.id === ID.FlagForced) t.forced = (await uint(r, c.data, c.size)) === 1;
        p = c.data + c.size;
      }
      tracks.push(t);
    }
    pos = h.data + h.size;
  }
  return tracks;
}

const label = (t, i) => [t.name, languageName(t.language)].filter(Boolean).filter((v, j, a) => a.indexOf(v) === j).join(' · ') || `Track ${i + 1}`;

/**
 * List a film's audio and subtitle tracks (reads only the start of the file).
 * → { audio: [{number, label, isDefault}], subtitles: [{number, label, codec, supported}], timecodeScale }
 */
export async function readMkvInfo(file) {
  const r = new Reader(file);
  const ebml = await header(r, 0);
  if (!ebml || ebml.id !== ID.EBML) return null;
  const seg = await header(r, ebml.data + ebml.size);
  if (!seg || seg.id !== ID.Segment) return null;
  const end = seg.size < 0 ? file.size : seg.data + seg.size;
  let pos = seg.data;
  let scale = 1_000_000;
  let tracks = null;
  let guard = 0;
  while (pos < end && guard++ < 64) {
    const h = await header(r, pos);
    if (!h || h.size < 0) break;
    if (h.id === ID.Info) {
      let p = h.data;
      while (p < h.data + h.size) {
        const c = await header(r, p);
        if (!c) break;
        if (c.id === ID.TimecodeScale) scale = await uint(r, c.data, c.size);
        p = c.data + c.size;
      }
    } else if (h.id === ID.Tracks) tracks = await readTracks(r, h.data, h.data + h.size);
    else if (h.id === ID.Cluster) break;
    pos = h.data + h.size;
  }
  if (!tracks) return null;
  const audio = tracks.filter((t) => t.type === 2).map((t, i) => ({ number: t.number, label: label(t, i), language: t.language, isDefault: t.isDefault, codec: t.codec }));
  const subtitles = tracks
    .filter((t) => t.type === 17)
    .map((t, i) => ({ number: t.number, label: `${label(t, i)}${t.forced ? ' (forced)' : ''}`, codec: t.codec, supported: TEXT_CODECS.has(t.codec) }));
  return { audio, subtitles, timecodeScale: scale };
}

/**
 * Pull every cue of one text subtitle track out of the file. Reads the whole
 * file once (a few seconds for a full film), reporting progress 0…1.
 */
export async function extractMkvSubtitles(file, trackNumber, { timecodeScale = 1_000_000, codec = 'S_TEXT/UTF8', onProgress, signal } = {}) {
  const r = new Reader(file);
  const ebml = await header(r, 0);
  const seg = await header(r, ebml.data + ebml.size);
  const segEnd = seg.size < 0 ? file.size : seg.data + seg.size;
  const isAss = /ASS|SSA/.test(codec);
  const cues = [];
  const toSec = (ticks) => (ticks * timecodeScale) / 1e9;
  let lastReport = 0;

  const readBlock = async (pos, size, clusterTime, duration) => {
    await r.ensure(pos, Math.min(size, 16));
    const tl = vlen(r.byte(pos));
    let track = r.byte(pos) & (0xff >> tl);
    for (let i = 1; i < tl; i++) track = track * 256 + r.byte(pos + i);
    if (track !== trackNumber) return;
    await r.ensure(pos, size);
    const rel = (r.byte(pos + tl) << 8) | r.byte(pos + tl + 1);
    const offset = rel > 0x7fff ? rel - 0x10000 : rel;
    const payload = new TextDecoder().decode(r.bytes(pos + tl + 3, size - tl - 3));
    const text = isAss ? assEventText(payload, 8) : cleanCueText(payload);
    if (!text) return;
    const start = toSec(clusterTime + offset);
    cues.push({ start, end: duration != null ? start + toSec(duration) : null, text });
  };

  let pos = seg.data;
  while (pos < segEnd) {
    if (signal?.aborted) throw new DOMException('Cancelled', 'AbortError');
    const h = await header(r, pos);
    if (!h) break;
    if (h.id !== ID.Cluster) {
      if (h.size < 0) break;
      pos = h.data + h.size;
      continue;
    }
    const end = h.size < 0 ? segEnd : h.data + h.size;
    let clusterTime = 0;
    let p = h.data;
    while (p < end) {
      const c = await header(r, p);
      if (!c) break;
      if (h.size < 0 && LEVEL1.has(c.id)) break; // next cluster of an unknown-size one
      if (c.id === ID.Timecode) clusterTime = await uint(r, c.data, c.size);
      else if (c.id === ID.SimpleBlock) await readBlock(c.data, c.size, clusterTime, null);
      else if (c.id === ID.BlockGroup) {
        let block = null;
        let duration = null;
        let q = c.data;
        while (q < c.data + c.size) {
          const b = await header(r, q);
          if (!b) break;
          if (b.id === ID.Block) block = b;
          else if (b.id === ID.BlockDuration) duration = await uint(r, b.data, b.size);
          q = b.data + b.size;
        }
        if (block) await readBlock(block.data, block.size, clusterTime, duration);
      }
      p = c.data + c.size;
    }
    pos = end;
    if (onProgress && pos - lastReport > 32 * 1024 * 1024) {
      lastReport = pos;
      onProgress(pos / file.size);
    }
  }
  cues.sort((a, b) => a.start - b.start);
  // Blocks without a duration last until the next line (at most 6 s).
  cues.forEach((c, i) => {
    if (c.end == null) c.end = Math.min(c.start + 6, cues[i + 1]?.start ?? c.start + 4);
  });
  onProgress?.(1);
  return cues;
}

export const isMatroska = (file) => /\.(mkv|mka|webm)$/i.test(file?.name ?? '') || /matroska|webm/.test(file?.type ?? '');
