import { createDefaultSelections, PanelSelections } from '../../src/settings/topic-settings';
import { GradeLevel } from '../../src/types';

export type LevelTopics = 'fractions' | 'addition' | 'subtraction';

export const LEVEL_TOPICS = ['fractions', 'addition', 'subtraction'] as const;
export const GRADE_LEVELS: readonly GradeLevel[] = ['1st', '2nd', '3rd'];

// Defaults with a few panels changed, the way a human's clicks would leave them
export function selectionsWith(changes: Partial<PanelSelections>): PanelSelections {
    return { ...createDefaultSelections(), ...changes };
}
