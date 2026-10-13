# progress.md — Active Ledger & State Tracking

This file tracks development states, architectural configurations, and upcoming modular milestones. AI agents must read this file before starting tasks and update it immediately upon session completion.

Consolidated 2026-10-13. Entries from 2026-10-08 to 2026-10-12 were folded into the roadmap and the "Current State" section below; resolved open issues were dropped. Git history holds the detail.

---

## Project Status Summary
* **Project Name:** daily-practice-sheet (Modular Educational Worksheet Generator)
* **Objective:** Generates print-ready multi-topic PDF sheets (a user selected number of half-pages, 1 to 20, at a time) using a client-side high-DPI Canvas-to-jsPDF execution pipeline. Each page is split horizontally into two matching independent half-pages featuring a rigid 2x2 layout matrix of modular learning quadrants.
* **Current Phase:** Phase 2 — Module Expansion

---

## Feature Roadmap & Progress Tracker

### 1. Foundation & Structural Protocols
* [x] Initialize repo with custom TS, `esbuild`, `concurrently`, and `servor` build pipelines.
* [x] Establish layout contracts and structural interfaces (`worksheet-layout.ts`).
* [x] Implement the 3x high-DPI scaling execution pipeline (`canvas.toDataURL` -> `doc.addImage`).

### 2. Exercise Modules (flat `src/`, one `*-exercise.ts` per topic)
* [x] **Clock:** Telling and setting modes (`clock-exercise.ts`).
* [x] **Addition and Subtraction:** Vertical layout at single, double and triple digit levels.
* [x] **Fractions:** Circular slice diagrams, up to fourths, eighths or twelfths.
* [x] **Hiragana (`kana-exercise.ts`, `kana-rows.ts`):** All 46 characters with pronunciation hints, selectable by chart row, traced on a hand-drawing grid with the custom handwriting font.
* [x] **Continents (`geography-exercise.ts`):** Seven continents highlighted on a world map from TopoJSON plus `ISO-3166.csv`. Russia is split along the Urals (`europe-asia-boundary.ts`); French Guiana joins South America.
* [x] **Countries / "Name this country" (`region-map-exercise.ts`, `region-map-data.ts`, `region-views.ts`):** Seven orthographic region views (Africa, Asia, Central America, Europe, North America, Oceania, South America). A country is askable if it shows at least 20 square pixels (`MINIMUM_TARGET_AREA`); target pools are Africa 35, Asia 24, Central America 11, Europe 31, North America 4, Oceania 3, South America 12. Land outside the region is light grey with no borders.
* [x] **Randomization & Difficulty Matrix:** `half-page-planner.ts` seats four topics per half-page (no repeats with four or more topics selected; use counts never differ by more than one). `shuffled-deck.ts` deals kana, continents and each region's countries twice per cycle with no adjacent repeats. `randomization-check.ts` (run with `npx tsx src/randomization-check.ts`) covers all topic selections, deck sizes and print-size limits.

### 3. UI Layer & Core Application Orchestration
* [x] Multi-topic checkbox matrix driven by `TOPIC_KEYS` in `types.ts`.
* [x] Per-topic settings panels (`topic-settings.ts`, `topic-settings-panel.ts`): level radios for arithmetic and fractions, row chips for hiragana, region chips for countries, with summaries on the topic buttons.
* [x] Print-size selector (`print-size.ts`, `print-size-panel.ts`): 1 to 20 half-pages, stepper, quick picks, sheet diagram, live caption. An odd count leaves the last page half-filled.
* [x] PDF export: batch compile, vector overlays and browser download (`generate-pdf-batch.ts`).
* [ ] Frequency assignment controller weights (how often a chosen topic appears across the selected sheets). Plugs into the planner's ranking as uses divided by weight.
* [ ] Native HTML5 Canvas live browser previews updating reactively before PDF generation (only example quadrants exist today).
* [ ] Persist settings (topics, per-topic settings, print size) and deck state in local storage. Everything resets on reload, and decks reset on every click.
* [ ] Separate Exercise Title and Exercise Type so the generator can be offered in other languages. Each exercise gets a name/id/definition in code and a separate display title.
* [ ] Rename the "batch" button label and `educational-worksheet-batch.pdf` filename, and fix the "batch of 20" wording in `projectBrief.md`.

### 4. Language and Handwriting Goals
* [ ] **Roman letters (English) print and cursive tracing exercises.** Create tracing exercises for the Latin alphabet in both print (manuscript) and cursive styles, uppercase and lowercase. Notes for whoever picks this up:
    * Follow the kana pattern: a new exercise module, a new `TopicKey`, a settings panel (style: print or cursive; case: upper, lower or both; letter groups, perhaps by stroke family), a letter deck in `createContentDecks`, and a `randomization-check.ts` pass.
    * Needs a print-style handwriting font and a cursive font that ship in `public/fonts/` (only `chirufont.ttf` is there today). Licensing and the exact letterforms are for the human to choose. AGENTS.md forbids new packages without approval, and a font file is an asset rather than a package, but confirm first.
    * Each letter wants a baseline, midline and topline guide (cursive adds a slant guide), a faint tracing row, and blank practice space, rendered in `COLOR_LIGHT_GREY` and `COLOR_BLACK` like the kana quadrants. Stroke-order arrows are a stretch goal.
    * The typography spec in AGENTS.md already allows a handwriting font for tracing exercises; update it when the fonts land.
    * Consider letters, then short words, as two difficulty levels.

### 5. Code Tidiness, Architecture Decisions
* [ ] Switch all files from class-based to function-based.
* [ ] Find more shared functions that can be pulled into a utility file and reused across multiple other files.
* [ ] `region-map-data.ts` repeats the topology and CSV URLs and the Russia and France codes from `geography-exercise.ts`. Export them from one place.
* [ ] Add tests (none exist; `randomization-check.ts` is the only automated check).

---

## Core Architectural Decisions & Context
* **Horizontal Split Rule:** Each page splits perfectly at 396pt with an ornamental decoration line separating two matching half-pages. Each half contains 4 quadrants (`EXERCISE_WIDTH: 266pt`, `EXERCISE_HEIGHT: 155pt`).
* **Strict Monochrome:** Code takes every color from `src/constants.ts` (`COLOR_BLACK`, `COLOR_WHITE`, `COLOR_LIGHT_GREY` `#D1D5DB`, `COLOR_MEDIUM_GREY` `#999999`, `COLOR_PDF_CROSSHAIR`, `COLOR_PDF_PERFORATION`). `public/css/styles.css` still has its own colors; moving them to CSS custom properties is a separate task.
* **Randomization:** The planner and decks take an injectable `RandomSource`. Clock times, sums and fractions still use `Math.random()` inside their own modules.
* **Data loading:** Loaders (`loadGeographyData`, `loadRegionMapData`) run once at startup; render functions stay synchronous.

---

## Current State and Open Issues (as of 2026-10-13)
* **Uncommitted:** `src/print-size.ts` and `src/print-size-panel.ts` are untracked, yet commit `e9e7cd5` ("Users can now select how many pages to create") describes them. A fresh checkout of that commit likely fails to build. Add and commit both files.
* **Verification:** Type check, `npm run build` and `randomization-check.ts` passed at each ledger entry. PDF pages for the print-size selector were counted but not eyeballed.
* **Dev setup:** Node 14 is the shell default; `tsc` and `build.js` need a newer Node (22 was used). Run `nvm use` first. `npm run build` does not copy `public/` to `dist/`; run `node build.js` or the dev server to refresh the stylesheet.
* **Content to review:** The 41 added hiragana pronunciation hints are unreviewed by a native speaker or teacher, especially を, ん, ふ and つ.
* **Geography polish:** Ural boundary points and region frames (Asia, Oceania) are hand-tuned and may want another pass. Foreign coastlines are black; they could be lighter. North America (4) and Oceania (3) target pools are thin, and the 110m file lacks most small Caribbean islands.
* **Planner caveats:** With one or two topics selected, a half-page can hold the same kana or continent twice (never adjacent). With five to seven topics, a full deck cycle takes more half-sheets than the nominal ten or fourteen.

---

## Active Session Ledger (Agent Log)

### [YYYY-MM-DD] — Task (Assigned To)
* **Status:**
* **Accomplished:**
* **Open Issues:**

### 2026-10-13 - Consolidated progress.md (Claude)
* **Status:** Done. Documentation only; no code touched.
* **Accomplished:** Folded the 2026-10-08 to 2026-10-12 ledger entries into the roadmap and "Current State" section. Added the Roman-letter print and cursive tracing goal. Corrected the module section to the flat `src/` layout.
* **Open Issues:** See "Current State and Open Issues". Suggested next steps were given in chat, not recorded as commitments.
