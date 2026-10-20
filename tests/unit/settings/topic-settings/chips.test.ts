import { describe, expect, test } from 'vitest';
import { findPanelSpecification, isChipBlocked, isPresetSelected, resolveTopicSettings, summarizeSelection, toggleOption } from '../../../../src/settings/topic-settings';
import { selectionsWith } from '../../../support/panel-selections';

const multiplication = findPanelSpecification('multiplication');
const [upToFive, upToTwelve] = multiplication.presets ?? [];

describe('toggleOption', () => {
    test('adds a number that is not chosen', () => {
        expect(toggleOption(multiplication, ['1', '2'], '7').selection).toEqual(['1', '2', '7']);
    });

    test('removes a number that is chosen', () => {
        expect(toggleOption(multiplication, ['1', '2'], '2').selection).toEqual(['1']);
    });

    test('refuses to remove the last number', () => {
        expect(toggleOption(multiplication, ['4'], '4').selection).toEqual(['4']);
    });

    test('replaces everything when the two-digit chip is chosen', () => {
        expect(toggleOption(multiplication, ['1', '2', '3'], 'two-digit').selection).toEqual(['two-digit']);
    });

    test('keeps two-digit chosen when it is clicked again, since it is the last chip', () => {
        expect(toggleOption(multiplication, ['two-digit'], 'two-digit').selection).toEqual(['two-digit']);
    });

    test('drops two-digit when a number is chosen', () => {
        expect(toggleOption(multiplication, ['two-digit'], '6').selection).toEqual(['6']);
    });

    test('leaves panels without an exclusive value to the plain rule', () => {
        const hiragana = findPanelSpecification('hiragana');
        expect(toggleOption(hiragana, ['vowels'], 'k').selection).toEqual(['vowels', 'k']);
        expect(toggleOption(hiragana, ['vowels', 'k'], 'k').selection).toEqual(['vowels']);
    });
});

describe('toggleOption with zero', () => {
    test('refuses zero when it would stand alone, and says why', () => {
        const result = toggleOption(multiplication, ['two-digit'], '0');
        expect(result.selection).toEqual(['two-digit']);
        expect(result.refusal).toMatch(/Zero cannot be the only number/);
    });

    test('refuses to remove the last other number from beside zero', () => {
        const result = toggleOption(multiplication, ['0', '3'], '3');
        expect(result.selection).toEqual(['0', '3']);
        expect(result.refusal).toBeDefined();
    });

    test('lets zero join another number, and leave while another number stays', () => {
        expect(toggleOption(multiplication, ['3'], '0')).toEqual({ selection: ['3', '0'] });
        expect(toggleOption(multiplication, ['0', '3', '4'], '4')).toEqual({ selection: ['0', '3'] });
        expect(toggleOption(multiplication, ['0', '3'], '0')).toEqual({ selection: ['3'] });
    });

    test('gives no refusal for ordinary clicks, so no message appears', () => {
        expect(toggleOption(multiplication, ['3'], '3').refusal).toBeUndefined();
        expect(toggleOption(multiplication, ['3'], '4').refusal).toBeUndefined();
        expect(toggleOption(multiplication, ['0', '3'], 'two-digit').refusal).toBeUndefined();
    });

    test('does not apply the rule to panels without one', () => {
        expect(toggleOption(findPanelSpecification('hiragana'), ['vowels'], 'vowels').refusal).toBeUndefined();
    });
});

describe('isChipBlocked', () => {
    test('blocks zero only while no other number is chosen', () => {
        expect(isChipBlocked(multiplication, ['two-digit'], '0')).toBe(true);
        expect(isChipBlocked(multiplication, ['1', '2'], '0')).toBe(false);
        expect(isChipBlocked(multiplication, ['0', '1'], '0')).toBe(false);
    });

    test('never blocks any other chip', () => {
        expect(isChipBlocked(multiplication, ['0', '3'], '3')).toBe(false);
        expect(isChipBlocked(multiplication, ['two-digit'], '5')).toBe(false);
    });
});

describe('isPresetSelected', () => {
    test('is true only when the selection is exactly the preset, in any order', () => {
        if (!upToFive || !upToTwelve) {
            throw new Error('The multiplication panel should offer two presets.');
        }
        expect(isPresetSelected(upToFive, ['5', '4', '3', '2', '1', '0'])).toBe(true);
        expect(isPresetSelected(upToFive, ['1', '2', '3', '4', '5'])).toBe(false);
        expect(isPresetSelected(upToFive, ['0', '1', '2', '3', '4', '5', '6'])).toBe(false);
        expect(isPresetSelected(upToTwelve, upToTwelve.values)).toBe(true);
        expect(isPresetSelected(upToTwelve, upToFive.values)).toBe(false);
    });
});

describe('multiplication settings', () => {
    test('resolve the chosen numbers in order', () => {
        expect(resolveTopicSettings(selectionsWith({ multiplication: ['9', '2', '12'] })).multiplication)
            .toEqual({ mode: 'tables', factors: [2, 9, 12] });
    });

    test('resolve 0 when it is chosen', () => {
        expect(resolveTopicSettings(selectionsWith({ multiplication: ['0', '3'] })).multiplication)
            .toEqual({ mode: 'tables', factors: [0, 3] });
    });

    test('resolve the two-digit mode', () => {
        expect(resolveTopicSettings(selectionsWith({ multiplication: ['two-digit'] })).multiplication).toEqual({ mode: 'two-digit' });
    });

    test('let two-digit win over numbers saved beside it', () => {
        expect(resolveTopicSettings(selectionsWith({ multiplication: ['3', 'two-digit'] })).multiplication).toEqual({ mode: 'two-digit' });
    });

    test('throw when nothing valid is chosen', () => {
        expect(() => resolveTopicSettings(selectionsWith({ multiplication: [] }))).toThrow(/multiplication/);
        expect(() => resolveTopicSettings(selectionsWith({ multiplication: ['13'] }))).toThrow(/no valid/);
    });

    test('are summarized by count, by the number itself, or as two digit', () => {
        expect(summarizeSelection('multiplication', selectionsWith({ multiplication: ['1', '2', '3', '4', '5'] }))).toBe('5 numbers');
        expect(summarizeSelection('multiplication', selectionsWith({ multiplication: ['7'] }))).toBe('7');
        expect(summarizeSelection('multiplication', selectionsWith({ multiplication: ['two-digit'] }))).toBe('Two digit');
    });
});
