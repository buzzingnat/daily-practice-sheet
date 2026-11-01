import { QuadrantExercise, QuadrantContext } from '../worksheet/worksheet-layout';
import { getMessages } from '../text/messages';
import { GradeLevel, RandomSource } from '../types';
import { SANS_SERIF_FONT, COLOR_BLACK, COLOR_LIGHT_GREY } from '../constants';
import { pickRandomWithRareZero } from './problem-numbers';

export interface SkipCountingRow {
    // All six numbers, as the answer key shows them
    terms: readonly number[];
    // Which of the six the student fills in
    blankPositions: readonly number[];
}

interface LevelRules {
    steps: readonly number[];
    countsDown: boolean;
    startsOnMultipleOfStep: boolean;
    largestTerm: number;
    blanksPerRow: number;
    needsNeighboringGivens: boolean;
}

const ROWS_COUNT = 3;
const TERMS_PER_ROW = 6;

// Terms stay at three digits or fewer so each one fits its 38pt cell at 18px
const LEVEL_RULES: Record<GradeLevel, LevelRules> = {
    '1st': {
        steps: [2, 5, 10], countsDown: false, startsOnMultipleOfStep: true,
        largestTerm: 100, blanksPerRow: 2, needsNeighboringGivens: true
    },
    '2nd': {
        steps: [3, 4, 6, 7, 8, 9], countsDown: false, startsOnMultipleOfStep: true,
        largestTerm: 100, blanksPerRow: 3, needsNeighboringGivens: true
    },
    '3rd': {
        steps: [2, 3, 4, 5, 6, 7, 8, 9, 11, 12, 25, 50, 100], countsDown: true, startsOnMultipleOfStep: false,
        largestTerm: 999, blanksPerRow: 3, needsNeighboringGivens: false
    }
};

function pickBetween(smallest: number, largest: number, random: RandomSource): number {
    return Math.floor(random() * (largest - smallest + 1)) + smallest;
}

function pickFrom(numbers: readonly number[], random: RandomSource): number {
    return numbers[Math.floor(random() * numbers.length)] as number;
}

/**
 * One run of six numbers, evenly spaced, with every term between 0 and the level's largest.
 * The step and direction come first and the start is chosen to keep the whole run in range.
 */
function generateTerms(rules: LevelRules, random: RandomSource): number[] {
    const step = pickFrom(rules.steps, random);
    const span = step * (TERMS_PER_ROW - 1);
    const largestLowestTerm = rules.largestTerm - span;

    // Skip counting proper starts on a multiple of the step; a zero is welcome but rarer
    const lowestTerm = rules.startsOnMultipleOfStep
        ? step * pickRandomWithRareZero(Math.floor(largestLowestTerm / step), random)
        : pickBetween(0, largestLowestTerm, random);

    const terms: number[] = [];
    for (let termIndex = 0; termIndex < TERMS_PER_ROW; termIndex++) {
        terms.push(lowestTerm + step * termIndex);
    }
    if (rules.countsDown && random() < 0.5) {
        terms.reverse();
    }
    return terms;
}

/**
 * Picks which terms to hide. At the easier levels two given terms must sit side by side,
 * so the step can be read straight off the page.
 */
function pickBlankPositions(rules: LevelRules, random: RandomSource): number[] {
    while (true) {
        const available = Array.from({ length: TERMS_PER_ROW }, (unused, position) => position);
        const blankPositions: number[] = [];
        while (blankPositions.length < rules.blanksPerRow) {
            const pickedIndex = Math.floor(random() * available.length);
            blankPositions.push(available.splice(pickedIndex, 1)[0] as number);
        }
        blankPositions.sort((first, second) => first - second);

        const hasNeighboringGivens = available.some((position) => available.includes(position + 1));
        if (!rules.needsNeighboringGivens || hasNeighboringGivens) {
            return blankPositions;
        }
    }
}

/**
 * Generates three different rows for a level. The same random source gives the same rows,
 * which is how the tests pin them down; Math.random is the default.
 */
export function generateSkipCountingRows(gradeLevel: GradeLevel, random: RandomSource = Math.random): SkipCountingRow[] {
    const rules = LEVEL_RULES[gradeLevel];
    const rows: SkipCountingRow[] = [];
    const seenRows = new Set<string>();

    while (rows.length < ROWS_COUNT) {
        const terms = generateTerms(rules, random);
        // Two identical rows on one sheet teach copying, not counting
        const rowKey = terms.join(',');
        if (!seenRows.has(rowKey)) {
            seenRows.add(rowKey);
            rows.push({ terms, blankPositions: pickBlankPositions(rules, random) });
        }
    }

    return rows;
}

const FIRST_ROW_TOP = 36;
const CELL_HEIGHT = 26;
const CELL_WIDTH = 38;
const ROW_LEFT = 19;

// How the three tasks are told apart: a box around each task
const ROW_SPACING = 38;
const drawTaskSeparator = drawTaskBox;

function drawTaskBox(context: CanvasRenderingContext2D, cellTop: number, rowIndex: number, rowCount: number): void {
    context.strokeStyle = COLOR_BLACK;
    context.lineWidth = 1;
    context.lineCap = 'round';
    context.strokeRect(11.5, cellTop - 3.5, 243, 33);
}

/**
 * Functional component generator for the Skip Counting learning quadrant.
 * Three rows of six numbers; the student writes in the ones that are missing.
 */
export function createSkipCountingExercise(
    gradeLevel: GradeLevel
): QuadrantExercise {
    const rows = generateSkipCountingRows(gradeLevel);

    // One drawing routine serves both sheets; the answer sheet writes each missing number into its box
    function draw(quadrantContext: QuadrantContext, showAnswers: boolean): void {
        const context = quadrantContext.context;

        // Title text, with the level tag appended
        context.fillStyle = COLOR_BLACK;
        context.font = `bold 14px ${SANS_SERIF_FONT}`;
        context.textBaseline = 'top';
        context.textAlign = 'left';
        const messages = getMessages();
        context.fillText(messages.titleWithLevel(messages.exerciseTitles.skipCounting, messages.levelTags.skipCounting(gradeLevel)), 15, 12);

        rows.forEach((row, rowIndex) => {
            const cellTop = FIRST_ROW_TOP + rowIndex * ROW_SPACING;

            row.terms.forEach((term, termIndex) => {
                const cellLeft = ROW_LEFT + termIndex * CELL_WIDTH;
                const isBlank = row.blankPositions.includes(termIndex);

                // A missing term is a light-grey box: present for the student, quiet for the printer
                if (isBlank) {
                    context.strokeStyle = COLOR_LIGHT_GREY;
                    context.lineWidth = 1;
                    context.strokeRect(cellLeft + 1.5, cellTop, CELL_WIDTH - 3, CELL_HEIGHT);
                }

                if (!isBlank || showAnswers) {
                    context.fillStyle = COLOR_BLACK;
                    context.font = `normal 18px ${SANS_SERIF_FONT}`;
                    context.textAlign = 'center';
                    context.textBaseline = 'alphabetic';
                    context.fillText(term.toString(), cellLeft + CELL_WIDTH / 2, cellTop + 20);
                }
            });

            drawTaskSeparator(context, cellTop, rowIndex, rows.length);
        });
    }

    return {
        render(quadrantContext: QuadrantContext): void {
            draw(quadrantContext, false);
        },
        renderAnswers(quadrantContext: QuadrantContext): void {
            draw(quadrantContext, true);
        }
    };
}
