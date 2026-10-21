import { GradeLevel, MultiplicationSettings, TopicKey } from '../types';

/**
 * Every word a person reads, for one language. Code names things by id (`TopicKey`, the specification
 * `type`); the words live here and are looked up when drawn. A language that leaves a string out does
 * not compile, which is how a translator finds the gaps.
 */
export interface MessageCatalog {
    // What a person reads on a topic card, and the same cut short for the compact view and the summary bar
    topics: Record<TopicKey, { name: string; shortName: string }>;
    // The heading printed on each exercise, named by what the exercise is
    exerciseTitles: {
        fractions: string;
        addition: string;
        subtraction: string;
        multiplication: string;
        settingTime: string;
        tellingTime: string;
        hiragana: string;
        cursive: string;
        continents: string;
        countries: string;
    };
    // The tag after a title that says how hard the problems are. Functions, so a language may order its words as it likes.
    levelTags: {
        addition(level: GradeLevel): string;
        subtraction(level: GradeLevel): string;
        fractions(level: GradeLevel): string;
        multiplication(settings: MultiplicationSettings): string;
    };
    worksheet: {
        // The blanks are part of the string, since a language may want different lengths
        nameLine: string;
        dateLine: string;
        answerKey: string;
        // Printed in the speech bubble. The list must not be empty; the mascot cycles through it by half-page number.
        cheers: readonly string[];
        answerKeyCheer: string;
        continentAnswerLabel: string;
        countryAnswerLabel: string;
    };
    // A title with its level tag, as printed in the quadrant's heading
    titleWithLevel(title: string, levelTag: string): string;
}
