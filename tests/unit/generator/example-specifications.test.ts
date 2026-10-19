import { describe, expect, test } from 'vitest';
import { buildExampleSpecifications } from '../../../src/generator/example-specifications';
import { createDefaultSelections, resolveTopicSettings } from '../../../src/settings/topic-settings';
import { TOPIC_KEYS } from '../../../src/types';

const defaultSettings = resolveTopicSettings(createDefaultSelections());

describe('buildExampleSpecifications', () => {
    test('shows the default addition example when addition is chosen', () => {
        expect(buildExampleSpecifications(['addition'], defaultSettings)).toEqual([{ type: 'addition', grade: '1st' }]);
    });

    test('follows the addition level the user picks', () => {
        const selections = { ...createDefaultSelections(), addition: ['3rd'] };
        const settings = resolveTopicSettings(selections);
        expect(buildExampleSpecifications(['addition'], settings)).toEqual([{ type: 'addition', grade: '3rd' }]);
    });

    test('shows only the chosen topics', () => {
        const types = buildExampleSpecifications(['subtraction', 'tellTime'], defaultSettings).map((spec) => spec.type);
        expect(types).toEqual(['subtraction', 'clock']);
    });

    test('shows every topic when none is chosen', () => {
        expect(buildExampleSpecifications([], defaultSettings)).toEqual(
            buildExampleSpecifications(TOPIC_KEYS, defaultSettings)
        );
    });

    test('draws a cursive example from the chosen set, in the chosen layout', () => {
        const selections = { ...createDefaultSelections(), cursiveLetters: ['b-f-o-g'], cursiveLayout: ['two-lines'] };
        const settings = resolveTopicSettings(selections);
        expect(buildExampleSpecifications(['cursiveLetters'], settings)).toEqual([
            { type: 'cursive', letter: 'b', layout: 'two-lines' }
        ]);
    });

    test('shows one country example per chosen region', () => {
        const selections = { ...createDefaultSelections(), countries: ['Africa', 'Oceania'] };
        const settings = resolveTopicSettings(selections);
        const regions = buildExampleSpecifications(['countries'], settings).map((spec) => {
            return spec.type === 'regionCountry' ? spec.region : undefined;
        });
        expect(regions).toEqual(['Africa', 'Oceania']);
    });
});
