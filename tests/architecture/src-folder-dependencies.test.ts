import { describe, expect, test } from 'vitest';
import { classifyFile, findViolations, SourceFiles } from '../support/folder-dependencies';

// Vite reads every source file as text at test time, so no file-system access is needed.
// The keys look like "../../src/ui/print-size-panel.ts"; they are trimmed to "src/ui/print-size-panel.ts".
const rawSources = import.meta.glob<string>('../../src/**/*.ts', { eager: true, query: '?raw', import: 'default' });

const sourceFiles: SourceFiles = Object.fromEntries(
    Object.entries(rawSources).map(([key, source]) => [key.slice(key.indexOf('src/')), source])
);

describe('the real src/ folder', () => {
    test('is found: the glob matched the project and not nothing', () => {
        expect(Object.keys(sourceFiles).length).toBeGreaterThanOrEqual(27);
        expect(sourceFiles['src/main.ts']).toBeDefined();
    });

    test('puts every file in a folder the rule knows', () => {
        const unknown = Object.keys(sourceFiles).filter((path) => classifyFile(path) === undefined);
        expect(unknown).toEqual([]);
    });

    test('follows the folder dependency rule in AGENTS.md section 7', () => {
        expect(findViolations(sourceFiles)).toEqual([]);
    });
});
