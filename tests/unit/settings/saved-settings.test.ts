import { describe, expect, test } from 'vitest';
import {
    HALF_PAGE_COUNT_KEY,
    panelSelectionKey,
    parseSavedSettings,
    SavedSettings,
    SELECTED_TOPICS_KEY,
    VIEW_MODE_KEY
} from '../../../src/settings/saved-settings';
import { DEFAULT_HALF_PAGES, MAXIMUM_HALF_PAGES } from '../../../src/settings/print-size';
import { createDefaultSelections } from '../../../src/settings/topic-settings';
import { PANEL_IDS, PanelId, TOPIC_KEYS } from '../../../src/types';

const SAVED_TOPIC_LIMIT = 6;

// A Map stands in for local storage, so parsing can be tested without a browser
function parseFrom(entries: Record<string, string>): SavedSettings {
    const store = new Map(Object.entries(entries));
    return parseSavedSettings((key) => store.get(key) ?? null, SAVED_TOPIC_LIMIT);
}

const defaults = createDefaultSelections();

describe('parseSavedSettings with an empty store', () => {
    const empty = parseFrom({});

    test('selects no topics', () => {
        expect(empty.selectedTopics).toEqual([]);
    });

    test('gives the default half-page count', () => {
        expect(empty.halfPageCount).toBe(DEFAULT_HALF_PAGES);
        expect(empty.viewMode).toBe('normal');
    });

    test('gives every panel its default', () => {
        const wrong = PANEL_IDS.filter((panel: PanelId) => JSON.stringify(empty.panelSelections[panel]) !== JSON.stringify(defaults[panel]));
        expect(wrong).toEqual([]);
    });
});

describe('parseSavedSettings with malformed values', () => {
    const garbled = parseFrom({
        [SELECTED_TOPICS_KEY]: '{not json',
        [HALF_PAGE_COUNT_KEY]: '"seven"',
        [panelSelectionKey('hiragana')]: '42',
        [panelSelectionKey('addition')]: 'null'
    });

    test('selects nothing from malformed topics', () => {
        expect(garbled.selectedTopics).toEqual([]);
    });

    test('gives the default for a non-numeric count', () => {
        expect(garbled.halfPageCount).toBe(DEFAULT_HALF_PAGES);
        expect(parseFrom({ [VIEW_MODE_KEY]: '"huge"' }).viewMode).toBe('normal');
    });

    test('gives the panel default for a value that is not a list', () => {
        expect(garbled.panelSelections.hiragana).toEqual(defaults.hiragana);
    });

    test('gives the panel default for null', () => {
        expect(garbled.panelSelections.addition).toEqual(defaults.addition);
    });
});

describe('parseSavedSettings with stray and duplicate values', () => {
    const untidy = parseFrom({
        [SELECTED_TOPICS_KEY]: JSON.stringify(['countries', 'katakana', 'addition', 'addition', 7]),
        [HALF_PAGE_COUNT_KEY]: '99',
        [panelSelectionKey('hiragana')]: JSON.stringify(['k', 'zz', 'vowels', 'k']),
        [panelSelectionKey('fractions')]: JSON.stringify(['3rd', '1st']),
        [panelSelectionKey('countries')]: JSON.stringify(['Atlantis'])
    });

    test('keeps known topics only, once each, in topic order', () => {
        expect(untidy.selectedTopics).toEqual(['addition', 'countries']);
    });

    test('clamps an oversized count to the maximum', () => {
        expect(untidy.halfPageCount).toBe(MAXIMUM_HALF_PAGES);
    });

    test('keeps known kana rows only, once each, in panel order', () => {
        expect(untidy.panelSelections.hiragana).toEqual(['vowels', 'k']);
    });

    test('keeps one value for a single-choice panel', () => {
        expect(untidy.panelSelections.fractions).toHaveLength(1);
    });

    test('gives the panel default when nothing stored is valid', () => {
        expect(untidy.panelSelections.countries).toEqual(defaults.countries);
    });
});

describe('parseSavedSettings with settings saved before the cursive layout existed', () => {
    test('gives the one large line when no layout was stored', () => {
        const older = parseFrom({ [panelSelectionKey('cursiveLetters')]: JSON.stringify(['c-r-i-p']) });
        expect(older.panelSelections.cursiveLetters).toEqual(['c-r-i-p']);
        expect(older.panelSelections.cursiveLayout).toEqual(['one-large-line']);
    });

    test('gives the one large line when the stored layout is not one we know', () => {
        expect(parseFrom({ [panelSelectionKey('cursiveLayout')]: JSON.stringify(['three-lines']) }).panelSelections.cursiveLayout)
            .toEqual(['one-large-line']);
    });

    test('keeps one layout when several are stored, since the panel is single-choice', () => {
        const several = parseFrom({ [panelSelectionKey('cursiveLayout')]: JSON.stringify(['two-lines', 'one-large-line']) });
        expect(several.panelSelections.cursiveLayout).toHaveLength(1);
    });
});

describe('parseSavedSettings limits', () => {
    test('stops saved topics at the limit', () => {
        const crowded = parseFrom({ [SELECTED_TOPICS_KEY]: JSON.stringify(TOPIC_KEYS) });
        expect(crowded.selectedTopics).toHaveLength(SAVED_TOPIC_LIMIT);
    });
});

describe('parseSavedSettings zero alone', () => {
    test('falls back to the default when storage holds zero by itself', () => {
        const saved = parseFrom({ [panelSelectionKey('multiplication')]: JSON.stringify(['0']) });
        expect(saved.panelSelections.multiplication).toEqual(['1', '2', '3', '4', '5']);
    });

    test('keeps zero beside another number', () => {
        const saved = parseFrom({ [panelSelectionKey('multiplication')]: JSON.stringify(['0', '6']) });
        expect(saved.panelSelections.multiplication).toEqual(['0', '6']);
    });
});

describe('parseSavedSettings exclusive chip', () => {
    test('keeps a saved two-digit multiplication selection', () => {
        const saved = parseFrom({ [panelSelectionKey('multiplication')]: JSON.stringify(['two-digit']) });
        expect(saved.panelSelections.multiplication).toEqual(['two-digit']);
    });
});

describe('parseSavedSettings round trip', () => {
    const original = {
        selectedTopics: ['fractions', 'hiragana', 'cursiveLetters', 'countries'],
        hiragana: ['s', 'wn'],
        cursiveLetters: ['s-m-a-t', 'h-j-u-l'],
        cursiveLayout: ['two-lines'],
        subtraction: ['2nd'],
        halfPageCount: 7,
        viewMode: 'compact'
    };
    const roundTrip = parseFrom({
        [SELECTED_TOPICS_KEY]: JSON.stringify(original.selectedTopics),
        [panelSelectionKey('hiragana')]: JSON.stringify(original.hiragana),
        [panelSelectionKey('cursiveLetters')]: JSON.stringify(original.cursiveLetters),
        [panelSelectionKey('cursiveLayout')]: JSON.stringify(original.cursiveLayout),
        [panelSelectionKey('subtraction')]: JSON.stringify(original.subtraction),
        [HALF_PAGE_COUNT_KEY]: JSON.stringify(original.halfPageCount),
        [VIEW_MODE_KEY]: JSON.stringify(original.viewMode)
    });

    test('keeps every valid saved value', () => {
        expect({
            viewMode: roundTrip.viewMode,
            selectedTopics: roundTrip.selectedTopics,
            hiragana: roundTrip.panelSelections.hiragana,
            cursiveLetters: roundTrip.panelSelections.cursiveLetters,
            cursiveLayout: roundTrip.panelSelections.cursiveLayout,
            subtraction: roundTrip.panelSelections.subtraction,
            halfPageCount: roundTrip.halfPageCount
        }).toEqual({
            viewMode: original.viewMode,
            selectedTopics: original.selectedTopics,
            hiragana: original.hiragana,
            cursiveLetters: original.cursiveLetters,
            cursiveLayout: original.cursiveLayout,
            subtraction: original.subtraction,
            halfPageCount: original.halfPageCount
        });
    });
});
