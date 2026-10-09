# progress.md — Active Ledger & State Tracking

This file tracks development states, architectural configurations, and upcoming modular milestones. AI agents must read this file before starting tasks and update it immediately upon session completion.

---

## Project Status Summary
* **Project Name:** daily-practice-sheet (Modular Educational Worksheet Generator)
* **Objective:** Generates print-ready multi-topic PDF sheets (a user selected number of unique pages at a time) using a client-side high-DPI Canvas-to-jsPDF execution pipeline. Each page is split horizontally into two matching independent half-pages featuring a rigid 2x2 layout matrix of modular learning quadrants.
* **Current Phase:** Phase 2 — Module Expansion

---

## Feature Roadmap & Progress Tracker

### 1. Foundation & Structural Protocols
* [x] Initialize repo with custom TS, `esbuild`, `concurrently`, and `servor` build pipelines.
* [x] Establish layout contracts and structural interfaces (`WorksheetLayout.ts`).
* [x] Implement the 3x high-DPI scaling execution pipeline (`canvas.toDataURL` -> `doc.addImage`).

### 2. Core Quadrant Plug-in Modules (`src/topics/` or `src/modules/`)
* [x] **ClockQuadrant:** Analog clock dialer supporting telling/setting modes with vector hands calculations and frame prompt panels.
* [x] **SubtractionQuadrant:** Standard vertical arithmetic layout with 1st, 2nd, and 3rd-grade difficulty parameters.
* [x] **AdditionQuadrant:** Standard vertical arithmetic layout with 1st, 2nd, and 3rd-grade difficulty parameters.
* [x] **KanaQuadrant:** Syllable reading tracing layer loading external master reference guides with hand-drawing grids.
* [x] **FractionsQuadrant:** Dynamic circular slice partition generator painting slate-grey tracking diagrams.
* [x] **Randomization & Difficulty Matrix:** A first pass at creating a randomized worksheet.
* [x] **Geography Module (Seven Continents):** `geographyQuadrant.ts` loads a 110m world TopoJSON and `ISO-3166.csv`, joins them on ISO country code, and highlights one continent's countries. It renders to SVG in the DOM for all seven continents, and preloads map data in `main.ts` so that everything displays correctly.
* [x] **Geography Module (Seven Continents):** Checked that the map draws to the worksheet when a pdf is generated (confirmed by hand, 2026-10-08).
* [ ] **Geography Module (Seven Continents):** Draw Russia split between Europe and Asia along the Ural Mountains and the Ural River. If a split is not possible, put Russia entirely in Asia. Notes for whoever picks this up:
    * `assignContinent` sorts countries by the UN `region` column of `ISO-3166.csv`, and the 110m TopoJSON holds Russia as one shape (numeric code 643). Confirm which continent it lands in today; the UN grouping most likely files it under Europe.
    * A split cuts one country shape in two, so continents can no longer be built by sorting whole countries. Candidate routes: pre-split the Russia geometry in `scripts/compile-geography.ts` along a hand-drawn boundary (the Ural Mountains, then the Ural River down to the Caspian Sea), or draw Russia twice and clip each copy with a canvas clip path. Boolean polygon intersection is not in the current dependencies, and AGENTS.md forbids adding packages without approval.
    * The Ural River also runs through Kazakhstan, which is often treated as transcontinental. Yes, this stays wholly in Asia.
    * The fallback (all of Russia in Asia) is a one-entry override in the continent assignment, much like `CONTINENT_BY_UNNUMBERED_NAME`.
    * Needs a `plan.md` and human validation first.
* [x] **Randomization & Difficulty Matrix:** Improve this algorithm. Done 2026-10-08, see the session ledger. No quadrant type repeats within a half-sheet while four or more topics are selected; with fewer, repeats are spread evenly. Topics rotate fairly across half-sheets. Hiragana deals five kana, each twice per ten appearances; continents deal seven, each twice per fourteen.

### 3. UI Layer & Core Application Orchestration
* [x] Build interactive multi-topic checkbox matrix allowing users to configure topic inclusions. Selection now drives the generated page (`TOPIC_KEYS` in `types.ts`).
* [ ] Build a selector allowing users to decide how many pages of worksheets to generate.
* [ ] Build frequency assignment controller weights (how often a chosen topic appears across the selected sheets).
* [ ] Render native HTML5 Canvas live browser previews updating reactively before PDF generation.
* [ ] Bind full batch worksheet export sequence to compile, sequence, overlay vector boundaries, and trigger immediate browser download.
* [ ] Separate Exercise Title and Exercise Type to permit possibility of offering this worksheet generator in other languages in the future. This means each exercise has a name/id/definition within the code, and then a display title to the user that can be shown in a range of possible languages.

### 4. Code Tidyness, Architecture Decisions
* [ ] Switch all files from class-based to function-based.
* [ ] Find more shared functions that can be pulled into a utility file and reused across multiple other files.

---

## Core Architectural Decisions & Context
* **Horizontal Split Rule:** Each page splits perfectly at 396pt with an ornamental decoration line separating two matching half-pages. Each half contains 4 quadrants (`EXERCISE_WIDTH: 266pt`, `EXERCISE_HEIGHT: 155pt`).
* **Strict Monochrome:** Code must only utilize black `#000000`, white `#FFFFFF`, and slate grey `#D1D5DB`/`#999999`.

---

## Active Session Ledger (Agent Log)

### [YYYY-MM-DD] — Task (Assigned To)
* **Status:**
* **Accomplished:**
* **Open Issues:**

### 2026-10-08 - Topic selection wired to a single randomized page (Claude)
* **Status:** Implemented; awaiting human type check, build, and manual verification.
* **Accomplished:**
    * `types.ts`: added `TOPIC_KEYS` and `TopicKey` as the single list of topics.
    * `main.ts`: `localState` is now `Record<TopicKey, number>`; topic buttons build from `TOPIC_KEYS`; "Make Randomized Page" passes the selected topics to the generator and stays disabled while nothing is selected; intro copy no longer mentions 20 sheets.
    * `randomization-and-difficulty-generator.ts`: the pool draws from selected topics only; `generateWorkbookBatch` takes `selectedTopics` and builds one page (`SHEETS_PER_BATCH`); `setTime` and `tellTime` both route to `createClockExercise`, choosing the mode through the parity of the index passed in; added `createGeographyExercise` (random continent).
* **Open Issues:**
    * The clock mode is selected through `sheetIndex` parity, a stopgap to replace in the randomization rewrite. (Resolved 2026-10-08, see the randomization rewrite below.)
    * With one page, `sheetIndex` is always 0, so every kana quadrant shows the same character until the randomization rewrite lands. (Resolved 2026-10-08, see the randomization rewrite below.)
    * Geography PDF output remains unchecked: select only "continents", generate, and confirm the map draws.
    * `HIGHLIGHT_FILL` (`#8f8f8f`) differs from the palette in the brief.
    * `educational-worksheet-batch.pdf` filename and the "batch of 20" wording in `projectBrief.md` are unchanged.

### 2026-10-08 - Randomization rewrite: planner, shuffled decks, generator (Claude)
* **Status:** Complete. The human ran `npm run dev:types`, `npx tsx src/randomization-check.ts`, `npm run build` and the manual page checks in the browser; all passed. Not committed to git by Claude.
* **Accomplished:**
    * `types.ts`: added `RandomSource` and `QuadrantTopics`.
    * `shuffled-deck.ts` (new): `shuffleInPlace` (Fisher-Yates) and `createShuffledDeck`. Every aligned run of (items x copies) draws holds each item exactly `copiesPerCycle` times, and no card is dealt twice in a row, cycle seams included.
    * `half-page-planner.ts` (new): `planHalfPages` picks four topics per half-page by fewest uses, then longest wait, then chance, and seats them to repeat as few quadrant positions as possible from the previous half. With four or more topics selected, a half-page never repeats a topic. With fewer, repeats are spread evenly. Across a run, use counts never differ by more than one.
    * `randomization-and-difficulty-generator.ts`: rewritten around the planner and two decks (`createContentDecks`: five kana x 2, seven continents x 2). Cards are dealt in reading order. The clock factory takes `'telling'` or `'setting'` directly. Removed the category pool, `GenerationConstraints`, `ExerciseCategory`, the two clock mode index constants, and the ignored `sheetIndex` parameters. `main.ts` is unchanged.
    * `randomization-check.ts` (new, kept in the repo by decision): run with `npx tsx src/randomization-check.ts`. Covers all 127 topic selections x 30 seeds x 28 half-pages, plus the decks over 200 seeds. Mutation-tested: deliberately broken planner and deck variants were caught. It is not part of the bundle.
    * Decisions confirmed by the human: decks and use counts reset on every click; `setTime` and `tellTime` are separate types and may share a half-page; the check script stays; the ignored `sheetIndex` arguments go.
* **Open Issues:**
    * State resets on every click, so with one page per click the full ten-draw kana cycle never completes within a single batch. `createContentDecks` is exported so a later task can keep decks and use counts alive across clicks (in memory, then local storage). It becomes meaningful once the page-count selector lands.
    * With one or two topics selected, a half-page holds several draws from one deck, so the same kana or continent can appear twice in one half (never adjacent, never more than twice per cycle).
    * The deck is consumed per appearance, not per half-sheet. With five to seven topics selected, hiragana and continents appear in fewer than every half, so a full cycle takes more half-sheets than ten and fourteen.
    * The kana set is fixed at the five vowels (`KANA_CARDS` in the generator). Choosing the range is part of the roadmap's per-topic settings.
    * Clock times, sums and fractions still draw from `Math.random()` inside their own modules; only the planner and decks take the injectable `RandomSource`.
    * The per-topic frequency weights on the roadmap would plug into the planner's ranking (uses divided by weight). Not implemented.
    * Russia needs to be split between Europe and Asia, or placed in Asia. See the Geography To Do above.
    * The button reads "Make Randomized Batch" in `main.ts`; the earlier ledger entry calls it "Make Randomized Page".
    * `educational-worksheet-batch.pdf` filename and the "batch of 20" wording in `projectBrief.md` are unchanged (carried over).
