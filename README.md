# UCaaS / CCaaS Directory & Monitoring Prototype

A single-file, front-end-only prototype of a unified communications / contact-center
directory and supervisor monitoring web app — modeled on products like RingCentral
RingEX and Genesys Cloud. Everything lives in **`index.html`**: markup, styling, and
all application logic, with no build step and no backend.

## Running it locally

No install, no build. Any of these work:

```bash
# simplest — just open it
# double-click index.html, or open it directly in a browser

# or serve it over http://localhost (Node is enough, no deps needed)
npx serve .

# or with Python
python -m http.server 8000
```

If you're using VS Code, the "Live Server" extension's "Go Live" button also works and
auto-reloads on save.

## What's in it

**Directory**
- People, Groups (departments), Roles & permissions, Locations
- A role-based permission system (`PERMS` / `ROLES` / `can()`) that actually gates UI —
  e.g. the Monitoring tab is hidden/locked for roles without the Monitoring permission
- Full person profile drawer: org hierarchy, skills/queues tagging, notes, favourites

**Interactions**
- Call/SMS/video history view with a dialer

**Analytics**
- **Queues** — a live-style queue performance dashboard (chart, right-now tiles, per-queue table)
- **Monitoring** — supervisor tools:
  - All Calls / All Extensions / Groups / Call Queue / Campaign sub-views
  - Live Listen → Whisper → Barge controls on any on-call agent, gated by the matching
    Roles → Monitoring sub-permissions
  - Configurable waiting-caller / service-level alerts, with a cross-page badge
  - "My queues" pinning on the Call Queue picker
  - Click an agent's avatar or name anywhere to open their profile drawer (with a quick
    edit shortcut into the Directory edit page)
- **Agent Activity** — a per-agent, hour-by-hour Online/Offline session timeline with
  device/IP/browser/OS detail on hover, filterable by agent, time range, and status

## Architecture notes

- Everything executes inside one top-level IIFE in a single `<script>` tag. Functions
  freely call others defined later in the file — this works because function
  declarations are hoisted within that one scope.
- All data (people, groups, call stats, queue figures, activity timelines, etc.) is
  **synthetic and deterministically seeded** from existing directory data — there's no
  backend and nothing is fetched over the network. Reload the page and most of it
  regenerates the same way; a handful of UI preferences (theme, last-opened nav section,
  pinned queues, alert thresholds, per-person notes/skills) persist via `localStorage`.
- Light/dark theme is handled by matching literal inline `style="background:#..."`
  strings with CSS attribute selectors scoped under `html[data-theme="dark"]` — not CSS
  custom properties. A new component's colors only get dark-mode treatment if they reuse
  one of the already-handled literal values (see the `<style>` block near the top of the
  file) or declare their own dark-mode rule.
- `rows()` is the single source of truth for the People directory (reads live `<tr>`
  elements, not a JS array) — don't shadow that name in a local scope, several things
  depend on it.

## Known limitations

- Prototype only — no backend, no auth beyond the in-browser role simulation, no real
  telephony. "Listen/Whisper/Barge" and similar actions are simulated and only log a
  toast; see the in-app note on what a real backend integration would need.
- All figures (call volumes, queue stats, activity timelines) are dummy data for
  demonstration, not real telemetry.
