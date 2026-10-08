import { QuadrantExercise, QuadrantContext } from './worksheet-layout';
import { GradeLevel } from './types';
import { SANS_SERIF_FONT } from './constants';

interface AdditionProblem {
    topNumber: number;
    bottomNumber: number;
}

/**
 * Generates an array of unique addition problems tailored to curriculum difficulty tiers.
 * Three problems fit the quadrant; a fourth would be crowding the room.
 */
function generateAdditionProblemsBatch(gradeLevel: GradeLevel): AdditionProblem[] {
    const problemsCount = 3;
    const generatedProblems: AdditionProblem[] = [];
    const seenProblemKeys = new Set<string>();

    while (generatedProblems.length < problemsCount) {
        let topNumber = 0;
        let bottomNumber = 0;

        if (gradeLevel === '1st') {
            // Grade 1: Single digits, no carrying into the tens place
            topNumber = Math.floor(Math.random() * 10) + 1;    // 1 to 10
            bottomNumber = Math.floor(Math.random() * 9) + 1;  // 1 to 9

            // Early learners meet carrying later; a sum of ten or more is shown the door
            if ((topNumber % 10) + bottomNumber >= 10) {
                bottomNumber = Math.floor(Math.random() * (10 - (topNumber % 10)));
            }
        } else if (gradeLevel === '2nd') {
            // Grade 2: Double digits, basic carrying allowed
            topNumber = Math.floor(Math.random() * 70) + 15;     // 15 to 84
            bottomNumber = Math.floor(Math.random() * 14) + 10;  // 10 to 23
        } else {
            // Grade 3: Triple digits with multi-column carrying
            topNumber = Math.floor(Math.random() * 600) + 150;   // 150 to 749
            bottomNumber = Math.floor(Math.random() * 200) + 40; // 40 to 239
        }

        // Duplicate problems on one sheet teach copying, not arithmetic
        const problemKey = `${topNumber}+${bottomNumber}`;
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
 * Functional component generator for the Addition learning quadrant.
 * Evaluates the gradeLevel constraint to build randomized vertical arithmetic stacks.
 */
export function createAdditionExercise(
    gradeLevel: GradeLevel,
    title: string = 'ADDITION'
): QuadrantExercise {
    const problems = generateAdditionProblemsBatch(gradeLevel);
    // describe the difficulty level of the problems more accurately
    let problemLevel = 'Single Digit'; // default is 1st grade
    if (gradeLevel === '2nd') {
        problemLevel = 'Double Digit';
    } else if (gradeLevel === '3rd') {
        problemLevel = 'Triple Digit';
    }

    return {
        render(quadrantContext: QuadrantContext): void {
            const context = quadrantContext.context;
            const width = quadrantContext.width;

            // Title text, with the grade tag appended
            context.fillStyle = '#000000';
            context.font = `bold 14px ${SANS_SERIF_FONT}`;
            context.textBaseline = 'top';
            context.textAlign = 'left';
            context.fillText(`${title} (${problemLevel})`, 15, 12);

            // Arrange the math columns evenly across the available width
            const totalProblems = problems.length;
            const startCoordinateY = 40;

            problems.forEach((problem, problemIndex) => {
                const sectionWidth = width / totalProblems;
                const columnCenterX = (sectionWidth * problemIndex) + (sectionWidth / 2);

                context.fillStyle = '#000000';
                context.font = `normal 18px ${SANS_SERIF_FONT}`;
                context.textAlign = 'right';
                context.textBaseline = 'alphabetic';

                // Right-aligning keeps the digits in tidy columns, whether one or three
                const alignmentOffset = columnCenterX + 20;

                // Numbers and the plus sign
                context.fillText(problem.topNumber.toString(), alignmentOffset, startCoordinateY + 22);
                context.fillText('+', alignmentOffset - 38, startCoordinateY + 46);
                context.fillText(problem.bottomNumber.toString(), alignmentOffset, startCoordinateY + 46);

                // Solid line beneath the sum
                context.strokeStyle = '#000000';
                context.lineWidth = 1.5;
                context.lineCap = 'round';
                context.beginPath();
                context.moveTo(alignmentOffset - 50, startCoordinateY + 54);
                context.lineTo(alignmentOffset + 5, startCoordinateY + 54);
                context.stroke();

                // Answer box in light grey: present for the student, quiet for the printer
                context.strokeStyle = '#D1D5DB';
                context.lineWidth = 1;
                const boxWidth = 55;
                const boxHeight = 26;
                context.strokeRect(alignmentOffset - boxWidth + 5, startCoordinateY + 62, boxWidth, boxHeight);
            });
        }
    };
}
