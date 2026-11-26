import { SANS_SERIF_FAMILY } from '../constants';

// The weights styles.css declares for the sans-serif. Medium answers to 400, because the code
// asks for "normal" and Regular would print as faint as a polite apology.
const SANS_SERIF_WEIGHTS: readonly number[] = [400, 700];

// Any size loads a face; this one is merely the least surprising
const LOADING_SIZE = 16;

/**
 * Loads both weights of the sans-serif before the first render. Canvas text quietly falls back
 * to whatever the system offers if a face has not arrived, and the PDF would then disagree with
 * its own preview, so a face that cannot be found is an error here. A file that fails to
 * download rejects the load outright. A missing weight is subtler: font matching hands over the
 * nearest one instead, so each weight must come back as itself, not as a well-meaning relation.
 */
export async function loadSansSerifFonts(): Promise<void> {
    await Promise.all(SANS_SERIF_WEIGHTS.map(async (weight) => {
        const descriptor = `${weight} ${LOADING_SIZE}px ${SANS_SERIF_FAMILY}`;
        const loadedFaces = await document.fonts.load(descriptor);
        const hasRequestedWeight = loadedFaces.some((face) => face.weight === String(weight));
        if (!hasRequestedWeight) {
            throw new Error(`No font is declared for ${descriptor}, so the worksheets cannot draw their words.`);
        }
    }));
}
