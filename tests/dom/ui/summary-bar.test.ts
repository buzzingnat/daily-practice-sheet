// @vitest-environment jsdom
import { describe, expect, test, vi } from 'vitest';
import { createSummaryBar, SummaryBarState } from '../../../src/ui/summary-bar';

const baseState: SummaryBarState = {
    selectedTopicCount: 4,
    maximumTopicCount: 6,
    halfPageCount: 2,
    viewMode: 'normal',
    fullSummary: 'Addition: double digit.',
    shortSummary: 'Add: 2-dig'
};

function makeBar(changes: Partial<SummaryBarState> = {}) {
    const handlers = { onViewModeChange: vi.fn(), onHalfPageCountChange: vi.fn(), onMake: vi.fn() };
    const bar = createSummaryBar({ ...baseState, ...changes }, handlers);
    document.body.replaceChildren(bar.element);
    const text = (selector: string): string | undefined => bar.element.querySelector(selector)?.textContent ?? undefined;
    return { bar, handlers, text };
}

describe('createSummaryBar', () => {
    test('puts the count on its own line, with pages counted from half-pages', () => {
        expect(makeBar().text('.summary-count')).toBe('4 of 6 topics - 1 page');
        expect(makeBar({ halfPageCount: 3 }).text('.summary-count')).toBe('4 of 6 topics - 2 pages');
    });

    test('shows the full summary and no chevron in the normal view', () => {
        const { bar, text } = makeBar();
        expect(text('.summary-text')).toBe('Addition: double digit.');
        expect(bar.element.querySelector<HTMLElement>('.summary-chevron')?.hidden).toBe(true);
    });

    test('shows the short one-line summary in the compact view, and the full text once expanded', () => {
        const { bar, text } = makeBar({ viewMode: 'compact' });
        expect(text('.summary-text')).toBe('Add: 2-dig');
        const chevron = bar.element.querySelector<HTMLButtonElement>('.summary-chevron');
        chevron?.click();
        expect(text('.summary-text')).toBe('Addition: double digit.');
        expect(chevron?.getAttribute('aria-expanded')).toBe('true');
        chevron?.click();
        expect(text('.summary-text')).toBe('Add: 2-dig');
    });

    test('labels the button Make and keeps the old button id', () => {
        const { bar, handlers } = makeBar();
        const makeButton = bar.element.querySelector<HTMLButtonElement>('#random-batch-generator-btn');
        expect(makeButton?.textContent).toBe('Make');
        makeButton?.click();
        expect(handlers.onMake).toHaveBeenCalledTimes(1);
    });

    test('disables Make when no topic is chosen, and enables it again on update', () => {
        const { bar } = makeBar({ selectedTopicCount: 0 });
        const makeButton = bar.element.querySelector<HTMLButtonElement>('.make-button');
        expect(makeButton?.disabled).toBe(true);
        bar.update({ ...baseState, selectedTopicCount: 1 });
        expect(makeButton?.disabled).toBe(false);
    });

    test('reports a view change and marks the current view pressed', () => {
        const { bar, handlers } = makeBar({ viewMode: 'compact' });
        const [compactButton, normalButton] = Array.from(bar.element.querySelectorAll<HTMLButtonElement>('.view-toggle-button'));
        expect(compactButton?.getAttribute('aria-pressed')).toBe('true');
        expect(normalButton?.getAttribute('aria-pressed')).toBe('false');
        normalButton?.click();
        expect(handlers.onViewModeChange).toHaveBeenCalledWith('normal');
    });

    test('steps the half-page count within its limits', () => {
        const { bar, handlers } = makeBar({ halfPageCount: 20 });
        const [decrease, increase] = Array.from(bar.element.querySelectorAll<HTMLButtonElement>('.stepper-button'));
        expect(increase?.disabled).toBe(true);
        decrease?.click();
        expect(handlers.onHalfPageCountChange).toHaveBeenCalledWith(19);
    });

    test('clamps a typed half-page count', () => {
        const { bar, handlers } = makeBar();
        const input = bar.element.querySelector<HTMLInputElement>('input[type="number"]');
        if (input) {
            input.value = '99';
            input.dispatchEvent(new Event('change'));
        }
        expect(handlers.onHalfPageCountChange).toHaveBeenCalledWith(20);
    });
});
