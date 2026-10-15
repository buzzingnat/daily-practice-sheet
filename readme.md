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

For deployment, run:
`npm run build` <-- first runs `node build.js` which copies `public/` into `dist/`, then overwrites `dist/bundle.js` with the minified bundle
Then use everything in the `dist` folder.
