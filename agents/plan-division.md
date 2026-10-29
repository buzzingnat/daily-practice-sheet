# plan-division.md

Plan: add a Division exercise (three levels) and choose a second new exercise. Written 2026-10-28. Nothing below has been done; waiting for approval. This is a separate file because `agents/plan.md` still holds the test-pruning plan (steps 5 and 6 remain).

## 1. Division exercise

### 1a. Does the existing level system fit?
Yes. Addition, subtraction and fractions use `GradeLevel` (`'1st' | '2nd' | '3rd'`) with a `single` choice panel and `gradeOptions(...)`. Division follows them exactly, so no new settings type, panel kind or saved-settings shape is needed. (Multiplication is the odd one out, with number chips; division does not need that.)

### 1b. Proposed levels
Every problem is exact (no remainders) and the divisor is never 0 or 1. The generator picks the divisor and the quotient, then multiplies for the dividend, so exactness holds by construction.

| Level | Divisor | Quotient | Dividend | Level tag | Chip label |
| --- | --- | --- | --- | --- | --- |
| 1st | 2 to 5 | 1 to 5 | up to 25 | Facts to 5 | Facts to 5 / To 5 |
| 2nd | 2 to 9 | 2 to 12 | up to 108 | Facts to 12 | Facts to 12 / To 12 |
| 3rd | 2 to 9 | 10 to 99 | up to 891 | Triple Digit | Triple digit / 3-dig |

Notes:
- Level 3's quotient is picked so the dividend has three digits (quotient 12 to 99 with divisor 2 to 9 would sometimes give two; the generator will require dividend of at least 100). The answer is at most two digits, so it fits the 55pt answer box.
- Duplicates on one sheet are rejected with the same `divisor/dividend` key approach the other exercises use. Smallest pool is level 1 (4 divisors x 5 quotients = 20), far above the 3 drawn.
- Zero: `0 / n = 0` is a legitimate fact. Open question below whether level 1 should include it as a rare case via `pickRandomWithRareZero`, like first-grade sums.

### 1c. Layout (two options; I recommend A)
Both keep what the other arithmetic quadrants share: bold 14px title with level tag at (15, 12), three columns, 18px sans-serif numbers, a 55 x 26 light-grey answer box, one `draw(quadrantContext, showAnswers)` routine returning `render` and `renderAnswers`, problems chosen at creation (never in `render`).

- **A. Long-division bracket (recommended).** `3 )15` drawn with a bracket and overbar, answer box above the bar where the quotient is written. It is the form children meet in school and it scales to level 3. Cost: the number rows differ from the stacked exercises, so `arithmetic-answers.test.ts` (which reads fixed y rows 62, 86 and 122) cannot take division as another entry; division gets its own row constants in its own test.
- **B. Vertical stack with a division sign.** Same rows as multiplication (`15 / 3`, line, box), so division joins the shared tests unchanged. Cost: a stacked division sign is not how it is normally written, and level 3 reads awkwardly.

### 1d. Files touched (14 plus tests and docs)
New:
- `src/exercises/division-exercise.ts`: `createDivisionExercise(gradeLevel: GradeLevel): QuadrantExercise`, kebab-case, functions only, whole-word names, `Math.random()` as subtraction does today (the injectable-randomness task is separate).

Changed (found by grepping every place `subtraction` appears):
- `src/types.ts`: add `'division'` to `TOPIC_KEYS` (after multiplication), `CONFIGURABLE_TOPICS`, `PANEL_IDS`, and `division: { level: GradeLevel }` to `TopicSettings`.
- `src/settings/topic-settings.ts`: `DIVISION_OPTIONS`, a panel specification (`single`, default `'1st'`, `offersAll: false`), the default selection, and `division` in `resolveTopicSettings`.
- `src/text/message-catalog.ts` and `src/text/english.ts`: topic name and short name, printed title `DIVISION`, level tag, panel heading, `divisionLevels` chip words.
- `src/generator/example-specifications.ts`: the `division` specification type and its branch.
- `src/generator/randomization-and-difficulty-generator.ts`: factory interface member, dispatch branch, default factory.
- `src/main.ts`: `localState` entry and the `createExerciseFromSpecification` branch (the closing `never` clause will make the compiler flag any miss).
- `saved-settings.ts` needs no edit; it loops over `PANEL_IDS` and `TOPIC_KEYS`.
- Topic card and compact view read from the catalog and `TOPIC_KEYS`; I will confirm in the browser that a ninth card still lays out and that the six-topic limit still holds.
- `src/make-example-sheet.ts` uses a placeholder; no change.

Tests (quick tier, `tests/unit/`, per the pruned-suite goals: only critical core and edge cases):
- `division-exercise.test.ts`: every problem exact, divisor 2 or more, dividend within the level's range, no duplicates, across a modest set of seeds; the answer key writes `dividend / divisor` under the right problem. Break each rule once to confirm the test can fail.
- Add division to `printed-titles.test.ts`; add it to `tests/support/marker-catalog.ts` and `panel-selections.ts` so the catalog and panel checks cover it.
- Update the round-trip fixtures in `saved-settings.test.ts` and `resolve.test.ts` only where the typed `TopicSettings` or `PanelSelections` objects no longer compile.

Docs: the exercise list in `agents/AGENTS.md` (line 134; that file already has uncommitted edits of yours, so I will touch only that line), a ledger entry in `progress.md`, and `readme.md` if it lists topics.

### 1e. Questions for you
1. Layout A (bracket) or B (stack)?
2. Level boundaries as in 1b, or different? For instance level 1 to 10 x 10 facts.
3. Remainders (`17 / 5 = 3 R 2`) are left out, since "3 R 2" overflows the answer box at 18px. Want them as a later fourth level with a wider box, or never?
4. Rare zero (`0 / 4`) in level 1, as with sums?

## 2. Second exercise: suggestions
Each fits the 266 x 155pt quadrant, needs no new packages or image assets, and can have an answer key. Ordered by my preference.

1. **Number patterns and skip counting.** `2, 4, __, 8, __` with blanks to fill. Levels by step and range: count by 2/5/10 to 50; by 3/4/6 to 100; descending and larger steps. Same `GradeLevel` panel, same answer-box style, a tiny generator, and it extends the arithmetic set sideways rather than repeating it. Smallest effort. My pick.
2. **Print letters** (already on the roadmap as `printLetters` with its own plan). The natural companion to cursive: tracing, no answer key, reuses the Learning Curve font and the practice-line layout code. Highest value if the cursive sheets are in daily use; medium effort because it needs set choices and a layout.
3. **Compare numbers.** Pairs such as `47 ( ) 74` with a `<`, `>` or `=` to write in the circle; the same approach works for fractions, tying into the fractions exercise. Three levels by size of numbers. Small effort, answer key straightforward.
4. **Missing number.** `7 + __ = 12`, `__ - 4 = 5`, `3 x __ = 18`. Algebra readiness that reuses the number generators of the existing four operations; can cover mixed operations as the top level. Small to medium.
5. **Count and write.** Rows of small shapes (or the mascot animals, if the SVG loader can draw them at small size) to count, answer in a box. Good for early learners, levels 1 to 10, 1 to 20, 1 to 50. Medium, mostly the drawing.
6. **Money.** Draw coins and bills, write the total. Useful and practical, but needs a currency decision (US coins only?) and coin artwork on canvas. Medium to large.
7. **Sight-word or spelling copywork.** Needs a word list and a language decision, since the catalog work is moving toward more than English. Medium to large; I would leave it for after the language selector.

Not suggested: word problems (text wrapping and per-language content make them costly).

## 3. Order of work if approved
1. Settle section 1e and pick the second exercise (it gets its own plan file).
2. Types, catalog and settings wiring (compiles with a stub exercise).
3. The exercise itself and its drawing.
4. Tests, breaking each rule once.
5. Browser check of the card, the preview and a generated PDF with answer key; docs and ledger.
6. Verify with `npm test`, `npm run test:types`, `npm run build`.
