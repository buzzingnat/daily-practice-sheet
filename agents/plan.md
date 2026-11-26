# plan.md

Plan: Chinese characters, part 1 of 4 (shared word pool, group selection, and a character tracing exercise). Written 2026-11-25; approved by the human 2026-11-26, to be built on the branch `chinese-characters` with the same step workflow as the Quicksand change (section 8). `plan-division.md` is older and unrelated.

**Comes after the Quicksand change** (merged 2026-11-26), so this layout is measured against Quicksand Medium. This plan also writes the pinyin display helper that AGENTS.md's Typography Limits describe (`text/pinyin-display.ts`: ü with a tone assembled from u, U+0308 and a tone mark, since Quicksand lacks the single characters), and uses it wherever pinyin is drawn on a canvas or shown on the page. Pinyin is never drawn as jsPDF text.

Prose names characters by pinyin and English, because the human does not read Chinese. Characters appear only in the data appendix, each beside its pinyin and meaning.

## 0. The four parts (each gets its own plan and approval)
1. **This plan:** the shared word pool (simplified characters), "practised up to" / "only this group" selection, and the character tracing exercise.
2. **Word exercise:** the whole word traced, then written. Drawn from the same pool and the same group settings model, chosen independently of the character exercise. Includes the parent tip (section 6).
3. **Stroke order** for the character exercise (stretch goal; needs a stroke dataset, with approval).
4. **Harder word modes** (stretch ideas, saved here at the human's request):
    * Show only the English and pinyin; the kid writes the characters from memory.
    * Show only the characters; the kid writes the English and pinyin from memory.

At the handoff for this part, move sections 0 and 6 into the progress.md roadmap so they outlive this file.

## 1. Decisions already made in chat
* Simplified characters. Learners: the human's kids' school friends, ages about 4 to 10, all with good English print and cursive handwriting, so some stretch is fine.
* Parents generate the sheets, so every word shown in settings carries pinyin and English.
* One character per quadrant, with its word shown as context.
* Groups are ordered to manage difficulty: Numbers, Describing, Family, Pronouns, Greetings, Verbs, Things, Colors, Questions.
* Default selection is "progressive unlock": a parent picks the group the kid has reached, and sheets draw from that group and every earlier one, leaning toward the newest. The optional "manual" setting narrows it to that one group only.
* No per-kid profiles. Settings are saved like every other panel's (the most recent setting only).
* The two exercises are independent topics. No linking between quadrants.
* Font (decided 2026-11-25; files cut down 2026-11-25): **LXGW WenKai, GB edition** (github.com/lxgw/lxgwwenkai; the GB edition follows the mainland G-source glyph standard, while the base edition keeps some Japanese forms). It uses the SIL Open Font License 1.1, so it may be bundled as long as OFL.txt goes with it. KaiTi (Windows' Simkai.ttf) is proprietary and cannot be shipped, so it is only a fallback name. The style blends Song and Kai features, and the author notes some rough joins, so all 64 characters get one look on a printed sheet, ideally by a Chinese speaker during the pinyin check. Regular draws both the model and the tracing copies; Medium is cut down and kept in the folder for a possible sturdier model later. The cut-down files, `OFL.txt` (with LXGW's extra permission to keep the name in web-font subsets), `readme.txt` and `subset-characters.txt` are already in `public/fonts/lxgw-wenkai-gb/`, uncommitted until step 1.

## 2. Does the existing system fit?
Yes, without new machinery:
* **Panels:** a topic may own several panels (cursive owns `cursiveLetters` and `cursiveLayout`). Chinese gets two `single` panels:
    * `chineseCharacters`: heading "Practised up to", one chip per group, default Numbers.
    * `chineseScope`: two chips, "This group and earlier" (default) and "Only this group".

  Saved settings store panels by id, so nothing new is needed there.
* **Dealing:** `createShuffledDeck` already deals each card a fixed number of times per cycle with no back-to-back repeats. Leaning toward the newest group uses two decks: a **newest** deck (the chosen group's characters) and a **review** deck (every earlier group's). Each draw picks the newest or the review deck at random, half and half, using the injected `RandomSource` (decided 2026-11-25). With Numbers chosen, or "Only this group", there is nothing to review, so only the newest deck is used.
* **Fonts:** `exercises/cursive/cursive-fonts.ts` shows how to load a font before the first render and check it. Chinese gets the same small loader.

## 3. Layout: option D (chosen 2026-11-25)
Quadrant 266 x 155; nothing drawn below 149. The title is bold 14px at (15, 12). Every box is a tianzige: black frame, light grey dashed cross (butt caps). "M" is the model in black, "t" is a light grey tracing copy, and "_" is an empty box.

```
CHINESE CHARACTERS
+------+  [t][t][t][t][t]
|  M   |  [t][t][_][_][_]
+------+  [_][_][_][_][_]
 pinyin
 context word (pinyin)
 English meaning
```
* **Left column (x 15 to 89, 74pt wide):** a 60pt model box at y 34 to 94. Under it, three lines in Quicksand Medium: the character's own pinyin at 11px, then the word it comes from (in pinyin) and the English meaning at 9px. Measured 2026-11-26 at 10px, the widest meaning ("younger brother", 77.6pt) and word ("shénme shíhou", 70pt) overflowed the column as first drawn (66pt), hence the wider column and 9px; any line still too wide steps its size down until it fits. The last line ends by about y 136.
* **Right side (x 97 to 257):** 5 boxes across, 3 rows of 32pt boxes, at y 34 to 130, 15 practice boxes in all. Moved 8pt right of the first sketch to widen the left column; the boxes end 9pt from the quadrant's right edge.
    * Row 1: five tracing copies.
    * Row 2: two tracing copies, then three blanks.
    * Row 3: five blanks.

  34pt boxes would leave only 3pt to the right edge, so 32pt it is.
* Why 5 across: the human asked for narrower rows (4 or 5) so the exercise does not feel daunting.

**Saved for part 3 (stroke order), agreed 2026-11-25:**
* A strip of 18pt cells sits on one line under the title, across the full width, one cell per stroke (at most 13 on this list: lan, blue). The strip shows the character built up one stroke at a time.
* The practice area drops to 2 rows and widens to 6 across. Six 32pt boxes beside the model column would run 15pt past the quadrant edge. So in that layout the practice boxes shrink to about 28pt (6 x 28 = 168pt, ending at x 257), or the model column narrows. This gets decided in part 3's plan.

## 4. Files
New, in a subfolder because the topic has several files (`src/exercises/chinese/`):
* `chinese-words.ts`: the word list (appendix), each word's group, characters, syllables and meaning; `listChineseCharacterCards(group)` gives the characters that are new in that group. Each character belongs to the group where it first appears (hao, "good", is a Greetings word, but it is learned in Describing), and repeats in later groups are review for free. It also holds the newest/review split for a group and a scope.
* `chinese-grid.ts`: draws one tianzige box, with an optional character in a given color. The word exercise in part 2 reuses it.
* `chinese-character-exercise.ts`: `createChineseCharacterExercise(card: ChineseCharacterCard): QuadrantExercise`. It draws the chosen layout and has no answer key (tracing has no answer, like Hiragana).
* `chinese-fonts.ts`: loads the tracing font before the first render and throws if it does not arrive, as the cursive and sans-serif loaders do, so a preview never shows a system font the printout would not.

New in `text/`:
* `pinyin-display.ts`: `displayPinyin(text)` swaps each ü-with-tone letter (U+01D5 to U+01DC) for u + U+0308 + its tone mark, for Quicksand. Imports nothing.

New assets:
* `public/fonts/lxgw-wenkai-gb/`, holding three files:
    * the font cut down to the characters in `chinese-words.ts`, as a `.ttf` (the full font is many megabytes)
    * `OFL.txt`, which the license requires
    * `readme.txt`: where the font came from, its version, and the exact cut-down command

  Done 2026-11-25 by Claude on the human's machine with `pyftsubset` (fontTools 4.65, already installed): about 26 MB down to about 24 KB per weight, all 64 characters kept. The readme records the command, to re-run whenever words are added.

Changed (the same set the division exercise touched):
* `types.ts`:
    * `'chineseCharacters'` in `TOPIC_KEYS` and `CONFIGURABLE_TOPICS`
    * the two panel ids
    * `CHINESE_GROUPS` and `CHINESE_SCOPES`
    * `chineseCharacters: { group: ChineseGroup; scope: ChineseScope }` in `TopicSettings`
* `constants.ts`: `CHINESE_TRACING_FAMILY = 'ChineseTracing'` and `CHINESE_TRACING_FONT`, that family followed by fallbacks: KaiTi (Windows), Kaiti SC and STKaiti (macOS), then any serif.
* `public/css/styles.css`: one `@font-face` for `ChineseTracing`, like the cursive ones.
* `settings/topic-settings.ts`: the two panel specifications and the resolver entry.
* `text/message-catalog.ts`, `text/english.ts`:
    * the topic name and short name, and the printed title
    * the panel headings and the group and scope chip words
    * the context line ("from ..., ...")

  The English meanings and pinyin are content, so they stay in `chinese-words.ts`, the way the hiragana hints do.
* `generator/example-specifications.ts`, `generator/randomization-and-difficulty-generator.ts`: a specification type, the two decks, the half-and-half random draw, and the factory entry.
* `main.ts`: the `localState` entry, the specification branch, and the font loader in `initializeApp`.
* `tests/support/folder-dependencies.ts`, only if the dependency check rejects the new subfolder (Kana and Cursive suggest it will not).

Types:
```ts
// types.ts
export const CHINESE_GROUPS = [
    'numbers', 'describing', 'family', 'pronouns', 'greetings',
    'verbs', 'things', 'colors', 'questions'
] as const;
export type ChineseGroup = typeof CHINESE_GROUPS[number];
export const CHINESE_SCOPES = ['up-to', 'only'] as const;
export type ChineseScope = typeof CHINESE_SCOPES[number];

// exercises/chinese/chinese-words.ts
export interface ChineseWord {
    group: ChineseGroup;
    characters: string;            // simplified
    syllables: readonly string[];  // pinyin with tone marks, one per character, as given by the human
    meaning: string;               // English
}
export interface ChineseCharacterCard {
    character: string;
    pinyin: string;                // dictionary pinyin: the character said on its own (decided 2026-11-25)
    word: ChineseWord;             // the word it first appears in, shown as context
}
```

## 5. Tests (critical core only)
* **Data:** each word has one syllable per character; every group has at least one new character; each character is new in exactly one group. One collecting test.
* **Selection rule:**
    * "Up to" Colors gives Colors as the newest and the eight earlier groups as review.
    * "Only" gives no review.
    * Numbers gives no review.
    * Over many seeded draws, roughly half come from each deck when there is review (a loose bound, so the test does not flicker), and every draw comes from the newest deck when there is none.

  Break each rule once to check the test can fail.
* **Joining existing lists:** `printed-titles.test.ts`, the marker catalog, `panel-selections.ts`, and the defaults fixture in `resolve.test.ts`.
* **No new drawing test.** Checking tracing in grey and the model in black by eye in the browser is enough.

## 6. For part 2 (saved, not built now)
A short tip under the scope panel: "To make character and word practice overlap, choose Only this group for both." This needs a small optional `note` on a panel specification, so it waits until the word exercise exists.

## 7. Questions for the human
1. ~~Layout~~ Decided: option D, 5 across (section 3).
2. ~~Pinyin on the card~~ Decided: dictionary pinyin, the character said on its own, with its word as context. Only a few readings differ from the list, because the character first appears in an unstressed second syllable. Each gets a check by a Chinese speaker before printing:
    * zi (child, in zhuozi, table): dictionary third tone, zǐ
    * hou (in shenme shihou, when): fourth tone, hòu
    * huan (in xihuan, to like): first tone, huān
    * li (in nali, where): third tone, lǐ, as the list already has it
    * me (in shenme, what): no tone even on its own
3. ~~Mix~~ Decided: random, half new and half review.
4. ~~Font~~ Decided: LXGW WenKai, GB edition (section 1).
5. ~~Cut-down step~~ Done by Claude, 2026-11-25 (section 4).

## 8. Steps (the workflow agreed for the Quicksand change, reused 2026-11-26)
Every step: build only its files; Claude runs `bash linux-modules/check.sh` (both type checks, the quick suite, the build); a fresh Sonnet 5.5 agent reviews the diff in two passes (bugs, then style, tidiness, maintainability, DRYness and project standards); Claude applies the review or reports what it declines; Claude commits that step's files by name, ending each message with the attribution lines. After the last step Claude stops for the human's review, real-world website check and print check; the human opens the pull request. Questions for the human are collected in section 9 instead of stopping the work.

**Test trim (the human's rule):** after every even-numbered step (2 and 4), cut the tests this feature has added by two-thirds.

* **Step 0, the branch:** `chinese-characters` from the updated `main`; commit this plan.
* **Step 1, the tracing font:** commit `public/fonts/lxgw-wenkai-gb/` (both cut-down weights, `OFL.txt`, `readme.txt`, `subset-characters.txt`); `@font-face` for `ChineseTracing` (Regular) in `styles.css`; `CHINESE_TRACING_FAMILY` and `CHINESE_TRACING_FONT` in `constants.ts`; `exercises/chinese/chinese-fonts.ts`; the loader in `main.ts`'s startup. Also fix a stale comment the Quicksand change left in `text/message-catalog.ts` ("The blanks are part of the string" above `nameLabel`).
* **Step 2, the word pool:** `CHINESE_GROUPS` and `CHINESE_SCOPES` in `types.ts`; `exercises/chinese/chinese-words.ts` (the list, cards, newest/review split); `text/pinyin-display.ts`; their tests. Then the test trim.
* **Step 3, the exercise:** `exercises/chinese/chinese-grid.ts` and `chinese-character-exercise.ts`; the printed title and context words in the catalog.
* **Step 4, wiring:** the topic key, the two panels and their words, resolving the settings, the example preview, the decks and the factory, `main.ts`, and the test lists every topic joins. Then the test trim.
* **Step 5, docs and handoff:** `AGENTS.md` (uncommitted until the human approves the wording), the `progress.md` ledger and roadmap (sections 0 and 6 here, and anything found on the way), and this file cleared to "No active plan".

## 9. Questions collected for the human's review
(Filled in as the steps run.)

## Appendix: the word list (from the human, 2026-11-25), in group order
Characters are for the code; read the pinyin and English.
```
numbers:    一 yī, 二 èr, 三 sān, 四 sì, 五 wǔ, 六 liù, 七 qī, 八 bā, 九 jiǔ, 十 shí (one to ten)
describing: 大 dà (big), 小 xiǎo (small), 好 hǎo (good), 坏 huài (bad), 多 duō (many), 少 shǎo (few)
family:     爸爸 bàba (dad), 妈妈 māma (mom), 哥哥 gēge (older brother), 姐姐 jiějie (older sister),
            弟弟 dìdi (younger brother), 妹妹 mèimei (younger sister), 爷爷 yéye (grandpa), 奶奶 nǎinai (grandma)
pronouns:   我 wǒ (I, me), 你 nǐ (you), 他 tā (he), 她 tā (she)
greetings:  你好 nǐ hǎo (hello), 谢谢 xièxie (thank you), 再见 zàijiàn (goodbye), 请 qǐng (please)
verbs:      是 shì (to be), 有 yǒu (to have), 吃 chī (to eat), 喝 hē (to drink), 去 qù (to go), 喜欢 xǐhuan (to like)
things:     水 shuǐ (water), 书 shū (book), 桌子 zhuōzi (table), 椅子 yǐzi (chair), 苹果 píngguǒ (apple), 玩具 wánjù (toy)
colors:     红色 hóngsè (red), 蓝色 lánsè (blue), 黄色 huángsè (yellow), 绿色 lǜsè (green), 白色 báisè (white), 黑色 hēisè (black)
questions:  什么 shénme (what), 谁 shéi (who), 哪里 nǎlǐ (where), 什么时候 shénme shíhou (when),
            为什么 wèishénme (why), 怎么 zěnme (how)
```
56 words and 64 different characters. Moving Pronouns after Family, and Describing before both, means hao (good) and ni (you) are learned before Greetings uses them.
