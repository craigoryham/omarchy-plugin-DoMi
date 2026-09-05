# DoMi Roadmap — parked features

## Master/weekly task scheduling

Two-tier planning: the current task list becomes the **master list**, and users
load tasks into a per-**week** list that the time-block planner works from.

### Recommended design

- **Data**: new `domi-weekly-plans` localStorage state —
  `{ [weekKey]: string[] }` where weekKey is the Monday `dateKey`
  (e.g. `2026-09-07`); no `Todo` type change; past weeks persist as history.
  Weeks are Monday-based, matching `startOfWeek()` in
  `src/components/planner/date.ts`.
- **Master list (Tasks tab)**: each TodoItem gets an "Add to this week" toggle
  in its action row; tasks in the current week show an active badge. The list
  itself stays the full inventory.
- **Planner (Plan tab)**: the sidebar queue source changes from "all
  unscheduled tasks" to "this week's loaded tasks, minus completed and
  scheduled"; heading becomes "This week's tasks". Grid-click task creation
  auto-joins the current week's list.
- **Bootstrap migration**: on first run (no `domi-weekly-plans` key), seed the
  current week with all incomplete, unscheduled tasks so the queue doesn't
  empty out.

### Open questions (answer these before starting)

1. **Week rollover**: auto carry-over incomplete tasks into the new week
   (classic weekly-review flow) vs fresh week every time (old lists remain
   viewable history) vs manual move only.
2. **Queue scope**: always the current week's list, or follow the planner's
   cursor when navigating to other weeks.
3. **Completed tasks in queue**: hide entirely (current behavior) or show
   completed-this-week dimmed at the bottom for weekly review.

### Prior work this builds on

- The TodoDetails queue-editing batch — weekly queue tasks get edited through
  that panel (inline/full editing lives there, not in new queue markup).
- `unplannedTodos` derivation in `TimeBlockPlanner.tsx` (`!completed` and
  `!scheduledTaskIds.has(id)`) is the shape the weekly filter replaces.

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
