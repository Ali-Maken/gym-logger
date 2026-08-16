import type { SessionView } from './contract'
import { SheetView } from './SheetView'

// Layout registry: a new layout is one adapter + one entry here.
// Ledger, Focus and Material land in build step 8.

export const SESSION_VIEWS: Record<string, { name: string; View: SessionView }> = {
  sheet: { name: 'Sheet', View: SheetView },
}

export const DEFAULT_VIEW_ID = 'sheet'

export function resolveView(id: unknown): SessionView {
  const entry = (typeof id === 'string' && SESSION_VIEWS[id]) || SESSION_VIEWS[DEFAULT_VIEW_ID]
  return entry.View
}
