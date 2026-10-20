# plan.md — Cheering animal mascot on every half-page

Status: **awaiting validation**.

## Goal
Each half-page gets a small black-and-white animal in a coloring-page style, with a short cheer ("You can do it!") in a speech bubble. The child can color it in. The page stays black and white.

## The art and its license
* Source: `public/img/mascots/various-animals.svg`, from abbythepup.com. Its About Us page says the content is under a Creative Commons Public Domain Dedication (CC0). That allows copying, modifying and republishing with no credit required. The site's separate Terms and Conditions page contains standard "all rights reserved" wording that does not match; I am following the explicit CC0 statement on the About page. To be safe, keep a record of that statement: the plan adds it to `readme.md` with the URL and the date it was read (2026-10-19).
* The credit is voluntary but kept: the page footer in `public/index.html` (now `spratth c 2026`) gets a second line, "Animal illustrations from <a href="https://www.abbythepup.com">abbythepup.com</a> (CC0)". No credit line is printed on the worksheets.
* Not used: the three Magnific files (their license forbids public redistribution) and my own bear, owl and robot. `cute-*-designed-by-magnific.svg` must **not** be committed. They get deleted from `public/img/mascots/` (or moved to a gitignored folder, your call) before any commit. My bear/owl/robot stay as they are, unused unless you want them as extra mascots.

## What the sheet contains (measured)
Eight top-level groups, one per animal, in a 5607 x 2361 sheet. Each is 945 units tall. Group order in the file and where it sits:

| Animal | Left x | Top y | Width |
|---|---|---|---|
| crab | 0 | 0 | 1251 |
| chicken | 1698 | 0 | 737 |
| pig | 2904 | 0 | 1166 |
| ladybug | 4429 | 0 | 1179 |
| dog | 310 | 1417 | 706 |
| schnauzer | 1537 | 1417 | 1127 |
| frog | 3081 | 1417 | 985 |
| tiger | 4582 | 1417 | 727 |

The art is solid color regions with no outlines, plus 43 translucent shadow copies (`opacity`), four gradients and a few ellipses.

## Turning it into coloring pages (one-time script)
New `scripts/split-mascots.mjs`, plain Node with no new packages. It reads the sheet, takes each of the eight groups, and writes one small SVG per animal into `public/img/mascots/animals/` (`crab.svg`, `chicken.svg`, `pig.svg`, `ladybug.svg`, `dog.svg`, `schnauzer.svg`, `frog.svg`, `tiger.svg`):
1. The `viewBox` is that animal's own box from the table, so no paths are edited.
2. Remove the translucent shadow copies and the gradients.
3. Every region gets a white fill, except very dark regions (eyes, noses, dark mouths), which stay black.
4. Every region gets a black stroke with rounded joins. Stroke width is set in sheet units so it prints as about 0.8pt at the 44pt height (about 17 units; tuned by eye).
5. Write the files, so anyone can re-run the script.
The generated files are committed. The big sheet stays as the source.

**First step, before any worksheet code:** run the script and show you all eight animals at print size, so you can see which look good. Busy ones (the schnauzer's fur, the tiger's stripes, the ladybug's wings) may need a thicker stroke, a simpler fill rule, or to be dropped. I expect to keep five to eight.

## Where it goes
Per half-page (396pt tall): 40pt header, then 2 x 155pt quadrants, ending at y = 350, which leaves a 46pt band above the cutting line. The animal is now **52pt tall** (8pt taller than the first idea of 44pt; one canvas pixel is one pt in this project, so 8px is 8pt). Its width scales with it, from the sheet's own proportions: about 50 to 69pt, for example the crab (widest) about 69pt and the dog (narrowest) about 39pt.

A 52pt animal does not fit in a 46pt band, and the exercise images are drawn with an opaque white background, so an animal reaching up into a quadrant would be covered. The fix is to **move the exercise grid up 6pt**: the grid top goes from `startCoordinateY + 40` to `startCoordinateY + 34`. The quadrants keep their 155pt height and the Name/Date text stays where it is (baseline y = 20, so about 11pt of clear space remains above the first exercise title). The band becomes y = 344 to y = 396, 52pt tall, and holds the animal exactly. This is the one layout change; it applies to both halves and to the answer key.

* The animal sits at the right end of the band, 52pt tall, its bottom on the band's bottom (y = 396 minus a small gap above the cutting line, about 2pt, so ink does not touch the perforation line).
* A speech bubble to its left, right-aligned, holds the cheer in bold 11pt text.
* A lone half-page still gets its animal. The answer key keeps the same band, with the cheer "Check your work!" so the key is not mistaken for a worksheet.

Open question: moving the grid up 6pt tightens the header a little. If the sheet looks cramped when printed, the alternative is a 46pt animal. A printed sample settles it.

## Drawing and loading (no new dependencies)
* The per-animal SVGs are loaded with the existing `getSharedImage` in `src/asset-manager.ts` and cached. They are preloaded at startup next to the kana image in `src/main.ts` (line 344), so drawing stays synchronous like the kana exercise.
* New `src/worksheet/mascots.ts`: the list of animals (name, file URL, width-to-height ratio), `drawMascot` (draws the cached image at the right size), `drawMascotBand` (bubble with tail, plus the cheer) and `pickMascotAndCheer(halfPageIndex)`.
* The band is drawn on its own small canvas at the same 3x scale, through a helper beside `renderQuadrantToPdf` in `src/worksheet/worksheet-layout.ts`, and added with the same `addImage` call.
* Colors come from `COLOR_BLACK` and `COLOR_WHITE`.

## Which animal and which cheer
`pickMascotAndCheer(halfPageIndex)` cycles through the animals and about eight cheers ("You can do it!", "Great job!", "Keep going!", "Nice work!", "You are a star!", "Almost there!", "Super thinking!", "High five!"). Cycling, not random, means the same batch always gives the same output, which is easy to test. No setting is added; the mascot is always on.

## Decorating the rest of the page: vines, leaves and daisies
Decided: the vine border (the earlier "Option B" mock-up), built from **only three shapes: vine, leaf and daisy**. No tulips, and no zentangle corners. The vine placement from the mock-up stays as it is for now.

**Printer safety.** Most home printers cannot print within about 14pt of the paper edge, and the side margins are 40pt. All decoration stays at least 14pt from the page edge, and never crosses the exercise area (x from 40 to 572), the cutting line at y = 396 or the crosshair lines.

**Placement (unchanged from the mock-up, with the new grid and band positions).**
* A wavy vine with leaves climbs the left margin (centered at x = 27) from the band up to the header. Three daisies sit on it.
* A second vine runs along the left part of the band toward the speech bubble. Three daisies sit on it (the two daisies and the tulip of the mock-up become three daisies).
* A short vine with leaves and two daisies sits in the top-right margin by the Date line (the tulip there becomes a daisy).
* The vines and leaves are the same on every page, so the border looks like one border.

**Flowers vary slightly on each page.** Each daisy has a base spot on its vine. On every half-page the code nudges each daisy from its base spot, and the flower stays on the vine:
* Position: slid along the vine by up to about 15pt on the left vine, 20pt on the band vine and 8pt on the top-right vine. The base gap between two daisies minus both slides is always larger than their two largest radii (17pt), so daisies never overlap; the top-right pair sits 30pt apart (y = 28 and 58, slide 3pt) for this reason, since a first preview with a 22pt gap showed them touching. A flower never leaves the 14pt page-edge limit or reaches the exercise area.
* Size: the daisy radius varies between 6 and 8.5pt.
* Petal turn: each daisy is rotated by a random angle, which costs nothing and makes them look hand-placed.
* Leaves and vine paths do not move.
The variation comes from a small seeded random generator (`createDecorationRandom(seed)` in `decorations.ts`, a few lines, no packages), seeded from the half-page's number in the batch. This keeps two promises: a batch always prints identically for the same settings, and **the answer key page has the same flowers as its worksheet** (it is drawn with the same seed). `Math.random()` is not used. If a seeded helper already exists in `src/`, I will reuse it; the one in `tests/support/seeded-random.ts` is for tests only and `src/` cannot import from `tests/`.

**How it is built (no new dependencies).**
* New `src/worksheet/decorations.ts`: `drawLeaf`, `drawDaisy`, `drawVine`, `createDecorationRandom`, and `drawHalfPageDecorations(context, seed)`. Colors come from `COLOR_BLACK` and `COLOR_WHITE`; line caps are round, as the style guide asks.
* One transparent half-page layer (612 x 396pt at 3x) holds the decorations and the animal band. It is added to the PDF **after** the four exercise images, so it sits on top; this is safe because the vines stay out of the exercise area and the animal's band is clear of the quadrants after the 6pt grid shift. It is a transparent PNG, so it never hides an exercise.
* `renderSingleWorksheetPage` gains a `decorationSeed` argument: two seeds per sheet (top half and bottom half), `sheetIndex * 2` and `sheetIndex * 2 + 1`. The answer-key call passes the same values. `buildCompositeWorksheet` passes 0 and 1.
* No setting to turn it off in this plan.
* The mock-ups were generated from the same shapes the code will use, but they are mock-ups: sizes and spacing get tuned once real sheets print.

## Files
* New: `scripts/split-mascots.mjs`, `public/img/mascots/animals/*.svg` (generated), `src/worksheet/mascots.ts`, `src/worksheet/decorations.ts`, `tests/unit/worksheet/mascots.test.ts`, `tests/unit/worksheet/decorations.test.ts`.
* Changed: `src/worksheet/worksheet-layout.ts` (one transparent half-page layer in `renderHalfSheet`, plus a helper; grid top moves from 40 to 34; a `decorationSeed` argument), `src/main.ts` (preload), `public/index.html` (footer credit), `readme.md` (license note and how to re-run the script).
* Removed: the three `*-magnific.svg` files from `public/`.
* Untouched: every exercise, the settings and the generator.

## Tests
* `pickMascotAndCheer`: cycles through every animal, never returns an empty cheer, same input gives the same output.
* Every cheer fits the bubble at 11pt (measured with a fixed-width fake context, or a character limit).
* The band stays inside the free space: below the quadrants (which now end at y = 344), above the cutting line at y = 396, and the 52pt animal fits it for every animal's proportions.
* Decorations: every vine, leaf and daisy stays 14pt from the page edge, clear of the exercise area and above the cutting line, for many seeds. The same seed gives the same flowers; different seeds give different daisy positions; no two daisies overlap, for many seeds. The answer-key layer equals the worksheet layer for the same seed. Break the overlap rule once on purpose to confirm the test fails. Seeds in tests come from `createSeededRandom`.
* The script's output: eight files, each with only white or black fills, a stroke on every region, no `opacity` and no gradient (a test that reads the generated files).
* The `tests/architecture` dependency checks still pass.
* `npm test`, `npm run test:types`, `npm run build`, then generate a sheet in the browser and look at both the worksheet and the answer key. Print one page to check the coloring size.

## Out of scope
Changing quadrant sizes, per-topic animals, a setting to hide the mascot.
