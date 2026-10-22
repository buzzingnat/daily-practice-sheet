# AGENTS.md — Global System Prompt & Core Directives

You are an expert Frontend Engineer working on a strict TypeScript project. Read this file completely before writing any code or proposing architecture plans. You must adhere to all constraints, style guides, and operational workflows listed below.

---

## Project Overview
This project is a Modular Educational Worksheet Generator. It produces high-resolution, print-ready PDF worksheets for learners of any age. The user selects which topics to include and how often each appears. It is a frontend vanilla TypeScript project that uses `servor` for development and `jspdf` for creating the printable worksheets.

---

## Tech Stack & Constraints
* **Language:** TypeScript 7.x (currently 7.0.2; strict mode, compiling with `tsc --noEmit`)
* **Bundler & Build Tool:** esbuild (Bundling `src/main.ts` into `dist/bundle.js`, with source maps)
* **Environment:** Client-side Browser environment (served locally via `servor` on port 3000, hosting a static public directory with hot-reloading)
* **Core Dependencies:** `jspdf` (for PDF/practice sheet generation), d3, topojson-client, topojson-specification and geojson (for geography exercise creation)
* **Rendering Context:** The native HTML5 2D Canvas context (`CanvasRenderingContext2D`) is used uniformly for live browser previews and for PDF image compilation.
* **Execution Style:** Vanilla TypeScript DOM manipulation / modern native Web APIs. Do NOT attempt to use React, Vue, or other component frameworks, as they are not installed.
* **Node:** 22.12 or newer (the `.nvmrc` pins 24.21.0). Run `nvm use` in every terminal window; the shell default may be far older. `engines` in `package.json` and `engine-strict` in `.npmrc` guard `npm install` only, so `predev`, `pretest`, `pretest:watch` and `prebuild` run `scripts/check-node-version.mjs` and stop with a plain message on an old Node.
* **Testing:** Vitest. Tests live in `tests/`, apart from `src/`, so esbuild never sees them (see the Testing section below).

---

## Karpathy's Core AI Coding Rules
These are the foundation for everything else you code. These are your touchstones. Whenever you get stuck, check back on these principles.
1. Think before coding.
2. Keep the solution simple.
3. Change only what the task requires.
4. Define success and verify before calling work complete.

---

## Forbidden AI Behaviors (Strict Enforcement)
1. **No Code Placeholders:** Never use `// ... rest of the code remains the same` or `/* TODO: implement later */`. Reprint the full function/file or provide a precise diff. Broken snippets break automatic code ingestion.
2. **No Phantom Dependencies:** Do not import or install new npm packages without human approval. Use existing utilities.
3. **No Asset/Decoration Emojis:** Do not include emojis anywhere in the codebase for styling, logging, or comments. Emojis are permitted *only* if they serve a functional, runtime purpose within the program UI text outputs.
4. **No Type Silencing:** Do not use `any`, `ts-ignore`, or `ts-expect-error`. Write precise interfaces.
5. **No Technical Shorthand:** Prioritize whole words over abbreviations. Use `context` instead of `ctx`, and `height` / `width` instead of `h` / `w`. Choose identifiers that immediately communicate purpose.
6. **No Silent Refactoring:** Do not modify, clean up, or optimize code blocks outside the immediate scope of your current task.

---

## Code Conventions
* Four spaces per indentation level. No tabs.
* Avoid classes. Compose functions.
* Prefer chained `if ... else if ... else` over `switch`.
* Check any action with a human before taking it. Measure twice, cut once. A second opinion is always valuable.

---

## Architecture & Style Guidelines

### 1. Glossary
* An exercise is a learning activity.
* A quadrant is an exercise slot in the 2x2 grid.
* A module is a source file.
* One 'sheet' equals one 'page' equals two 'half-pages'.
* Each page splits horizontally into two matching, independent half-pages (top and bottom). Each half-page has a Name/Date header followed by a rigid 2x2 matrix of four quadrants. Exercises are hot-swappable within a quadrant.

### 2. Layout Math & Dimensions
* **Target Document Size:** Standard US Letter size (612pt width x 792pt height).
* **Horizontal Margins:** Fixed 40pt (`MARGIN_X`).
* **Printable Width Area:** 532pt (`PRINTABLE_WIDTH`).
* **Exercise Block Size:** Local canvas grid boxes must map mathematically to exactly 266pt width (`EXERCISE_WIDTH`) by 155pt height (`EXERCISE_HEIGHT`).
* **Horizontal Cutoff:** An ornamental decoration line splits the document perfectly at the middle mark (396pt).
* **Half-page vertical layout:** The Name/Date line sits at 20pt; the exercise grid starts at `GRID_TOP_OFFSET` (26pt) and ends at `GRID_BOTTOM_OFFSET` (336pt). Below it, a see-through layer (drawn after the exercises, so it can never hide one) holds a border of vines and daisies (`worksheet/decorations.ts`) and a 52pt animal mascot with a speech bubble (`worksheet/mascots.ts`). The animal's feet stand at `getMascotBottomEdge`: 2pt above the cutting line, and on the bottom half 14pt above the paper edge. The animal may reach up to `MASCOT_MAX_REACH_INTO_GRID` (6pt) into the bottom of the bottom-right quadrant, so no exercise may draw below 149pt down its 155pt quadrant (the tallest today stops at 147). Keep decoration at least 14pt from the paper edge, since home printers cannot print there.
* **Half-page identifier:** Three dotted words (such as `drum.sock.oasis`) in 8pt medium grey, turned a quarter-turn to read bottom to top, baseline 20pt in from the paper's right edge and centered on the grid's height. They tie a worksheet half-page to its key (see Answer Key below).

### 3. Canvas-to-jsPDF Matrix Pipeline
To prevent blurry text or pixelation on physical paper, follow this strict rendering pipeline:
1. Initialize a hidden high-DPI canvas surface with a strict **3x scale multiplier**.
2. Render coordinate lines and shape matrices onto this scaled surface.
3. Compress and extract a base64 image string via `canvas.toDataURL('image/png')`.
4. Embed the data URL into explicit coordinate boundaries in jsPDF using `doc.addImage(..., 'FAST')`.
5. Overlay structural separator lines, crosshairs, and student headers natively using exact jsPDF vector commands for pristine vector sharpness.

### 4. Visual Identity & Styling
   * **Color Palette:** Minimalist monochrome.
     * Canvas and jsPDF code takes every color from `src/constants.ts` (`COLOR_BLACK`, `COLOR_WHITE`, `COLOR_LIGHT_GREY`, `COLOR_MEDIUM_GREY`, `COLOR_PDF_CROSSHAIR`, `COLOR_PDF_PERFORATION`). Do not write hex values or RGB triples in other files.
     * Pure Black (`#000000`) for boundaries, grids, and outlines. Pure White (`#FFFFFF`) for backgrounds.
     * Light grey (`#D1D5DB`) for tracing, structural hints, and fraction shading.
     * Medium grey (`#999999`) for emphasis fills, such as the geography highlight, that need more contrast without heavy ink coverage when printed.
     * The native jsPDF overlays use near-matches by design: the crosshairs use `COLOR_PDF_CROSSHAIR` (`#C8C8C8`, light grey) and the perforation line uses `COLOR_PDF_PERFORATION` (`#969696`, medium grey). Leave these as they are unless a task says otherwise.
* **Typography Specs:** Global font family uses Helvetica. Handwriting practice exercises are the exception and use a handwriting font: the Kana exercise uses a custom one, and the cursive exercise uses Learning Curve 4.0 by Jess Latham (Bold for the model, Regular for solid tracing copies, Dashed for dotted ones; files and license in `public/fonts/learning-curve/`, family names in `constants.ts`). Cursive text is sized from measured font metrics, not hard-coded numbers.
  * **Exercise Main Headers:** bold 14px Helvetica, placed at padded offsets (15, 12) relative to top-left.
  * **Subtext & Tracing Rules:** normal 9px - 11px Helvetica.
* **Line Weights & Caps:** Frame boundaries use `lineWidth = 1` or `1.5`. Geometry lines must utilize `context.lineCap = 'round'`. An exception is made for dashed lines, which use `context.lineCap = 'butt'`.
* **Task Interactivity Mode:**
  * *Telling/Reading Tasks:* Draw explicit features (e.g., clock hands, filled fractions) within the vector area.
  * *Setting/Creating Tasks:* Render features as blank wireframes. Provide a clear input grid outline box on the right-hand panel for digital text timestamps or answers.

### 5. Documentation & Commenting Tone
* Maintain a neutral tone throughout all documentation and comments.
* Use an active voice with concise phrasing explaining the *rationale* behind the logic rather than the obvious implementation details.
* **Commenting, Variable Naming Personality:** Emulate a blend of the concise phrasing of Ernest Hemingway, the wry, sharp-witted humor of Jane Austen, and a touch of the folksy observation of Mark Twain. A hint of wry pun appreciation can leak through occasionally.

### 6. TypeScript & Modules
* **Exercise Pattern:** Each exercise is a factory function that returns a `QuadrantExercise` (defined in `worksheet/worksheet-layout.ts`) with an explicit return type.
* **Layout Contracts:** Exercises must adhere strictly to these interfaces in `src/worksheet/worksheet-layout.ts`:
  ```typescript
  export interface QuadrantContext {
      context: CanvasRenderingContext2D;
      width: number;  // Local canvas space pixel width (266)
      height: number; // Local canvas space pixel height (155)
  }
  export interface QuadrantExercise {
      render(quadrantContext: QuadrantContext): void;
      // Draws the worksheet with the answers filled in. Absent when the exercise has nothing to answer.
      renderAnswers?(quadrantContext: QuadrantContext): void;
  }
  export interface HalfPageLayout {
      topLeft: QuadrantExercise;
      topRight: QuadrantExercise;
      bottomLeft: QuadrantExercise;
      bottomRight: QuadrantExercise;
  }
  ```
* **Emoji:** `exercises/cursive/cursive-emoji.ts` holds emoji as worksheet content, drawn at runtime in grays; that is the functional use the emoji rule permits. Keep them in that one data file, and never in comments or logs.
* **Settings Panels:** Each panel has an `id` (it names the panel in saved settings and the DOM) and a `topic` (the button that reveals it). A topic may own several panels: `cursiveLetters` owns one for its sets and one for its layout. The topic button summary joins its panels' summaries. A multiple-choice panel may also carry `presets` (shortcut chips that replace the selection with a fixed set, as `multiplication` does with Up to 5 and Up to 12) and an `exclusiveOption` (a chip, drawn last and kept out of `options`, that replaces everything and is replaced by any other, such as multiplication's Two digit; `listChoices` lists options plus it); `toggleOption` in `settings/topic-settings.ts` holds that click rule.
* **Answer Key:** Exercises choose their problems when created, so the key is drawn from the same exercise objects as the worksheet, never regenerated. An exercise with answers writes one `draw(quadrantContext, showAnswers)` routine and returns `render` (false) and `renderAnswers` (true) from it. `buildAndDownloadWorksheetBatch` appends an "ANSWER KEY" copy of every page to the same PDF, but only when some quadrant has `renderAnswers`. Hiragana and cursive have none (tracing has no answer). Each half-page's identifier (`worksheet/half-page-identifier.ts`) comes from a hash of what its four quadrants draw with `render` (never `renderAnswers`), read through a recording wrapper on a scratch canvas context; 30 bits of the hash pick three words from the 1,024 in `worksheet/identifier-words.ts`. Nothing is stored, and the key prints the same words as its worksheet. An exercise must therefore draw the same thing every time it renders: choose problems when created, never with `Math.random()` inside `render`.
* **Words:** Code names things by id (`TopicKey`, the specification `type`); the words a person reads live in `text/`. `MessageCatalog` (`text/message-catalog.ts`) lists every string; `text/english.ts` fills it in, and a new language is one more file satisfying the same interface (it will not compile with a gap), listed in `text/messages.ts`. Exercises, the layout and the UI call `getMessages()` when they draw, never at build time, and never write an English title, label or cheer of their own. Exercise factories therefore take no `title`. Strings that depend on word order (`titleWithLevel`, `levelTags`) are functions. Checks swap in `createMarkerCatalog()` (`tests/support/marker-catalog.ts`) to see whether any English is left hard-coded. The browser page is in it too (`ui`: the page shell, topic cards, summary bar, settings panels and the sentences that summarize a choice). A settings panel keeps its ids and values in `settings/topic-settings.ts` and reads its headings and chip words from the catalog through getters, so a copy or spread of a specification or option would freeze the words; `index.html` holds structure only, and `main.ts` fills its words in at startup, so a language is chosen at startup, not mid-session. DOM tests check a built component under `createMarkerCatalog()` with `collectWords` and `findUnmarkedWords` (`tests/support/visible-words.ts`). Content that is language-specific, such as country names, hiragana hints and the cursive emoji words, stays where it is.
* **Shared Types:** Types used by more than one file live in `types.ts`, which imports nothing. Types used by one module stay in that module.
* **Data Loading:** Fetching happens in dedicated loader functions called once at startup (for example `loadGeographyData`). Render functions stay synchronous and read from the cache.
* **Errors:** Throw `Error`. Do not return one.

### 7. File Organization
* Source lives in folders under `src/`, grouped by job. Paths below are relative to `src/`:
  ```
  main.ts  make-example-sheet.ts  utils.ts            app-level
  types.ts  constants.ts  asset-manager.ts            shared leaves
  text/        message-catalog.ts  english.ts  messages.ts          every word a person reads, per language
  worksheet/   worksheet-layout.ts  generate-pdf-batch.ts            layout contract and PDF assembly
               half-page-identifier.ts  identifier-words.ts     three-word half-page names
  exercises/   addition, subtraction, multiplication, fractions, clock (one *-exercise.ts each)
      kana/        kana-exercise.ts  kana-rows.ts
      cursive/     cursive-exercise.ts  cursive-cards.ts  cursive-layout.ts  cursive-fonts.ts
      geography/   geography-exercise.ts  europe-asia-boundary.ts  region-map-exercise.ts  answer-line.ts
                   region-map-data.ts  region-views.ts
  generator/   half-page-planner.ts  shuffled-deck.ts  randomization-and-difficulty-generator.ts
  settings/    topic-settings.ts  print-size.ts  saved-settings.ts     pure logic, no DOM
  ui/          topic-settings-panel.ts  print-size-panel.ts            DOM code
  ```
* **Where a new file goes:** in the folder that matches its job. A topic with two or more files of its own gets a subfolder under `exercises/`. Pure logic goes in `settings/` or `generator/`; code that touches `document` goes in `ui/`. Create a new top-level folder only for a distinct job with at least two files.
* **Dependency direction.** Imports flow downward only:
    * The app-level files (`main.ts`, `make-example-sheet.ts`, `utils.ts`) may import from any folder. Only they use `utils.ts`, which builds on `worksheet/`.
    * `ui/` imports `settings/`, `text/` and the root leaves.
    * `generator/` imports `exercises/`, `worksheet/`, `text/` and the root leaves.
    * `exercises/` imports `worksheet/`, `text/` and the root leaves.
    * `text/` imports only the root leaves, and every other folder may import `text/`.
    * `settings/` and `worksheet/` import only `text/` and the root leaves (`types.ts`, `constants.ts`, `asset-manager.ts`).
    * Nothing imports `main.ts`. `types.ts` and `constants.ts` import nothing.
  This rule is enforced by `tests/architecture/src-folder-dependencies.test.ts`, which reads every file in `src/` and fails with one sentence per offense. A file in a folder the rule does not know also fails it; to add a folder, update the table in `tests/support/folder-dependencies.ts` and this section together.
  `make-example-sheet.ts` stays at the root because it imports exercises, and exercises import the layout contract; putting it in `worksheet/` would make those two folders depend on each other.
* Keep code sections single-purpose; split a file into helpers once it passes roughly 200 lines.
* Use relative imports for now (no path aliases or index files).
* New files use kebab-case (`clock-exercise.ts`). Existing files keep their names until a dedicated rename task with its own `plan.md`, so imports and documents change together. Moving a file is also a task with its own `plan.md`; move with `git mv` so history follows.

### 8. Testing
* **Tests mirror `src/`.** One test file per source module, named `<module>.test.ts`, in the same folder path under `tests/unit/` as the module has under `src/`: `src/generator/shuffled-deck.ts` is tested by `tests/unit/generator/shuffled-deck.test.ts`, and `src/exercises/kana/kana-rows.ts` by `tests/unit/exercises/kana/kana-rows.test.ts`. A module that needs `document` or `window` is tested the same way under `tests/dom/` (add `// @vitest-environment jsdom` at the top of the file); the folder path mirrors `src/` there too.
* **Long test files split into a folder.** A test file is held to the same roughly 200-line limit as source: once a module's tests pass it, replace the file with a folder named after the module (`tests/unit/settings/topic-settings/`), holding one file per function or behavior group (`panels.test.ts`, `resolve.test.ts`).
* **Architecture tests** live in `tests/architecture/`. They check the shape of the project, not one module, so they do not mirror `src/`. `dependency-checker.test.ts` tests the checker on made-up projects; `src-folder-dependencies.test.ts` runs it on the real `src/`.
* **Reading what an exercise drew:** `createRecordingContext` in `tests/support/recording-context.ts` is a canvas stand-in that records every call and every `fillText`. Answer tests use it to check the drawn answers against the drawn problems.
* **Shared helpers** live in `tests/support/`; add one there only when two test files use it.
* Tests import from `src/` with relative paths. `src/` holds no test code.
* Tests that run over many cases (every topic selection, every seed) collect all offenders into a list and expect the list to be empty, so one failure names every case it broke.
* Randomness is injected. Use `createSeededRandom` from `tests/support/seeded-random.ts`; never `Math.random()` in a test.
* A new rule in a planner, deck or parser gets a test. Confirm the test can fail by breaking the rule on purpose once, then restore it.
* `vitest.config.mts` sets `fsModuleCache: false`, because the architecture test lists `src/` with `import.meta.glob` and a cached transform would keep the first list it saw. `tests/support/vite-types.d.ts` gives the tests Vite's `import.meta.glob` types.
* `tests/tsconfig.json` extends the root config and adds `tests/` and the Vitest config (`vitest.config.mts`, in the project root). The root `tsconfig.json` stays browser-only (`types: []`, `rootDir: ./src`).

### 9. State & Styling
* **Vanilla CSS:** Mobile-first, using standard media queries. Prefer Flexbox over other positioning.

---

## Multi-Agent Operational Workflow

Whenever you are initialized or assigned a new task, you must operate within this strict lifecycle:

1. **Read Context First:** Read this file (`AGENTS.md`) and `progress.md` before generating any output.
2. **The Plan Phase:** For any non-trivial task, do not write code immediately. Create or update `plan.md` mapping out the files you intend to create or change, your architectural reasoning, and type interfaces. Wait for human validation.
3. **The Act Phase:** Execute the code changes in isolation. Keep git commits or task payloads scoped to one cohesive feature or component at a time.
4. **The Handoff Phase:** Once tasks pass local TypeScript verification (`npm run build` or `tsc --noEmit`), document your changes at the bottom of `progress.md` under the "Active Session Ledger" section, then clear out the temporary `plan.md`.
5. **The Merge Prompt:** At the end of every medium or large code change, before the human merges its feature branch into `main`, close your final message by prompting the human to run the full test suite (`npm run test:full`), naming the branch. A change is medium or large when it touches more than a few files or changes what a module does; typo, comment, docs-only and one-line fixes are exempt. Run it yourself too if you can, and report the result faithfully. Never merge into `main` yourself. (Until the test-pruning plan adds `test:full`, `npm test` is the full suite.)

---

## Verification Commands
Before marking a task as complete, you are expected to run (or request the human to run) these validation blocks to verify your work:
* **Type Check (Continuous):** `npm run dev:types`
* **Production Build Check:** `npm run build` (its `prebuild` hook checks the Node version and runs `tsc --noEmit` first)
* **Tests:** `npm test` (one pass; its `pretest` hook checks the Node version and type-checks `src/` first) or `npm run test:watch` (watch mode). Run the full suite before merging a medium or large change (see step 5 above).
* **Test Type Check:** `npm run test:types` (continuous: `npm run dev:test-types`, which `npm run dev` also starts)
