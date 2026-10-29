# daily-practice-sheet
This project is a Modular Educational Worksheet Generator. It produces high-resolution, print-ready PDF worksheets for learners of any age. The user selects which topics to include and how often each appears. It is a frontend vanilla TypeScript project that uses `servor` for development and `jspdf` for creating the printable worksheets.

## Running the Project
The project needs Node 22.12 or newer. Always start by running
`cd path/to/folder && nvm use`
in every terminal window to get to the correct folder and to use the node version in the .nvmrc file. If you forget, the scripts stop with a message saying so.

For development, run:
`npm run dev`
It starts four watchers in one terminal: the esbuild bundler (writes `dist/bundle.js` and copies `public/` into `dist/`), the local server at http://localhost:3000, and a TypeScript error check for the app and another for the tests.

To run the tests:
`npm test` <-- the quick suite (unit tests, under two seconds), once
`npm run test:watch` <-- reruns the quick tests as files change
`npm run test:full` <-- the full suite: the quick tests plus the slower ones (exhaustive sweeps, jsdom, file-system checks); run it before merging a branch, and CI runs it

`npm test`, `npm run test:full` and `npm run build` type-check the code first, so a type error stops them.

### Running one test file or one named test
To run a single test file, give `npm test` (or `npm run test:full`, for a file under `tests/dom/` or `tests/architecture/`, or a `*.full.test.ts` file) part of its path after a `--`:
`npm test -- tests/unit/settings/print-size.test.ts` <-- one file
`npm test -- topic-settings` <-- every file whose path contains "topic-settings"

To run a single named test, add `-t` and part of the test's name. The name is matched against the `describe` titles and the test title joined together:
`npx vitest run tests/unit/settings/print-size.test.ts -t "rounds a fraction"` <-- one test
`npx vitest run tests/unit/settings/print-size.test.ts -t "clampHalfPageCount"` <-- every test under that `describe`

`npx vitest run` skips the Node version check and the type check that `npm test` does first, so run `nvm use` before it.

### How `src/` is organized
`src/` is grouped by job, and imports may only flow downward, so the code stays easy to follow and nothing ends up tangled in a circle:
* `types.ts`, `constants.ts` and `asset-manager.ts` are shared leaves. They import nothing from the folders below.
* `text/` holds every word a person reads, as a catalog per language (`english.ts` today). It may import only the shared leaves, and every other folder may read it.
* `worksheet/` is the page layout and PDF assembly. `settings/` is the pure logic for what the user chooses. Both may import only `text/` and the shared leaves.
* `exercises/` (with `kana/` and `geography/` inside) holds one drawing module per topic. It may import `worksheet/`, `text/` and the shared leaves, and the topics do not import each other.
* `generator/` plans and deals the exercises. It may import `exercises/`, `worksheet/`, `text/` and the shared leaves.
* `ui/` is the DOM code. It may import `settings/`, `text/` and the shared leaves.
* `main.ts`, `make-example-sheet.ts` and `utils.ts` are the app-level files and may import anything. Nothing imports `main.ts`, and only these three files import `utils.ts`.

The purpose is to keep logic you can test in Node (`settings/`, `generator/`) apart from code that needs a browser (`ui/`), and to stop low-level folders from depending on high-level ones. `tests/architecture/src-folder-dependencies.test.ts` enforces it: any import that breaks the rule fails `npm run test:full` with one sentence naming the file and the import. The full rule is in `agents/AGENTS.md`, section 7.

### Adding a folder
* **A new topic under `exercises/`** (for example `exercises/letters/`) needs no setup. Put the files there and the check treats them as exercises. Add tests in the matching `tests/unit/exercises/letters/` folder.
* **A new top-level folder in `src/`** is rejected by the dependency check until it is added to the rule. Make one only for a distinct job with at least two files, and then:
    1. In `tests/support/folder-dependencies.ts`, add the folder to the `Area` type and to `FOLDER_AREAS`.
    2. Add its entry to `ALLOWED_TARGETS` (the compiler complains until you do), listing the folders it may import.
    3. Add the new area to the `ALLOWED_TARGETS` list of each folder that may import it. If nothing may, leave it out.
    4. In `tests/architecture/dependency-checker.test.ts`, add a file in the new folder to `PRETEND_PROJECT`, plus a few allowed and rejected import cases.
    5. Update the folder list in `agents/AGENTS.md` section 7 and the summary above.
    6. Move files with `git mv` (so history follows), fix the imports, mirror the tests under `tests/unit/<folder>/`, and run `npm test`, `npm run test:types` and `npx tsc --noEmit`.

## Deployment
To deploy, run:
`npm run build` <-- first runs `node build.js` which copies `public/` into `dist/`, then overwrites `dist/bundle.js` with the minified bundle
Then use everything in the `dist` folder.

## Matching worksheets to answer keys
Every half-page carries three words along its right edge, such as `drum.sock.oasis`, and its answer key carries the same three. The words come from a hash of what the half-page draws (`src/worksheet/half-page-identifier.ts`) and a 1,024-word list (`src/worksheet/identifier-words.ts`), so nothing is stored.

## Mascot art and credits
Each half-page carries a black-and-white animal in a speech bubble, to be colored in. The animals come from the sheet at `public/img/mascots/various-animals.svg`, from [abbythepup.com](https://www.abbythepup.com). Its About Us page (read 2026-10-19) says: "The content is provided under a Creative Commons Public Domain Dedication (CC0)." The credit in the page footer is a courtesy, not a requirement. The site's Terms and Conditions page carries standard all-rights-reserved wording that does not match; this project follows the explicit CC0 statement.

`scripts/split-mascots.mjs` cuts the sheet into one outline-only SVG per animal in `public/img/mascots/animals/`. Run it again after changing its settings:
`node scripts/split-mascots.mjs`

`public/img/mascots/bear.svg`, `owl.svg` and `robot.svg` are hand-drawn spares that nothing uses yet.
