import { describe, expect, test } from 'vitest';
import { createDefaultSelections, resolveTopicSettings } from '../../../../src/settings/topic-settings';
import { CONFIGURABLE_TOPICS, ConfigurableTopic, GradeLevel } from '../../../../src/types';
import { GRADE_LEVELS, LEVEL_TOPICS, LevelTopics, selectionsWith } from '../../../support/panel-selections';

describe('resolveTopicSettings', () => {
    test('turns the defaults into typed settings', () => {
        expect(resolveTopicSettings(createDefaultSelections())).toEqual({
            fractions: { level: '1st' },
            addition: { level: '1st' },
            subtraction: { level: '1st' },
            multiplication: { mode: 'tables', factors: [1, 2, 3, 4, 5] },
            division: { level: '1st' },
            hiragana: { rows: ['vowels'] },
            cursiveLetters: { groups: ['s-m-a-t'], layout: 'one-large-line' },
            countries: { regions: ['Africa'] }
        });
    });

    test('resolves every level of every level topic, and takes the lowest when several are somehow chosen', () => {
        const offenders: string[] = [];
        LEVEL_TOPICS.forEach((topic: LevelTopics) => {
            GRADE_LEVELS.forEach((level: GradeLevel) => {
                if (resolveTopicSettings(selectionsWith({ [topic]: [level] }))[topic].level !== level) {
                    offenders.push(`${topic} at ${level}`);
                }
            });
            if (resolveTopicSettings(selectionsWith({ [topic]: ['3rd', '2nd'] }))[topic].level !== '2nd') {
                offenders.push(`${topic} with several levels`);
            }
        });
        expect(offenders).toEqual([]);
    });

    test('keeps the chosen kana rows in chart order, whatever order they were chosen in', () => {
        expect(resolveTopicSettings(selectionsWith({ hiragana: ['r', 'vowels', 's'] })).hiragana.rows).toEqual(['vowels', 's', 'r']);
    });

    test('keeps the chosen regions in list order', () => {
        expect(resolveTopicSettings(selectionsWith({ countries: ['Europe', 'Africa'] })).countries.regions).toEqual(['Africa', 'Europe']);
    });

    test('keeps the chosen cursive sets in Montessori order, whatever order they were chosen in', () => {
        expect(resolveTopicSettings(selectionsWith({ cursiveLetters: ['d-w-e-n', 's-m-a-t', 'b-f-o-g'] })).cursiveLetters.groups)
            .toEqual(['s-m-a-t', 'b-f-o-g', 'd-w-e-n']);
    });

    test('resolves each cursive layout', () => {
        const layouts = ['one-large-line', 'two-lines'] as const;
        expect(layouts.map((layout) => resolveTopicSettings(selectionsWith({ cursiveLayout: [layout] })).cursiveLetters.layout)).toEqual([...layouts]);
    });

    test('throws when the cursive layout holds nothing valid', () => {
        expect(() => resolveTopicSettings(selectionsWith({ cursiveLayout: [] }))).toThrow(/cursiveLayout/);
        expect(() => resolveTopicSettings(selectionsWith({ cursiveLayout: ['three-lines'] }))).toThrow(/no valid/);
    });

    test('resolves the cursive sets and the layout independently', () => {
        const resolved = resolveTopicSettings(selectionsWith({ cursiveLetters: ['b-f-o-g'], cursiveLayout: ['two-lines'] }));
        expect(resolved.cursiveLetters).toEqual({ groups: ['b-f-o-g'], layout: 'two-lines' });
    });

    test('drops cursive sets no list contains', () => {
        expect(resolveTopicSettings(selectionsWith({ cursiveLetters: ['x-y-z', 'c-r-i-p'] })).cursiveLetters.groups)
            .toEqual(['c-r-i-p']);
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

    test('throws for every panel when nothing valid is chosen, empty or only strays', () => {
        const offenders: string[] = [];
        CONFIGURABLE_TOPICS.forEach((topic: ConfigurableTopic) => {
            try {
                resolveTopicSettings(selectionsWith({ [topic]: [] }));
                offenders.push(`${topic} with an empty selection did not throw`);
            } catch (error) {
                if (!(error instanceof Error) || !error.message.includes(topic)) {
                    offenders.push(`${topic} with an empty selection threw the wrong error`);
                }
            }
            try {
                resolveTopicSettings(selectionsWith({ [topic]: ['bb', 'Scythia'] }));
                offenders.push(`${topic} with only strays did not throw`);
            } catch (error) {
                if (!(error instanceof Error) || !/no valid/.test(error.message)) {
                    offenders.push(`${topic} with only strays threw the wrong error`);
                }
            }
        });
        expect(offenders).toEqual([]);
    });

    describe('multiplication', () => {
        test('resolves the chosen numbers in order, zero included', () => {
            expect(resolveTopicSettings(selectionsWith({ multiplication: ['9', '2', '12'] })).multiplication)
                .toEqual({ mode: 'tables', factors: [2, 9, 12] });
            expect(resolveTopicSettings(selectionsWith({ multiplication: ['0', '3'] })).multiplication)
                .toEqual({ mode: 'tables', factors: [0, 3] });
        });

        test('resolves the two-digit mode, which wins over numbers saved beside it', () => {
            expect(resolveTopicSettings(selectionsWith({ multiplication: ['two-digit'] })).multiplication).toEqual({ mode: 'two-digit' });
            expect(resolveTopicSettings(selectionsWith({ multiplication: ['3', 'two-digit'] })).multiplication).toEqual({ mode: 'two-digit' });
        });

        test('throws when nothing valid is chosen', () => {
            expect(() => resolveTopicSettings(selectionsWith({ multiplication: ['13'] }))).toThrow(/no valid/);
        });
    });
});
