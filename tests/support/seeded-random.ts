import { RandomSource } from '../../src/types';

/**
 * Mulberry32: a small seeded generator. The same seed gives the same
 * sequence, so a failure can be replayed instead of merely regretted.
 */
export function createSeededRandom(seed: number): RandomSource {
    let state = seed >>> 0;
    return (): number => {
        state = (state + 0x6D2B79F5) >>> 0;
        let mixed = state;
        mixed = Math.imul(mixed ^ (mixed >>> 15), mixed | 1);
        mixed = mixed ^ (mixed + Math.imul(mixed ^ (mixed >>> 7), mixed | 61));
        return ((mixed ^ (mixed >>> 14)) >>> 0) / 4294967296;
    };
}
