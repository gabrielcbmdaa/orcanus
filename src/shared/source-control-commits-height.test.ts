import { describe, expect, it } from 'vitest'
import {
  clampSourceControlCommitsHeight,
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
})
