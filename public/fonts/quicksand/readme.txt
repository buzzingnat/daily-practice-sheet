Quicksand, the project's sans-serif font
========================================

Font:     Quicksand, Medium and Bold weights (static files)
Version:  3.006, read from each file's name table
Source:   Google Fonts, https://fonts.google.com/specimen/Quicksand
          (the download's static/ folder; designers: The Quicksand Project Authors,
          https://github.com/andrew-paglinawan/QuicksandFamily)
License:  SIL Open Font License 1.1, with the Reserved Font Name "Quicksand"; see OFL.txt
Added:    2026-11-25
Embedding: OS/2 fsType 0 in both files (installable; no embedding restrictions)

Files
-----
Quicksand-Medium.ttf   sha256 a128d9f99045ed38fdc0d9eafcbb80d8f90295a0826e88cab29468304f7cfe69
Quicksand-Bold.ttf     sha256 65561a329de20024699162ef86bec0e79a0415c90b30a60ebc301fc00d67f87b
OFL.txt                the license, required beside the fonts

Update the hashes if a file is ever replaced. Quicksand Regular is left out on
purpose: Medium takes its place (below), so adding Regular at weight 400 would clash.

Why Medium and Bold
-------------------
Quicksand replaces Helvetica. Its Regular weight is much thinner than Helvetica's
(about 0.060 em against 0.084, the width of the letter l measured with fontTools)
and could print faint at 9 to 11px, so Medium (about 0.080 em) stands in for normal
text and Bold for bold. public/css/styles.css declares Medium as weight 400 and Bold
as 700 under the family name Quicksand, so code asking for "normal" gets Medium, and
jsPDF registers them as its "normal" and "bold" styles.

Known gap: pinyin
-----------------
Quicksand has no single characters for u with two dots and a tone mark
(U+01D5 to U+01DC; checked in both files' character maps). It does have the separate
two-dot mark (U+0308), the four tone marks, and the positioning data that stacks
them, so pinyin text assembles those letters from parts before drawing. Only the
browser's canvas applies that positioning; jsPDF does not, so pinyin must never be
drawn as jsPDF text. See agents/plan-font.md, section 4.

License notes
-------------
- Embedding the fonts in documents is allowed, including the worksheet PDFs, where
  jsPDF embeds only the glyphs each document uses. That is document use, not
  distributing a modified font.
- Keep OFL.txt beside the font files.
- These files are unmodified; do not edit or cut them down in place. A cut-down
  (subsetted) .ttf shipped or served as a font file counts as a Modified Version,
  and the OFL then forbids calling it "Quicksand": give it another name.
