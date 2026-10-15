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
* [x] **Randomization & Difficulty Matrix:** `half-page-planner.ts` seats four topics per half-page (no repeats with four or more topics selected; use counts never differ by more than one). `shuffled-deck.ts` deals kana, continents and each region's countries twice per cycle with no adjacent repeats. Tested in `tests/unit/half-page-planner.test.ts` and `tests/unit/shuffled-deck.test.ts`: all topic selections, deck sizes 1 to 46.

### 3. UI Layer & Core Application Orchestration
* [x] Multi-topic checkbox matrix driven by `TOPIC_KEYS` in `types.ts`.
* [x] Per-topic settings panels (`topic-settings.ts`, `topic-settings-panel.ts`): level radios for arithmetic and fractions, row chips for hiragana, region chips for countries, with summaries on the topic buttons.
* [x] Print-size selector (`print-size.ts`, `print-size-panel.ts`): 1 to 20 half-pages, stepper, quick picks, sheet diagram, live caption. An odd count leaves the last page half-filled.
* [x] PDF export: batch compile, vector overlays and browser download (`generate-pdf-batch.ts`).
* [ ] Frequency assignment controller weights (how often a chosen topic appears across the selected sheets). Plugs into the planner's ranking as uses divided by weight.
* [ ] Native HTML5 Canvas live browser previews updating reactively before PDF generation (only example quadrants exist today).
* [x] Persist settings in local storage: selected topics, per-topic settings and print size, one key per setting (`saved-settings.ts`). Done 2026-10-13.
* [ ] Persist deck state (kana, continents, each region's countries) across clicks and reloads. Decks still reset on every click. Needs a design for what a saved deck does when the chosen rows or regions change.
* [ ] Separate Exercise Title and Exercise Type so the generator can be offered in other languages. Each exercise gets a name/id/definition in code and a separate display title.
* [ ] Rename the "batch" button label and `educational-worksheet-batch.pdf` filename, and fix the "batch of 20" wording in `projectBrief.md`.

### 4. Language and Handwriting Goals
* [ ] **Roman letters (English) print and cursive tracing exercises.** Create tracing exercises for the Latin alphabet in both print (manuscript) and cursive styles, uppercase and lowercase. Notes for whoever picks this up:
    * Follow the kana pattern: a new exercise module, a new `TopicKey`, a settings panel (style: print or cursive; case: upper, lower or both; letter groups, perhaps by stroke family), a letter deck in `createContentDecks`, and a test file in `tests/unit/`.
    * Needs a print-style handwriting font and a cursive font that ship in `public/fonts/` (only `chirufont.ttf` is there today). Licensing and the exact letterforms are for the human to choose. AGENTS.md forbids new packages without approval, and a font file is an asset rather than a package, but confirm first.
    * Each letter wants a baseline, midline and topline guide (cursive adds a slant guide), a faint tracing row, and blank practice space, rendered in `COLOR_LIGHT_GREY` and `COLOR_BLACK` like the kana quadrants. Stroke-order arrows are a stretch goal.
    * The typography spec in AGENTS.md already allows a handwriting font for tracing exercises; update it when the fonts land.
    * Consider letters, then short words, as two difficulty levels.

### 5. Code Tidiness, Architecture Decisions
* [ ] Switch all files from class-based to function-based.
* [ ] Find more shared functions that can be pulled into a utility file and reused across multiple other files.
* [ ] `region-map-data.ts` repeats the topology and CSV URLs and the Russia and France codes from `geography-exercise.ts`. Export them from one place.
* [x] Test framework: Vitest, in `tests/` (`unit/`, `support/`). Done 2026-10-14. See the testing tasks below for what is next.
* [ ] **Testing phase 2, unit gaps:** `topic-settings.test.ts` (`resolveTopicSettings` throws on empty and ignores strays, `summarizeSelection`, every panel default is one of its own options); `kana-rows.test.ts` (46 characters, no duplicates, every row has cards, every card has a hint); `region-map-data.test.ts` (`buildRegionMapData` against the real TopoJSON and CSV in `public/maps/`, pinning target pool sizes); `tests/manual-checklist.md` (PDF page counts, the 396pt cut line, map frames and fonts by eye, private-window storage).
* [ ] **Testing phase 3, DOM tests with jsdom (`tests/dom/`):** `topic-settings-panel` (last chip cannot be switched off, All chip, radio callbacks), `print-size-panel` (stepper limits, typed values clamp, quick picks), and `loadSavedSettings` and the save functions against jsdom `localStorage`, including a storage that throws.
* [ ] **Testing, injectable randomness:** clock times, sums and fractions use `Math.random()` inside their modules, so they cannot be tested deterministically. Pass a `RandomSource` in, then test them.
* [ ] **Testing, canvas drawing (decide later):** jsdom has no canvas. A recording fake of `CanvasRenderingContext2D` could check draw calls; see whether rendering bugs justify it.
* [ ] **Playwright end-to-end tests, only if the project needs them.** Candidates: select topics, generate and download a PDF, check the page count; reload and confirm saved settings return. Requires approval to add the package. Decide after phase 3 whether the DOM tests already cover enough.
* [ ] **Continuous integration:** a GitHub workflow running `npm test`, `npx tsc --noEmit`, `npm run test:types` and `npm run build`.
* [ ] **Rename `src/run-test.ts` to `src/make-example-sheet.ts`,** so "test" means only the suite. Update the import in `main.ts` (and `executeTestSheetGeneration` if the human wants the function renamed too) in the same task, with its own `plan.md`.

---

## Core Architectural Decisions & Context
* **Horizontal Split Rule:** Each page splits perfectly at 396pt with an ornamental decoration line separating two matching half-pages. Each half contains 4 quadrants (`EXERCISE_WIDTH: 266pt`, `EXERCISE_HEIGHT: 155pt`).
* **Strict Monochrome:** Code takes every color from `src/constants.ts` (`COLOR_BLACK`, `COLOR_WHITE`, `COLOR_LIGHT_GREY` `#D1D5DB`, `COLOR_MEDIUM_GREY` `#999999`, `COLOR_PDF_CROSSHAIR`, `COLOR_PDF_PERFORATION`). `public/css/styles.css` still has its own colors; moving them to CSS custom properties is a separate task.
* **Randomization:** The planner and decks take an injectable `RandomSource`. Clock times, sums and fractions still use `Math.random()` inside their own modules.
* **Data loading:** Loaders (`loadGeographyData`, `loadRegionMapData`) run once at startup; render functions stay synchronous.

---

## Current State and Open Issues (as of 2026-10-13)
* **Verification:** Type check, `npm run build` and the old `randomization-check.ts` (now the Vitest suite) passed at each ledger entry. PDF pages for the print-size selector were counted but not eyeballed.
* **Dev setup:** Run the suite with `npm test` (or `npm run test:watch` to watch). The `dev` command also watches both type checks. Installing Vitest once pruned `d3-geo` and two type packages from `node_modules`; if `tsc` suddenly cannot find them, run `npm install`. Node 14 is the shell default, and Vitest and `concurrently` need Node 22.12 or newer. Run `nvm use` first. `npm run dev`, `test`, `test:watch` and `build` run `scripts/check-node-version.mjs` first and stop with a plain message on an old Node (`engines` and `.npmrc` only guard `npm install`, not `npm run`). `npm run build` does not copy `public/` to `dist/`; run `node build.js` or the dev server to refresh the stylesheet.
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

### 2026-10-13 - Settings saved to local storage (Claude)
* **Status:** Implemented. `npx tsc --noEmit`, `npm run build` and `npx tsx src/randomization-check.ts` pass. Checked in the browser: choices were saved, came back after a reload (buttons, panels, summaries, print size, enabled generate button), and malformed or over-limit stored values fell back cleanly. Private-window (blocked storage) behavior was not tried. Not committed.
* **Accomplished:**
    * `saved-settings.ts` (new): one key per setting, versioned in the key name: `daily-practice-sheet.v1.selected-topics`, `daily-practice-sheet.v1.half-page-count`, and `daily-practice-sheet.v1.panel.<topic>` for each configurable topic. `parseSavedSettings` takes a reader function, so it runs under Node; it keeps only known topics (in topic order, up to the six-topic limit), only offered panel values (one for single-choice panels, the default when none survive), and clamps the count. Storage reads and writes are wrapped, so blocked storage yields defaults and a failed write only warns.
    * `main.ts`: `MAXIMUM_TOPIC_COUNT` moved up; `localState`, `panelSelections` and `halfPageCount` start from the saved values; restored topic buttons get `selected` and `aria-pressed`; `renderApp` refreshes availability and panels once at startup; topic clicks, panel changes and print-size changes each save their own key(s). Panel changes save all five panel keys, because the panel callback does not name the topic.
    * `randomization-check.ts`: `checkSavedSettings` covers an empty store, malformed JSON, wrong types, unknown and duplicate values, the topic limit, single-choice trimming, panel defaults and a round trip.
* **Open Issues:** Deck state is not saved (split into its own roadmap item). The check file's name now undersells it; it checks print size and saved settings as well as randomization.

### 2026-10-14 - Vitest framework; randomization-check.ts migrated (Claude)
* **Status:** Done. `npm test` (4 files, 133 passed, 2 skipped on purpose), `npm run test:types`, `npx tsc --noEmit` and `npm run build` pass. Mutation-tested: breaking the planner's use-count ranking failed 2 planner tests, and removing the deck's adjacent-repeat rejection failed 8 deck tests; both were restored. Not committed.
* **Accomplished:**
    * `vitest.config.mts` (root): includes `tests/**/*.test.ts`, Node environment by default. `.mts` because the package is not marked as an ES module.
    * `tests/tsconfig.json`: extends the root config, adds `tests/` and the Vitest config, and points `typeRoots` at the root `node_modules/@types`. The root `tsconfig.json` is unchanged.
    * `tests/support/` (`seeded-random.ts`, `count-by.ts`) and `tests/unit/` (`half-page-planner`, `shuffled-deck`, `print-size`, `saved-settings`). Same rules, seeds and sizes as the old script. The planner's quadrant-repeat rate now prints through `console.info` and asserts only that it stays below 1.
    * `package.json` scripts: `test` (one pass, since changed by the human), `test:watch`, `test:types`, `dev:test-types`; `dev` now runs a fourth watcher for the test type check. `vitest` and `vite` are dev dependencies.
    * `src/randomization-check.ts` deleted. `AGENTS.md` gained a Testing section, the Verification Commands list gained the test commands, and the roadmap gained the testing, Playwright, CI and rename tasks.
* **Open Issues:** `package.json` has both `test:watch` and `test` running Vitest in watch mode; one of them could go. `@types/node` was not added: the phase 1 tests import only from `vitest`. Phase 2 (reading map files with `fs`) will need it, with approval.
