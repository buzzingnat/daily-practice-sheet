import { RandomSource } from './types';

// Rejection sampling needs a ceiling. For the ten- and fourteen-card decks in use,
// roughly one shuffle in three passes, so two hundred failures in a row would be
// a curiosity worth an error message rather than an infinite loop.
const MAXIMUM_SHUFFLE_ATTEMPTS = 200;

/**
 * Fisher-Yates, in place. Every ordering is equally likely, which is more
 * than can be said for a sort with a random comparator.
 * Items must not be undefined, so a missing slot can be told from a real one.
 */
export function shuffleInPlace<Item extends {}>(items: Item[], random: RandomSource): void {
    let currentIndex = items.length - 1;
    while (currentIndex > 0) {
        const targetIndex = Math.floor(random() * (currentIndex + 1));
        const currentItem = items[currentIndex];
        const targetItem = items[targetIndex];
        if (currentItem === undefined || targetItem === undefined) {
            throw new Error(`Shuffle reached past the end of a ${items.length}-item list.`);
        }
        items[currentIndex] = targetItem;
        items[targetIndex] = currentItem;
        currentIndex = currentIndex - 1;
    }
}

export interface ShuffledDeck<Item> {
    drawNext(): Item;
}

/**
 * Reports whether a freshly shuffled cycle would deal the same card twice
 * in a row, either inside the cycle or across the seam with the last card
 * of the previous one.
 */
function hasAdjacentRepeat<Item>(
    cycle: readonly Item[],
    hasDealtCard: boolean,
    lastDealtCard: Item | undefined
): boolean {
    let cardIndex = 0;
    while (cardIndex < cycle.length) {
        const card = cycle[cardIndex];
        if (cardIndex === 0) {
            if (hasDealtCard && card === lastDealtCard) {
                return true;
            }
        } else if (card === cycle[cardIndex - 1]) {
            return true;
        }
        cardIndex = cardIndex + 1;
    }
    return false;
}

/**
 * Deals items so that every aligned run of (items x copies) draws holds each
 * item exactly `copiesPerCycle` times. Five kana dealt two copies per cycle
 * means draws one through ten hold each kana twice, as do eleven through
 * twenty. No card follows itself, seams included, unless the deck holds only
 * one distinct item and has no choice in the matter.
 *
 * Items are compared with ===, so object items must come from one shared list.
 */
export function createShuffledDeck<Item extends {}>(
    items: readonly Item[],
    copiesPerCycle: number,
    random: RandomSource
): ShuffledDeck<Item> {
    if (items.length === 0) {
        throw new Error('A deck needs at least one item.');
    }
    if (!Number.isInteger(copiesPerCycle) || copiesPerCycle < 1) {
        throw new Error(`copiesPerCycle must be a whole number of at least 1, not ${copiesPerCycle}.`);
    }

    const enforceNoAdjacentRepeats = new Set(items).size >= 2;

    let currentCycle: Item[] = [];
    let nextCardIndex = 0;
    let hasDealtCard = false;
    let lastDealtCard: Item | undefined = undefined;

    function buildCycle(): Item[] {
        const cycle: Item[] = [];
        let copyIndex = 0;
        while (copyIndex < copiesPerCycle) {
            cycle.push(...items);
            copyIndex = copyIndex + 1;
        }

        let attempt = 0;
        while (attempt < MAXIMUM_SHUFFLE_ATTEMPTS) {
            shuffleInPlace(cycle, random);
            if (!enforceNoAdjacentRepeats || !hasAdjacentRepeat(cycle, hasDealtCard, lastDealtCard)) {
                return cycle;
            }
            attempt = attempt + 1;
        }

        throw new Error(
            `No shuffle of ${items.length} items x ${copiesPerCycle} copies avoided adjacent repeats `
            + `in ${MAXIMUM_SHUFFLE_ATTEMPTS} attempts.`
        );
    }

    return {
        drawNext(): Item {
            if (nextCardIndex >= currentCycle.length) {
                currentCycle = buildCycle();
                nextCardIndex = 0;
            }
            const card = currentCycle[nextCardIndex];
            if (card === undefined) {
                throw new Error('The deck dealt from an empty cycle.');
            }
            nextCardIndex = nextCardIndex + 1;
            hasDealtCard = true;
            lastDealtCard = card;
            return card;
        }
    };
}
