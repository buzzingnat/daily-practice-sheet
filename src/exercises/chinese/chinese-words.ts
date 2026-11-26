import { CHINESE_GROUPS, ChineseGroup, ChineseScope } from '../../types';

export interface ChineseWord {
    // Simplified characters
    readonly characters: string;
    // The pinyin as a teacher writes the word, tone marks and spaces included
    readonly pinyin: string;
    // One syllable per character, as it sounds inside this word
    readonly syllables: readonly string[];
    // English, for the child and for the parent who does not read Chinese
    readonly meaning: string;
}

export interface ChineseCharacterCard {
    readonly character: string;
    // The character said on its own, as a dictionary gives it
    readonly pinyin: string;
    // The word it first appears in, printed beside it as context
    readonly word: ChineseWord;
}

export interface ChinesePracticeCards {
    // The chosen group's new characters, which a sheet leans toward
    newest: readonly ChineseCharacterCard[];
    // Every earlier group's characters, for review; empty when there is nothing behind
    review: readonly ChineseCharacterCard[];
}

// The word list, group by group, in the order the settings offer the groups
export const CHINESE_WORDS: Readonly<Record<ChineseGroup, readonly ChineseWord[]>> = {
    numbers: [
        { characters: '一', pinyin: 'yī', syllables: ['yī'], meaning: 'one' },
        { characters: '二', pinyin: 'èr', syllables: ['èr'], meaning: 'two' },
        { characters: '三', pinyin: 'sān', syllables: ['sān'], meaning: 'three' },
        { characters: '四', pinyin: 'sì', syllables: ['sì'], meaning: 'four' },
        { characters: '五', pinyin: 'wǔ', syllables: ['wǔ'], meaning: 'five' },
        { characters: '六', pinyin: 'liù', syllables: ['liù'], meaning: 'six' },
        { characters: '七', pinyin: 'qī', syllables: ['qī'], meaning: 'seven' },
        { characters: '八', pinyin: 'bā', syllables: ['bā'], meaning: 'eight' },
        { characters: '九', pinyin: 'jiǔ', syllables: ['jiǔ'], meaning: 'nine' },
        { characters: '十', pinyin: 'shí', syllables: ['shí'], meaning: 'ten' }
    ],
    describing: [
        { characters: '大', pinyin: 'dà', syllables: ['dà'], meaning: 'big' },
        { characters: '小', pinyin: 'xiǎo', syllables: ['xiǎo'], meaning: 'small' },
        { characters: '好', pinyin: 'hǎo', syllables: ['hǎo'], meaning: 'good' },
        { characters: '坏', pinyin: 'huài', syllables: ['huài'], meaning: 'bad' },
        { characters: '多', pinyin: 'duō', syllables: ['duō'], meaning: 'many' },
        { characters: '少', pinyin: 'shǎo', syllables: ['shǎo'], meaning: 'few' }
    ],
    family: [
        { characters: '爸爸', pinyin: 'bàba', syllables: ['bà', 'ba'], meaning: 'dad' },
        { characters: '妈妈', pinyin: 'māma', syllables: ['mā', 'ma'], meaning: 'mom' },
        { characters: '哥哥', pinyin: 'gēge', syllables: ['gē', 'ge'], meaning: 'older brother' },
        { characters: '姐姐', pinyin: 'jiějie', syllables: ['jiě', 'jie'], meaning: 'older sister' },
        { characters: '弟弟', pinyin: 'dìdi', syllables: ['dì', 'di'], meaning: 'younger brother' },
        { characters: '妹妹', pinyin: 'mèimei', syllables: ['mèi', 'mei'], meaning: 'younger sister' },
        { characters: '爷爷', pinyin: 'yéye', syllables: ['yé', 'ye'], meaning: 'grandpa' },
        { characters: '奶奶', pinyin: 'nǎinai', syllables: ['nǎi', 'nai'], meaning: 'grandma' }
    ],
    pronouns: [
        { characters: '我', pinyin: 'wǒ', syllables: ['wǒ'], meaning: 'I, me' },
        { characters: '你', pinyin: 'nǐ', syllables: ['nǐ'], meaning: 'you' },
        { characters: '他', pinyin: 'tā', syllables: ['tā'], meaning: 'he' },
        { characters: '她', pinyin: 'tā', syllables: ['tā'], meaning: 'she' }
    ],
    greetings: [
        { characters: '你好', pinyin: 'nǐ hǎo', syllables: ['nǐ', 'hǎo'], meaning: 'hello' },
        { characters: '谢谢', pinyin: 'xièxie', syllables: ['xiè', 'xie'], meaning: 'thank you' },
        { characters: '再见', pinyin: 'zàijiàn', syllables: ['zài', 'jiàn'], meaning: 'goodbye' },
        { characters: '请', pinyin: 'qǐng', syllables: ['qǐng'], meaning: 'please' }
    ],
    verbs: [
        { characters: '是', pinyin: 'shì', syllables: ['shì'], meaning: 'to be' },
        { characters: '有', pinyin: 'yǒu', syllables: ['yǒu'], meaning: 'to have' },
        { characters: '吃', pinyin: 'chī', syllables: ['chī'], meaning: 'to eat' },
        { characters: '喝', pinyin: 'hē', syllables: ['hē'], meaning: 'to drink' },
        { characters: '去', pinyin: 'qù', syllables: ['qù'], meaning: 'to go' },
        { characters: '喜欢', pinyin: 'xǐhuan', syllables: ['xǐ', 'huan'], meaning: 'to like' }
    ],
    things: [
        { characters: '水', pinyin: 'shuǐ', syllables: ['shuǐ'], meaning: 'water' },
        { characters: '书', pinyin: 'shū', syllables: ['shū'], meaning: 'book' },
        { characters: '桌子', pinyin: 'zhuōzi', syllables: ['zhuō', 'zi'], meaning: 'table' },
        { characters: '椅子', pinyin: 'yǐzi', syllables: ['yǐ', 'zi'], meaning: 'chair' },
        { characters: '苹果', pinyin: 'píngguǒ', syllables: ['píng', 'guǒ'], meaning: 'apple' },
        { characters: '玩具', pinyin: 'wánjù', syllables: ['wán', 'jù'], meaning: 'toy' }
    ],
    colors: [
        { characters: '红色', pinyin: 'hóngsè', syllables: ['hóng', 'sè'], meaning: 'red' },
        { characters: '蓝色', pinyin: 'lánsè', syllables: ['lán', 'sè'], meaning: 'blue' },
        { characters: '黄色', pinyin: 'huángsè', syllables: ['huáng', 'sè'], meaning: 'yellow' },
        { characters: '绿色', pinyin: 'lǜsè', syllables: ['lǜ', 'sè'], meaning: 'green' },
        { characters: '白色', pinyin: 'báisè', syllables: ['bái', 'sè'], meaning: 'white' },
        { characters: '黑色', pinyin: 'hēisè', syllables: ['hēi', 'sè'], meaning: 'black' }
    ],
    questions: [
        { characters: '什么', pinyin: 'shénme', syllables: ['shén', 'me'], meaning: 'what' },
        { characters: '谁', pinyin: 'shéi', syllables: ['shéi'], meaning: 'who' },
        { characters: '哪里', pinyin: 'nǎlǐ', syllables: ['nǎ', 'lǐ'], meaning: 'where' },
        { characters: '什么时候', pinyin: 'shénme shíhou', syllables: ['shén', 'me', 'shí', 'hou'], meaning: 'when' },
        { characters: '为什么', pinyin: 'wèishénme', syllables: ['wèi', 'shén', 'me'], meaning: 'why' },
        { characters: '怎么', pinyin: 'zěnme', syllables: ['zěn', 'me'], meaning: 'how' }
    ]
};

// A character first met as an unstressed second syllable has a dictionary tone its word hides.
// Flagged for a Chinese speaker to confirm before printing (the progress.md ledger lists them).
const DICTIONARY_PINYIN: Readonly<Record<string, string>> = {
    '子': 'zǐ',
    '欢': 'huān',
    '候': 'hòu'
};

/**
 * A word must have one syllable per character, and its syllables must spell its pinyin, or a card
 * would print a reading that belongs to a neighbor. Checked as the list loads, so a typo stops the app
 * at once instead of printing.
 */
function checkSyllables(word: ChineseWord): void {
    const characterCount = Array.from(word.characters).length;
    const spelled = word.syllables.join('');
    const written = word.pinyin.split(' ').join('');
    if (word.syllables.length !== characterCount || spelled !== written) {
        throw new Error(`The word ${word.characters} has syllables that do not spell its pinyin ${word.pinyin}.`);
    }
}

/**
 * Every character, filed under the group where it first appears and in the order it appears there.
 * A character met again later (good, in hello) is review by then, not news.
 */
function fileCardsByGroup(): ReadonlyMap<ChineseGroup, readonly ChineseCharacterCard[]> {
    const filed = new Map<ChineseGroup, ChineseCharacterCard[]>();
    const seen = new Set<string>();
    CHINESE_GROUPS.forEach((group) => {
        const cards: ChineseCharacterCard[] = [];
        CHINESE_WORDS[group].forEach((word) => {
            checkSyllables(word);
            Array.from(word.characters).forEach((character, index) => {
                if (seen.has(character)) {
                    return;
                }
                seen.add(character);
                const pinyin = DICTIONARY_PINYIN[character] ?? word.syllables[index];
                if (pinyin === undefined) {
                    throw new Error(`The word ${word.characters} has no syllable for its character number ${index + 1}.`);
                }
                cards.push({ character, pinyin, word });
            });
        });
        filed.set(group, cards);
    });
    return filed;
}

const CARDS_BY_GROUP = fileCardsByGroup();

// The characters a group introduces, in the order its words bring them
export function listChineseCharacterCards(group: ChineseGroup): readonly ChineseCharacterCard[] {
    const cards = CARDS_BY_GROUP.get(group);
    if (cards === undefined) {
        throw new Error(`No Chinese characters are filed under ${group}.`);
    }
    return cards;
}

/**
 * What a sheet practices for a chosen group: its new characters, and, when the scope reaches back,
 * every earlier group's characters for review.
 */
export function listChinesePracticeCards(group: ChineseGroup, scope: ChineseScope): ChinesePracticeCards {
    const groupIndex = CHINESE_GROUPS.indexOf(group);
    const review = scope === 'up-to'
        ? CHINESE_GROUPS.slice(0, groupIndex).flatMap((earlierGroup) => listChineseCharacterCards(earlierGroup))
        : [];
    return { newest: listChineseCharacterCards(group), review };
}
