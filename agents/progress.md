# progress.md — Active Ledger & State Tracking

This file tracks development states, architectural configurations, and upcoming modular milestones. AI agents must read this file before starting tasks and update it immediately upon session completion.

Consolidated 2026-10-13; roadmap reordered and state refreshed 2026-10-14. Entries from 2026-10-08 to 2026-10-12 were folded into the roadmap and the "Current State" section below; resolved open issues were dropped. Git history holds the detail.

---

## Project Status Summary
* **Project Name:** daily-practice-sheet (Modular Educational Worksheet Generator)
* **Objective:** Generates print-ready multi-topic PDF sheets (a user selected number of half-pages, 1 to 20, at a time) using a client-side high-DPI Canvas-to-jsPDF execution pipeline. Each page is split horizontally into two matching independent half-pages featuring a rigid 2x2 layout matrix of modular learning quadrants.
* **Current Phase:** Phase 2 — Module Expansion

---

## Feature Roadmap & Progress Tracker

Open tasks are ordered by priority inside each tier: do them top to bottom unless the human says otherwise. Tiers run from small to large. Ordering reasons are noted where the order is not obvious.

### Done
* [x] **Foundation:** TS, `esbuild`, `concurrently` and `servor` pipelines; layout contracts (`worksheet-layout.ts`); the 3x high-DPI Canvas-to-jsPDF pipeline.
* [x] **Exercises:**
    * Clock (telling and setting), addition and subtraction (single, double and triple digit), and fractions (up to fourths, eighths or twelfths).
    * Hiragana (`kana-exercise.ts`, `kana-rows.ts`): all 46 characters with pronunciation hints, selectable by chart row, traced on a hand-drawing grid with the custom handwriting font.
    * Continents (`geography-exercise.ts`): seven continents from TopoJSON plus `ISO-3166.csv`; Russia split along the Urals (`europe-asia-boundary.ts`); French Guiana joins South America.
    * Countries, "name this country" (`region-map-exercise.ts`, `region-map-data.ts`, `region-views.ts`): seven orthographic region views. A country is askable if it shows at least 20 square pixels (`MINIMUM_TARGET_AREA`); target pools are Africa 35, Asia 24, Central America 11, Europe 31, North America 4, Oceania 3, South America 12. Land outside the region is light grey with no borders.
* [x] **Randomization:** `half-page-planner.ts` seats four topics per half-page (no repeats with four or more topics selected; use counts never differ by more than one). `shuffled-deck.ts` deals kana, continents and each region's countries twice per cycle with no adjacent repeats.
* [x] **UI:** topic buttons driven by `TOPIC_KEYS` in `types.ts`; per-topic settings panels (`topic-settings.ts`, `topic-settings-panel.ts`); print-size selector, 1 to 20 half-pages (`print-size.ts`, `print-size-panel.ts`); PDF export (`generate-pdf-batch.ts`); settings saved to local storage, one key per setting (`saved-settings.ts`).
* [x] **Tooling:** Vitest in `tests/` (`unit/`, `support/`; 4 files, 133 tests); Node version guard (`scripts/check-node-version.mjs`); `pre` hooks that type-check before test and build.
* [x] **Cleanup:** the offline geography compiler (`scripts/compile-geography.ts`, `build:geo`, `d3-geo-projection`) was dead code and was removed 2026-10-14. There are no classes left in `src/`, so the old "switch from class-based to function-based" task is moot.

### Next up: small tasks (each fits one sitting)
1. [ ] **Rename `src/run-test.ts` to `src/make-example-sheet.ts`,** so "test" means only the suite. Update the import in `main.ts`, and rename `executeTestSheetGeneration` and the "Make Test Sheet" button only if the human wants. Own `plan.md`. First because later tasks name things and this one fixes the vocabulary.
2. [ ] **Unit tests for `kana-rows.ts` and `topic-settings.ts`.** `kana-rows.test.ts`: 46 characters, no duplicates, every `KANA_ROWS` entry has cards, every card has a hint. `topic-settings.test.ts`: `resolveTopicSettings` throws on an empty selection and ignores strays, `summarizeSelection`, every panel default is one of its own options. No new dependencies.
3. [ ] **Rename "batch" wording:** the "Make Randomized Batch" button label (`main.ts`) and the `educational-worksheet-batch.pdf` filename (`worksheet-layout.ts`). The output is no longer a fixed batch of 20.
4. [ ] **Share the geography constants:** `region-map-data.ts` repeats the topology and CSV URLs and the Russia and France codes from `geography-exercise.ts`. Export them from one place.
5. [ ] **Continuous integration:** a GitHub workflow running `npm test`, `npm run test:types` and `npm run build` (the first and last already type-check `src/`). Uses `.nvmrc` for the Node version.
6. [ ] **Unit tests for `region-map-data.ts`:** `buildRegionMapData` against the real TopoJSON and CSV in `public/maps/`, pinning the target pool sizes. Needs `@types/node` for `fs`, with approval.
7. [ ] **`tests/manual-checklist.md`:** what only a human with a printer can check (PDF page counts, the 396pt cut line, map frames and fonts by eye, private-window storage).
8. [ ] **Human review of the 41 added hiragana pronunciation hints** by a native speaker or teacher, especially を, ん, ふ and つ.

### Next up: medium tasks (a few sittings, each with a plan)
1. [ ] **Testing phase 3, DOM tests with jsdom (`tests/dom/`):** `topic-settings-panel` (last chip cannot be switched off, All chip, radio callbacks), `print-size-panel` (stepper limits, typed values clamp, quick picks), `loadSavedSettings` and the save functions against jsdom `localStorage`, including a storage that throws. `jsdom` is already a dev dependency.
2. [ ] **Injectable randomness:** clock times, sums and fractions use `Math.random()` inside their modules, so they cannot be tested deterministically. Pass a `RandomSource` in, then test them.
3. [ ] **Frequency weights** (how often a chosen topic appears across the selected sheets). Plugs into the planner's ranking as uses divided by weight; needs a UI control and tests in the planner suite.
4. [ ] **Persist deck state** (kana, continents, each region's countries) across clicks and reloads. Decks reset on every click. Needs a design for what a saved deck does when the chosen rows or regions change.
5. [ ] **Separate Exercise Title and Exercise Type** so the generator can be offered in other languages: each exercise gets a name/id/definition in code and a separate display title. Placed before the large tasks so new topics such as Roman letters are built on it instead of being retrofitted.

### Next up: large tasks
1. [ ] **Roman letters (English) print and cursive tracing exercises.** Tracing for the Latin alphabet in print (manuscript) and cursive, uppercase and lowercase. Notes:
    * Follow the kana pattern: a new exercise module, a new `TopicKey`, a settings panel (style: print or cursive; case: upper, lower or both; letter groups, perhaps by stroke family), a letter deck in `createContentDecks`, and a test file in `tests/unit/`.
    * Needs a print-style handwriting font and a cursive font that ship in `public/fonts/` (only `chirufont.ttf` is there today). Licensing and the exact letterforms are for the human to choose. A font file is an asset rather than a package, but confirm first.
    * Each letter wants a baseline, midline and topline guide (cursive adds a slant guide), a faint tracing row, and blank practice space, in `COLOR_LIGHT_GREY` and `COLOR_BLACK` like the kana quadrants. Stroke-order arrows are a stretch goal.
    * The typography spec in AGENTS.md already allows a handwriting font for tracing exercises; update it when the fonts land.
    * Consider letters, then short words, as two difficulty levels.
2. [ ] **Live canvas previews** updating reactively before PDF generation (only example quadrants exist today). Touches `main.ts` heavily; best after the DOM tests exist.

### Decide later (only if the need shows up)
* [ ] **Playwright end-to-end tests.** Candidates: select topics, generate and download a PDF, check the page count; reload and confirm saved settings return. Needs approval to add the package. Decide after the DOM tests whether they already cover enough.
* [ ] **Canvas drawing tests:** jsdom has no canvas. A recording fake of `CanvasRenderingContext2D` could check draw calls; see whether rendering bugs justify it.
* [ ] **Shared utility extraction:** look for functions that several files repeat and pull them into one utility file.
* [ ] **CSS custom properties** for the colors in `public/css/styles.css`, which cannot import the TypeScript constants.

---

## Core Architectural Decisions & Context
* **Horizontal Split Rule:** Each page splits perfectly at 396pt with an ornamental decoration line separating two matching half-pages. Each half contains 4 quadrants (`EXERCISE_WIDTH: 266pt`, `EXERCISE_HEIGHT: 155pt`).
* **Strict Monochrome:** Code takes every color from `src/constants.ts` (`COLOR_BLACK`, `COLOR_WHITE`, `COLOR_LIGHT_GREY` `#D1D5DB`, `COLOR_MEDIUM_GREY` `#999999`, `COLOR_PDF_CROSSHAIR`, `COLOR_PDF_PERFORATION`). `public/css/styles.css` still has its own colors; moving them to CSS custom properties is a separate task.
* **Randomization:** The planner and decks take an injectable `RandomSource`. Clock times, sums and fractions still use `Math.random()` inside their own modules.
* **Data loading:** Loaders (`loadGeographyData`, `loadRegionMapData`) run once at startup; render functions stay synchronous.

---

## Current State and Open Issues (as of 2026-10-14)
* **Git:** Last commit `e9a90d5` (Vitest migration and Node guard). Uncommitted at the time of writing: removal of `scripts/compile-geography.ts`, `build:geo`, `prebuild:geo` and `d3-geo-projection`; `build` now runs `node build.js` first; a stray comment removed from `geography-exercise.ts`; `readme.md` and these docs updated.
* **Verification:** `npm test` (4 files, 133 passed, 2 skipped on purpose) and `npm run build` pass. PDF pages for the print-size selector were counted but not eyeballed.
* **Commands:** `npm test` runs the suite once; `npm run test:watch` watches. `npm run dev` runs four watchers: build, server, app type check and test type check. `pretest`, `pretest:watch` and `prebuild` run `npm run check-node` and `tsc --noEmit` first, so a type error stops a test or build run. `predev` only checks the Node version, because `dev:types` already runs `tsc --watch`. `npm run build` runs `node build.js` (copies `public/` into `dist/`) and then the minified esbuild bundle.
* **Node:** Needs 22.12 or newer (Vitest, Vite and `concurrently` all do). The shell default here is Node 14, so run `nvm use` first. `engines` and `.npmrc` guard `npm install` only; `scripts/check-node-version.mjs` guards the scripts and is written in plain syntax so an old Node can parse it and complain.
* **Dependencies:** Installing Vitest once pruned `d3-geo` and two type packages from `node_modules`; if `tsc` cannot find them, run `npm install`. `package.json` is `"type": "module"`. `jsdom` is installed but unused until the DOM tests. `@types/node` is not installed directly; tests that read map files with `fs` will need it, with approval.
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
* **Status:** Implemented. `npx tsc --noEmit`, `npm run build` and the (since migrated) randomization check passed. Checked in the browser: choices were saved, came back after a reload (buttons, panels, summaries, print size, enabled generate button), and malformed or over-limit stored values fell back cleanly. Private-window (blocked storage) behavior was not tried. Committed.
* **Accomplished:**
    * `saved-settings.ts` (new): one key per setting, versioned in the key name: `daily-practice-sheet.v1.selected-topics`, `daily-practice-sheet.v1.half-page-count`, and `daily-practice-sheet.v1.panel.<topic>` for each configurable topic. `parseSavedSettings` takes a reader function, so it runs under Node; it keeps only known topics (in topic order, up to the six-topic limit), only offered panel values (one for single-choice panels, the default when none survive), and clamps the count. Storage reads and writes are wrapped, so blocked storage yields defaults and a failed write only warns.
    * `main.ts`: `MAXIMUM_TOPIC_COUNT` moved up; `localState`, `panelSelections` and `halfPageCount` start from the saved values; restored topic buttons get `selected` and `aria-pressed`; `renderApp` refreshes availability and panels once at startup; topic clicks, panel changes and print-size changes each save their own key(s). Panel changes save all five panel keys, because the panel callback does not name the topic.
    * `randomization-check.ts`: `checkSavedSettings` covers an empty store, malformed JSON, wrong types, unknown and duplicate values, the topic limit, single-choice trimming, panel defaults and a round trip.
* **Open Issues:** Deck state is not saved (split into its own roadmap item).

### 2026-10-14 - Vitest framework; randomization-check.ts migrated (Claude)
* **Status:** Done. `npm test` (4 files, 133 passed, 2 skipped on purpose), `npm run test:types`, `npx tsc --noEmit` and `npm run build` pass. Mutation-tested: breaking the planner's use-count ranking failed 2 planner tests, and removing the deck's adjacent-repeat rejection failed 8 deck tests; both were restored. Committed.
* **Accomplished:**
    * `vitest.config.mts` (root): includes `tests/**/*.test.ts`, Node environment by default. `.mts` so Vite loads it as an ES module (it was added before `package.json` gained `"type": "module"`).
    * `tests/tsconfig.json`: extends the root config, adds `tests/` and the Vitest config, and points `typeRoots` at the root `node_modules/@types`. The root `tsconfig.json` is unchanged.
    * `tests/support/` (`seeded-random.ts`, `count-by.ts`) and `tests/unit/` (`half-page-planner`, `shuffled-deck`, `print-size`, `saved-settings`). Same rules, seeds and sizes as the old script. The planner's quadrant-repeat rate now prints through `console.info` and asserts only that it stays below 1.
    * `package.json` scripts: `test` (one pass), `test:watch`, `test:types`, `dev:test-types`; `dev` now runs a fourth watcher for the test type check. `vitest` and `vite` are dev dependencies.
    * `src/randomization-check.ts` deleted. `AGENTS.md` gained a Testing section, the Verification Commands list gained the test commands, and the roadmap gained the testing, Playwright, CI and rename tasks.
* **Open Issues:** `@types/node` was not added: the phase 1 tests import only from `vitest`. Phase 2 (reading map files with `fs`) will need it, with approval.

### 2026-10-14 - Node version guard and type-checked test and build (Human, documented by Claude)
* **Status:** Done and committed (`e9a90d5`). Checked on Node 14.17.5 (stops with a plain message) and Node 24.21.0 (passes).
* **Accomplished:**
    * Running Vitest and `npm run dev` on the shell's default Node 14 failed with syntax errors (`??=` in Vitest, an export form in `yargs` under `concurrently`). `engines` and `engine-strict` did not help, because npm checks them on install, not on `npm run`.
    * `scripts/check-node-version.mjs` exits with "This project needs Node 22.12 or newer ... Run "nvm use" first." on anything older. `package.json` gained `engines`, `"type": "module"`, `.npmrc` (`engine-strict=true`), a `check-node` script, and `pre` hooks on `dev`, `test`, `test:watch`, `build` and `build:geo`. The human extended the hooks (all but `predev`) to also run `tsc --noEmit`.
* **Open Issues:** None carried forward; `build:geo` and the stale `readme.md` were dealt with in the next entry.

### 2026-10-14 - Dead geography compiler removed; readme and roadmap refreshed (Human and Claude)
* **Status:** Done, not committed. `npm test` and `npm run build` pass.
* **Accomplished:**
    * `scripts/compile-geography.ts`, `build:geo`, `prebuild:geo` and `d3-geo-projection` removed. The script had truncated download URLs, used `__dirname` (unavailable under `"type": "module"`) and `any`, wrote to a `src/data/` folder that does not exist, and nothing imported its output; the app loads `public/maps/` at startup.
    * `build` now runs `node build.js` before esbuild, so one command produces a complete `dist/`. `readme.md` rewritten to match (Node 22.12, `npm run dev`, `npm test`, deployment).
    * The roadmap above was reordered into done, small, medium, large and decide-later tiers. Two items were dropped as moot: the class-to-function conversion (`src/` has no classes) and the `projectBrief.md` wording fix (no such file exists).
* **Open Issues:** None new.
