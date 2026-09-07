import { dialog, ipcMain } from 'electron'
import { readTextFile } from '../services/file.service'

const OPEN_FILE_CHANNEL = 'file:open-text'

export function registerFileIpc() {
  ipcMain.handle(OPEN_FILE_CHANNEL, async () => {
    const selection = await dialog.showOpenDialog({ properties: ['openFile'] })
    if (selection.canceled || !selection.filePaths[0]) return null
    return readTextFile(selection.filePaths[0])
  })
}
