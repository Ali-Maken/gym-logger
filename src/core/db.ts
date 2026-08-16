import Dexie, { type EntityTable } from 'dexie'
import type { Exercise, Session, Template } from './domain/types'
import { seedExercises, seedTemplates } from './seed'

// Private to core/ — nothing outside may import this module.

export interface Pref {
  key: string
  value: unknown
}

export const db = new Dexie('gym-logger') as Dexie & {
  exercises: EntityTable<Exercise, 'id'>
  templates: EntityTable<Template, 'id'>
  sessions: EntityTable<Session, 'id'>
  prefs: EntityTable<Pref, 'key'>
}

db.version(1).stores({
  exercises: 'id',
  templates: 'id',
  sessions: 'id, startedAt',
  prefs: 'key',
})

// Runs once, inside the version transaction, when the database is first created.
db.on('populate', (tx) => {
  void tx.table('exercises').bulkAdd(seedExercises)
  void tx.table('templates').bulkAdd(seedTemplates)
})
