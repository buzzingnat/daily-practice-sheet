import { QuadrantExercise, QuadrantContext } from './worksheet-layout';
import { SANS_SERIF_FONT } from './constants';

export type ClockType = 'telling' | 'setting';

export interface ClockTime {
    hours: number;
    minutes: number;
}

// Layout in quadrant-local units. The clock hugs the left; the answer box takes the right.
const CLOCK_SIZE = 90;
const CLOCK_LEFT = 15;
const CLOCK_TOP = 40;
const INTERACTION_GAP = 25;

// Fractions of the dial radius. Short and stout for hours, long and lean for minutes.
const DIAL_RADIUS_RATIO = 0.85;
const NUMBER_RING_RATIO = 0.75;
const HOUR_HAND_LENGTH_RATIO = 0.44;
const MINUTE_HAND_LENGTH_RATIO = 0.68;
const HOUR_HAND_COLOR = '#999999';
const INK_COLOR = '#000000';

interface ClockGeometry {
    centerX: number;
    centerY: number;
    radius: number;
}

/**
 * Formats a time the way a person would write it on a slip of paper: no
 * leading zero on the hour, a mandatory one on the minutes. Midnight and
 * noon both read as twelve, because no clock face has a zero on it, and
 * hours past twelve fold back onto the dial just as the hour hand does.
 */
export function formatClockTime(time: ClockTime): string {
    const dialHour = (time.hours % 12) === 0 ? 12 : time.hours % 12;
    const paddedMinutes = time.minutes.toString().padStart(2, '0');
    return `${dialHour}:${paddedMinutes}`;
}

function drawTitle(context: CanvasRenderingContext2D, title: string): void {
    context.fillStyle = INK_COLOR;
    context.font = `bold 14px ${SANS_SERIF_FONT}`;
    context.textBaseline = 'top';
    context.textAlign = 'left';
    context.fillText(title, 15, 12);
}

function drawDialRing(context: CanvasRenderingContext2D, geometry: ClockGeometry): void {
    context.strokeStyle = INK_COLOR;
    context.lineWidth = 2;
    context.beginPath();
    context.arc(geometry.centerX, geometry.centerY, geometry.radius, 0, 2 * Math.PI);
    context.stroke();
}

/**
 * Twelve numbers, one per hour, each placed by sine and cosine. Twelve is at the
 * top because cosine of 360 degrees is one, and the clock agrees with the compass.
 */
function drawHourNumbers(context: CanvasRenderingContext2D, geometry: ClockGeometry): void {
    context.fillStyle = INK_COLOR;
    context.font = `bold 9px ${SANS_SERIF_FONT}`;
    context.textBaseline = 'middle';
    context.textAlign = 'center';

    let hourNumber = 1;
    while (hourNumber <= 12) {
        const angle = (hourNumber * 30 * Math.PI) / 180;
        const numberX = geometry.centerX + Math.sin(angle) * (geometry.radius * NUMBER_RING_RATIO);
        const numberY = geometry.centerY - Math.cos(angle) * (geometry.radius * NUMBER_RING_RATIO);
        context.fillText(hourNumber.toString(), numberX, numberY);
        hourNumber = hourNumber + 1;
    }
}

function drawPivot(context: CanvasRenderingContext2D, geometry: ClockGeometry): void {
    context.fillStyle = INK_COLOR;
    context.beginPath();
    context.arc(geometry.centerX, geometry.centerY, 2.5, 0, 2 * Math.PI);
    context.fill();
}

function drawHand(
    context: CanvasRenderingContext2D,
    geometry: ClockGeometry,
    angle: number,
    lengthRatio: number,
    color: string,
    thickness: number
): void {
    context.strokeStyle = color;
    context.lineWidth = thickness;
    context.lineCap = 'round';
    context.beginPath();
    context.moveTo(geometry.centerX, geometry.centerY);
    context.lineTo(
        geometry.centerX + Math.sin(angle) * (geometry.radius * lengthRatio),
        geometry.centerY - Math.cos(angle) * (geometry.radius * lengthRatio)
    );
    context.stroke();
}

/**
 * The hour hand creeps along with the minutes, half a degree each, so that
 * 3:45 does not pretend to be 3:00. Only telling tasks get hands; setting
 * tasks leave the face bare for the student to draw on.
 */
function drawHands(context: CanvasRenderingContext2D, geometry: ClockGeometry, time: ClockTime): void {
    const hourAngle = ((time.hours % 12) * 30 + time.minutes * 0.5) * (Math.PI / 180);
    drawHand(context, geometry, hourAngle, HOUR_HAND_LENGTH_RATIO, HOUR_HAND_COLOR, 3.5);

    const minuteAngle = (time.minutes * 6) * (Math.PI / 180);
    drawHand(context, geometry, minuteAngle, MINUTE_HAND_LENGTH_RATIO, INK_COLOR, 1.8);
}

/**
 * Telling tasks get an empty box with a colon for the student to fill in.
 * Setting tasks get a box holding the target time, to be drawn onto the face.
 */
function drawAnswerBox(
    context: CanvasRenderingContext2D,
    clockType: ClockType,
    displayLabel: string
): void {
    const boxLeft = CLOCK_LEFT + CLOCK_SIZE + INTERACTION_GAP;
    const boxCenterY = CLOCK_TOP + (CLOCK_SIZE / 2);

    context.strokeStyle = INK_COLOR;
    context.lineWidth = 1;

    if (clockType === 'telling') {
        context.strokeRect(boxLeft, boxCenterY - 15, 65, 30);
        context.fillStyle = INK_COLOR;
        context.font = `bold 16px ${SANS_SERIF_FONT}`;
        context.textBaseline = 'middle';
        context.textAlign = 'center';
        context.fillText(':', boxLeft + 32, boxCenterY);
    } else {
        context.strokeRect(boxLeft, boxCenterY - 15, 80, 30);
        context.fillStyle = INK_COLOR;
        context.font = `normal 13px ${SANS_SERIF_FONT}`;
        context.textBaseline = 'middle';
        context.textAlign = 'center';
        context.fillText(displayLabel, boxLeft + 40, boxCenterY + 1);
    }
}

/**
 * The clockType parameter picks the task: telling draws the hands, setting leaves them off.
 * A setting task shows the target time in its prompt box. Callers may supply
 * their own wording; otherwise the time is formatted for them, since a setting
 * task with a blank prompt asks the student to set the clock to nothing.
 */
export function createClockExercise(
    clockType: ClockType,
    title: string,
    time: ClockTime,
    digitalDisplayLabel?: string
): QuadrantExercise {
    const displayLabel = digitalDisplayLabel ?? formatClockTime(time);

    return {
        render(quadrantContext: QuadrantContext): void {
            const context = quadrantContext.context;

            const geometry: ClockGeometry = {
                centerX: CLOCK_LEFT + (CLOCK_SIZE / 2),
                centerY: CLOCK_TOP + (CLOCK_SIZE / 2),
                radius: (CLOCK_SIZE / 2) * DIAL_RADIUS_RATIO
            };

            drawTitle(context, title);
            drawDialRing(context, geometry);
            drawHourNumbers(context, geometry);
            drawPivot(context, geometry);

            if (clockType === 'telling') {
                drawHands(context, geometry, time);
            }

            drawAnswerBox(context, clockType, displayLabel);
        }
    };
}
