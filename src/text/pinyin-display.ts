// Quicksand has no single letters for u with two dots and a tone mark (U+01D5 to U+01DC), so they are
// drawn from parts it does have: u, the two dots (U+0308), then the tone mark. Unicode's own canonical
// decomposition spells them exactly that way. The font stacks the marks itself on a canvas or a page;
// jsPDF does not, which is why pinyin never goes into a PDF as text.
const ASSEMBLED_LETTER_PATTERN = /[\u01D5-\u01DC]/g;

/**
 * Pinyin ready to draw in Quicksand: every u with two dots and a tone mark arrives in pieces the font
 * can put together. Everything else passes through untouched, so the data can keep the proper letters.
 */
export function displayPinyin(pinyin: string): string {
    return pinyin.replace(ASSEMBLED_LETTER_PATTERN, (letter) => letter.normalize('NFD'));
}
