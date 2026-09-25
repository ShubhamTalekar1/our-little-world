// Subtitles: parse .srt / .vtt / .ass files (and MKV subtitle blocks) into cues,
// and find the cue for a moment in the film.
// A cue is { start, end, text } in seconds; text may contain \n.

const time = (h, m, s, ms) => Number(h) * 3600 + Number(m) * 60 + Number(s) + Number(ms) / 1000;

/** Plain text from a subtitle line: keep line breaks, drop styling tags. */
export function cleanCueText(raw) {
  return raw
    .replace(/\{\\[^}]*\}/g, '') // ASS override tags {\i1}
    .replace(/\\N/gi, '\n')
    .replace(/\\h/g, ' ')
    .replace(/<[^>]+>/g, '') // <i>, <font …>
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .join('\n');
}

/** Text of an ASS "Dialogue:" event or MKV S_TEXT/ASS block (text is the last field). */
export function assEventText(line, fieldsBeforeText) {
  let rest = line;
  for (let i = 0; i < fieldsBeforeText; i++) {
    const c = rest.indexOf(',');
    if (c < 0) return '';
    rest = rest.slice(c + 1);
  }
  return cleanCueText(rest);
}

function parseSrtOrVtt(text) {
  const cues = [];
  const re = /(?:(\d+):)?(\d{1,2}):(\d{2})[,.](\d{1,3})\s*-->\s*(?:(\d+):)?(\d{1,2}):(\d{2})[,.](\d{1,3})[^\n]*\n([\s\S]*?)(?=\n\s*\n|$)/g;
  let m;
  while ((m = re.exec(text))) {
    const pad = (ms) => ms.padEnd(3, '0');
    const start = time(m[1] ?? 0, m[2], m[3], pad(m[4]));
    const end = time(m[5] ?? 0, m[6], m[7], pad(m[8]));
    const body = cleanCueText(m[9]);
    if (body) cues.push({ start, end, text: body });
  }
  return cues;
}

function parseAss(text) {
  const cues = [];
  let format = null;
  for (const line of text.split(/\r?\n/)) {
    if (/^Format:/i.test(line) && !format) {
      const fields = line.slice(7).split(',').map((f) => f.trim().toLowerCase());
      if (fields.includes('text')) format = fields;
    }
    if (!/^Dialogue:/i.test(line)) continue;
    const f = format ?? ['layer', 'start', 'end', 'style', 'name', 'marginl', 'marginr', 'marginv', 'effect', 'text'];
    const parts = line.slice(9).split(',');
    const at = (name) => parts[f.indexOf(name)]?.trim();
    const t = (v) => {
      const x = /(\d+):(\d{2}):(\d{2})[.:](\d{1,3})/.exec(v ?? '');
      return x ? time(x[1], x[2], x[3], x[4].padEnd(3, '0').slice(0, 3)) : null; // centiseconds
    };
    const start = t(at('start'));
    const end = t(at('end'));
    const body = assEventText(line.slice(9), f.indexOf('text'));
    if (start != null && end != null && body) cues.push({ start, end, text: body });
  }
  return cues;
}

/** Parse a subtitle file's text (SRT, WebVTT or ASS/SSA). */
export function parseSubtitles(text) {
  const clean = text.replace(/^﻿/, '').replace(/\r\n?/g, '\n');
  const cues = /^\s*\[Script Info\]/i.test(clean) || /^Dialogue:/m.test(clean) ? parseAss(clean) : parseSrtOrVtt(`${clean}\n\n`);
  return cues.sort((a, b) => a.start - b.start);
}

/** Read a subtitle file, guessing the encoding (UTF-8, else Windows-1252). */
export async function readSubtitleFile(file) {
  const buf = await file.arrayBuffer();
  let text;
  try {
    text = new TextDecoder('utf-8', { fatal: true }).decode(buf);
  } catch {
    text = new TextDecoder('windows-1252').decode(buf);
  }
  const cues = parseSubtitles(text);
  if (!cues.length) throw new Error('No subtitles found in that file. Use an .srt, .vtt or .ass file.');
  return cues;
}

/** The text on screen at time t (joins overlapping cues). */
export function cueAt(cues, t) {
  if (!cues?.length) return '';
  let lo = 0;
  let hi = cues.length - 1;
  // last cue starting at or before t
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if (cues[mid].start <= t) lo = mid;
    else hi = mid - 1;
  }
  const out = [];
  for (let i = lo; i >= 0 && i > lo - 8; i--) {
    const c = cues[i];
    if (c.start <= t && t < c.end) out.unshift(c.text);
  }
  return out.join('\n');
}

const LANGS = new Intl.DisplayNames([navigator.language || 'en'], { type: 'language' });
/** "eng" / "en" / "pt-BR" → "English" … */
export function languageName(code) {
  if (!code || code === 'und') return '';
  const two = { eng: 'en', spa: 'es', fre: 'fr', fra: 'fr', ger: 'de', deu: 'de', ita: 'it', por: 'pt', rus: 'ru', jpn: 'ja', kor: 'ko', chi: 'zh', zho: 'zh', hin: 'hi', ara: 'ar', tur: 'tr', dut: 'nl', nld: 'nl', swe: 'sv', nor: 'no', dan: 'da', fin: 'fi', pol: 'pl', ces: 'cs', cze: 'cs', hun: 'hu', gre: 'el', ell: 'el', heb: 'he', tha: 'th', vie: 'vi', ind: 'id', msa: 'ms', may: 'ms', ukr: 'uk', ron: 'ro', rum: 'ro', ben: 'bn', tam: 'ta', tel: 'te', mar: 'mr', urd: 'ur', fas: 'fa', per: 'fa' }[code] ?? code;
  try {
    return LANGS.of(two) ?? code;
  } catch {
    return code;
  }
}
