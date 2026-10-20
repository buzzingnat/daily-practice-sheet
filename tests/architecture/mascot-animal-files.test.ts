import { describe, expect, test } from 'vitest';

// Vite reads each generated animal as text at test time. The keys end in "animals/dog.svg" and so on.
const rawAnimals = import.meta.glob<string>('../../public/img/mascots/animals/*.svg', { eager: true, query: '?raw', import: 'default' });

const animalFiles: Record<string, string> = Object.fromEntries(
    Object.entries(rawAnimals).map(([key, text]) => [key.slice(key.lastIndexOf('/') + 1), text])
);

const EXPECTED_ANIMALS = ['chicken', 'crab', 'dog', 'frog', 'ladybug', 'pig', 'schnauzer', 'tiger'];

// The shapes the script restyles; every one must carry a stroke and a black or white fill
const SHAPE_TAG = /<(path|ellipse|circle|rect|polygon)\b[^>]*?\/>/g;

describe('the generated animal coloring pages', () => {
    test('are the eight animals of the sheet, no more and no fewer', () => {
        expect(Object.keys(animalFiles).sort()).toEqual(EXPECTED_ANIMALS.map((name) => `${name}.svg`));
    });

    test('have a viewBox and a size, so each can be drawn at any height', () => {
        const offenders = Object.entries(animalFiles)
            .filter(([, text]) => !/viewBox="-?\d+ -?\d+ \d+ \d+"/.test(text) || !/\swidth="\d+"/.test(text) || !/\sheight="\d+"/.test(text))
            .map(([name]) => name);
        expect(offenders).toEqual([]);
    });

    test('keep no color, shadow, gradient or other leftover of the original art', () => {
        const offenders: string[] = [];
        for (const [name, text] of Object.entries(animalFiles)) {
            if (/opacity|linearGradient|radialGradient|url\(#/.test(text)) {
                offenders.push(`${name} has opacity or a gradient`);
            }
            const shapes = text.match(SHAPE_TAG) ?? [];
            if (shapes.length === 0) {
                offenders.push(`${name} has no shapes`);
            }
            shapes.forEach((shape) => {
                if (!/\sfill="#(fff|000)"/.test(shape) || !/\sstroke="#000"/.test(shape)) {
                    offenders.push(`${name} has a shape that is not black or white with a black outline`);
                }
            });
        }
        expect(offenders).toEqual([]);
    });
});
