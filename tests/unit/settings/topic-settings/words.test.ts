import { afterEach, describe, expect, test } from 'vitest';
import { findPanelSpecification, listChoices, PANEL_SPECIFICATIONS } from '../../../../src/settings/topic-settings';
import { setLanguage, setMessages } from '../../../../src/text/messages';
import { createMarkerCatalog } from '../../../support/marker-catalog';

// Chips that name no words: the multiplication numbers and the cursive sets, which are letters and digits
const NEUTRAL_PANELS = ['multiplication', 'cursiveLetters'];

afterEach(() => {
    setLanguage('en');
});

describe('the settings panels\' words', () => {
    test('are read from the catalog each time, so none is a copy of English', () => {
        setMessages(createMarkerCatalog());
        const offenders: string[] = [];
        for (const specification of PANEL_SPECIFICATIONS) {
            if (specification.heading !== `heading:${specification.id}`) {
                offenders.push(`${specification.id} heading`);
            }
            if (specification.summaryNoun !== `noun:${specification.id}`) {
                offenders.push(`${specification.id} summaryNoun`);
            }
            for (const option of listChoices(specification)) {
                const isNeutral = NEUTRAL_PANELS.includes(specification.id) && !option.label.startsWith('option:');
                if (!isNeutral && (!option.label.startsWith('option:') || !option.shortLabel?.startsWith('short:'))) {
                    offenders.push(`${specification.id} option ${option.value}`);
                }
            }
            for (const preset of specification.presets ?? []) {
                if (!preset.label.startsWith('preset:')) {
                    offenders.push(`${specification.id} preset`);
                }
            }
        }
        expect(offenders).toEqual([]);
    });

    test('include the refusal message for a lone zero', () => {
        setMessages(createMarkerCatalog());
        expect(findPanelSpecification('multiplication').needsCompanion?.message).toBe('ui:zeroNeedsCompanion');
    });

    test('keep the English wording the cards have always shown', () => {
        expect(findPanelSpecification('addition').options.map((option) => option.label))
            .toEqual(['Single digit', 'Double digit', 'Triple digit']);
        expect(findPanelSpecification('fractions').options.map((option) => option.shortLabel))
            .toEqual(['To 4ths', 'To 8ths', 'To 12ths']);
        expect(findPanelSpecification('hiragana').options[9]?.label).toBe('わ w + n');
        expect(findPanelSpecification('countries').options[2]?.shortLabel).toBe('C.Am');
        expect(findPanelSpecification('multiplication').presets?.map((preset) => preset.label)).toEqual(['Up to 5', 'Up to 12']);
        expect(findPanelSpecification('multiplication').exclusiveOption?.label).toBe('Two digit');
    });

    test('never change an option\'s value, which is what is saved', () => {
        setMessages(createMarkerCatalog());
        const marked = findPanelSpecification('countries').options.map((option) => option.value);
        setLanguage('en');
        expect(findPanelSpecification('countries').options.map((option) => option.value)).toEqual(marked);
    });
});
