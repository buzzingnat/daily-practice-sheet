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
`npm test` <-- runs the whole suite once
`npm run test:watch` <-- reruns tests as files change

`npm test` and `npm run build` type-check the code first, so a type error stops them.

### Running one test file or one named test
To run a single test file, give `npm test` part of its path after a `--`:
`npm test -- tests/unit/settings/print-size.test.ts` <-- one file
`npm test -- topic-settings` <-- every file whose path contains "topic-settings"

To run a single named test, add `-t` and part of the test's name. The name is matched against the `describe` titles and the test title joined together:
`npx vitest run tests/unit/settings/print-size.test.ts -t "rounds a fraction"` <-- one test
`npx vitest run tests/unit/settings/print-size.test.ts -t "clampHalfPageCount"` <-- every test under that `describe`

`npx vitest run` skips the Node version check and the type check that `npm test` does first, so run `nvm use` before it.

### How `src/` is organized
`src/` is grouped by job, and imports may only flow downward, so the code stays easy to follow and nothing ends up tangled in a circle:
* `types.ts`, `constants.ts` and `asset-manager.ts` are shared leaves. They import nothing from the folders below.
* `worksheet/` is the page layout and PDF assembly. `settings/` is the pure logic for what the user chooses. Both may import only the shared leaves.
* `exercises/` (with `kana/` and `geography/` inside) holds one drawing module per topic. It may import `worksheet/` and the shared leaves, and the topics do not import each other.
* `generator/` plans and deals the exercises. It may import `exercises/`, `worksheet/` and the shared leaves.
* `ui/` is the DOM code. It may import `settings/` and the shared leaves.
* `main.ts`, `make-example-sheet.ts` and `utils.ts` are the app-level files and may import anything. Nothing imports `main.ts`, and only these three files import `utils.ts`.

The purpose is to keep logic you can test in Node (`settings/`, `generator/`) apart from code that needs a browser (`ui/`), and to stop low-level folders from depending on high-level ones. `tests/architecture/src-folder-dependencies.test.ts` enforces it: any import that breaks the rule fails `npm test` with one sentence naming the file and the import. The full rule is in `agents/AGENTS.md`, section 7.

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
