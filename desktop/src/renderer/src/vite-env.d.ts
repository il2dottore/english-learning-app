/// <reference types="vite/client" />

interface DesktopApi {
  auth: {
    status: () => Promise<{ authenticated: boolean }>
  }
  file: {
    openText: () => Promise<string | null>
  }
  system: {
    info: () => Promise<{ platform: string; arch: string; hostname: string }>
  }
}

interface Window {
  desktopApi?: DesktopApi
}
