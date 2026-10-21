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
        multiplication: describeMultiplication
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
    titleWithLevel: (title, levelTag) => `${title} (${levelTag})`
};
