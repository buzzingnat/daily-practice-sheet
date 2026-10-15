import {
    clampHalfPageCount,
    describePrintSize,
    MAXIMUM_HALF_PAGES,
    MINIMUM_HALF_PAGES,
    QUICK_PICK_HALF_PAGES
} from '../settings/print-size';

/**
 * Builds the "Print size" fieldset: a stepper, quick picks, a little diagram of
 * the sheets, and a caption saying the same thing in words. Everything updates in
 * place, so keyboard focus stays where the user left it. onChange fires with the
 * clamped count after every edit.
 */
export function renderPrintSizePanel(
    container: HTMLElement,
    initialHalfPageCount: number,
    onChange: (halfPageCount: number) => void
): void {
    container.replaceChildren();

    const fieldset = document.createElement('fieldset');
    fieldset.classList.add('settings-panel');
    fieldset.id = 'print-size-panel';
    const legend = document.createElement('legend');
    legend.textContent = 'Print size';
    fieldset.appendChild(legend);

    const controlRow = document.createElement('div');
    controlRow.classList.add('choice-row', 'print-size-controls');

    const inputLabel = document.createElement('label');
    inputLabel.htmlFor = 'half-page-count';
    inputLabel.textContent = 'Half-pages';

    const decreaseButton = document.createElement('button');
    decreaseButton.type = 'button';
    decreaseButton.classList.add('stepper-button');
    decreaseButton.textContent = '-';
    decreaseButton.setAttribute('aria-label', 'One fewer half-page');

    const countInput = document.createElement('input');
    countInput.type = 'number';
    countInput.id = 'half-page-count';
    countInput.min = String(MINIMUM_HALF_PAGES);
    countInput.max = String(MAXIMUM_HALF_PAGES);
    countInput.step = '1';

    const increaseButton = document.createElement('button');
    increaseButton.type = 'button';
    increaseButton.classList.add('stepper-button');
    increaseButton.textContent = '+';
    increaseButton.setAttribute('aria-label', 'One more half-page');

    controlRow.appendChild(inputLabel);
    controlRow.appendChild(decreaseButton);
    controlRow.appendChild(countInput);
    controlRow.appendChild(increaseButton);

    const quickPickRow = document.createElement('div');
    quickPickRow.classList.add('choice-row');
    const quickPickLabel = document.createElement('span');
    quickPickLabel.textContent = 'Quick picks';
    quickPickRow.appendChild(quickPickLabel);
    const quickPickChips = new Map<number, HTMLButtonElement>();
    QUICK_PICK_HALF_PAGES.forEach((pickedCount) => {
        const chip = document.createElement('button');
        chip.type = 'button';
        chip.classList.add('chip');
        chip.textContent = String(pickedCount);
        chip.addEventListener('click', () => applyCount(pickedCount));
        quickPickChips.set(pickedCount, chip);
        quickPickRow.appendChild(chip);
    });

    // Decorative; the caption below says the same thing to everyone else
    const diagram = document.createElement('div');
    diagram.classList.add('page-diagram');
    diagram.setAttribute('aria-hidden', 'true');

    const caption = document.createElement('p');
    caption.classList.add('print-size-caption');
    caption.setAttribute('aria-live', 'polite');

    fieldset.appendChild(controlRow);
    fieldset.appendChild(quickPickRow);
    fieldset.appendChild(diagram);
    fieldset.appendChild(caption);
    container.appendChild(fieldset);

    let currentCount = clampHalfPageCount(initialHalfPageCount);

    const refresh = (): void => {
        countInput.value = String(currentCount);
        decreaseButton.disabled = currentCount <= MINIMUM_HALF_PAGES;
        increaseButton.disabled = currentCount >= MAXIMUM_HALF_PAGES;
        quickPickChips.forEach((chip, pickedCount) => {
            chip.setAttribute('aria-pressed', String(pickedCount === currentCount));
        });

        const description = describePrintSize(currentCount);
        caption.textContent = description.caption;

        diagram.replaceChildren();
        for (let pageIndex = 0; pageIndex < description.pageCount; pageIndex += 1) {
            const page = document.createElement('div');
            page.classList.add('page-icon');
            for (let halfIndex = 0; halfIndex < 2; halfIndex += 1) {
                const half = document.createElement('div');
                half.classList.add('half-icon');
                if (pageIndex * 2 + halfIndex < currentCount) {
                    half.classList.add('printed');
                }
                page.appendChild(half);
            }
            diagram.appendChild(page);
        }
    };

    function applyCount(requested: number): void {
        currentCount = clampHalfPageCount(requested);
        refresh();
        onChange(currentCount);
    }

    decreaseButton.addEventListener('click', () => applyCount(currentCount - 1));
    increaseButton.addEventListener('click', () => applyCount(currentCount + 1));
    // The change event waits for the user to finish typing, so "1" on the way to "10" is left alone
    countInput.addEventListener('change', () => applyCount(countInput.valueAsNumber));

    refresh();
}
