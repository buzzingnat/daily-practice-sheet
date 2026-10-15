import { KANA_ROWS, KanaRow } from '../../types';

export interface KanaCard {
    character: string;
    pronunciationHint: string;
}

// Every basic hiragana character, filed by row of the chart. The hints are English
// approximations, as friendly as an approximation can be.
export const KANA_ROW_CARDS: Record<KanaRow, readonly KanaCard[]> = {
    'vowels': [
        { character: 'あ', pronunciationHint: '"a" pronounce "ah", as in father.' },
        { character: 'い', pronunciationHint: '"i" pronounce "ee", as in meet.' },
        { character: 'う', pronunciationHint: '"u" pronounce "oo", as in boot.' },
        { character: 'え', pronunciationHint: '"e" pronounce "eh", as in bet.' },
        { character: 'お', pronunciationHint: '"o" pronounce "oa", as in boat.' }
    ],
    'k': [
        { character: 'か', pronunciationHint: '"ka" pronounce "kah", as in car.' },
        { character: 'き', pronunciationHint: '"ki" pronounce "kee", as in key.' },
        { character: 'く', pronunciationHint: '"ku" pronounce "koo", as in cool.' },
        { character: 'け', pronunciationHint: '"ke" pronounce "keh", as in kelp.' },
        { character: 'こ', pronunciationHint: '"ko" pronounce "koh", as in coat.' }
    ],
    's': [
        { character: 'さ', pronunciationHint: '"sa" pronounce "sah", as in soft.' },
        { character: 'し', pronunciationHint: '"shi" pronounce "shee", as in sheep.' },
        { character: 'す', pronunciationHint: '"su" pronounce "soo", as in soon.' },
        { character: 'せ', pronunciationHint: '"se" pronounce "seh", as in set.' },
        { character: 'そ', pronunciationHint: '"so" pronounce "soh", as in soda.' }
    ],
    't': [
        { character: 'た', pronunciationHint: '"ta" pronounce "tah", as in taco.' },
        { character: 'ち', pronunciationHint: '"chi" pronounce "chee", as in cheese.' },
        { character: 'つ', pronunciationHint: '"tsu" pronounce "tsoo", as in tsunami.' },
        { character: 'て', pronunciationHint: '"te" pronounce "teh", as in ten.' },
        { character: 'と', pronunciationHint: '"to" pronounce "toh", as in toe.' }
    ],
    'n': [
        { character: 'な', pronunciationHint: '"na" pronounce "nah", as in nachos.' },
        { character: 'に', pronunciationHint: '"ni" pronounce "nee", as in needle.' },
        { character: 'ぬ', pronunciationHint: '"nu" pronounce "noo", as in noodle.' },
        { character: 'ね', pronunciationHint: '"ne" pronounce "neh", as in net.' },
        { character: 'の', pronunciationHint: '"no" pronounce "noh", as in nose.' }
    ],
    'h': [
        { character: 'は', pronunciationHint: '"ha" pronounce "hah", as in haha.' },
        { character: 'ひ', pronunciationHint: '"hi" pronounce "hee", as in heat.' },
        { character: 'ふ', pronunciationHint: '"fu" pronounce "foo" or "hoo", as in fool or hula-hoop.' },
        { character: 'へ', pronunciationHint: '"he" pronounce "heh", as in help.' },
        { character: 'ほ', pronunciationHint: '"ho" pronounce "hoh", as in hope.' }
    ],
    'm': [
        { character: 'ま', pronunciationHint: '"ma" pronounce "mah", as in mama.' },
        { character: 'み', pronunciationHint: '"mi" pronounce "mee", as in meet.' },
        { character: 'む', pronunciationHint: '"mu" pronounce "moo", as in mood.' },
        { character: 'め', pronunciationHint: '"me" pronounce "meh", as in mess.' },
        { character: 'も', pronunciationHint: '"mo" pronounce "moh", as in more.' }
    ],
    'y': [
        { character: 'や', pronunciationHint: '"ya" pronounce "yah", as in yacht.' },
        { character: 'ゆ', pronunciationHint: '"yu" pronounce "yoo", as in you.' },
        { character: 'よ', pronunciationHint: '"yo" pronounce "yoh", as in yoga.' }
    ],
    'r': [
        { character: 'ら', pronunciationHint: '"ra" pronounce "rah" or "lah", as in rock or lock.' },
        { character: 'り', pronunciationHint: '"ri" pronounce "ree" or "lee", as in reed or lean.' },
        { character: 'る', pronunciationHint: '"ru" pronounce "roo" or "loo", as in ruin or loop.' },
        { character: 'れ', pronunciationHint: '"re" pronounce "reh" or "leh", as in red or let.' },
        { character: 'ろ', pronunciationHint: '"ro" pronounce "roh" or "loh", as in road or low.' }
    ],
    'wn': [
        { character: 'わ', pronunciationHint: '"wa" pronounce "wah", as in walk.' },
        { character: 'を', pronunciationHint: '"wo" pronounce "oh", as in oak. Ignore the w.' },
        { character: 'ん', pronunciationHint: '"n" pronounce a soft "n", as in sun.' }
    ]
};

/**
 * Every card from the chosen rows, in chart order.
 */
export function listKanaCards(rows: readonly KanaRow[]): KanaCard[] {
    return KANA_ROWS
        .filter((row) => rows.includes(row))
        .flatMap((row) => KANA_ROW_CARDS[row]);
}
