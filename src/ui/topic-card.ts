import { PanelSelections } from '../settings/topic-settings';
import { TopicKey, ViewMode } from '../types';
import { getMessages } from '../text/messages';
import { renderTopicSettings } from './topic-settings-panel';

export interface TopicCard {
    element: HTMLElement;
    // Switches the look and shows the topic's settings, or hides them. Does nothing if already so.
    setSelected(isSelected: boolean): void;
    // At the six-topic limit an unselected card cannot be added; it says why.
    setLocked(isLocked: boolean): void;
    // Both lengths are kept; the view mode picks which one shows
    setSummary(fullText: string, shortText: string): void;
    // The compact view shows the short name and summary, and keeps the settings out of sight
    setViewMode(viewMode: ViewMode): void;
    // Hands over the example's painter and paints it now. The card repaints it whenever its width changes.
    setPreviewPainter(painter: PreviewPainter): void;
    // Repaints the preview if its width or the screen's density changed since the last paint.
    // The card hears its own width change; a density change (zoom, another monitor) comes from the window.
    repaintPreviewIfResized(): void;
}

// Draws the example on the card's canvas at a width in CSS pixels and a screen density, and says
// whether it managed. The card keeps the painter, so a resize repaints the same example instead
// of rolling a fresh one.
export type PreviewPainter = (canvas: HTMLCanvasElement, displayWidth: number, pixelRatio: number) => boolean;

// A resize repaints once the window holds still; until then CSS stretches the last picture
const RESIZE_SETTLE_MILLISECONDS = 120;

// Widths within half a CSS pixel are the same width; layout wobbles finer than that are not news
const WIDTH_TOLERANCE = 0.5;

export interface TopicCardHandlers {
    // The toggle was clicked. The owner flips its own state, then calls setSelected.
    onToggle(): void;
    // A chip or radio inside the card changed the shared selections.
    onSettingsChange(): void;
}

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
    const messages = getMessages();
    const label = messages.topics[topic].name;
    let isSelected = false;
    let viewMode: ViewMode = 'normal';
    let fullSummary = '';
    let shortSummary = '';

    const element = document.createElement('article');
    element.classList.add('topic-card');
    element.id = `card-${topic}`;
    element.dataset.topic = topic;

    const previewSlot = document.createElement('div');
    previewSlot.classList.add('topic-preview');
    previewSlot.setAttribute('role', 'img');
    previewSlot.setAttribute('aria-label', messages.ui.topicCard.exampleLabel(label));

    const previewCanvas = document.createElement('canvas');
    let previewPainter: PreviewPainter | null = null;
    let paintedWidth = 0;
    let paintedPixelRatio = 0;
    let resizeTimer: number | undefined;

    // The slot has no padding, border or transform, so its box is the canvas's box, fractions and
    // all. clientWidth would round, and a rounded width resamples a little.
    function measurePreviewWidth(): number {
        return previewSlot.getBoundingClientRect().width;
    }

    function currentPixelRatio(): number {
        return window.devicePixelRatio || 1;
    }

    function paintPreview(): void {
        const displayWidth = measurePreviewWidth();
        if (!previewPainter || displayWidth === 0) {
            return;
        }
        const pixelRatio = currentPixelRatio();
        if (previewPainter(previewCanvas, displayWidth, pixelRatio)) {
            if (previewCanvas.parentElement !== previewSlot) {
                previewSlot.replaceChildren(previewCanvas);
            }
            paintedWidth = displayWidth;
            paintedPixelRatio = pixelRatio;
        }
    }

    function repaintPreviewIfResized(): void {
        window.clearTimeout(resizeTimer);
        const isSameSize = Math.abs(measurePreviewWidth() - paintedWidth) < WIDTH_TOLERANCE
            && currentPixelRatio() === paintedPixelRatio;
        if (isSameSize) {
            return;
        }
        // The first picture goes up at once; later ones wait for the window to hold still
        const delay = paintedWidth === 0 ? 0 : RESIZE_SETTLE_MILLISECONDS;
        resizeTimer = window.setTimeout(paintPreview, delay);
    }

    // Window resizes, the compact view and the grid reflowing all reach the card as a new width.
    // A jsdom test page has no ResizeObserver, and no screen to be sharp on.
    if (typeof ResizeObserver !== 'undefined') {
        new ResizeObserver(repaintPreviewIfResized).observe(previewSlot);
    }

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
    lockedHint.textContent = messages.ui.topicCard.lockedHint;
    lockedHint.hidden = true;

    element.appendChild(previewSlot);
    element.appendChild(header);
    element.appendChild(summary);
    element.appendChild(settingsSlot);
    element.appendChild(lockedHint);

    const showToggleState = (): void => {
        toggle.setAttribute('aria-pressed', String(isSelected));
        toggle.textContent = isSelected ? messages.ui.topicCard.added : messages.ui.topicCard.add;
        element.classList.toggle('selected', isSelected);
    };
    showToggleState();

    const showTexts = (): void => {
        const isCompact = viewMode === 'compact';
        name.textContent = isCompact ? getMessages().topics[topic].shortName : label;
        summary.textContent = isCompact ? shortSummary : fullSummary;
    };

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
        setSummary(fullText: string, shortText: string): void {
            fullSummary = fullText;
            shortSummary = shortText;
            showTexts();
        },
        setViewMode(nextViewMode: ViewMode): void {
            viewMode = nextViewMode;
            element.classList.toggle('compact', viewMode === 'compact');
            showTexts();
        },
        setPreviewPainter(painter: PreviewPainter): void {
            previewPainter = painter;
            paintPreview();
        },
        repaintPreviewIfResized
    };
}
