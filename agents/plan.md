# plan.md — Answer Sheet for the Generated Worksheet

Status: **approved; phase 1 done.** Decisions: the key is appended as extra pages of the same PDF (only when some quadrant can answer); hiragana and cursive stay unchanged.

## Goal
When a batch is generated, also produce an answer sheet that matches it exactly: same pages, same half-pages, same quadrants, with the answers filled in.

## The core problem
Exercises roll their dice when they are created (`createAdditionExercise` picks its sums inside the factory) and expose only `render()`. So the answers cannot be recomputed afterwards: the answer sheet must be drawn from the **same exercise objects** as the worksheet. Nothing may be regenerated.

## Design
Add one optional method to the exercise contract in `worksheet/worksheet-layout.ts`:

```typescript
export interface QuadrantExercise {
    render(quadrantContext: QuadrantContext): void;
    // Draws the worksheet with the answers filled in. Absent when the exercise has nothing to answer.
    renderAnswers?(quadrantContext: QuadrantContext): void;
}
```

The answer sheet is the same batch (`HalfPageLayout[][]`) rendered a second time with a flag that picks `renderAnswers` where it exists and `render` otherwise. Each exercise keeps its problem data in the closure it already has, so `renderAnswers` needs no new state.

### Answers by topic
| Topic | Answer sheet shows |
|---|---|
| Addition, Subtraction | The same stacks with the result written in the answer box, in black |
| Fractions | The fraction written beside the shaded circle |
| Telling time | The time written in the digital box |
| Setting time | The hands drawn on the clock face |
| Countries, Continents | The answer label (already computed in `answerLabel`) written in the answer space |
| Hiragana, Cursive | `render` unchanged (tracing has no answer). A completed example would be extra scope. |

### Output
* A second PDF, `educational-worksheet-batch-answers.pdf`, downloaded right after the worksheet. Same page count, so pages line up when held side by side.
* A small "ANSWER KEY" tag in the Name/Date header line of each half-page, so the key cannot be mistaken for a worksheet.
* Placed in `buildAndDownloadWorksheetBatch` (add an `answers: boolean` parameter that is passed down through `renderSingleWorksheetPage` and `renderQuadrantToPdf`).

Open choice: a second PDF file (recommended: print the worksheet without the key) versus the key appended as extra pages of the same file. Browsers sometimes ask permission for two downloads in a row.

## Files
Changed: `worksheet/worksheet-layout.ts`, `exercises/addition-exercise.ts`, `subtraction-exercise.ts`, `fractions-exercise.ts`, `clock-exercise.ts`, `geography/geography-exercise.ts`, `geography/region-map-exercise.ts`, `main.ts` (the download button handler; the batch must be generated once and used for both PDFs). `generate-pdf-batch.ts` and `make-example-sheet.ts` hold older copies of the pipeline; I would leave them alone unless you want them updated too.
No new files, no new dependencies.

## Tests (Vitest)
* Pipeline: with a recording fake context, a quadrant rendered in answer mode calls `renderAnswers` when present and `render` when not.
* Addition and subtraction: the answers drawn equal the sums and differences of the problems drawn on the worksheet (catches the regeneration bug above). Break the arithmetic on purpose once to confirm the test fails.
* Fractions, clock and geography: answer text drawn matches the exercise's inputs.

## Phases (one commit each)
1. Contract and pipeline (`renderAnswers` optional, answer flag, second download, header tag), with no exercise using it yet.
2. Addition and subtraction answers, with tests.
3. Fractions and clock answers, with tests.
4. Geography and country answers, with tests.
5. Docs: `AGENTS.md` and `progress.md`.

Verification after each phase: `npx tsc --noEmit`, `npm run test:types`, `npm test`, `npm run build`; after phase 1 and phase 4 a generated pair of PDFs checked in the browser.

## Questions for you
1. Second PDF file, or appended pages in the same file?
2. Should hiragana and cursive show a completed example, or stay as they are?
