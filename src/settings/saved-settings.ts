import { createDefaultSelections, findPanelSpecification, PanelSelections } from './topic-settings';
import { clampHalfPageCount, DEFAULT_HALF_PAGES } from './print-size';
import { CONFIGURABLE_TOPICS, ConfigurableTopic, TOPIC_KEYS, TopicKey } from '../types';

// One key per setting. The version sits in the key, so a change of shape can move to
// v2 and leave the old values to gather dust rather than be misread.
const KEY_PREFIX = 'daily-practice-sheet.v1';
export const SELECTED_TOPICS_KEY = `${KEY_PREFIX}.selected-topics`;
export const HALF_PAGE_COUNT_KEY = `${KEY_PREFIX}.half-page-count`;

export function panelSelectionKey(topic: ConfigurableTopic): string {
    return `${KEY_PREFIX}.panel.${topic}`;
}

export interface SavedSettings {
    selectedTopics: TopicKey[];
    panelSelections: PanelSelections;
    halfPageCount: number;
}

// Hands back the stored text for a key, or null when there is none to be had
export type StoredTextReader = (key: string) => string | null;

function parseJson(storedText: string | null): unknown {
    if (storedText === null) {
        return undefined;
    }
    try {
        return JSON.parse(storedText);
    } catch {
        return undefined;
    }
}

function parseStringList(storedText: string | null): string[] {
    const parsed = parseJson(storedText);
    if (!Array.isArray(parsed)) {
        return [];
    }
    return parsed.filter((item): item is string => typeof item === 'string');
}

/**
 * Known topics only, in topic order, without duplicates, and no more than the
 * limit. Storage is a guest; it does not get to decide what the house holds.
 */
export function parseSelectedTopics(storedText: string | null, maximumTopicCount: number): TopicKey[] {
    const stored = parseStringList(storedText);
    return TOPIC_KEYS.filter((topic) => stored.includes(topic)).slice(0, maximumTopicCount);
}

/**
 * Keeps the values the panel offers. A single-choice panel keeps one, and an
 * empty result falls back to the default, so the one-must-stay rule outlives a reload.
 */
export function parsePanelSelection(topic: ConfigurableTopic, storedText: string | null): string[] {
    const specification = findPanelSpecification(topic);
    const stored = parseStringList(storedText);
    const offered = specification.options.map((option) => option.value);
    const kept = offered.filter((value) => stored.includes(value));
    const trimmed = specification.kind === 'single' ? kept.slice(0, 1) : kept;
    return trimmed.length > 0 ? trimmed : [...specification.defaultValues];
}

export function parseHalfPageCount(storedText: string | null): number {
    const parsed = parseJson(storedText);
    return typeof parsed === 'number' ? clampHalfPageCount(parsed) : DEFAULT_HALF_PAGES;
}

/**
 * Pure apart from the reader it is given, so the check script can run it under Node
 * with a Map standing in for the browser.
 */
export function parseSavedSettings(readStoredText: StoredTextReader, maximumTopicCount: number): SavedSettings {
    const panelSelections = createDefaultSelections();
    CONFIGURABLE_TOPICS.forEach((topic) => {
        panelSelections[topic] = parsePanelSelection(topic, readStoredText(panelSelectionKey(topic)));
    });
    return {
        selectedTopics: parseSelectedTopics(readStoredText(SELECTED_TOPICS_KEY), maximumTopicCount),
        panelSelections,
        halfPageCount: parseHalfPageCount(readStoredText(HALF_PAGE_COUNT_KEY))
    };
}

// A private window or a stern browser can refuse storage outright. Then nothing was saved.
function readFromLocalStorage(key: string): string | null {
    try {
        return window.localStorage.getItem(key);
    } catch {
        return null;
    }
}

// A refusal costs the user their settings on reload, not their worksheet now
function writeToLocalStorage(key: string, value: unknown): void {
    try {
        window.localStorage.setItem(key, JSON.stringify(value));
    } catch (error: unknown) {
        console.warn(`Could not save ${key}:`, error);
    }
}

export function loadSavedSettings(maximumTopicCount: number): SavedSettings {
    return parseSavedSettings(readFromLocalStorage, maximumTopicCount);
}

export function saveSelectedTopics(selectedTopics: readonly TopicKey[]): void {
    writeToLocalStorage(SELECTED_TOPICS_KEY, selectedTopics);
}

// The panels report a change without naming the topic, and five small writes cost little
export function savePanelSelections(panelSelections: PanelSelections): void {
    CONFIGURABLE_TOPICS.forEach((topic) => {
        writeToLocalStorage(panelSelectionKey(topic), panelSelections[topic]);
    });
}

export function saveHalfPageCount(halfPageCount: number): void {
    writeToLocalStorage(HALF_PAGE_COUNT_KEY, halfPageCount);
}
