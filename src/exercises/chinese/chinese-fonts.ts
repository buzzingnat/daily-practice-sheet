import { CHINESE_TRACING_FAMILY } from '../../constants';
import { MODEL_INK, TRACING_INK } from './chinese-grid';

// Any size will do: the browser fetches the face, not a size of it
const LOADING_SIZE = 40;

// A character the cut-down font must hold, so the browser has a reason to fetch it and something to check
const SAMPLE_CHARACTER = '\u4E00';

/**
 * Loads both weights of the tracing font, the model's and the copies', before the first render.
 * Canvas text quietly falls back to a system font if a face has not arrived, and a child would then
 * trace strokes the printout never meant, so a missing face is an error here, as it is for the
 * other fonts. A missing weight is subtler: the browser hands over the other one, so each must come
 * back as itself. (A shared loading helper for all three fonts is on the roadmap.)
 */
export async function loadChineseFonts(): Promise<void> {
    await Promise.all([MODEL_INK.weight, TRACING_INK.weight].map(async (weight) => {
        const descriptor = `${weight} ${LOADING_SIZE}px ${CHINESE_TRACING_FAMILY}`;
        const loadedFaces = await document.fonts.load(descriptor, SAMPLE_CHARACTER);
        const hasRequestedWeight = loadedFaces.some((face) => face.weight === String(weight));
        if (!hasRequestedWeight || !document.fonts.check(descriptor, SAMPLE_CHARACTER)) {
            throw new Error(`No font is declared for ${descriptor}, so the Chinese exercises cannot draw.`);
        }
    }));
}
