// @vitest-environment jsdom
import { afterEach, describe, expect, test, vi } from 'vitest';
import { createTopicCard } from '../../../src/ui/topic-card';
import { createDefaultSelections } from '../../../src/settings/topic-settings';
import { setLanguage, setMessages } from '../../../src/text/messages';
import { TOPIC_KEYS } from '../../../src/types';
import { createMarkerCatalog } from '../../support/marker-catalog';
import { collectWords, findUnmarkedWords } from '../../support/visible-words';

function makeCard(topic: 'addition' | 'setTime' | 'cursiveLetters') {
    const onToggle = vi.fn();
    const onSettingsChange = vi.fn();
    const card = createTopicCard(topic, createDefaultSelections(), { onToggle, onSettingsChange });
    document.body.replaceChildren(card.element);
    return { card, onToggle, onSettingsChange };
}

describe('createTopicCard', () => {
    test('starts unselected with no settings showing', () => {
        const { card } = makeCard('addition');
        expect(card.element.classList.contains('selected')).toBe(false);
        expect(card.element.querySelector('fieldset')).toBeNull();
        expect(card.element.querySelector<HTMLElement>('.topic-settings')?.hidden).toBe(true);
    });

    test('names the topic and reports a toggle click without changing itself', () => {
        const { card, onToggle } = makeCard('addition');
        const toggle = card.element.querySelector<HTMLButtonElement>('.topic-toggle');
        expect(card.element.querySelector('.topic-name')?.textContent).toBe('Addition');
        toggle?.click();
        expect(onToggle).toHaveBeenCalledTimes(1);
        expect(toggle?.getAttribute('aria-pressed')).toBe('false');
    });

    test('shows the topic settings only while selected', () => {
        const { card } = makeCard('addition');
        card.setSelected(true);
        expect(card.element.querySelectorAll('fieldset')).toHaveLength(1);
        expect(card.element.querySelector('.topic-toggle')?.getAttribute('aria-pressed')).toBe('true');
        card.setSelected(false);
        expect(card.element.querySelector('fieldset')).toBeNull();
    });

    test('shows every panel a topic owns', () => {
        const { card } = makeCard('cursiveLetters');
        card.setSelected(true);
        expect(card.element.querySelectorAll('fieldset')).toHaveLength(2);
    });

    test('leaves no empty settings box for a topic without settings', () => {
        const { card } = makeCard('setTime');
        card.setSelected(true);
        expect(card.element.querySelector<HTMLElement>('.topic-settings')?.hidden).toBe(true);
    });

    test('does not rebuild the settings when selected twice', () => {
        const { card } = makeCard('addition');
        card.setSelected(true);
        const firstFieldset = card.element.querySelector('fieldset');
        card.setSelected(true);
        expect(card.element.querySelector('fieldset')).toBe(firstFieldset);
    });

    test('tells the owner when a setting changes', () => {
        const { card, onSettingsChange } = makeCard('addition');
        card.setSelected(true);
        const radios = card.element.querySelectorAll<HTMLInputElement>('input[type="radio"]');
        radios[1]?.click();
        expect(onSettingsChange).toHaveBeenCalled();
    });

    test('locks an unselected card with a hint, but never a selected one', () => {
        const { card } = makeCard('addition');
        const toggle = card.element.querySelector<HTMLButtonElement>('.topic-toggle');
        const hint = card.element.querySelector<HTMLElement>('.topic-locked-hint');
        card.setLocked(true);
        expect(toggle?.disabled).toBe(true);
        expect(hint?.hidden).toBe(false);
        card.setSelected(true);
        card.setLocked(true);
        expect(toggle?.disabled).toBe(false);
        expect(hint?.hidden).toBe(true);
    });

    test('puts the summary and preview in the card', () => {
        const { card } = makeCard('addition');
        const canvas = document.createElement('canvas');
        card.setSummary('Double digit', '2-dig');
        card.setPreview(canvas);
        expect(card.element.querySelector('.topic-summary')?.textContent).toBe('Double digit');
        expect(card.element.querySelector('.topic-preview canvas')).toBe(canvas);
    });

    test('swaps to the short name and summary in the compact view, and back', () => {
        const { card } = makeCard('addition');
        card.setSummary('Double digit', '2-dig');
        card.setViewMode('compact');
        expect(card.element.querySelector('.topic-name')?.textContent).toBe('Add');
        expect(card.element.querySelector('.topic-summary')?.textContent).toBe('2-dig');
        expect(card.element.classList.contains('compact')).toBe(true);
        card.setViewMode('normal');
        expect(card.element.querySelector('.topic-name')?.textContent).toBe('Addition');
        expect(card.element.querySelector('.topic-summary')?.textContent).toBe('Double digit');
    });
});

describe('createTopicCard words', () => {
    afterEach(() => {
        setLanguage('en');
    });

    test('writes no English of its own, chosen or not, locked or not, in either view', () => {
        setMessages(createMarkerCatalog());
        const offenders: string[] = [];
        for (const topic of TOPIC_KEYS) {
            const card = createTopicCard(topic, createDefaultSelections(), { onToggle: vi.fn(), onSettingsChange: vi.fn() });
            for (const isSelected of [false, true]) {
                for (const viewMode of ['normal', 'compact'] as const) {
                    card.setSelected(isSelected);
                    card.setLocked(!isSelected);
                    card.setViewMode(viewMode);
                    findUnmarkedWords(collectWords(card.element)).forEach((word) => offenders.push(`${topic}: ${word}`));
                }
            }
        }
        expect(offenders).toEqual([]);
    });

    test('shows the catalog\'s toggle words as the topic is chosen', () => {
        setMessages(createMarkerCatalog());
        const { card } = makeCard('addition');
        const toggle = card.element.querySelector('.topic-toggle');
        expect(toggle?.textContent).toBe('card:add');
        card.setSelected(true);
        expect(toggle?.textContent).toBe('card:added');
    });

    test('labels the example picture in English as it always has', () => {
        const { card } = makeCard('addition');
        expect(card.element.querySelector('[role="img"]')?.getAttribute('aria-label')).toBe('Addition example');
    });
});
