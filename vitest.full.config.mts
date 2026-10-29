import { defineConfig } from 'vitest/config';

// The full suite, what `npm run test:full` and CI run before a merge: everything the quick suite
// runs, plus the slower checks it leaves out. A DOM test opts into jsdom with a
// "// @vitest-environment jsdom" comment at the top of its file.
export default defineConfig({
    test: {
        environment: 'node',
        include: ['tests/**/*.test.ts'],
        // The folder dependency test lists src/ with import.meta.glob, and a cached transform
        // would keep the list it saw first, so a new file would go unseen.
        fsModuleCache: false
    }
});
