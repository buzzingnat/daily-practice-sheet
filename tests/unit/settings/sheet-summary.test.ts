import { afterEach, beforeEach, describe, expect, test } from 'vitest';
import { describeSheet, describeTopicDetail } from '../../../src/settings/sheet-summary';
import { summarizeSelection } from '../../../src/settings/topic-settings';
import { setLanguage, setMessages } from '../../../src/text/messages';
import { createMarkerCatalog } from '../../support/marker-catalog';
import { selectionsWith } from '../../support/panel-selections';

// The marker catalog stands in for a language, so these tests check how the summary is built
// and not which English words it happens to use.
beforeEach(() => {
    setMessages(createMarkerCatalog());
});

afterEach(() => {
    setLanguage('en');
});

describe('describeSheet', () => {
    test('says so when nothing is chosen', () => {
        expect(describeSheet([], selectionsWith({}))).toEqual({ full: 'summary:nothingChosen', short: 'summary:nothingChosen' });
    });

    test('writes a level topic in words and in short', () => {
        const summary = describeSheet(['addition'], selectionsWith({ addition: ['2nd'] }));
        expect(summary.full).toContain('option:addition:2nd');
        expect(summary.short).toContain('short:addition:2nd');
    });

    test('lists every chosen row in full, and the first few in short', () => {
        const summary = describeSheet(['hiragana'], selectionsWith({ hiragana: ['vowels', 'k'] }));
        expect(summary.full).toContain('option:hiragana:vowels+option:hiragana:k');
        expect(summary.short).toContain('short:hiragana:vowels+short:hiragana:k');
    });

    test('counts a long list in short but still names it in full', () => {
        const summary = describeSheet(['hiragana'], selectionsWith({ hiragana: ['vowels', 'k', 's', 't', 'n'] }));
        expect(summary.short).toContain('summary:count:5:noun:hiragana');
        expect(summary.full).toContain('option:hiragana:n');
    });

    test('says all when every choice is on', () => {
        const everyRegion = ['Africa', 'Asia', 'Central America', 'Europe', 'North America', 'Oceania', 'South America'];
        const summary = describeSheet(['countries'], selectionsWith({ countries: everyRegion }));
        expect(summary.full).toContain('summary:all');
        expect(summary.short).toContain('summary:all');
    });

    test('joins the panels of a topic that owns several', () => {
        const summary = describeSheet(['cursiveLetters'], selectionsWith({ cursiveLetters: ['s-m-a-t'], cursiveLayout: ['two-lines'] }));
        expect(summary.full).toContain('s m a t');
        expect(summary.full).toContain('option:cursivelayout:two-lines');
    });

    test('gives a topic without settings just its name, and keeps the chosen topics in the order given', () => {
        const summary = describeSheet(['setTime', 'addition'], selectionsWith({ addition: ['1st'] }));
        expect(summary.short.indexOf('short:setTime')).toBeGreaterThanOrEqual(0);
        expect(summary.short.indexOf('short:setTime')).toBeLessThan(summary.short.indexOf('short:addition'));
        expect(describeSheet(['setTime'], selectionsWith({})).full).not.toContain('summary:panels');
    });
});

describe('describeTopicDetail', () => {
    test('gives the choice without the topic name, in either length', () => {
        const selections = selectionsWith({ addition: ['2nd'] });
        expect(describeTopicDetail('addition', selections, false)).toBe('summary:panels:false:option:addition:2nd');
        expect(describeTopicDetail('addition', selections, true)).toBe('summary:panels:true:short:addition:2nd');
    });

    test('is empty for a topic without settings', () => {
        expect(describeTopicDetail('setTime', selectionsWith({}), false)).toBe('');
    });
});

describe('the summary\'s own words', () => {
    test('come from the catalog, in every part of a sentence', () => {
        const selections = selectionsWith({ addition: ['2nd'], countries: ['Africa', 'Asia', 'Europe', 'Oceania'], hiragana: ['k', 's'] });
        const summary = describeSheet(['addition', 'hiragana', 'countries'], selections);
        expect(summary.short).toContain('summary:count:4:noun:countries');
        expect(summary.short).toContain('summary:topic:');
        expect(summary.full.startsWith('summary:topics:')).toBe(true);
        expect(summarizeSelection('countries', selections)).toBe('summary:buttonPanels:summary:count:4:noun:countries');
    });
});
