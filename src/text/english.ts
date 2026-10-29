import { GradeLevel, MultiplicationSettings } from '../types';
import { MessageCatalog } from './message-catalog';

const DIGIT_TAGS: Record<GradeLevel, string> = { '1st': 'Single Digit', '2nd': 'Double Digit', '3rd': 'Triple Digit' };

/**
 * A long list of chosen numbers would overflow the quadrant, so an unbroken run is shown by its ends
 * and anything else as mixed.
 */
function describeMultiplication(settings: MultiplicationSettings): string {
    if (settings.mode === 'two-digit') {
        return 'Two Digit';
    }
    const smallest = settings.factors[0] ?? 0;
    const largest = settings.factors[settings.factors.length - 1] ?? 0;
    if (settings.factors.length === 1) {
        return `${smallest} Table`;
    } else if (largest - smallest + 1 === settings.factors.length) {
        return `${smallest} to ${largest}`;
    } else {
        return 'Mixed';
    }
}

export const english: MessageCatalog = {
    topics: {
        fractions: { name: 'Fractions', shortName: 'Frac' },
        addition: { name: 'Addition', shortName: 'Add' },
        subtraction: { name: 'Subtraction', shortName: 'Sub' },
        multiplication: { name: 'Multiplication', shortName: 'Mult' },
        division: { name: 'Division', shortName: 'Div' },
        setTime: { name: 'Setting time', shortName: 'Set' },
        tellTime: { name: 'Telling time', shortName: 'Tell' },
        hiragana: { name: 'Hiragana', shortName: 'Hira' },
        cursiveLetters: { name: 'Cursive letters', shortName: 'Cur' },
        continents: { name: 'Continents', shortName: 'Cont' },
        countries: { name: 'Countries', shortName: 'Ctry' }
    },
    exerciseTitles: {
        fractions: 'FRACTIONS',
        addition: 'ADDITION',
        subtraction: 'SUBTRACTION',
        multiplication: 'MULTIPLICATION',
        division: 'DIVISION',
        settingTime: 'SETTING TIME',
        tellingTime: 'TELLING TIME',
        hiragana: 'HIRAGANA PRACTICE',
        cursive: 'CURSIVE',
        continents: 'NAME THIS CONTINENT',
        countries: 'NAME THIS COUNTRY'
    },
    levelTags: {
        addition: (level) => DIGIT_TAGS[level],
        subtraction: (level) => (level === '1st' ? 'Up to 20' : DIGIT_TAGS[level]),
        fractions: (level) => ({ '1st': 'Up to Quarters', '2nd': 'Up to Eighths', '3rd': 'Up to Twelfths' })[level],
        multiplication: describeMultiplication,
        division: (level) => ({ '1st': 'Facts to 5', '2nd': 'Facts to 12', '3rd': 'Triple Digit' })[level]
    },
    worksheet: {
        nameLine: 'Name: ___________________________',
        dateLine: 'Date: __________________',
        answerKey: 'ANSWER KEY',
        // Seven cheers against eight animals: no pair of animal and cheer repeats until 56 half-pages have gone by
        cheers: [
            'You can do it!',
            'Great job!',
            'Keep going!',
            'Nice work!',
            'You are a star!',
            'Almost there!',
            'Super thinking!'
        ],
        answerKeyCheer: 'Check your work!',
        continentAnswerLabel: 'Continent:',
        countryAnswerLabel: 'Country:'
    },
    ui: {
        page: {
            languageCode: 'en',
            title: 'Daily Practice Sheet Generator',
            heading: 'Daily Practice Sheet',
            subheading: 'A generator for worksheet printables',
            logoAlt: 'Daily Practice Sheet Logo',
            introduction: 'Select up to six topics below. Choose how many half-pages to print. Each half-page mixes the selected topics across its quadrants.',
            creditBeforeLink: 'spratth c 2026 \u00b7 Animal illustrations from ',
            creditAfterLink: ' (CC0)'
        },
        summary: {
            nothingChosen: 'Nothing chosen yet. Add a topic below.',
            all: 'all',
            countOf: (count, noun) => `${count} ${noun}`,
            joinChoices: (items, isShort) => items.join(isShort ? ' ' : ', '),
            joinPanels: (details, isShort) => details.join(isShort ? ' ' : '; '),
            joinButtonPanels: (summaries) => summaries.join(', '),
            topicLine: (name, detail) => `${name}: ${detail}`,
            joinTopics: (lines, isShort) => (isShort ? lines.join(' · ') : lines.map((line) => `${line}.`).join(' '))
        },
        topicCard: {
            add: 'Add',
            added: 'Added',
            lockedHint: 'Remove a topic to add this one',
            exampleLabel: (topicName) => `${topicName} example`
        },
        summaryBar: {
            ariaLabel: 'Your sheet',
            fewerHalfPages: 'One fewer half-page',
            halfPages: 'Half-pages',
            moreHalfPages: 'One more half-page',
            cardSize: 'Card size',
            compactView: 'Compact view',
            normalView: 'Normal view',
            growBar: 'Grow the bar',
            shrinkBar: 'Shrink the bar',
            showLess: 'Show less',
            showFullSummary: 'Show full summary',
            make: 'Make',
            topicsAndPages: (topicCount, maximumTopicCount, pageCount) => {
                return `${topicCount} of ${maximumTopicCount} topics - ${pageCount} ${pageCount === 1 ? 'page' : 'pages'}`;
            }
        },
        settings: {
            allChip: 'All',
            panels: {
                fractions: { heading: 'Fractions', summaryNoun: '' },
                addition: { heading: 'Addition', summaryNoun: '' },
                subtraction: { heading: 'Subtraction', summaryNoun: '' },
                multiplication: { heading: 'Multiplication', summaryNoun: 'numbers' },
                division: { heading: 'Division', summaryNoun: '' },
                hiragana: { heading: 'Hiragana rows', summaryNoun: 'rows' },
                cursiveLetters: { heading: 'Cursive letters: sets', summaryNoun: 'sets' },
                cursiveLayout: { heading: 'Cursive letters: practice lines', summaryNoun: '' },
                countries: { heading: 'Countries: regions', summaryNoun: 'regions' }
            },
            additionLevels: {
                '1st': { label: 'Single digit', shortLabel: '1-dig' },
                '2nd': { label: 'Double digit', shortLabel: '2-dig' },
                '3rd': { label: 'Triple digit', shortLabel: '3-dig' }
            },
            subtractionLevels: {
                '1st': { label: 'Up to 20', shortLabel: 'To 20' },
                '2nd': { label: 'Double digit', shortLabel: '2-dig' },
                '3rd': { label: 'Triple digit', shortLabel: '3-dig' }
            },
            divisionLevels: {
                '1st': { label: 'Facts to 5', shortLabel: 'To 5' },
                '2nd': { label: 'Facts to 12', shortLabel: 'To 12' },
                '3rd': { label: 'Triple digit', shortLabel: '3-dig' }
            },
            fractionLevels: {
                '1st': { label: 'Up to fourths', shortLabel: 'To 4ths' },
                '2nd': { label: 'Up to eighths', shortLabel: 'To 8ths' },
                '3rd': { label: 'Up to twelfths', shortLabel: 'To 12ths' }
            },
            multiplication: {
                twoDigit: { label: 'Two digit', shortLabel: '2-dig' },
                upToFive: 'Up to 5',
                upToTwelve: 'Up to 12',
                zeroNeedsCompanion: 'Zero cannot be the only number chosen. Choose at least one other number first.'
            },
            kanaRows: {
                vowels: { label: 'あ vowels', shortLabel: 'あ' },
                k: { label: 'か k', shortLabel: 'か' },
                s: { label: 'さ s', shortLabel: 'さ' },
                t: { label: 'た t', shortLabel: 'た' },
                n: { label: 'な n', shortLabel: 'な' },
                h: { label: 'は h', shortLabel: 'は' },
                m: { label: 'ま m', shortLabel: 'ま' },
                y: { label: 'や y', shortLabel: 'や' },
                r: { label: 'ら r', shortLabel: 'ら' },
                wn: { label: 'わ w + n', shortLabel: 'わ' }
            },
            cursiveLayouts: {
                'one-large-line': { label: 'One large line', shortLabel: '1 line' },
                'two-lines': { label: 'Two lines', shortLabel: '2 lines' }
            },
            regions: {
                'Africa': { label: 'Africa', shortLabel: 'Afr' },
                'Asia': { label: 'Asia', shortLabel: 'Asia' },
                'Central America': { label: 'Central America', shortLabel: 'C.Am' },
                'Europe': { label: 'Europe', shortLabel: 'Eur' },
                'North America': { label: 'North America', shortLabel: 'N.Am' },
                'Oceania': { label: 'Oceania', shortLabel: 'Oce' },
                'South America': { label: 'South America', shortLabel: 'S.Am' }
            }
        }
    },
    titleWithLevel: (title, levelTag) => `${title} (${levelTag})`
};
