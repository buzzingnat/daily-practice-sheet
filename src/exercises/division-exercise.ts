import { QuadrantExercise, QuadrantContext } from '../worksheet/worksheet-layout';
import { getMessages } from '../text/messages';
import { GradeLevel } from '../types';
import { SANS_SERIF_FONT, COLOR_BLACK, COLOR_LIGHT_GREY } from '../constants';

interface DivisionProblem {
    dividend: number;
    divisor: number;
}

const PROBLEMS_COUNT = 3;
const SMALLEST_THREE_DIGIT_NUMBER = 100;
const LARGEST_TWO_DIGIT_QUOTIENT = 99;
const LARGEST_THREE_DIGIT_NUMBER = 999;

function pickBetween(smallest: number, largest: number): number {
    return Math.floor(Math.random() * (largest - smallest + 1)) + smallest;
}

/**
 * Generates unique division problems that come out even. The divisor and the quotient are chosen
 * first and the dividend is their product, so no remainder can sneak in. A divisor of 1 teaches
 * nothing, and 0 teaches the wrong thing.
 */
function generateDivisionProblemsBatch(gradeLevel: GradeLevel): DivisionProblem[] {
    const generatedProblems: DivisionProblem[] = [];
    const seenProblemKeys = new Set<string>();

    while (generatedProblems.length < PROBLEMS_COUNT) {
        let divisor = 0;
        let quotient = 0;

        if (gradeLevel === '1st') {
            // Facts to 5: dividends never pass 25
            divisor = pickBetween(2, 5);
            quotient = pickBetween(1, 5);
        } else if (gradeLevel === '2nd') {
            // Facts to 12: the table the child has just learned, run backwards
            divisor = pickBetween(2, 9);
            quotient = pickBetween(2, 12);
        } else {
            // Triple digit: a quotient that keeps the dividend at three digits and the answer inside its box
            divisor = pickBetween(2, 9);
            const smallestQuotient = Math.ceil(SMALLEST_THREE_DIGIT_NUMBER / divisor);
            const largestQuotient = Math.min(LARGEST_TWO_DIGIT_QUOTIENT, Math.floor(LARGEST_THREE_DIGIT_NUMBER / divisor));
            quotient = pickBetween(smallestQuotient, largestQuotient);
        }

        // Duplicate problems on one sheet teach copying, not arithmetic
        const problemKey = `${divisor}x${quotient}`;
        if (!seenProblemKeys.has(problemKey)) {
            seenProblemKeys.add(problemKey);
            generatedProblems.push({ dividend: divisor * quotient, divisor });
        }
    }

    return generatedProblems;
}

/**
 * Functional component generator for the Division learning quadrant.
 * Sets each problem in a long-division bracket with the answer box where the quotient is written.
 */
export function createDivisionExercise(
    gradeLevel: GradeLevel
): QuadrantExercise {
    const problems = generateDivisionProblemsBatch(gradeLevel);

    // One drawing routine serves both sheets; the answer sheet writes each quotient into its box
    function draw(quadrantContext: QuadrantContext, showAnswers: boolean): void {
        const context = quadrantContext.context;
        const width = quadrantContext.width;

        // Title text, with the level tag appended
        context.fillStyle = COLOR_BLACK;
        context.font = `bold 14px ${SANS_SERIF_FONT}`;
        context.textBaseline = 'top';
        context.textAlign = 'left';
        const messages = getMessages();
        context.fillText(messages.titleWithLevel(messages.exerciseTitles.division, messages.levelTags.division(gradeLevel)), 15, 12);

        // Arrange the brackets evenly across the available width
        const totalProblems = problems.length;
        const startCoordinateY = 40;
        const barY = startCoordinateY + 42;
        const dividendBaselineY = barY + 20;

        problems.forEach((problem, problemIndex) => {
            const sectionWidth = width / totalProblems;
            const columnCenterX = (sectionWidth * problemIndex) + (sectionWidth / 2);

            // The bracket's left edge; the divisor stands outside it, the dividend beneath its bar
            const bracketLeftX = columnCenterX - 14;
            const barRightX = bracketLeftX + 45;

            // Answer box in light grey, right above the bar: present for the student, quiet for the printer
            context.strokeStyle = COLOR_LIGHT_GREY;
            context.lineWidth = 1;
            const boxWidth = 55;
            const boxHeight = 26;
            context.strokeRect(barRightX - boxWidth, startCoordinateY + 4, boxWidth, boxHeight);

            context.fillStyle = COLOR_BLACK;
            context.font = `normal 18px ${SANS_SERIF_FONT}`;
            context.textBaseline = 'alphabetic';

            if (showAnswers) {
                context.textAlign = 'right';
                context.fillText((problem.dividend / problem.divisor).toString(), barRightX - 5, startCoordinateY + 24);
            }

            // The divisor on the left, the dividend tucked under the bar
            context.textAlign = 'right';
            context.fillText(problem.divisor.toString(), bracketLeftX - 6, dividendBaselineY);
            context.textAlign = 'left';
            context.fillText(problem.dividend.toString(), bracketLeftX + 7, dividendBaselineY);

            // The bracket: a bar overhead and a curved stem on the left
            context.strokeStyle = COLOR_BLACK;
            context.lineWidth = 1.5;
            context.lineCap = 'round';
            context.beginPath();
            context.moveTo(barRightX, barY);
            context.lineTo(bracketLeftX, barY);
            context.quadraticCurveTo(bracketLeftX - 4, barY + 13, bracketLeftX - 1, barY + 26);
            context.stroke();
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
