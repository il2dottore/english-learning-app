# Desktop Electron

An Electron + React + TypeScript desktop scaffold. The renderer currently displays only `Hello World`.

## Run

```bash
cd desktop
npm install
npm run dev
```

## Build

```bash
npm run typecheck
npm run build
npm run preview
```

## Structure

```text
desktop/
|-- src/
|   |-- main/
|   |   |-- index.ts                    # Electron main process entry point
|   |   |-- windows/                    # BrowserWindow creation
|   |   |-- ipc/                        # Main-process IPC handlers
|   |   |-- services/                   # File and updater services
|   |   \-- utils/                      # Main-process helpers
|   |-- preload/
|   |   |-- index.ts                    # Context-isolated preload entry point
|   |   \-- api.ts                      # Safe renderer-facing IPC API
|   \-- renderer/
|       |-- index.html                  # Renderer HTML entry point
|       \-- src/
|           |-- app/                    # App, router, providers, styles
|           |-- features/               # Feature modules such as auth, users, settings
|           |-- components/             # Shared UI and layout components
|           |-- hooks/                  # Shared React hooks
|           |-- lib/                    # Client and utility helpers
|           |-- stores/                 # Client state stores
|           |-- types/                  # Shared renderer types
|           |-- assets/                 # Renderer assets
|           \-- main.tsx               # React renderer entry point
|-- resources/                          # Application icons
|-- build/                              # Build resources
|-- electron.vite.config.ts             # Electron-Vite configuration
|-- package.json                         # Scripts and dependencies
|-- tsconfig.json                        # TypeScript configuration
|-- .env                                 # Local development environment
\-- README.md                            # Project documentation
```

## Electron binary troubleshooting

If `electron-vite` reports `Error: Electron uninstall`, download the Electron binary again:

```bash
unset ELECTRON_RUN_AS_NODE ELECTRON_NO_ATTACH_CONSOLE
node node_modules/electron/install.js
./node_modules/.bin/electron --version
npm run dev
```
