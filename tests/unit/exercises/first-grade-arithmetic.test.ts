import { afterEach, describe, expect, test, vi } from 'vitest';
import { createAdditionExercise } from '../../../src/exercises/addition-exercise';
import { createSubtractionExercise } from '../../../src/exercises/subtraction-exercise';
import { createRecordingContext, RecordedText } from '../../support/recording-context';
import { createSeededRandom } from '../../support/seeded-random';

const SEEDS = 2000;
const TOP_ROW_Y = 40 + 22;
const BOTTOM_ROW_Y = 40 + 46;

afterEach(() => {
    vi.restoreAllMocks();
});

function numbersAt(texts: RecordedText[], y: number): number[] {
    return texts.filter((entry) => entry.y === y && /^\d+$/.test(entry.text)).map((entry) => Number(entry.text));
}

function collectProblems(create: typeof createAdditionExercise): { top: number; bottom: number }[] {
    const problems: { top: number; bottom: number }[] = [];
    for (let seed = 1; seed <= SEEDS; seed++) {
        vi.spyOn(Math, 'random').mockImplementation(createSeededRandom(seed));
        const drawn = createRecordingContext();
        create('1st').render(drawn.quadrantContext);
        const tops = numbersAt(drawn.texts, TOP_ROW_Y);
        const bottoms = numbersAt(drawn.texts, BOTTOM_ROW_Y);
        tops.forEach((top, index) => problems.push({ top, bottom: bottoms[index] as number }));
    }
    return problems;
}

describe.each([
    {
        name: 'addition',
        create: createAdditionExercise,
        // No carrying: the ones place stays short of ten
        isValid: (top: number, bottom: number) => (top % 10) + bottom < 10
    },
    {
        name: 'subtraction',
        create: createSubtractionExercise,
        // No borrowing: the bottom fits inside the ones place of the top
        isValid: (top: number, bottom: number) => bottom <= top % 10
    }
])('first grade $name', (kind) => {
    const problems = collectProblems(kind.create);

    test('needs no carrying or borrowing', () => {
        const offenders = problems.filter((problem) => !kind.isValid(problem.top, problem.bottom));
        expect(offenders).toEqual([]);
    });

    test('offers zero, but less often than any other bottom number for the same top', () => {
        // Large bottoms fit under few tops, so only problems sharing a top are comparable
        const counts = new Map<string, number>();
        problems.forEach((problem) => {
            const key = `${problem.top}:${problem.bottom}`;
            counts.set(key, (counts.get(key) ?? 0) + 1);
        });
        const offenders: string[] = [];
        let zeroSeen = false;
        problems.forEach((problem) => {
            const zeroCount = counts.get(`${problem.top}:0`) ?? 0;
            zeroSeen = zeroSeen || zeroCount > 0;
            const count = counts.get(`${problem.top}:${problem.bottom}`) ?? 0;
            if (problem.bottom !== 0 && count <= zeroCount) {
                offenders.push(`top ${problem.top}: bottom ${problem.bottom} came ${count} times, 0 came ${zeroCount}`);
            }
        });
        expect(zeroSeen).toBe(true);
        expect([...new Set(offenders)]).toEqual([]);
    });
});
