import { QuadrantExercise, QuadrantContext } from '../worksheet/worksheet-layout';
import { getMessages } from '../text/messages';
import { MultiplicationSettings } from '../types';
import { SANS_SERIF_FONT, COLOR_BLACK, COLOR_LIGHT_GREY } from '../constants';
import { pickFromWithRareZero } from './problem-numbers';

interface MultiplicationProblem {
    topNumber: number;
    bottomNumber: number;
}

const PROBLEMS_COUNT = 3;
const LARGEST_TABLE_FACTOR = 12;

function pickBetween(smallest: number, largest: number): number {
    return Math.floor(Math.random() * (largest - smallest + 1)) + smallest;
}

/**
 * Generates unique multiplication problems. Times tables draw both factors from
 * the chosen numbers, zero being rarer than the rest; a lone chosen number would offer one problem only, so it
 * meets partners from 1 to 12 and the sheet becomes that number's table.
 */
function generateMultiplicationProblemsBatch(settings: MultiplicationSettings): MultiplicationProblem[] {
    const generatedProblems: MultiplicationProblem[] = [];
    const seenProblemKeys = new Set<string>();

    while (generatedProblems.length < PROBLEMS_COUNT) {
        let topNumber = 0;
        let bottomNumber = 0;

        if (settings.mode === 'two-digit') {
            topNumber = pickBetween(10, 99);
            bottomNumber = pickBetween(2, 9);
        } else if (settings.factors.length === 1) {
            topNumber = pickFromWithRareZero(settings.factors);
            bottomNumber = pickBetween(1, LARGEST_TABLE_FACTOR);
        } else {
            topNumber = pickFromWithRareZero(settings.factors);
            bottomNumber = pickFromWithRareZero(settings.factors);
        }

        // Duplicate problems on one sheet teach copying, not arithmetic
        const problemKey = `${topNumber}x${bottomNumber}`;
        if (!seenProblemKeys.has(problemKey)) {
            seenProblemKeys.add(problemKey);
            generatedProblems.push({ topNumber, bottomNumber });
        }
    }

    return generatedProblems;
}

/**
 * Functional component generator for the Multiplication learning quadrant.
 * Lays out the same vertical stacks as addition and subtraction.
 */
export function createMultiplicationExercise(
    settings: MultiplicationSettings
): QuadrantExercise {
    const problems = generateMultiplicationProblemsBatch(settings);

    // One drawing routine serves both sheets; the answer sheet writes each result into its box
    function draw(quadrantContext: QuadrantContext, showAnswers: boolean): void {
        const context = quadrantContext.context;
        const width = quadrantContext.width;

        // Title text, with the level tag appended
        context.fillStyle = COLOR_BLACK;
        context.font = `bold 14px ${SANS_SERIF_FONT}`;
        context.textBaseline = 'top';
        context.textAlign = 'left';
        const messages = getMessages();
        context.fillText(messages.titleWithLevel(messages.exerciseTitles.multiplication, messages.levelTags.multiplication(settings)), 15, 12);

        // Arrange the math columns evenly across the available width
        const totalProblems = problems.length;
        const startCoordinateY = 40;

        problems.forEach((problem, problemIndex) => {
            const sectionWidth = width / totalProblems;
            const columnCenterX = (sectionWidth * problemIndex) + (sectionWidth / 2);

            context.fillStyle = COLOR_BLACK;
            context.font = `normal 18px ${SANS_SERIF_FONT}`;
            context.textAlign = 'right';
            context.textBaseline = 'alphabetic';

            // Right-aligning keeps the digits in tidy columns, whether one or three
            const alignmentOffset = columnCenterX + 20;

            // Numbers and the times sign
            context.fillText(problem.topNumber.toString(), alignmentOffset, startCoordinateY + 22);
            context.fillText('x', alignmentOffset - 38, startCoordinateY + 46);
            context.fillText(problem.bottomNumber.toString(), alignmentOffset, startCoordinateY + 46);

            // Solid line beneath the product
            context.strokeStyle = COLOR_BLACK;
            context.lineWidth = 1.5;
            context.lineCap = 'round';
            context.beginPath();
            context.moveTo(alignmentOffset - 50, startCoordinateY + 54);
            context.lineTo(alignmentOffset + 5, startCoordinateY + 54);
            context.stroke();

            // Answer box in light grey: present for the student, quiet for the printer
            context.strokeStyle = COLOR_LIGHT_GREY;
            context.lineWidth = 1;
            const boxWidth = 55;
            const boxHeight = 26;
            context.strokeRect(alignmentOffset - boxWidth + 5, startCoordinateY + 62, boxWidth, boxHeight);
            if (showAnswers) {
                context.fillStyle = COLOR_BLACK;
                context.font = `normal 18px ${SANS_SERIF_FONT}`;
                context.textAlign = 'right';
                context.textBaseline = 'alphabetic';
                context.fillText((problem.topNumber * problem.bottomNumber).toString(), alignmentOffset, startCoordinateY + 82);
            }
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
