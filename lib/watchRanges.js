// Pure helpers for watch-time tracking (shared by server + tests).
//
// The player reports the ranges it has actually PLAYED (the browser's
// `video.played` TimeRanges), not its position — seeking creates no played
// range, so skipping to the end never counts as watching. The server merges
// those ranges into what it already has and caps how much new coverage one
// save may add by the wall time elapsed since the previous save.

export const COMPLETION_RATIO = 0.9;   // ≥90% of the video actually played = complete
export const MAX_PLAYBACK_RATE = 2.5;  // 2× speed + slack
export const GAIN_SLACK_SECONDS = 20;  // network jitter / first save after play starts
const MERGE_GAP = 1;                   // ranges within 1s are contiguous

// [[start,end], ...] → sorted, clamped, merged, rounded to 0.1s
export function normalizeRanges(input, duration) {
  if (!Array.isArray(input)) return [];
  const max = Number(duration) > 0 ? Number(duration) : Infinity;
  const clean = [];
  for (const r of input.slice(0, 500)) {
    if (!Array.isArray(r) || r.length !== 2) continue;
    let [s, e] = r.map(Number);
    if (!Number.isFinite(s) || !Number.isFinite(e)) continue;
    s = Math.max(0, Math.min(s, max));
    e = Math.max(0, Math.min(e, max));
    if (e - s <= 0) continue;
    clean.push([s, e]);
  }
  clean.sort((a, b) => a[0] - b[0]);
  const out = [];
  for (const [s, e] of clean) {
    const last = out[out.length - 1];
    if (last && s <= last[1] + MERGE_GAP) last[1] = Math.max(last[1], e);
    else out.push([s, e]);
  }
  return out.map(([s, e]) => [Math.round(s * 10) / 10, Math.round(e * 10) / 10]);
}

export function coverage(ranges) {
  return ranges.reduce((sum, [s, e]) => sum + (e - s), 0);
}

// Parts of `incoming` not already covered by `stored` (both normalized).
export function subtractRanges(incoming, stored) {
  const out = [];
  for (const [s0, e0] of incoming) {
    let pieces = [[s0, e0]];
    for (const [s1, e1] of stored) {
      const next = [];
      for (const [s, e] of pieces) {
        if (e1 <= s || s1 >= e) { next.push([s, e]); continue; }
        if (s1 > s) next.push([s, s1]);
        if (e1 < e) next.push([e1, e]);
      }
      pieces = next;
      if (!pieces.length) break;
    }
    out.push(...pieces.filter(([s, e]) => e - s > 0));
  }
  return out;
}

// Merge `incoming` into `stored`, accepting at most `allowance` seconds of
// new coverage (earliest-first). → { ranges, gained, trimmed }
export function mergeWithAllowance(stored, incoming, allowance, duration) {
  const base = normalizeRanges(stored, duration);
  const fresh = subtractRanges(normalizeRanges(incoming, duration), base);
  let budget = Math.max(0, allowance);
  const accepted = [];
  let trimmed = false;
  for (const [s, e] of fresh) {
    if (budget <= 0) { trimmed = true; break; }
    const len = e - s;
    if (len <= budget) { accepted.push([s, e]); budget -= len; }
    else { accepted.push([s, s + budget]); budget = 0; trimmed = true; }
  }
  const ranges = normalizeRanges([...base, ...accepted], duration);
  return { ranges, gained: coverage(ranges) - coverage(base), trimmed };
}

// How much new coverage a save may add, given seconds since the last save.
export function gainAllowance(elapsedSeconds) {
  const elapsed = Number.isFinite(elapsedSeconds) && elapsedSeconds > 0 ? elapsedSeconds : 0;
  return elapsed * MAX_PLAYBACK_RATE + GAIN_SLACK_SECONDS;
}

export function isComplete(coveredSeconds, durationSeconds) {
  return Number(durationSeconds) > 0 && coveredSeconds >= Number(durationSeconds) * COMPLETION_RATIO;
}

// Where to resume: saved position, unless it's in the last few seconds
// (then start over — the student finished or nearly finished it).
export function resumePosition(positionSeconds, durationSeconds, tail = 10) {
  const p = Number(positionSeconds) || 0;
  const d = Number(durationSeconds) || 0;
  if (p <= 3) return 0;
  if (d && p >= d - tail) return 0;
  return p;
}
