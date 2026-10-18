import { describe, expect, test } from 'vitest';
import {
    createDefaultSelections,
    findConfigurableTopic,
    findPanelSpecification,
    findPanelSpecifications,
    PanelSpecification,
    PANEL_SPECIFICATIONS
} from '../../../../src/settings/topic-settings';
import {
    CONFIGURABLE_TOPICS,
    ConfigurableTopic,
    CURSIVE_GROUPS,
    CURSIVE_LAYOUT_NAMES,
    DEFAULT_CURSIVE_LAYOUT,
    KANA_ROWS,
    PANEL_IDS,
    PanelId,
    POPULATED_REGIONS,
    TopicKey,
    TOPIC_KEYS
} from '../../../../src/types';
import { GRADE_LEVELS, LEVEL_TOPICS, LevelTopics } from '../../../support/panel-selections';

describe('PANEL_SPECIFICATIONS', () => {
    test('gives each panel its own id, covering PANEL_IDS exactly', () => {
        expect(PANEL_SPECIFICATIONS.map((specification) => specification.id).sort()).toEqual([...PANEL_IDS].sort());
    });

    test('gives every configurable topic at least one panel, and every panel a configurable topic', () => {
        const owners = new Set<string>(PANEL_SPECIFICATIONS.map((specification) => specification.topic));
        expect([...owners].sort()).toEqual([...CONFIGURABLE_TOPICS].sort());
    });

    test('lists the panels in topic order, which is the order they appear on screen', () => {
        const positions = PANEL_SPECIFICATIONS.map((specification) => TOPIC_KEYS.indexOf(specification.topic));
        expect(positions).toEqual([...positions].sort((first, second) => first - second));
    });

    describe.each(PANEL_SPECIFICATIONS)('the $id panel', (specification: PanelSpecification) => {
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

    test('offers one chip per cursive set, in Montessori order', () => {
        expect(findPanelSpecification('cursiveLetters').options.map((option) => option.value)).toEqual(CURSIVE_GROUPS);
    });

    test('labels the cursive chips the way a teacher says them', () => {
        expect(findPanelSpecification('cursiveLetters').options.map((option) => option.label)).toEqual([
            's m a t', 'c r i p', 'b f o g', 'h j u l', 'd w e n', 'k q v x y z'
        ]);
    });

    test('offers an All chip for the cursive sets, and counts them as sets', () => {
        const specification = findPanelSpecification('cursiveLetters');
        expect(specification.offersAll).toBe(true);
        expect(specification.summaryNoun).toBe('sets');
    });

    test('gives the cursive topic two panels: the sets, then the practice lines', () => {
        expect(findPanelSpecifications('cursiveLetters').map((panel) => panel.id)).toEqual(['cursiveLetters', 'cursiveLayout']);
    });

    test('offers the cursive layouts the generator knows, with the large line first', () => {
        const panel = findPanelSpecification('cursiveLayout');
        expect(panel.options.map((option) => option.value)).toEqual(CURSIVE_LAYOUT_NAMES);
        expect(panel.options.map((option) => option.label)).toEqual(['One large line', 'Two lines']);
        expect(panel.kind).toBe('single');
    });

    test('starts the cursive layout on the one large line, the shared default', () => {
        expect(DEFAULT_CURSIVE_LAYOUT).toBe('one-large-line');
        expect(findPanelSpecification('cursiveLayout').defaultValues).toEqual([DEFAULT_CURSIVE_LAYOUT]);
    });

    test('starts cursive letters on the first set only', () => {
        expect(findPanelSpecification('cursiveLetters').defaultValues).toEqual(['s-m-a-t']);
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
    test.each(PANEL_IDS)('returns the %s panel', (panel: PanelId) => {
        expect(findPanelSpecification(panel).id).toBe(panel);
    });
});

describe('findPanelSpecifications', () => {
    test.each(CONFIGURABLE_TOPICS)('finds the panels %s owns, and only those', (topic: ConfigurableTopic) => {
        const panels = findPanelSpecifications(topic);
        expect(panels.length).toBeGreaterThan(0);
        expect(panels.filter((panel) => panel.topic !== topic)).toEqual([]);
    });

    test('together the topics own every panel exactly once', () => {
        const ids = CONFIGURABLE_TOPICS.flatMap((topic) => findPanelSpecifications(topic).map((panel) => panel.id));
        expect([...ids].sort()).toEqual([...PANEL_IDS].sort());
    });
});

describe('createDefaultSelections', () => {
    test('has a key for each panel and no others', () => {
        expect(Object.keys(createDefaultSelections()).sort()).toEqual([...PANEL_IDS].sort());
    });

    test.each(PANEL_IDS)('starts the %s panel on its default', (panel: PanelId) => {
        expect(createDefaultSelections()[panel]).toEqual(findPanelSpecification(panel).defaultValues);
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
