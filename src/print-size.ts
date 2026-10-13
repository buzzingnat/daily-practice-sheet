// How much to print, counted in half-pages. Two make a sheet; an odd one out
// takes the top of the last sheet and leaves the bottom for the cutting board.
export const MINIMUM_HALF_PAGES = 1;
export const MAXIMUM_HALF_PAGES = 20;
export const DEFAULT_HALF_PAGES = 2;
export const QUICK_PICK_HALF_PAGES: readonly number[] = [1, 2, 4, 6, 10];

export interface PrintSizeDescription {
    // Pages touched, the last possibly half-filled
    pageCount: number;
    hasHalfPageRemainder: boolean;
    // The sentence shown to the user
    caption: string;
}

/**
 * Rounds to a whole number and holds it within the allowed range. Anything that
 * is not a number (an emptied field, say) falls back to the default.
 */
export function clampHalfPageCount(requested: number): number {
    if (!Number.isFinite(requested)) {
        return DEFAULT_HALF_PAGES;
    }
    return Math.min(MAXIMUM_HALF_PAGES, Math.max(MINIMUM_HALF_PAGES, Math.round(requested)));
}

function pluralizePages(count: number): string {
    return count === 1 ? '1 page' : `${count} pages`;
}

export function describePrintSize(halfPageCount: number): PrintSizeDescription {
    const pageCount = Math.ceil(halfPageCount / 2);
    const hasHalfPageRemainder = halfPageCount % 2 === 1;
    const halfPageLabel = halfPageCount === 1 ? '1 half-page' : `${halfPageCount} half-pages`;

    let caption = `${halfPageLabel} = ${pluralizePages(pageCount)}.`;
    if (hasHalfPageRemainder && halfPageCount === 1) {
        caption = '1 half-page = half a page. It prints the top half of one page.';
    } else if (hasHalfPageRemainder) {
        const fullPageCount = (halfPageCount - 1) / 2;
        caption = `${halfPageLabel} = ${fullPageCount} ${fullPageCount === 1 ? 'page' : 'pages'} and a half. `
            + `Page ${pageCount} holds one half-page.`;
    }

    return { pageCount, hasHalfPageRemainder, caption };
}
