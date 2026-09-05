# DoMi Roadmap — parked features

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
