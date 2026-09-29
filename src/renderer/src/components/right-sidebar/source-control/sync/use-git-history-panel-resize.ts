import React, { useCallback, useEffect, useRef, useState } from 'react'
import {
  clampSourceControlCommitsHeight,
  resolveSourceControlCommitsViewportHeight,
  SOURCE_CONTROL_COMMITS_MAX_HEIGHT,
  SOURCE_CONTROL_COMMITS_MIN_HEIGHT
} from '../../../../../../shared/source-control-commits-height'
import { addViewportSizeChangeListener } from '@/hooks/viewport-size-change-listener'

type GitHistoryResizeSession = {
  startY: number
  startHeight: number
  previousCursor: string
  previousUserSelect: string
}

// Why guarded: the panel is also rendered to static markup in a DOM-less test environment.
function readViewportHeight(): number {
  return typeof window === 'undefined' ? 0 : window.innerHeight
}

/**
 * Owns the Commits section's resize gesture. The stored height is a prop; this hook resolves what
 * is actually on screen, keeps a drag local until it is released, and reports the released height.
 */
export function useGitHistoryPanelResize({
  collapsed,
  height,
  onHeightChange
}: {
  collapsed: boolean
  height: number
  onHeightChange: (height: number) => void
}): {
  handleResizeKeyDown: (event: React.KeyboardEvent<HTMLDivElement>) => void
  maxHeight: number
  panelHeight: number
  startResize: (event: React.PointerEvent<HTMLDivElement>) => void
} {
  const resizeSessionRef = useRef<GitHistoryResizeSession | null>(null)
  // Why a draft: writing every pointer move to persisted ui state would re-render the whole
  // panel at pointer frequency; the drag stays local and only the released height is stored.
  const [draftHeight, setDraftHeight] = useState<number | null>(null)
  const draftHeightRef = useRef<number | null>(null)
  const [viewportHeight, setViewportHeight] = useState(readViewportHeight)
  const panelHeight =
    draftHeight ?? resolveSourceControlCommitsViewportHeight(height, viewportHeight)
  // Why refs: the window listeners below must stay mounted for a whole gesture, so the resize
  // callbacks keep empty deps and read the live props here instead.
  const viewportHeightRef = useRef(viewportHeight)
  const heightRef = useRef(height)
  const onHeightChangeRef = useRef(onHeightChange)
  useEffect(() => {
    viewportHeightRef.current = viewportHeight
    heightRef.current = height
    onHeightChangeRef.current = onHeightChange
  })

  useEffect(() => addViewportSizeChangeListener(() => setViewportHeight(readViewportHeight())), [])

  const resolveHeight = useCallback(
    (raw: number): number =>
      resolveSourceControlCommitsViewportHeight(
        clampSourceControlCommitsHeight(raw),
        viewportHeightRef.current
      ),
    []
  )

  const stopResize = useCallback((): void => {
    const session = resizeSessionRef.current
    if (!session) {
      return
    }
    resizeSessionRef.current = null
    document.body.style.cursor = session.previousCursor
    document.body.style.userSelect = session.previousUserSelect
    const draft = draftHeightRef.current
    draftHeightRef.current = null
    setDraftHeight(null)
    if (draft !== null && draft !== heightRef.current) {
      onHeightChangeRef.current(draft)
    }
  }, [])

  const handleResizePointerMove = useCallback(
    (event: PointerEvent): void => {
      const session = resizeSessionRef.current
      if (!session) {
        return
      }
      const next = resolveHeight(session.startHeight + session.startY - event.clientY)
      draftHeightRef.current = next
      setDraftHeight(next)
    },
    [resolveHeight]
  )

  useEffect(() => {
    window.addEventListener('pointermove', handleResizePointerMove)
    window.addEventListener('pointerup', stopResize)
    window.addEventListener('pointercancel', stopResize)
    window.addEventListener('blur', stopResize)
    return () => {
      window.removeEventListener('pointermove', handleResizePointerMove)
      window.removeEventListener('pointerup', stopResize)
      window.removeEventListener('pointercancel', stopResize)
      window.removeEventListener('blur', stopResize)
      stopResize()
    }
  }, [handleResizePointerMove, stopResize])

  const startResize = useCallback(
    (event: React.PointerEvent<HTMLDivElement>): void => {
      if (collapsed) {
        return
      }
      event.preventDefault()
      resizeSessionRef.current = {
        startY: event.clientY,
        startHeight: panelHeight,
        previousCursor: document.body.style.cursor,
        previousUserSelect: document.body.style.userSelect
      }
      document.body.style.cursor = 'row-resize'
      document.body.style.userSelect = 'none'
      event.currentTarget.setPointerCapture(event.pointerId)
    },
    [collapsed, panelHeight]
  )

  const handleResizeKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>): void => {
      const step = event.shiftKey ? 32 : 16
      if (event.key === 'ArrowUp') {
        event.preventDefault()
        onHeightChange(resolveHeight(panelHeight + step))
      } else if (event.key === 'ArrowDown') {
        event.preventDefault()
        onHeightChange(resolveHeight(panelHeight - step))
      } else if (event.key === 'Home') {
        event.preventDefault()
        onHeightChange(SOURCE_CONTROL_COMMITS_MIN_HEIGHT)
      } else if (event.key === 'End') {
        event.preventDefault()
        onHeightChange(resolveHeight(SOURCE_CONTROL_COMMITS_MAX_HEIGHT))
      }
    },
    [onHeightChange, panelHeight, resolveHeight]
  )

  return {
    handleResizeKeyDown,
    maxHeight: resolveSourceControlCommitsViewportHeight(
      SOURCE_CONTROL_COMMITS_MAX_HEIGHT,
      viewportHeight
    ),
    panelHeight,
    startResize
  }
}
