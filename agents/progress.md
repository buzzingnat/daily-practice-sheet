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
* [x] **Foundation:** TS, `esbuild`, `concurrently` and `servor` pipelines; layout contracts (`worksheet/worksheet-layout.ts`); the 3x high-DPI Canvas-to-jsPDF pipeline.
* [x] **Exercises:**
    * Clock (telling and setting), addition and subtraction (single, double and triple digit), and fractions (up to fourths, eighths or twelfths).
    * Hiragana (`exercises/kana/kana-exercise.ts`, `exercises/kana/kana-rows.ts`): all 46 characters with pronunciation hints, selectable by chart row, traced on a hand-drawing grid with the custom handwriting font.
    * Continents (`exercises/geography/geography-exercise.ts`): seven continents from TopoJSON plus `ISO-3166.csv`; Russia split along the Urals (`exercises/geography/europe-asia-boundary.ts`); French Guiana joins South America.
    * Countries, "name this country" (`exercises/geography/region-map-exercise.ts`, `exercises/geography/region-map-data.ts`, `exercises/geography/region-views.ts`): seven orthographic region views. A country is askable if it shows at least 20 square pixels (`MINIMUM_TARGET_AREA`); target pools are Africa 35, Asia 24, Central America 11, Europe 31, North America 4, Oceania 3, South America 12. Land outside the region is light grey with no borders.
* [x] **Randomization:** `generator/half-page-planner.ts` seats four topics per half-page (no repeats with four or more topics selected; use counts never differ by more than one). `generator/shuffled-deck.ts` deals kana, continents and each region's countries twice per cycle with no adjacent repeats.
* [x] **UI:** one card per topic with a live example preview, its settings while chosen, and a six-topic limit (`ui/topic-card.ts`, `ui/topic-settings-panel.ts`, `settings/topic-settings.ts`); a fixed summary bar with the half-page stepper (1 to 20), the summary text, a compact/normal toggle and the Make button (`ui/summary-bar.ts`, `settings/print-size.ts`, `settings/sheet-summary.ts`); a five-color CSS theme (`public/css/theme.css`); settings saved to local storage, one key per setting (`settings/saved-settings.ts`). Done 2026-10-20 (see the ledger). PDF export lives in `worksheet/worksheet-layout.ts` (`buildAndDownloadWorksheetBatch`, downloaded as `practice-sheets.pdf`).
* [x] **Tooling:** Vitest in `tests/` (`unit/`, `dom/`, `architecture/`, `support/`; 36 files, 673 tests passing and 2 skipped as of 2026-10-21); Node version guard (`scripts/check-node-version.mjs`); `pre` hooks that type-check before test and build.
* [x] **More exercises and sheet features (2026-10-15 to 2026-10-21; details in the ledger):**
    * Multiplication with number chips and a two-digit mode; cursive lowercase letters in Montessori sets; rare zeros in first-grade sums.
    * An answer key appended to the PDF, built from the same exercise objects as the worksheets.
    * A cheering animal mascot and a flower border on every half-page.
    * A three-word identifier (`worksheet/half-page-identifier.ts`) turned along each half-page's right edge, so a key matches its worksheet by eye.
    * A message catalog (`src/text/`, English only): topic names, printed titles, level tags, sheet wording and every word in the page itself.
* [x] **Cleanup:** the offline geography compiler (`scripts/compile-geography.ts`, `build:geo`, `d3-geo-projection`) was dead code and was removed 2026-10-14. There are no classes left in `src/`, so the old "switch from class-based to function-based" task is moot.

### Done: tidy `src/` into folders
Phases 1 to 6 and the dependency check are done: the files moved into `settings/`, `ui/`, `generator/`, `worksheet/` and `exercises/` (with `kana/` and `geography/`), the imports were rewritten, and the docs describe the layout. Remaining:
1. [x] **Phase 6: mirror `tests/unit/` to `src/`.** Done 2026-10-14: `tests/unit/{generator,settings,exercises/kana}/`, with `topic-settings/` under `settings/`. `AGENTS.md` and the readme examples use the new paths.
1. [x] **Folder dependency check.** Done 2026-10-14: `tests/architecture/`, with the rules in `tests/support/folder-dependencies.ts`.
2. [x] `plan.md` cleared and the final ledger entry written.

### Done: small tasks (each fits one sitting)
1. [x] **Rename `src/run-test.ts` to `src/make-example-sheet.ts`.** Done. The function `executeTestSheetGeneration` and the "Make Test Sheet" button keep their names; rename them if "test" there is a problem.
2. [x] **Unit tests for `exercises/kana/kana-rows.ts` and `settings/topic-settings.ts`.** Done 2026-10-14.
3. [x] **Rename "batch" wording:** the "Make Randomized Batch" button label (`main.ts`) and the `educational-worksheet-batch.pdf` filename (`worksheet/worksheet-layout.ts`). The output is no longer a fixed batch of 20.
5. [x] **Human review of the 41 added hiragana pronunciation hints** by a native speaker or teacher, especially を, ん, ふ and つ.

### Next up: small tasks (each fits one sitting)
1. [ ] **Share the geography constants:** `exercises/geography/region-map-data.ts` repeats the topology and CSV URLs and the Russia and France codes from `exercises/geography/geography-exercise.ts`. Export them from one place.
2. [x] **Continuous integration.** Done 2026-10-21 and tried on GitHub: a new `.github/workflows/ci.yaml` runs `npm ci`, `npm test`, `npm run test:types` and `npm run build` on pull requests and on pushes to any branch but `main`; `pages.yaml` runs the two test commands before it builds and deploys, so a failing test cannot ship. The check does not yet block a merge: that needs a branch protection rule on GitHub and a pull request workflow (see the ledger).
3. [ ] **Check before merging to `main`, from the command line (a strategy to decide).** The human merges with `git checkout main && git merge <branch_name>` (noted in `notes.txt`), which never meets the pull request check, so `ci.yaml` can only run afterwards and `pages.yaml` can only stop the deploy. Come up with a way to run the same checks before the merge lands, driven by bash, and fold it into that command chain. Starting points to weigh:
    * An npm script, say `verify`, that runs `npm test && npm run test:types && npm run build`, so the chain becomes `npm run verify && git checkout main && git merge <branch_name>`; the merge never starts if a check fails. Run it on the branch, before the checkout, so a failure leaves `main` untouched.
    * A shell function or alias (in `~/.zshrc`) that runs the chain for the current branch, so one command does verify, checkout, merge and, optionally, delete the branch.
    * A git hook for a guarantee that does not depend on remembering the chain: `pre-merge-commit` runs before a merge commit (use `git merge --no-ff`, since a fast-forward makes no merge commit and skips it), and `pre-push` can refuse a push of `main` when `verify` fails. Hooks in `.git/hooks` are not shared; a tracked folder (`core.hooksPath` pointing at, say, `.githooks`) shares them but needs one setup command per clone.
    * Merging on GitHub after a green pull request check, with a branch protection rule, remains the stricter route (see the CI ledger entry); the local chain suits a solo workflow.
    * Open points: what a failure should print, whether the checks should run on the merged result (check out `main`, merge with `--no-commit`, verify, then commit) rather than on the branch alone, and how long the chain takes (about 15 seconds for tests and types, a few more for the build).
4. [ ] **Unit tests for `exercises/geography/region-map-data.ts`:** `buildRegionMapData` against the real TopoJSON and CSV in `public/maps/`, pinning the target pool sizes. Needs `@types/node` for `fs`, with approval.
4. [ ] **`tests/manual-checklist.md`:** what only a human with a printer can check (PDF page counts, the 396pt cut line, map frames and fonts by eye, private-window storage).

### Next up: medium tasks (a few sittings, each with a plan)
1. [ ] **Testing phase 3, DOM tests with jsdom (`tests/dom/ui/`), the rest.** `topic-card.test.ts` and `summary-bar.test.ts` exist (behavior, plus a words check under the marker catalog) and `topic-settings-panel.test.ts` holds only the words check. Still to do: the panel's behavior (last chip cannot be switched off, the All chip, radio callbacks, the zero refusal message) and `loadSavedSettings` and the save functions against jsdom `localStorage`, including a storage that throws. The print-size panel was removed with the old settings stack, so its stepper tests now belong to the summary bar.
2. [ ] **Injectable randomness:** clock times, sums and fractions use `Math.random()` inside their modules, so they cannot be tested deterministically. Pass a `RandomSource` in, then test them.
3. [ ] **Frequency weights** (how often a chosen topic appears across the selected sheets). Plugs into the planner's ranking as uses divided by weight; needs a UI control and tests in the planner suite.
4. [ ] **Persist deck state** (kana, continents, each region's countries) across clicks and reloads. Decks reset on every click. Needs a design for what a saved deck does when the chosen rows or regions change.
5. [x] **Separate Exercise Title and Exercise Type.** Done 2026-10-21 in four phases (commits `9dfacd2` and `d3a088c`): ids stay in code (`TopicKey`, the specification `type`, panel ids and option values), and the words are looked up in `src/text/` when drawn, so new topics such as Roman letters start from the catalog. English only; there is no language selector yet (next task below).
6. [ ] **Generate Exercises in Order** The Kana and Cursive activities have an order to them. The Countries might as well. Make sheets that can be generated in order in addition to the existing random option.
7. [ ] **Simplify the tests.** About 673 tests is far too many for a project this size. Audit `tests/`: merge near-duplicate cases into table-driven ones, drop tests that only restate the implementation or that two other tests already cover, and trim the loop-over-every-seed suites to the rules that have caught real bugs. Keep the architecture tests and the mutation-tested rules. Aim for a suite a person can read in one sitting; record the before and after counts. Needs a short plan first, since AGENTS.md ties tests to rules.
8. [x] **Three-word half-page identifier** that ties each worksheet half-page to its answer key (done 2026-10-21). A hash of what the half-page draws is turned into three words from a fixed list and printed turned 90 degrees along the right edge, on the worksheet and on its key. Stateless: nothing is stored.
    * [ ] **Later, if the sheets come to be generated from a seed:** swap the hash for the reversible "words that encode the seed" approach. The seed's bits are written out as three words (like BIP39), so typing the words into the app regenerates the exact half-page and its key, with no hashing, no lookup and no collisions. It needs every half-page to be fully deterministic from one seed; today problems are chosen with `Math.random()` inside exercises (see the injectable randomness task above), so that task comes first. The seed space is bounded by the word list (a 1,024-word list gives about 30 bits), so the seed would have to fit in it.

9. [ ] **Language selector.** `setLanguage` exists but there is one catalog (English). Add a second language to prove the interface, a saved `language` setting (`settings/saved-settings.ts`), and a control that reloads or rebuilds the page, since words are written into the DOM when components are built. Related gaps to settle first or alongside: single-choice summaries lowercase the label with `toLowerCase()` (English-oriented); longer titles may overflow the 266pt exercise header or the compact cards; non-Latin scripts need fonts; country names, hiragana hints and the cursive emoji words are still English-only content.

### Next up: large tasks
1. [x] **Cursive lowercase letters (Montessori order), without arrows. Done 2026-10-15 (phases 0 to 5).** Topic `cursiveLetters` with six set chips (s m a t, c r i p, b f o g, h j u l, d w e n, k q v x y z), default the first set. Layout: Learning Curve 4.0 Regular family, a bold model on the left, two ruled rows on the right (two solid then two dotted letters, four per line and not joined; then a blank line), mid-gray guide lines. The follow-ups below remain:
    * [ ] **Stroke guides and arrows.** A human designs each letter's stroke order first (Montessori Cursive: bottom-left start, continuous movement); then the sketch is cleaned up and drawn on the first (bold) model only. Saved preference: bold black letters with medium-grey arrows, offset slightly toward the outside of each bend, a number at the start of each stroke.
    * [ ] **Joined practice** (the stage after single letters), then **print letters** as the separate topic `printLetters` (own plan), capitals, and key-word pictures.
    * [x] **Single line for practice.** Done 2026-10-16: the cursive topic has a second panel, "Cursive letters: practice lines", with **One large line** (the new default: three letters, solid, dotted, dotted, tracing only) and **Two lines** (the previous layout). The model panel is two thirds of its old size in both.
    * [x] **Add Image.** First draft done 2026-10-16: an emoji under each model, one per letter, word starting with the letter (`exercises/cursive/cursive-emoji.ts`), drawn in grays. The user will hand-pick the final pictures; a few are weak fits (see the ledger).
2. [x] **Live canvas previews.** Mostly covered by the card grid (2026-10-20): each card draws an example quadrant and redraws it when its settings change. What remains is the Preview PDF step below.
3. [ ] **Preview PDF step.** Today "Make" goes straight to a downloaded PDF. Add a step between: the finished layout (every half-page, with its border, mascot and quadrants, and the answer key pages) is drawn in the browser on canvases first, using the same exercise objects the PDF will use, so the preview and the file cannot differ. The user pages through it, and either confirms ("Save PDF", which embeds those same canvases without redrawing or re-rolling any problems) or goes back, and can "Shuffle" for a fresh set. Needs its own plan; likely splits `buildAndDownloadWorksheetBatch` into build, preview and download. The card grid is done, so the summary bar's Make button is what this step changes into "Preview".

### Decide later (only if the need shows up)
* [ ] **Playwright end-to-end tests.** Candidates: select topics, generate and download a PDF, check the page count; reload and confirm saved settings return. Needs approval to add the package. Decide after the DOM tests whether they already cover enough.
* [ ] **Canvas drawing tests:** jsdom has no canvas. A recording fake of `CanvasRenderingContext2D` could check draw calls; see whether rendering bugs justify it.
* [ ] **Shared utility extraction:** look for functions that several files repeat and pull them into one utility file.
* [ ] **CSS custom properties** for the colors in `public/css/styles.css`, which cannot import the TypeScript constants. Folded into the topic card grid plan: a single theme file of CSS custom properties.

---

## Core Architectural Decisions & Context
* **Source layout:** `src/` is grouped by job: `text/` (every word a person reads, per language), `worksheet/` (layout contract, PDF assembly, the half-page identifier), `exercises/` (with `kana/` and `geography/`), `generator/`, `settings/` (pure logic), `ui/` (DOM), and a few files at the root (app-level: `main.ts`, `make-example-sheet.ts`, `utils.ts`; shared leaves: `types.ts`, `constants.ts`, `asset-manager.ts`). Imports flow downward only. The full tree and the dependency rule are in `AGENTS.md` section 7. Paths in this file are relative to `src/`; ledger entries dated before 2026-10-14 name files by their old flat names.
* **Horizontal Split Rule:** Each page splits perfectly at 396pt with an ornamental decoration line separating two matching half-pages. Each half contains 4 quadrants (`EXERCISE_WIDTH: 266pt`, `EXERCISE_HEIGHT: 155pt`).
* **Strict Monochrome:** Code takes every color from `src/constants.ts` (`COLOR_BLACK`, `COLOR_WHITE`, `COLOR_LIGHT_GREY` `#D1D5DB`, `COLOR_MEDIUM_GREY` `#999999`, `COLOR_PDF_CROSSHAIR`, `COLOR_PDF_PERFORATION`). `public/css/styles.css` still has its own colors; moving them to CSS custom properties is a separate task.
* **Randomization:** The planner and decks take an injectable `RandomSource`. Clock times, sums and fractions still use `Math.random()` inside their own modules.
* **Data loading:** Loaders (`loadGeographyData`, `loadRegionMapData`) run once at startup; render functions stay synchronous.

---

## Current State and Open Issues (as of the end of 2026-10-21)
* **Git:** everything is committed (latest `d3a088c`). The working tree has one untracked, empty file, `notes.txt`, which is not mine.
* **Verification:** `npm test` (36 files, 673 passed, 2 skipped on purpose), `npm run test:types`, `tsc --noEmit` and `npm run build` pass. Looked at by hand in the browser: sheets and keys made with every topic, the page at desktop and phone width. Nothing has been printed yet: the identifier's 8pt grey words, the mascot size and the 14pt printer margin need a look on paper.
* **Install hang:** on the human's machine `npm install` and `npm ci` hung forever, 2026-10-21. npm's automatic audit sends a POST to `registry.npmjs.org/-/npm/v1/security/advisories/bulk`, which connects but never answers there (plain downloads work). `npm ci --no-audit` finishes in seconds; `npm config set audit false` in the user config makes that the default. The same stall happened in the GitHub workflows, so both now run `npm ci --no-audit --no-fund --prefer-offline` (commit `c358ebc` on `main`). Cause not found (network, VPN or an npm-side problem); run `npm audit` now and then, since the flag also hides real advisories.
* **Commands:** `npm test` runs the suite once; `npm run test:watch` watches. `npm run dev` runs four watchers: build, server, app type check and test type check. `pretest`, `pretest:watch` and `prebuild` run `npm run check-node` and `tsc --noEmit` first, so a type error stops a test or build run. `predev` only checks the Node version, because `dev:types` already runs `tsc --watch`. `npm run build` runs `node build.js` (copies `public/` into `dist/`) and then the minified esbuild bundle.
* **Node:** Needs 22.12 or newer (Vitest, Vite and `concurrently` all do). The shell default here is Node 14, so run `nvm use` first. `engines` and `.npmrc` guard `npm install` only; `scripts/check-node-version.mjs` guards the scripts and is written in plain syntax so an old Node can parse it and complain.
* **Dependencies:** Installing Vitest once pruned `d3-geo` and two type packages from `node_modules`; if `tsc` cannot find them, run `npm install`. `package.json` is `"type": "module"`. `jsdom` runs the DOM tests in `tests/dom/ui/`. `@types/node` is not installed directly; tests that read map files with `fs` will need it, with approval.
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

### 2026-10-14 - Unit tests for kana-rows.ts (Claude)
* **Status:** Done, not committed. `npm test` (10 files, 318 passed, 2 skipped on purpose) and `npm run test:types` pass. Mutation-tested: swapping two cards, duplicating a character and blanking a hint each failed two tests, and the source was restored each time.
* **Accomplished:** `tests/unit/kana-rows.test.ts` (33 tests). `KANA_ROW_CARDS` holds exactly the rows in `KANA_ROWS`, with 5, 5, 5, 5, 5, 5, 5, 3, 5 and 3 cards per row (46 in all); the characters match a hand-written chart string in order, never repeat, and are each one hiragana code point; every hint is non-empty, opens with a quoted romanization followed by "pronounce", and is unique. `listKanaCards` returns nothing for no rows, each row alone, every card for all rows, chart order whatever order the rows were given in, a row once when chosen twice, and a fresh list.
* **Open Issues:** The hint test checks form only, not whether a hint is a good approximation; the native-speaker review of the 41 added hints is still open. The hint pattern is loose on purpose: ん is worded "a soft n" and has no second quoted sound.

### 2026-10-14 - Unit tests for topic-settings.ts (Claude)
* **Status:** Done, not committed. `npm test` (10 files, 318 passed, 2 skipped on purpose) and `npm run test:types` pass. Mutation-tested five ways, each caught and restored: no throw on an empty selection (4 failures), no "all" summary (3), shared default lists (2), reversed level preference (3), and a kana default that is not an option (17).
* **Accomplished:** `tests/unit/topic-settings.test.ts` (102 tests).
    * `PANEL_SPECIFICATIONS`: one panel per configurable topic, in topic order; per panel, unique option values and labels, non-empty defaults that are all real options, a heading; single-choice panels default to exactly one value with no All chip; multiple-choice panels have a summary noun. The level panels offer the three grade levels in order, hiragana one chip per `KANA_ROWS` entry, countries one per region with every region chosen by default.
    * `findConfigurableTopic` answers only for topics with a panel; `findPanelSpecification` returns each panel.
    * `createDefaultSelections`: keys, defaults, and fresh lists on every call.
    * `resolveTopicSettings`: defaults resolve to typed settings; every level resolves; several levels give the lowest; rows and regions come back in list order, once each, strays dropped; the input is not modified; every panel throws, naming the topic, on an empty or all-stray selection.
    * `summarizeSelection`: each level label, "all", the single name, "N rows" and "N regions", strays not counted, and a summary for every default.
* **Open Issues:** The throw in `findPanelSpecification` for an unknown topic is not tested, because the types make it unreachable without a cast, and `AGENTS.md` bars type silencing. `summarizeSelection` for a multiple-choice panel with nothing valid chosen prints "0 rows"; the UI never allows that state, so it is not pinned. The level panels throw from `pickLevel`'s own guard as well as `pickChosen`'s, so removing only the `pickChosen` guard is not caught for them; the hiragana and countries tests do catch it.

### 2026-10-14 - topic-settings tests split into a folder (Claude)
* **Status:** Done, not committed. `npm test` (10 files, 318 passed, 2 skipped on purpose) and `npm run test:types` pass; the test count is unchanged. Two mutations (reversed level order, no "all" summary) still failed 3 tests each after the move, and the source was restored.
* **Accomplished:** `tests/unit/topic-settings.test.ts` (247 lines, over the 200-line limit) became `tests/unit/topic-settings/panels.test.ts` (114 lines: panel definitions, `findConfigurableTopic`, `findPanelSpecification`, `createDefaultSelections`), `resolve.test.ts` (65: `resolveTopicSettings`) and `summary.test.ts` (63: `summarizeSelection`). The helpers two or more of them use moved to `tests/support/panel-selections.ts` (`selectionsWith`, `LEVEL_TOPICS`, `GRADE_LEVELS`, the `LevelTopics` type). The human's earlier edits (explicit parameter types, the "Scythia" and "bb" stray values) were kept as written. `npm test -- topic-settings` runs all three; `npm test -- topic-settings/resolve` runs one. `AGENTS.md` Testing section now says to split an over-long test file into a folder named after the module.
* **Open Issues:** None new.

### 2026-10-14 - src/ reorganized into folders, phases 1 to 5 (Claude)
* **Status:** Phases 1 to 4 committed, one per phase; phase 5 (documentation) not yet. After each move: `npx tsc --noEmit`, `npm run test:types`, `npm test` (10 files, 318 passed, 2 skipped) and `npm run build` passed, and the bundle stayed byte-identical at 930,757 bytes. After phase 4 a browser smoke test passed: no console errors, 17 example quadrants drawn, a 514,110-byte PDF generated with six topics and four half-pages, and saved settings came back after a reload.
* **Accomplished:** 27 files moved with `git mv` (kept as renames) by a one-off script that rewrote every relative import in `src/` and `tests/`; the script lived in the scratchpad and is not in the repo. Phase 1: `settings/` (3 files) and `ui/` (2). Phase 2: `generator/` (3). Phase 3: `worksheet/` (2). Phase 4: `exercises/` (4), `exercises/kana/` (2), `exercises/geography/` (5). Phase 5: `AGENTS.md` section 7 now holds the layout, where new files go and the dependency rule, and its two stale references to the layout file were corrected; this file's roadmap and state use the new paths.
* **Open Issues:** Phase 6 (mirror the test folders) and the dependency check, listed under "In progress". The three files over 200 lines (`exercises/geography/geography-exercise.ts` 433, `main.ts` 380, `exercises/geography/region-map-data.ts` 346) are not split; that is a separate task.

### 2026-10-14 - tests/unit mirrored to src/ (Claude)
* **Status:** Done, not committed. `npx tsc --noEmit`, `npm run test:types` and `npm test` (10 files, 318 passed, 2 skipped) pass. Git shows renames.
* **Accomplished:** 8 test files moved with `git mv` by the same one-off script, rewriting 23 import lines: `tests/unit/generator/` (`half-page-planner`, `shuffled-deck`), `tests/unit/settings/` (`print-size`, `saved-settings`, and the `topic-settings/` folder with `panels`, `resolve` and `summary`) and `tests/unit/exercises/kana/` (`kana-rows`). `tests/support/` stays flat. The `AGENTS.md` Testing section now states the mirroring rule; the readme's single-file examples use `tests/unit/settings/print-size.test.ts`. Path filters (`npm test -- settings/topic-settings`, `-- generator`, `-- exercises/kana`) were run and select the expected files.
* **Open Issues:** The dependency check (next).

### 2026-10-14 - Folder dependency check (Claude)
* **Status:** Done, not committed. `npx tsc --noEmit`, `npm run test:types`, `npm test` (10 files, 318 passed, 2 skipped) and `npm run build` (bundle still 930,757 bytes) pass. This finishes the `src/` reorganization; `plan.md` is cleared.
* **Accomplished:**
    * `tests/support/folder-dependencies.ts`: the rule as pure code. Areas: app (`main.ts`, `make-example-sheet.ts`, `utils.ts`), leaf (`types.ts`, `constants.ts`, `asset-manager.ts`), `worksheet`, `exercises`, `generator`, `settings`, `ui`, with a table of what each may import. Extra rules: nothing imports `main.ts`; only app-level files import `utils.ts`; exercise topics (`kana/`, `geography/`, the top level) do not import each other; an unknown folder or an import that resolves to no file is a failure.
    * `tests/architecture/dependency-checker.test.ts` (47 tests): the checker on a made-up project, covering every area pair in both directions, dynamic imports and re-exports, and reporting every offense not just the first.
    * `tests/architecture/src-folder-dependencies.test.ts` (3 tests): reads the real `src/` through `import.meta.glob` with `?raw` (no `fs`, no `@types/node`), checks the glob found at least 27 files, that every file is in a known folder, and that the rule holds.
    * `tests/support/vite-types.d.ts` for the glob types; `AGENTS.md` section 7 says the rule is enforced and how to add a folder, and the Testing section describes `tests/architecture/`.
* **Mutation-tested on the real code:** an exercise importing settings, settings importing a panel, a panel importing `main.ts`, and kana importing geography were each caught with a one-sentence message, and restored. A file in an unknown folder was **not** caught at first: Vitest's `fsModuleCache` kept the compiled test with the file list from the first run, so a new file went unseen. Setting `fsModuleCache: false` in `vitest.config.mts` fixed it (verified by running the test warm, adding the stray file, and watching it fail). The suite still runs in about a second.
* **Open Issues:** None new. Disabling the module cache applies to all tests; re-enable it only if the suite grows slow and the architecture test is moved to a project of its own.

### 2026-10-14 - Session summary (Claude)
* **Status:** Everything below is done and committed. At the end: `npx tsc --noEmit`, `npm run test:types`, `npm test` (10 files, 318 passed, 2 skipped on purpose) and `npm run build` (bundle 930,757 bytes) pass. The detailed entries above hold the specifics; this is the overview.
* **Accomplished:**
    * **Documentation:** `progress.md` consolidated and its roadmap reordered into tiers (done, small, medium, large, decide later); the Roman-letter print and cursive tracing goal added; two moot tasks dropped. `AGENTS.md` and `readme.md` refreshed to match. The readme now explains how to run one test file or one named test, how `src/` is organized, and how to add a folder.
    * **Local-storage persistence:** `settings/saved-settings.ts` saves the selected topics, per-topic settings and print size, one key per setting, with validation and a fallback to defaults when storage is blocked or holds bad data. Checked in the browser.
    * **Test suite:** Vitest in `tests/` (`unit/`, `support/`, `architecture/`). `randomization-check.ts` was migrated into planner, deck, print-size and saved-settings tests; new tests for `kana-rows` (33) and `topic-settings` (102, split into three files). Rules were mutation-tested by breaking the code on purpose.
    * **Tooling:** diagnosed failures caused by the shell's Node 14 default; `scripts/check-node-version.mjs` and `pre` hooks now stop old Node versions with a plain message (`engines` and `engine-strict` guard only `npm install`). `npm run dev` also watches the test type check. The dead `build:geo` script and `d3-geo-projection` were removed.
    * **`src/` reorganization:** 27 source files moved into `worksheet/`, `exercises/` (`kana/`, `geography/`), `generator/`, `settings/` and `ui/`, in five committed phases, by a one-off script that rewrote every import with the compiler as the check; the bundle stayed byte-identical throughout. `tests/unit/` now mirrors `src/`. A folder dependency test (`tests/architecture/`) enforces which folders may import which, and `AGENTS.md` and the readme document the rule.
* **Lessons recorded:**
    * npm checks `engines` and `engine-strict` only on install, never on `npm run`.
    * Vitest's `fsModuleCache` baked the `import.meta.glob` file list into the compiled test, so a new file went unseen; `fsModuleCache: false` in `vitest.config.mts` fixed it.
    * Installing Vitest once pruned `d3-geo` and two type packages from `node_modules`; `npm install` restored them.
    * The dependency rule I first wrote was wrong in two places (`utils.ts` imports `worksheet/`, and the generator does not import `settings/`); checking it against the real imports caught both.
* **Open Issues and next steps:**
    * Three files are over 200 lines: `exercises/geography/geography-exercise.ts` (433), `main.ts` (380) and `exercises/geography/region-map-data.ts` (346). Splitting them is a separate task.
    * Small tasks next: rename the "batch" wording (button label and PDF filename), share the geography constants between the two geography files, add a CI workflow, and write the `region-map-data` tests (needs `@types/node`, with approval).
    * Medium: DOM tests with jsdom, injectable randomness, frequency weights, saved deck state, separating exercise titles from types.
    * Large: Roman-letter tracing (needs the user's font choice) and live canvas previews.
    * Still the user's to do: a native-speaker review of the 41 added hiragana pronunciation hints.

### 2026-10-15 - Cursive letter exercise, phases 0, 2 and 3 (Claude)
* **Status:** Built, not committed. `npx tsc --noEmit`, `npm run test:types`, `npm test` (16 files, 509 passed, 2 skipped) and `npm run build` pass. Looked at in the real app: five example quadrants (s, m, g, k, w) draw with the fonts loaded and no console errors. Not wired into topic selection yet (phase 4), so a generated PDF does not include it. Mutation-tested: a wrong letter in a group (3 failures), a changed row pattern (1), the width fit removed (3) and baselines tied to letter size (2) were each caught and restored.
* **Accomplished:**
    * **Phase 0, fonts:** `public/fonts/learning-curve/` holds the Regular, Bold and Dashed `.ttf` files and the license `README.TXT` from the Learning Curve 4.0 pack; `@font-face` for `CursiveRegular`, `CursiveBold` and `CursiveDashed` in `styles.css`; the family names in `constants.ts`. The older `learning-curve-bv` folder was deleted at the user's request.
    * **Phase 2, pure logic:** `CURSIVE_GROUPS` in `types.ts`; `exercises/cursive/cursive-cards.ts` (the six sets and `listCursiveCards`); `cursive-layout.ts` (`planCursiveLayout`, measured metrics in, positions and sizes out). Tests: `tests/unit/exercises/cursive/cursive-cards.test.ts` (26 letters across six sets, none repeated, one vowel per set except the last) and `cursive-layout.test.ts` (four slots per line; solid, solid, dotted, dotted then blank; guide order and bounds; no letter overflowing its slot; wide letters shrink; baselines the same for every letter; model inside its panel; bad input throws).
    * **Phase 3, the exercise:** `cursive-fonts.ts` (`loadCursiveFonts`, which throws if a family is not declared, plus font and ink measuring) and `cursive-exercise.ts` (`createCursiveExercise(letter)`: title, bold model, mid-gray guide lines with a dashed midline, letters drawn one per slot). `main.ts` preloads the fonts and shows five example quadrants.
    * **Applied from the user's spike feedback:** guide lines in `COLOR_MEDIUM_GREY` and slightly heavier (0.75); model about 5 percent smaller (limit 106pt); practice letters from about 55pt to about 59pt; exactly four letters per line, spaced, not joined.
* **Sizes in use:** model up to 106pt; practice letters up to about 59pt (the most the 58.5pt row allows). **Wide letters draw smaller so four fit a line:** m near 44pt, w near 52pt, y near 55pt, n near 57pt; every other letter is at the full size. The guide lines follow the size drawn, so each quadrant is self-consistent and the baselines match across quadrants. The user decides after printing whether that is acceptable.
* **Open Issues:**
    * `public/fonts/learning_curve_4.0/` (the full 3.5 MB download, untracked) sits under `public/`, which `build.js` copies into `dist/` and so into the deployed site. Move it out of the project or add it to `.gitignore` before committing.
    * Arrows are deferred; see the roadmap item.
    * Nothing has been printed from the real exercise yet; sizes were set from the spike printout and the user's feedback.
    * The topic button text will read `cursiveLetters` until the title-versus-type task lands.

### 2026-10-15 - Cursive letters wired in as a topic (Claude)
* **Status:** Done, not committed. `npx tsc --noEmit`, `npm run test:types`, `npm test` (16 files, 509 passed, 2 skipped) and `npm run build` pass. In the browser: the `cursiveLetters` button and its panel appear, the six set chips and an All chip work, the button summary reads "s m a t" then "2 sets", the choices save and come back after a reload, and a PDF of four half-pages with cursive letters among six topics generated with no errors (533,335 bytes). The 3x quadrant images that go into the PDF were checked by eye: bold model left, mid-gray guide lines, two solid then two dotted letters, a blank line. The planner suite now covers nine topics (511 selections) and the whole suite still runs in about 2.5 seconds.
* **Accomplished:**
    * `types.ts`: `cursiveLetters` in `TOPIC_KEYS` and `CONFIGURABLE_TOPICS` (after hiragana, so the panels stay in topic order); `TopicSettings.cursiveLetters = { groups }`.
    * `settings/topic-settings.ts`: the panel ("Cursive letters: sets", multiple choice, All chip, default the first set, labels as a teacher says them), default selection, resolve (groups kept in Montessori order, strays dropped, an empty selection throws) and summary ("N sets"). `saved-settings.ts` needed no change: it already loops over the configurable topics, so the new key `daily-practice-sheet.v1.panel.cursiveLetters` is saved and restored.
    * `generator/randomization-and-difficulty-generator.ts`: a shuffled deck of cursive cards (each letter twice per cycle, no adjacent repeats), a factory entry and the `instantiateExercise` branch (the compiler's `never` check required it). `main.ts`: the new topic in `localState`.
    * Tests: cursive cases added to `panels`, `resolve`, `summary` and `saved-settings` (one exact-defaults test updated). Mutation-tested: a wrong default set (2 failures), chip labels without spaces (2) and no All chip (the first run missed it; a test was added and it now fails 1) were each caught and restored.
    * Docs: `AGENTS.md` (cursive folder in the layout, typography spec names the fonts) and this file.
* **Open Issues:**
    * The topic button text is the key, `cursiveLetters`, until the title-versus-type task lands.
    * `public/fonts/learning_curve_4.0/` (the full download, untracked) still sits under `public/` and would ship; move it out or `.gitignore` it before committing.
    * Wide letters draw smaller so four fit a line (m near 44pt, w near 52pt, y near 55pt, n near 57pt); the user decides after printing a real sheet.
    * The generator has no unit tests (it imports canvas modules); the deck wiring was checked through the browser.
    * Stroke guides and arrows, joined practice and print letters are the next items under the roadmap entry.

### 2026-10-16 - Single-line cursive practice and several panels per topic (Claude)
* **Status:** Done, not committed. `npx tsc --noEmit`, `npm run test:types`, `npm test` (16 files, 509 passed, 2 skipped, about 2.6 seconds) and `npm run build` pass. In the browser: settings saved before this change load with the new default; both cursive panels appear under one topic button; the button summary always names the layout ("c r i p, one large line", then "c r i p, two lines" after switching); the choice saves and returns after a reload; PDFs generated under each layout, and the 3x quadrant images were checked by eye. Nothing printed yet.
* **Accomplished (four phases):**
    * **Several panels per topic.** `types.ts` gained `PANEL_IDS` and `PanelId`; each `PanelSpecification` has an `id` (names it in saved settings and the DOM) and a `topic` (the button that reveals it). `findPanelSpecifications(topic)` lists a topic's panels; `summarizeSelection` joins each panel's summary with commas; `saved-settings.ts` and the panel renderer work per panel id. Existing panels are unchanged and their saved key names are the same.
    * **Layout variants.** `CURSIVE_LAYOUT_NAMES` and `DEFAULT_CURSIVE_LAYOUT` (`one-large-line`) in `types.ts` (so `settings/` can use the default without importing an exercise). `CURSIVE_LAYOUTS` in `cursive-layout.ts`: one large line is one row of three slots (solid, dotted, dotted); two lines is the old pattern. The sizing rule is unchanged (as large as the row allows, never so wide the line overflows), so the large line reaches about 120pt for narrow letters and about 1.9 times today's size for `a`; `m` shrinks to about 72pt.
    * **Model panel at two thirds:** panel 54 x 75pt, font limit 70pt (was 80 x 112 and 106). The practice area now starts just past the panel (derived, not fixed), which also gave the two-line layout more width, so `n`, `w` and `y` no longer shrink there and `m` is about 52pt.
    * **The setting.** Panel `cursiveLayout` (single choice) owned by `cursiveLetters`; `TopicSettings.cursiveLetters` has `groups` and `layout`; the generator passes the chosen layout to the exercise. A saved selection with no layout, or one we do not know, falls back to the default.
    * **Tests.** The one layout test file became `tests/unit/exercises/cursive/cursive-layout/{rows,sizes,model}.test.ts` with shared `tests/support/cursive-fixtures.ts`, running the generic rules for both layouts plus large-line rules (one row, no blank slot, at least 1.5 times larger than two lines). Settings tests cover the new panel, resolve, the always-on summary, panel ownership and saved-settings fallbacks. Mutation-tested in two rounds (lookup returning every panel, a blank slot in the large line, the old model limit, width fit ignored, practice area ignoring the panel, default layout changed, resolve ignoring the choice, summary dropping the second panel, the layout panel owned by the wrong topic): each was caught and restored.
    * `AGENTS.md`: one line on panels and topics.
* **Open Issues:**
    * The save and load functions that touch `localStorage` have no unit tests (browser only); the browser check covers the new key.
    * A dev-server live-reload connection logs "incomplete chunked encoding" when the page navigates; it is not an app error.
    * Sizes are judged on screen and in the 3x images; the user decides after printing. `public/fonts/learning_curve_4.0/` is still untracked under `public/` and would ship.
    * The model panel leaves room below it (to y of about 109) for the picture to come; nothing is drawn there yet.

### 2026-10-16 - One practice size set by m, larger model, emoji under the model (Claude)
* **Status:** Done, not committed (this, and the earlier single-line work from the same day, are both still uncommitted). `npx tsc --noEmit`, `npm run test:types`, `npm test` (16 files, 509 passed, 2 skipped, about 2.6 seconds) and `npm run build` pass. Looked at in the browser through generated PDFs (all six sets, 12 half-pages, both layouts): the 3x quadrant images show the larger model, a gray picture under each, and identical guide lines and letter size from quadrant to quadrant. Nothing printed.
* **Accomplished:**
    * **One practice size for every letter, set by m.** `planCursiveLayout` takes a `sizingInk` (the exercise passes m's measured ink, named by `SIZING_LETTER`); the size is as large as a row allows but no wider than a full line of m needs. Letters are still centered in their slots by their own ink. Consequence the user chose: **narrow letters are smaller than before.** Practice size is now about **66pt on the one large line** (was up to 110pt for `a`, 72pt for `m`) and about **48pt on two lines** (was 59pt for most letters, 52pt for `m`). The large line is 1.37 times the two-line size (was 1.9). If it needs to be larger again, the levers are a narrower model panel, fewer letters on the line, or the 8pt right margin.
    * **Model enlarged by one fifth:** font limit 70pt to 84pt. The panel is now 68 x 85pt at top 32, wide enough for m at the full size, so **every model is drawn at one size** (previously m shrank). The practice area starts at x 88 (was 74), which is part of why practice letters came out smaller.
    * **Emoji under each model:** `cursive-emoji.ts` (26 letters; each word begins with its letter; a test checks this), a pure `emoji-grayscale.ts`, and drawing code that paints the emoji on a scratch canvas at the pipeline's 3x scale, turns it gray, and places it (so it is sharp and stays in the monochrome palette). `constants.ts` has `EMOJI_FONT`. The layout reserves a box under the model panel (about 26pt tall, 22pt picture) with a 5pt gap so long tails (g, j, y, z) clear it. **Decision for the user: grayscale.** The project is monochrome by design; if color is wanted, drop the `convertToGrayscale` call in `cursive-exercise.ts`.
    * **Tests:** fixtures now hold the measured ink of all 26 letters; new rules prove one size for every letter, identical lines for every letter, no overflow for any letter, the sizing letter is the widest by measurement, every model at the limit and inside its panel, the picture placement, the emoji list (26 entries, word starts with the letter, one grapheme each, no repeats) and the grayscale math. Mutation-tested six ways (sizing by own ink, sizing letter changed, old model limit, a mismatched word, a repeated picture, wrong gray weights); all caught and restored.
* **Weak emoji fits for the user's hand cleanup:** `i` is ice cream (long i, where a Montessori short i is wanted); `x` is an x-ray (the sound is not at the start); `q` is a question mark; `j` is a jack-o-lantern; `n` is a nose, which turns into an odd pale shape in gray; `u` is an umbrella; `s` is a sun with a face. Chosen from emoji that exist on current Apple, Windows and Android fonts; `x-ray` needs a recent system (Unicode 14).
* **Open Issues:**
    * Emoji are drawn with the system emoji font, so their look differs by computer (the PDF captures what the generating computer draws).
    * `AGENTS.md` bars decorative emoji; these are runtime content drawn on the worksheet, which the rule allows, and they live in one data file.
    * The picture box is a fixed size under the model; swapping in real artwork later changes `drawGrayscaleEmoji` only.
    * `public/fonts/learning_curve_4.0/` is still untracked under `public/`.

### 2026-10-18 - Answer key appended to the worksheet PDF (Claude)
* **Status:** Done, pull request 1 (`answer-sheet-pipeline`). `npx tsc --noEmit`, `npm run test:types`, `npm test` and `npm run build` pass for these changes. No generated PDF has been looked at yet.
* **Accomplished:**
    * **Phase 1, pipeline:** optional `renderAnswers` on `QuadrantExercise`; `drawQuadrant` and `batchHasAnswers` in `worksheet-layout.ts`; `buildAndDownloadWorksheetBatch` appends an "ANSWER KEY" copy of every page (same PDF) only when some quadrant can answer.
    * **Phase 2:** addition and subtraction write each result in its answer box.
    * **Phase 3:** fractions fill both boxes; a telling-time key writes the time, a setting-time key draws the hands.
    * **Phase 4:** continent and country quadrants write the answer on the response line. The duplicated response-line drawing moved into `exercises/geography/answer-line.ts`.
    * Tests: `worksheet-layout`, `arithmetic-answers`, `fractions-and-clock-answers`, `geography/answer-line`, with `tests/support/recording-context.ts`. Mutation-tested: wrong subtraction, wrong denominator, no hands on the key and no answer on the line were each caught and restored.
* **Decisions:** key appended as extra pages of the same PDF; hiragana and cursive stay unchanged.
* **Open Issues:**
    * The continent and country exercises are not tested directly (their map data needs a browser); only the shared answer line is.
    * First grade can draw a denominator of 1, so a fraction of "1/1" appears. This was already so; the key just makes it visible.
    * `generate-pdf-batch.ts` and `make-example-sheet.ts` keep older copies of the PDF pipeline and have no key.
    * This branch started before the user's cursive commit on main, so `agents/AGENTS.md` and `progress.md` here are older than main's and will conflict on merge; keep both sets of edits.

### 2026-10-19 - Rare zeros in first-grade addition and subtraction (Claude)
* **Status:** Done, not committed. `npm test` (23 files, 540 passed, 2 skipped), `npm run test:types` and `npm run build` pass. No generated PDF looked at.
* **Accomplished:**
    * New `exercises/problem-numbers.ts`: `pickRandomWithRareZero(maxInclusive, random)`. Every value from 1 up is equally likely; 0 weighs `ZERO_WEIGHT` (0.25) as much as one of them.
    * First-grade addition and subtraction use it for the bottom number, replacing the roll-then-clamp code that made `10 - 0`, `20 - 0` and `9 + 0` common.
    * Tops that leave room only for zero are redrawn: addition 9; subtraction 10 and 20 (first-grade subtraction tops are now 11 to 19).
    * Tests: `problem-numbers.test.ts` (range, every value appears, zero rarer) and `first-grade-arithmetic.test.ts` (no carrying or borrowing; zero rarer than other bottoms for the same top). Mutation-tested: `ZERO_WEIGHT` raised to 1.5 was caught and restored.
* **Open Issues:** 2nd and 3rd grade unchanged. The generators still call `Math.random` directly; tests mock it.

### 2026-10-19 - Multiplication exercise with number chips (Claude)
* **Status:** Done, not committed. `npx tsc --noEmit`, `npm run test:types`, `npm test` (25 files, 585 passed, 2 skipped) and `npm run build` pass. Mutation-tested: the product replaced by a sum was caught and restored.
* **Accomplished:**
    * New `exercises/multiplication-exercise.ts`: same stacks as addition and subtraction, `x` sign, answer key. Title tag: "1 to 5" for an unbroken run, "Mixed" for gaps, "7 Table" for a lone number, "Two Digit".
    * Settings panel of chips 0 to 12 (default 1 to 5), presets "Up to 5" (0 to 5) and "Up to 12" (1 to 12), and an exclusive "Two digit" chip (two-digit by one-digit; top 10 to 99, bottom 2 to 9). `PanelSpecification` gained optional `presets` and `exclusiveOption` (chip order: All, options, presets, exclusive); `toggleOption` and `isPresetSelected` are pure and tested; `TopicSettings.multiplication` is a union (`tables` with factors, or `two-digit`).
    * Times tables draw both factors from the chosen numbers; a lone number is paired with 1 to 12. Zero is an ordinary chip (the rare-zero helper stays on addition and subtraction).
    * Wired through `types.ts`, `topic-settings.ts`, `topic-settings-panel.ts`, the example specifications, the generator factories and `main.ts`. The topic starts switched off.
* **Open Issues:** No DOM test of the chip clicks (the repo has no `tests/dom/` yet); the click rules are tested through `toggleOption`. The drawing code is a third copy of the addition layout.
* **Follow-ups the same day:** zero is rarer than other numbers in multiplication (`pickFromWithRareZero`, same weight as addition and subtraction; the line above saying zero is an ordinary chip is superseded). Zero cannot be the only number chosen: `PanelSpecification.needsCompanion` plus `toggleOption` (now returns `{ selection, refusal? }`) refuse it; the 0 chip gets `aria-disabled` and stays clickable, and a red `.settings-error` message under the chips explains why. Any later accepted click, preset or All click clears it, and a saved selection of zero alone falls back to the default.


### 2026-10-19 - Cheering animal mascot and flower border on every half-page (Claude)
* **Status:** Done. Stages 1 and 2 are committed (`51bded9`); stage 3 (border, footer credit, docs) is not. `npm test` (28 files, 617 passed, 2 skipped), `npm run test:types` and `npm run build` pass. A sample sheet and its key, drawn by the real code with geography, fractions, kana, arithmetic, clock and cursive exercises, were looked at.
* **Accomplished:**
    * `scripts/split-mascots.mjs` cuts the CC0 sheet from abbythepup.com into eight outline-only animals in `public/img/mascots/animals/` (translucent shadows and gradients dropped, every region white or black with a black outline). `tests/architecture/mascot-animal-files.test.ts` checks the files.
    * New `worksheet/mascots.ts`: the eight animals, seven cheers, `pickMascotAndCheer(halfPageNumber)` (cycling, so a batch is repeatable and the key matches its worksheet), the speech bubble and `drawMascotBand`. Animals are preloaded at startup in `main.ts`.
    * New `worksheet/decorations.ts`: left-margin vine, a vine along the foot of the page, a short vine at the top right, leaves and eight daisies. Daisy position, size and turn vary per half-page from a seeded generator (`createDecorationRandom`, the half-page number is the seed), so the key's flowers match its worksheet. The vines and leaves never move.
    * `worksheet-layout.ts`: the grid top moved from 40 to 26; each half-page gets one transparent 612 x 396pt layer (border plus animal) added after the exercises; the animal is 52pt tall; `getMascotBottomEdge` puts its feet 2pt above the cutting line, or 14pt above the paper's edge on the bottom half. The key's cheer is "Check your work!". "ANSWER KEY" moved into the gap between Name and Date.
    * Footer credit and a readme section record the source and its CC0 notice.
* **Decisions:** Magnific art was dropped (its license forbids public redistribution). A scan of 397 exercises (688 draws, answer versions included) showed every one stops by 147pt down its 155pt quadrant; the animal reaches at most 6pt into the bottom-right quadrant (`MASCOT_MAX_REACH_INTO_GRID`). The scan ran in a throwaway harness and is not a test, so re-run it by hand if an exercise draws lower.
* **Open Issues:**
    * Nothing prints yet: look at a real printed sheet for the animal's size and the line weight, and for the 14pt printer margin.
    * `generate-pdf-batch.ts` and `make-example-sheet.ts` (older copies of the pipeline) do not get a border or a mascot beyond what `buildCompositeWorksheet` gives.
    * The bear, owl and robot SVGs are unused.
    * The top half's top-right daisies sit about 17pt from the paper's top edge, close to a printer's limit.

### 2026-10-20 - Topic card grid, summary bar and color theme (Claude)
* **Status:** Done, committed in seven steps (labels, card, bar, wiring, theme and styles, markup, corner toggle) plus a final cleanup. `npm test` (32 files, 657 passed, 2 skipped), `npm run test:types`, `tsc --noEmit` and `npm run build` pass. Looked at in the browser at desktop and phone width: toggling topics, the six-topic limit, compact and normal views, the bar shrinking and growing, a reload restoring topics, settings, view mode and half-page count, and the Make button running without a console error.
* **Accomplished:**
    * One card per topic (`ui/topic-card.ts`): example canvas on top, name with an Add/Added toggle, a one-line summary, and the topic's settings while it is chosen. Unselected cards show a dimmed preview; at six topics the rest lock with a hint. Only the changed card's preview is redrawn.
    * `ui/topic-settings-panel.ts` gained `renderTopicSettings` (one topic's panels). `renderSettingsPanels` and `ui/print-size-panel.ts` were removed as unused.
    * Fixed translucent summary bar (`ui/summary-bar.ts`, `position: sticky; bottom: 0`, so it rests above the page footer at the end of the page): count line ("N of 6 topics - X pages") on its own line with the half-page stepper and page diagram, the summary text, a compact/normal icon toggle and a **Make** button (same id as before). A ^ in its top right corner shrinks it to one row.
    * Compact view (saved with the other settings): two cards across on a phone, short topic names (`TOPIC_SHORT_LABELS`) and short summaries (`shortLabel` on options, `settings/sheet-summary.ts`); settings chips are hidden there. In compact view the bar shows one abbreviated line, which a chevron opens to the full text.
    * Theme: `public/css/theme.css` holds five colors (`--dark-text`, `--light-text`, `--primary-color`, `--secondary-color`, `--mid-tone`) and `--alert-color`; derived values are worked out from them; `styles.css` holds no color values. Starting colors pass 4.5:1 contrast for text. Canvas previews and the PDF stay monochrome by the AGENTS.md rule.
    * `TOPIC_LABELS` names the topics for people; `buildTopicExample` gives one preview per topic.
* **Decisions:** "Make Test Sheet" stays in the intro section, not the bar. The bar's shrunk state is not saved. `plan.md` cleared.
* **Open Issues:**
    * No test covers `main.ts` wiring; it was checked by hand in the browser.
    * Next in the roadmap: the Preview PDF step (large task 3), which turns "Make" into "Preview".


### 2026-10-21 - Three-word identifier on every half-page (Claude)
* **Status:** Done, not committed. `npm test` (33 files, 666 passed, 2 skipped), `tsc --noEmit` and `npm run build` pass. A real worksheet and key from the built app were rendered with pdf.js: the words sit turned along the right edge clear of the vines, and the key's words match its worksheet (`drum.sock.oasis`, `cap.silky.steady`).
* **Accomplished:**
    * New `worksheet/half-page-identifier.ts`: `fingerprintHalfPage` renders the four quadrants (plain `render`, fixed order) through a recording `Proxy` on a scratch canvas context, `hashText` (FNV-1a plus a murmur3 finalizer) and `wordsFromHash` (low 30 bits, three 10-bit indexes), and `getHalfPageIdentifier`.
    * New `worksheet/identifier-words.ts`: 1,024 distinct lowercase words of 3 to 6 letters, hand-screened for homophones and unkind words.
    * `worksheet-layout.ts`: `drawHalfPageIdentifier` prints the words as native jsPDF text at an angle of 90 degrees (8pt, `COLOR_MEDIUM_GREY`, baseline 20pt from the right edge, centered on the grid), then restores black text. Worksheet and key passes share it.
    * `tests/unit/worksheet/half-page-identifier.test.ts` (9 tests). Mutation-tested: hashing `renderAnswers` and sorting the recorded calls were each caught, then restored.
* **Decisions:** dots between the words, bottom-to-top reading, 1,024 words. The seed-based reversible scheme stays a note in the roadmap (task 8).
* **Open Issues:**
    * Every quadrant is rendered one extra time per half-page per pass (twice per half-page counting the key); batch time was not measured. If it shows, compute the words once and reuse them for the key.
    * Nothing printed: look at the 8pt grey words on paper (legibility, 20pt margin). The daisies were not seen near the words in this one sample.
    * The user's edits to the draft list added `appeal` (6 letters) and a second `sing`; the duplicate was dropped and the list is exactly 1,024.
    * `generate-pdf-batch.ts` (the older copy of the pipeline) does not call `renderSingleWorksheetPage`, so it prints no identifier.

### 2026-10-21 - Unused print-size code removed; PDF renamed (Human, documented by Claude)
* **Status:** Done, not committed when written. `npm test` (33 files, 646 passed, 2 skipped), `tsc --noEmit`, `npm run test:types` and `npm run build` pass.
* **Accomplished:**
    * `settings/print-size.ts`: `QUICK_PICK_HALF_PAGES`, the `caption` field of `PrintSizeDescription`, and the helpers only the caption used (`pluralizePages`, the half-page label) are gone. The test that checked the caption went with them (20 cases).
    * The downloaded file is now `practice-sheets.pdf` (was `educational-worksheet-batch.pdf`). Small task 3 is closed.
* **Open Issues:** the paper check of the three-word identifier (8pt grey words, 20pt margin) is still to be recorded.

### 2026-10-21 - Words moved into a message catalog (Claude)
* **Status:** Phases 1 to 3 of `plan.md` done, not committed. `npm test` (34 files, 660 passed, 2 skipped), `npm run test:types`, `tsc --noEmit` and `npm run build` pass. Sheets and keys made in the built app and read back with pdf.js: titles, level tags, answer-line labels, Name/Date/ANSWER KEY and cheers look as before, and each key carries its worksheet's three words.
* **Accomplished:**
    * New `src/text/` (a leaf folder every other folder may import): `message-catalog.ts` (the `MessageCatalog` interface), `english.ts`, `messages.ts` (`getMessages`, `setLanguage`, `setMessages`). Topic names, exercise titles, level tags (functions, so word order is free), `titleWithLevel`, Name/Date/ANSWER KEY, the cheers and the answer-line labels are in it.
    * `TOPIC_LABELS` and `TOPIC_SHORT_LABELS` left `types.ts`. Exercise factories, specification types and `createClockExercise` lost their `title` arguments; exercises read the catalog when they draw. The placeholder spec keeps its `title` (a developer stand-in, not an exercise).
    * Tests: `tests/unit/text/messages.test.ts`, `tests/unit/exercises/printed-titles.test.ts`, `tests/support/marker-catalog.ts` (a made-up language that exposes any hard-coded English); `types.test.ts` was folded into the catalog test. The dependency checker knows the `text` area. Mutation-tested: an exercise reading the wrong title key was caught, then restored.
* **Decisions:** language choice (a selector or saved setting) is not built; `setLanguage` exists. Titles keep their English capitals in the catalog. Catalog entries are read at draw time, so a language change needs no rebuild.
* **Open Issues:**
    * Phase 4, UI text: panel headings, option labels and summary nouns in `settings/topic-settings.ts`, the summary bar, the topic card, `main.ts` and `public/index.html` still hold English. Needs its own plan.
    * Geography, kana and cursive titles are covered by the catalog but not by a drawn-text test (they need loaded map, image and font data).
    * A longer translated title may overflow the 266pt quadrant header; nothing measures or shrinks it. Fonts for scripts beyond Latin are not in place.
    * Country names, hiragana hints and the cursive emoji words are still English-only content.

### 2026-10-21 - The page's words moved into the message catalog, phase 4 (Claude)
* **Status:** Done, not committed. `npm test` (36 files, 673 passed, 2 skipped), `npm run test:types`, `tsc --noEmit` and `npm run build` pass. The built page was read in the browser at desktop and phone width: the heading, introduction, footer credit, cards, chips, summaries, count line and Make button read exactly as before.
* **Accomplished:**
    * Catalog `ui` group: `page`, `summary` (functions that count, join and punctuate), `topicCard`, `summaryBar` and `settings` (panel headings and nouns, grade levels per topic, the multiplication words, kana row labels, cursive layouts, region names, the All chip).
    * `settings/topic-settings.ts`: ids and values stay; heading, summary noun, chip labels, preset labels and the zero message are getters over the catalog (`wordedOption`, `withPanelWords`). `sheet-summary.ts`, `topic-card.ts`, `summary-bar.ts` and `topic-settings-panel.ts` read the catalog.
    * `public/index.html` holds structure only; `applyPageWords` in `main.ts` fills the heading, subheading, logo alt, credit, `lang` and title at startup, and the introduction is written once (the duplicate is gone). `<title>` keeps its English text in the HTML as a fallback until the script runs.
    * Tests: `tests/unit/settings/topic-settings/words.test.ts`, a words block in `tests/unit/settings/sheet-summary.test.ts`, and words blocks added to the existing `tests/dom/ui/topic-card.test.ts` and `summary-bar.test.ts`, plus new `tests/dom/ui/topic-settings-panel.test.ts`; `tests/support/visible-words.ts` and a larger marker catalog. Mutation-tested: a panel heading reading the wrong catalog field was caught, then restored.
* **Decisions:** the catalog decides words, the code decides ids and values (saved settings are untouched). Kana row labels and region names are in the catalog; cursive set labels and multiplication numbers are letters and digits and stay in code. Single-choice summaries still lowercase the label with `toLowerCase()`, which suits English only.
* **Open Issues:**
    * No language selector or saved language yet; `setLanguage` has one language. A switch needs a reload (words are written when components are built).
    * `describePanel` and `summarizePanel` lowercase single-choice labels; a language that dislikes that needs a catalog hook.
    * Longer translated text may not fit compact cards, the summary bar's one line or the 266pt exercise header. Fonts for non-Latin scripts are not in place.
    * Country names, hiragana pronunciation hints and the cursive emoji words are still English-only content.
    * During this work I overwrote the existing `tests/dom/ui/topic-card.test.ts` and `summary-bar.test.ts` by mistake, then restored them from git and added the new tests on top; the earlier note that the repo has no `tests/dom/` yet is out of date.

### 2026-10-21 - Tests run in CI (Claude)
* **Status:** Done and committed (`31e4242`). The human tried it on GitHub with throwaway commits on `test-branch` (`4d7decb`, `23079c4`, adding `test-file.txt` and `test.txt`; both files removed afterwards). The workflow commands were never run locally here (the human skipped that step).
* **Accomplished:**
    * New `.github/workflows/ci.yaml`: triggers on `pull_request` and on pushes to branches other than `main`; read-only permissions; one `test` job (checkout, Node from `.nvmrc` with the npm cache, `npm ci`, `npm test`, `npm run test:types`, `npm run build`); a newer push to the same ref cancels the older run.
    * `.github/workflows/pages.yaml`: `npm test` and `npm run test:types` added between `npm ci` and `npm run build`. Triggers, permissions, environment and deploy steps are unchanged.
* **Open Issues:**
    * Observed by the human: the check ran after the merge finished and did not stop it. Two causes, neither in the repo. (1) A check blocks a merge only when the repository has a branch protection rule on `main` with "Require status checks to pass before merging" and the `test` check (the job in `ci.yaml`) selected; GitHub only offers a check there after it has run once. (2) A merge made on the command line (`git checkout main && git merge <branch>`, then a push) never goes through a pull request, so `ci.yaml` cannot gate it; on that push only `pages.yaml` runs, and it does stop a failing build from deploying. To gate merges: open a pull request, let `ci.yaml` run on it, set the protection rule, and merge on GitHub.
    * Still to do on GitHub: add the branch protection rule and confirm a red check blocks the merge button.
