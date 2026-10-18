import { SANS_SERIF_FONT, COLOR_BLACK } from '../../constants';

/**
 * The labeled response line at the foot of a map quadrant. The answer sheet
 * passes the answer, which is written just above the line, where a pencil would go.
 */
export function drawAnswerLine(
    context: CanvasRenderingContext2D,
    width: number,
    height: number,
    answerLabel: string,
    answer?: string
): void {
    const answerBaseline = height - 10;
    context.fillStyle = COLOR_BLACK;
    context.font = `normal 11px ${SANS_SERIF_FONT}`;
    context.textBaseline = 'alphabetic';
    context.textAlign = 'left';
    context.fillText(answerLabel, 15, answerBaseline);

    const lineStart = 15 + context.measureText(answerLabel).width + 6;
    context.strokeStyle = COLOR_BLACK;
    context.lineWidth = 1;
    context.beginPath();
    context.moveTo(lineStart, answerBaseline + 1);
    context.lineTo(width - 15, answerBaseline + 1);
    context.stroke();

    if (answer !== undefined) {
        context.fillText(answer, lineStart + 4, answerBaseline - 1);
    }
}
