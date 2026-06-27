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
  const piBlocks = blocks.filter((b) => b.lane === "pi");
  const sklBlocks = blocks.filter((b) => b.lane === "skills");

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

  // 5 · PI job-fit (the moat). LIVE per-drive predictions when the candidate
  // Job-Fit data path resolved (block.live / not locked); otherwise the honest
  // LOCKED capability card. The divider lead shifts to match: a candidate read
  // when live, a capability pitch when locked.
  for (const b of piBlocks) {
    const isLive = b.live === true && b.locked !== true;
    pageNo++;
    out.push(P.dividerPage("PI job-fit", "Will the fit last.",
      isLive
        ? "Where this person's natural wiring fits the seat — and where it stretches. The stretches are what to probe, and what to support in the first 90 days."
        : "Not whether they can do the job — whether they'll do it well, sustainably, over the long haul.",
      brand, pageNo));
    pageNo++;
    out.push(isLive
      ? P.livePiPage(b, "PI job-fit", brand, pageNo)
      : P.lockedPiPage(b, "PI job-fit", brand, pageNo));
  }

  // 6 · Skills check (leg 4). Owner-editable suggestions: a walk-through probe
  // plus an honest "how to verify" step per skill. Skipped if none generated.
  for (const b of sklBlocks) {
    pageNo++;
    out.push(P.dividerPage("Skills check", "Can they do the work.",
      "Values and competencies tell you who they are. This tells you whether they can actually do the job — verified, not assumed.", brand, pageNo));
    pageNo++;
    out.push(P.skillsPage(b, "Role skills", brand, pageNo));
  }

  // 7 · debrief decision page
  pageNo++;
  out.push(P.debriefPage(brand, pageNo));

  // 8 · CTA (dark, uncounted tail)
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
