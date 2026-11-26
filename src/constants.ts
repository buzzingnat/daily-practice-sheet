// Quicksand, declared with @font-face in styles.css: Medium as weight 400, Bold as 700
export const SANS_SERIF_FAMILY = 'Quicksand';

// For canvas font strings. The fallbacks show only if Quicksand fails to load, which the
// startup loader treats as an error, so they are a seatbelt rather than a plan. The page's
// font-family in styles.css repeats this list, since CSS cannot import it: change both or neither.
export const SANS_SERIF_FONT = `${SANS_SERIF_FAMILY}, Helvetica, Arial, sans-serif`;

// jsPDF takes one family name, not a list, and knows only its built-in Helvetica until
// Quicksand is registered with each document.
export const PDF_FONT = 'Helvetica';

// Learning Curve cursive, declared with @font-face in styles.css. Bold models a letter,
// Regular is the solid copy to trace, Dashed is the dotted copy.
export const CURSIVE_BOLD_FONT = 'CursiveBold';
export const CURSIVE_REGULAR_FONT = 'CursiveRegular';
export const CURSIVE_DASHED_FONT = 'CursiveDashed';

// Whichever color emoji font the system carries, tried in order
export const EMOJI_FONT = '"Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif';

// The monochrome palette. Every colour drawn on the canvas comes from here.
// Pure black for boundaries, grids and outlines; pure white for backgrounds.
export const COLOR_BLACK = '#000000';
export const COLOR_WHITE = '#FFFFFF';
// Tracing, structural hints, fraction shading, and land that is not the subject
export const COLOR_LIGHT_GREY = '#D1D5DB';
// Emphasis fills that need more contrast without heavy ink coverage, such as the geography highlight
export const COLOR_MEDIUM_GREY = '#999999';

// The native jsPDF overlays use near-matches to the greys above, by design.
export const COLOR_PDF_CROSSHAIR = '#C8C8C8';
export const COLOR_PDF_PERFORATION = '#969696';

// Type styles shared across exercises: one title style for every exercise, and one for the numbers
// a student works with in the math exercises. Informational or decorative numbers, such as the clock
// face's numerals, keep sizes of their own.
export const EXERCISE_TITLE_SIZE = '14px';
export const EXERCISE_TITLE_WEIGHT = 'bold';
export const EXERCISE_TITLE_FONT = `${EXERCISE_TITLE_WEIGHT} ${EXERCISE_TITLE_SIZE} ${SANS_SERIF_FONT}`;
export const EXERCISE_MATH_NUMBER_SIZE = '18px';
export const EXERCISE_MATH_NUMBER_WEIGHT = 'normal';
export const EXERCISE_MATH_NUMBER_FONT = `${EXERCISE_MATH_NUMBER_WEIGHT} ${EXERCISE_MATH_NUMBER_SIZE} ${SANS_SERIF_FONT}`;

// Keep the exercise looking neat and tidy rather than crammed by making a size exception
// for the fraction answers and keeping them smaller than the rest of the numbers
export const EXERCISE_FRACTION_ANSWER_FONT = `normal 12px ${SANS_SERIF_FONT}`;

// for preloading assets
export const KANA_IMAGE_URL = "./img/kana-stroke-order.jpg";
