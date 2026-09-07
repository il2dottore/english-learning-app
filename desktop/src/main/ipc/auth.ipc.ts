import { ipcMain } from 'electron'

const AUTH_STATUS_CHANNEL = 'auth:status'

export function registerAuthIpc() {
  ipcMain.handle(AUTH_STATUS_CHANNEL, async () => ({ authenticated: false }))
}
