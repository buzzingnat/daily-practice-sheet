import { defineConfig } from 'vitest/config';

// Tests live in tests/, apart from the app, so esbuild never meets them.
// Pure logic runs under Node. A DOM test opts into jsdom with a
// "// @vitest-environment jsdom" comment at the top of its file.
export default defineConfig({
    test: {
        include: ['tests/**/*.test.ts'],
        environment: 'node',
        // The folder dependency test lists src/ with import.meta.glob, and a cached transform
        // would keep the list it saw first, so a new file would go unseen. The suite is fast enough.
        fsModuleCache: false
    }
});
