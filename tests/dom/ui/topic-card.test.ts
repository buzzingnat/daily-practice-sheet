// @vitest-environment jsdom
import { afterEach, describe, expect, test, vi } from 'vitest';
import { createTopicCard } from '../../../src/ui/topic-card';
import { createDefaultSelections } from '../../../src/settings/topic-settings';
import { setLanguage, setMessages } from '../../../src/text/messages';
import { TOPIC_KEYS } from '../../../src/types';
import { createMarkerCatalog } from '../../support/marker-catalog';
import { collectWords, findUnmarkedWords } from '../../support/visible-words';

describe('createTopicCard words', () => {
    afterEach(() => {
        setLanguage('en');
    });

    test('writes no English of its own, chosen or not, locked or not, in either view', () => {
        setMessages(createMarkerCatalog());
        const offenders: string[] = [];
        for (const topic of TOPIC_KEYS) {
            const card = createTopicCard(topic, createDefaultSelections(), { onToggle: vi.fn(), onSettingsChange: vi.fn() });
            for (const isSelected of [false, true]) {
                for (const viewMode of ['normal', 'compact'] as const) {
                    card.setSelected(isSelected);
                    card.setLocked(!isSelected);
                    card.setViewMode(viewMode);
                    findUnmarkedWords(collectWords(card.element)).forEach((word) => offenders.push(`${topic}: ${word}`));
                }
            }
        }
        expect(offenders).toEqual([]);
    });
});
