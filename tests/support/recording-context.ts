import { QuadrantContext } from '../../src/worksheet/worksheet-layout';

export interface RecordedText {
    text: string;
    x: number;
    y: number;
}

export interface RecordedCall {
    name: string;
    args: unknown[];
}

// A canvas stand-in that remembers what was written and drawn, and shrugs at everything else
export function createRecordingContext(): { quadrantContext: QuadrantContext; texts: RecordedText[]; calls: RecordedCall[] } {
    const texts: RecordedText[] = [];
    const calls: RecordedCall[] = [];
    const context = new Proxy({}, {
        get: (unused, property: string) => (...args: unknown[]) => {
            calls.push({ name: property, args });
            if (property === 'fillText') {
                texts.push({ text: args[0] as string, x: args[1] as number, y: args[2] as number });
            }
            if (property === 'measureText') {
                return { width: 40 };
            }
            return undefined;
        },
        set: () => true
    }) as unknown as CanvasRenderingContext2D;
    return { quadrantContext: { context, width: 266, height: 155 }, texts, calls };
}
