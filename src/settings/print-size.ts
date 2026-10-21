// How much to print, counted in half-pages. Two make a sheet; an odd one out
// takes the top of the last sheet and leaves the bottom for the cutting board.
export const MINIMUM_HALF_PAGES = 1;
export const MAXIMUM_HALF_PAGES = 20;
export const DEFAULT_HALF_PAGES = 2;

export interface PrintSizeDescription {
    // Pages touched, the last possibly half-filled
    pageCount: number;
    hasHalfPageRemainder: boolean;
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

export function describePrintSize(halfPageCount: number): PrintSizeDescription {
    const pageCount = Math.ceil(halfPageCount / 2);
    const hasHalfPageRemainder = halfPageCount % 2 === 1;

    return { pageCount, hasHalfPageRemainder };
}
