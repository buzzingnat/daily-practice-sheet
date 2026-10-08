# daily-practice-sheet
This project is a Modular Educational Worksheet Generator. It produces high-resolution, print-ready PDF worksheets for learners of any age. The user selects which topics to include and how often each appears. It is a frontend vanilla TypeScript project that uses `servor` for development and `jspdf` for creating the printable worksheets.

## Running the Project
Always start by running
`cd projects/dailyPracticeSheet && nvm use`
in every terminal window to get to the correct folder and to use the node version in the .nvmrc file

For development, run two commands in separate terminal windows.
`npm run type-check` <-- checks for TS errors
`npm run dev` <-- builds and bundles ts files to the bundle.js file

For deployment, run:
`npm run build`
Then use everything in the 'public' folder.
