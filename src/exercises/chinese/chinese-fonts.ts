import { CHINESE_TRACING_FAMILY } from '../../constants';

// Any size will do: the browser fetches the face, not a size of it
const LOADING_SIZE = 40;

// A character the cut-down font must hold, so the browser has a reason to fetch it and something to check
const SAMPLE_CHARACTER = '\u4E00';

/**
 * Loads the tracing font before the first render. Canvas text quietly falls back to a system font
 * if the face has not arrived, and a child would then trace strokes the printout never meant, so a
 * missing face is an error here, as it is for the other fonts. (A shared loading helper for all
 * three is on the roadmap.)
 */
export async function loadChineseFonts(): Promise<void> {
    const descriptor = `${LOADING_SIZE}px ${CHINESE_TRACING_FAMILY}`;
    const loadedFaces = await document.fonts.load(descriptor, SAMPLE_CHARACTER);
    if (loadedFaces.length === 0 || !document.fonts.check(descriptor, SAMPLE_CHARACTER)) {
        throw new Error(`The ${CHINESE_TRACING_FAMILY} font did not load, so the Chinese exercises cannot draw.`);
    }
}
