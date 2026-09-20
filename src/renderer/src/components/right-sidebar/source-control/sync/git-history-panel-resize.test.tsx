// @vitest-environment happy-dom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { TooltipProvider } from '@/components/ui/tooltip'
import { GitHistoryPanel } from './git-history-panel'

afterEach(cleanup)

function renderPanel(height: number, onHeightChange = vi.fn()) {
  render(
    <TooltipProvider>
      <GitHistoryPanel
        state={{ status: 'idle' }}
        collapsed={false}
        height={height}
        onHeightChange={onHeightChange}
        onToggle={vi.fn()}
        onRefresh={vi.fn()}
      />
    </TooltipProvider>
  )
  return { onHeightChange, separator: screen.getByRole('separator', { name: 'Resize commits' }) }
}

describe('GitHistoryPanel resize', () => {
  it('renders the height it is given instead of owning one', () => {
    const { separator } = renderPanel(300)

    expect(separator.getAttribute('aria-valuenow')).toBe('300')
  })

  it('reports a taller panel when the separator is nudged up', () => {
    const { onHeightChange, separator } = renderPanel(300)

    fireEvent.keyDown(separator, { key: 'ArrowUp' })

    expect(onHeightChange).toHaveBeenCalledWith(316)
  })

  it('reports a shorter panel when the separator is nudged down', () => {
    const { onHeightChange, separator } = renderPanel(300)

    fireEvent.keyDown(separator, { key: 'ArrowDown' })

    expect(onHeightChange).toHaveBeenCalledWith(284)
  })

  it('reports the dragged height once on release, not on every pointer move', () => {
    const { onHeightChange, separator } = renderPanel(300)
    separator.setPointerCapture = vi.fn()

    fireEvent.pointerDown(separator, { clientY: 500, pointerId: 1 })
    fireEvent.pointerMove(window, { clientY: 480 })
    fireEvent.pointerMove(window, { clientY: 460 })

    // Why: a store write per pointer move re-renders the whole panel at pointer frequency.
    expect(onHeightChange).not.toHaveBeenCalled()

    fireEvent.pointerUp(window, { clientY: 460 })

    expect(onHeightChange).toHaveBeenCalledTimes(1)
    expect(onHeightChange).toHaveBeenCalledWith(340)
  })

  it('shows the dragged height live while the pointer is down', () => {
    const { separator } = renderPanel(300)
    separator.setPointerCapture = vi.fn()

    fireEvent.pointerDown(separator, { clientY: 500, pointerId: 1 })
    fireEvent.pointerMove(window, { clientY: 480 })

    expect(separator.getAttribute('aria-valuenow')).toBe('320')
  })

  it('clamps the reported height to the panel bounds', () => {
    const { onHeightChange, separator } = renderPanel(510)

    fireEvent.keyDown(separator, { key: 'End' })
    expect(onHeightChange).toHaveBeenLastCalledWith(520)

    fireEvent.keyDown(separator, { key: 'Home' })
    expect(onHeightChange).toHaveBeenLastCalledWith(96)
  })
})
