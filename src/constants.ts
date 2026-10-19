export const SANS_SERIF_FONT = 'Helvetica';

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

// for preloading assets
export const KANA_IMAGE_URL = "./img/kana-stroke-order.jpg";
