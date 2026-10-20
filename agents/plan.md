# plan.md — Topic card grid (selector, settings and example together)

Status: **proposed, waiting for approval.** No code has been changed.

## Goal
Today the page has three disconnected stacks: topic buttons, then every selected topic's settings panel, then (further down) the example canvases. A user changing Hiragana rows has to look away from the chips to see what changed. Replace this with one card per topic. Each card holds that topic's example, its on/off selector, and its settings, so cause and effect sit together.

## What the page looks like
* One responsive grid of ten cards, in `TOPIC_KEYS` order. `grid-template-columns: repeat(auto-fill, minmax(260px, 1fr))`, so it is three or four across on desktop and one on a phone.
* Each card, top to bottom:
  1. **Example canvas** (same `drawExample` canvas, scaled to the card width with CSS; aspect ratio is already fixed by `EXERCISE_WIDTH` x `EXERCISE_HEIGHT`).
  2. **Header row**: topic name on the left, a checkbox-style toggle on the right, and the one-line summary (`topic-summary`, e.g. "Double digit") under the name.
  3. **Settings**: that topic's existing chip or segment panels, shown only while the topic is selected. Topics without settings (Setting time, Telling time, Continents) show none.
* **Unselected cards** show a dimmed preview of the topic at its saved or default settings, so a user can see what a topic looks like before adding it. Settings stay hidden until selected.
* **Selected cards** get an accent border and full opacity.
* Cards with large settings (Hiragana with 10 chips, Cursive with two panels, Countries) grow taller rather than wider. CSS `grid-auto-flow: row` with `align-items: start` keeps one tall card from stretching its neighbors.
* **Summary bar** (see the section below), replacing the old action bar. The placeholder "Make Test Sheet" button moves into it too.
* The separate "Example Exercises" section is removed.

## Summary bar (fixed, translucent)
Mocked up and approved in chat. One bar, built in `ui/summary-bar.ts`.
* **Position**: `position: sticky; bottom: 0` inside the page wrapper, placed just before the page footer. It floats at the foot of the screen on every view, and stops against the footer's top edge when the user scrolls to the end. Translucent: a semi-opaque `--bar-background` with `backdrop-filter: blur`, and a solid fallback where unsupported.
* **Rows, top to bottom**:
  1. **Summary text**: "Your sheet" and what is chosen. Normal view: whole words, two or three lines ("Addition: double digit. Hiragana: あ, か."). Compact view: one abbreviated line cut off with an ellipsis ("Add: 2-dig - Hira: あ か - +1"), with a chevron that opens the full text without leaving compact view.
  2. **Count line, on its own**: "4 of 6 topics - 2 pages" (the half-page count, in pages).
  3. **Buttons**: the compact/normal icon toggle (grid and single square, `aria-pressed`) and the **Make** button. The label is "Make", not "Make worksheets". The half-page count control stays reachable from this row (a small stepper beside the count line).
* **Compact view of the grid**: two cards across on a phone (minimum column about 130px, against 260px in normal view), example at about half size, short topic names ("Add", "Hira", "Ctry") and short chip labels ("2-dig", "Afr"). Normal view is the layout described above. The choice is saved with the other settings (`saved-settings.ts`) and restored on load.
* **Text source**: every topic and option gets a long and a short form in `settings/topic-settings.ts` (`TOPIC_LABELS`, plus a `shortLabel` on each choice). The long form builds on `summarizeSelection`, so the bar and the card summaries cannot disagree. Unit tests cover that every option has a short label no longer than its long one.

## Theme (five colors, held in one place)
* One file, `public/css/theme.css`, linked before `styles.css`, holding the whole palette as CSS custom properties on `:root`. Nothing else in the stylesheets contains a color value; every rule uses `var(--...)`. Retheme by editing only this file.
* **Palette (names and starting values, all yours to change):**

  | Property | Role | Start value |
  |---|---|---|
  | `--dark-text` | body text, headings, the Make button fill | `#1f2933` |
  | `--light-text` | text on dark or primary fills | `#ffffff` |
  | `--primary-color` | selected cards, checked chips, accent borders | `#3b5bdb` |
  | `--secondary-color` | hover states, header and footer bands | `#e7ecff` |
  | `--mid-tone` | borders, dimmed text, unselected cards | `#8a94a6` |

  Derived values (translucent bar background, focus ring, disabled fade) come from these with `color-mix()` in a short second block, so they follow when a palette color changes and you never edit them by hand.
* Replaces the greys and blues now in `styles.css` (`#bfbfbf`, `#efefef`, `#9dadfd`, `#9dfdfd` and the rest). The error red (`#b00020`) becomes a sixth property, `--alert-color`, because a refusal message must stay distinct from the theme.
* **Why CSS rather than a TypeScript constants file**: CSS cannot import TypeScript, and a page that sets its colors from JavaScript would show unstyled for a moment before the bundle loads. A CSS file also needs no rebuild when you play with colors.
* **Out of scope**: the canvas previews and the PDF stay black, white and grey, per the AGENTS.md monochrome rule (they print). Only the web page takes the theme. A contrast check on the starting values (text on each background at least 4.5:1) goes in the verification step; if you change colors later, that same check is a one-minute job in the browser.

## Behavior changes worth confirming
1. **Unselected topics now get a preview.** `buildExampleSpecifications` currently returns examples only for selected topics (all topics if none selected). Previews for unselected cards need one example per topic regardless of selection. This is a new helper, not a change to what the print generator uses.
2. **Countries makes one example per chosen region** today. In a single card I propose showing only the first chosen region's example, with the summary ("2 regions") saying there are more. Alternative: stack them inside the card. Say if you prefer that.
3. **Six-topic limit**: when six are selected, unselected cards stay visible but their toggle is disabled with a hint "Remove a topic to add this one" (today the buttons are simply disabled).
4. **Topic names**: the buttons currently show the raw key (`setTime`, `cursiveLetters`). Cards need real labels, so I add a `TOPIC_LABELS` map ("Setting time", "Telling time", "Cursive letters", and so on). Tell me if you want different wording.

## Files and steps
Each step leaves the app working and `npm test` green.

1. **Data** — `src/types.ts` / `src/settings/topic-settings.ts`: add `TOPIC_LABELS`. In `src/generator/example-specifications.ts`, export `buildTopicExample(topic, settings)` (first example only) built on the existing `buildTopicExamples`. Unit tests beside the existing ones in `tests/unit` for every topic key, including a single-topic Countries case.
2. **Card renderer** — new `src/ui/topic-card.ts`: builds one card (canvas slot, header, toggle, summary, settings slot). Reuses `renderSettingsPanels` logic by letting it render a single topic's panels into a given container (small refactor of `src/ui/topic-settings-panel.ts`: extract the per-specification body into `renderTopicSettings(container, topic, selections, onChange)`; the existing function calls it). Keeps current chip behavior, refusal messages and keyboard focus (chips update in place).
3. **Summary bar** — new `src/ui/summary-bar.ts` and the short labels in `topic-settings.ts`, with DOM tests in `tests/dom/ui/summary-bar.test.ts` (count line, abbreviated and full text, chevron, toggle saves and restores).
4. **Wire up `src/main.ts`**: `renderMainInitial` builds the grid and summary bar instead of `#topic-choices`, `#topic-settings` and `#example-section`. `clickTopicChoice` toggles the card class, shows or hides its settings, and refreshes that card's preview only. `changePanelSelection` redraws only the card whose setting changed, instead of every example as `renderExamples` does now. Persistence (`saveSelectedTopics`, `savePanelSelections`, `saveHalfPageCount`) is unchanged.
5. **Theme and styles** — new `public/css/theme.css` (the five-color palette above, linked first in `index.html`), then `public/css/styles.css`: every color becomes a `var(--...)`; replace the `#topic-choices`, `#topic-settings` and `#print-size` rules with card, grid and summary-bar rules. Chip and segment styles are kept as they are. Add `@media (max-width: 600px)` for the single column and sticky summary bar. Respect `prefers-reduced-motion` for the expand/collapse of settings.
6. **Markup** — `public/index.html`: the static fallback sections match the new skeleton (header unchanged).
   Tests for `topic-card.ts` go in `tests/dom/ui/topic-card.test.ts` (jsdom), covering toggle, the six-topic lock, and settings shown only while selected. `npm run test:types` must pass too.
7. **Check** — run the dev build and look at it in the browser at desktop and phone width; test toggling, the six-topic limit, Countries and Multiplication refusal messages, and a reload restoring saved state. Run `npm run build`, `npm test` and `npm run test:types`. Record the work in `progress.md` and clear this file, per the handoff rule. `main.ts` is already long; the card and action-bar building goes in `ui/` files (`topic-card.ts`, `summary-bar.ts`) so `main.ts` shrinks rather than grows.

## Accessibility
* The toggle is a real `<button aria-pressed>` (as the topic buttons are now) labeled with the topic name; settings fieldsets keep their legends.
* Canvas previews get `role="img"` and an `aria-label` like "Example addition exercise".
* Focus stays on the toggle after selecting, and the newly shown chips come after it in tab order.

## Out of scope
Worksheet generation, exercise drawing, mascots, and the saved-settings format. No new packages.

## Risks
* Ten canvases drawn at load, instead of only the selected ones. Each is small and the draws are cheap, but I will check load time; if it is noticeable, previews for unselected cards are drawn lazily on first view (`IntersectionObserver`).
* The settings refactor touches code with tests; I will run them after step 2 before building on it.

## After this plan
The Make button will later become "Preview", opening the preview-then-save step recorded as large task 3 in `progress.md`. That step is not part of this plan; the bar only needs room for the button label to change.
