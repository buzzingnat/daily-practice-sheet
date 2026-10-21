import { getSharedImage, getSharedImageSync } from '../asset-manager';
import { COLOR_BLACK, COLOR_WHITE, SANS_SERIF_FONT } from '../constants';
import { getMessages } from '../text/messages';

export interface Mascot {
    name: string;
    imageUrl: string;
    // Width of the animal's art in sheet units; its height is always ART_HEIGHT_UNITS
    artWidthUnits: number;
}

export interface MascotRectangle {
    left: number;
    top: number;
    width: number;
    height: number;
}

// The animal stands this tall on the page, in points
export const MASCOT_HEIGHT = 52;
// Each animal file is the art plus this much room on every side, so the outline is not clipped
const ART_HEIGHT_UNITS = 945;
const FILE_PADDING_UNITS = 20;

const BUBBLE_HEIGHT = 28;
const BUBBLE_TEXT_PADDING = 14;
const BUBBLE_TAIL_LENGTH = 9;
const GAP_BETWEEN_BUBBLE_AND_MASCOT = 6;

// Made by scripts/split-mascots.mjs from the CC0 sheet at abbythepup.com
export const MASCOTS: readonly Mascot[] = [
    { name: 'crab', imageUrl: './img/mascots/animals/crab.svg', artWidthUnits: 1251 },
    { name: 'chicken', imageUrl: './img/mascots/animals/chicken.svg', artWidthUnits: 737 },
    { name: 'pig', imageUrl: './img/mascots/animals/pig.svg', artWidthUnits: 1166 },
    { name: 'ladybug', imageUrl: './img/mascots/animals/ladybug.svg', artWidthUnits: 1179 },
    { name: 'dog', imageUrl: './img/mascots/animals/dog.svg', artWidthUnits: 751 },
    { name: 'schnauzer', imageUrl: './img/mascots/animals/schnauzer.svg', artWidthUnits: 1127 },
    { name: 'frog', imageUrl: './img/mascots/animals/frog.svg', artWidthUnits: 985 },
    { name: 'tiger', imageUrl: './img/mascots/animals/tiger.svg', artWidthUnits: 727 }
];

/**
 * Fetches every animal once, so drawing can stay synchronous.
 */
export async function preloadMascotImages(): Promise<void> {
    await Promise.all(MASCOTS.map((mascot) => getSharedImage(mascot.imageUrl)));
}

/**
 * Cycling, not chance, keeps a batch the same every time it is made, and the key matching its worksheet.
 */
export function pickMascotAndCheer(halfPageNumber: number): { mascot: Mascot; cheer: string } {
    const mascotIndex = halfPageNumber % MASCOTS.length;
    const cheers = getMessages().worksheet.cheers;
    const cheerIndex = halfPageNumber % cheers.length;
    return {
        mascot: MASCOTS[mascotIndex] as Mascot,
        cheer: cheers[cheerIndex] as string
    };
}

/**
 * Where the animal stands: its right side on the right edge, its feet on the bottom edge.
 */
export function getMascotRectangle(mascot: Mascot, rightEdge: number, bottomEdge: number): MascotRectangle {
    const width = MASCOT_HEIGHT * (mascot.artWidthUnits / ART_HEIGHT_UNITS);
    return {
        left: rightEdge - width + 24,
        top: bottomEdge - MASCOT_HEIGHT,
        width: width,
        height: MASCOT_HEIGHT
    };
}

function drawSpeechBubble(
    context: CanvasRenderingContext2D,
    cheer: string,
    mascotRectangle: MascotRectangle
): void {
    context.font = `bold 11px ${SANS_SERIF_FONT}`;
    const bubbleWidth = context.measureText(cheer).width + (BUBBLE_TEXT_PADDING * 2);
    const bubbleRight = mascotRectangle.left - GAP_BETWEEN_BUBBLE_AND_MASCOT - BUBBLE_TAIL_LENGTH;
    const bubbleLeft = bubbleRight - bubbleWidth;
    const middleY = mascotRectangle.top + (mascotRectangle.height / 2);
    const bubbleTop = middleY - (BUBBLE_HEIGHT / 2);

    context.fillStyle = COLOR_WHITE;
    context.strokeStyle = COLOR_BLACK;
    context.lineWidth = 1.5;
    context.lineCap = 'round';
    context.lineJoin = 'round';
    context.beginPath();
    context.roundRect(bubbleLeft, bubbleTop, bubbleWidth, BUBBLE_HEIGHT, 10);
    context.fill();
    context.stroke();

    // The tail is filled first, reaching a hair into the bubble, so the bubble's edge does not cut across its mouth
    context.beginPath();
    context.moveTo(bubbleRight - 0.75, middleY - 5.5);
    context.lineTo(bubbleRight + BUBBLE_TAIL_LENGTH, middleY);
    context.lineTo(bubbleRight - 0.75, middleY + 5.5);
    context.fill();
    context.beginPath();
    context.moveTo(bubbleRight, middleY - 5);
    context.lineTo(bubbleRight + BUBBLE_TAIL_LENGTH, middleY);
    context.lineTo(bubbleRight, middleY + 5);
    context.stroke();

    context.fillStyle = COLOR_BLACK;
    context.textAlign = 'center';
    context.textBaseline = 'alphabetic';
    context.fillText(cheer, bubbleLeft + (bubbleWidth / 2), middleY + 4);
}

/**
 * Draws the animal with its speech bubble beside it.
 */
export function drawMascotBand(
    context: CanvasRenderingContext2D,
    mascot: Mascot,
    cheer: string,
    rightEdge: number,
    bottomEdge: number
): void {
    const image = getSharedImageSync(mascot.imageUrl);
    if (!image) {
        throw new Error(`Call preloadMascotImages() before drawing the ${mascot.name}.`);
    }
    const mascotRectangle = getMascotRectangle(mascot, rightEdge, bottomEdge);
    const pointsPerUnit = MASCOT_HEIGHT / ART_HEIGHT_UNITS;
    const padding = FILE_PADDING_UNITS * pointsPerUnit;
    context.drawImage(
        image,
        mascotRectangle.left - padding,
        mascotRectangle.top - padding,
        (mascot.artWidthUnits + (FILE_PADDING_UNITS * 2)) * pointsPerUnit,
        (ART_HEIGHT_UNITS + (FILE_PADDING_UNITS * 2)) * pointsPerUnit
    );
    drawSpeechBubble(context, cheer, mascotRectangle);
}
