import type { Session } from './types'

/** Finished sessions, most recent first — the History list. Abandoned sessions never appear. */
export function listFinished(sessions: Session[]): Session[] {
  return sessions.filter((s) => s.finishedAt !== undefined).sort((a, b) => b.finishedAt! - a.finishedAt!)
}
