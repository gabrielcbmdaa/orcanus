import { describe, expect, it } from 'vitest'
import { getDefaultPersistedState } from '../../../shared/constants'
import type { PersistedState } from '../../../shared/persisted-state-types'
import { getPersistedUI } from './ui-state-read'

function stateWithUI(ui: Partial<PersistedState['ui']>): PersistedState {
  const state = getDefaultPersistedState('/home/test')
  return { ...state, ui: { ...state.ui, ...ui } }
}

describe('getPersistedUI source control commits layout', () => {
  it('reads the stored expanded state and height', () => {
    const ui = getPersistedUI(
      stateWithUI({ sourceControlCommitsExpanded: true, sourceControlCommitsHeight: 300 }),
      'terminal'
    )
    expect(ui.sourceControlCommitsExpanded).toBe(true)
    expect(ui.sourceControlCommitsHeight).toBe(300)
  })

  it('defaults to collapsed at the panel default height when nothing is stored', () => {
    const ui = getPersistedUI(getDefaultPersistedState('/home/test'), 'terminal')
    expect(ui.sourceControlCommitsExpanded).toBe(false)
    expect(ui.sourceControlCommitsHeight).toBe(256)
  })

  it('sanitizes hand-edited values instead of trusting the file', () => {
    const ui = getPersistedUI(
      stateWithUI({
        // oxlint-disable-next-line typescript/consistent-type-assertions -- SAFETY: deliberately malformed on-disk value; the reader must coerce it, not trust it.
        sourceControlCommitsExpanded: 'yes' as unknown as boolean,
        sourceControlCommitsHeight: 5_000
      }),
      'terminal'
    )
    expect(ui.sourceControlCommitsExpanded).toBe(false)
    expect(ui.sourceControlCommitsHeight).toBe(520)
  })
})
