# NOVA Display Player

Electron + Vite + React + TypeScript scaffold for NOVA Display Player running a Setup window and a fullscreen Output window.

## Requirements
- Node.js 18 or newer
- npm 10 or newer
- Git (for cloning and pushing to the FxSteel/display-nova repo)

## Getting started
```bash
npm install
npm run dev
```

## Building & packaging
```bash
npm run build
npm run dist
```

`npm run dist` outputs macOS `.dmg` and Windows `.nsis` installers via `electron-builder`. Adjust signing/notarization once you add credentials.
