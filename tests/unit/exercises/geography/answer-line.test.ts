import { describe, expect, test } from 'vitest';
import { drawAnswerLine } from '../../../../src/exercises/geography/answer-line';
import { createRecordingContext } from '../../../support/recording-context';

function draw(answer?: string) {
    const recording = createRecordingContext();
    drawAnswerLine(recording.quadrantContext.context, 266, 155, 'Country:', answer);
    return recording;
}

describe('drawAnswerLine', () => {
    test('the worksheet gets the label and the line with nothing written on it; the key adds the answer above the same line', () => {
        const worksheet = draw();
        expect(worksheet.texts.map((entry) => entry.text)).toEqual(['Country:']);
        expect(worksheet.calls.filter((call) => call.name === 'lineTo')).toHaveLength(1);

        const key = draw('Brazil');
        expect(key.texts.map((entry) => entry.text)).toEqual(['Country:', 'Brazil']);
        const [label, answer] = key.texts as [typeof key.texts[number], typeof key.texts[number]];
        expect(answer.x).toBeGreaterThan(label.x + 40);
        expect(answer.y).toBeLessThan(155 - 10 + 1);
        expect(key.calls.filter((call) => call.name === 'lineTo')).toEqual(worksheet.calls.filter((call) => call.name === 'lineTo'));
    });
});
