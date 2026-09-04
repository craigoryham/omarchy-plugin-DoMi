# DoMi

A time-block management plugin for [Omarchy](https://github.com/omarchy). DoMi lets you plan your day with time blocks that sync to the Omarchy clock widget.

## Features

- Create and manage time blocks for your day
- Categorize blocks with tags and filters
- Automatic sync to Omarchy's QML clock widget via Block Sync
- Theme-aware — matches your current Omarchy palette via Easel
- Local storage persistence

## Stack

- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS 4
- **Backend:** Node.js (Easel palette server, Block Sync)

## Development

```sh
npm install
npm run dev
```

The app runs on `http://localhost:5173` by default.

Backend services (Easel on `:5174`, Block Sync on `:5175`) can be started with:

```sh
node server/orchestrator.mjs
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server |
| `npm run build` | Type-check and build for production |
| `npm run lint` | Run Oxlint |
| `npm run preview` | Preview production build |
