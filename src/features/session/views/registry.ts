import type { SessionView } from './contract'
import { SheetView } from './SheetView'
import { LedgerView } from './LedgerView'
import { FocusView } from './FocusView'
import { MaterialView } from './MaterialView'

// Layout registry: a new layout is one adapter + one entry here.

export const SESSION_VIEWS: Record<string, { name: string; View: SessionView }> = {
  sheet: { name: 'Sheet', View: SheetView },
  ledger: { name: 'Ledger', View: LedgerView },
  focus: { name: 'Focus', View: FocusView },
  material: { name: 'Material', View: MaterialView },
}

export const DEFAULT_VIEW_ID = 'sheet'

export function resolveViewId(id: unknown): string {
  return typeof id === 'string' && id in SESSION_VIEWS ? id : DEFAULT_VIEW_ID
}
