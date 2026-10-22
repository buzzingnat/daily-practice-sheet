import { defineConfig } from 'vitest/config';

// The quick suite, what `npm test` and `npm run test:watch` run while developing: in-memory unit
// tests under Node, in under two seconds. Tests live in tests/, apart from the app, so esbuild never
// meets them. The heavy checks (the exhaustive `*.full.test.ts` sweeps, the jsdom tests in
// tests/dom/, the file-system tests in tests/architecture/) wait for `npm run test:full`, which
// vitest.full.config.mts configures.
export default defineConfig({
    test: {
        environment: 'node',
        include: ['tests/unit/**/*.test.ts'],
        exclude: ['**/node_modules/**', '**/*.full.test.ts']
    }
});
