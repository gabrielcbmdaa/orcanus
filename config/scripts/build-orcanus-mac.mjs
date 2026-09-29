import { execFileSync } from 'node:child_process'
import { getLocalBuildIdentity } from './build-mac-local.mjs'

// Why: this fork installs one host-arch Orca.app on its own Mac. build:mac also packages x64
// dmg/zip artifacts, which need `pnpm install:release` and are never installed here.
// Why --single-arch: these two target macOS 11, whose Swift compatibility libraries the Command
// Line Tools ship for arm64 only, so their universal x86_64 half cannot link here.
const prepareSteps = [
  ['build:desktop'],
  ['build:computer-macos'],
  ['build:keyboard-layout-macos', '--', '--single-arch'],
  ['build:notification-status-macos', '--', '--single-arch'],
  ['ensure:electron-runtime']
]

if (process.platform !== 'darwin') {
  throw new Error('build-orcanus-mac only packages macOS apps.')
}

// Why both installs: an update merged from main can change either lockfile, and build:desktop
// packages the mobile web bundle from mobile/'s own node_modules (as install-mobile-dependencies does in CI).
execFileSync('pnpm', ['install', '--frozen-lockfile'], { stdio: 'inherit' })
execFileSync('pnpm', ['install', '--frozen-lockfile'], { cwd: 'mobile', stdio: 'inherit' })

for (const step of prepareSteps) {
  execFileSync('pnpm', ['run', ...step], { stdio: 'inherit' })
}

// Why the local identity: its -local version is what keeps the updater off upstream releases.
const identity = getLocalBuildIdentity()
console.log(`[build:orcanus] local build version ${identity.version}`)
execFileSync(
  'pnpm',
  [
    'exec',
    'electron-builder',
    '--config',
    'config/electron-builder.config.cjs',
    '--mac',
    'dir',
    `--${process.arch}`,
    // Why ad-hoc: without an identity electron-builder skips signing, leaving only the linker's
    // "Electron" signature with no sealed resources, which Keychain and TCC cannot pin to Orca.
    '-c.mac.identity=-'
  ],
  {
    env: {
      ...process.env,
      ORCA_BUILD_COMMIT: identity.commit,
      ORCA_LOCAL_BUILD_VERSION: identity.version
    },
    stdio: 'inherit'
  }
)
