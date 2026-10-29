import { afterEach, describe, expect, test } from 'vitest';
import { english } from '../../../src/text/english';
import { getMessages, setLanguage, setMessages } from '../../../src/text/messages';

afterEach(() => {
    setLanguage('en');
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
        expect(getMessages().topics.addition.name).toBe(english.topics.addition.name);
    });
});
