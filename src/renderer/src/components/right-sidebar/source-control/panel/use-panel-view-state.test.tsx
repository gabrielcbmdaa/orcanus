// @vitest-environment happy-dom
import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { useAppStore, type AppState } from '@/store'
import { useSourceControlPanelViewState } from './use-panel-view-state'

let initialState: AppState

beforeEach(() => {
  initialState = useAppStore.getState()
})

afterEach(() => {
  useAppStore.setState(initialState, true)
})

// Why subscribe here: in the app the worktree context hook owns this subscription and hands the
// value down; the test stands in for it so a store write re-renders the hook the same way.
function renderViewState(activeWorktreeId: string | null = 'wt-1') {
  return renderHook(
    ({ id }: { id: string | null }) => {
      const sourceControlCommitsExpanded = useAppStore((s) => s.sourceControlCommitsExpanded)
      const sourceControlCommitsHeight = useAppStore((s) => s.sourceControlCommitsHeight)
      return useSourceControlPanelViewState({
        activeWorktreeId: id,
        settings: useAppStore.getState().settings,
        sourceControlCommitsExpanded,
        sourceControlCommitsHeight,
        setSourceControlCommitsHeight: useAppStore.getState().setSourceControlCommitsHeight,
        setSourceControlCommitsExpanded: useAppStore.getState().setSourceControlCommitsExpanded,
        updateSettings: useAppStore.getState().updateSettings
      })
    },
    { initialProps: { id: activeWorktreeId } }
  )
}

describe('useSourceControlPanelViewState commits section', () => {
  it('starts collapsed when nothing was persisted', () => {
    const { result } = renderViewState()

    expect(result.current.isGitHistoryExpanded).toBe(false)
    expect(result.current.collapsedSections.has('history')).toBe(true)
  })

  it('persists the toggle so a remount restores the expanded section', () => {
    const first = renderViewState()
    act(() => first.result.current.toggleSection('history'))
    expect(useAppStore.getState().sourceControlCommitsExpanded).toBe(true)
    // Why unmount: the panel is torn down whenever another sidebar tab is shown.
    first.unmount()

    const second = renderViewState()

    expect(second.result.current.isGitHistoryExpanded).toBe(true)
    expect(second.result.current.collapsedSections.has('history')).toBe(false)
  })

  it('keeps the commits section expanded across a worktree switch', () => {
    const { result, rerender } = renderViewState('wt-1')
    act(() => result.current.toggleSection('history'))

    rerender({ id: 'wt-2' })

    expect(result.current.isGitHistoryExpanded).toBe(true)
  })

  it('reads the commits height from ui state and persists a resize', () => {
    const { result } = renderViewState()
    expect(result.current.gitHistoryHeight).toBe(256)

    act(() => result.current.setGitHistoryHeight(300))

    expect(useAppStore.getState().sourceControlCommitsHeight).toBe(300)
    expect(result.current.gitHistoryHeight).toBe(300)
  })

  it('keeps the commits height across a worktree switch', () => {
    const { result, rerender } = renderViewState('wt-1')
    act(() => result.current.setGitHistoryHeight(300))

    rerender({ id: 'wt-2' })

    expect(result.current.gitHistoryHeight).toBe(300)
  })

  it('still resets the other collapsed sections on a worktree switch', () => {
    const { result, rerender } = renderViewState('wt-1')
    act(() => result.current.toggleSection('staged'))
    expect(result.current.collapsedSections.has('staged')).toBe(true)

    rerender({ id: 'wt-2' })

    expect(result.current.collapsedSections.has('staged')).toBe(false)
  })
})
