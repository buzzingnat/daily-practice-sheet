import { describe, expect, test } from 'vitest';
import { batchHasAnswers, drawQuadrant, HalfPageLayout, QuadrantContext, QuadrantExercise } from '../../../src/worksheet/worksheet-layout';

const FAKE_CONTEXT = { context: {}, width: 266, height: 155 } as unknown as QuadrantContext;

function createRecordingExercise(calls: string[], withAnswers: boolean): QuadrantExercise {
    const exercise: QuadrantExercise = { render: () => { calls.push('render'); } };
    if (withAnswers) {
        exercise.renderAnswers = () => { calls.push('renderAnswers'); };
    }
    return exercise;
}

function createHalfPage(topLeft: QuadrantExercise, other: QuadrantExercise): HalfPageLayout {
    return { topLeft, topRight: other, bottomLeft: other, bottomRight: other };
}

describe('drawQuadrant', () => {
    test('uses renderAnswers on the answer sheet when the exercise has it', () => {
        const calls: string[] = [];
        drawQuadrant(createRecordingExercise(calls, true), FAKE_CONTEXT, true);
        expect(calls).toEqual(['renderAnswers']);
    });

    test('falls back to render when the exercise has no answers', () => {
        const calls: string[] = [];
        drawQuadrant(createRecordingExercise(calls, false), FAKE_CONTEXT, true);
        expect(calls).toEqual(['render']);
    });

    test('uses render on the worksheet even when answers exist', () => {
        const calls: string[] = [];
        drawQuadrant(createRecordingExercise(calls, true), FAKE_CONTEXT, false);
        expect(calls).toEqual(['render']);
    });
});

describe('batchHasAnswers', () => {
    test('is false when no quadrant can answer', () => {
        const plain = createRecordingExercise([], false);
        expect(batchHasAnswers([[createHalfPage(plain, plain)]])).toBe(false);
    });

    test('is true when any quadrant, in any slot, can answer', () => {
        const plain = createRecordingExercise([], false);
        const answering = createRecordingExercise([], true);
        expect(batchHasAnswers([[createHalfPage(plain, plain)], [createHalfPage(plain, answering)]])).toBe(true);
    });
});
