import { describe, expect, test } from 'vitest';
import { describeSheet, describeTopicDetail, NOTHING_CHOSEN_TEXT } from '../../../src/settings/sheet-summary';
import { selectionsWith } from '../../support/panel-selections';

describe('describeSheet', () => {
    test('says so when nothing is chosen', () => {
        expect(describeSheet([], selectionsWith({}))).toEqual({ full: NOTHING_CHOSEN_TEXT, short: NOTHING_CHOSEN_TEXT });
    });

    test('writes a level topic in words and in short', () => {
        const summary = describeSheet(['addition'], selectionsWith({ addition: ['2nd'] }));
        expect(summary).toEqual({ full: 'Addition: double digit.', short: 'Add: 2-dig' });
    });

    test('lists every chosen row in full, and the first few in short', () => {
        const summary = describeSheet(['hiragana'], selectionsWith({ hiragana: ['vowels', 'k'] }));
        expect(summary.full).toBe('Hiragana: あ vowels, か k.');
        expect(summary.short).toBe('Hira: あ か');
    });

    test('counts a long list in short but still names it in full', () => {
        const summary = describeSheet(['hiragana'], selectionsWith({ hiragana: ['vowels', 'k', 's', 't', 'n'] }));
        expect(summary.short).toBe('Hira: 5 rows');
        expect(summary.full).toContain('な n');
    });

    test('says all when every choice is on', () => {
        const everyRegion = ['Africa', 'Asia', 'Central America', 'Europe', 'North America', 'Oceania', 'South America'];
        const summary = describeSheet(['countries'], selectionsWith({ countries: everyRegion }));
        expect(summary).toEqual({ full: 'Countries: all.', short: 'Ctry: all' });
    });

    test('joins the panels of a topic that owns several', () => {
        const summary = describeSheet(['cursiveLetters'], selectionsWith({ cursiveLetters: ['s-m-a-t'], cursiveLayout: ['two-lines'] }));
        expect(summary.full).toBe('Cursive letters: s m a t; two lines.');
        expect(summary.short).toBe('Cur: s m a t 2 lines');
    });

    test('gives a topic without settings just its name', () => {
        expect(describeSheet(['setTime'], selectionsWith({}))).toEqual({ full: 'Setting time.', short: 'Set' });
    });

    test('keeps the chosen topics in the order given, one entry each', () => {
        const summary = describeSheet(['setTime', 'addition'], selectionsWith({ addition: ['1st'] }));
        expect(summary.short).toBe('Set · Add: 1-dig');
    });
});

describe('describeTopicDetail', () => {
    test('gives the choice without the topic name, in either length', () => {
        const selections = selectionsWith({ addition: ['2nd'] });
        expect(describeTopicDetail('addition', selections, false)).toBe('double digit');
        expect(describeTopicDetail('addition', selections, true)).toBe('2-dig');
    });

    test('is empty for a topic without settings', () => {
        expect(describeTopicDetail('setTime', selectionsWith({}), false)).toBe('');
    });
});
