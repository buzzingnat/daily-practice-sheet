import { describe, expect, test } from 'vitest';
import {
    createDefaultSelections,
    findConfigurableTopic,
    findPanelSpecification,
    PanelSpecification,
    PANEL_SPECIFICATIONS
} from '../../../src/topic-settings';
import {
    CONFIGURABLE_TOPICS,
    ConfigurableTopic,
    KANA_ROWS,
    POPULATED_REGIONS,
    TopicKey,
    TOPIC_KEYS
} from '../../../src/types';
import { GRADE_LEVELS, LEVEL_TOPICS, LevelTopics } from '../../support/panel-selections';

describe('PANEL_SPECIFICATIONS', () => {
    test('has one panel for each configurable topic', () => {
        expect(PANEL_SPECIFICATIONS.map((specification) => specification.topic).sort()).toEqual([...CONFIGURABLE_TOPICS].sort());
    });

    test('lists the panels in topic order, which is the order they appear on screen', () => {
        const positions = PANEL_SPECIFICATIONS.map((specification) => TOPIC_KEYS.indexOf(specification.topic));
        expect(positions).toEqual([...positions].sort((first, second) => first - second));
    });

    describe.each(PANEL_SPECIFICATIONS)('the $topic panel', (specification: PanelSpecification) => {
        const optionValues = specification.options.map((option) => option.value);

        test('offers each value once', () => {
            expect(new Set(optionValues).size).toBe(optionValues.length);
        });

        test('gives every option a label, each different from the rest', () => {
            const labels = specification.options.map((option) => option.label);
            expect(labels.every((label) => label.trim().length > 0)).toBe(true);
            expect(new Set(labels).size).toBe(labels.length);
        });

        test('has a default, and every default is one of its own options', () => {
            expect(specification.defaultValues.length).toBeGreaterThan(0);
            expect(specification.defaultValues.filter((value) => !optionValues.includes(value))).toEqual([]);
        });

        test('has a heading', () => {
            expect(specification.heading.trim().length).toBeGreaterThan(0);
        });

        if (specification.kind === 'single') {
            test('defaults to exactly one value, because a radio group holds one', () => {
                expect(specification.defaultValues).toHaveLength(1);
            });

            test('offers no All chip and needs no summary noun', () => {
                expect(specification.offersAll).toBe(false);
                expect(specification.summaryNoun).toBe('');
            });
        } else {
            test('has a summary noun, for a button that reads "3 of them"', () => {
                expect(specification.summaryNoun.trim().length).toBeGreaterThan(0);
            });
        }
    });

    test.each(LEVEL_TOPICS)('offers the three grade levels for %s, in order', (topic: LevelTopics) => {
        expect(findPanelSpecification(topic).options.map((option) => option.value)).toEqual(GRADE_LEVELS);
    });

    test('offers one chip per kana row, in chart order', () => {
        expect(findPanelSpecification('hiragana').options.map((option) => option.value)).toEqual(KANA_ROWS);
    });

    test('offers one chip per populated region', () => {
        expect(findPanelSpecification('countries').options.map((option) => option.value)).toEqual(POPULATED_REGIONS);
    });

    test('starts countries with every region chosen', () => {
        expect(findPanelSpecification('countries').defaultValues).toEqual(POPULATED_REGIONS);
    });
});

describe('findConfigurableTopic', () => {
    test.each(TOPIC_KEYS)('answers for %s only if it has a panel', (topic: TopicKey) => {
        const hasPanel = (CONFIGURABLE_TOPICS as readonly string[]).includes(topic);
        expect(findConfigurableTopic(topic)).toBe(hasPanel ? topic : undefined);
    });
});

describe('findPanelSpecification', () => {
    test.each(CONFIGURABLE_TOPICS)('returns the %s panel', (topic: ConfigurableTopic) => {
        expect(findPanelSpecification(topic).topic).toBe(topic);
    });
});

describe('createDefaultSelections', () => {
    test('has a key for each configurable topic and no others', () => {
        expect(Object.keys(createDefaultSelections()).sort()).toEqual([...CONFIGURABLE_TOPICS].sort());
    });

    test.each(CONFIGURABLE_TOPICS)('starts %s on its panel default', (topic: ConfigurableTopic) => {
        expect(createDefaultSelections()[topic]).toEqual(findPanelSpecification(topic).defaultValues);
    });

    test('hands back fresh lists, so a click in one place does not edit the defaults', () => {
        const first = createDefaultSelections();
        first.hiragana.push('k');
        first.countries.length = 0;
        expect(createDefaultSelections().hiragana).toEqual(['vowels']);
        expect(createDefaultSelections().countries).toEqual(POPULATED_REGIONS);
        expect(findPanelSpecification('hiragana').defaultValues).toEqual(['vowels']);
    });
});
