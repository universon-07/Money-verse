/** Discrete easing for the story's animated counters. */
export function stepped(steps: number): (progress: number) => number {
  const count = Number.isFinite(steps) ? Math.max(1, Math.floor(steps)) : 1
  return progress => Math.floor(Math.max(0, Math.min(1, progress)) * count) / count
}
