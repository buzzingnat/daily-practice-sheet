import { describe, expect, test } from 'vitest';
import { planHalfPages } from '../../src/generator/half-page-planner';
import { QuadrantTopics, TopicKey } from '../../src/types';
import { countBy } from './count-by';
import { createSeededRandom } from './seeded-random';

export const HALF_PAGES_PER_RUN = 28;

export interface PlannedRun {
    selection: TopicKey[];
    seed: number;
    plans: QuadrantTopics[];
}

export function planEveryRun(selections: readonly TopicKey[][], seedsPerSelection: number): PlannedRun[] {
    const runs: PlannedRun[] = [];
    selections.forEach((selection) => {
        let seed = 1;
        while (seed <= seedsPerSelection) {
            runs.push({ selection, seed, plans: planHalfPages(selection, HALF_PAGES_PER_RUN, createSeededRandom(seed)) });
            seed = seed + 1;
        }
    });
    return runs;
}

function describeHalfPage(run: PlannedRun, halfPageIndex: number): string {
    const halfPage = run.plans[halfPageIndex] ?? [];
    return `selection [${run.selection.join(', ')}], seed ${run.seed}, half-page ${halfPageIndex} [${halfPage.join(', ')}]`;
}

// Counts topics that keep their quadrant from one half-page to the next
export function countSameQuadrantRepeats(plans: readonly QuadrantTopics[]): number {
    let repeats = 0;
    plans.forEach((halfPage, halfPageIndex) => {
        const previousHalfPage = plans[halfPageIndex - 1];
        if (previousHalfPage) {
            halfPage.forEach((topic, quadrantIndex) => {
                if (previousHalfPage[quadrantIndex] === topic) {
                    repeats = repeats + 1;
                }
            });
        }
    });
    return repeats;
}

/**
 * The planner's rules, run over whatever selections and seeds the caller picks. The quick suite
 * runs a sample; the full suite runs every selection a human can click. The runs are planned once
 * and each rule walks all of them, collecting what it finds amiss. An empty list is a pass; a full
 * one names every offender at once.
 */
export function describePlannerRules(title: string, runs: readonly PlannedRun[]): void {
    describe(title, () => {
        test('plans the number of half-pages requested', () => {
            const violations = runs
                .filter((run) => run.plans.length !== HALF_PAGES_PER_RUN)
                .map((run) => `selection [${run.selection.join(', ')}], seed ${run.seed}: ${run.plans.length} half-pages`);
            expect(violations).toEqual([]);
        });

        test('uses only selected topics', () => {
            const violations: string[] = [];
            runs.forEach((run) => {
                run.plans.forEach((halfPage, halfPageIndex) => {
                    halfPage.forEach((topic) => {
                        if (!run.selection.includes(topic)) {
                            violations.push(`${describeHalfPage(run, halfPageIndex)}: "${topic}" was not selected`);
                        }
                    });
                });
            });
            expect(violations).toEqual([]);
        });

        test('fills each half-page with as many distinct topics as four quadrants and the selection allow', () => {
            const violations: string[] = [];
            runs.forEach((run) => {
                const expectedDistinct = Math.min(4, run.selection.length);
                run.plans.forEach((halfPage, halfPageIndex) => {
                    const distinct = countBy(halfPage).size;
                    if (distinct !== expectedDistinct) {
                        violations.push(`${describeHalfPage(run, halfPageIndex)}: ${distinct} distinct, expected ${expectedDistinct}`);
                    }
                });
            });
            expect(violations).toEqual([]);
        });

        test('spreads repeats within a half-page evenly when fewer than four topics are selected', () => {
            const violations: string[] = [];
            runs.forEach((run) => {
                run.plans.forEach((halfPage, halfPageIndex) => {
                    const counts = Array.from(countBy(halfPage).values());
                    if (Math.max(...counts) - Math.min(...counts) > 1) {
                        violations.push(`${describeHalfPage(run, halfPageIndex)}: uneven repeats (${counts.join(', ')})`);
                    }
                });
            });
            expect(violations).toEqual([]);
        });

        test('never lets one topic get more than one appearance ahead across a run', () => {
            const violations: string[] = [];
            runs.forEach((run) => {
                const runningCounts = new Map<TopicKey, number>(run.selection.map((topic) => [topic, 0]));
                run.plans.forEach((halfPage, halfPageIndex) => {
                    halfPage.forEach((topic) => {
                        runningCounts.set(topic, (runningCounts.get(topic) || 0) + 1);
                    });
                    const counts = Array.from(runningCounts.values());
                    if (Math.max(...counts) - Math.min(...counts) > 1) {
                        violations.push(`${describeHalfPage(run, halfPageIndex)}: running counts drifted (${counts.join(', ')})`);
                    }
                });
            });
            expect(violations).toEqual([]);
        });

        test('reshuffles every seat between half-pages when exactly four topics are selected', () => {
            const violations = runs
                .filter((run) => run.selection.length === 4)
                .map((run) => ({ run, repeats: countSameQuadrantRepeats(run.plans) }))
                .filter(({ repeats }) => repeats > 0)
                .map(({ run, repeats }) => `selection [${run.selection.join(', ')}], seed ${run.seed}: ${repeats} topics kept their quadrant`);
            expect(violations).toEqual([]);
        });

        test('gives the same plan for the same seed', () => {
            const violations = runs
                .filter((run) => {
                    const replay = planHalfPages(run.selection, HALF_PAGES_PER_RUN, createSeededRandom(run.seed));
                    return JSON.stringify(replay) !== JSON.stringify(run.plans);
                })
                .map((run) => `selection [${run.selection.join(', ')}], seed ${run.seed}: replay differed`);
            expect(violations).toEqual([]);
        });
    });
}
