# plan.md

Plan: roadmap items 5 and 6 in `progress.md`, on branch `prune-tests` (brought up to date with `main` on 2026-11-26). Item 5 cuts the test suites' run time; item 6 tests the arithmetic problem generators directly instead of reading their numbers back off a recording canvas. Written 2026-11-26. Approved by the human 2026-11-26 (all four questions answered yes; Mac baseline below).

## Where the time goes (measured 2026-11-26 in Claude's Linux VM, 4 cores, Vitest 5.0.4)

| Suite | Files | Tests | Wall time | Time inside test bodies |
| --- | --- | --- | --- | --- |
| Quick (`npm test`) | 34 | 255 | 4.2 s | about 0.7 s |
| Full (`npm run test:full`) | 42 | 289 | 10.4 s | about 1.2 s |

The tests themselves are cheap. The rest is set-up:

* **Module loading per file (quick suite: "import 68%").** Vitest gives every file a fresh module graph by default. With `--no-isolate` the quick suite takes 1.6 s and the full suite 7.6 s, with every test passing. `--pool=threads` adds little (1.59 s, 7.4 s).
* **The DOM environment (full suite: "environment 66%").** The three files in `tests/dom/ui/` each start jsdom, at about 2.9 s apiece. Alone they take 5.0 s. The full suite without them, unisolated, takes 2.4 s.
* **Seeds.** The heaviest test bodies are multiplication (146 to 256 ms, 300 seeds), division (44 to 106 ms, 200 seeds), `problem-numbers` (45 to 56 ms, 20,000 draws) and the planner sweep (472 ms). Trimming every seed count would save a few tenths of a second, so seeds are left to item 6, which rewrites those tests anyway.

The human's Mac, the same day: quick suite 865 ms (import 52%, tests 23%, transform 19%, worker 6%), full suite 1.74 s (environment 37%, import 26%, transform 19%, tests 16%, worker 2%). The VM runs about five times slower, but the split is alike, so the same changes help both.

## Part A: item 5, run time

### Step 0. Baseline
* The human runs `npm test` and `npm run test:full` on the Mac and pastes the two "Duration" lines. Claude records them with the VM numbers above.

### Step 1. Share modules between test files (`isolate: false`)
* **Change:** both configs set `isolate: false` and load `tests/support/reset-shared-state.ts`, which puts English back (`setLanguage('en')`, which also undoes `setMessages`) and restores every spy after each test.
* **Audit:** the only module-level state tests change is the message catalog and spies on `Math.random`, all made inside test bodies. No test uses fake timers, stubbed globals or the geography caches.
* **Checks:** 20 shuffled runs of each suite passed. A planted leak (one file's language reset removed) failed 3 of 8 shuffled runs without the setup file and 0 of 8 with it. A removed spy restore also failed 0 of 6 with it.
* **Result (VM):** quick suite 4.2 s to about 1.8 s; full suite 10.4 s to about 8.5 s.

### Step 2. One DOM file instead of three
* **Change:** `summary-bar.test.ts`, `topic-card.test.ts` and `topic-settings-panel.test.ts` became `tests/dom/ui/ui.test.ts`, one `describe` per module, so jsdom starts once. Their own language resets went too; the setup file does that now.
* **Result (VM):** full suite about 8.5 s to about 5 s; 10 shuffled runs passed.
* **Not planned:** `happy-dom` starts faster than jsdom but is a new package. Listed only so the human knows it exists.

### Step 3. Measure, and update the testing docs
* Re-measure both suites in the VM, then ask the human for Mac numbers.
* Update the `AGENTS.md` lines on the two tiers if what a test may assume changes (shared modules, the one DOM file). The wording waits for the human's approval.

## Part B: item 6, test the generators directly

Skip counting already does this: `generateSkipCountingRows(gradeLevel, random = Math.random)` is exported and tested without drawing. The other four arithmetic exercises follow it.

### Step 4. Export the generators
* **Files:** `src/exercises/addition-exercise.ts`, `subtraction-exercise.ts`, `multiplication-exercise.ts`, `division-exercise.ts`.
* **Change:** export each problem generator, each taking `random: RandomSource = Math.random` (the type in `types.ts`):
    * `generateAdditionProblems(gradeLevel, random)`
    * `generateSubtractionProblems(gradeLevel, random)`
    * `generateMultiplicationProblems(settings, random)`
    * `generateDivisionProblems(gradeLevel, random)`

    Each passes `random` on to `pickRandomWithRareZero` and the local `pickBetween` helpers. Each problem interface is exported beside its generator. The interfaces stay in their own modules, since only tests import them.
* **Unchanged:** `create...Exercise` signatures and what they draw. With the default `Math.random`, the calls to the random source happen in the same order, so a given sheet prints the same problems and the three-word identifiers do not move.
* **Rename:** the current internal names (`generateAdditionProblemsBatch` and so on) lose "Batch", since they are now exported and the plural already says it. The human to confirm.

### Step 5. Rewrite the arithmetic tests
* **Replace** the loops that spy on `Math.random`, render, and read numbers back out of the recording context, in:
    * `arithmetic-answers.test.ts`
    * `first-grade-arithmetic.test.ts`
    * `multiplication-exercise.test.ts`
    * `division-exercise.test.ts`

    Rules about numbers (ranges, no carrying in 1st grade, rare zero, exact division, three different problems) move to generator tests that call the generator with `createSeededRandom(seed)`.
* **Keep one drawing test per exercise:** the key writes each answer under its own problem, and the worksheet shows none. `arithmetic-answers.test.ts` may stay the shared one for the stacked exercises; division keeps its own, since its rows differ.
* **Seeds:** each count is cut to the fewest that still fail when its rule is broken. Claude checks this by breaking each rule once, as before. First-grade's 2,000 seeds for the rare-zero frequency is the main target.
* **Target:** the quick suite is no slower than at the end of Part A (item 6's own condition), and the four files hold fewer lines than their 408 today.

### Step 6. Handoff
* Re-measure and record the before and after for both parts in the `progress.md` ledger.
* Tick roadmap items 5 and 6, and mark the 2026-10-28 pruning entry as merged (it still says "not merged").
* Clear this file.

## How each step runs
Build, then `bash linux-modules/check.sh` and `check.sh full`, then a Sonnet 5.5 review in two passes (bugs, then style and standards), apply the fixes, commit that step's files by name, and go to the next step. Stop before the pull request; the human runs `npm run test:full` on the Mac and opens it.

## Questions for the human
All answered 2026-11-26: shared modules yes, one DOM file yes, drop "Batch" yes, Mac baseline above.
