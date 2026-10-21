import { afterEach, describe, expect, test } from 'vitest';
import { TOPIC_KEYS } from '../../../src/types';
import { english } from '../../../src/text/english';
import { getMessages, setLanguage, setMessages } from '../../../src/text/messages';

afterEach(() => {
    setLanguage('en');
});

describe('the English topic names', () => {
    test('name every topic with something other than its key', () => {
        const unnamed = TOPIC_KEYS.filter((topic) => {
            const name = english.topics[topic].name;
            return name.trim() === '' || name === topic;
        });
        expect(unnamed).toEqual([]);
    });

    test('give no two topics the same name', () => {
        const names = TOPIC_KEYS.map((topic) => english.topics[topic].name);
        expect(new Set(names).size).toBe(names.length);
    });

    test('keep every short name no longer than the full name, and unique', () => {
        const tooLong = TOPIC_KEYS.filter((topic) => english.topics[topic].shortName.length > english.topics[topic].name.length);
        expect(tooLong).toEqual([]);
        const shortNames = TOPIC_KEYS.map((topic) => english.topics[topic].shortName);
        expect(new Set(shortNames).size).toBe(shortNames.length);
    });
});

describe('getMessages', () => {
    test('speaks English until told otherwise', () => {
        expect(getMessages()).toBe(english);
    });

    test('speaks whatever catalog was swapped in, and English again after setLanguage', () => {
        const other = { ...english, topics: { ...english.topics, addition: { name: 'Plus', shortName: '+' } } };
        setMessages(other);
        expect(getMessages().topics.addition.name).toBe('Plus');
        setLanguage('en');
        expect(getMessages().topics.addition.name).toBe('Addition');
    });
});
