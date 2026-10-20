import {
    clampHalfPageCount,
    describePrintSize,
    MAXIMUM_HALF_PAGES,
    MINIMUM_HALF_PAGES
} from '../settings/print-size';
import { ViewMode } from '../types';

export interface SummaryBarState {
    selectedTopicCount: number;
    maximumTopicCount: number;
    halfPageCount: number;
    viewMode: ViewMode;
    fullSummary: string;
    shortSummary: string;
}

export interface SummaryBarHandlers {
    onViewModeChange(viewMode: ViewMode): void;
    onHalfPageCountChange(halfPageCount: number): void;
    onMake(): void;
}

export interface SummaryBar {
    element: HTMLElement;
    update(state: SummaryBarState): void;
}

// The generate button keeps the id the page has always given it
export const MAKE_BUTTON_ID = 'random-batch-generator-btn';

const SVG_NAMESPACE = 'http://www.w3.org/2000/svg';

// A grid of four squares for compact, one square for normal
function buildViewIcon(viewMode: ViewMode): SVGElement {
    const icon = document.createElementNS(SVG_NAMESPACE, 'svg');
    icon.setAttribute('viewBox', '0 0 16 16');
    icon.setAttribute('width', '16');
    icon.setAttribute('height', '16');
    icon.setAttribute('aria-hidden', 'true');
    const squares = viewMode === 'compact'
        ? [[1, 1], [9, 1], [1, 9], [9, 9]]
        : [[2, 2]];
    const size = viewMode === 'compact' ? 6 : 12;
    squares.forEach(([x, y]) => {
        const square = document.createElementNS(SVG_NAMESPACE, 'rect');
        square.setAttribute('x', String(x));
        square.setAttribute('y', String(y));
        square.setAttribute('width', String(size));
        square.setAttribute('height', String(size));
        square.setAttribute('rx', '1');
        square.setAttribute('fill', 'currentColor');
        icon.appendChild(square);
    });
    return icon;
}

function buildStepperButton(label: string, text: string): HTMLButtonElement {
    const button = document.createElement('button');
    button.type = 'button';
    button.classList.add('stepper-button');
    button.textContent = text;
    button.setAttribute('aria-label', label);
    return button;
}

/**
 * The fixed bar at the foot of the screen: a count line, the summary of every
 * chosen setting, then the view toggle and the Make button. The summary reads
 * whole in the normal view; in the compact view it is one abbreviated line that
 * a chevron opens to the whole text. The bar keeps no choices of its own beyond
 * that open or shut state; main.ts owns them and calls update.
 */
export function createSummaryBar(initialState: SummaryBarState, handlers: SummaryBarHandlers): SummaryBar {
    let state = initialState;
    let isExpanded = false;

    const element = document.createElement('section');
    element.classList.add('summary-bar');
    element.setAttribute('aria-label', 'Your sheet');

    const countRow = document.createElement('div');
    countRow.classList.add('summary-count-row');
    const countLine = document.createElement('p');
    countLine.classList.add('summary-count');
    const stepper = document.createElement('div');
    stepper.classList.add('summary-stepper');
    const decreaseButton = buildStepperButton('One fewer half-page', '-');
    const halfPageInput = document.createElement('input');
    halfPageInput.type = 'number';
    halfPageInput.min = String(MINIMUM_HALF_PAGES);
    halfPageInput.max = String(MAXIMUM_HALF_PAGES);
    halfPageInput.step = '1';
    halfPageInput.setAttribute('aria-label', 'Half-pages');
    const increaseButton = buildStepperButton('One more half-page', '+');
    // Decorative; the count line says the same thing in words. Normal view only.
    const pageDiagram = document.createElement('div');
    pageDiagram.classList.add('page-diagram');
    pageDiagram.setAttribute('aria-hidden', 'true');
    stepper.append(decreaseButton, halfPageInput, increaseButton, pageDiagram);
    countRow.append(countLine, stepper);

    const summaryRow = document.createElement('div');
    summaryRow.classList.add('summary-text-row');
    const summaryText = document.createElement('p');
    summaryText.classList.add('summary-text');
    summaryText.id = 'summary-text';
    const chevron = document.createElement('button');
    chevron.type = 'button';
    chevron.classList.add('summary-chevron');
    chevron.setAttribute('aria-controls', summaryText.id);
    chevron.addEventListener('click', () => {
        isExpanded = !isExpanded;
        render();
    });
    summaryRow.append(summaryText, chevron);

    const buttonRow = document.createElement('div');
    buttonRow.classList.add('summary-button-row');
    const viewToggle = document.createElement('div');
    viewToggle.classList.add('view-toggle');
    viewToggle.setAttribute('role', 'group');
    viewToggle.setAttribute('aria-label', 'Card size');
    const viewButtons = new Map<ViewMode, HTMLButtonElement>();
    (['compact', 'normal'] as const).forEach((viewMode) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.classList.add('view-toggle-button');
        button.setAttribute('aria-label', viewMode === 'compact' ? 'Compact view' : 'Normal view');
        button.appendChild(buildViewIcon(viewMode));
        button.addEventListener('click', () => handlers.onViewModeChange(viewMode));
        viewButtons.set(viewMode, button);
        viewToggle.appendChild(button);
    });
    const makeButton = document.createElement('button');
    makeButton.type = 'button';
    makeButton.id = MAKE_BUTTON_ID;
    makeButton.classList.add('make-button');
    makeButton.textContent = 'Make';
    makeButton.addEventListener('click', handlers.onMake);
    buttonRow.append(viewToggle, makeButton);

    element.append(countRow, summaryRow, buttonRow);

    const changeHalfPages = (requested: number): void => {
        handlers.onHalfPageCountChange(clampHalfPageCount(requested));
    };
    decreaseButton.addEventListener('click', () => changeHalfPages(state.halfPageCount - 1));
    increaseButton.addEventListener('click', () => changeHalfPages(state.halfPageCount + 1));
    halfPageInput.addEventListener('change', () => changeHalfPages(halfPageInput.valueAsNumber));

    // Everything is updated in place, which keeps keyboard focus where the user left it
    function render(): void {
        const isCompact = state.viewMode === 'compact';
        const pageCount = describePrintSize(state.halfPageCount).pageCount;
        countLine.textContent = `${state.selectedTopicCount} of ${state.maximumTopicCount} topics - `
            + `${pageCount} ${pageCount === 1 ? 'page' : 'pages'}`;

        pageDiagram.hidden = isCompact;
        pageDiagram.replaceChildren();
        for (let pageIndex = 0; pageIndex < pageCount; pageIndex += 1) {
            const page = document.createElement('div');
            page.classList.add('page-icon');
            for (let halfIndex = 0; halfIndex < 2; halfIndex += 1) {
                const half = document.createElement('div');
                half.classList.add('half-icon');
                if (pageIndex * 2 + halfIndex < state.halfPageCount) {
                    half.classList.add('printed');
                }
                page.appendChild(half);
            }
            pageDiagram.appendChild(page);
        }

        halfPageInput.value = String(state.halfPageCount);
        decreaseButton.disabled = state.halfPageCount <= MINIMUM_HALF_PAGES;
        increaseButton.disabled = state.halfPageCount >= MAXIMUM_HALF_PAGES;

        const showsShortText = isCompact && !isExpanded;
        summaryText.textContent = showsShortText ? state.shortSummary : state.fullSummary;
        element.classList.toggle('compact', isCompact);
        summaryText.classList.toggle('one-line', showsShortText);
        chevron.hidden = !isCompact;
        chevron.setAttribute('aria-expanded', String(isExpanded));
        chevron.setAttribute('aria-label', isExpanded ? 'Show less' : 'Show full summary');
        chevron.textContent = isExpanded ? '▾' : '▴';

        viewButtons.forEach((button, viewMode) => {
            button.setAttribute('aria-pressed', String(viewMode === state.viewMode));
        });
        makeButton.disabled = state.selectedTopicCount === 0;
    }

    render();
    return {
        element,
        update(nextState: SummaryBarState): void {
            state = nextState;
            render();
        }
    };
}
