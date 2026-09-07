import { ipcMain } from 'electron'
import os from 'node:os'

const SYSTEM_INFO_CHANNEL = 'system:info'

export function registerSystemIpc() {
  ipcMain.handle(SYSTEM_INFO_CHANNEL, async () => ({
    platform: process.platform,
    arch: process.arch,
    hostname: os.hostname(),
  }))
}
