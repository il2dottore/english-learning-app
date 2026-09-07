# Desktop Electron

Electron + React + TypeScript scaffold. Renderer hiện chỉ hiển thị `Hello World`.

## Chạy local

```bash
cd desktop
npm install
npm run dev
```

## Build

```bash
npm run build
npm run preview
```

Các phần `main`, `preload`, IPC, services và feature folders đã được tách sẵn để team mở rộng sau.

## Troubleshooting: Electron uninstall

Nếu `electron-vite` báo `Error: Electron uninstall`, binary Electron chưa được tải đầy đủ. Chạy:

```bash
unset ELECTRON_RUN_AS_NODE ELECTRON_NO_ATTACH_CONSOLE
node node_modules/electron/install.js
./node_modules/.bin/electron --version
npm run dev
```
