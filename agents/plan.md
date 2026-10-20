# plan.md — Multiplication Exercise (chip-selected numbers)

Status: **awaiting validation** (revised: levels replaced by number chips).

## Goal
A multiplication topic that looks like addition and subtraction (three vertical problems, title with a tag, solid line, grey answer box, answer-key version). Its settings panel is a row of chips: the numbers 0 to 12, plus "Up to 5", "Up to 12" and "Two digit".

## Settings panel
* Panel `multiplication`, `kind: 'multiple'`. Option values are `'0'` to `'12'` and `'two-digit'`. Default selection: `1 2 3 4 5`.
* Chip row, left to right: **Up to 5**, **Up to 12**, **0 1 2 ... 12**, **Two digit**.
    * **Up to 5** replaces the selection with 0 to 5. **Up to 12** replaces it with 1 to 12 (0 left out, as asked). Like the existing "All" chip, these are shortcuts, not stored values; each shows as pressed while the selection equals its set exactly.
    * **Two digit** is a real option and is exclusive: clicking it replaces the selection with just `two-digit`, and clicking any number chip drops it. The last chip standing still refuses to be switched off.
* The exclusive rule and the presets live in `settings/topic-settings.ts` as one pure function, `applyChipClick(specification, current, chip)`, so they are unit-tested without a DOM. The UI calls it from the click handlers (`buildMultipleChoice`) and otherwise keeps its behavior for every other panel.
* `PanelSpecification` gains two optional fields: `presets?: { label: string; values: string[] }[]` and `exclusiveValue?: string`. Other panels leave them out.
* Button summary: "5 numbers" for a set, the number itself for one chip, "two digit" for that mode.

## Resolved setting
`TopicSettings.multiplication` is a union: `{ mode: 'tables'; factors: readonly number[] }` or `{ mode: 'two-digit' }`. Resolve throws, as the other topics do, when nothing valid is chosen. A saved selection mixing `two-digit` with numbers resolves to two-digit.

## Problem rules
* **Tables mode:** both factors come from the chosen numbers. When the chosen numbers cannot make three different problems (a single chip, e.g. just 7), the second factor comes from 1 to 12 instead, so "7 table" gives 7 x anything. Problems are unique per sheet (3 x 4 and 4 x 3 count as different).
* **Zero** is an ordinary chip here: when the user turns on 0, it is as likely as any other number. (The rare-zero helper stays for addition and subtraction only.)
* **Two digit mode:** top 10 to 99, bottom 2 to 9.
* Title tag: "1 to 5" when the chosen numbers form an unbroken run, "Mixed" for gaps, "Two Digit" for that mode. (Long lists would overflow the 266pt quadrant.)

## New exercise
`src/exercises/multiplication-exercise.ts`: `generateMultiplicationProblemsBatch(settings)` and `createMultiplicationExercise(settings, title = 'MULTIPLICATION')`, returning `render` and `renderAnswers` from one `draw(quadrantContext, showAnswers)`. Same coordinates as addition; the sign is `x`. The drawing code stays a copy, as in addition and subtraction; I will not refactor those two.

## Wiring (everywhere subtraction appears)
* `src/types.ts`: `'multiplication'` in `TOPIC_KEYS`, `CONFIGURABLE_TOPICS`, `PANEL_IDS`; the union type in `TopicSettings`.
* `src/settings/topic-settings.ts`: options, presets, panel specification, default selection, resolve, summary, `applyChipClick`.
* `src/ui/topic-settings-panel.ts`: preset chips and the exclusive rule in `buildMultipleChoice`, through `applyChipClick`.
* `src/generator/example-specifications.ts`, `src/generator/randomization-and-difficulty-generator.ts`, `src/main.ts`: the usual type, factory and branch; `localState.multiplication`.

## Tests
* `tests/unit/settings/topic-settings/`: `applyChipClick` (presets, exclusivity, last-chip rule, preset pressed state), resolve (tables, two-digit, mixed saved selection, empty throws), summary.
* `tests/unit/exercises/multiplication-exercise.test.ts`: factors stay in the chosen set; single-chip fallback; three unique problems; two-digit ranges; answers equal top x bottom and the key draws the same problems as the worksheet. Break the product once on purpose to confirm failure.
* Existing lists of math topics get a multiplication case: `resolve`, `summary`, `saved-settings`, `example-specifications`, `tests/support/panel-selections.ts`. A DOM test under `tests/dom/ui/` clicks the chips.
* `npm test`, `npm run test:types`, `npm run build`, then the page looked at in the browser.

## Docs
`agents/AGENTS.md` (file list, settings panels paragraph) and a `progress.md` entry.

## Questions for you
1. Tables mode: both factors from the chosen numbers, with a single chip pairing against 1 to 12 (as above). Right?
2. Chip order: Up to 5, Up to 12, the numbers, Two digit last. Fine?
3. Should the topic start switched off, like the others?
