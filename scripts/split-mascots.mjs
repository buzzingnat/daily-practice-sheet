// Cuts the animal sprite sheet into one coloring-page SVG per animal.
//
// Source art: abbythepup.com, released under CC0 (see readme.md). The sheet is solid colors with
// no outlines, so each region becomes white (or black, when it was very dark) with a black stroke.
// Run it again after changing the settings below:  node scripts/split-mascots.mjs

import fs from 'node:fs';
import path from 'node:path';

const SHEET_PATH = 'public/img/mascots/various-animals.svg';
const OUTPUT_DIRECTORY = 'public/img/mascots/animals';

// Regions darker than this (0 is black, 1 is white) stay black: eyes, noses, mud
const DARK_THRESHOLD = 0.22;
// In sheet units. The sheet is 945 units per animal, printed about 52pt tall, so 14 gives about 0.8pt lines.
const STROKE_WIDTH = 14;
// Room around each animal so the outer stroke is not clipped
const VIEWBOX_PADDING = 20;
const ANIMAL_HEIGHT = 945;

// The top-level groups of the sheet, in file order, with the box each one fills (measured in a browser)
const ANIMAL_BOXES = [
    { name: 'dog', left: 310, top: 1417, width: 751 },
    { name: 'frog', left: 3081, top: 1417, width: 985 },
    { name: 'schnauzer', left: 1537, top: 1417, width: 1127 },
    { name: 'tiger', left: 4582, top: 1417, width: 727 },
    { name: 'crab', left: 0, top: 0, width: 1251 },
    { name: 'chicken', left: 1698, top: 0, width: 737 },
    { name: 'pig', left: 2904, top: 0, width: 1166 },
    { name: 'ladybug', left: 4429, top: 0, width: 1179 }
];

function luminance(hexColor) {
    const red = parseInt(hexColor.slice(1, 3), 16) / 255;
    const green = parseInt(hexColor.slice(3, 5), 16) / 255;
    const blue = parseInt(hexColor.slice(5, 7), 16) / 255;
    return (0.2126 * red) + (0.7152 * green) + (0.0722 * blue);
}

// Walks the tags and counts nesting, so each animal comes out as one whole group
function splitTopLevelGroups(sheetText) {
    const body = sheetText.slice(sheetText.indexOf('<g>'), sheetText.lastIndexOf('</svg>'));
    const groups = [];
    let depth = 0;
    let groupStart = 0;
    for (const match of body.matchAll(/<g\b[^>]*>|<\/g>/g)) {
        if (match[0].startsWith('</')) {
            depth = depth - 1;
            if (depth === 0) {
                groups.push(body.slice(groupStart, match.index + match[0].length));
            }
        } else {
            if (depth === 0) {
                groupStart = match.index;
            }
            depth = depth + 1;
        }
    }
    return groups;
}

// Cuts out every group whose opening tag sets an opacity, along with everything inside it
function removeTranslucentGroups(groupText) {
    let result = '';
    let position = 0;
    let skipDepth = 0;
    for (const match of groupText.matchAll(/<g\b[^>]*>|<\/g>/g)) {
        const tag = match[0];
        if (skipDepth === 0) {
            result = result + groupText.slice(position, match.index);
        }
        position = match.index + tag.length;
        if (tag.startsWith('</')) {
            if (skipDepth > 0) {
                skipDepth = skipDepth - 1;
            } else {
                result = result + tag;
            }
        } else if (skipDepth > 0 || /\sopacity="/.test(tag)) {
            skipDepth = skipDepth + 1;
        } else {
            result = result + tag;
        }
    }
    return result + groupText.slice(position);
}

// Shadows (translucent copies) and gradients do not survive as line art, so they go
function toColoringPage(groupText) {
    const withoutGradients = removeTranslucentGroups(groupText).replace(/<linearGradient[\s\S]*?<\/linearGradient>/g, '');
    return withoutGradients.replace(/<(path|ellipse|circle|rect|polygon)\b[^>]*?\/>/g, (shapeTag) => {
        if (/\sopacity="/.test(shapeTag)) {
            return '';
        }
        const fillMatch = shapeTag.match(/\sfill="(#[0-9A-Fa-f]{6})"/);
        const isDark = fillMatch !== null && luminance(fillMatch[1]) < DARK_THRESHOLD;
        const bareTag = shapeTag.replace(/\s(fill|enable-background|stroke|stroke-width)="[^"]*"/g, '');
        const styling = ` fill="${isDark ? '#000' : '#fff'}" stroke="#000" stroke-width="${STROKE_WIDTH}" stroke-linejoin="round" stroke-linecap="round"`;
        return bareTag.replace(/\s*\/>$/, `${styling}/>`);
    });
}

const groups = splitTopLevelGroups(fs.readFileSync(SHEET_PATH, 'utf8'));
if (groups.length !== ANIMAL_BOXES.length) {
    throw new Error(`The sheet has ${groups.length} animals; expected ${ANIMAL_BOXES.length}.`);
}

fs.mkdirSync(OUTPUT_DIRECTORY, { recursive: true });
groups.forEach((groupText, animalIndex) => {
    const box = ANIMAL_BOXES[animalIndex];
    const viewBoxWidth = box.width + (VIEWBOX_PADDING * 2);
    const viewBoxHeight = ANIMAL_HEIGHT + (VIEWBOX_PADDING * 2);
    const fileText = [
        '<?xml version="1.0" encoding="utf-8"?>',
        '<!-- Adapted from the animal sheet at abbythepup.com (CC0). Made by scripts/split-mascots.mjs; do not edit by hand. -->',
        `<svg xmlns="http://www.w3.org/2000/svg" width="${viewBoxWidth}" height="${viewBoxHeight}" viewBox="${box.left - VIEWBOX_PADDING} ${box.top - VIEWBOX_PADDING} ${viewBoxWidth} ${viewBoxHeight}">`,
        `<title>${box.name}</title>`,
        toColoringPage(groupText),
        '</svg>',
        ''
    ].join('\n');
    fs.writeFileSync(path.join(OUTPUT_DIRECTORY, `${box.name}.svg`), fileText);
});
console.log(`Wrote ${groups.length} animals to ${OUTPUT_DIRECTORY}`);
