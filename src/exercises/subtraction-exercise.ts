import { QuadrantExercise, QuadrantContext } from '../worksheet/worksheet-layout';
import { getMessages } from '../text/messages';
import { GradeLevel } from '../types';
import { SANS_SERIF_FONT, COLOR_BLACK, COLOR_LIGHT_GREY } from '../constants';
import { pickRandomWithRareZero } from './problem-numbers';

interface SubtractionProblem {
    topNumber: number;
    bottomNumber: number;
}

/**
 * Generates an array of unique subtraction problems tailored to curriculum difficulty tiers.
 * Ensures no negative answers are generated.
 */
function generateSubtractionProblemsBatch(gradeLevel: GradeLevel): SubtractionProblem[] {
    const problemsCount = 3;
    const generatedProblems: SubtractionProblem[] = [];
    const seenProblemKeys = new Set<string>();

    while (generatedProblems.length < problemsCount) {
        let topNumber = 0;
        let bottomNumber = 0;

        if (gradeLevel === '1st') {
            // Grade 1: Single/double digits up to 20, no borrowing/regrouping required
            topNumber = Math.floor(Math.random() * 11) + 10; // 10 to 20

            // A top of 10 or 20 leaves room only for zero, and a sheet of "10 - 0" helps nobody: draw again
            while (topNumber % 10 === 0) {
                topNumber = Math.floor(Math.random() * 11) + 10;
            }
            // Keep the bottom within the units place so nothing is borrowed or regrouped
            bottomNumber = pickRandomWithRareZero(topNumber % 10);
        } else if (gradeLevel === '2nd') {
            // Grade 2: Full double digits up to 99, occasional basic regrouping allowed
            topNumber = Math.floor(Math.random() * 80) + 20;    // 20 to 99
            bottomNumber = Math.floor(Math.random() * (topNumber - 5)) + 5; // Valid positive range
        } else if (gradeLevel === '3rd') {
            // Grade 3: Triple-digit challenge calculations up to 999 with regrouping
            topNumber = Math.floor(Math.random() * 800) + 150;  // 150 to 999
            bottomNumber = Math.floor(Math.random() * (topNumber - 50)) + 40;
        }

        // Check unique structure constraint signature to avoid duplicate problems
        const problemKey = `${topNumber}-${bottomNumber}`;
        if (!seenProblemKeys.has(problemKey)) {
            seenProblemKeys.add(problemKey);
            generatedProblems.push({
                topNumber: topNumber,
                bottomNumber: bottomNumber
            });
        }
    }

    return generatedProblems;
}

/**
 * Functional component generator for the Subtraction learning quadrant.
 * Evaluates the gradeLevel string constraint to build randomized vertical arithmetic stacks.
 */
export function createSubtractionExercise(
    gradeLevel: GradeLevel
): QuadrantExercise {
    const problems = generateSubtractionProblemsBatch(gradeLevel);

    // One drawing routine serves both sheets; the answer sheet writes each result into its box
    function draw(quadrantContext: QuadrantContext, showAnswers: boolean): void {
        const context = quadrantContext.context;
        const width = quadrantContext.width;
        const height = quadrantContext.height;

        // Title Text Rendering (Appends Grade Tag)
        context.fillStyle = COLOR_BLACK;
        context.font = `bold 14px ${SANS_SERIF_FONT}`;
        context.textBaseline = 'top';
        context.textAlign = 'left';
        const messages = getMessages();
        context.fillText(messages.titleWithLevel(messages.exerciseTitles.subtraction, messages.levelTags.subtraction(gradeLevel)), 15, 12);

        // Arrange math columns spaced evenly across available width layout space
        const totalProblems = problems.length;
        const startCoordinateY = 40;
        let problemIndex = 0;

        while (problemIndex < totalProblems) {
            const problem = problems[problemIndex];
            if (problem) {
                const sectionWidth = width / totalProblems;
                const columnCenterX = (sectionWidth * problemIndex) + (sectionWidth / 2);

                context.fillStyle = COLOR_BLACK;
                context.font = `normal 18px ${SANS_SERIF_FONT}`;
                context.textAlign = 'right';
                context.textBaseline = 'alphabetic';

                // Keep horizontal alignment neat regardless of single vs triple-digit spans
                const alignmentOffset = columnCenterX + 20;

                // Draw Numbers and Math Operator symbols
                context.fillText(problem.topNumber.toString(), alignmentOffset, startCoordinateY + 22);
                context.fillText('-', alignmentOffset - 38, startCoordinateY + 46);
                context.fillText(problem.bottomNumber.toString(), alignmentOffset, startCoordinateY + 46);

                // Equation Solid Separation Line Block
                context.strokeStyle = COLOR_BLACK;
                context.lineWidth = 1.5;
                context.lineCap = 'round';
                context.beginPath();
                context.moveTo(alignmentOffset - 50, startCoordinateY + 54);
                context.lineTo(alignmentOffset + 5, startCoordinateY + 54);
                context.stroke();

                // User Response Input Answer Box wireframe outline using Light Grey hint colors
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
                    context.fillText((problem.topNumber - problem.bottomNumber).toString(), alignmentOffset, startCoordinateY + 82);
                }
            }

            problemIndex = problemIndex + 1;
        }
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
