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
* **Typography Specs:** Global font family uses Helvetica. Handwriting practice exercises are the exception and use a handwriting font (the Kana exercise uses a custom one).
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
  }
  export interface HalfPageLayout {
      topLeft: QuadrantExercise;
      topRight: QuadrantExercise;
      bottomLeft: QuadrantExercise;
      bottomRight: QuadrantExercise;
  }
  ```
* **Shared Types:** Types used by more than one file live in `types.ts`, which imports nothing. Types used by one module stay in that module.
* **Data Loading:** Fetching happens in dedicated loader functions called once at startup (for example `loadGeographyData`). Render functions stay synchronous and read from the cache.
* **Errors:** Throw `Error`. Do not return one.

### 7. File Organization
* Source lives in folders under `src/`, grouped by job. Paths below are relative to `src/`:
  ```
  main.ts  make-example-sheet.ts  utils.ts            app-level
  types.ts  constants.ts  asset-manager.ts            shared leaves
  worksheet/   worksheet-layout.ts  generate-pdf-batch.ts            layout contract and PDF assembly
  exercises/   addition, subtraction, fractions, clock (one *-exercise.ts each)
      kana/        kana-exercise.ts  kana-rows.ts
      geography/   geography-exercise.ts  europe-asia-boundary.ts  region-map-exercise.ts
                   region-map-data.ts  region-views.ts
  generator/   half-page-planner.ts  shuffled-deck.ts  randomization-and-difficulty-generator.ts
  settings/    topic-settings.ts  print-size.ts  saved-settings.ts     pure logic, no DOM
  ui/          topic-settings-panel.ts  print-size-panel.ts            DOM code
  ```
* **Where a new file goes:** in the folder that matches its job. A topic with two or more files of its own gets a subfolder under `exercises/`. Pure logic goes in `settings/` or `generator/`; code that touches `document` goes in `ui/`. Create a new top-level folder only for a distinct job with at least two files.
* **Dependency direction.** Imports flow downward only:
    * The app-level files (`main.ts`, `make-example-sheet.ts`, `utils.ts`) may import from any folder. Only they use `utils.ts`, which builds on `worksheet/`.
    * `ui/` imports `settings/` and the root leaves.
    * `generator/` imports `exercises/`, `worksheet/` and the root leaves.
    * `exercises/` imports `worksheet/` and the root leaves.
    * `settings/` and `worksheet/` import only the root leaves (`types.ts`, `constants.ts`, `asset-manager.ts`).
    * Nothing imports `main.ts`. `types.ts` and `constants.ts` import nothing.
  `make-example-sheet.ts` stays at the root because it imports exercises, and exercises import the layout contract; putting it in `worksheet/` would make those two folders depend on each other.
* Keep code sections single-purpose; split a file into helpers once it passes roughly 200 lines.
* Use relative imports for now (no path aliases or index files).
* New files use kebab-case (`clock-exercise.ts`). Existing files keep their names until a dedicated rename task with its own `plan.md`, so imports and documents change together. Moving a file is also a task with its own `plan.md`; move with `git mv` so history follows.

### 8. Testing
* One test file per source module, named `<module>.test.ts`. A test file is held to the same roughly 200-line limit as source: once a module's tests pass it, replace the file with a folder named after the module (`tests/unit/<module>/`), holding one file per function or behavior group (`panels.test.ts`, `resolve.test.ts`), with the shared helpers in `tests/support/`. Put it in `tests/unit/` if the module is pure logic, or `tests/dom/` if it needs `document` or `window` (add `// @vitest-environment jsdom` at the top of the file). Shared helpers live in `tests/support/`; add one there only when two test files use it.
* Tests import from `src/` with relative paths. `src/` holds no test code.
* Tests that run over many cases (every topic selection, every seed) collect all offenders into a list and expect the list to be empty, so one failure names every case it broke.
* Randomness is injected. Use `createSeededRandom` from `tests/support/seeded-random.ts`; never `Math.random()` in a test.
* A new rule in a planner, deck or parser gets a test. Confirm the test can fail by breaking the rule on purpose once, then restore it.
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

---

## Verification Commands
Before marking a task as complete, you are expected to run (or request the human to run) these validation blocks to verify your work:
* **Type Check (Continuous):** `npm run dev:types`
* **Production Build Check:** `npm run build` (its `prebuild` hook checks the Node version and runs `tsc --noEmit` first)
* **Tests:** `npm test` (one pass; its `pretest` hook checks the Node version and type-checks `src/` first) or `npm run test:watch` (watch mode)
* **Test Type Check:** `npm run test:types` (continuous: `npm run dev:test-types`, which `npm run dev` also starts)
