import { RandomSource } from '../types';

// A zero is welcome, but it teaches little; it counts as a quarter of any other number
const ZERO_WEIGHT = 0.25;

/**
 * Picks a whole number from 0 to maxInclusive. Every number from 1 up is equally
 * likely, and 0 is rarer than all of them. When 0 is the only choice, it gets the job.
 */
export function pickRandomWithRareZero(maxInclusive: number, random: RandomSource = Math.random): number {
    if (maxInclusive <= 0) {
        return 0;
    }

    const roll = random() * (ZERO_WEIGHT + maxInclusive);
    if (roll < ZERO_WEIGHT) {
        return 0;
    }
    return Math.min(maxInclusive, 1 + Math.floor(roll - ZERO_WEIGHT));
}

/**
 * Picks one number from a list. Zero, when the list holds it, is ZERO_WEIGHT times
 * as likely as any other entry, so a chosen zero stays possible without taking over.
 */
export function pickFromWithRareZero(numbers: readonly number[], random: RandomSource = Math.random): number {
    const weightOf = (value: number): number => (value === 0 ? ZERO_WEIGHT : 1);
    const totalWeight = numbers.reduce((total, value) => total + weightOf(value), 0);

    let roll = random() * totalWeight;
    for (const value of numbers) {
        roll -= weightOf(value);
        if (roll < 0) {
            return value;
        }
    }
    return numbers[numbers.length - 1] ?? 0;
}
