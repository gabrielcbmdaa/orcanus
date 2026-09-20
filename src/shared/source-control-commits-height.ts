export const SOURCE_CONTROL_COMMITS_MIN_HEIGHT = 96
export const SOURCE_CONTROL_COMMITS_DEFAULT_HEIGHT = 256
export const SOURCE_CONTROL_COMMITS_MAX_HEIGHT = 520

// Why `unknown`: the value comes back from persisted JSON, which the user can edit by hand.
export function clampSourceControlCommitsHeight(
  height: unknown,
  fallback = SOURCE_CONTROL_COMMITS_DEFAULT_HEIGHT
): number {
  if (typeof height !== 'number' || !Number.isFinite(height)) {
    return fallback
  }
  return Math.min(
    SOURCE_CONTROL_COMMITS_MAX_HEIGHT,
    Math.max(SOURCE_CONTROL_COMMITS_MIN_HEIGHT, height)
  )
}
