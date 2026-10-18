import { describe, expect, test } from 'vitest';
import { drawAnswerLine } from '../../../../src/exercises/geography/answer-line';
import { createRecordingContext } from '../../../support/recording-context';

function draw(answer?: string) {
    const recording = createRecordingContext();
    drawAnswerLine(recording.quadrantContext.context, 266, 155, 'Country:', answer);
    return recording;
}

describe('drawAnswerLine', () => {
    test('the worksheet gets the label and the line and nothing written on it', () => {
        const recording = draw();
        expect(recording.texts.map((entry) => entry.text)).toEqual(['Country:']);
        expect(recording.calls.filter((call) => call.name === 'lineTo')).toHaveLength(1);
    });

    test('the answer sheet writes the answer above the line, after the label', () => {
        const worksheet = draw();
        const key = draw('Brazil');
        expect(key.texts.map((entry) => entry.text)).toEqual(['Country:', 'Brazil']);
        const [label, answer] = key.texts as [typeof key.texts[number], typeof key.texts[number]];
        expect(answer.x).toBeGreaterThan(label.x + 40);
        expect(answer.y).toBeLessThan(155 - 10 + 1);
        expect(key.calls.filter((call) => call.name === 'lineTo')).toEqual(worksheet.calls.filter((call) => call.name === 'lineTo'));
    });
});
