import { CURSIVE_GROUPS, CursiveGroup } from '../../types';

export interface CursiveCard {
    letter: string;
}

// Each set, as the letters a child meets together. Position in the list is the order of introduction.
export const CURSIVE_GROUP_LETTERS: Record<CursiveGroup, readonly string[]> = {
    's-m-a-t': ['s', 'm', 'a', 't'],
    'c-r-i-p': ['c', 'r', 'i', 'p'],
    'b-f-o-g': ['b', 'f', 'o', 'g'],
    'h-j-u-l': ['h', 'j', 'u', 'l'],
    'd-w-e-n': ['d', 'w', 'e', 'n'],
    'k-q-v-x-y-z': ['k', 'q', 'v', 'x', 'y', 'z']
};

/**
 * Every card from the chosen sets, in the order the sets are introduced.
 */
export function listCursiveCards(groups: readonly CursiveGroup[]): CursiveCard[] {
    return CURSIVE_GROUPS
        .filter((group) => groups.includes(group))
        .flatMap((group) => CURSIVE_GROUP_LETTERS[group].map((letter) => ({ letter })));
}
