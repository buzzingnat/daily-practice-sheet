import {
    CursiveLayout,
    FontMetrics,
    LetterInk,
    planCursiveLayout
} from '../../src/exercises/cursive/cursive-layout';
import { CursiveLayoutName } from '../../src/types';

export const QUADRANT_WIDTH = 266;
export const QUADRANT_HEIGHT = 155;

// Measured from Learning Curve Regular: ascender of l, x-height, descender of g
export const METRICS: FontMetrics = { ascender: 0.64, xHeight: 0.303, descender: 0.312 };

// How far each letter's ink reaches left and right of its origin, in hundredths of an em, measured
// in a browser from Learning Curve Regular at 100px (whole numbers, so a little rounded)
const MEASURED_HUNDREDTHS: Readonly<Record<string, readonly [number, number]>> = {
    a: [8, 44], b: [12, 39], c: [10, 33], d: [10, 43], e: [9, 33], f: [14, 37], g: [10, 39],
    h: [10, 44], i: [8, 26], j: [19, 24], k: [10, 40], l: [9, 35], m: [11, 69], n: [10, 52],
    o: [8, 39], p: [11, 41], q: [12, 36], r: [9, 35], s: [10, 31], t: [8, 30], u: [10, 42],
    v: [10, 49], w: [8, 60], x: [9, 46], y: [11, 53], z: [8, 44]
};

export const MEASURED_INK: Readonly<Record<string, LetterInk>> = Object.fromEntries(
    Object.entries(MEASURED_HUNDREDTHS).map(([letter, [left, right]]) => [letter, { left: left / 100, right: right / 100 }])
);

export const MEASURED_LETTERS: readonly string[] = Object.keys(MEASURED_HUNDREDTHS);

export function inkWidth(ink: LetterInk): number {
    return ink.left + ink.right;
}

function inkOf(letter: string): LetterInk {
    const ink = MEASURED_INK[letter];
    if (!ink) {
        throw new Error(`No measured ink for ${letter}.`);
    }
    return ink;
}

// A few letters by name, narrow to wide
export const INK_I: LetterInk = inkOf('i');
export const INK_A: LetterInk = inkOf('a');
export const INK_N: LetterInk = inkOf('n');
export const INK_M: LetterInk = inkOf('m');

export const EPSILON = 1e-9;

// The layout for a letter, sized the way the exercise sizes it: by the widest letter, m
export function layoutFor(ink: LetterInk, layout: CursiveLayoutName): CursiveLayout {
    return planCursiveLayout(QUADRANT_WIDTH, QUADRANT_HEIGHT, METRICS, ink, layout, INK_M);
}
