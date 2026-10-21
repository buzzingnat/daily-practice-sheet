import type { HalfPageLayout } from './worksheet-layout';
import { IDENTIFIER_WORDS } from './identifier-words';

const BITS_PER_WORD = 10;
const WORD_INDEX_MASK = (1 << BITS_PER_WORD) - 1;
// The quadrants are always read in this order, so the same page always tells the same story
const QUADRANT_ORDER = ['topLeft', 'topRight', 'bottomLeft', 'bottomRight'] as const;
const QUADRANT_WIDTH = 266;
const QUADRANT_HEIGHT = 155;

function describeArgument(argument: unknown): string {
    if (typeof argument === 'number') {
        // Rounded so float dust cannot change the words
        return String(Math.round(argument * 100) / 100);
    } else if (typeof argument === 'string' || typeof argument === 'boolean' || argument === null || argument === undefined) {
        return String(argument);
    } else if (Array.isArray(argument)) {
        return `[${argument.map(describeArgument).join(',')}]`;
    }
    // Images, paths and gradients cannot be read cheaply; their kind and their place in the call sequence stand in
    return typeof argument === 'object' ? argument.constructor.name : typeof argument;
}

/**
 * Wraps a canvas context so that every call and every property set is written down as it passes through.
 * The real context still does the work, so exercises that measure text keep getting true answers.
 */
function createRecordingWrapper(context: CanvasRenderingContext2D, record: string[]): CanvasRenderingContext2D {
    return new Proxy(context, {
        get: (target, property) => {
            const value = Reflect.get(target, property);
            if (typeof value !== 'function') {
                return value;
            }
            return (...args: unknown[]) => {
                record.push(`${String(property)}(${args.map(describeArgument).join(',')})`);
                return value.apply(target, args);
            };
        },
        set: (target, property, value) => {
            record.push(`${String(property)}=${describeArgument(value)}`);
            return Reflect.set(target, property, value);
        }
    });
}

/**
 * Draws the plain worksheet version of the four quadrants onto the given context and returns what was drawn, as text.
 * The answer key never feeds this, so a worksheet and its key come out the same.
 */
export function fingerprintHalfPage(layout: HalfPageLayout, context: CanvasRenderingContext2D): string {
    const record: string[] = [];
    const recordingContext = createRecordingWrapper(context, record);
    for (const slot of QUADRANT_ORDER) {
        record.push(`quadrant:${slot}`);
        layout[slot].render({ context: recordingContext, width: QUADRANT_WIDTH, height: QUADRANT_HEIGHT });
    }
    return record.join('\n');
}

/**
 * FNV-1a over the text, then a final stir (murmur3's finalizer) so every bit of the answer depends on every character.
 */
export function hashText(text: string): number {
    let hash = 0x811c9dc5;
    for (let index = 0; index < text.length; index = index + 1) {
        hash = Math.imul(hash ^ text.charCodeAt(index), 0x01000193);
    }
    hash = Math.imul(hash ^ (hash >>> 16), 0x85ebca6b);
    hash = Math.imul(hash ^ (hash >>> 13), 0xc2b2ae35);
    return (hash ^ (hash >>> 16)) >>> 0;
}

/**
 * Cuts the low 30 bits of the hash into three 10-bit word numbers.
 */
export function wordsFromHash(hash: number): string {
    const first = IDENTIFIER_WORDS[(hash >>> (BITS_PER_WORD * 2)) & WORD_INDEX_MASK];
    const second = IDENTIFIER_WORDS[(hash >>> BITS_PER_WORD) & WORD_INDEX_MASK];
    const third = IDENTIFIER_WORDS[hash & WORD_INDEX_MASK];
    if (first === undefined || second === undefined || third === undefined) {
        throw new Error(`The identifier word list needs ${WORD_INDEX_MASK + 1} words.`);
    }
    return `${first}.${second}.${third}`;
}

/**
 * Three words that name a half-page by what it draws, such as "otter.maple.cloud".
 */
export function getHalfPageIdentifier(layout: HalfPageLayout, context: CanvasRenderingContext2D): string {
    return wordsFromHash(hashText(fingerprintHalfPage(layout, context)));
}
