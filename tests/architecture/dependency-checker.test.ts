import { describe, expect, test } from 'vitest';
import {
    classifyFile,
    findRelativeImports,
    findViolations,
    resolveImport,
    SourceFiles
} from '../support/folder-dependencies';

// A tiny pretend project with one file in each area, none of them importing anything
const PRETEND_PROJECT: SourceFiles = {
    'src/main.ts': '',
    'src/utils.ts': '',
    'src/types.ts': '',
    'src/worksheet/worksheet-layout.ts': '',
    'src/exercises/clock-exercise.ts': '',
    'src/exercises/kana/kana-rows.ts': '',
    'src/exercises/geography/region-views.ts': '',
    'src/generator/shuffled-deck.ts': '',
    'src/settings/print-size.ts': '',
    'src/ui/print-size-panel.ts': '',
    'src/text/messages.ts': '',
    'src/text/message-catalog.ts': '',
    'src/text/english.ts': ''
};

// The pretend project with one file's source replaced
function withSource(path: string, source: string): SourceFiles {
    return { ...PRETEND_PROJECT, [path]: source };
}

describe('classifyFile', () => {
    test.each([
        ['src/main.ts', 'app'],
        ['src/make-example-sheet.ts', 'app'],
        ['src/utils.ts', 'app'],
        ['src/types.ts', 'leaf'],
        ['src/constants.ts', 'leaf'],
        ['src/asset-manager.ts', 'leaf'],
        ['src/worksheet/worksheet-layout.ts', 'worksheet'],
        ['src/exercises/kana/kana-rows.ts', 'exercises'],
        ['src/generator/shuffled-deck.ts', 'generator'],
        ['src/settings/print-size.ts', 'settings'],
        ['src/ui/print-size-panel.ts', 'ui'],
        ['src/text/messages.ts', 'text']
    ])('puts %s in the %s area', (path, area) => {
        expect(classifyFile(path)).toBe(area);
    });

    test.each([
        'src/surprise.ts',
        'src/helpers/format.ts',
        'tests/unit/thing.test.ts'
    ])('has no area for %s', (path) => {
        expect(classifyFile(path)).toBeUndefined();
    });
});

describe('findRelativeImports', () => {
    test('finds from-imports, bare imports, dynamic imports and re-exports', () => {
        const source = [
            "import { a } from './a';",
            'import * as b from "../b/b";',
            "import './side-effect';",
            "const lazy = await import('./lazy');",
            "export { c } from '../c';"
        ].join('\n');
        expect(findRelativeImports(source)).toEqual(['./a', '../b/b', './side-effect', './lazy', '../c']);
    });

    test('ignores package imports', () => {
        expect(findRelativeImports("import * as d3 from 'd3';\nimport { x } from 'topojson-client';")).toEqual([]);
    });
});

describe('resolveImport', () => {
    test('resolves a sibling', () => {
        expect(resolveImport('src/ui/panel.ts', './helper')).toBe('src/ui/helper.ts');
    });

    test('resolves into another folder', () => {
        expect(resolveImport('src/ui/panel.ts', '../settings/print-size')).toBe('src/settings/print-size.ts');
    });

    test('resolves a deeper climb', () => {
        expect(resolveImport('src/exercises/kana/kana-rows.ts', '../../types')).toBe('src/types.ts');
    });

    test('gives up when the path climbs out of the project', () => {
        expect(resolveImport('src/main.ts', '../../../outside')).toBeUndefined();
    });
});

describe('findViolations', () => {
    test('accepts a project where nothing imports anything', () => {
        expect(findViolations(PRETEND_PROJECT)).toEqual([]);
    });

    test.each([
        ['an exercise using the layout contract', 'src/exercises/clock-exercise.ts', "import { a } from '../worksheet/worksheet-layout';"],
        ['a deeper exercise using the layout contract', 'src/exercises/kana/kana-rows.ts', "import { a } from '../../worksheet/worksheet-layout';"],
        ['an exercise using the shared types', 'src/exercises/clock-exercise.ts', "import { a } from '../types';"],
        ['the generator dealing exercises', 'src/generator/shuffled-deck.ts', "import { a } from '../exercises/kana/kana-rows';"],
        ['a panel reading settings', 'src/ui/print-size-panel.ts', "import { a } from '../settings/print-size';"],
        ['the entry point importing a panel', 'src/main.ts', "import { a } from './ui/print-size-panel';"],
        ['the entry point importing the helper file', 'src/main.ts', "import { a } from './utils';"],
        ['a file using its own folder mates', 'src/settings/print-size.ts', "import { a } from './print-size';"],
        ['an exercise reading the words', 'src/exercises/clock-exercise.ts', "import { a } from '../text/messages';"],
        ['the words reading the shared types', 'src/text/message-catalog.ts', "import { a } from '../types';"],
        ['a kana file using another kana file', 'src/exercises/kana/kana-rows.ts', "import { a } from './kana-rows';"]
    ])('allows %s', (unused, path, source) => {
        expect(findViolations(withSource(path, source))).toEqual([]);
    });

    test.each([
        ['an exercise importing the generator', 'src/exercises/clock-exercise.ts', "import { a } from '../generator/shuffled-deck';", 'exercises may not import generator'],
        ['an exercise importing a panel', 'src/exercises/clock-exercise.ts', "import { a } from '../ui/print-size-panel';", 'exercises may not import ui'],
        ['an exercise importing settings', 'src/exercises/clock-exercise.ts', "import { a } from '../settings/print-size';", 'exercises may not import settings'],
        ['the layout importing an exercise', 'src/worksheet/worksheet-layout.ts', "import { a } from '../exercises/clock-exercise';", 'worksheet may not import exercises'],
        ['settings importing a panel', 'src/settings/print-size.ts', "import { a } from '../ui/print-size-panel';", 'settings may not import ui'],
        ['settings importing the layout', 'src/settings/print-size.ts', "import { a } from '../worksheet/worksheet-layout';", 'settings may not import worksheet'],
        ['a panel importing the generator', 'src/ui/print-size-panel.ts', "import { a } from '../generator/shuffled-deck';", 'ui may not import generator'],
        ['the generator importing a panel', 'src/generator/shuffled-deck.ts', "import { a } from '../ui/print-size-panel';", 'generator may not import ui'],
        ['the generator importing settings', 'src/generator/shuffled-deck.ts', "import { a } from '../settings/print-size';", 'generator may not import settings'],
        ['the words importing an exercise', 'src/text/english.ts', "import { a } from '../exercises/clock-exercise';", 'text may not import exercises'],
        ['a shared leaf importing a folder', 'src/types.ts', "import { a } from './settings/print-size';", 'leaf may not import settings'],
        ['a dynamic import breaking the rule', 'src/settings/print-size.ts', "const lazy = await import('../ui/print-size-panel');", 'settings may not import ui']
    ])('rejects %s', (unused, path, source, expectedReason) => {
        const violations = findViolations(withSource(path, source));
        expect(violations).toHaveLength(1);
        expect(violations[0]).toContain(expectedReason);
    });

    test('rejects any import of the entry point', () => {
        const violations = findViolations(withSource('src/ui/print-size-panel.ts', "import { a } from '../main';"));
        expect(violations.some((violation) => violation.includes('nothing imports the entry point'))).toBe(true);
    });

    test('rejects the helper file outside the app-level files', () => {
        const violations = findViolations(withSource('src/exercises/clock-exercise.ts', "import { a } from '../utils';"));
        expect(violations.some((violation) => violation.includes('only the app-level files use it'))).toBe(true);
    });

    test('keeps exercise topics independent', () => {
        const kanaUsingGeography = findViolations(withSource('src/exercises/kana/kana-rows.ts', "import { a } from '../geography/region-views';"));
        const topLevelUsingKana = findViolations(withSource('src/exercises/clock-exercise.ts', "import { a } from './kana/kana-rows';"));
        expect(kanaUsingGeography.some((violation) => violation.includes('exercise topics stay independent'))).toBe(true);
        expect(topLevelUsingKana.some((violation) => violation.includes('exercise topics stay independent'))).toBe(true);
    });

    test('rejects a file in a folder the rule does not know', () => {
        const violations = findViolations({ ...PRETEND_PROJECT, 'src/helpers/format.ts': '' });
        expect(violations).toHaveLength(1);
        expect(violations[0]).toContain('src/helpers/format.ts');
    });

    test('rejects an import that resolves to no file', () => {
        const violations = findViolations(withSource('src/ui/print-size-panel.ts', "import { a } from './missing';"));
        expect(violations).toHaveLength(1);
        expect(violations[0]).toContain('resolves to no file');
    });

    test('reports every offense, not just the first', () => {
        const violations = findViolations({
            ...PRETEND_PROJECT,
            'src/exercises/clock-exercise.ts': "import { a } from '../generator/shuffled-deck';\nimport { b } from '../ui/print-size-panel';"
        });
        expect(violations).toHaveLength(2);
    });
});
