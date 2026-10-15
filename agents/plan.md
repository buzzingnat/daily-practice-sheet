# plan.md — Tidy `src/` into Folders

Status: awaiting human validation. No files have been moved.

## Goal
Replace the flat 27-file `src/` with a small set of folders that follow how the code depends on itself, without changing any behavior. Files move; their names, contents and exports stay the same. Only import paths change.

## What the survey found
* **All 27 files sit in one folder.** Three exceed 200 lines (`geography-exercise.ts` 433, `main.ts` 380, `region-map-data.ts` 346). Splitting them is a separate task; folders will make it easier but this plan does not touch their contents.
* **Every import in `src/` is relative and one level deep** (`'./types'`). After the move many become `'../worksheet/worksheet-layout'`. Nothing uses path aliases or dynamic imports.
* **Who else refers to `src/` paths:**
    * `build.js` and `package.json` name only `src/main.ts`. Keeping `main.ts` where it is leaves both untouched.
    * `tsconfig.json` (`rootDir: ./src`, `include: src/**/*`) and `tests/tsconfig.json` (`../src/**/*`) already cover subfolders.
    * `tests/` has 14 import lines into `src/` (nine test files). These must change.
    * `agents/AGENTS.md` (section 7 says "flat `src/`") and `agents/progress.md` (17 file mentions) need updating.
* **Runtime URLs are not affected.** Assets load from the web root (`/maps/...`, `./img/...`), not relative to the source files.
* `make-example-sheet.ts` already exists under its new name (the rename task is done).

## Proposed layout (27 files)
```
src/
    main.ts                                  entry point; stays put so build.js and package.json do not change
    make-example-sheet.ts                    app-level feature wired to a button in main.ts
    types.ts   constants.ts   utils.ts   asset-manager.ts      shared leaves
    worksheet/
        worksheet-layout.ts   generate-pdf-batch.ts
    exercises/
        addition-exercise.ts   subtraction-exercise.ts   fractions-exercise.ts   clock-exercise.ts
        kana/
            kana-exercise.ts   kana-rows.ts
        geography/
            geography-exercise.ts   europe-asia-boundary.ts   region-map-exercise.ts
            region-map-data.ts   region-views.ts
    generator/
        half-page-planner.ts   shuffled-deck.ts   randomization-and-difficulty-generator.ts
    settings/
        topic-settings.ts   print-size.ts   saved-settings.ts          pure logic, no DOM
    ui/
        topic-settings-panel.ts   print-size-panel.ts                 DOM
```
Counts: root 6 (with `main.ts`, `make-example-sheet.ts`), `worksheet/` 2, `exercises/` 4 plus `kana/` 2 plus `geography/` 5, `generator/` 3, `settings/` 3, `ui/` 2. Total 27.

**Why these cuts**
* `settings/` versus `ui/` separates pure logic (testable under Node) from DOM code (needs jsdom). It lines up with the existing `tests/unit/` versus `tests/dom/` split.
* `kana/` and `geography/` hold the topics that grew several files. The four single-file exercises stay directly in `exercises/`.
* `make-example-sheet.ts` stays at the root, not in `worksheet/`, because it imports exercises and exercises import the layout contract. Putting it in `worksheet/` would make `worksheet/` and `exercises/` depend on each other.
* `utils.ts` and `asset-manager.ts` are tiny and used from several folders, so they stay at the root beside `types.ts` and `constants.ts`.

**Dependency rule this layout makes visible (to be added to `AGENTS.md`)**
`main.ts` may import from anywhere. `ui/` imports `settings/`. `generator/` imports `exercises/`, `settings/`'s types and `worksheet/`. `exercises/` imports `worksheet/` and the root leaves. `settings/` and `worksheet/` import only root leaves. Nothing imports `main.ts`, and no folder imports a folder above it in this list.

## Method: a script moves and rewrites, the compiler checks
Hand-editing about 100 import lines is how misses happen, so a one-off Node script does it, kept in the scratchpad and not committed (it adds no dependencies):
1. Take a map of old path to new path for one phase.
2. For every `.ts` file in `src/` and `tests/`, find each relative import specifier (`from '...'`, `import '...'`), resolve it to an absolute path using the pre-move layout, apply the map, then write the specifier back relative to the file's post-move location.
3. `git mv` each file in the map, then write the rewritten imports.

`tsc` is the safety net, not the script: any missed or wrong import fails `npx tsc --noEmit` and `npm run test:types`. A move that type-checks, tests green and builds cannot have a broken import.

## Phases, one commit each
Each phase is independently green, so any one can be reverted alone.
0. **Precondition:** a clean working tree (everything pending is committed first), and a baseline recorded: test count (8 files, 268 passed, 2 skipped), `dist/bundle.js` size.
1. `settings/` and `ui/`: 5 files. Smallest importer set.
2. `generator/`: 3 files.
3. `worksheet/`: 2 files. Most importers (nearly every exercise), so the largest diff.
4. `exercises/`, then `kana/`, then `geography/`: 11 files.
5. Docs: `AGENTS.md` section 7 (replace "flat `src/`" with the layout and dependency rule; adjust the "Exercise Pattern" mention of `worksheetLayout.ts`, which is already the wrong filename), and `progress.md` (file mentions get their folders; the "flat `src/`" heading changes).

**Verification after every phase**
* `npx tsc --noEmit`, `npm run test:types`, `npm test` (same 268 passed, 2 skipped), `npm run build`.
* The minified bundle should be within a few bytes of the baseline (the code is identical; only module order may shift).
* After phase 4, a browser smoke test: reload, select all six topics allowed, generate and download a PDF, confirm the download and no console errors; reload and confirm saved settings return.
* `git status` shows renames (`R`) and not delete-plus-add, so `git log --follow` keeps history.

## Out of scope (listed so it is not done by accident)
* Splitting the three files over 200 lines.
* Renaming any file (for example shortening `randomization-and-difficulty-generator.ts`).
* Path aliases or index/barrel files. They would need matching changes in `tsconfig`, esbuild and Vitest for little gain at this size.
* Changing `types.ts` or moving its types closer to their users.

## Open questions
1. Is the layout acceptable, in particular `settings/` versus `ui/`, and `make-example-sheet.ts` at the root?
2. Should `tests/unit/` mirror the new `src/` folders afterwards (for example `tests/unit/generator/shuffled-deck.test.ts`, `tests/unit/settings/print-size.test.ts`, `tests/unit/exercises/kana/kana-rows.test.ts`)? It keeps "one test file per module" easy to find, and the same script handles it as an optional phase 6. If yes, the `topic-settings/` test folder moves under `tests/unit/settings/`.
3. One commit per phase (my recommendation), or a single commit at the end?
4. Should a Vitest check enforce the dependency rule (it scans `import` lines and fails if a folder imports one it should not)? Small and dependency-free, but it is one more thing to maintain.
