import { ipcRenderer } from 'electron'

export const desktopApi = {
  auth: {
    status: () => ipcRenderer.invoke('auth:status') as Promise<{ authenticated: boolean }>,
  },
  file: {
    openText: () => ipcRenderer.invoke('file:open-text') as Promise<string | null>,
  },
  system: {
    info: () => ipcRenderer.invoke('system:info') as Promise<{ platform: string; arch: string; hostname: string }>,
  },
}
