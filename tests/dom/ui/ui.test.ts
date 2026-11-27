// @vitest-environment jsdom
import { describe, expect, test, vi } from 'vitest';
import { createSummaryBar, SummaryBarState } from '../../../src/ui/summary-bar';
import { createTopicCard } from '../../../src/ui/topic-card';
import { renderTopicSettings } from '../../../src/ui/topic-settings-panel';
import { createDefaultSelections } from '../../../src/settings/topic-settings';
import { setMessages } from '../../../src/text/messages';
import { CONFIGURABLE_TOPICS, TOPIC_KEYS } from '../../../src/types';
import { createMarkerCatalog } from '../../support/marker-catalog';
import { collectWords, findUnmarkedWords } from '../../support/visible-words';

// One file for all three, because jsdom takes seconds to start and milliseconds to use. The setup
// file restores English after each test, so none is needed here.

const baseState: SummaryBarState = {
    selectedTopicCount: 4,
    maximumTopicCount: 6,
    halfPageCount: 2,
    viewMode: 'normal',
    fullSummary: 'Addition: double digit.',
    shortSummary: 'Add: 2-dig'
};

describe('createSummaryBar words', () => {
    const handlers = { onViewModeChange: vi.fn(), onHalfPageCountChange: vi.fn(), onMake: vi.fn() };

    test('writes no English of its own, in either view', () => {
        setMessages(createMarkerCatalog());
        const offenders: string[] = [];
        for (const viewMode of ['normal', 'compact'] as const) {
            const bar = createSummaryBar({ ...baseState, viewMode, fullSummary: 'summary:full', shortSummary: 'summary:short' }, handlers);
            findUnmarkedWords(collectWords(bar.element)).forEach((word) => offenders.push(`${viewMode}: ${word}`));
        }
        expect(offenders).toEqual([]);
    });

    test('hands the count line the numbers and lets the catalog say them', () => {
        setMessages(createMarkerCatalog());
        const bar = createSummaryBar(baseState, handlers);
        expect(bar.element.querySelector('.summary-count')?.textContent).toBe('bar:count:4:6:1');
        expect(bar.element.querySelector('.make-button')?.textContent).toBe('bar:make');
    });
});

describe('createTopicCard words', () => {
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
});

describe('renderTopicSettings', () => {
    test('writes no English of its own for any topic', () => {
        setMessages(createMarkerCatalog());
        const offenders: string[] = [];
        for (const topic of CONFIGURABLE_TOPICS) {
            const container = document.createElement('div');
            renderTopicSettings(container, topic, createDefaultSelections(), () => undefined);
            findUnmarkedWords(collectWords(container)).forEach((word) => offenders.push(`${topic}: ${word}`));
        }
        expect(offenders).toEqual([]);
    });

    test('puts the catalog\'s All chip on every multiple-choice panel that offers one', () => {
        setMessages(createMarkerCatalog());
        const container = document.createElement('div');
        renderTopicSettings(container, 'countries', createDefaultSelections(), () => undefined);
        const chipTexts = [...container.querySelectorAll('button')].map((button) => button.textContent);
        expect(chipTexts).toContain('ui:allChip');
    });
});
