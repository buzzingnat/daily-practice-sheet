import {
    findConfigurableTopic,
    findPanelSpecification,
    isChipBlocked,
    isPresetSelected,
    PANEL_SPECIFICATIONS,
    PanelSelections,
    PanelSpecification,
    toggleOption
} from '../settings/topic-settings';
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
    const radioName = `setting-${specification.id}`;

    specification.options.forEach((option) => {
        const segment = document.createElement('label');
        segment.classList.add('segment');

        const radio = document.createElement('input');
        radio.type = 'radio';
        radio.name = radioName;
        radio.value = option.value;
        radio.checked = selections[specification.id].includes(option.value);
        radio.addEventListener('change', () => {
            selections[specification.id] = [option.value];
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
 * A row of toggle chips, plus an All chip and preset chips where the specification
 * offers them. The last chip standing refuses to be switched off, so the topic always
 * has something to draw. Chips are updated in place, which keeps keyboard focus put.
 */
function buildMultipleChoice(
    specification: PanelSpecification,
    selections: PanelSelections,
    onChange: () => void
): HTMLElement {
    const container = document.createElement('div');
    const row = document.createElement('div');
    row.classList.add('choice-row');
    container.appendChild(row);
    const errorMessage = document.createElement('p');
    errorMessage.classList.add('settings-error');
    errorMessage.setAttribute('role', 'alert');
    errorMessage.hidden = true;
    container.appendChild(errorMessage);
    const panelId = specification.id;

    const chipByValue = new Map<string, HTMLButtonElement>();
    let allChip: HTMLButtonElement | undefined;
    const presetChips: { chip: HTMLButtonElement; values: readonly string[] }[] = [];

    const showRefusal = (message: string | undefined): void => {
        errorMessage.textContent = message ?? '';
        errorMessage.hidden = message === undefined;
    };

    // A blocked chip stays clickable, so a click can explain why it does nothing
    const syncChips = (): void => {
        chipByValue.forEach((chip, value) => {
            chip.setAttribute('aria-pressed', String(selections[panelId].includes(value)));
            chip.setAttribute('aria-disabled', String(isChipBlocked(specification, selections[panelId], value)));
        });
        if (allChip) {
            allChip.setAttribute(
                'aria-pressed',
                String(selections[panelId].length === specification.options.length)
            );
        }
        presetChips.forEach(({ chip, values }) => {
            chip.setAttribute('aria-pressed', String(isPresetSelected({ label: '', values }, selections[panelId])));
        });
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
            selections[panelId] = specification.options.map((option) => option.value);
            showRefusal(undefined);
            syncChips();
            onChange();
        });
    }

    specification.options.forEach((option) => {
        const chip = makeChip(option.label);
        chipByValue.set(option.value, chip);
        chip.addEventListener('click', () => {
            const result = toggleOption(specification, selections[panelId], option.value);
            selections[panelId] = result.selection;
            showRefusal(result.refusal);
            syncChips();
            onChange();
        });
    });

    (specification.presets ?? []).forEach((preset) => {
        const chip = makeChip(preset.label);
        presetChips.push({ chip, values: preset.values });
        chip.addEventListener('click', () => {
            selections[panelId] = [...preset.values];
            showRefusal(undefined);
            syncChips();
            onChange();
        });
    });

    const exclusiveOption = specification.exclusiveOption;
    if (exclusiveOption) {
        const chip = makeChip(exclusiveOption.label);
        chipByValue.set(exclusiveOption.value, chip);
        chip.addEventListener('click', () => {
            const result = toggleOption(specification, selections[panelId], exclusiveOption.value);
            selections[panelId] = result.selection;
            showRefusal(result.refusal);
            syncChips();
            onChange();
        });
    }

    syncChips();
    return container;
}

function buildPanelFieldset(
    specification: PanelSpecification,
    selections: PanelSelections,
    onChange: () => void
): HTMLElement {
    const fieldset = document.createElement('fieldset');
    fieldset.classList.add('settings-panel');
    fieldset.id = `settings-${specification.id}`;

    const legend = document.createElement('legend');
    legend.textContent = findPanelSpecification(specification.id).heading;
    fieldset.appendChild(legend);

    fieldset.appendChild(specification.kind === 'single'
        ? buildSingleChoice(specification, selections, onChange)
        : buildMultipleChoice(specification, selections, onChange));
    return fieldset;
}

/**
 * Rebuilds the panels of a single topic, for its card. A topic without settings
 * leaves the container empty.
 */
export function renderTopicSettings(
    container: HTMLElement,
    topic: TopicKey,
    selections: PanelSelections,
    onChange: () => void
): void {
    container.replaceChildren();
    const configurableTopic = findConfigurableTopic(topic);
    PANEL_SPECIFICATIONS.forEach((specification) => {
        if (specification.topic === configurableTopic) {
            container.appendChild(buildPanelFieldset(specification, selections, onChange));
        }
    });
}
