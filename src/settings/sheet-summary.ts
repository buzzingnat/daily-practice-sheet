import {
    findConfigurableTopic,
    findPanelSpecifications,
    listChoices,
    PanelSelections,
    PanelSpecification
} from './topic-settings';
import { TOPIC_LABELS, TOPIC_SHORT_LABELS, TopicKey } from '../types';

export const NOTHING_CHOSEN_TEXT = 'Nothing chosen yet. Add a topic below.';

// More than this many chosen items are counted rather than listed, so the short line stays short
const MAXIMUM_LISTED_IN_SHORT = 3;

export interface SheetSummary {
    // Whole words, every chosen item named: "Addition: double digit. Hiragana: あ vowels, か k."
    full: string;
    // Abbreviated onto one line: "Add: 2-dig · Hira: あ か"
    short: string;
}

function describePanel(specification: PanelSpecification, selections: PanelSelections, isShort: boolean): string {
    const choices = listChoices(specification);
    const chosen = choices.filter((option) => selections[specification.id].includes(option.value));
    const nameOf = (option: { label: string; shortLabel?: string }): string => {
        return isShort ? option.shortLabel ?? option.label : option.label;
    };

    if (specification.kind === 'single') {
        const option = chosen[0];
        return option ? nameOf(option).toLowerCase() : '';
    } else if (chosen.length === choices.length) {
        return 'all';
    } else if (isShort && chosen.length > MAXIMUM_LISTED_IN_SHORT) {
        return `${chosen.length} ${specification.summaryNoun}`;
    } else {
        return chosen.map(nameOf).join(isShort ? ' ' : ', ');
    }
}

function describeTopic(topic: TopicKey, selections: PanelSelections, isShort: boolean): string {
    const name = isShort ? TOPIC_SHORT_LABELS[topic] : TOPIC_LABELS[topic];
    const configurableTopic = findConfigurableTopic(topic);
    if (!configurableTopic) {
        return name;
    }
    const details = findPanelSpecifications(configurableTopic)
        .map((specification) => describePanel(specification, selections, isShort))
        .filter((detail) => detail !== '');
    return details.length > 0 ? `${name}: ${details.join(isShort ? ' ' : '; ')}` : name;
}

/**
 * Every chosen topic with its settings, in two lengths for the summary bar. Built
 * from the same panel specifications as the card summaries, so the two cannot
 * name different things.
 */
export function describeSheet(selectedTopics: readonly TopicKey[], selections: PanelSelections): SheetSummary {
    if (selectedTopics.length === 0) {
        return { full: NOTHING_CHOSEN_TEXT, short: NOTHING_CHOSEN_TEXT };
    }
    return {
        full: selectedTopics.map((topic) => `${describeTopic(topic, selections, false)}.`).join(' '),
        short: selectedTopics.map((topic) => describeTopic(topic, selections, true)).join(' · ')
    };
}
