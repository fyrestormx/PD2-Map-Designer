import Dexie, { type Table } from 'dexie'
import type { PersistedWorkspace } from '../types/map'

class Pd2DesignerDatabase extends Dexie {
  workspaces!: Table<PersistedWorkspace, string>

  constructor() {
    super('pd2-map-designer')
    this.version(1).stores({
      workspaces: 'id,updatedAt',
    })
  }
}

const database = new Pd2DesignerDatabase()

export async function saveWorkspace(workspace: PersistedWorkspace): Promise<void> {
  await database.workspaces.put(workspace)
}

export async function loadWorkspace(id = 'latest'): Promise<PersistedWorkspace | undefined> {
  return database.workspaces.get(id)
}
