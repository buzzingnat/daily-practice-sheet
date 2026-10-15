import { findConfigurableTopic, findPanelSpecification, PANEL_SPECIFICATIONS, PanelSelections, PanelSpecification } from '../settings/topic-settings';
import { TopicKey } from '../types';

const ALL_CHIP_LABEL = 'All';

/**
 * A group of radio buttons dressed as a segmented control. A radio group
 * cannot be emptied, so the one-must-stay rule comes free.
 */
function buildSingleChoice(
    specification: PanelSpecification,
    selections: PanelSelections,
    onChange: () => void
): HTMLElement {
    const row = document.createElement('div');
    row.classList.add('choice-row');
    const radioName = `setting-${specification.topic}`;

    specification.options.forEach((option) => {
        const segment = document.createElement('label');
        segment.classList.add('segment');

        const radio = document.createElement('input');
        radio.type = 'radio';
        radio.name = radioName;
        radio.value = option.value;
        radio.checked = selections[specification.topic].includes(option.value);
        radio.addEventListener('change', () => {
            selections[specification.topic] = [option.value];
            onChange();
        });

        const text = document.createElement('span');
        text.textContent = option.label;
        segment.appendChild(radio);
        segment.appendChild(text);
        row.appendChild(segment);
    });
    return row;
}

/**
 * A row of toggle chips, plus an All chip where the specification offers one.
 * The last chip standing refuses to be switched off, so the topic always has
 * something to draw. Chips are updated in place, which keeps keyboard focus put.
 */
function buildMultipleChoice(
    specification: PanelSpecification,
    selections: PanelSelections,
    onChange: () => void
): HTMLElement {
    const row = document.createElement('div');
    row.classList.add('choice-row');
    const topic = specification.topic;

    const chipByValue = new Map<string, HTMLButtonElement>();
    let allChip: HTMLButtonElement | undefined;

    const syncChips = (): void => {
        chipByValue.forEach((chip, value) => {
            chip.setAttribute('aria-pressed', String(selections[topic].includes(value)));
        });
        if (allChip) {
            allChip.setAttribute(
                'aria-pressed',
                String(selections[topic].length === specification.options.length)
            );
        }
    };

    const makeChip = (label: string): HTMLButtonElement => {
        const chip = document.createElement('button');
        chip.type = 'button';
        chip.classList.add('chip');
        chip.textContent = label;
        row.appendChild(chip);
        return chip;
    };

    if (specification.offersAll) {
        allChip = makeChip(ALL_CHIP_LABEL);
        allChip.addEventListener('click', () => {
            selections[topic] = specification.options.map((option) => option.value);
            syncChips();
            onChange();
        });
    }

    specification.options.forEach((option) => {
        const chip = makeChip(option.label);
        chipByValue.set(option.value, chip);
        chip.addEventListener('click', () => {
            const isChosen = selections[topic].includes(option.value);
            if (isChosen && selections[topic].length === 1) {
                return;
            }
            selections[topic] = isChosen
                ? selections[topic].filter((value) => value !== option.value)
                : [...selections[topic], option.value];
            syncChips();
            onChange();
        });
    });

    syncChips();
    return row;
}

/**
 * Rebuilds the panels for the selected topics, one fieldset each, in topic order.
 * Topics without settings simply have no panel. The selections object is edited in
 * place, and onChange fires after every edit so summaries can follow.
 */
export function renderSettingsPanels(
    container: HTMLElement,
    selectedTopics: readonly TopicKey[],
    selections: PanelSelections,
    onChange: () => void
): void {
    container.replaceChildren();

    PANEL_SPECIFICATIONS.forEach((specification) => {
        const isSelected = selectedTopics.some((topic) => findConfigurableTopic(topic) === specification.topic);
        if (!isSelected) {
            return;
        }

        const fieldset = document.createElement('fieldset');
        fieldset.classList.add('settings-panel');
        fieldset.id = `settings-${specification.topic}`;

        const legend = document.createElement('legend');
        legend.textContent = findPanelSpecification(specification.topic).heading;
        fieldset.appendChild(legend);

        fieldset.appendChild(specification.kind === 'single'
            ? buildSingleChoice(specification, selections, onChange)
            : buildMultipleChoice(specification, selections, onChange));
        container.appendChild(fieldset);
    });
}
