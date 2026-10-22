import { describe, expect, test } from 'vitest';
import { convertToGrayscale } from '../../../../src/exercises/cursive/emoji-grayscale';

function pixels(...values: number[]): Uint8ClampedArray {
    return Uint8ClampedArray.from(values);
}

describe('convertToGrayscale', () => {
    test('makes the three color channels of each pixel equal', () => {
        const data = pixels(255, 0, 0, 255, 10, 200, 30, 255);
        convertToGrayscale(data);
        expect([data[0], data[1]]).toEqual([data[1], data[2]]);
        expect([data[4], data[5]]).toEqual([data[5], data[6]]);
    });

    test('keeps transparency exactly as it was', () => {
        const data = pixels(255, 0, 0, 0, 0, 255, 0, 128, 0, 0, 255, 255);
        convertToGrayscale(data);
        expect([data[3], data[7], data[11]]).toEqual([0, 128, 255]);
    });

    test('changes nothing the second time', () => {
        const data = pixels(200, 100, 50, 255);
        convertToGrayscale(data);
        const once = Array.from(data);
        convertToGrayscale(data);
        expect(Array.from(data)).toEqual(once);
    });

    test('does nothing to an empty list', () => {
        expect(() => convertToGrayscale(pixels())).not.toThrow();
    });

    test('refuses data that does not come in fours', () => {
        expect(() => convertToGrayscale(pixels(1, 2, 3))).toThrow(/fours/);
    });
});
