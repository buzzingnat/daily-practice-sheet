LXGW WenKai GB, cut down to the characters this project uses
============================================================

Font:     LXGW WenKai GB, Regular and Medium weights
Version:  1.530 (October 18, 2026), read from each file's name table
Source:   https://github.com/lxgw/LxgwWenkaiGB (releases page)
          Files downloaded: LXGWWenKaiGB-Regular.ttf, LXGWWenKaiGB-Medium.ttf
Author:   LXGW, building on Klee One by Fontworks (https://github.com/fontworks-fonts/Klee)
License:  SIL Open Font License 1.1 with an additional permission; see OFL.txt
Cut down: 2026-11-25

Why the GB edition: it follows the mainland China (G-source) glyph standard, which is
what learners of simplified characters are taught. The base LXGW WenKai keeps some
Japanese character forms.

License condition to keep in mind: these cut-down copies keep the reserved name "LXGW".
OFL.txt's additional permission allows that only for copies subsetted or converted solely
for web font delivery that are not offered as installable desktop fonts. Serve these files
to the worksheet page only; do not publish them anywhere as fonts to download and install.
Keep OFL.txt beside the font files.

Files
-----
LXGWWenKaiGB-Regular-subset.ttf   tracing font (about 24 KB; the full font is about 26 MB)
LXGWWenKaiGB-Medium-subset.ttf    kept for a possible sturdier model character
subset-characters.txt             the characters kept, one line, no separators
OFL.txt                           the license, required beside the fonts

How to redo the cut-down step (after adding words)
--------------------------------------------------
1. Download the full Regular and Medium .ttf files from the source above.
2. Update subset-characters.txt so it holds every Chinese character in the word list.
   It was first built from the word list in agents/plan.md; once the word list lives in
   src/exercises/chinese/chinese-words.ts, build it from that file instead.
3. Run, from the project root, with the full fonts in font-scratch/ (fontTools 4.65):

   for weight in Regular Medium; do
     pyftsubset font-scratch/LXGWWenKaiGB-$weight.ttf \
       --text-file=public/fonts/lxgw-wenkai-gb/subset-characters.txt \
       --output-file=public/fonts/lxgw-wenkai-gb/LXGWWenKaiGB-$weight-subset.ttf \
       --layout-features='*' --name-IDs='*' --name-languages='*' --notdef-outline
   done

4. Check that no character went missing: open each subset with fontTools and compare its
   character map against subset-characters.txt.
