import { QuadrantContext } from '../../src/worksheet/worksheet-layout';

export interface RecordedText {
    text: string;
    x: number;
    y: number;
}

// A canvas stand-in that remembers what was written and shrugs at everything else
export function createRecordingContext(): { quadrantContext: QuadrantContext; texts: RecordedText[] } {
    const texts: RecordedText[] = [];
    const target: Record<string, unknown> = {
        fillText: (text: string, x: number, y: number) => { texts.push({ text, x, y }); }
    };
    const context = new Proxy(target, {
        get: (record, property: string) => (property in record ? record[property] : () => undefined),
        set: () => true
    }) as unknown as CanvasRenderingContext2D;
    return { quadrantContext: { context, width: 266, height: 155 }, texts };
}
