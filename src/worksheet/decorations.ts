import { COLOR_BLACK, COLOR_WHITE } from '../constants';
import { RandomSource } from '../types';

export interface Daisy {
    x: number;
    y: number;
    radius: number;
    turnDegrees: number;
}

// All of these are measured from the top left of a half-page, in points.
// The left vine climbs the margin; the band vine runs along the foot of the page toward the speech bubble.
const LEFT_VINE_CENTER_X = 27;
const LEFT_VINE_TOP_Y = 62;
const LEFT_VINE_SEGMENT_HEIGHT = 30;
const BAND_VINE_START_X = 27;
const BAND_VINE_END_X = 340;
const BAND_VINE_SEGMENT_WIDTH = 36;
const BAND_VINE_HEIGHT_ABOVE_FEET = 13;
const RIGHT_VINE_TOP_Y = 34;

const VINE_LINE_WIDTH = 1.6;
const SHAPE_LINE_WIDTH = 1.2;
const LEAF_VEIN_LINE_WIDTH = 0.8;
const PETAL_COUNT = 6;
const PETAL_STEP_DEGREES = 60;

interface DaisySpot {
    x: number;
    y: number;
    // How far the daisy may slide from its spot, never so far that it meets a neighbor
    slideX: number;
    slideY: number;
    smallestRadius: number;
    largestRadius: number;
}

/**
 * A small seeded generator, so a batch prints the same every time and the answer key wears the same flowers
 * as its worksheet. It is mulberry32: a handful of lines, no package.
 */
export function createDecorationRandom(seed: number): RandomSource {
    let state = seed >>> 0;
    return (): number => {
        state = (state + 0x6D2B79F5) >>> 0;
        let mixed = Math.imul(state ^ (state >>> 15), 1 | state);
        mixed = (mixed + Math.imul(mixed ^ (mixed >>> 7), 61 | mixed)) ^ mixed;
        return ((mixed ^ (mixed >>> 14)) >>> 0) / 4294967296;
    };
}

// The gap between two spots, less both slides, always exceeds the two largest radii, so no two daisies touch
function listDaisySpots(bottomEdge: number): DaisySpot[] {
    const bandY = bottomEdge - 20;
    return [
        { x: LEFT_VINE_CENTER_X, y: bottomEdge - 92, slideX: 0, slideY: 15, smallestRadius: 6, largestRadius: 8.5 },
        { x: LEFT_VINE_CENTER_X, y: bottomEdge - 196, slideX: 0, slideY: 15, smallestRadius: 6, largestRadius: 8.5 },
        { x: LEFT_VINE_CENTER_X, y: bottomEdge - 292, slideX: 0, slideY: 15, smallestRadius: 6, largestRadius: 8.5 },
        { x: 120, y: bandY, slideX: 20, slideY: 0, smallestRadius: 6, largestRadius: 8.5 },
        { x: 228, y: bandY, slideX: 20, slideY: 0, smallestRadius: 6, largestRadius: 8.5 },
        { x: 318, y: bandY, slideX: 20, slideY: 0, smallestRadius: 6, largestRadius: 8.5 },
        { x: 582, y: 28, slideX: 0, slideY: 3, smallestRadius: 6, largestRadius: 8 },
        { x: 582, y: 58, slideX: 0, slideY: 3, smallestRadius: 6, largestRadius: 8 }
    ];
}

/**
 * Decides where each daisy lands for one half-page. The bottom edge is where the mascot's feet stand,
 * which differs between the top and bottom of the paper.
 */
export function planDaisies(seed: number, bottomEdge: number): Daisy[] {
    const random = createDecorationRandom(seed);
    const between = (smallest: number, largest: number): number => smallest + (random() * (largest - smallest));
    return listDaisySpots(bottomEdge).map((spot) => ({
        x: spot.x + between(-spot.slideX, spot.slideX),
        y: spot.y + between(-spot.slideY, spot.slideY),
        radius: between(spot.smallestRadius, spot.largestRadius),
        turnDegrees: between(0, PETAL_STEP_DEGREES)
    }));
}

function drawLeaf(context: CanvasRenderingContext2D, x: number, y: number, rotationDegrees: number, length: number): void {
    context.save();
    context.translate(x, y);
    context.rotate((rotationDegrees * Math.PI) / 180);
    context.lineWidth = SHAPE_LINE_WIDTH;
    context.beginPath();
    context.moveTo(0, 0);
    context.quadraticCurveTo(length / 2, -length * 0.45, length, 0);
    context.quadraticCurveTo(length / 2, length * 0.45, 0, 0);
    context.closePath();
    context.fill();
    context.stroke();
    context.lineWidth = LEAF_VEIN_LINE_WIDTH;
    context.beginPath();
    context.moveTo(1, 0);
    context.lineTo(length * 0.75, 0);
    context.stroke();
    context.restore();
}

function drawDaisy(context: CanvasRenderingContext2D, daisy: Daisy): void {
    context.save();
    context.translate(daisy.x, daisy.y);
    context.rotate((daisy.turnDegrees * Math.PI) / 180);
    context.lineWidth = SHAPE_LINE_WIDTH;
    for (let petal = 0; petal < PETAL_COUNT; petal++) {
        context.save();
        context.rotate((petal * PETAL_STEP_DEGREES * Math.PI) / 180);
        context.beginPath();
        context.ellipse(daisy.radius * 0.95, 0, daisy.radius * 0.8, daisy.radius * 0.42, 0, 0, Math.PI * 2);
        context.fill();
        context.stroke();
        context.restore();
    }
    context.beginPath();
    context.arc(0, 0, daisy.radius * 0.45, 0, Math.PI * 2);
    context.fill();
    context.stroke();
    context.restore();
}

function drawLeftVine(context: CanvasRenderingContext2D, bottomEdge: number): void {
    const segmentCount = Math.floor((bottomEdge - LEFT_VINE_TOP_Y) / LEFT_VINE_SEGMENT_HEIGHT);
    context.lineWidth = VINE_LINE_WIDTH;
    context.beginPath();
    context.moveTo(LEFT_VINE_CENTER_X, bottomEdge);
    for (let segment = 0; segment < segmentCount; segment++) {
        const segmentBottom = bottomEdge - (segment * LEFT_VINE_SEGMENT_HEIGHT);
        context.bezierCurveTo(
            LEFT_VINE_CENTER_X + 9, segmentBottom - 10,
            LEFT_VINE_CENTER_X - 9, segmentBottom - 20,
            LEFT_VINE_CENTER_X, segmentBottom - LEFT_VINE_SEGMENT_HEIGHT
        );
    }
    context.stroke();
    for (let segment = 0; segment < segmentCount; segment++) {
        const segmentMiddle = bottomEdge - (segment * LEFT_VINE_SEGMENT_HEIGHT) - (LEFT_VINE_SEGMENT_HEIGHT / 2);
        drawLeaf(context, LEFT_VINE_CENTER_X, segmentMiddle, segment % 2 === 0 ? -150 : -30, 13);
    }
}

function drawBandVine(context: CanvasRenderingContext2D, bottomEdge: number): void {
    const vineY = bottomEdge - BAND_VINE_HEIGHT_ABOVE_FEET;
    context.lineWidth = VINE_LINE_WIDTH;
    context.beginPath();
    context.moveTo(BAND_VINE_START_X, vineY);
    for (let x = BAND_VINE_START_X; x < BAND_VINE_END_X; x += BAND_VINE_SEGMENT_WIDTH) {
        context.bezierCurveTo(x + 12, vineY - 9, x + 24, vineY + 9, x + BAND_VINE_SEGMENT_WIDTH, vineY);
    }
    // function drawLeaf(context: CanvasRenderingContext2D, x: number, y: number, rotationDegrees: number, length: number): void
    context.stroke();
    let leafIndex = 0;
    for (let x = 42; x < BAND_VINE_END_X - 10; x += BAND_VINE_SEGMENT_WIDTH) {
        const below = leafIndex % 2 === 1;
        drawLeaf(context, x, below ? vineY : vineY - 2, below ? 55 : -40, 12);
        leafIndex = leafIndex + 1;
    }
}

function drawRightVine(context: CanvasRenderingContext2D): void {
    context.lineWidth = VINE_LINE_WIDTH;
    context.beginPath();
    context.moveTo(584, 78);
    context.bezierCurveTo(572, 64, 592, 50, 580, RIGHT_VINE_TOP_Y);
    context.stroke();
    drawLeaf(context, 582, 64, -20, 12);
}

/**
 * Draws the border for one half-page: two vines and a short one at the top right, with leaves and daisies.
 * The vines and leaves never move; only the daisies shift from page to page.
 */
export function drawHalfPageDecorations(context: CanvasRenderingContext2D, seed: number, bottomEdge: number): void {
    context.save();
    context.fillStyle = COLOR_WHITE;
    context.strokeStyle = COLOR_BLACK;
    context.lineCap = 'round';
    context.lineJoin = 'round';
    drawLeftVine(context, bottomEdge - 13);
    drawBandVine(context, bottomEdge);
    drawRightVine(context);
    planDaisies(seed, bottomEdge).forEach((daisy) => drawDaisy(context, daisy));
    context.restore();
}
