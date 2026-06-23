// ════════════════════════════════════════════════════════════════════════
//  HIRE2SCALE — One Sheet document assembler
//  Mirrors assemble.js: thread a running pageNo through the page sequence,
//  wrap the pages in the self-contained HTML document shell (DS_TOKENS +
//  --cd-accent + print CSS), return one HTML string for Chrome.
// ════════════════════════════════════════════════════════════════════════
const E = require("./debrief-engine.js");
const P = require("./onesheet-pages.js");

// Assemble the full One Sheet document HTML from data.
function buildOneSheetHTML({ prep_blocks, ctx, brand, logoDark }) {
  const blocks = prep_blocks || [];
  const valBlocks = blocks.filter((b) => b.lane === "values");
  const cmpBlocks = blocks.filter((b) => b.lane === "competencies");

  let pageNo = 0;       // cover is uncounted; first interior is 01
  const out = [];

  // 1 · cover (uncounted)
  out.push(P.coverPage(ctx, brand, logoDark));

  // 2 · how-to + STAR
  pageNo++;
  out.push(P.howToPage(ctx, brand, pageNo));

  // 3 · values divider + one page per value
  pageNo++;
  out.push(P.dividerPage("Core values", "Who they are.",
    "Whether this person has actually lived our values — not whether they can recite them.", brand, pageNo));
  for (const b of valBlocks) {
    pageNo++;
    out.push(P.blockPage(b, "Core value", brand, pageNo));
  }

  // 4 · competencies divider + one page per competency
  pageNo++;
  out.push(P.dividerPage("Role competencies", "Built for this role.",
    `Core values tell you who someone is. These tell you whether they're wired for ${E.esc(ctx.role || "this role")}.`, brand, pageNo));
  for (const b of cmpBlocks) {
    pageNo++;
    out.push(P.blockPage(b, "Role competency", brand, pageNo));
  }

  // 5 · debrief decision page
  pageNo++;
  out.push(P.debriefPage(brand, pageNo));

  // 6 · CTA (dark, uncounted tail)
  out.push(P.ctaPage(ctx, brand, logoDark));

  const accent = brand.accent || "#EA6B47";
  return `<!doctype html><html><head><meta charset="utf-8"><style>
    :root{ ${E.DS_TOKENS} --cd-accent:${accent}; }
    *{ margin:0; padding:0; box-sizing:border-box; }
    body{ font-family:var(--font-sans); -webkit-print-color-adjust:exact; print-color-adjust:exact; }
    .page{ page-break-after:always; break-after:page; }
    .page:last-child{ page-break-after:auto; break-after:auto; }
    @page{ size:816px 1056px; margin:0; }
  </style></head><body>${out.join("")}</body></html>`;
}

module.exports = { buildOneSheetHTML };
