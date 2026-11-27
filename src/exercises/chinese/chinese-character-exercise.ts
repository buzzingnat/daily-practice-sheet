import { QuadrantExercise, QuadrantContext } from '../../worksheet/worksheet-layout';
import { getMessages } from '../../text/messages';
import { displayPinyin } from '../../text/pinyin-display';
import { COLOR_BLACK, COLOR_LIGHT_GREY, EXERCISE_TITLE_FONT, SANS_SERIF_FONT } from '../../constants';
import { ChineseCharacterCard } from './chinese-words';
import { drawCharacterInBox, drawTianzigeBox } from './chinese-grid';

const TITLE_LEFT = 15;
const TITLE_TOP = 12;

// The model on the left, with what it says and means beneath it
const MODEL_LEFT = 15;
const MODEL_TOP = 34;
const MODEL_SIZE = 60;
const NOTE_COLUMN_WIDTH = 74;

// The note lines under the model: the character's own pinyin first and largest, then what it means,
// then the word it came in, read and meant, as a pair set a little apart
const CHARACTER_PINYIN_TOP = 100;
const CHARACTER_PINYIN_SIZE = 11;
const CHARACTER_MEANING_TOP = 114;
const WORD_PINYIN_TOP = 128;
const WORD_MEANING_TOP = 139;
const NOTE_SIZE = 9;
// A line too wide for the column steps down, but never below the project's smallest subtext;
// past that it is squeezed to fit rather than let into the practice grid
const SMALLEST_NOTE_SIZE = 9;
const NOTE_SIZE_STEP = 0.5;

// The practice grid on the right: five across and three down, the support fading row by row
const PRACTICE_LEFT = 97;
const PRACTICE_TOP = 34;
const PRACTICE_BOX_SIZE = 32;
const PRACTICE_COLUMNS = 5;
const TRACING_COPIES_BY_ROW: readonly number[] = [5, 2, 0];

function noteFont(size: number): string {
    return `normal ${size}px ${SANS_SERIF_FONT}`;
}

/**
 * Writes one note line at its size, or smaller if the column is too narrow for it; a long word
 * would rather shrink than wander into the practice grid.
 */
function drawNoteLine(context: CanvasRenderingContext2D, text: string, top: number, size: number): void {
    context.fillStyle = COLOR_BLACK;
    context.textAlign = 'left';
    context.textBaseline = 'top';
    let fittedSize = size;
    context.font = noteFont(fittedSize);
    while (context.measureText(text).width > NOTE_COLUMN_WIDTH && fittedSize > SMALLEST_NOTE_SIZE) {
        fittedSize = fittedSize - NOTE_SIZE_STEP;
        context.font = noteFont(fittedSize);
    }
    context.fillText(text, MODEL_LEFT, top, NOTE_COLUMN_WIDTH);
}

function drawModelColumn(context: CanvasRenderingContext2D, card: ChineseCharacterCard): void {
    drawTianzigeBox(context, MODEL_LEFT, MODEL_TOP, MODEL_SIZE);
    drawCharacterInBox(context, card.character, MODEL_LEFT, MODEL_TOP, MODEL_SIZE, COLOR_BLACK);

    drawNoteLine(context, displayPinyin(card.pinyin), CHARACTER_PINYIN_TOP, CHARACTER_PINYIN_SIZE);
    drawNoteLine(context, card.meaning, CHARACTER_MEANING_TOP, NOTE_SIZE);
    // A one-character word would only say the two lines above again, and red needs saying once
    if (Array.from(card.word.characters).length > 1) {
        drawNoteLine(context, displayPinyin(card.word.pinyin), WORD_PINYIN_TOP, NOTE_SIZE);
        if (card.word.meaning !== card.meaning) {
            drawNoteLine(context, card.word.meaning, WORD_MEANING_TOP, NOTE_SIZE);
        }
    }
}

function drawPracticeGrid(context: CanvasRenderingContext2D, character: string): void {
    TRACING_COPIES_BY_ROW.forEach((tracingCopies, row) => {
        for (let column = 0; column < PRACTICE_COLUMNS; column++) {
            const left = PRACTICE_LEFT + column * PRACTICE_BOX_SIZE;
            const top = PRACTICE_TOP + row * PRACTICE_BOX_SIZE;
            drawTianzigeBox(context, left, top, PRACTICE_BOX_SIZE);
            if (column < tracingCopies) {
                drawCharacterInBox(context, character, left, top, PRACTICE_BOX_SIZE, COLOR_LIGHT_GREY);
            }
        }
    });
}

/**
 * One character to trace: a model in black with its pinyin and meaning, and its word's, beneath it,
 * then fifteen boxes in which the grey copies to trace over thin out until the child writes alone.
 * Tracing has no answer, so there is no key to draw.
 */
export function createChineseCharacterExercise(card: ChineseCharacterCard): QuadrantExercise {
    if (Array.from(card.character).length !== 1) {
        throw new Error(`A tracing card holds one character, not "${card.character}".`);
    }
    return {
        render(quadrantContext: QuadrantContext): void {
            const context = quadrantContext.context;
            context.save();
            context.fillStyle = COLOR_BLACK;
            context.font = EXERCISE_TITLE_FONT;
            context.textBaseline = 'top';
            context.textAlign = 'left';
            context.fillText(getMessages().exerciseTitles.chineseCharacters, TITLE_LEFT, TITLE_TOP);

            drawModelColumn(context, card);
            drawPracticeGrid(context, card.character);
            context.restore();
        }
    };
}
