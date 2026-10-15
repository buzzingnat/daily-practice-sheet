import { describe, expect, test } from 'vitest';
import { createDefaultSelections, resolveTopicSettings } from '../../../src/topic-settings';
import { CONFIGURABLE_TOPICS, ConfigurableTopic, GradeLevel, POPULATED_REGIONS } from '../../../src/types';
import { GRADE_LEVELS, LEVEL_TOPICS, LevelTopics, selectionsWith } from '../../support/panel-selections';

describe('resolveTopicSettings', () => {
    test('turns the defaults into typed settings', () => {
        expect(resolveTopicSettings(createDefaultSelections())).toEqual({
            fractions: { level: '1st' },
            addition: { level: '1st' },
            subtraction: { level: '1st' },
            hiragana: { rows: ['vowels'] },
            countries: { regions: POPULATED_REGIONS }
        });
    });

    describe.each(LEVEL_TOPICS)('the %s level', (topic: LevelTopics) => {
        test.each(GRADE_LEVELS)('resolves %s', (level: GradeLevel) => {
            expect(resolveTopicSettings(selectionsWith({ [topic]: [level] }))[topic]).toEqual({ level });
        });

        test('takes the lowest level when several are somehow chosen', () => {
            expect(resolveTopicSettings(selectionsWith({ [topic]: ['3rd', '2nd'] }))[topic]).toEqual({ level: '2nd' });
        });
    });

    test('keeps the chosen kana rows in chart order, whatever order they were chosen in', () => {
        expect(resolveTopicSettings(selectionsWith({ hiragana: ['r', 'vowels', 's'] })).hiragana.rows).toEqual(['vowels', 's', 'r']);
    });

    test('keeps the chosen regions in list order', () => {
        expect(resolveTopicSettings(selectionsWith({ countries: ['Europe', 'Africa'] })).countries.regions).toEqual(['Africa', 'Europe']);
    });

    test('lists a row once even when it is chosen twice', () => {
        expect(resolveTopicSettings(selectionsWith({ hiragana: ['k', 'k'] })).hiragana.rows).toEqual(['k']);
    });

    test('ignores values no list contains', () => {
        const resolved = resolveTopicSettings(selectionsWith({
            hiragana: ['k', 'zz', 'vowels'],
            countries: ['Atlantis', 'Oceania'],
            addition: ['4th', '2nd']
        }));
        expect(resolved.hiragana.rows).toEqual(['vowels', 'k']);
        expect(resolved.countries.regions).toEqual(['Oceania']);
        expect(resolved.addition).toEqual({ level: '2nd' });
    });

    test('leaves the selections it was given untouched', () => {
        const selections = selectionsWith({ hiragana: ['s', 'zz', 'k'] });
        resolveTopicSettings(selections);
        expect(selections.hiragana).toEqual(['s', 'zz', 'k']);
    });

    describe.each(CONFIGURABLE_TOPICS)('the %s panel with nothing valid chosen', (topic: ConfigurableTopic) => {
        test('throws on an empty selection', () => {
            expect(() => resolveTopicSettings(selectionsWith({ [topic]: [] }))).toThrow(topic);
        });

        test('throws when only strays remain', () => {
            expect(() => resolveTopicSettings(selectionsWith({ [topic]: ['bb', 'Scythia'] }))).toThrow(/no valid/);
        });
    });
});
