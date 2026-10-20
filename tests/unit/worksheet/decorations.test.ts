import { describe, expect, test } from 'vitest';
import { createDecorationRandom, drawHalfPageDecorations, planDaisies } from '../../../src/worksheet/decorations';
import { GRID_BOTTOM_OFFSET, getMascotBottomEdge, HALF_PAGE_HEIGHT } from '../../../src/worksheet/worksheet-layout';
import { createRecordingContext } from '../../support/recording-context';

const SEEDS = Array.from({ length: 300 }, (unused, seed) => seed);
// A top half and a bottom half stand their mascot's feet at different heights
const BOTTOM_EDGES = [getMascotBottomEdge(0), getMascotBottomEdge(HALF_PAGE_HEIGHT)];
const PRINTER_SAFE_EDGE = 14;
const PAGE_WIDTH = 612;
const EXERCISE_AREA_LEFT = 40;
const EXERCISE_AREA_RIGHT = 572;

describe('createDecorationRandom', () => {
    test('gives the same run of numbers for the same seed, and stays inside zero and one', () => {
        const first = createDecorationRandom(7);
        const second = createDecorationRandom(7);
        const offenders: string[] = [];
        for (let draw = 0; draw < 500; draw++) {
            const value = first();
            if (value !== second()) {
                offenders.push(`draw ${draw} differed`);
            }
            if (value < 0 || value >= 1) {
                offenders.push(`draw ${draw} gave ${value}`);
            }
        }
        expect(offenders).toEqual([]);
    });

    test('gives different numbers for different seeds', () => {
        expect(createDecorationRandom(1)()).not.toBe(createDecorationRandom(2)());
    });
});

describe('planDaisies', () => {
    test('puts the same flowers on a worksheet and on its answer key', () => {
        expect(planDaisies(5, BOTTOM_EDGES[0] as number)).toEqual(planDaisies(5, BOTTOM_EDGES[0] as number));
    });

    test('moves the flowers from one page to the next', () => {
        const edge = BOTTOM_EDGES[0] as number;
        const layouts = new Set(SEEDS.map((seed) => JSON.stringify(planDaisies(seed, edge))));
        expect(layouts.size).toBe(SEEDS.length);
    });

    test('keeps every daisy off the exercises, inside the printable paper and above the mascot\'s feet', () => {
        const offenders: string[] = [];
        for (const bottomEdge of BOTTOM_EDGES) {
            for (const seed of SEEDS) {
                planDaisies(seed, bottomEdge).forEach((daisy, daisyIndex) => {
                    const label = `seed ${seed}, edge ${bottomEdge}, daisy ${daisyIndex}`;
                    const left = daisy.x - daisy.radius;
                    const right = daisy.x + daisy.radius;
                    if (left < PRINTER_SAFE_EDGE || right > PAGE_WIDTH - PRINTER_SAFE_EDGE) {
                        offenders.push(`${label} leaves the printable width`);
                    }
                    if (daisy.y - daisy.radius < PRINTER_SAFE_EDGE) {
                        offenders.push(`${label} rises into the top edge`);
                    }
                    if (daisy.y + daisy.radius > bottomEdge) {
                        offenders.push(`${label} sinks below the mascot's feet`);
                    }
                    const insideExerciseColumns = right > EXERCISE_AREA_LEFT && left < EXERCISE_AREA_RIGHT;
                    const lowEnoughForTheBand = daisy.y - daisy.radius >= GRID_BOTTOM_OFFSET;
                    if (insideExerciseColumns && !lowEnoughForTheBand) {
                        offenders.push(`${label} lands on the exercises`);
                    }
                });
            }
        }
        expect(offenders).toEqual([]);
    });

    test('never lets two daisies touch', () => {
        const offenders: string[] = [];
        for (const bottomEdge of BOTTOM_EDGES) {
            for (const seed of SEEDS) {
                const daisies = planDaisies(seed, bottomEdge);
                daisies.forEach((daisy, index) => {
                    daisies.slice(index + 1).forEach((other) => {
                        const distance = Math.hypot(daisy.x - other.x, daisy.y - other.y);
                        if (distance < daisy.radius + other.radius) {
                            offenders.push(`seed ${seed}, edge ${bottomEdge}: two daisies overlap by ${(daisy.radius + other.radius - distance).toFixed(1)}pt`);
                        }
                    });
                });
            }
        }
        expect(offenders).toEqual([]);
    });
});

describe('drawHalfPageDecorations', () => {
    function recordDrawing(seed: number, bottomEdge: number): string {
        const { quadrantContext, calls } = createRecordingContext();
        drawHalfPageDecorations(quadrantContext.context, seed, bottomEdge);
        return JSON.stringify(calls);
    }

    test('draws the same picture twice for the same seed', () => {
        const edge = BOTTOM_EDGES[1] as number;
        expect(recordDrawing(3, edge)).toBe(recordDrawing(3, edge));
    });

    test('draws a different picture for a different seed, and for the other half of the paper', () => {
        expect(recordDrawing(3, BOTTOM_EDGES[0] as number)).not.toBe(recordDrawing(4, BOTTOM_EDGES[0] as number));
        expect(recordDrawing(3, BOTTOM_EDGES[0] as number)).not.toBe(recordDrawing(3, BOTTOM_EDGES[1] as number));
    });

    test('draws every point of the vines inside the printable paper', () => {
        const offenders: string[] = [];
        for (const bottomEdge of BOTTOM_EDGES) {
            const { quadrantContext, calls } = createRecordingContext();
            drawHalfPageDecorations(quadrantContext.context, 1, bottomEdge);
            // Leaves and daisies draw in their own turned and shifted space, between a save and a restore;
            // only the vines are drawn straight onto the page
            let depth = 0;
            calls.forEach((call) => {
                if (call.name === 'save') {
                    depth = depth + 1;
                } else if (call.name === 'restore') {
                    depth = depth - 1;
                } else if (depth === 1 && (call.name === 'moveTo' || call.name === 'bezierCurveTo')) {
                    const numbers = call.args as number[];
                    for (let index = 0; index < numbers.length; index += 2) {
                        const x = numbers[index] as number;
                        const y = numbers[index + 1] as number;
                        if (x < PRINTER_SAFE_EDGE || x > PAGE_WIDTH - PRINTER_SAFE_EDGE || y < PRINTER_SAFE_EDGE || y > bottomEdge) {
                            offenders.push(`edge ${bottomEdge}: ${call.name} reaches (${x}, ${y})`);
                        }
                    }
                }
            });
        }
        expect(offenders).toEqual([]);
    });
});
