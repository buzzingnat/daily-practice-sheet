import { PanelSelections } from '../settings/topic-settings';
import { TopicKey, TOPIC_LABELS } from '../types';
import { renderTopicSettings } from './topic-settings-panel';

export interface TopicCard {
    element: HTMLElement;
    // Switches the look and shows the topic's settings, or hides them. Does nothing if already so.
    setSelected(isSelected: boolean): void;
    // At the six-topic limit an unselected card cannot be added; it says why.
    setLocked(isLocked: boolean): void;
    setSummary(text: string): void;
    setPreview(canvas: HTMLCanvasElement): void;
}

export interface TopicCardHandlers {
    // The toggle was clicked. The owner flips its own state, then calls setSelected.
    onToggle(): void;
    // A chip or radio inside the card changed the shared selections.
    onSettingsChange(): void;
}

const LOCKED_HINT = 'Remove a topic to add this one';

/**
 * One card per topic: the example on top, then the name with its on/off toggle, a
 * one-line summary, and the settings while the topic is chosen. The card holds no
 * state of its own beyond what is on screen; main.ts owns the choices.
 */
export function createTopicCard(
    topic: TopicKey,
    selections: PanelSelections,
    handlers: TopicCardHandlers
): TopicCard {
    const label = TOPIC_LABELS[topic];
    let isSelected = false;

    const element = document.createElement('article');
    element.classList.add('topic-card');
    element.id = `card-${topic}`;
    element.dataset.topic = topic;

    const previewSlot = document.createElement('div');
    previewSlot.classList.add('topic-preview');
    previewSlot.setAttribute('role', 'img');
    previewSlot.setAttribute('aria-label', `${label} example`);

    const header = document.createElement('div');
    header.classList.add('topic-header');
    const name = document.createElement('h3');
    name.classList.add('topic-name');
    name.textContent = label;
    const toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.classList.add('topic-toggle');
    toggle.setAttribute('aria-label', label);
    toggle.addEventListener('click', handlers.onToggle);
    header.appendChild(name);
    header.appendChild(toggle);

    const summary = document.createElement('p');
    summary.classList.add('topic-summary');
    summary.id = `${topic}-summary`;

    const settingsSlot = document.createElement('div');
    settingsSlot.classList.add('topic-settings');
    settingsSlot.hidden = true;

    const lockedHint = document.createElement('p');
    lockedHint.classList.add('topic-locked-hint');
    lockedHint.textContent = LOCKED_HINT;
    lockedHint.hidden = true;

    element.appendChild(previewSlot);
    element.appendChild(header);
    element.appendChild(summary);
    element.appendChild(settingsSlot);
    element.appendChild(lockedHint);

    const showToggleState = (): void => {
        toggle.setAttribute('aria-pressed', String(isSelected));
        toggle.textContent = isSelected ? 'Added' : 'Add';
        element.classList.toggle('selected', isSelected);
    };
    showToggleState();

    return {
        element,
        setSelected(nextSelected: boolean): void {
            if (nextSelected === isSelected) {
                return;
            }
            isSelected = nextSelected;
            showToggleState();
            if (isSelected) {
                renderTopicSettings(settingsSlot, topic, selections, handlers.onSettingsChange);
            } else {
                settingsSlot.replaceChildren();
            }
            // A topic without settings has nothing to show, so no empty box
            settingsSlot.hidden = settingsSlot.childElementCount === 0;
        },
        setLocked(isLocked: boolean): void {
            const isBlocked = isLocked && !isSelected;
            toggle.disabled = isBlocked;
            lockedHint.hidden = !isBlocked;
            element.classList.toggle('locked', isBlocked);
        },
        setSummary(text: string): void {
            summary.textContent = text;
        },
        setPreview(canvas: HTMLCanvasElement): void {
            previewSlot.replaceChildren(canvas);
        }
    };
}
