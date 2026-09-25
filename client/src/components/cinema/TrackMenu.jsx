import { useRef } from 'react';
import { motion } from 'framer-motion';
import { Check, Upload, X } from 'lucide-react';
import { toast } from '../../stores/uiStore';
import { canSwitchAudio } from './useFilmTracks';
import { cn } from '../../lib/cn';

function Option({ selected, disabled, onClick, children, note }) {
  return (
    <button type="button" role="menuitemradio" aria-checked={selected} disabled={disabled} onClick={onClick} className={cn('flex w-full items-start gap-2 rounded-xl px-2.5 py-2 text-left text-sm transition', disabled ? 'cursor-default text-faint' : 'text-cream hover:bg-white/5')}>
      <Check className={cn('mt-0.5 h-4 w-4 shrink-0', selected ? 'text-peach' : 'invisible')} aria-hidden />
      <span className="min-w-0">
        <span className="block truncate">{children}</span>
        {note && <span className="block text-[11px] text-muted">{note}</span>}
      </span>
    </button>
  );
}

/**
 * Audio & subtitles picker. `role` is host (streaming a file), viewer
 * (watching a stream), sync (both play the same web film) or youtube.
 */
export default function TrackMenu({ role, tracks, hostName, onClose }) {
  const fileRef = useRef(null);
  const { audio, chooseAudio, mkv, subs, loadSubtitleFile, pickEmbedded, subtitlesOff, showSubs, setShowSubs, progress, subText } = tracks;
  const canLoad = role === 'host' || role === 'sync';
  const run = (p) => p.catch((e) => e?.name !== 'AbortError' && toast(e.message || 'Couldn’t load those subtitles', { emoji: '💬', tone: 'error' }));

  return (
    <motion.div role="menu" aria-label="Audio and subtitles" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }} className="absolute bottom-full left-1/2 z-40 mb-2 max-h-[min(60dvh,26rem)] w-[min(20rem,calc(100vw-2rem))] -translate-x-1/2 overflow-y-auto rounded-2xl bg-surface/95 p-2 shadow-soft ring-1 ring-line backdrop-blur">
      <div className="flex items-center justify-between px-2.5 pb-1 pt-1">
        <p className="text-xs uppercase tracking-widest text-muted">Audio</p>
        <button type="button" onClick={onClose} className="rounded-full p-1 text-muted hover:text-cream" aria-label="Close">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
      {role === 'youtube' ? (
        <p className="px-2.5 pb-2 text-xs text-muted">Use the ⚙ and CC buttons in the YouTube player (enlarge the screen first).</p>
      ) : role === 'viewer' ? (
        <p className="px-2.5 pb-2 text-xs text-muted">{hostName} picks the audio track for the film they’re streaming.</p>
      ) : audio.length > 1 ? (
        audio.map((a) => (
          <Option key={a.id} selected={a.enabled} onClick={() => chooseAudio(a.id)}>
            {a.label}
          </Option>
        ))
      ) : mkv?.audio?.length > 1 ? (
        <>
          {mkv.audio.map((a) => (
            <Option key={a.number} selected={a.isDefault} disabled>
              {a.label}
            </Option>
          ))}
          <p className="px-2.5 pb-2 text-[11px] text-muted">
            {canSwitchAudio
              ? 'This file’s other audio tracks aren’t playable in this browser.'
              : 'This browser can only play the default track. To switch in Chrome or Edge, open chrome://flags, turn on “Experimental Web Platform features”, and restart the browser. Safari switches tracks as-is.'}
          </p>
        </>
      ) : (
        <p className="px-2.5 pb-2 text-xs text-muted">{audio.length === 1 || mkv?.audio?.length === 1 ? 'This film has one audio track.' : 'No other audio tracks.'}</p>
      )}

      <p className="border-t border-line px-2.5 pb-1 pt-3 text-xs uppercase tracking-widest text-muted">Subtitles</p>
      {role === 'youtube' ? null : (
        <>
          {canLoad && (
            <Option selected={!subs && progress == null} onClick={subtitlesOff}>
              Off
            </Option>
          )}
          {canLoad &&
            mkv?.subtitles?.map((t) => (
              <Option key={t.number} selected={subs?.id === `mkv:${t.number}`} disabled={!t.supported || progress != null} note={t.supported ? null : 'Picture subtitles (PGS/VobSub) can’t be shown — load an .srt instead'} onClick={() => run(pickEmbedded(t))}>
                {t.label}
              </Option>
            ))}
          {subs?.id.startsWith('file:') && (
            <Option selected onClick={() => {}}>
              {subs.label}
            </Option>
          )}
          {progress != null && (
            <div className="px-2.5 py-2">
              <p className="text-xs text-muted">Reading subtitles from the film… {Math.round(progress * 100)}%</p>
              <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-white/10">
                <div className="h-full bg-peach transition-[width]" style={{ width: `${Math.round(progress * 100)}%` }} />
              </div>
            </div>
          )}
          {canLoad && (
            <>
              <button type="button" onClick={() => fileRef.current?.click()} className="mt-1 flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-left text-sm text-peach hover:bg-white/5">
                <Upload className="h-4 w-4" aria-hidden />
                Load a subtitle file (.srt, .vtt, .ass)
              </button>
              <input
                ref={fileRef}
                type="file"
                accept=".srt,.vtt,.ass,.ssa,text/vtt,application/x-subrip"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  e.target.value = '';
                  if (f) run(loadSubtitleFile(f));
                }}
              />
              <p className="px-2.5 pb-1 text-[11px] text-muted">Subtitles you turn on show for both of you.</p>
            </>
          )}
          {!canLoad && <p className="px-2.5 pb-1 text-[11px] text-muted">{hostName} can turn subtitles on from their side; they’ll show here too.</p>}
          <label className="mt-1 flex items-center justify-between gap-2 rounded-xl px-2.5 py-2 text-sm text-cream hover:bg-white/5">
            Show subtitles on my screen
            <input type="checkbox" checked={showSubs} onChange={(e) => setShowSubs(e.target.checked)} className="h-4 w-4 accent-[var(--color-peach)]" />
          </label>
          {!subs && subText && <p className="px-2.5 pb-1 text-[11px] text-sage">Showing subtitles from the other screen.</p>}
        </>
      )}
    </motion.div>
  );
}
