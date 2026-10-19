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
