# plan-font.md

Plan: replace Helvetica with Quicksand across the project. Written 2026-11-25. Approved by the human 2026-11-25; work happens on the branch `quicksand-font`. This is a separate file because `agents/plan.md` holds the Chinese characters plan (part 1). This change comes first, so the Chinese layout is measured once, against the final font.

## 1. Decisions made in chat (2026-11-25)
* **Font:** Quicksand 3.006 (Google Fonts, SIL Open Font License 1.1). The human chose it over Andika for its round, friendly look and single-story letters.
* **Weights:**
    * **Medium** where the code says `normal` today. Quicksand Regular's strokes are much thinner than Helvetica's (0.060 em against 0.084) and could print faint; Medium (0.080) matches.
    * **Bold** where the code says `bold`.
* **Measured against Helvetica** (Nimbus Sans, URW's metric clone) with fontTools:
    * Average width 1.00x (bold 0.99x), so layouts tuned for Helvetica should barely move.
    * x-height 0.503 against 0.516, and cap height 0.700 against 0.718, so text looks 2 to 3% smaller.
    * The longest title, "SKIP COUNTING (Up and Down)" at bold 14px, is 210px against 214px. The room is 236px: the 266px quadrant less the title's 15px left offset and a matching 15px on the right.
* **Missing pinyin marks:** Quicksand has no single characters for ü with a tone (ǖ ǘ ǚ ǜ and the capitals, U+01D5 to U+01DC). It does have the separate two-dot mark (U+0308), the separate tone marks (U+0304, U+0301, U+030C, U+0300), and the `mark` and `mkmk` positioning data that stack them. Approach (section 4):
    * **Primary:** assemble the letter from parts when drawing.
    * **Backup:** borrow those eight letters from Andika.

## 2. Where Helvetica is today
* **Canvas:** 16 files build font strings from `SANS_SERIF_FONT` (`constants.ts`), as in `` `bold 14px ${SANS_SERIF_FONT}` ``.
* **jsPDF:** `worksheet/worksheet-layout.ts` calls `setFont(SANS_SERIF_FONT, ...)` for the Name/Date line (bold 12pt), the "ANSWER KEY" label (9pt) and the three-word identifier (8pt). jsPDF only knows its built-in Helvetica, so Quicksand must be registered in each PDF.
* **Page CSS:** `public/css/styles.css` sets the page in `Arial, sans-serif` (line 34). That is not Helvetica, but it is the same family of look; it switches too (section 8, answer 1).
* **Italic:** two places ask for italic: the kana pronunciation hint (`italic 10px`) and one line in `utils.ts` (`italic 11px`). Quicksand has no italic, so the browser slants it artificially; kept as is (section 8, answer 2).
* `worksheet/generate-pdf-batch.ts` also calls `setFont`, but nothing imports it; it is dead code. Left alone here (no silent refactoring); a roadmap item removes it later (section 8, answer 4).

## 3. Changes
New assets, `public/fonts/quicksand/`:
* `Quicksand-Medium.ttf` and `Quicksand-Bold.ttf` (about 79 KB each, the static files from the Google Fonts download)
* `OFL.txt` from that download
* `readme.txt`: source, version 3.006, download date, why Medium and Bold, and the missing ü marks

Changed:
* `public/css/styles.css`: two `@font-face` rules under one family name, `Quicksand`. Medium is declared as `font-weight: 400` and Bold as `font-weight: 700`, so every existing `normal` and `bold` font string picks the right file with no code change. A one-line comment explains the 400-to-Medium mapping, which would otherwise look like a mistake. Nothing in the page disables `font-synthesis`, so the kept italic still slants.
* `constants.ts`:
    * `SANS_SERIF_FONT` becomes `'Quicksand, Helvetica, Arial, sans-serif'` for canvas, falling back if the font fails to load.
    * A new `PDF_FONT = 'Quicksand'` (added in step 4, where it is first used) names the family registered in jsPDF, which takes a single name, not a list.
* A new `worksheet/sans-serif-fonts.ts`, written in the same pattern as `exercises/cursive/cursive-fonts.ts`. It sits in `worksheet/` because its two users are `main.ts` and `worksheet/worksheet-layout.ts`. The name matches the `SANS_SERIF_FONT` constant it serves, not the font, so a later change of font does not leave it misnamed. One constant list holds each weight's CSS weight, jsPDF style and file path, so neither the loader nor the fetch repeats them; `styles.css` cannot import it and repeats the two paths with a comment pointing here. Two jobs:
    * **At startup:**
        * `document.fonts.load('400 16px Quicksand')` and `document.fonts.load('700 16px Quicksand')`, the descriptors matching the `@font-face` weights. Then throw an `Error` if `document.fonts.check` fails for either. `load` resolves with no faces when a file is missing, and a silent fallback would make the preview differ from the PDF.
        * Fetch the two `.ttf` files once and keep them as plain base64 (no data-URL prefix) for jsPDF. This is the data-loading rule: loaders run once at startup.
    * **For each PDF:** `registerPdfFonts(documentInstance)` calls `addFileToVFS(fileName, base64)` and then `addFont(fileName, PDF_FONT, 'normal')` and `addFont(fileName, PDF_FONT, 'bold')`, with the same file names. jsPDF 4.2.1 (installed) gives custom fonts Unicode-safe `Identity-H` encoding by default and embeds only the glyphs used, so no encoding argument is needed. Step 4 confirms this in the PDF's font properties.
* `main.ts`: the loader joins `initializeApp`'s `Promise.all`.
* `worksheet/worksheet-layout.ts`: call `registerPdfFonts` on both new documents (`buildCompositeWorksheet` and `buildAndDownloadWorksheetBatch` each create one), and use `PDF_FONT` in the three `setFont` calls, keeping their `'bold'` and `'normal'` styles.
* `text/english.ts`: shorter Name and Date lines (section 8, answer 3).
* `AGENTS.md`: the typography section changes from Helvetica to Quicksand Medium and Bold, with a note on the ü marks. Section 2 of `progress.md` gets a ledger entry at handoff.

Each PDF embeds the two fonts (approved 2026-11-25), once per file, not per page. The worst case is about 160 KB, the two full files uncompressed (the documents are made without `compress: true`). Because jsPDF embeds only the glyphs used, the real cost should be well under that. Step 4 measures it; turning on compression would be a separate decision.

## 4. Missing ü-with-tone marks
**Primary, assembled from parts:**
* The data keeps the normal single characters (for example lǜ in "green"), so it stays correct and searchable.
* Just before pinyin is drawn on a canvas or shown in the settings page, one small function swaps each of the eight characters for "u + two-dot mark + tone mark" (and the capitals likewise). Quicksand's mark positioning then stacks the tone above the dots.
* It lives in one shared module, `text/pinyin-display.ts`, which imports nothing.
* It is written as part of the Chinese plan (part 1), the first code that shows pinyin. This plan only records the approach. Its one test checks that each swapped letter turns back into the original with `normalize('NFC')`.
* To remove it later, delete the function and its calls.
* **Not yet checked:** no text-rendering tool here could draw the stack, so the first browser check draws "lǜsè" at 10px and 14px and looks for the tone sitting cleanly above the dots.
* **Pinyin goes through the canvas only.** The browser applies the font's stacking data; jsPDF does not shape text, so pinyin must never be drawn as jsPDF vector text.
* The Chinese plan should send pinyin through one shared drawing helper that applies the swap, so there is one call site on the canvas, plus the settings labels. It should list those call sites.

**Backup, borrowed letters:** if the stack looks wrong, add one more `@font-face` under the family name `Quicksand` that points `unicode-range: U+01D5-01DC` at Andika (OFL; files in `public/fonts/andika/` with its license). Only those eight letters come from Andika, on the canvas and the page alike. The cost is a slight mismatch in style on one letter. It needs one rule per weight (Andika Regular at 400 and Andika Bold at 700). The loader must also pass sample text containing those letters to `document.fonts.load`, because a face limited by `unicode-range` only loads when text needs it. `public/fonts/andika/` is committed only if this backup is used.

## 5. Tests
No new unit test. The pinyin helper's test belongs to the Chinese plan. The loader is a thin wrapper around `document.fonts` and jsPDF, the kind of module AGENTS.md section 8 says to leave untested; a missing font now fails loudly at startup, where the browser check sees it. No current test pins font strings or identifiers (checked 2026-11-25), so nothing goes red from the font change itself. Run `npm test`, `npm run test:types` and `npm run build`, then `npm run test:full` before merging. The identifier hash reads what quadrants draw, including font strings, so the three-word identifiers will change; that is expected. Sheets printed before the change keep their old words and still match their old keys. The ledger entry says so.

## 6. Checks by eye (the real test of this change)
* In the browser, every topic card's preview:
    * nothing overflows or crowds
    * titles with level tags fit
    * answer boxes line up with their numbers
* The page at desktop and phone width.
* A generated PDF with an answer key:
    * the Name/Date line and the "ANSWER KEY" label in the gap
    * the turned identifier
    * opened in two viewers (the browser's and Preview), with the document's font list showing Quicksand embedded and no Helvetica
* Measured, not just looked at: each title's `measureText` width stays under 236px, and the Name and Date lines at Quicksand Bold 12pt stay at about today's lengths (Name ending near x 260, Date within the right margin).
* A test print: Medium at 9 to 11px is dark enough, and Bold titles read well.

## 7. Steps (agreed workflow, 2026-11-25)
The work lives on a new branch, `quicksand-font`, cut from `main`. Every step runs the same loop:

1. **Build** the step: only the files listed for it.
2. **Check:** Claude runs `bash linux-modules/check.sh`: both type checks, the quick suite and the build, using Linux builds of esbuild, TypeScript 7, Rolldown and Lightning CSS. These were vetted against `package-lock.json` and are kept in the git-ignored `linux-modules/` folder. The human looks at the browser where the step says so; the human's own run on macOS remains the real check, at the pull request.
3. **Review:** a fresh Sonnet 5.5 agent (revised from Opus 5.5 by the human, 2026-11-25) reviews the step's diff in two passes:
    * **First pass, bugs:** wrong behavior, edge cases, PDF and canvas pitfalls.
    * **Second pass, the rest:** coding style, tidiness, maintainability, DRYness, and this project's standards. The agent gets AGENTS.md's rules with the diff, since it cannot open the files itself.
4. **Fix:** Claude applies the review. Anything Claude disagrees with is reported, not silently dropped. Claude re-runs the checks if code changed.
5. **Commit** that step's files only, named one by one: never `git add .`, never `.DS_Store`, never `font-scratch/` or `linux-modules/`, never `public/fonts/andika/` unless the backup in section 4 is used, and never the Chinese work (`public/fonts/lxgw-wenkai-gb/`, `agents/plan.md`). Each commit message ends with the attribution lines.
6. **Next step.** After the last step, Claude stops for the human's review. The human opens the pull request, which runs the full suite, and merges. Claude never merges.

Git needs file deletion to clear its own lock files. The human allowed deletion in the project folder for that purpose only (2026-11-25); nothing else is deleted without asking.

**Step 0, the branch.**
* Create `quicksand-font` from `main`.
* Commit `agents/plan-font.md`, so the plan travels with the branch.

**Step 1, font files.**
* `public/fonts/quicksand/`: `Quicksand-Medium.ttf`, `Quicksand-Bold.ttf`, `OFL.txt` and `readme.txt` (section 3).
* `readme.txt` uses the lowercase name the human prefers for every readme file (the Learning Curve readme was renamed to match in this step). It notes that the OFL allows embedding the fonts in PDFs, and that `OFL.txt` must stay beside the files.
* No code yet, so the check is the build: `dist/fonts/quicksand/` must hold all four files (`build.js` copies `public/` into `dist/`). There is no `.gitattributes` or LFS rule, so the `.ttf` files commit as ordinary binaries.

**Step 2, worksheets on screen.**
* `styles.css`: the two `@font-face` rules (Medium as 400, Bold as 700).
* `constants.ts`: `SANS_SERIF_FONT` becomes the fallback list.
* `worksheet/sans-serif-fonts.ts`, the loading half only: load, check, and throw on failure.
* `main.ts`: the loader joins startup.
* **Check by eye:** every topic card's preview, at desktop and phone width.

**Step 2b, sharp previews** (added 2026-11-25, after the human saw slightly blurry text on the cards):
* The card previews were drawn at one canvas pixel per quadrant point (266 x 155) and stretched by CSS to the card's width, so text smeared on high-density screens. Quicksand's thin, round strokes and the faded (60% opacity) unselected cards made it easy to see; the PDFs were never affected, since they draw at 3x.
* A fixed 3x was tried first; the browser's shrinking made text look over-sharpened. Final approach: draw each preview on exactly the screen pixels it covers (the preview's CSS width x `devicePixelRatio`, capped at 4 canvas pixels per point), and repaint it when that changes.
    * `ui/topic-card.ts`: the card owns one canvas and takes a `PreviewPainter` from `main.ts` (`ui/` cannot import exercises). A `ResizeObserver` on the preview slot repaints after the width settles (120 ms; the first paint is immediate), ignoring wobbles under half a pixel. `repaintPreviewIfResized()` also catches density changes.
    * `main.ts`: `drawExample` draws into the card's canvas, rounding the canvas size first and scaling to fill it exactly; it now throws instead of returning an `Error`. One window `resize` listener asks every card to re-check, which covers zoom and moving between monitors.
    * `worksheet-layout.ts`: the PDF's two `3`s become the shared `CANVAS_SCALE_MULTIPLIER`.
    * `styles.css`: `.topic-preview` keeps the quadrant's aspect ratio before its picture arrives.
* **Check by eye:** card text looks crisp and natural (neither soft nor crunchy), selected and faded alike, in both views, and after resizing the window and zooming.

**Step 2c, sizes the new font needs** (added 2026-11-25, from the human's look at the cards):
* `exercises/clock-exercise.ts`: the target time in the setting-time box was `normal 13px`, too small in Quicksand. It becomes `bold 16px`, the same as the time written into the telling box on the answer key. Measured with Quicksand Bold, "12:45" is 38px wide in the 80px box.
* Anything else the human finds too small or too large goes here too, one line each.

**Test trim (the human, 2026-11-25):** after every even-numbered step (2 and 4), cut the tests this feature added by two-thirds. As of step 2c, the feature has added no tests, so there is nothing to trim yet.

**Step 3, the page** (section 8):
* the page's own font: Arial becomes `Quicksand` in `styles.css` (one line)
* the italic lines stay as they are

**Check by eye:** the page at desktop and phone width.

**Step 3a, shared exercise type styles** (added 2026-11-26; the human designed the constants and converted the clock, Claude carried them through):
* `constants.ts`, in one commented block:
    * `EXERCISE_TITLE_SIZE`, `EXERCISE_TITLE_WEIGHT` and the full `EXERCISE_TITLE_FONT` (bold 14px), used by every exercise's title
    * `EXERCISE_MATH_NUMBER_SIZE`, `EXERCISE_MATH_NUMBER_WEIGHT` and the full `EXERCISE_MATH_NUMBER_FONT` (normal 18px), used for the numbers a child works with: clock answer and target times, addition, subtraction, multiplication, division and skip counting
    * `EXERCISE_FRACTION_ANSWER_FONT` (normal 12px): a deliberate exception, like the clock face's numerals, because the key's fraction answers sit in 30 x 16 boxes and look better printed smaller
* The clock's answer-box times change from bold 16px to the shared normal 18px (step 2c's bold 16px is superseded). Every time the code can make still fits; the widest, "10:00", is 43.1px in the 80px box.
* All exercise files read these constants; none writes its own title or main-number font string.

**Step 4, PDFs.**
* `worksheet/sans-serif-fonts.ts`: the startup fetch of the two `.ttf` files as base64, and `registerPdfFonts(documentInstance)`.
* `constants.ts`: add `PDF_FONT`.
* `worksheet/worksheet-layout.ts`: register the fonts on both new documents, and use `PDF_FONT` in its three `setFont` calls.
* `text/english.ts`: the shorter Name and Date lines, measured with Quicksand Bold at 12pt. They move here from step 3, so no commit has underscore counts measured for a font the PDF is not yet using.
* **Check by eye:** a generated PDF with an answer key:
    * the Name/Date line
    * the "ANSWER KEY" label in its gap
    * the turned identifier
    * the file size, against a PDF made on `main`

  Then a test print.

**Step 5, docs and handoff.**
* `AGENTS.md`: the typography section. The human approves the exact wording before it is committed, since it governs later agents.
* `progress.md`: the ledger entry, and these roadmap items:
    * remove `worksheet/generate-pdf-batch.ts` (section 8, answer 4)
    * remove the "Make Test Sheet" button and the code only it uses (`make-example-sheet.ts`, `renderTestWorksheetButton` in `main.ts`): left over from early development, and the site is now shared with other people. High priority, but its own small task, not part of the font change (the human, 2026-11-26)
    * from the step reviews, left out of this plan as outside its scope:
        * a shared `createScaledCanvas` helper for the three places that build a scaled canvas
        * one font-loading helper shared by the cursive and sans-serif loaders (the cursive loader has the same missing-weight gap the sans-serif loader now guards against)
* Remove `agents/plan-font.md`, now done, in a commit of its own; git history keeps it.
* Stop for the human's review, and prompt for `npm run test:full` and the pull request.

## 8. Answers (the human, 2026-11-25)
1. **The page's own font:** yes, the page switches from Arial to Quicksand too (step 3).
2. **Italic:** keep it. The kana hint and the `utils.ts` line keep `italic`, so the browser slants Quicksand artificially.
3. **Name and Date lines:** shorten the underscores (option A) to about today's lengths at bold 12pt (step 4, moved from step 3 after review). Measure the final counts with Quicksand Bold rather than trusting the estimate of 22 and 15.
4. **`worksheet/generate-pdf-batch.ts`:** unused now. Add a roadmap item to remove it (step 5); do not remove it in this plan.

Plan approved by the human, 2026-11-25.
