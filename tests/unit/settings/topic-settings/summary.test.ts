import { afterEach, beforeEach, describe, expect, test } from 'vitest';
import { createDefaultSelections, summarizeSelection } from '../../../../src/settings/topic-settings';
import { setLanguage, setMessages } from '../../../../src/text/messages';
import { CONFIGURABLE_TOPICS, CURSIVE_GROUPS, KANA_ROWS, POPULATED_REGIONS } from '../../../../src/types';
import { createMarkerCatalog } from '../../../support/marker-catalog';
import { LEVEL_TOPICS, GRADE_LEVELS, selectionsWith } from '../../../support/panel-selections';

// The marker catalog stands in for a language, so these tests check which rule picks the summary
// (all, a name, a count, nothing) and not which English words come out.
const BUTTON = 'summary:buttonPanels:';

function summarize(...args: Parameters<typeof summarizeSelection>): string {
    return summarizeSelection(...args).replace(BUTTON, '');
}

beforeEach(() => {
    setMessages(createMarkerCatalog());
});

afterEach(() => {
    setLanguage('en');
});

describe('summarizeSelection', () => {
    test('names the chosen level for every level topic', () => {
        const offenders: string[] = [];
        LEVEL_TOPICS.forEach((topic) => {
            GRADE_LEVELS.forEach((level) => {
                if (summarize(topic, selectionsWith({ [topic]: [level] })) !== `option:${topic}:${level}`) {
                    offenders.push(`${topic} at ${level}`);
                }
            });
        });
        expect(offenders).toEqual([]);
    });

    test('says nothing for a level panel that holds nothing valid', () => {
        expect(summarize('addition', selectionsWith({ addition: [] }))).toBe('');
        expect(summarize('addition', selectionsWith({ addition: ['4th'] }))).toBe('');
    });

    test('says all when every choice is on, ignoring strays', () => {
        expect(summarize('hiragana', selectionsWith({ hiragana: [...KANA_ROWS] }))).toBe('summary:all');
        expect(summarize('countries', selectionsWith({ countries: [...POPULATED_REGIONS, 'Scythia'] }))).toBe('summary:all');
    });

    test('names the choice when only one is chosen', () => {
        expect(summarize('hiragana', selectionsWith({ hiragana: ['wn'] }))).toBe('option:hiragana:wn');
        expect(summarize('countries', selectionsWith({ countries: ['Europe'] }))).toBe('option:countries:Europe');
    });

    test('counts the choices when several are chosen', () => {
        expect(summarize('hiragana', selectionsWith({ hiragana: ['k', 's'] }))).toBe('summary:count:2:noun:hiragana');
        expect(summarize('countries', selectionsWith({ countries: ['Africa', 'Asia', 'Oceania'] }))).toBe('summary:count:3:noun:countries');
    });

    test('counts only values the panel offers', () => {
        expect(summarize('hiragana', selectionsWith({ hiragana: ['k', 'zz'] }))).toBe('option:hiragana:k');
    });

    test('joins the cursive sets and the layout, naming the layout whichever it is', () => {
        expect(summarize('cursiveLetters', selectionsWith({ cursiveLetters: ['c-r-i-p'] }))).toBe('c r i p+option:cursivelayout:one-large-line');
        expect(summarize('cursiveLetters', selectionsWith({ cursiveLetters: [...CURSIVE_GROUPS] }))).toBe('summary:all+option:cursivelayout:one-large-line');
        expect(summarize('cursiveLetters', selectionsWith({ cursiveLetters: ['s-m-a-t', 'b-f-o-g'], cursiveLayout: ['two-lines'] })))
            .toBe('summary:count:2:noun:cursiveLetters+option:cursivelayout:two-lines');
    });

    test('summarizes multiplication by count, by the number itself, or as two digit', () => {
        expect(summarize('multiplication', selectionsWith({ multiplication: ['1', '2', '3', '4', '5'] }))).toBe('summary:count:5:noun:multiplication');
        expect(summarize('multiplication', selectionsWith({ multiplication: ['7'] }))).toBe('7');
        expect(summarize('multiplication', selectionsWith({ multiplication: ['two-digit'] }))).toBe('option:multiplication:two-digit');
    });

    test('summarizes the defaults of every configurable topic', () => {
        const defaults = createDefaultSelections();
        const empty = CONFIGURABLE_TOPICS.filter((topic) => summarize(topic, defaults).length === 0);
        expect(empty).toEqual([]);
    });
});
