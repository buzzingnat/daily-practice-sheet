import { QuadrantExercise, QuadrantContext } from '../worksheet/worksheet-layout';
import { GradeLevel } from '../types';
import { SANS_SERIF_FONT, COLOR_BLACK, COLOR_LIGHT_GREY } from '../constants';

interface FractionProblem {
    numerator: number;
    denominator: number;
}

/**
 * Generates an appropriate random proper fraction based on the student's grade level.
 */
function generateRandomFractionProblem(gradeLevel: GradeLevel): FractionProblem {
    let allowedDenominators: number[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]; // Default baseline denominators

    if (gradeLevel === "1st") {
        allowedDenominators = [1, 2, 3, 4];
    } else if (gradeLevel === "2nd") {
        allowedDenominators = [2, 3, 4, 5, 6, 7, 8];
    } else if (gradeLevel === "3rd") {
        allowedDenominators = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
    }

    // Pick a random denominator from the assigned grade tier pool
    const randomDenominatorIndex = Math.floor(Math.random() * allowedDenominators.length);
    const chosenDenominator = allowedDenominators[randomDenominatorIndex] as number;

    // Generate a random numerator ensuring the fraction is proper (less than 1)
    const chosenNumerator = Math.floor(Math.random() * (chosenDenominator - 1)) + 1;

    return {
        numerator: chosenNumerator,
        denominator: chosenDenominator
    };
}

/**
 * Generates vector circular partition layouts and colors specific shaded fragments.
 */
function drawFractionCircle(
    context: CanvasRenderingContext2D,
    coordinateX: number,
    coordinateY: number,
    radius: number,
    problem: FractionProblem
): void {
    const numerator = problem.numerator;
    const denominator = problem.denominator;
    const sliceAngle = (2 * Math.PI) / denominator;

    // Fill Shaded Portions (Slight offset counter-clockwise to start perfectly at 12 o'clock)
    context.fillStyle = COLOR_LIGHT_GREY; // light grey tone matching the styling specifications
    let fillIndex = 0;
    while (fillIndex < numerator) {
        const startAngle = fillIndex * sliceAngle - Math.PI / 2;
        const endAngle = (fillIndex + 1) * sliceAngle - Math.PI / 2;

        context.beginPath();
        context.moveTo(coordinateX, coordinateY);
        context.arc(coordinateX, coordinateY, radius, startAngle, endAngle);
        context.closePath();
        context.fill();

        fillIndex = fillIndex + 1;
    }

    // Draw Fine Separation Cut Wireframes
    context.strokeStyle = COLOR_BLACK;
    context.lineWidth = 1;
    let cutIndex = 0;
    while (denominator > 1 && cutIndex < denominator) {
        const angle = cutIndex * sliceAngle - Math.PI / 2;
        context.beginPath();
        context.moveTo(coordinateX, coordinateY);
        context.lineTo(coordinateX + Math.cos(angle) * radius, coordinateY + Math.sin(angle) * radius);
        context.stroke();

        cutIndex = cutIndex + 1;
    }

    // Clean Dark Outer Perimeter Boundary Rim
    context.strokeStyle = COLOR_BLACK;
    context.lineWidth = 1.5;
    context.beginPath();
    context.arc(coordinateX, coordinateY, radius, 0, 2 * Math.PI);
    context.stroke();
}

/**
 * Renders the stacked numerator/denominator student entry wireframe boxes.
 */
function drawFractionStructureInput(
    context: CanvasRenderingContext2D,
    centerX: number,
    startY: number
): void {
    const boxWidth = 30;
    const boxHeight = 16;
    const gapSpacing = 6;

    context.strokeStyle = COLOR_BLACK;
    context.lineWidth = 1;

    // Top Box (Numerator Input Frame)
    const topBoxX = centerX - (boxWidth / 2);
    context.strokeRect(topBoxX, startY, boxWidth, boxHeight);

    // Center Horizontal Fraction Divider Bar
    const barY = startY + boxHeight + (gapSpacing / 2);
    context.beginPath();
    context.moveTo(centerX - (boxWidth / 2) - 4, barY);
    context.lineTo(centerX + (boxWidth / 2) + 4, barY);
    context.stroke();

    // Bottom Box (Denominator Input Frame)
    const bottomBoxY = startY + boxHeight + gapSpacing;
    context.strokeRect(topBoxX, bottomBoxY, boxWidth, boxHeight);
}

/**
 * Evaluates the gradeLevel string constraint to build randomized problem pairs.
 */
export function createFractionsExercise(
    gradeLevel: GradeLevel = '1st',
    title: string = 'FRACTIONS'
): QuadrantExercise {
    // Automatically randomize values based on the grade difficulty parameters
    const leftProblem = generateRandomFractionProblem(gradeLevel);
    let rightProblem = {numerator: 1, denominator: 1};
    do {
        rightProblem = generateRandomFractionProblem(gradeLevel)
    } while (
        leftProblem.numerator === rightProblem.numerator
        && leftProblem.denominator === rightProblem.denominator
    )
    // describe the difficulty level of the problems more accurately
    let problemLevel = 'Up to Quarters'; // default is 1st grade
    if (gradeLevel === '2nd') {
        problemLevel = 'Up to Eighths';
    } else if (gradeLevel === '3rd') {
        problemLevel = 'Up to Twelfths';
    }

    return {
        render(quadrantContext: QuadrantContext): void {
            const context = quadrantContext.context;
            const width = quadrantContext.width;

            // Render Main Quadrant Header Typography
            context.fillStyle = COLOR_BLACK;
            context.font = `bold 14px ${SANS_SERIF_FONT}`;
            context.textBaseline = 'top';
            context.textAlign = 'left';
            context.fillText(`${title} (${problemLevel})`, 15, 12);

            // Math Layout Positioning Mechanics (Splitting the 266px width area space)
            const circleRadius = 32;
            const centerY = 65;

            const leftCenterX = width * 0.28;  // Centers the left visual column structure
            const rightCenterX = width * 0.72; // Centers the right visual column structure

            // Draw Left Question Set
            drawFractionCircle(context, leftCenterX, centerY, circleRadius, leftProblem);
            drawFractionStructureInput(context, leftCenterX, centerY + circleRadius + 10);

            // Draw Right Question Set
            drawFractionCircle(context, rightCenterX, centerY, circleRadius, rightProblem);
            drawFractionStructureInput(context, rightCenterX, centerY + circleRadius + 10);
        }
    };
}
