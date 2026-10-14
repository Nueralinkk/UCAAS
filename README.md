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
- **Monitoring** — supervisor tools, laid out as a tab strip (All Calls, All Extensions,
  Groups, Call Queue, Chat Queue, Campaign), each with its own title + one-line
  description; the Call Queue/Campaign picker and the Summary on/off toggle live at the
  right end of that same strip:
  - A persistent **KPI wallboard** (Calls waiting, Online users, Offline users, Users
    on call) stays visible across every sub-tab, not just one
  - Per-agent **Supervise controls** — Listen, Whisper, Barge, and Takeover as a 4th
    escalation step — shown only for agents currently on a call. Barge/Takeover are
    further limited to agents who actually need it (out of adherence or reading as
    frustrated); escalation is one-way (once barged in, the only options are Stop or
    Takeover)
  - Starting Whisper, Barge, or Takeover opens an **AI Copilot dialog**: call details,
    issue summary, caller history, and adherence on the left; a tabbed Copilot/Summary/
    Transcript/Notes/Contact assistant (simulated chat — ask it about sentiment,
    adherence, or next steps) on the right. Listen stays silent and doesn't open it
  - Simulated **AI sentiment** per live call (positive/neutral/frustrated, scored
    -100 to +100) and a **schedule adherence** badge per agent, with a configurable
    adherence threshold in Alerts
  - A compact **AI Alert pill** next to the page title — one click to barge straight
    into a flagged call; with more than one flagged call it becomes a dropdown listing
    each one, with per-agent and "Dismiss all" actions
  - Configurable waiting-caller / service-level / adherence **alert thresholds**, with
    a nav-rail badge showing the active alert count and clickable chips that jump
    straight to the affected queue
  - Card/table view toggle on All Extensions (a responsive card grid by default)
  - CSV, print-to-PDF, and Excel (`.xls`) export, shared across All Calls, All
    Extensions, and Agent Activity
  - "My queues" pinning on the Call Queue picker
  - Every Listen/Whisper/Barge/Takeover start/stop is logged to the same per-person
    Activity log used elsewhere, viewable via a history icon or inside the Copilot
    dialog
  - Click an agent's avatar or name anywhere to open their profile drawer (with a quick
    edit shortcut into the Directory edit page)
- **Agent Activity** — Individual/Team mode toggle:
  - **Individual** — a per-agent, hour-by-hour Online/Offline session timeline with
    device/IP/browser/OS detail on hover, filterable by agent, time range, and status.
    Distinguishes a real gap during the scheduled shift ("No action") from an empty
    hour outside it ("Outside shift"); shows a totals panel (session counts + minutes
    per status) and the agent's adherence badge next to the picker
  - **Team** — the same per-agent summary numbers (adherence, online/offline sessions
    and time) for everyone at once in one table; click an agent to drop into their
    Individual timeline
  - Both views share the CSV/PDF/Excel export

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
- The whole app runs at `zoom: 0.9` on `<body>`, paired with `width/min-height:
  111.112%` (1/0.9) so the shrunk page still fills the real viewport instead of
  leaving a gap. That 111.112 factor is baked into every `calc(111.112vh - Npx)`
  height used throughout (nav rail, `<main>`, modals, Monitoring, Agent Activity) — if
  the zoom level ever changes, those `calc()` values need to change with it.

## Known limitations

- Prototype only — no backend, no auth beyond the in-browser role simulation, no real
  telephony. "Listen/Whisper/Barge" and similar actions are simulated and only log a
  toast; see the in-app note on what a real backend integration would need.
- All figures (call volumes, queue stats, activity timelines) are dummy data for
  demonstration, not real telemetry.
