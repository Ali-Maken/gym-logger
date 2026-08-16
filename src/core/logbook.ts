import { db } from './db'

// THE seam: the only module features may import. Store + methods land in build step 3.

/** Open the database eagerly so first-run seeding happens at startup, not first query. */
export async function initLogbook(): Promise<void> {
  await db.open()
}
