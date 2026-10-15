import { QuadrantExercise, QuadrantContext } from './worksheet/worksheet-layout';
import { SANS_SERIF_FONT, COLOR_MEDIUM_GREY } from './constants';

/**
 * Builds a labeled stand-in for an exercise that does not exist yet.
 * The label tells the reader what is missing.
 */
export function createPlaceholderExercise(label: string): QuadrantExercise {
    return {
        render(quadrantContext: QuadrantContext): void {
            const context = quadrantContext.context;
            const width = quadrantContext.width;
            const height = quadrantContext.height;

            context.fillStyle = COLOR_MEDIUM_GREY;
            context.font = `italic 11px ${SANS_SERIF_FONT}`;
            context.textBaseline = 'middle';
            context.textAlign = 'center';
            context.fillText(`[${label} Exercise Slot]`, width / 2, height / 2);
        }
    };
}

/**
 * Builds a quadrant that draws nothing at all. The pipeline already paints
 * every quadrant white, so silence is all that is required. It fills the
 * gaps when fewer than four exercises are selected.
 */
export function createBlankExercise(): QuadrantExercise {
    return {
        render(): void {
            // Intentionally empty: the white background is the exercise.
        }
    };
}

export function loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.src = src;
        img.onload = () => resolve(img);
        img.onerror = (err) => reject(err);
    });
}
