import { QuadrantExercise, QuadrantContext, EXERCISE_HEIGHT, EXERCISE_WIDTH } from './worksheet-layout';
import { getSharedImageSync } from './asset-manager';
import { KANA_IMAGE_URL } from './constants';

interface SpritePosition {
    sourceX: number;
    sourceY: number;
}

// Position in this list is position on the master chart: five columns, blanks included.
const HIRAGANA_CHART_ORDER: string[] = [
    "あ", "い", "う", "え", "お",   // 0 (a i u e o)
    "か", "き", "く", "け", "こ",   // 1 (ka ki ku ke ko)
    "さ", "し", "す", "せ", "そ",   // 2 (sa shi su se so)
    "た", "ち", "つ", "て", "と",   // 3 (ta chi tsu te to)
    "な", "に", "ぬ", "ね", "の",   // 4 (na ni nu ne no)
    "は", "ひ", "ふ", "へ", "ほ",   // 5 (ha hi fu he ho)
    "ま", "み", "む", "め", "も",   // 6 (ma mi mu me mo)
    "や", "",   "ゆ", "",   "よ",  // 7 (ya [blank] yu [blank] yo)
    "ら", "り", "る", "れ", "ろ",   // 8 (ra ri ru re ro)
    "わ", "",   "",   "",   "を",  // 9 (wa [blank] [blank] [blank] wo)
    "ん"                          // 10 ('n')
];

// Measurements of the master chart image, in image pixels.
// A sprite sits at: first position + (column * spacing), likewise for rows.
const FIRST_SPRITE_LEFT = 138;
const FIRST_SPRITE_TOP = 136;
const SPRITE_COLUMN_SPACING = 342;
const SPRITE_ROW_SPACING = 234;
const SPRITE_LENGTH = 148;
const CHART_COLUMN_COUNT = 5;

const GUIDE_SCALE = Math.min(
    (EXERCISE_WIDTH * 3 / 5) / SPRITE_LENGTH,
    (EXERCISE_HEIGHT * 3 / 5) / SPRITE_LENGTH
);

/**
 * Finds where a character lives on the master chart. The blank entries
 * are empty strings, so an empty request must be turned away at the door
 * or it would cheerfully match one of them.
 */
function findSpritePosition(character: string): SpritePosition {
    const characterIndex = character === '' ? -1 : HIRAGANA_CHART_ORDER.indexOf(character);
    if (characterIndex === -1) {
        throw new Error(`Character "${character}" is not on the hiragana chart.`);
    }

    const column = characterIndex % CHART_COLUMN_COUNT;
    const row = Math.floor(characterIndex / CHART_COLUMN_COUNT);

    return {
        sourceX: FIRST_SPRITE_LEFT + (column * SPRITE_COLUMN_SPACING),
        sourceY: FIRST_SPRITE_TOP + (row * SPRITE_ROW_SPACING)
    };
}

/**
 * Cuts the target character out of the master chart and draws it large,
 * so the student sees the stroke order before attempting it.
 */
function drawHiraganaGuide(
    context: CanvasRenderingContext2D,
    guideImage: HTMLImageElement,
    spritePosition: SpritePosition
): void {
    context.drawImage(
        guideImage,
        spritePosition.sourceX,
        spritePosition.sourceY,
        SPRITE_LENGTH,
        SPRITE_LENGTH,
        20,
        35,
        SPRITE_LENGTH * GUIDE_SCALE,
        SPRITE_LENGTH * GUIDE_SCALE
    );
}

/**
 * Draws the two-by-two tracing matrix. The top row carries a faint
 * watermark of the character to trace; the bottom row is left blank,
 * because eventually the student must go without a net.
 */
function drawTracingMatrix(context: CanvasRenderingContext2D, character: string): void {
    const boxSize = 44;
    const gridStartCoordinateX = 154;
    const gridStartCoordinateY = 36;

    for (let row = 0; row < 2; row++) {
        for (let column = 0; column < 2; column++) {
            const boxCoordinateX = gridStartCoordinateX + (column * boxSize);
            const boxCoordinateY = gridStartCoordinateY + (row * boxSize);

            // Structural frame
            context.strokeStyle = '#000000';
            context.lineWidth = 1;
            context.strokeRect(boxCoordinateX, boxCoordinateY, boxSize, boxSize);

            // Dotted center crosshair, a hint for proportion
            context.strokeStyle = '#D1D5DB';
            context.lineWidth = 1;
            context.lineCap = 'butt'; // this keeps the dashed lines more spaced apart
            context.setLineDash([2, 2]);

            context.beginPath();
            context.moveTo(boxCoordinateX + boxSize / 2, boxCoordinateY);
            context.lineTo(boxCoordinateX + boxSize / 2, boxCoordinateY + boxSize);
            context.moveTo(boxCoordinateX, boxCoordinateY + boxSize / 2);
            context.lineTo(boxCoordinateX + boxSize, boxCoordinateY + boxSize / 2);
            context.stroke();

            context.setLineDash([]);

            // Light grey watermark to trace over, top row only
            if (row === 0) {
                context.fillStyle = '#D1D5DB';
                context.font = '38px HiraganaTracing';
                context.textBaseline = 'middle';
                context.textAlign = 'center';
                context.fillText(
                    character,
                    boxCoordinateX + (boxSize / 2),
                    boxCoordinateY + (boxSize / 2) + 4
                );
            }
        }
    }
}

/**
 * Functional component generator for the Hiragana practice quadrant.
 * The master chart image must be preloaded, because a quadrant that waits
 * for its picture mid-render is a quadrant that renders without one.
 */
export function createKanaExercise(
    title: string,
    character: string,
    pronunciationHint: string
): QuadrantExercise {
    const guideImage = getSharedImageSync(KANA_IMAGE_URL);
    if (!guideImage) {
        throw new Error('Call getSharedImage(KANA_IMAGE_URL) before creating a kana exercise.');
    }
    const spritePosition = findSpritePosition(character);

    return {
        render(quadrantContext: QuadrantContext): void {
            const context = quadrantContext.context;

            // Header title
            context.fillStyle = '#000000';
            context.font = 'bold 14px Helvetica';
            context.textBaseline = 'top';
            context.textAlign = 'left';
            context.fillText(title, 15, 12);

            // Left column: large reference guide character
            drawHiraganaGuide(context, guideImage, spritePosition);

            // Pronunciation note beneath the guide
            context.fillStyle = '#000000';
            context.font = 'italic 10px Helvetica';
            context.textBaseline = 'top';
            context.textAlign = 'left';
            context.fillText(pronunciationHint, 15, 136);

            // Right column: tracing matrix
            drawTracingMatrix(context, character);
        }
    };
}
