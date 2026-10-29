import { describe, expect, test } from 'vitest';
import {
    createDefaultSelections,
    findConfigurableTopic,
    findPanelSpecification,
    findPanelSpecifications,
    PANEL_SPECIFICATIONS
} from '../../../../src/settings/topic-settings';
import {
    CONFIGURABLE_TOPICS,
    CURSIVE_GROUPS,
    CURSIVE_LAYOUT_NAMES,
    KANA_ROWS,
    PANEL_IDS,
    POPULATED_REGIONS,
    TOPIC_KEYS
} from '../../../../src/types';
import { GRADE_LEVELS, LEVEL_TOPICS } from '../../../support/panel-selections';

/**
 * Every panel is checked and each rule collects the panels that break it, so one failure names them all.
 */
describe('PANEL_SPECIFICATIONS', () => {
    test('gives each panel its own id, covering PANEL_IDS exactly', () => {
        expect(PANEL_SPECIFICATIONS.map((specification) => specification.id).sort()).toEqual([...PANEL_IDS].sort());
    });

    test('gives every configurable topic at least one panel, and every panel a configurable topic', () => {
        const owners = new Set<string>(PANEL_SPECIFICATIONS.map((specification) => specification.topic));
        expect([...owners].sort()).toEqual([...CONFIGURABLE_TOPICS].sort());
    });

    test('makes every panel well formed: unique values and labels, defaults among the options, words present', () => {
        const offenders: string[] = [];
        PANEL_SPECIFICATIONS.forEach((specification) => {
            const values = specification.options.map((option) => option.value);
            const labels = specification.options.map((option) => option.label);
            if (new Set(values).size !== values.length) {
                offenders.push(`${specification.id}: a value is offered twice`);
            }
            if (labels.some((label) => label.trim().length === 0) || new Set(labels).size !== labels.length) {
                offenders.push(`${specification.id}: a label is blank or repeated`);
            }
            if (specification.defaultValues.length === 0 || specification.defaultValues.some((value) => !values.includes(value))) {
                offenders.push(`${specification.id}: a default is missing or is not one of the options`);
            }
            if (specification.heading.trim().length === 0) {
                offenders.push(`${specification.id}: no heading`);
            }
        });
        expect(offenders).toEqual([]);
    });

    test('holds a single-choice panel to one default and no All chip, and gives a multiple-choice panel a summary noun', () => {
        const offenders: string[] = [];
        PANEL_SPECIFICATIONS.forEach((specification) => {
            if (specification.kind === 'single') {
                if (specification.defaultValues.length !== 1 || specification.offersAll || specification.summaryNoun !== '') {
                    offenders.push(`${specification.id}: a single-choice panel needs one default, no All chip and no noun`);
                }
            } else if (specification.summaryNoun.trim().length === 0) {
                offenders.push(`${specification.id}: a multiple-choice panel needs a summary noun`);
            }
        });
        expect(offenders).toEqual([]);
    });

    test('keeps every preset value among the options, and the exclusive value out of them', () => {
        const offenders: string[] = [];
        PANEL_SPECIFICATIONS.forEach((specification) => {
            const optionValues = specification.options.map((option) => option.value);
            const presetValues = (specification.presets ?? []).flatMap((preset) => preset.values);
            if (presetValues.some((value) => !optionValues.includes(value))) {
                offenders.push(`${specification.id}: a preset holds a value that is not an option`);
            }
            if (specification.exclusiveOption && optionValues.includes(specification.exclusiveOption.value)) {
                offenders.push(`${specification.id}: the exclusive value is also an ordinary option`);
            }
        });
        expect(offenders).toEqual([]);
    });

    test('offers one chip for each thing the generator knows: levels, kana rows, cursive sets and layouts, regions', () => {
        const offered = (panel: Parameters<typeof findPanelSpecification>[0]): string[] =>
            findPanelSpecification(panel).options.map((option) => option.value);
        const offenders: string[] = [];
        LEVEL_TOPICS.forEach((topic) => {
            if (JSON.stringify(offered(topic)) !== JSON.stringify(GRADE_LEVELS)) {
                offenders.push(`${topic}: not the three grade levels`);
            }
        });
        if (JSON.stringify(offered('hiragana')) !== JSON.stringify(KANA_ROWS)) {
            offenders.push('hiragana: not one chip per kana row');
        }
        if (JSON.stringify(offered('cursiveLetters')) !== JSON.stringify(CURSIVE_GROUPS)) {
            offenders.push('cursiveLetters: not one chip per cursive set');
        }
        if (JSON.stringify(offered('cursiveLayout')) !== JSON.stringify(CURSIVE_LAYOUT_NAMES)) {
            offenders.push('cursiveLayout: not one chip per cursive layout');
        }
        if (JSON.stringify(offered('countries')) !== JSON.stringify(POPULATED_REGIONS)) {
            offenders.push('countries: not one chip per populated region');
        }
        expect(offenders).toEqual([]);
    });
});

describe('finding panels', () => {
    test('answers for a topic only if it has a panel, and finds each panel and each topic\'s panels', () => {
        const offenders: string[] = [];
        TOPIC_KEYS.forEach((topic) => {
            const hasPanel = (CONFIGURABLE_TOPICS as readonly string[]).includes(topic);
            if (findConfigurableTopic(topic) !== (hasPanel ? topic : undefined)) {
                offenders.push(`findConfigurableTopic(${topic})`);
            }
        });
        PANEL_IDS.forEach((panel) => {
            if (findPanelSpecification(panel).id !== panel) {
                offenders.push(`findPanelSpecification(${panel})`);
            }
        });
        CONFIGURABLE_TOPICS.forEach((topic) => {
            const panels = findPanelSpecifications(topic);
            if (panels.length === 0 || panels.some((panel) => panel.topic !== topic)) {
                offenders.push(`findPanelSpecifications(${topic})`);
            }
        });
        expect(offenders).toEqual([]);
    });

    test('together the topics own every panel exactly once', () => {
        const ids = CONFIGURABLE_TOPICS.flatMap((topic) => findPanelSpecifications(topic).map((panel) => panel.id));
        expect([...ids].sort()).toEqual([...PANEL_IDS].sort());
    });
});

describe('createDefaultSelections', () => {
    test('has a key for each panel, set to that panel\'s default', () => {
        const selections = createDefaultSelections();
        expect(Object.keys(selections).sort()).toEqual([...PANEL_IDS].sort());
        const wrong = PANEL_IDS.filter((panel) => JSON.stringify(selections[panel]) !== JSON.stringify(findPanelSpecification(panel).defaultValues));
        expect(wrong).toEqual([]);
    });

    test('hands back fresh lists, so a click in one place does not edit the defaults', () => {
        const first = createDefaultSelections();
        const hiraganaBefore = [...first.hiragana];
        const countriesBefore = [...first.countries];
        first.hiragana.push('k');
        first.countries.length = 0;
        expect(createDefaultSelections().hiragana).toEqual(hiraganaBefore);
        expect(createDefaultSelections().countries).toEqual(countriesBefore);
        expect(findPanelSpecification('hiragana').defaultValues).toEqual(hiraganaBefore);
    });
});
