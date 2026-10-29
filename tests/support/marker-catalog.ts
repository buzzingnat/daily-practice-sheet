import { CURSIVE_LAYOUT_NAMES, KANA_ROWS, PANEL_IDS, POPULATED_REGIONS, TOPIC_KEYS } from '../../src/types';
import { MessageCatalog, OptionWords } from '../../src/text/message-catalog';
import { english } from '../../src/text/english';

function markOptions<Key extends string>(group: string, keys: readonly Key[]): Record<Key, OptionWords> {
    return Object.fromEntries(
        keys.map((key) => [key, { label: `option:${group}:${key}`, shortLabel: `short:${group}:${key}` }])
    ) as Record<Key, OptionWords>;
}

/**
 * A made-up language in which every string says where it came from ("title:addition", "level:addition").
 * Exercises drawn in it show whether any English is still hard-coded.
 */
export function createMarkerCatalog(): MessageCatalog {
    const exerciseTitles = Object.fromEntries(
        Object.keys(english.exerciseTitles).map((key) => [key, `title:${key}`])
    ) as MessageCatalog['exerciseTitles'];
    return {
        topics: Object.fromEntries(
            TOPIC_KEYS.map((topic) => [topic, { name: `name:${topic}`, shortName: `short:${topic}` }])
        ) as MessageCatalog['topics'],
        exerciseTitles,
        levelTags: {
            addition: (level) => `level:addition:${level}`,
            subtraction: (level) => `level:subtraction:${level}`,
            fractions: (level) => `level:fractions:${level}`,
            multiplication: (settings) => `level:multiplication:${settings.mode}`,
            division: (level) => `level:division:${level}`
        },
        worksheet: {
            nameLine: 'worksheet:nameLine',
            dateLine: 'worksheet:dateLine',
            answerKey: 'worksheet:answerKey',
            cheers: ['worksheet:cheer'],
            answerKeyCheer: 'worksheet:answerKeyCheer',
            continentAnswerLabel: 'worksheet:continentAnswerLabel',
            countryAnswerLabel: 'worksheet:countryAnswerLabel'
        },
        ui: {
            page: {
                languageCode: 'xx',
                title: 'ui:title',
                heading: 'ui:heading',
                subheading: 'ui:subheading',
                logoAlt: 'ui:logoAlt',
                introduction: 'ui:introduction',
                creditBeforeLink: 'ui:creditBeforeLink',
                creditAfterLink: 'ui:creditAfterLink'
            },
            summary: {
                nothingChosen: 'summary:nothingChosen',
                all: 'summary:all',
                countOf: (count, noun) => `summary:count:${count}:${noun}`,
                joinChoices: (items, isShort) => `summary:choices:${isShort}:${items.join('+')}`,
                joinPanels: (details, isShort) => `summary:panels:${isShort}:${details.join('+')}`,
                joinButtonPanels: (summaries) => `summary:buttonPanels:${summaries.join('+')}`,
                topicLine: (name, detail) => `summary:topic:${name}:${detail}`,
                joinTopics: (lines, isShort) => `summary:topics:${isShort}:${lines.join('+')}`
            },
            topicCard: {
                add: 'card:add',
                added: 'card:added',
                lockedHint: 'card:lockedHint',
                exampleLabel: (topicName) => `card:example:${topicName}`
            },
            summaryBar: {
                ariaLabel: 'bar:ariaLabel',
                fewerHalfPages: 'bar:fewerHalfPages',
                halfPages: 'bar:halfPages',
                moreHalfPages: 'bar:moreHalfPages',
                cardSize: 'bar:cardSize',
                compactView: 'bar:compactView',
                normalView: 'bar:normalView',
                growBar: 'bar:growBar',
                shrinkBar: 'bar:shrinkBar',
                showLess: 'bar:showLess',
                showFullSummary: 'bar:showFullSummary',
                make: 'bar:make',
                topicsAndPages: (topicCount, maximumTopicCount, pageCount) => `bar:count:${topicCount}:${maximumTopicCount}:${pageCount}`
            },
            settings: {
                allChip: 'ui:allChip',
                panels: Object.fromEntries(
                    PANEL_IDS.map((panel) => [panel, { heading: `heading:${panel}`, summaryNoun: `noun:${panel}` }])
                ) as MessageCatalog['ui']['settings']['panels'],
                additionLevels: markOptions('addition', ['1st', '2nd', '3rd']),
                subtractionLevels: markOptions('subtraction', ['1st', '2nd', '3rd']),
                divisionLevels: markOptions('division', ['1st', '2nd', '3rd']),
                fractionLevels: markOptions('fractions', ['1st', '2nd', '3rd']),
                multiplication: {
                    twoDigit: { label: 'option:multiplication:two-digit', shortLabel: 'short:multiplication:two-digit' },
                    upToFive: 'preset:upToFive',
                    upToTwelve: 'preset:upToTwelve',
                    zeroNeedsCompanion: 'ui:zeroNeedsCompanion'
                },
                kanaRows: markOptions('hiragana', KANA_ROWS),
                cursiveLayouts: markOptions('cursiveLayout', CURSIVE_LAYOUT_NAMES),
                regions: markOptions('countries', POPULATED_REGIONS)
            }
        },
        titleWithLevel: (title, levelTag) => `${title}|${levelTag}`
    };
}
