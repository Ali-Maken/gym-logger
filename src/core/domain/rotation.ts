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
