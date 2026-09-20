import { describe, expect, it, vi } from 'vitest'
import { getDefaultPersistedState } from '../../../shared/constants'
import type { PersistedState } from '../../../shared/persisted-state-types'
import { getPersistedUI } from './ui-state-read'
import { updatePersistedUI, type UIUpdateOperations } from './ui-state-update'

function operationsFor(ui: Partial<PersistedState['ui']>): UIUpdateOperations {
  const base = getDefaultPersistedState('/home/test')
  const state: PersistedState = { ...base, ui: { ...base.ui, ...ui } }
  return {
    state,
    removeRetainedBlob: vi.fn(),
    setActiveView: vi.fn(() => false),
    getUI: () => getPersistedUI(state, state.ui.activeView),
    scheduleSave: vi.fn(),
    notifyUIChanged: vi.fn()
  }
}

describe('updatePersistedUI source control commits layout', () => {
  it('stores the expanded state without touching the height', () => {
    const operations = operationsFor({ sourceControlCommitsHeight: 300 })

    updatePersistedUI(operations, { sourceControlCommitsExpanded: true })

    expect(operations.state.ui.sourceControlCommitsExpanded).toBe(true)
    expect(operations.state.ui.sourceControlCommitsHeight).toBe(300)
    expect(operations.scheduleSave).toHaveBeenCalledTimes(1)
  })

  it('clamps an out-of-range height before saving it', () => {
    const operations = operationsFor({ sourceControlCommitsExpanded: true })

    updatePersistedUI(operations, { sourceControlCommitsHeight: 5_000 })

    expect(operations.state.ui.sourceControlCommitsHeight).toBe(520)
    expect(operations.state.ui.sourceControlCommitsExpanded).toBe(true)
  })
})
