import { describe, expect, it } from 'vitest'
import {
  clampSourceControlCommitsHeight,
  resolveSourceControlCommitsViewportHeight,
  SOURCE_CONTROL_COMMITS_DEFAULT_HEIGHT,
  SOURCE_CONTROL_COMMITS_MAX_HEIGHT,
  SOURCE_CONTROL_COMMITS_MIN_HEIGHT
} from './source-control-commits-height'

describe('source control commits height', () => {
  it('keeps an in-range height unchanged', () => {
    expect(clampSourceControlCommitsHeight(300)).toBe(300)
  })

  it('applies the panel height bounds', () => {
    expect(clampSourceControlCommitsHeight(10)).toBe(SOURCE_CONTROL_COMMITS_MIN_HEIGHT)
    expect(clampSourceControlCommitsHeight(5_000)).toBe(SOURCE_CONTROL_COMMITS_MAX_HEIGHT)
  })

  it('falls back for non-finite or non-numeric stored values', () => {
    expect(clampSourceControlCommitsHeight(undefined)).toBe(SOURCE_CONTROL_COMMITS_DEFAULT_HEIGHT)
    expect(clampSourceControlCommitsHeight(Number.NaN)).toBe(SOURCE_CONTROL_COMMITS_DEFAULT_HEIGHT)
    expect(clampSourceControlCommitsHeight('300')).toBe(SOURCE_CONTROL_COMMITS_DEFAULT_HEIGHT)
    expect(clampSourceControlCommitsHeight(undefined, 400)).toBe(400)
  })

  it('caps the rendered height to a third of the viewport', () => {
    // Why: the panel is rendered inside the sidebar, so a tall stored height must not eat the
    // file list on a short window. 900 * 0.33 = 297.
    expect(resolveSourceControlCommitsViewportHeight(520, 900)).toBe(297)
  })

  it('keeps a stored height that already fits the viewport', () => {
    expect(resolveSourceControlCommitsViewportHeight(300, 2_000)).toBe(300)
  })

  it('never renders below the minimum, even on a tiny viewport', () => {
    expect(resolveSourceControlCommitsViewportHeight(300, 200)).toBe(
      SOURCE_CONTROL_COMMITS_MIN_HEIGHT
    )
  })

  it('falls back to the stored height when the viewport is unmeasurable', () => {
    expect(resolveSourceControlCommitsViewportHeight(300, 0)).toBe(300)
    expect(resolveSourceControlCommitsViewportHeight(300, Number.NaN)).toBe(300)
  })
})
