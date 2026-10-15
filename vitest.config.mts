import { defineConfig } from 'vitest/config';

// Tests live in tests/, apart from the app, so esbuild never meets them.
// Pure logic runs under Node. A DOM test opts into jsdom with a
// "// @vitest-environment jsdom" comment at the top of its file.
export default defineConfig({
    test: {
        include: ['tests/**/*.test.ts'],
        environment: 'node'
    }
});
