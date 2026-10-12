The build uses the standalone jsPDF 4.2.0 UMD distribution from the published
`jspdf@4.2.0` npm package. It is loaded only by the Node PDF generator, never
included in the browser bundle. The upstream MIT license is included alongside it.

Upstream: https://github.com/parallax/jsPDF

`fonts/WenQuanYiZenHei.ttf.gz` contains the regular TrueType face extracted from
the WenQuanYi Zen Hei collection 0.9.45. The complete glyph set is retained so
future resume edits can be built without downloading fonts. The original font
license, font embedding exception, and GPL-2 text are included in `fonts/`.
Only used glyphs are embedded into the generated PDF.

Font upstream: https://wenq.org/
