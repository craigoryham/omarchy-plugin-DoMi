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

## Omarchy plugin

The `user.domi-clock` bar widget (`plugin/user.domi-clock/`) and the `domi-launch`
open-or-focus launcher (`bin/domi-launch`) ship in this repo. Install them with:

```sh
./install.sh
```

This symlinks the widget into `~/.config/omarchy/plugins/user.domi-clock` and the
launcher into `~/.local/bin/domi-launch`, so edits in this repo are live immediately
(Quickshell hot-reloads QML on save). Then register the widget in
`~/.config/omarchy/shell.json`: add `{ "id": "user.domi-clock" }` to `bar.layout.center`
and set `bar.centerAnchor` to `user.domi-clock`. Reload with `omarchy restart shell`.

Launch the app via `domi-launch` (opens in its own workspace, or focuses it if already
open) or directly at `http://localhost:5173`.

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
