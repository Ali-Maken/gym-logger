import type { Session, TemplateId } from './types'

/**
 * Count-based graduation. Suggestion only — every template stays startable.
 * Only finished sessions count; abandoned ones never advance the rotation.
 */
export function suggestTemplate(sessions: Session[]): TemplateId {
  const finished = sessions.filter((s) => s.finishedAt !== undefined)
  const week1Count = finished.filter((s) => s.templateId === 'week1').length
  if (week1Count < 3) return 'week1'

  const ab = finished.filter((s) => s.templateId === 'a' || s.templateId === 'b')
  if (ab.length === 0) return 'a'

  const last = ab.reduce((latest, s) => (s.finishedAt! > latest.finishedAt! ? s : latest))
  return last.templateId === 'a' ? 'b' : 'a'
}

/** When the template was last finished, or undefined if never. */
export function lastFinishedAt(sessions: Session[], templateId: TemplateId): number | undefined {
  return sessions
    .filter((s) => s.templateId === templateId && s.finishedAt !== undefined)
    .reduce<number | undefined>((latest, s) => (latest === undefined || s.finishedAt! > latest ? s.finishedAt : latest), undefined)
}
