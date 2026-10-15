import { describe, expect, test } from 'vitest';
import { createDefaultSelections, summarizeSelection } from '../../../../src/settings/topic-settings';
import { CONFIGURABLE_TOPICS, GradeLevel, KANA_ROWS, POPULATED_REGIONS } from '../../../../src/types';
import { LevelTopics, selectionsWith } from '../../../support/panel-selections';

describe('summarizeSelection', () => {
    test.each([
        ['addition', '1st', 'single digit'],
        ['addition', '2nd', 'double digit'],
        ['addition', '3rd', 'triple digit'],
        ['subtraction', '1st', 'up to 20'],
        ['subtraction', '2nd', 'double digit'],
        ['subtraction', '3rd', 'triple digit'],
        ['fractions', '1st', 'up to fourths'],
        ['fractions', '2nd', 'up to eighths'],
        ['fractions', '3rd', 'up to twelfths']
    ] as const)('says %s at %s is "%s"', (topic: LevelTopics, level: GradeLevel, expectedSummary: string) => {
        expect(summarizeSelection(topic, selectionsWith({ [topic]: [level] }))).toBe(expectedSummary);
    });

    test('says nothing for a level panel that holds nothing valid', () => {
        expect(summarizeSelection('addition', selectionsWith({ addition: [] }))).toBe('');
        expect(summarizeSelection('addition', selectionsWith({ addition: ['4th'] }))).toBe('');
    });

    test('says "all" when every kana row is chosen', () => {
        expect(summarizeSelection('hiragana', selectionsWith({ hiragana: [...KANA_ROWS] }))).toBe('all');
    });

    test('says "all" when every region is chosen', () => {
        expect(summarizeSelection('countries', selectionsWith({ countries: [...POPULATED_REGIONS] }))).toBe('all');
    });

    test('names the row when only one is chosen', () => {
        expect(summarizeSelection('hiragana', selectionsWith({ hiragana: ['vowels'] }))).toBe('あ vowels');
        expect(summarizeSelection('hiragana', selectionsWith({ hiragana: ['wn'] }))).toBe('わ w + n');
    });

    test('names the region when only one is chosen', () => {
        expect(summarizeSelection('countries', selectionsWith({ countries: ['Europe'] }))).toBe('Europe');
    });

    test('counts the rows when several are chosen', () => {
        expect(summarizeSelection('hiragana', selectionsWith({ hiragana: ['k', 's'] }))).toBe('2 rows');
        expect(summarizeSelection('hiragana', selectionsWith({ hiragana: KANA_ROWS.slice(0, 9) }))).toBe('9 rows');
    });

    test('counts the regions when several are chosen', () => {
        expect(summarizeSelection('countries', selectionsWith({ countries: ['Africa', 'Asia', 'Oceania'] }))).toBe('3 regions');
    });

    test('counts only values the panel offers', () => {
        expect(summarizeSelection('hiragana', selectionsWith({ hiragana: ['k', 'zz'] }))).toBe('か k');
        expect(summarizeSelection('countries', selectionsWith({ countries: [...POPULATED_REGIONS, 'Scythia'] }))).toBe('all');
    });

    test('summarizes the defaults in a few words for every panel', () => {
        const defaults = createDefaultSelections();
        CONFIGURABLE_TOPICS.forEach((topic) => {
            expect(summarizeSelection(topic, defaults).length).toBeGreaterThan(0);
        });
    });
});
