import { describe, expect, test } from 'vitest';
import { TOPIC_KEYS, TOPIC_LABELS, TOPIC_SHORT_LABELS } from '../../src/types';

describe('TOPIC_LABELS', () => {
    test('names every topic with something other than its key', () => {
        const unnamed = TOPIC_KEYS.filter((topic) => {
            const label = TOPIC_LABELS[topic];
            return label === undefined || label.trim() === '' || label === topic;
        });
        expect(unnamed).toEqual([]);
    });

    test('gives no two topics the same name', () => {
        const labels = TOPIC_KEYS.map((topic) => TOPIC_LABELS[topic]);
        expect(new Set(labels).size).toBe(labels.length);
    });
});

describe('TOPIC_SHORT_LABELS', () => {
    test('is never longer than the full name, and unique', () => {
        const tooLong = TOPIC_KEYS.filter((topic) => TOPIC_SHORT_LABELS[topic].length > TOPIC_LABELS[topic].length);
        expect(tooLong).toEqual([]);
        const labels = TOPIC_KEYS.map((topic) => TOPIC_SHORT_LABELS[topic]);
        expect(new Set(labels).size).toBe(labels.length);
    });
});
