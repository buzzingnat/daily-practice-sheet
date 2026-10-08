import { QuadrantExercise, QuadrantContext } from './worksheet-layout';
import { GradeLevel } from './types';

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
        allowedDenominators = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
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
    context.fillStyle = '#D1D5DB'; // light grey tone matching the styling specifications
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
    context.strokeStyle = '#000000';
    context.lineWidth = 1;
    let cutIndex = 0;
    while (cutIndex < denominator) {
        const angle = cutIndex * sliceAngle - Math.PI / 2;
        context.beginPath();
        context.moveTo(coordinateX, coordinateY);
        context.lineTo(coordinateX + Math.cos(angle) * radius, coordinateY + Math.sin(angle) * radius);
        context.stroke();

        cutIndex = cutIndex + 1;
    }

    // Clean Dark Outer Perimeter Boundary Rim
    context.strokeStyle = '#000000';
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

    context.strokeStyle = '#000000';
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
export function createFractionsQuadrant(
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

    return {
        render(quadrantContext: QuadrantContext): void {
            const context = quadrantContext.context;
            const width = quadrantContext.width;

            // Render Main Quadrant Header Typography
            context.fillStyle = '#000000';
            context.font = 'bold 14px Helvetica';
            context.textBaseline = 'top';
            context.textAlign = 'left';
            context.fillText(`${title} (${gradeLevel} Grade)`, 15, 12);

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
