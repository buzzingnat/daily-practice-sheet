# plan.md

Plan: prune and simplify the test suite, then keep it small. Revised 2026-10-22 to add three goals. Nothing below has been done; waiting for approval.

## 0. Goals

1. Delete or rewrite tests that break during a refactor with no change in behavior. A test coupled to an internal name, a list order, a label or a constant tests the implementation.
2. The quick suite, the one run while developing, finishes in under 2 seconds, in memory. A separate full suite may be slower and runs before code is shared (see section 3a).
3. Test only the critical core: the money path (the core logic or math whose failure means the app is broken), complex data transformations (messy input reshaped into structured output), and nasty edge cases (null, empty, negative, boundary). Skip boilerplate getters, simple UI wrappers and third-party library calls.

Goal 3 is the gate every test passes through, and goals 1 and 2 follow from it: a test that fits none of the three is deleted, and fewer tests is how the suite gets under 2 seconds.

## 1. Where this suite stands

Measured on 2026-10-22 under Node 24.21.0:

| Measure | Value |
| --- | --- |
| Test files | 36 (28 unit, 3 DOM, 3 architecture, plus 5 support helpers) |
| Tests | 675 (673 pass, 2 skipped by `test.skipIf` in `shuffled-deck.test.ts`) |
| Test code | 3,325 lines, plus 392 lines of support helpers |
| Source code | 6,611 lines |
| Test-to-source ratio | about 0.5 |
| `vitest run` wall time | 5.2 s (Vitest's own figure); 6.5 s measured end to end |
| `npm test` | about 1.3 s longer, since `pretest` type-checks first |
| Slowest single file | `half-page-planner.test.ts`, about 2.4 s, nearly all in "gives the same plan for the same seed" (2.0 s) |
| Worker startup | 36 workers at about 161 ms each, plus jsdom for 3 files |

The test count overstates the distinct behaviors: 6 files produce 408 of the 675 tests, mostly through `test.each` and `describe.each` (`panels` 100, `print-size` 65, `cursive-emoji` 60, `dependency-checker` 51, `resolve` 38, `saved-settings` 33). A fair estimate is 250 to 300 distinct checks.

Two findings that matter for goal 2:
- The planner file alone takes about 2.4 s, longer than the whole budget. Because files run in parallel, the suite cannot get under 2 s until that file does. Trimming other tests first would show almost no gain.
- Running without per-file isolation (`--no-isolate`) saved only about 0.3 s when I tried it (4.9 s against 5.2 s), because the planner file dominates. It is a small win to revisit after the planner is fixed, not a main lever.
- Three test files use `jsdom`, and two architecture tests read the file system (`src-folder-dependencies` lists `src/` with `import.meta.glob`; `mascot-animal-files` reads the mascot folder). "Entirely in memory" is violated by those five files.

## 2. How that compares with other projects

What a search could back up:

- Test-to-code ratio. A study of about 82,000 open source projects averaged 0.06 test lines per source line, and only 17% had tests ([arXiv 1704.08412](https://arxiv.org/pdf/1704.08412)); about 55% of GNOME and KDE projects had none or almost none ([Collabora](https://collabora.com/news-and-blog/blog/2018/11/23/metrics-for-test-suite-comprehensiveness)). Projects that test well usually land between 0.5 and 2: Drupal modules at about 0.5 ([Drupal metrics](https://project.pages.drupalcode.org/audit_trail/metrics/)), Yegor Bugayenko's projects at 0.6 to 2.3 ([Yegor256](https://yegor256.com/2019/07/02/tdd-misbeliefs.html)). DHH calls above 2 a smell. This project's 0.5 is normal for well-tested code, so line count is not the problem.
- Run time. Half of commercial Rails apps in Semaphore's dataset build in about 3 minutes or less on CI ([Semaphore](https://semaphoreci.com/?p=296)). That is a whole CI build, not a test run. I found no open source benchmark for suite run time.

From general knowledge, not sourced: libraries of a few thousand lines of source typically run a few hundred tests in 1 to 10 seconds; mid-size apps (50,000 to 200,000 lines) run thousands of tests in 30 seconds to several minutes, parallelised; very large projects shard across machines and take hours on one.

Conclusion: the suite is not large or slow for its size. The reasons to prune are the three goals above: less upkeep, failures that mean something, and a run fast enough that it is always run.

## 3. The revised approach

### 3a. Two tiers: a quick suite and a full suite
Added 2026-10-22 at your suggestion. It fits the goals well, and it resolves most of the tension in goal 2.

| | Quick | Full |
| --- | --- | --- |
| Command | `npm test` and `npm run test:watch` | `npm run test:full` |
| Runs | while developing, on every save | before a commit is shared, and in CI |
| Budget | under 2 s, in memory, node only | a soft ceiling of about 20 s (my guess; the audit will set it) |
| Holds | money-path, transformation and edge-case tests, with a sampled planner sweep | everything in quick, plus the heavy checks: the full planner selection x seed sweep, the jsdom DOM tests, and the file-system architecture tests |

How it would be built, with no new packages: the existing `vitest.config.mts` becomes the quick config and excludes a `*.full.test.ts` filename suffix plus `tests/dom/` and `tests/architecture/`; a second file, `vitest.full.config.mts`, includes everything and keeps `fsModuleCache: false`. `package.json` gets `test:full` (`vitest run --config vitest.full.config.mts`), with the same `pretest`-style Node check. In `.github/workflows/ci.yaml`, the `npm test` step becomes `npm run test:full`. `tests/tsconfig.json` must list the second config file.

What this changes in the plan:
- Goal 2 now binds the quick tier only. The full planner sweep comes back, as a `half-page-planner.full.test.ts`, beside a small sampled version in the quick tier. That undoes my earlier decision to give up the sweep.
- The file-system architecture tests and the DOM tests no longer need an "exception" or a cut for speed. They go in the full tier. The audit still asks goal 1 and goal 3 of them: a DOM test that only wraps simple UI is still cut, whichever tier it would live in.
- The full tier is not a dumping ground. Every test in it must pass the same three-category gate. A slow test earns its place only by guarding something the quick tier cannot, such as exhaustive combinations or the real `src/` folder.

Risks to accept knowingly:
- A break found only by the full tier shows up later, at commit or in CI, not on save. That is the price of speed, and it is why the quick tier must still cover every money-path rule on a sample.
- Nothing forces anyone to run the full tier locally except CI. I would not add a git hook (it needs a new tool or hand-made files, and AGENTS.md forbids unapproved dependencies); CI is the net. If you want a local net, say so and I will propose one separately.
- Two configs can drift apart. Keeping the second one a three-line change over the first limits that.

### Step 1. Baseline and audit (no deletions yet)
Measure `vitest run` and `npm test` three times each to get a stable baseline. Then classify every test file, and each group of tests inside the larger ones, into a table in this file with one verdict each:

| Verdict | Meaning |
| --- | --- |
| Keep | Fits money path, complex transformation or nasty edge case, and tests behavior |
| Rewrite | Fits, but is coupled to implementation; rewrite against behavior |
| Cut | Fits none of the three, or is redundant with `tsc` or another test |
| Move | Keep the check but drop the cost (for example, in-memory instead of file system or jsdom) |

I will bring the table to you for approval before deleting anything. To test goal 1 on evidence and not on reading alone, I will also run a "refactor probe" on a scratch branch: make three behavior-neutral changes (rename an internal helper, reorder a specification's options, change a label word) and record which tests fail. Any test that fails with no behavior change is a Rewrite or Cut candidate. The branch is discarded afterwards.

### Step 2. Fix the planner (needed for goal 2)
`half-page-planner.test.ts` replays every selection and seed combination. The rules it checks (distinct topics per half-page, even spread, no topic more than one appearance ahead, determinism, empty selection throws) are the money path, so they stay. The quick file shrinks the sweep to a sample, and the original exhaustive sweep moves to `half-page-planner.full.test.ts` for the full tier: a handful of selections that cover the cases (1, 2, 3, 4, 5 and many topics) and a few dozen seeds each. A rule that breaks usually breaks on many seeds, not one in thousands. Determinism needs only a few replays. Target: under 0.3 s for the file. I will confirm the smaller sweep still fails by breaking each rule once on purpose.

### Step 3. Apply the audit
Likely outcomes, to be confirmed or overturned by the audit:

- Collapse repeated per-item cases into one collecting test per property (the style AGENTS.md section 8 already prefers). Applies to `print-size`, `cursive-emoji`, `panels`, and probably `resolve`, `saved-settings`, `kana-rows`. Keep only edge cases that cross a boundary (`clampHalfPageCount` at 0, negative, above the maximum, a fraction, NaN) and one collecting test for the in-range cases.
- Cut tests that copy a constant into an assertion: `panels` defaults ("starts countries with only Africa chosen", "starts multiplication on the numbers 1 to 5"), chip label wording, option order, "finds the apple for a", `printed-titles`, `mascots` and `worksheet-layout` getters. They fail on a deliberate edit and prove nothing about behavior. Where one such fact is a rule other code depends on (a default is one of its own options), keep the rule as one collecting test.
- Cut most of `dependency-checker.test.ts` (51 tests). It tests a test tool on made-up projects. Keep one case per rule the real `src/` check depends on, plus "reports every offense" and the unresolvable import.
- Cut or shrink the three DOM tests (`topic-card`, `summary-bar`, `topic-settings-panel`). Under goal 3 they are simple UI wrappers, and they carry the jsdom cost. I earlier listed them as keepers because they catch hard-coded English; that is a real rule (AGENTS.md section 6), so the audit will decide whether the same check can run without jsdom against the catalog, or whether it is dropped. This reverses my earlier "keep".
- Keep, as the money path: the answer tests (`arithmetic-answers`, `fractions-and-clock-answers`, `first-grade-arithmetic`, `multiplication-exercise`), `shuffled-deck`, `half-page-identifier`, `problem-numbers`, and the planner.
- Keep, as complex transformations and edge cases: `saved-settings` (messy stored input to validated settings), `topic-settings/resolve`, `chips` and `summary`, `sheet-summary`, the cursive layout files, `kana-rows`, `cursive-cards`. Subject to the coupling audit, since a few of these probably assert on exact strings.
- Undecided: `decorations` and `mascots`. They guard print geometry (the 6pt mascot reach into the grid, the 14pt paper-edge margin), which is a boundary condition, but they may be written against internals. The audit decides.

### Step 4. Build the two tiers (section 3a)
Add `vitest.full.config.mts`, the `test:full` script, the filename convention, and the CI change. Place `src-folder-dependencies`, `mascot-animal-files` and any surviving DOM tests in the full tier only. They guard rules `tsc` cannot (the folder dependency rule; every mascot file present) but read the file system or need jsdom, so they do not belong in the 2-second tier.

### Step 5. Startup cost
After steps 2 and 3, re-measure. With fewer files and no jsdom, the 36 workers drop sharply. Only then consider `--no-isolate` or a lighter pool; the earlier trial showed about 0.3 s, so it is worth taking only if it is the difference between 2.0 s and 1.9 s and the suite stays green on three runs.

### Step 6. Rules for tests going forward (edit AGENTS.md section 8)
Replace or amend these existing lines:
- "One test file per source module" becomes "A module gets a test file only if it holds money-path logic, a complex transformation or a nasty edge case. Most modules (constants, getters, drawing wrappers, UI wiring) get none."
- Add a gate: before writing a test, name which of the three categories it is. If it is none, do not write it.
- Add the refactor rule: a test that fails when an internal name, a list order, a label or a constant changes, with the behavior intact, is wrong; rewrite it against the behavior or delete it.
- Add the two tiers and the speed budget: the quick suite (`npm test`) runs in under 2 seconds with no network, no browser, no jsdom and no file system. A test that needs any of those, or takes more than about 100 ms, goes in the full tier (`*.full.test.ts`, `tests/dom/`, `tests/architecture/`) and still passes the three-category gate. Check the quick figure with `npm test` after adding tests.
- Keep the existing rules that still fit: collect offenders into a list, inject randomness, confirm a new test can fail by breaking the rule on purpose.

## 4. Expected result

| | Now | After |
| --- | --- | --- |
| Tests | 675 | roughly 200 to 250 (set by the audit, so a range) |
| Test files | 36 | roughly 20 to 25 |
| Quick suite (`vitest run`, `npm test`) | about 5.2 s | the target is under 2 s; with the planner sweep, jsdom and file-system tests moved to the full tier this is likely reachable, but I will report the measured figure, not the target |
| Full suite (`npm run test:full`) | does not exist | a few seconds more than quick; about the same as today's suite or less, since the pruned tests are gone from both |
| Type-check in `npm test` | about 1.3 s | still extra; under 2 s only counts if `pretest` is excluded (see section 6) |

## 5. Order and process

Order: step 1, then your approval of the audit table, then steps 2, 3, 4, 5, 6. One commit per step, with `npm test` green and `npm run test:types` clean before each. For every rewritten or collapsed test, confirm the replacement still fails when the rule is broken once, then restore it.

## 6. Decisions needed

1. Does "under 2 seconds" cover the quick suite's `vitest run` alone, or `npm test` with its type-check (about 1.3 s more)? I assume `vitest run` alone.
2. The two-tier design in section 3a, including the `*.full.test.ts` naming and CI running `test:full`. Settled by your suggestion unless you want changes; the open parts are the soft 20 s ceiling for the full tier and whether you want a local safety net beyond CI.
3. The DOM tests: the audit still decides whether any survive, since goal 3 calls simple UI wrappers skippable. Any survivors go in the full tier.
4. May I edit AGENTS.md section 8 as described in step 6?

Housekeeping: `notes.txt` is untracked and untouched; any `.vitest/` folder that test runs create is removed.

## 7. Step 1 results: baseline, refactor probe, audit (2026-10-22, branch `prune-tests`)

Approved by you the same day, with the open decisions taken as recommended. Added at your request: `AGENTS.md` now has a step 5, "The Merge Prompt", telling agents to prompt you to run the full suite before you merge a medium or large change from a feature branch into `main`, and a pointer in its Verification Commands. It says `npm test` is the full suite until step 4 creates `test:full`; step 4 must delete that parenthetical. Nothing has been deleted from the tests.

### Baseline (three runs each)
- `vitest run`: 5.16 s, 5.44 s, 5.69 s.
- `npm test` (adds the Node check and type-check): 5.78 s, 5.80 s, 5.96 s. The type-check adds about 0.4 s on a warm run; my earlier 1.3 s was a cold run.

### Refactor probe (goal 1)
I changed five English words in `src/text/english.ts` (the Addition name and title, "Cursive letters", "Up to Quarters", "Two Digit"), a change with no behavior effect, ran the suite, and reverted it. Seven tests failed, in four files:
- `messages.test.ts`: "speaks whatever catalog was swapped in, and English again after setLanguage"
- `sheet-summary.test.ts`: "writes a level topic in words and in short"; "joins the panels of a topic that owns several"
- `multiplication-exercise.test.ts`: the `titles {"mode":"two-digit"} as "MULTIPLICATION (Two Digit)"` case
- `topic-card.test.ts` (DOM): "names the topic and reports a toggle click without changing itself"; "swaps to the short name and summary in the compact view, and back"; "labels the example picture in English as it always has"

Each asserts literal English instead of going through the catalog. All seven are Rewrite or Cut below. Limits of the probe: it tests wording only. It cannot see tests coupled to list order or to constants, which I classified by reading the test names and, for the larger files, their code. If you want a second probe (say, reordering a list), that is cheap to add.

### Audit table
Counts are my estimates after the cut ("After"); they will move a little when the code is written. "Q" is the quick suite, "F" the full suite.

| File | Tests now | Verdict | Why | After |
| --- | --- | --- | --- | --- |
| `settings/print-size` | 65 | Rewrite | Five real edge cases (0, negative, huge, fraction, NaN) stay; 60 per-value cases become two collecting tests | 7 (Q) |
| `settings/saved-settings` | 33 | Rewrite | Messy stored input to valid settings is a core transformation; per-panel and round-trip loops collapse | 14 (Q) |
| `settings/sheet-summary` | 11 | Rewrite | Right behavior, but two tests failed the probe on literal English; assert through the catalog | 7 (Q) |
| `settings/topic-settings/chips` | 21 | Keep, trim | Click rules (last chip, zero, two-digit) are logic with edge cases; its trailing "multiplication settings" group duplicates `resolve` and `summary` | 16 (Q) |
| `settings/topic-settings/panels` | 100 | Cut, collapse | Mostly metadata: defaults, option order, chip wording. Keep collecting checks that ids are unique, values unique, labels present, each default is one of its options, radio panels hold one value, presets sit among the options | 12 (Q) |
| `settings/topic-settings/resolve` | 38 | Rewrite | Selections to typed settings is a core transformation with throw edges; per-topic loops collapse | 14 (Q) |
| `settings/topic-settings/summary` | 23 | Trim | Selection to words; keep one collecting case per rule (all, one, several, none) | 10 (Q) |
| `settings/topic-settings/words` | 4 | Cut 2 | Drop "keep the English wording the cards have always shown" (a wording snapshot); keep "read from the catalog each time" and "never change an option's value" | 2 (Q) |
| `text/messages` | 5 | Cut 3 | Drop name-is-not-the-key, uniqueness and short-name length (data checks); keep the catalog-swap test, rewritten against the marker catalog | 2 (Q) |
| `worksheet/decorations` | 9 | Keep | Seeded placement with boundary rules: off the exercises, inside the paper, no touching daisies | 7 (Q) |
| `worksheet/half-page-identifier` | 9 | Keep, rewrite 1 | The key must match its worksheet: money path. "wordsFromHash reads the low 30 bits as three ten-bit numbers" is coupled to the bit layout; assert only that equal drawings give equal words | 8 (Q) |
| `worksheet/mascots` | 7 | Keep, trim | Seeded pick that never repeats in 56; rectangle clear of the cutting line and printer margin are boundary rules. Drop the empty-cheer and uses-every-animal data checks | 5 (Q) |
| `worksheet/worksheet-layout` | 5 | Keep | Decides whether a quadrant draws answers; a small branch with real consequences | 5 (Q) |
| `generator/example-specifications` | 11 | Trim | Preview wiring for the UI; keep the selection-to-examples rules, cut "is a single pane" and "gives every topic a preview" | 6 (Q) |
| `generator/half-page-planner` | 9 | Keep, split | Money path. Quick: sampled sweep. Full: today's exhaustive sweep, in `half-page-planner.full.test.ts` | 9 (Q) + 1 (F) |
| `generator/shuffled-deck` | 20 | Rewrite | Fair dealing is core; per-deck-size cases collapse into two collecting tests that name the failing size | 2 (Q) |
| `exercises/arithmetic-answers` | 4 | Keep | Money path: answers match drawn problems | 4 (Q) |
| `exercises/fractions-and-clock-answers` | 3 | Keep | Money path | 3 (Q) |
| `exercises/first-grade-arithmetic` | 4 | Keep | Boundary rules (no carrying, rare zero) | 4 (Q) |
| `exercises/multiplication-exercise` | 16 | Rewrite | Keep problem rules and rare zero; collapse the per-settings loop; drop the literal "MULTIPLICATION (Two Digit)" title case (failed the probe; `printed-titles` covers titles) | 9 (Q) |
| `exercises/problem-numbers` | 5 | Keep | Rare-zero picker: edge cases | 5 (Q) |
| `exercises/printed-titles` | 8 | Cut 6 | Keep one "titles come from the catalog, not the code" collecting test and the cheer check; drop the English snapshot | 2 (Q) |
| `exercises/cursive/cursive-cards` | 24 | Cut, trim | Data restatement: order of introduction, which letters repeat, vowels per set. Keep alphabet coverage and `listCursiveCards` (none, order, dedupe) | 8 (Q) |
| `exercises/cursive/cursive-emoji` | 60 | Keep checks, collapse (your call) | Every check stays, since nothing else catches a bad entry in the data; the per-letter loops become collecting tests that name every bad letter | 6 (Q) |
| `exercises/cursive/emoji-grayscale` | 7 | Trim | Pixel transformation with edges (empty list, bad length, transparency). Drop the channel-weight and white/black cases, which restate the formula | 5 (Q) |
| `exercises/geography/answer-line` | 2 | Merge | One check that the key writes the answer after the label and the worksheet leaves it blank; the only test of the geography key | 1 (Q) |
| `exercises/kana/kana-rows` | 33 | Keep checks, collapse (your call) | Every data check stays (counts, 46 characters, hint wording and quotes, no repeats), plus `listKanaCards` (none, order, dedupe, fresh copy); per-row loops become collecting tests | 16 (Q) |
| `exercises/cursive/cursive-layout/model` | 17 | Trim | Font-metric geometry and bad input. Drop "84pt, a fifth larger than the earlier 70pt" and the 20pt minimum (constant restatements) | 13 (Q) |
| `exercises/cursive/cursive-layout/rows` | 15 | Trim | Keep rows-inside-quadrant and guide-line order; drop "describes exactly the layouts the settings offer" and the default-layout restatement | 11 (Q) |
| `exercises/cursive/cursive-layout/sizes` | 20 | Trim | Keep overflow, centering and spacing; drop "is m" and the "close to 48pt / 66pt" and "1.3 times" constants | 12 (Q) |
| `dom/ui/summary-bar` | 15 | Cut most (approved) | Simple UI wrapper; step and clamp limits are covered by `print-size`. Probe-coupled. Keep the "writes no English of its own" checks in F | 2 (F) |
| `dom/ui/topic-card` | 13 | Cut most (approved) | Same; three tests failed the probe. Keep the no-hard-coded-English check in F | 1 (F) |
| `dom/ui/topic-settings-panel` | 2 | Keep | Both are catalog guards for AGENTS.md section 6 | 2 (F) |
| `architecture/dependency-checker` | 51 | Cut, collapse | Tests a test tool on made-up projects; keep one case per rule, "reports every offense", and the unresolvable import | 12 (F) |
| `architecture/src-folder-dependencies` | 3 | Keep | Guards the real `src/` folder rule; reads the file system | 3 (F) |
| `architecture/mascot-animal-files` | 3 | Keep | Validates generated art (eight animals, viewBox, no leftover color); reads the file system | 3 (F) |

Totals: about 675 tests now; about 223 in the quick suite and about 23 more in the full-only tier (about 245 in all). (Raised from 212 and 235 after you kept the cursive-emoji and kana data checks.)

### Your answers to the table (2026-10-22)
- DOM tests: cut as suggested.
- Cursive emoji and kana data checks: kept (collapsed into collecting tests, same checks). A note in `progress.md` records that visual or snapshot testing might replace them later.
- `mascots` and `decorations`: the changes look good; proceed.

### Step 2 done: planner (2026-10-22)
- `tests/unit/generator/half-page-planner.test.ts` now runs the rules on 8 sample selections x 5 seeds (every size the rules treat differently, plus a gapped one); `throws on an empty selection` stays there. The file took about 2.4 s before and about 0.13 s now.
- `tests/unit/generator/half-page-planner.full.test.ts` runs the same rules on all 1,023 selections x 30 seeds, plus the seat-rate report; about 4.8 s. The rules live once, in `tests/support/half-page-planner-rules.ts` (two files use it, so it meets the helper rule). The full file is excluded from the quick suite in step 4; until then `npm test` runs it too.
- The rate report only prints a number and was never a rule, so it lives in the full file only.
- Mutation check on the quick file, each rule broken once and restored: ignoring the use count (two rules failed), removing the quadrant reshuffle (failed), `Math.random()` for the seeded one (failed), one half-page short (failed). One mutation, dropping the "unpicked topics first" filter, was not caught. It is an equivalent mutant: a picked topic's higher use count already keeps it from being picked again in the same half-page, so behavior does not change and no test could fail.

Support helpers (`tests/support/`, 392 lines) get a short pass in step 3: a helper only the cut tests used goes with them, per the "add a helper only when two files use it" rule.

### What I need from you now
Approve this table, or mark verdicts you disagree with. The calls I am least sure of: cutting most of the DOM tests; cutting the cursive-emoji and kana data checks (they catch a typo in the data, which no other test would); and keeping `mascots` and `decorations` (they fit "nasty edge cases" but could be judged as drawing code). On your approval I move to step 2, the planner.

### Step 3 done: the audit applied (2026-10-22)
Five commits on `prune-tests`, each with `npm test` and `npm run test:types` clean, and each rewritten or collapsed test checked by breaking its rule once (see below for the gaps this found).

| After | Test files | Tests | Wall time |
| --- | --- | --- | --- |
| Baseline | 36 | 675 | 5.2 to 5.7 s |
| Settings and text (`b9b47f9`) | 37 | 604 | 5.2 s |
| Topic settings (`961e166`) | 37 | 472 | 5.4 s |
| Generator and worksheet (`6848fd0`) | 37 | 451 | 5.2 s |
| Exercises and cursive layout (`1c32fe9`) | 37 | 338 | 5.1 s |
| DOM and architecture (`94886e2`) | 37 | 276 | 5.7 s |

The whole suite is still about 5 s because the quick/full config split is step 4: the exhaustive planner file (about 4.8 s) and the jsdom files still run with everything. Running only what the quick tier will hold (`tests/unit`, minus `*.full.test.ts`) gives 30 files, 243 tests and 0.87 to 0.97 s, well under the 2 s goal. The full suite is 37 files and 276 tests.

Differences from the table I proposed:
- Quick is 243 tests, not about 223, because I kept the kana and emoji data checks and several geometry tests whole.
- Three DOM tests remain in `tests/dom/` (the two no-hard-coded-English checks plus the summary bar's count line), with the two existing in `topic-settings-panel`; five in all, for the full tier.
- `dependency-checker` is 14 tests, with a row per rule it guards. A mutation check showed the "generator may not import ui" rule was uncovered once I had cut rows, so I added that row and its mirror back.
- `src/settings/topic-settings.ts` has `offersAll` flags per panel; since the "offers an All chip" test was cut as a constant restatement, flipping a flag no longer fails any test. The DOM test that checks the catalog's All chip only checks panels that offer one. Say if you want a one-line check restored.
- The full planner file needed `vi.setConfig({ testTimeout: 60_000 })`: its replay test passed alone but hit Vitest's 5 s default when the other files competed for the processor.
- One planner mutation (dropping the "unpicked topics first" filter) is equivalent behavior and cannot be caught.

All nine support helpers are still used by two or more test files, so none was removed.

Still to do: step 4 (two configs, `test:full`, CI change, delete the interim note in AGENTS.md), step 5 (re-measure; consider `--no-isolate`), step 6 (AGENTS.md section 8 rules).
