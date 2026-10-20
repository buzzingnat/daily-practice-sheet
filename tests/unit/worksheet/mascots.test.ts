import { describe, expect, test } from 'vitest';
import { CHEERS, MASCOT_HEIGHT, MASCOTS, getMascotRectangle, pickMascotAndCheer } from '../../../src/worksheet/mascots';
import { GRID_BOTTOM_OFFSET, HALF_PAGE_HEIGHT, MASCOT_MAX_REACH_INTO_GRID, getMascotBottomEdge } from '../../../src/worksheet/worksheet-layout';

// The right edge the layout gives the mascot, and the paper's safe edge
const RIGHT_EDGE = 572;
const PRINTER_SAFE_EDGE = 14;
const PAGE_HEIGHT = HALF_PAGE_HEIGHT * 2;
const HALF_PAGE_STARTS = [0, HALF_PAGE_HEIGHT];
// The bubble grows with its text. At about 6.2pt a letter, 18 letters and the bubble's padding keep it
// right of the vine that will run along the left of the band (to about x = 340), even beside the widest animal.
const LONGEST_CHEER_LETTERS = 18;

describe('pickMascotAndCheer', () => {
    test('uses every animal and every cheer', () => {
        const picks = Array.from({ length: 56 }, (unused, halfPageNumber) => pickMascotAndCheer(halfPageNumber));
        expect(new Set(picks.map((pick) => pick.mascot.name)).size).toBe(MASCOTS.length);
        expect(new Set(picks.map((pick) => pick.cheer)).size).toBe(CHEERS.length);
    });

    test('gives the same answer for the same half-page, so a key matches its worksheet', () => {
        expect(pickMascotAndCheer(5)).toEqual(pickMascotAndCheer(5));
    });

    test('does not repeat an animal and cheer pair within 56 half-pages', () => {
        const pairs = Array.from({ length: 56 }, (unused, halfPageNumber) => {
            const pick = pickMascotAndCheer(halfPageNumber);
            return `${pick.mascot.name}/${pick.cheer}`;
        });
        expect(new Set(pairs).size).toBe(56);
    });

    test('never hands out an empty cheer, and keeps each short enough for its bubble', () => {
        const offenders = CHEERS.filter((cheer) => cheer.trim() === '' || cheer.length > LONGEST_CHEER_LETTERS);
        expect(offenders).toEqual([]);
    });
});

describe('getMascotRectangle', () => {
    test('is the same height for every animal and keeps each animal in proportion', () => {
        const offenders = MASCOTS.filter((mascot) => {
            const rectangle = getMascotRectangle(mascot, RIGHT_EDGE, getMascotBottomEdge(0));
            return rectangle.height !== MASCOT_HEIGHT || Math.abs(rectangle.width - (MASCOT_HEIGHT * mascot.artWidthUnits / 945)) > 0.001;
        });
        expect(offenders.map((mascot) => mascot.name)).toEqual([]);
    });

    test('stands clear of the cutting line and the printer\'s blind strip, in both halves of the paper', () => {
        const offenders: string[] = [];
        for (const mascot of MASCOTS) {
            for (const halfPageStart of HALF_PAGE_STARTS) {
                const rectangle = getMascotRectangle(mascot, RIGHT_EDGE, getMascotBottomEdge(halfPageStart));
                const feetOnPaper = halfPageStart + rectangle.top + rectangle.height;
                if (rectangle.top + rectangle.height >= HALF_PAGE_HEIGHT) {
                    offenders.push(`${mascot.name} touches the cutting line`);
                }
                if (feetOnPaper > PAGE_HEIGHT - PRINTER_SAFE_EDGE) {
                    offenders.push(`${mascot.name} reaches the printer's blind strip at the foot of the paper`);
                }
                if (rectangle.left < PRINTER_SAFE_EDGE || rectangle.left + rectangle.width > 612 - PRINTER_SAFE_EDGE) {
                    offenders.push(`${mascot.name} leaves the printable area sideways`);
                }
            }
        }
        expect(offenders).toEqual([]);
    });

    test('reaches into the grid no further than the blank margin every exercise leaves', () => {
        const offenders: string[] = [];
        for (const mascot of MASCOTS) {
            for (const halfPageStart of HALF_PAGE_STARTS) {
                const rectangle = getMascotRectangle(mascot, RIGHT_EDGE, getMascotBottomEdge(halfPageStart));
                if (rectangle.top < GRID_BOTTOM_OFFSET - MASCOT_MAX_REACH_INTO_GRID) {
                    offenders.push(`${mascot.name} rises ${GRID_BOTTOM_OFFSET - rectangle.top}pt into the grid`);
                }
            }
        }
        expect(offenders).toEqual([]);
    });
});
