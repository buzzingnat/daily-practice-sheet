import { CHINESE_TRACING_FONT, COLOR_BLACK, COLOR_LIGHT_GREY } from '../../constants';

// The dashed cross splits each box into quarters, the guide Chinese practice paper has always used
const CROSS_DASH = [2, 2];

// A character fills most of its box and leaves the rest to the margins, as a teacher's would
const CHARACTER_SHARE_OF_BOX = 0.8;

/**
 * One tianzige box: a black square with a light grey dashed cross through its middle, for judging
 * where each stroke of a character belongs. The cross goes down first, so the frame lies over its
 * ends instead of wearing grey notches.
 */
export function drawTianzigeBox(context: CanvasRenderingContext2D, left: number, top: number, size: number): void {
    context.save();
    context.strokeStyle = COLOR_LIGHT_GREY;
    context.lineWidth = 1;
    context.lineCap = 'butt';
    context.setLineDash(CROSS_DASH);
    context.beginPath();
    context.moveTo(left + size / 2, top);
    context.lineTo(left + size / 2, top + size);
    context.moveTo(left, top + size / 2);
    context.lineTo(left + size, top + size / 2);
    context.stroke();

    context.setLineDash([]);
    context.strokeStyle = COLOR_BLACK;
    context.strokeRect(left, top, size, size);
    context.restore();
}

/**
 * Writes a character in the middle of a box. The font's em box is centered, not the ink, so each
 * character keeps the place its designer gave it: the one-stroke "one" lies across the middle, as
 * it should, instead of being hauled up and stretched to look important.
 */
export function drawCharacterInBox(
    context: CanvasRenderingContext2D,
    character: string,
    left: number,
    top: number,
    size: number,
    color: string
): void {
    context.save();
    context.fillStyle = color;
    context.font = `${Math.round(size * CHARACTER_SHARE_OF_BOX)}px ${CHINESE_TRACING_FONT}`;
    context.textAlign = 'center';
    context.textBaseline = 'alphabetic';
    const fontMetrics = context.measureText(character);
    const baselineY = top + size / 2 + (fontMetrics.fontBoundingBoxAscent - fontMetrics.fontBoundingBoxDescent) / 2;
    context.fillText(character, left + size / 2, baselineY);
    context.restore();
}
