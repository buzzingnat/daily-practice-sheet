# plan.md — Cursive Lowercase Letters in Montessori Order

Status: **phases 0 to 5 are done** (fonts, pure logic, the exercise, the `cursiveLetters` topic wired in, docs). What remains is the deferred work: stroke arrows (after a human designs the stroke order), joined practice, and `printLetters`. Each gets its own plan.

## Decisions (from the user)
* Separate topics for print and cursive. This plan is `cursiveLetters` only; `printLetters` gets its own plan later.
* Cursive, lowercase, Montessori order A (Cathie Perolman's six color-coded sets): **s m a t, c r i p, b f o g, h j u l, d w e n, k q v x y z**. Chips for each group plus All; the first group is the default; at least one chip stays on.
* Drills are out. Print letters are a later plan.
* Handwriting model: **Montessori Cursive** (bottom-left start, continuous movement, whole-word connection); where silent, "whatever Learning Curve draws".
* Fonts: **Learning Curve 4.0, Regular family only** (Regular, Bold, Dashed). No Starts family, no alternate g or q. `.ttf` files only. The older `learning-curve-bv` folder is deleted. License: the pack's README (free in any private and commercial manner; no resale; no CD-ROM compilations), shipped beside the fonts.
* **Two rows.** Left model panel. Letters ship without arrows first.

## Feedback from the spike printout (applied below)
* **Guide lines** (top, middle, bottom) were too light: now `COLOR_MEDIUM_GREY`, slightly heavier.
* **Model letter** a little smaller (about 5 percent: from about 112pt to about 106pt).
* **Tracing letters** larger (from about 55pt to about 59pt, the most the 58.5pt row allows).
* **Each tracing line holds exactly four letters, spaced apart, not joined** (practice is for forming each letter on its own; joining comes later). Line 1: two solid, then two dotted. Line 2: blank for practice.

## The letter quadrant (as built)
* Title `CURSIVE` (Helvetica house style at (15, 12)).
* **Left panel:** the Bold model in black.
* **Right, two ruled rows**, four slots each, with the top line, dashed midline and baseline in `COLOR_MEDIUM_GREY`:
    * Row 1: slot 1 and 2 **solid** (Regular, light grey), slots 3 and 4 **dotted** (Dashed, medium grey).
    * Row 2: four blank slots.
* **Measured, not hard-coded:** the exercise measures the font's ascender, x-height, descender and each letter's ink extents at draw time, and a pure layout function turns those numbers into positions and sizes. Tests give it numbers.
* **Fit rule:** each letter is drawn as large as the row allows (about 59pt) but never so wide that four of them overflow the line. **Wide letters therefore draw smaller:** at about 59pt only m (0.80 em wide), w, n and y do not fit four to a line, so m draws near 44pt, w near 52pt, y near 55pt, n near 57pt. The guide lines are drawn for the size actually used, so each quadrant is self-consistent, and baselines sit in the same place in every quadrant.
* Not included: arrows, key-word pictures, capitals, print letters.

## Deferred: stroke arrows
* A human goes over every letter first and designs the stroke order. After that, the arrow drawing is cleaned up from the sketch and added, **only on the first (bold) model**.
* **Saved preference for then:** Bold black letters with **medium-grey** arrows, offset slightly from the stroke, a number at the start of each. Arrow offset goes toward the outside of the bend (the convex side) so arrows stay clear of the letter. Montessori principle to check in the guide data: every first stroke starts at the lower left.
* Spike findings kept for that step: the Dashed font's dots give accurate centerline points, and following the pen path (nearest dot, preferring to go straight on) gets one correct main stroke for most letters; retraces and closures need the human-designed order. The scratch pages are in the session scratchpad, not the repo.
* The model panel keeps room around the letter for the arrows (width and margin chosen with this in mind).

## Fonts
* Shipped: `learning_curve_regular_ot_tt.ttf` (139 KB), `learning_curve_bold_ot_tt.ttf` (149 KB), `learning_curve_dashed_ot_tt.ttf` (441 KB), plus `README.TXT`, in `public/fonts/learning-curve/`.
* **Housekeeping for you:** `public/fonts/learning_curve_4.0/` (the full download, 3.5 MB with PostScript and other families) is untracked and unreferenced. Anything under `public/` is copied into the deployed site, so move it out of the project (or add it to `.gitignore`) before committing, so it does not ship.

## Data model
```typescript
export const CURSIVE_GROUPS = ['s-m-a-t', 'c-r-i-p', 'b-f-o-g', 'h-j-u-l', 'd-w-e-n', 'k-q-v-x-y-z'] as const;
export type CursiveGroup = typeof CURSIVE_GROUPS[number];        // types.ts, like KANA_ROWS
export interface CursiveCard { letter: string }                  // exercises/cursive/cursive-cards.ts
export function listCursiveCards(groups: readonly CursiveGroup[]): CursiveCard[]
// settings (phase 4): TopicSettings.cursiveLetters = { groups: readonly CursiveGroup[] }
```

## Files
New, in `src/exercises/cursive/`: `cursive-cards.ts`, `cursive-layout.ts` (pure), `cursive-fonts.ts` (loader and measuring), `cursive-exercise.ts` (drawing).
Changed in phases 0 to 3: `types.ts` (`CURSIVE_GROUPS`), `constants.ts` (font family names), `public/css/styles.css` (`@font-face`), `main.ts` (font preload, example quadrants), `public/fonts/learning-curve/` (new).
Changed in phase 4: `types.ts` (topic key, settings type), `settings/topic-settings.ts`, `settings/saved-settings.ts`, `generator/randomization-and-difficulty-generator.ts`, `main.ts`.
The dependency rule needs no change (`exercises/cursive/` is a new topic folder). The topic button text is the key (`cursiveLetters`) until the title-versus-type task lands.

## Tests (Vitest, mirroring `src/`)
* `tests/unit/exercises/cursive/cursive-cards.test.ts`: 26 letters across six groups, none missing or repeated; order matches `CURSIVE_GROUPS`; each group but the last has exactly one vowel (Perolman's stated rule); `listCursiveCards` for none, one, all groups.
* `tests/unit/exercises/cursive/cursive-layout.test.ts`: four slots per row; row patterns (solid, solid, dotted, dotted; then blank); guide lines ordered top, middle, base and inside the quadrant; letters never wider than their slot; the model never wider than its panel; the font size shrinks for wide letters and stays at the row fit for narrow ones; baselines identical across letters.
* Phase 4 adds settings, resolve, summary and saved-settings cases; the planner suite covers nine topics (511 selections).
* Mutation checks: break the group table and a layout bound, then restore.

## Phases (one commit each)
0. **Fonts:** copy the three `.ttf` files and the README into `public/fonts/learning-curve/`; add `@font-face` and the family names. (Done in this round.)
1. Spike: done (the printout).
2. **Types, cards and layout** with tests (pure). (This round.)
3. **The exercise without arrows:** `cursive-exercise.ts`, font preload, example quadrants checked by eye in the browser. (This round.)
4. **Wire in the topic:** keys, panel, resolve, summary, deck, factory, saved settings, tests; browser check of select, chips, reload, and a generated PDF among six topics.
5. **Docs:** `AGENTS.md` and `progress.md`.
6. **Later, own plans:** the stroke guides and arrows (human-designed order first); `printLetters`; capitals; joined practice (the next stage after single letters); key-word pictures.

Verification after each phase: `npx tsc --noEmit`, `npm run test:types`, `npm test`, `npm run build`; after phase 4 a PDF generated in the browser. Paper settles sizes; that check is yours.
