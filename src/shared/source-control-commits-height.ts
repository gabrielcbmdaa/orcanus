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

// Why a third: the commits panel is docked at the bottom of the sidebar, so a tall stored height
// must never squeeze the file list out on a short window. Applied at render and interaction time
// only — the stored height is left alone so a value chosen on a big display survives.
const SOURCE_CONTROL_COMMITS_MAX_VIEWPORT_FRACTION = 0.33

export function resolveSourceControlCommitsViewportHeight(
  height: number,
  viewportHeight: number
): number {
  if (!Number.isFinite(viewportHeight) || viewportHeight <= 0) {
    return height
  }
  const viewportCap = Math.floor(viewportHeight * SOURCE_CONTROL_COMMITS_MAX_VIEWPORT_FRACTION)
  return Math.max(SOURCE_CONTROL_COMMITS_MIN_HEIGHT, Math.min(height, viewportCap))
}
