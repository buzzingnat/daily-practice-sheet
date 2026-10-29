import {
    CursiveLayoutName,
    GradeLevel,
    KanaRow,
    MultiplicationSettings,
    PanelId,
    PopulatedRegion,
    TopicKey
} from '../types';

// A chip's words in full, and cut short for the compact view and the summary bar
export interface OptionWords {
    label: string;
    shortLabel: string;
}

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
        division: string;
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
        division(level: GradeLevel): string;
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
    ui: {
        // The static page around the cards. The credit's link, a web address, stays in the page itself.
        page: {
            languageCode: string;
            title: string;
            heading: string;
            subheading: string;
            logoAlt: string;
            introduction: string;
            creditBeforeLink: string;
            creditAfterLink: string;
        };
        // How a choice is told back to the person. Functions, so a language may join and punctuate in its own way.
        summary: {
            nothingChosen: string;
            all: string;
            countOf(count: number, noun: string): string;
            joinChoices(items: readonly string[], isShort: boolean): string;
            joinPanels(details: readonly string[], isShort: boolean): string;
            joinButtonPanels(summaries: readonly string[]): string;
            topicLine(name: string, detail: string): string;
            joinTopics(lines: readonly string[], isShort: boolean): string;
        };
        topicCard: {
            add: string;
            added: string;
            lockedHint: string;
            // Read aloud for the picture of the example, which has no text of its own
            exampleLabel(topicName: string): string;
        };
        summaryBar: {
            ariaLabel: string;
            fewerHalfPages: string;
            halfPages: string;
            moreHalfPages: string;
            cardSize: string;
            compactView: string;
            normalView: string;
            growBar: string;
            shrinkBar: string;
            showLess: string;
            showFullSummary: string;
            make: string;
            // The count line: topics chosen of the most allowed, and the pages they fill
            topicsAndPages(topicCount: number, maximumTopicCount: number, pageCount: number): string;
        };
        settings: {
            allChip: string;
            // The noun counts the chosen chips on a button ("3 regions"); panels that choose one thing leave it empty
            panels: Record<PanelId, { heading: string; summaryNoun: string }>;
            additionLevels: Record<GradeLevel, OptionWords>;
            subtractionLevels: Record<GradeLevel, OptionWords>;
            divisionLevels: Record<GradeLevel, OptionWords>;
            fractionLevels: Record<GradeLevel, OptionWords>;
            multiplication: {
                twoDigit: OptionWords;
                upToFive: string;
                upToTwelve: string;
                zeroNeedsCompanion: string;
            };
            kanaRows: Record<KanaRow, OptionWords>;
            cursiveLayouts: Record<CursiveLayoutName, OptionWords>;
            regions: Record<PopulatedRegion, OptionWords>;
        };
    };
    // A title with its level tag, as printed in the quadrant's heading
    titleWithLevel(title: string, levelTag: string): string;
}
