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
    test('puts each file in its area', () => {
        const cases: [string, string][] = [
            ['src/main.ts', 'app'],
            ['src/utils.ts', 'app'],
            ['src/types.ts', 'leaf'],
            ['src/worksheet/worksheet-layout.ts', 'worksheet'],
            ['src/exercises/kana/kana-rows.ts', 'exercises'],
            ['src/generator/shuffled-deck.ts', 'generator'],
            ['src/settings/print-size.ts', 'settings'],
            ['src/ui/print-size-panel.ts', 'ui'],
            ['src/text/messages.ts', 'text']
        ];
        const offenders = cases.filter(([path, area]) => classifyFile(path) !== area).map(([path]) => path);
        expect(offenders).toEqual([]);
    });

    test('has no area for a file the rule does not know', () => {
        const offenders = ['src/surprise.ts', 'src/helpers/format.ts', 'tests/unit/thing.test.ts'].filter((path) => classifyFile(path) !== undefined);
        expect(offenders).toEqual([]);
    });
});

describe('findRelativeImports', () => {
    test('finds from-imports, bare imports, dynamic imports and re-exports, and ignores package imports', () => {
        const source = [
            "import { a } from './a';",
            'import * as b from "../b/b";',
            "import './side-effect';",
            "const lazy = await import('./lazy');",
            "export { c } from '../c';",
            "import * as d3 from 'd3';"
        ].join('\n');
        expect(findRelativeImports(source)).toEqual(['./a', '../b/b', './side-effect', './lazy', '../c']);
    });
});

describe('resolveImport', () => {
    test('resolves a sibling, another folder and a deeper climb', () => {
        expect([
            resolveImport('src/ui/panel.ts', './helper'),
            resolveImport('src/ui/panel.ts', '../settings/print-size'),
            resolveImport('src/exercises/kana/kana-rows.ts', '../../types')
        ]).toEqual(['src/ui/helper.ts', 'src/settings/print-size.ts', 'src/types.ts']);
    });

    test('gives up when the path climbs out of the project', () => {
        expect(resolveImport('src/main.ts', '../../../outside')).toBeUndefined();
    });
});

describe('findViolations', () => {
    test('accepts a project where nothing imports anything', () => {
        expect(findViolations(PRETEND_PROJECT)).toEqual([]);
    });

    test('allows the imports the folder rule permits', () => {
        const cases: [string, string, string][] = [
            ['an exercise using the layout contract', 'src/exercises/clock-exercise.ts', "import { a } from '../worksheet/worksheet-layout';"],
            ['the generator dealing exercises', 'src/generator/shuffled-deck.ts', "import { a } from '../exercises/kana/kana-rows';"],
            ['a panel reading settings', 'src/ui/print-size-panel.ts', "import { a } from '../settings/print-size';"],
            ['the entry point importing a panel', 'src/main.ts', "import { a } from './ui/print-size-panel';"],
            ['an exercise reading the words', 'src/exercises/clock-exercise.ts', "import { a } from '../text/messages';"],
            ['the words reading the shared types', 'src/text/message-catalog.ts', "import { a } from '../types';"],
            ['a kana file using another kana file', 'src/exercises/kana/kana-rows.ts', "import { a } from './kana-rows';"]
        ];
        const offenders = cases.filter(([unused, path, source]) => findViolations(withSource(path, source)).length > 0).map(([name]) => name);
        expect(offenders).toEqual([]);
    });

    test('rejects the imports the folder rule forbids, naming the reason', () => {
        const cases: [string, string, string, string][] = [
            ['an exercise importing the generator', 'src/exercises/clock-exercise.ts', "import { a } from '../generator/shuffled-deck';", 'exercises may not import generator'],
            ['an exercise importing settings', 'src/exercises/clock-exercise.ts', "import { a } from '../settings/print-size';", 'exercises may not import settings'],
            ['the layout importing an exercise', 'src/worksheet/worksheet-layout.ts', "import { a } from '../exercises/clock-exercise';", 'worksheet may not import exercises'],
            ['settings importing a panel', 'src/settings/print-size.ts', "import { a } from '../ui/print-size-panel';", 'settings may not import ui'],
            ['the generator importing a panel', 'src/generator/shuffled-deck.ts', "import { a } from '../ui/print-size-panel';", 'generator may not import ui'],
            ['a panel importing the generator', 'src/ui/print-size-panel.ts', "import { a } from '../generator/shuffled-deck';", 'ui may not import generator'],
            ['the words importing an exercise', 'src/text/english.ts', "import { a } from '../exercises/clock-exercise';", 'text may not import exercises'],
            ['a dynamic import breaking the rule', 'src/settings/print-size.ts', "const lazy = await import('../ui/print-size-panel');", 'settings may not import ui']
        ];
        const offenders = cases
            .filter(([unused, path, source, reason]) => {
                const violations = findViolations(withSource(path, source));
                return violations.length !== 1 || !violations[0]?.includes(reason);
            })
            .map(([name]) => name);
        expect(offenders).toEqual([]);
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
