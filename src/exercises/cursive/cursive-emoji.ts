export interface CursiveEmoji {
    emoji: string;
    // The word the picture stands for; it must begin with the letter it sits under
    word: string;
}

// A first draft, one picture per letter, each word beginning with its letter. Pictures are the
// teacher's to swap: the Montessori habit is a sound a child can hear at the start of the word,
// so a few of these (x-ray for x) are only the best emoji on offer.
export const CURSIVE_EMOJI: Readonly<Record<string, CursiveEmoji>> = {
    a: { emoji: '🍎', word: 'apple' },
    b: { emoji: '🐻', word: 'bear' },
    c: { emoji: '🐱', word: 'cat' },
    d: { emoji: '🐶', word: 'dog' },
    e: { emoji: '🐘', word: 'elephant' },
    f: { emoji: '🐟', word: 'fish' },
    g: { emoji: '🍇', word: 'grapes' },
    h: { emoji: '🐴', word: 'horse' },
    i: { emoji: '📥', word: 'in' },
    j: { emoji: '🎃', word: 'jack-o-lantern' },
    k: { emoji: '🔑', word: 'key' },
    l: { emoji: '🦁', word: 'lion' },
    m: { emoji: '🐒', word: 'monkey' },
    n: { emoji: '🌰', word: 'nut' },
    o: { emoji: '🐙', word: 'octopus' },
    p: { emoji: '🐷', word: 'pig' },
    q: { emoji: '👸', word: 'queen' },
    r: { emoji: '🐰', word: 'rabbit' },
    s: { emoji: '🌞', word: 'sun' },
    t: { emoji: '🐢', word: 'turtle' },
    u: { emoji: '🌂', word: 'umbrella' },
    v: { emoji: '🎻', word: 'violin' },
    w: { emoji: '🐳', word: 'whale' },
    x: { emoji: '🩻', word: 'x-ray' },
    y: { emoji: '🧶', word: 'yarn' },
    z: { emoji: '🦓', word: 'zebra' }
};

export function findCursiveEmoji(letter: string): CursiveEmoji {
    const entry = CURSIVE_EMOJI[letter];
    if (!entry) {
        throw new Error(`No picture is chosen for the letter "${letter}".`);
    }
    return entry;
}
