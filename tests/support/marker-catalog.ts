import { TOPIC_KEYS } from '../../src/types';
import { MessageCatalog } from '../../src/text/message-catalog';
import { english } from '../../src/text/english';

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
            multiplication: (settings) => `level:multiplication:${settings.mode}`
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
        titleWithLevel: (title, levelTag) => `${title}|${levelTag}`
    };
}
