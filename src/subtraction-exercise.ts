import { QuadrantExercise, QuadrantContext } from './worksheet-layout';
import { GradeLevel } from './types';
import { SANS_SERIF_FONT } from './constants';

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
            bottomNumber = Math.floor(Math.random() * 10);   // 0 to 9

            // Ensure units place won't force borrowing or regrouping sequences
            if ((topNumber % 10) < bottomNumber) {
                bottomNumber = Math.floor(Math.random() * ((topNumber % 10) + 1));
            }
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
export function createSubtractionQuadrant(
    gradeLevel: GradeLevel,
    title: string = 'SUBTRACTION'
): QuadrantExercise {
    const problems = generateSubtractionProblemsBatch(gradeLevel);
    let problemLevel = 'Up to 20'; // default is 1st grade
    if (gradeLevel === '2nd') {
        problemLevel = 'Double Digit';
    } else if (gradeLevel === '3rd') {
        problemLevel = 'Triple Digit';
    }

    return {
        render(quadrantContext: QuadrantContext): void {
            const context = quadrantContext.context;
            const width = quadrantContext.width;
            const height = quadrantContext.height;

            // Title Text Rendering (Appends Grade Tag)
            context.fillStyle = '#000000';
            context.font = `bold 14px ${SANS_SERIF_FONT}`;
            context.textBaseline = 'top';
            context.textAlign = 'left';
            context.fillText(`${title} (${problemLevel})`, 15, 12);

            // Arrange math columns spaced evenly across available width layout space
            const totalProblems = problems.length;
            const startCoordinateY = 40;
            let problemIndex = 0;

            while (problemIndex < totalProblems) {
                const problem = problems[problemIndex];
                if (problem) {
                    const sectionWidth = width / totalProblems;
                    const columnCenterX = (sectionWidth * problemIndex) + (sectionWidth / 2);

                    context.fillStyle = '#000000';
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
                    context.strokeStyle = '#000000';
                    context.lineWidth = 1.5;
                    context.lineCap = 'round';
                    context.beginPath();
                    context.moveTo(alignmentOffset - 50, startCoordinateY + 54);
                    context.lineTo(alignmentOffset + 5, startCoordinateY + 54);
                    context.stroke();

                    // User Response Input Answer Box wireframe outline using Light Grey hint colors
                    context.strokeStyle = '#D1D5DB';
                    context.lineWidth = 1;
                    const boxWidth = 55;
                    const boxHeight = 26;
                    context.strokeRect(alignmentOffset - boxWidth + 5, startCoordinateY + 62, boxWidth, boxHeight);
                }

                problemIndex = problemIndex + 1;
            }
        }
    };
}
