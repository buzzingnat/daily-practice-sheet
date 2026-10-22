// @vitest-environment jsdom
import { afterEach, describe, expect, test, vi } from 'vitest';
import { createSummaryBar, SummaryBarState } from '../../../src/ui/summary-bar';
import { setLanguage, setMessages } from '../../../src/text/messages';
import { createMarkerCatalog } from '../../support/marker-catalog';
import { collectWords, findUnmarkedWords } from '../../support/visible-words';

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

    afterEach(() => {
        setLanguage('en');
    });

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
