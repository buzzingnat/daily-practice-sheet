/**
 * Every word a person would read or hear from an element: its text, and the aria labels a screen reader speaks.
 * Strings with no letters in them (a "+", a triangle) are glyphs, not words, and are left out.
 */
export function collectWords(root: Element): string[] {
    const words: string[] = [];
    const visit = (element: Element): void => {
        const ariaLabel = element.getAttribute('aria-label');
        if (ariaLabel) {
            words.push(ariaLabel);
        }
        element.childNodes.forEach((child) => {
            if (child.nodeType === 3) {
                const text = (child.textContent ?? '').trim();
                if (text !== '') {
                    words.push(text);
                }
            } else if (child.nodeType === 1) {
                visit(child as Element);
            }
        });
    };
    visit(root);
    return words.filter((word) => /\p{L}/u.test(word));
}

// What a made-up catalog writes: every string starts with where it came from
const MARKER_PATTERN = /^(card|bar|ui|heading|option|short|preset|noun|name|summary|title|worksheet|level):/;

/**
 * The words that did not come from the marker catalog, so were written into the code. The letters of the
 * cursive sets and the numbers on the multiplication chips are content, not words, and are passed over.
 */
export function findUnmarkedWords(words: readonly string[]): string[] {
    return words.filter((word) => !MARKER_PATTERN.test(word) && !/^[a-z](?: [a-z])+$/.test(word));
}
