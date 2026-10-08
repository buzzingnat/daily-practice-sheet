# progress.md — Active Ledger & State Tracking

This file tracks development states, architectural configurations, and upcoming modular milestones. AI agents must read this file before starting tasks and update it immediately upon session completion.

---

## Project Status Summary
* **Project Name:** daily-practice-sheet (Modular Educational Worksheet Generator)
* **Objective:** Generates print-ready multi-topic PDF pages (a user selected number of unique pages at a time) using a client-side high-DPI Canvas-to-jsPDF execution pipeline. Each page is split horizontally into two matching independent half-pages featuring a rigid 2x2 layout matrix of modular learning exercises.
* **Current Phase:** Phase 2 — Exercise Expansion

---

## Feature Roadmap & Progress Tracker

### 1. Foundation & Structural Protocols
* [x] Initialize repo with custom TS, `esbuild`, `concurrently`, and `servor` build pipelines.
* [x] Establish layout contracts and structural interfaces (`worksheet-layout.ts`).
* [x] Implement the 3x high-DPI scaling execution pipeline (`canvas.toDataURL` -> `doc.addImage`).

### 2. Core Exercises (`src/`, currently a flat folder structure)
* [x] **Clock Exercise:** Analog clock dialer supporting telling/setting modes with vector hands calculations and frame prompt panels.
* [x] **Subtraction Exercise:** Standard vertical arithmetic layout with 1st, 2nd, and 3rd-grade difficulty parameters.
* [x] **Addition Exercise:** Standard vertical arithmetic layout with 1st, 2nd, and 3rd-grade difficulty parameters.
* [x] **Kana Exercise:** Syllable reading tracing layer loading external master reference guides with hand-drawing grids.
* [x] **Fractions Exercise:** Dynamic circular slice partition generator painting light grey tracking diagrams.
* [x] **Randomization & Difficulty Matrix:** A first pass at creating a randomized worksheet.
* [x] **Geography Exercise (Seven Continents):** Completed (PDF verification pending). `geographyQuadrant.ts` loads a 110m world TopoJSON and `ISO-3166.csv`, joins them on ISO country code, and highlights one continent with the medium grey. It renders to canvas through the shared 3x pipeline. `main.ts` preloads the map data at startup and previews Africa and Oceania.
* [x] **Geography: verify PDF output.** Confirm the map draws correctly in a generated PDF. The randomizer has no geography category yet, so only the test sheet can exercise it.
* [ ] **Geography (Countries):** Make a country level geography exercise beginning with the countries of North America.
* [ ] **Randomization & Difficulty Matrix:** Improve this algorithm. It should output something that never repeats a learning exercise type within a half-page. Set Time and Tell Time are separate activities. Each top half or bottom half should have distinct activities. If fewer than four total activity types are selected by the user, then leave quadrants of the page empty rather than fill them incorrectly. It should try and cycle through the activities in a smart way as well. The generator must take its inputs from the user's topic selection (`localState`), which it currently ignores. It also currently hardcodes 20 pages, which needs to be corrected.
* [ ] **Dashed Tracing Vector Engine:** Replace static images in the writing exercises with programmatic Canvas tracing paths (`context.setLineDash([4, 4])`) that draw light-grey guide strings or stroke direction arrows without relying on asset file downloads.
* [ ] **Multi-Operation Math Exercise:** Extend the math engine to handle variable multi-digit addition equations, carry tracking indicators, or simple multiplication boxes.
* [ ] **Clock Engine Enhancements:** Add custom interval settings (locks to hour blocks, 15-minute quarters, or exact 5-minute ticks) to match a child's learning stage.
* [x] **Empty Quadrant** Make a blank quadrant to use when fewer than 4 exercises are selected.
* [ ] **Cadence Design:** Cadences count appearances of a topic, not half-pages, because a topic skips half-pages whenever more than four topics are selected. Hiragana: ten appearances cover five kana twice each. Continents: fourteen appearances cover each continent twice (a full cycle is seven). Never exceed the requested page count. When the final cycle is partial, draw its items without replacement from those not yet shown in that cycle. Hiragana splits into eight groups of five (the vowels plus seven consonant rows), then the three "y" characters, two "w" characters and the lone "n". These groupings offer cadence options.
* [ ] **Hiragana Focused Sheets** The user should have an option to select several characters to focus on, and perhaps have a mode that turns the whole worksheet into just hiragana on all of the exercises.

### 3. UI Layer & Core Application Orchestration
* [ ] *Partially complete* Build interactive multi-topic toggle buttons allowing users to configure topic inclusions.
* [ ] Build a selector allowing users to decide how many pages of worksheets to generate.
* [ ] Build frequency assignment controller weights (how often a chosen topic appears across the selected pages).
* [ ] *Partially complete* Render native HTML5 Canvas live browser previews updating reactively before PDF generation.
* [ ] *Partially complete* Bind full batch worksheet export sequence to compile, sequence, overlay vector boundaries, and trigger immediate browser download.
* [ ] Separate Exercise Title and Exercise Type to permit possibility of offering this worksheet generator in other languages in the future. This means each exercise has a name/id/definition within the code, and then a display title to the user that can be shown in a range of possible languages.
* [ ] Add decorative elements to the printed sheets. Flourishes outlining each half of the page. Vines or floral motifs dividing the quadrants. Discuss and come up with a couple of design options, then implement one.

### 4. Code Tidiness, Architecture Decisions
* [ ] *Partially complete* Rename source files to kebab-case (for example `clock-exercise.ts`). Done: `addition-exercise.ts`, `asset-manager.ts`, `clock-exercise.ts`, `fractions-exercise.ts`, `generate-pdf-batch.ts`, `geography-exercise.ts`, `kana-exercise.ts`, `randomization-and-difficulty-generator.ts`, `run-test.ts`,   `subtraction-exercise.ts`, `worksheet-layout.ts`. Remaining: `hiraganaTracing-font.js`. Need to go through all files and check that exported names rename with the files (`createClockQuadrant` to `createClockExercise`). `createKanaExercise` now exists, all others must get checked.
* [x] Convert `AdditionQuadrant`, `KanaQuadrant` and `PlaceholderQuadrant` from classes to factories.
* [x] Unify factory parameter order. Fractions takes `(title, grade)` and Subtraction takes `(grade, title)`. Settled and implemented. The decision is `(grade, title)` in the grade-based exercises. Kana and Clock will get dealt with later.
* [x] Type Fractions' `gradeLevel` as `GradeLevel`.
* [ ] In Fractions, fix the denominator-1 case, which yields 1/1. The fix is to remove the vertical line across the radius of the circle to leave a full, shaded circle for the 1/1 case.
* [ ] In Addition, fix the 1st-grade carry-avoidance branch, which can set the bottom number to 0 and produce problems like `7 + 0`.
* [ ] Consolidate shared types into `types.ts`: `ExerciseCategory`, `ClockType`, `ClockTitle`, `Continent`, `ExampleSpecification`.
* [ ] Finish `main.ts` cleanup: throw instead of `return Error`, batch-button feedback and error handling, `Promise.allSettled` in `initializeApp`, and use `KANA_IMAGE_URL`.
* [ ] Split any existing larger files into files less than 200 lines. As of 2026-10-08, this includes `main.ts` and `geography-exercise.ts`
* [ ] Add testing. Research to find three options, choose between them with the human's help, and then add the chosen testing framework. Start by creating a very simple, basic test. Build out from there.
* [ ] Refactor existing files over 200 lines to match the code length requirements of the project.

---

## Core Architectural Decisions & Context
* **Types:** `types.ts` is a leaf file with no imports, which avoids circular dependencies.
* **Constants:** `constants.ts` is a leaf file with no imports, which avoids circular dependencies.
* **Map Data:** Loaded once at startup and cached. Quadrant rendering stays synchronous.
* **Image Data:** The Kana master chart image follows the same rule as map data. `main.ts` preloads it at startup through `getSharedImage(KANA_IMAGE_URL)`. `createKanaExercise` reads it with `getSharedImageSync` and throws an `Error` if it is not cached. There is no render-time fetch, no ready callback, and no placeholder fallback.
* **Invalid Exercise Input:** Factories validate their inputs when built and throw `Error` rather than logging a warning and rendering a broken quadrant. Kana rejects characters absent from the chart, including the empty string, which would otherwise match a blank chart entry.
* **Kana Palette Exceptions:** The Kana tracing box frames use `#000000` for contrast. The dotted center crosshair keeps the default `butt` line cap, because round caps close up the dash gaps on a `[2, 2]` pattern. This is a deliberate exception to the round-cap rule in `AGENTS.md`, which is written for solid geometry lines.

---

## Active Session Ledger (Agent Log)

### 2026-10-01 — Documentation alignment (Claude)
* **Status:** Done
* **Accomplished:** Reviewed `agents.md`, `projectBrief.md`, `progress.md` against the source files. Recorded palette, file-layout and TypeScript version decisions.
* **Open Issues:** Brief still lists the geography fill as `#D1D5DB`. Geography PDF check pending.

### 2026-10-07 — Documentation review and alignment (Claude)
* **Status:** Done
* **Accomplished:** Reviewed `AGENTS.md`, `projectBrief.md` and `progress.md` against the source. Resolved palette, vocabulary and spelling decisions. Recorded the empty-quadrant rule, the cadence-counting rule and the `-exercise` rename suffix. Confirmed `ClockQuadrant.ts` is already functional.
* **Open Issues:** `fractionsQuadrant.ts` does not yet match the settled parameter order or `GradeLevel` typing. Clock uses an off-palette navy. `HIGHLIGHT_FILL` in `geographyQuadrant.ts` needs checking against `#999999`. Whether exported names rename with the files (`createClockQuadrant` to `createClockExercise`) is undecided.

### 2026-10-08 — Addition and Kana style refactor (Claude)
* **Status:** Done. Typecheck and browser verification performed by the project owner as files were swapped in.
* **Accomplished:**
    * Converted Addition from a class to a factory function in `addition-exercise.ts`, with a standalone problem-generation function modeled on Subtraction. Parameter order is `(gradeLevel, title)`. Renamed shorthand identifiers to whole words. Recolored the answer box from `#CCCCCC` to `#D1D5DB`. Added `lineCap = 'round'` to the equation line. Corrected off-by-one range comments.
    * Converted Kana from a class to a factory function, `createKanaExercise`, in `kana-exercise.ts`. Split rendering into `findSpritePosition`, `drawHiraganaGuide` and `drawTracingMatrix`. Hoisted chart measurements to module constants (`HIRAGANA_CHART_ORDER`, `FIRST_SPRITE_LEFT` and company). Removed the render-time image fetch, the ready callback, the `renderApp` import, the placeholder fallback and the debug logging, in line with the data-loading rule.
    * Moved Kana character validation from a render-time `console.warn` to a factory-time `Error`, and closed the blank-entry loophole for empty strings.
    * Aligned Kana colors with the palette: watermark and crosshair to `#D1D5DB`, pronunciation note to `#000000`. The project owner then set the tracing frames to `#000000` and returned the crosshair to `butt` caps (see Core Architectural Decisions).
    * Updated file references in this document to the kebab-case names.
    * Clock uses only `#000000` and `#999999`.
    * Fractions has the parameter order and `GradeLevel` fixes.
    * `HIGHLIGHT_FILL` in `geography-exercise.ts` is `#999999`.
    * `AGENTS.md` has a note on the dotted-line cap exception.
    * `PlaceholderQuadrant` and `ClockQuadrant` have been converted from classes to factories. `BlankExercise` has also been added.
    * The `kana-exercise.ts` and `main.ts` import cycle has been resolved by placing the constant in a `constants.ts` leaf file.
* **Open Issues:** Addition's 1st-grade branch can produce a zero addend.
