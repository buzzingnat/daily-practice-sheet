import { CURSIVE_BOLD_FONT, CURSIVE_DASHED_FONT, CURSIVE_REGULAR_FONT } from '../../constants';
import { FontMetrics, LetterInk } from './cursive-layout';

// Measurements are taken large, so rounding does not eat the answer, and then divided back to em fractions
const MEASURING_SIZE = 100;

/**
 * Loads the three cursive fonts before the first render. Canvas text silently falls back to a
 * default face if a font has not arrived, so a family that cannot be found is an error here.
 */
export async function loadCursiveFonts(): Promise<void> {
    const families = [CURSIVE_BOLD_FONT, CURSIVE_REGULAR_FONT, CURSIVE_DASHED_FONT];
    await Promise.all(families.map(async (family) => {
        const loadedFaces = await document.fonts.load(`${MEASURING_SIZE}px ${family}`);
        if (loadedFaces.length === 0) {
            throw new Error(`The font family ${family} is not declared, so cursive exercises cannot draw.`);
        }
    }));
}

export function areCursiveFontsLoaded(): boolean {
    return [CURSIVE_BOLD_FONT, CURSIVE_REGULAR_FONT, CURSIVE_DASHED_FONT]
        .every((family) => document.fonts.check(`${MEASURING_SIZE}px ${family}`));
}

/**
 * How far the regular font rises above and falls below its baseline: the ascender of l,
 * the x-height of x, and the descender of g.
 */
export function measureFontMetrics(context: CanvasRenderingContext2D): FontMetrics {
    context.font = `${MEASURING_SIZE}px ${CURSIVE_REGULAR_FONT}`;
    return {
        ascender: context.measureText('l').actualBoundingBoxAscent / MEASURING_SIZE,
        xHeight: context.measureText('x').actualBoundingBoxAscent / MEASURING_SIZE,
        descender: context.measureText('g').actualBoundingBoxDescent / MEASURING_SIZE
    };
}

/**
 * How far one letter's ink reaches left and right of its origin. The advance width is no
 * guide here, because cursive letters carry entry and exit strokes beyond it.
 */
export function measureLetterInk(context: CanvasRenderingContext2D, letter: string): LetterInk {
    context.font = `${MEASURING_SIZE}px ${CURSIVE_REGULAR_FONT}`;
    const measurement = context.measureText(letter);
    return {
        left: measurement.actualBoundingBoxLeft / MEASURING_SIZE,
        right: measurement.actualBoundingBoxRight / MEASURING_SIZE
    };
}
