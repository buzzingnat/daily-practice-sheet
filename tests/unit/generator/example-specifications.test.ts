import { describe, expect, test } from 'vitest';
import { buildExampleSpecifications, buildTopicExample } from '../../../src/generator/example-specifications';
import { createDefaultSelections, resolveTopicSettings } from '../../../src/settings/topic-settings';
import { TOPIC_KEYS } from '../../../src/types';

const defaultSettings = resolveTopicSettings(createDefaultSelections());

describe('buildExampleSpecifications', () => {
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

describe('buildTopicExample', () => {
    test('gives every topic a preview, chosen or not', () => {
        const topicsWithoutPreview = TOPIC_KEYS.filter((topic) => {
            return buildTopicExample(topic, defaultSettings) === undefined;
        });
        expect(topicsWithoutPreview).toEqual([]);
    });

    test('matches the first entry buildExampleSpecifications gives for the topic', () => {
        const mismatches = TOPIC_KEYS.filter((topic) => {
            const expected = buildExampleSpecifications([topic], defaultSettings)[0];
            return JSON.stringify(buildTopicExample(topic, defaultSettings)) !== JSON.stringify(expected);
        });
        expect(mismatches).toEqual([]);
    });

    test('gives only the first chosen region for countries', () => {
        const selections = { ...createDefaultSelections(), countries: ['Oceania', 'Africa'] };
        const example = buildTopicExample('countries', resolveTopicSettings(selections));
        expect(example).toMatchObject({ type: 'regionCountry', region: expect.any(String) });
        const all = buildExampleSpecifications(['countries'], resolveTopicSettings(selections));
        expect(example).toEqual(all[0]);
    });
});
