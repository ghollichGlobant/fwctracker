# FWC2026 Sticker Tracker — Redesign Plan

> **Status:** Planning stage — NO files should be modified until this plan is approved.
> **Date:** 2026-05-18
> **Scope:** Full frontend redesign: multi-page architecture, backend-driven data, simplified auth.

---

## 1. Overview

Transform the current single-file encrypted app into a **4-page website** with a public landing page, two public read-only views (Missing / Repeated), and one password-protected management page. All data is fetched from the existing Express/Firebase backend, eliminating localStorage as the source of truth.

### Hardcoded Constants (all pages)

| Constant         | Value                                                        |
| ---------------- | ------------------------------------------------------------ |
| `ALBUM_ID`       | `IH9Jdy8LImq5dXkKHLnh`                                      |
| `API_BASE`       | `https://fwctracker.onrender.com`                            |
| `PASSWORD`       | `facu001`                                                    |

---

## 2. Architecture: Before → After

### Before (current)

```
index.html  (single file, ~2160 lines)
├── Login screen (AES-256-GCM + PBKDF2 encryption)
├── Full album grid (sticker status editing)
├── Stats bar
├── Export / Import / Share / Reset
├── Sync panel (manual push/pull to backend)
└── Data: localStorage (encrypted) + optional cloud sync
```

### After (target)

```
index.html          → Landing page (public)
missing.html        → Missing stickers list (public, read-only)
repeated.html       → Repeated stickers list (public, read-only)
manage.html         → Album management grid (password-protected)

All pages:
├── Data source: Backend API (GET requests)
├── Writes: manage.html only (PATCH to backend)
├── Shared: CSS design system, visual identity
└── No localStorage dependency (stateless frontend)
```

---

## 3. Page Specifications

### 3.1 `index.html` — Landing Page (Public)

**Purpose:** Public-facing dashboard showing overall album completion progress.

**Data source:**
```
GET /api/albums/IH9Jdy8LImq5dXkKHLnh
→ returns { stats: { total, complete, missing, repeated, totalRepeats, progress } }
```

**UI layout:**

```
┌──────────────────────────────────────────────────┐
│  ⚽ FIFA World Cup 2026™ Sticker Tracker         │
│  📋 Facundo's Album                              │
│  (green gradient header with gold border)        │
├──────────────────────────────────────────────────┤
│                                                  │
│  ┌────────────────────────────────────────────┐  │
│  │       OVERALL PROGRESS                     │  │
│  │  ████████████████░░░░░░░  68% (667/980)    │  │
│  │       (large animated progress ring/bar)   │  │
│  └────────────────────────────────────────────┘  │
│                                                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐       │
│  │ ✅ 542   │  │ 🔄 125   │  │ ❌ 313   │       │
│  │ Complete  │  │ Repeated │  │ Missing  │       │
│  └──────────┘  └──────────┘  └──────────┘       │
│                                                  │
│  ┌──────────────────────────────────────────────┐│
│  │  📋 View Missing    (→ missing.html)         ││
│  │  🔄 View Repeated   (→ repeated.html)        ││
│  │  🔐 Manage Album    (→ manage.html)          ││
│  └──────────────────────────────────────────────┘│
│                                                  │
│  footer                                          │
└──────────────────────────────────────────────────┘
```

**Key behaviors:**
- On page load: fetch album stats from backend, render progress.
- Show loading spinner while fetching.
- Show error message if backend unreachable.
- 3 large navigation buttons linking to the other pages.
- No authentication required.
- Auto-refresh stats every 60 seconds (optional, nice-to-have).

**CSS:** Reuse existing design system variables (`--bg-dark`, `--pitch-green`, `--gold`, etc.) and fonts (Russo One, Inter).

---

### 3.2 `missing.html` — Missing Stickers (Public, Read-Only)

**Purpose:** Shareable list of all stickers Facundo still needs.

**Data source:**
```
GET /api/albums/IH9Jdy8LImq5dXkKHLnh/stickers?status=missing
→ returns { count, stickers: [{ code, label, team, teamName, flag, group, foil, status }] }
```

**UI layout:**

```
┌──────────────────────────────────────────────────┐
│  📋 Facundo's Missing Stickers                   │
│  "I need these stickers — can you help?"         │
│  [🏠 Home]  [🖨️ Print]                          │
├──────────────────────────────────────────────────┤
│  Summary: 313 missing · 13 groups · 48 teams     │
├──────────────────────────────────────────────────┤
│  ┌─ Group A ─────────────────────────────────┐   │
│  │ 🇲🇽 Mexico (5 stickers)                  │   │
│  │ [MEX 3][MEX 7][MEX 11][MEX 15][MEX 18]   │   │
│  │ 🇿🇦 South Africa (8 stickers)            │   │
│  │ [RSA 1][RSA 2]...                         │   │
│  └───────────────────────────────────────────┘   │
│  ┌─ Group B ─────────────────────────────...     │
│  ...                                             │
│  footer: read-only notice                        │
└──────────────────────────────────────────────────┘
```

**Key behaviors:**
- Fetch stickers from backend, group client-side by `group` → `team`.
- Sticker cards use grey/slate theme (existing `--missing-bg` / `--missing-border`).
- No click handlers, no edit modals — purely display.
- "Home" button links back to `index.html`.
- "Print / Save as PDF" button for sharing.
- Loading/error states.
- Search box to filter within the page (client-side filter on already-fetched data).

---

### 3.3 `repeated.html` — Repeated Stickers (Public, Read-Only)

**Purpose:** Shareable list of extra stickers Facundo has for trading.

**Data source:**
```
GET /api/albums/IH9Jdy8LImq5dXkKHLnh/stickers?status=repeated
→ returns { count, stickers: [{ code, label, team, teamName, flag, group, foil, status, repeats }] }
```

**UI layout:** Identical structure to `missing.html` but with:
- Orange theme (existing `--repeated-bg` / `--repeated-border`).
- Title: "🔄 Facundo's Repeated Stickers"
- Subtitle: "I have extras of these — want to trade?"
- Each sticker card shows `×{repeats}` badge.
- Summary includes total extra copies count.

**Key behaviors:** Same as `missing.html` — read-only, no auth, printable.

---

### 3.4 `manage.html` — Album Management (Password-Protected)

**Purpose:** The only page with write access. Current grid + editing functionality.

**Data source (read):**
```
GET /api/albums/IH9Jdy8LImq5dXkKHLnh/stickers
→ returns all 980 stickers with full metadata
```

**Data source (write):**
```
PATCH /api/albums/IH9Jdy8LImq5dXkKHLnh/stickers/:code
→ body: { status, repeats }

PATCH /api/albums/IH9Jdy8LImq5dXkKHLnh/stickers  (bulk)
→ body: { stickers: [{ code, status, repeats }] }
```

**Auth gate:**
```
┌──────────────────────────────────────────────────┐
│  🔐 Manage Album                                 │
│  Enter password to access sticker management     │
│                                                  │
│  [ ••••••• ]  [Unlock ⚽]                        │
│                                                  │
│  (error message area)                            │
│  [🏠 Back to Home]                               │
└──────────────────────────────────────────────────┘
```

**After unlock — full album grid (current content):**

```
┌──────────────────────────────────────────────────┐
│  ⚽ Manage Album — Facundo's FWC 2026            │
│  [🏠 Home] [📤 Export] [📥 Import] [🗑️ Reset]    │
├──────────────────────────────────────────────────┤
│  Stats bar: Complete | Repeated | Missing | %    │
├──────────────────────────────────────────────────┤
│  🔍 Search  [All] [Missing] [Complete] [Repeated]│
├──────────────────────────────────────────────────┤
│  Legend: ◻ Missing  ◼ Complete  ◼ Repeated       │
│                                                  │
│  ⭐ Special Stickers (20)     [▾]               │
│  ├── [FWC 1] [FWC 2] [FWC 3] ...                │
│                                                  │
│  ⚽ Group A (80)               [▾]               │
│  ├── 🇲🇽 Mexico (20)                            │
│  │   [MEX 1][MEX 2]...[MEX 20]                  │
│  ...                                             │
│                                                  │
│  (click sticker → modal → set status)            │
│  footer                                          │
└──────────────────────────────────────────────────┘
```

**Auth implementation (simplified):**
```javascript
const MANAGE_PASSWORD = "facu001";
let isUnlocked = false;

function handleUnlock() {
  const input = document.getElementById("passwordInput").value;
  if (input === MANAGE_PASSWORD) {
    isUnlocked = true;
    document.getElementById("loginScreen").classList.add("hidden");
    document.getElementById("appContent").classList.remove("hidden");
    loadAlbumFromBackend();
  } else {
    showError("Wrong password");
  }
}
```

**Key behaviors:**
- Password check is a simple string comparison (hardcoded `facu001`).
- No encryption, no PBKDF2, no session timer, no brute-force protection.
- On unlock: fetch all 980 stickers from backend → build in-memory state → render grid.
- Sticker click → modal → status change → immediate `PATCH` to backend.
- No localStorage for sticker data (backend is single source of truth).
- Export: fetches all stickers, generates JSON file (same format as current).
- Import: reads JSON, bulk PATCHes to backend.
- Reset: bulk PATCHes all stickers to `missing` via backend.
- "Home" button to navigate back to `index.html`.
- No sync panel needed (direct backend connection, no manual push/pull).

---

## 4. Implementation Checklist

### Phase 1: Create shared CSS and constants

- [ ] **4.1** Extract the common CSS design system into comments/shared section at top of each file (or inline, since these are standalone HTML files). Key variables:
  ```css
  --bg-dark: #0f0f1a;  --pitch-green: #1b5e20;  --gold: #ffd600;
  --card-bg: #1a1a2e;  --card-border: #2a2a4a;
  --missing-bg/border;  --complete-bg/border;  --repeated-bg/border;
  ```
- [ ] **4.2** Define shared JS constants at top of each file:
  ```javascript
  const ALBUM_ID = "IH9Jdy8LImq5dXkKHLnh";
  const API_BASE = "https://fwctracker.onrender.com";
  ```

### Phase 2: Build `index.html` (Landing Page)

- [ ] **4.3** Strip current `index.html` completely — rewrite as landing page.
- [ ] **4.4** Add header (same visual identity: green gradient, gold border, Russo One font).
- [ ] **4.5** Add stats display section:
  - Large circular or horizontal progress bar for overall completion.
  - 3 stat boxes: Complete, Repeated, Missing (reuse existing `.stat-box` styling).
- [ ] **4.6** Add 3 navigation buttons (large, prominent):
  - `📋 View Missing` → links to `missing.html`
  - `🔄 View Repeated` → links to `repeated.html`
  - `🔐 Manage Album` → links to `manage.html`
- [ ] **4.7** Implement `fetchStats()`:
  ```javascript
  async function fetchStats() {
    const res = await fetch(`${API_BASE}/api/albums/${ALBUM_ID}`);
    const data = await res.json();
    renderStats(data.stats);
  }
  ```
- [ ] **4.8** Add loading spinner and error fallback.
- [ ] **4.9** Add footer.

### Phase 3: Build `missing.html`

- [ ] **4.10** Create `missing.html` with shared CSS.
- [ ] **4.11** Implement data fetch:
  ```javascript
  async function fetchMissing() {
    const res = await fetch(`${API_BASE}/api/albums/${ALBUM_ID}/stickers?status=missing`);
    const data = await res.json();
    renderStickers(data.stickers);
  }
  ```
- [ ] **4.12** Implement client-side grouping: group stickers by `group` field, then by `team` within each group.
- [ ] **4.13** Render sticker cards (grey/slate theme) — no click handlers.
- [ ] **4.14** Add summary stats bar (count of missing, groups, teams).
- [ ] **4.15** Add search box (client-side filter on fetched data).
- [ ] **4.16** Add "🏠 Home" and "🖨️ Print" buttons in header.
- [ ] **4.17** Add loading/error states.
- [ ] **4.18** Make print-friendly (`@media print` rules).

### Phase 4: Build `repeated.html`

- [ ] **4.19** Create `repeated.html` — structurally identical to `missing.html`.
- [ ] **4.20** Change theme to orange (`--repeated-bg` / `--repeated-border`).
- [ ] **4.21** Change fetch to `?status=repeated`.
- [ ] **4.22** Add `×{repeats}` badge to each sticker card.
- [ ] **4.23** Include total extra copies in summary.

### Phase 5: Build `manage.html`

- [ ] **4.24** Create `manage.html` with password gate.
- [ ] **4.25** Implement simple password check (`facu001` hardcoded string comparison).
- [ ] **4.26** On unlock: fetch all 980 stickers from backend:
  ```javascript
  async function loadAlbum() {
    const res = await fetch(`${API_BASE}/api/albums/${ALBUM_ID}/stickers`);
    const data = await res.json();
    albumState = {};
    data.stickers.forEach(s => {
      albumState[s.code] = { status: s.status, repeats: s.repeats, label: s.label, team: s.team, teamName: s.teamName, flag: s.flag, group: s.group, foil: s.foil };
    });
    render();
  }
  ```
- [ ] **4.27** Port existing render logic (sections, group sections, sticker grid, team blocks).
- [ ] **4.28** Port sticker modal (click → modal → status change).
- [ ] **4.29** On status change: PATCH directly to backend:
  ```javascript
  async function setStatus(status) {
    const repeats = status === "repeated" ? parseInt(document.getElementById("repeatCount").value) || 1 : 0;
    albumState[selectedSticker].status = status;
    albumState[selectedSticker].repeats = repeats;

    await fetch(`${API_BASE}/api/albums/${ALBUM_ID}/stickers/${encodeURIComponent(selectedSticker)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, repeats }),
    });

    render();
    showToast(`${selectedSticker} → ${statusNames[status]}`);
  }
  ```
- [ ] **4.30** Port filter/search functionality.
- [ ] **4.31** Port export (fetches all stickers → JSON download).
- [ ] **4.32** Port import (reads JSON → bulk PATCH to backend in chunks of 100).
- [ ] **4.33** Port reset (confirms → bulk PATCH all stickers to `missing`).
- [ ] **4.34** Add "🏠 Home" button in header.

### Phase 6: Remove deprecated code

- [ ] **4.35** Remove from `manage.html` (compared to current `index.html`):
  - AES-256-GCM / PBKDF2 encryption layer (~200 lines).
  - Session timer / auto-lock / brute-force protection (~80 lines).
  - Sync panel UI and all sync JS (~200 lines).
  - `SPECIAL_STICKERS` and `GROUPS` data arrays (~160 lines) — backend provides this data.
  - `loadState()` / `saveState()` localStorage functions.
  - Blob-based share page generator (`openSharePage()`) — replaced by dedicated pages.
  - Password strength meter / change password flow.
  - `changePassword()`, `togglePasswordVisibility()`, `updateStrengthBar()`.
- [ ] **4.36** Remove from HTML:
  - Sync panel DOM (`#syncPanel`).
  - Session bar (`#sessionBar`).
  - Password confirm field (`#confirmWrap`).
  - Strength bar.
  - "Share Missing" / "Share Repeated" buttons (replaced by dedicated pages).

### Phase 7: Backend adjustments (if needed)

- [ ] **4.37** Verify CORS allows requests from file:// and the deployed origin. Current backend uses `cors()` with defaults (allows all origins) — likely fine.
- [ ] **4.38** Verify `GET /api/albums/:id/stickers?status=missing` returns stickers with full metadata (code, label, team, teamName, flag, group, foil). **Already confirmed from `albums.js` seed logic — sticker docs include all fields.**
- [ ] **4.39** Consider adding a `GET /api/albums/:id/stickers?status=repeated` compound query. **Already supported** — `stickers.js` line 40-42 handles `?status=` filter.
- [ ] **4.40** No backend code changes are expected. All needed endpoints already exist.

### Phase 8: Content-Security-Policy update

- [ ] **4.41** Update CSP `<meta>` tag in each HTML file. The current CSP in `index.html` line 6 restricts `connect-src` to `'self' https://fwctracker.onrender.com http://localhost:3000`. Each new page needs the same `connect-src` allowance.

### Phase 9: Testing

- [ ] **4.42** Test `index.html`: stats load correctly, buttons navigate to correct pages.
- [ ] **4.43** Test `missing.html`: all missing stickers display, grouped correctly, search works, print works.
- [ ] **4.44** Test `repeated.html`: all repeated stickers display with ×count, grouped correctly.
- [ ] **4.45** Test `manage.html`: password gate works, wrong password rejected, `facu001` unlocks.
- [ ] **4.46** Test manage: click sticker → modal → change status → backend updated → grid reflects change.
- [ ] **4.47** Test manage: export downloads correct JSON.
- [ ] **4.48** Test manage: import reads JSON and bulk-patches backend.
- [ ] **4.49** Test manage: reset sets all 980 stickers to missing on backend.
- [ ] **4.50** Test responsive layout on mobile (all 4 pages).
- [ ] **4.51** Test with backend offline — all pages show meaningful error messages.

---

## 5. File Inventory — What Changes

| File                     | Action                 | Description                                                         |
| ------------------------ | ---------------------- | ------------------------------------------------------------------- |
| `index.html`             | **Rewrite**            | Current full app → lightweight landing page with stats + nav        |
| `missing.html`           | **New file**           | Public read-only missing stickers page                              |
| `repeated.html`          | **New file**           | Public read-only repeated stickers page                             |
| `manage.html`            | **New file**           | Password-protected album management (current grid + edit features)  |
| `backend/**`             | **No changes**         | All needed API endpoints already exist                              |

---

## 6. Data Flow Diagrams

### Landing Page
```
Browser                          Backend
  │                                │
  │── GET /api/albums/{id} ───────→│
  │                                │── query Firestore
  │←── { stats: {complete,        │
  │      missing, repeated, ...}} │
  │                                │
  │── render stats dashboard       │
  │── render 3 nav buttons         │
```

### Missing / Repeated Pages
```
Browser                          Backend
  │                                │
  │── GET /api/albums/{id}/       │
  │   stickers?status=missing ───→│
  │                                │── query Firestore with filter
  │←── { count, stickers: [...] } │
  │                                │
  │── group by group → team        │
  │── render read-only cards       │
```

### Manage Page
```
Browser                          Backend
  │                                │
  │── (password gate: facu001)     │
  │                                │
  │── GET /api/albums/{id}/       │
  │   stickers ──────────────────→│
  │                                │── query Firestore (all 980)
  │←── { stickers: [...] }        │
  │                                │
  │── render editable grid         │
  │                                │
  │── (user clicks sticker)        │
  │── PATCH /api/albums/{id}/     │
  │   stickers/{code} ───────────→│
  │     { status, repeats }        │── update Firestore doc
  │←── { updated sticker }        │
  │                                │
  │── re-render grid               │
```

---

## 7. Removed Features

| Feature                             | Reason                                                          |
| ----------------------------------- | --------------------------------------------------------------- |
| AES-256-GCM encryption              | Replaced by simple hardcoded password; data lives on server     |
| PBKDF2 key derivation               | No longer needed                                                |
| Session timer (15-min auto-lock)    | Simple password gate, no session management                     |
| Brute-force lockout                 | Removed for simplicity                                          |
| Password strength meter             | Hardcoded password, not user-created                            |
| Change password flow                | Hardcoded password                                              |
| localStorage sticker storage        | Backend is sole data source                                     |
| Sync panel (push/pull)              | Direct backend connection, no dual-source                       |
| Auto-sync toggle                    | Every write goes to backend immediately                         |
| Blob-based share page generator     | Replaced by dedicated `missing.html` / `repeated.html`         |

---

## 8. Estimated Line Counts (per file)

| File             | CSS  | HTML | JS   | Total   |
| ---------------- | ---- | ---- | ---- | ------- |
| `index.html`     | ~120 | ~40  | ~40  | **~200**  |
| `missing.html`   | ~150 | ~30  | ~80  | **~260**  |
| `repeated.html`  | ~150 | ~30  | ~80  | **~260**  |
| `manage.html`    | ~400 | ~80  | ~350 | **~830**  |
| **Total**        |      |      |      | **~1550** |

Current `index.html` is 2160 lines. The redesign reduces total frontend code by ~28% while adding 2 new pages.

---

## 9. Risks & Mitigations

| Risk                                          | Mitigation                                                        |
| --------------------------------------------- | ----------------------------------------------------------------- |
| Backend down → all pages broken               | Show clear error messages with retry button on every page         |
| CORS issues from local `file://`              | Backend already uses permissive `cors()`. Test with `file://`     |
| Hardcoded password in source = visible        | Acknowledged trade-off. This is a personal tracker, not a bank    |
| Losing data during transition                 | Backend already has all data. No migration needed                 |
| Sticker metadata differs front/back           | Frontend no longer has data arrays — uses backend response as-is  |
| Large sticker fetch on manage page (980 docs) | Firestore subcollection query is fast. Already tested via sync    |

---

## 10. Execution Order

1. **Create `missing.html`** — simplest page, validates data flow pattern.
2. **Create `repeated.html`** — copy of missing with theme/filter changes.
3. **Create `manage.html`** — most complex, port and adapt current grid.
4. **Rewrite `index.html`** — landing page with stats and navigation.
5. **Test all flows end-to-end.**
6. **Delete any leftover artifacts** (old export/import references, sync panel code).

---

## 11. Post-Implementation Verification

After all 4 files are created, verify:

- [ ] `index.html` loads stats from backend and displays progress.
- [ ] All 3 buttons navigate correctly.
- [ ] `missing.html` shows only missing stickers, grouped, read-only.
- [ ] `repeated.html` shows only repeated stickers with ×count badges.
- [ ] `manage.html` rejects wrong password, accepts `facu001`.
- [ ] Manage: clicking a sticker opens modal, changing status persists to backend.
- [ ] Manage: refreshing the page (after re-entering password) shows updated data.
- [ ] Missing/Repeated pages reflect changes made in Manage.
- [ ] All pages render correctly on mobile.
- [ ] All pages show meaningful error when backend is unreachable.
- [ ] "Home" buttons on all sub-pages navigate back to `index.html`.
- [ ] No leftover references to localStorage, encryption, sync panel, or session timer.
