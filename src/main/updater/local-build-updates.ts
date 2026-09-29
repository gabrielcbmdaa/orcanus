// Why: build-mac-local.mjs stamps `-local.<timestamp>.<commit>` on this fork's builds, which must
// never take upstream releases — installing one would replace the fork with upstream's app.
export function isLocalBuildVersion(version: string): boolean {
  return /-local\.\d+\./.test(version)
}
