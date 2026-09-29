import { beforeEach, describe, expect, it, vi } from 'vitest'
import type * as UpdaterModule from './updater'
import { loadUpdaterModule, warmUpdaterModule } from './updater-test-module-loader'
import type { UpdateStatus } from '../shared/update-status-types'

const { appMock, autoUpdaterMock, moduleFactories, resetUpdaterMocks } = await vi.hoisted(
  async () => (await import('./updater-test-harness')).createUpdaterMocks()
)

vi.mock('electron', () => moduleFactories.electron())
vi.mock('electron-updater', () => moduleFactories.electronUpdater())
vi.mock('./electron-updater-loader', () => moduleFactories.electronUpdaterLoader())
vi.mock('@electron-toolkit/utils', () => moduleFactories.electronToolkitUtils())
vi.mock('./ipc/pty', () => moduleFactories.ipcPty())
vi.mock('./linux-update-package-type', () => moduleFactories.linuxUpdatePackageType())
vi.mock('./updater-lifecycle-diagnostics', () => moduleFactories.updaterLifecycleDiagnostics())
vi.mock('./updater-changelog', () => moduleFactories.updaterChangelog())
vi.mock('./updater-nudge', () => moduleFactories.updaterNudge())
vi.mock('./update-install-exit-watchdog', () => moduleFactories.updateInstallExitWatchdog())
vi.mock('./updater-prerelease-feed', () => moduleFactories.updaterPrereleaseFeed())
vi.mock('./local-builds/local-build-switch', () => moduleFactories.localBuildSwitch())
vi.mock('./local-builds/local-build-feed-server', () => moduleFactories.localBuildFeedServer())

// Why: the version build-mac-local.mjs stamps on a build made from this fork.
const LOCAL_BUILD_VERSION = '1.4.214-local.1759160000000.c6e2286c87'

warmUpdaterModule()

describe('updater on a locally built app', () => {
  beforeEach(() => {
    resetUpdaterMocks()
  })

  async function startUpdater(
    version: string
  ): Promise<{ send: ReturnType<typeof vi.fn>; updater: typeof UpdaterModule }> {
    appMock.getVersion.mockReturnValue(version)
    vi.useFakeTimers()
    const send = vi.fn()
    const updater = await loadUpdaterModule()
    // Why no last check: an overdue check is what makes setup fire one immediately.
    updater.setupAutoUpdater({ webContents: { send } } as never, {
      getLastUpdateCheckAt: () => null,
      installMode: 'interactive'
    })
    await vi.advanceTimersByTimeAsync(0)
    return { send, updater }
  }

  function lastStatus(send: ReturnType<typeof vi.fn>): UpdateStatus | undefined {
    return send.mock.calls.findLast(([channel]) => channel === 'updater:status')?.[1]
  }

  it('never points the updater at the upstream release feed or checks it on launch', async () => {
    await startUpdater(LOCAL_BUILD_VERSION)

    expect(autoUpdaterMock.setFeedURL).not.toHaveBeenCalled()
    expect(autoUpdaterMock.checkForUpdates).not.toHaveBeenCalled()
  })

  it('answers a manual check with no update instead of offering the upstream release', async () => {
    const { send, updater } = await startUpdater(LOCAL_BUILD_VERSION)

    updater.checkForUpdatesFromMenu()
    await vi.advanceTimersByTimeAsync(0)

    expect(autoUpdaterMock.checkForUpdates).not.toHaveBeenCalled()
    expect(lastStatus(send)).toEqual({ state: 'not-available', userInitiated: true })
  })

  it('still checks the release feed on an official build', async () => {
    await startUpdater('1.4.214')

    expect(autoUpdaterMock.setFeedURL).toHaveBeenCalled()
  })
})
