// @vitest-environment jsdom
import { afterEach, describe, expect, test } from 'vitest';
import { renderTopicSettings } from '../../../src/ui/topic-settings-panel';
import { createDefaultSelections } from '../../../src/settings/topic-settings';
import { setLanguage, setMessages } from '../../../src/text/messages';
import { CONFIGURABLE_TOPICS } from '../../../src/types';
import { createMarkerCatalog } from '../../support/marker-catalog';
import { collectWords, findUnmarkedWords } from '../../support/visible-words';

afterEach(() => {
    setLanguage('en');
});

describe('renderTopicSettings', () => {
    test('writes no English of its own for any topic', () => {
        setMessages(createMarkerCatalog());
        const offenders: string[] = [];
        for (const topic of CONFIGURABLE_TOPICS) {
            const container = document.createElement('div');
            renderTopicSettings(container, topic, createDefaultSelections(), () => undefined);
            findUnmarkedWords(collectWords(container)).forEach((word) => offenders.push(`${topic}: ${word}`));
        }
        expect(offenders).toEqual([]);
    });

    test('puts the catalog\'s All chip on every multiple-choice panel that offers one', () => {
        setMessages(createMarkerCatalog());
        const container = document.createElement('div');
        renderTopicSettings(container, 'countries', createDefaultSelections(), () => undefined);
        const chipTexts = [...container.querySelectorAll('button')].map((button) => button.textContent);
        expect(chipTexts).toContain('ui:allChip');
    });
});
