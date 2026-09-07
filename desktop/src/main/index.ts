import { app, BrowserWindow } from 'electron'
import { createMainWindow } from './windows/main-window'
import { registerAuthIpc } from './ipc/auth.ipc'
import { registerFileIpc } from './ipc/file.ipc'
import { registerSystemIpc } from './ipc/system.ipc'

function registerIpcHandlers() {
  registerAuthIpc()
  registerFileIpc()
  registerSystemIpc()
}

app.whenReady().then(() => {
  registerIpcHandlers()
  createMainWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createMainWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
