# DoMi Roadmap — parked features

## POMO skirmish integration (time block → POMO timer)

A pink pomo button on every time block in the planner starts a **POMO
skirmish**: a custom-interval session sequence sized to the block's length,
auto-chained (Auto Mode). First cross-repo feature — POMO-side work
(`omarchy-plugin-POMO`) is the prerequisite. S/M/L default pomodoros are
untouched; skirmish is an isolated custom phase, not a POMO level.

### Interval math (computed in DoMi from block `durationMin`)

- Sessions `N = max(1, floor(durationMin / 30))`, break fixed at 5m,
  `focusMin = (durationMin − 5·N) / N` (rounded, slack lands in the last
  session). The skirmish fills the block exactly; clean multiples of 30
  naturally produce 25/5 — a 60-min block → exactly 2 × (25m focus + 5m
  break), a 70-min block → 2 × (30m + 5m).

### Recommended design

**POMO side (`omarchy-plugin-POMO`, prerequisite):**
- Add `IpcHandler` (target `user.POMO`) in `BarWidget.qml` with
  `skirmish(focusMin, breakMin, count, label)`: run the explicit intervals
  auto-chained (same semantics as `autoAdvance`), count down the session
  budget, then return to idle. S/M/L modes, their settings, and idle-pill
  behavior stay exactly as-is.
- **Lighter break handling**: planner-started skirmishes skip the enforced
  break gate (that gate remains POMO's always-on invariant only for default
  pomodoros). Skirmish breaks are lightweight — pill shows the break
  countdown, `notify-send` at transitions, no blocking dialog.
- Verified invocation (`omarchy-shell:59` wraps it with a 2s timeout):
  `qs ipc -n -p "$OMARCHY_PATH/shell" call -- user.POMO skirmish <focusMin> <breakMin> <count> "<label>"`

**DoMi side:**
- `server/block-sync.mjs`: `POST /pomo/skirmish {blockId}` → reads blocks.json,
  computes the intervals, spawns the `qs ipc` call (child_process), returns the
  computed plan.
- `src/components/planner/BlockDetails.tsx`: pink "Start POMO skirmish — 2 ×
  25m + 5m" button showing the computed plan; pink = `#F7768E` (POMO pill
  brand color).
- `src/components/planner/DayColumn.tsx` grid chips: small pink pomo glyph in
  the existing hover affordance row (same pattern as the toggle/× buttons).
- Phase 2 (optional): QML panel agenda rows call the same `qs ipc` via
  `Process` — no server needed.

### Open questions (answer these before starting)

1. **Stats logging**: do skirmish focus minutes log into POMO's Today/Total
   buckets (they're real focus minutes), or stay out of the default stats?
2. **Feedback in DoMi**: fire-and-forget v1 (POMO pill shows the countdown) —
   rec — or blocks show a "running" state (requires POMO publishing state
   somewhere DoMi can read), or do blocks show skirmish progress?

### Prior work this builds on

- `qs ipc call` path verified from `omarchy-shell` (`qs ipc -n -p
  "$OMARCHY_PATH/shell" call -- …`), and `omarchy-shell shell toggle
  user.POMO` proves cross-plugin IPC works.
- POMO engine already has auto-chaining semantics (`autoAdvance`) and a
  verified restart/IPC workflow (`omarchy restart shell`,
  `omarchy-shell shell listPlugins | grep POMO`).
- DoMi: `durationMin` on every block, block-sync endpoint precedent, and the
  hover-button pattern in `DayColumn.tsx`.

## iCal export / calendar feed

Push DoMi time blocks out as an iCalendar feed so calendar apps can consume them.

### Recommended design (Option A): block-sync generates + serves the feed

- On every `POST /blocks`, regenerate `~/.local/state/domi/calendar.ics` and
  serve it at `GET http://localhost:5175/calendar.ics` with
  `Content-Type: text/calendar`
- Hand-rolled VEVENT generation (~50 lines in `server/block-sync.mjs`);
  the .ics format for our flat events needs no library — keeps the project
  zero-dependency
- Local calendar apps (GNOME Calendar, Thunderbird, khal/Meru…) subscribe to
  the URL; updates propagate automatically on every block edit

### Key mappings

| .ics field | source |
| --- | --- |
| `UID` | `<block.id>@domi` — stable across updates so subscribers apply changes/deletes |
| `DTSTAMP` | file `updatedAt` |
| `DTSTART`/`DTEND` | `date` + `startMinute`, floating local time (e.g. `20260904T115500`), end = start + `durationMin` |
| `SUMMARY` | resolved `title` (exporter already joins `todos[].text` for task-linked blocks) |
| `DESCRIPTION` | block `description` |
| `RRULE` | not needed yet — `recurrence` is always `null` in current data/UI |

Floating times are correct for local consumers in America/Chicago; if the feed
ever reaches Google, they get interpreted in that calendar's timezone.

### Open questions (answer these before starting)

1. **Consumer**: local desktop app only (Option A suffices), or phone/Google
   Calendar? Google's servers cannot reach `localhost` — that would require
   CalDAV (Option C) or a reachable host.
2. **Direction**: one-way export (DoMi is source of truth), or two-way
   (calendar edits flow back)? Two-way means full CalDAV client work: auth,
   UID lifecycle, diffing, deletion propagation — much larger build.
3. **Scope of feed**: all blocks forever vs future-only. Current dataset is
   tiny; regenerate full snapshot each POST.

### Deferred alternatives

- **B. File only**: just write `calendar.ics` next to blocks.json, no endpoint.
  Simpler, but consumers need manual re-import unless they support file
  subscriptions. (Subset of A — A writes the file anyway.)
- **C. CalDAV push (two-way)**: run Radicale locally or push to
  Nextcloud/Google. Only worth it if phone calendar sync is required.

### Prior work this builds on

- `useBlockExporter` already ships resolved task titles to blocks.json
  (`src/App.tsx` exportBlocks memo) — SUMMARY is ready to use
- block-sync pattern (zero-dep `node:http`, CORS, in-place state writes under
  `~/.local/state/domi/`) extends naturally: add one endpoint + one writer

## Confirmation for task deletion

Deleting is currently instant in four places — TodoItem's hover trash, the
planner rail's "Delete task" button, TagManager's tag delete, and
BlockDetails — and `App.deleteTodo` cascades: the task's time blocks are
removed and its week-queue memberships are pruned. A confirmation step
guards against accidental loss.

### Open questions (answer these before starting)

1. **UX**: inline two-step (trash click → red "Confirm?" that auto-resets
   after ~4s), modal dialog spelling out the cascade ("its time blocks are
   removed too"), or delete-now + undo toast holding the removed data ~5s.
2. **Scope**: tasks only, or also tags (deletion strips the tag from every
   task) and blocks.

### Prior work this builds on

- `deleteTodo` (`src/App.tsx`) already owns the full cascade (todos, blocks,
  weekly plans) — an undo variant would snapshot its inputs.
- Delete buttons in `TodoItem.tsx`, `TodoDetails.tsx`, `TagManager.tsx`,
  `BlockDetails.tsx` are all one-line `onClick` call sites.
