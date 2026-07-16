// ════════════════════════════════════════════════════════════════════════
//  TRUESEAT — Playbook assembler.
//  Wraps page primitives in the document shell with embedded Arimo.
//
//  Current state: DIFF HARNESS. Renders, in order:
//    1. section-opener   (diff vs Hiring Playbook p.5 "Before Any Hiring Begins")
//    2. core-value pages (diff vs pp.16–18) — LOOPED from the values[] passed in,
//       so "N OF N" and the page count derive from data, never hard-coded.
//
//  The renderer NEVER calls a model. It renders stored values[] only, source-
//  agnostic (hand-authored Summit and expanded-then-edited clients are identical
//  to it). Prove on Summit (3 values) AND Contractor Dynamics (5) before shipping.
// ════════════════════════════════════════════════════════════════════════
const T = require("./deliverable-tokens.js");
const P = require("./playbook-pages.js");

// debrief-engine only for DS_TOKENS (the flattened light-page palette). We do
// NOT use its titleBlock()/footer() — those key off --cd-accent, absent here.
const E = require("./debrief-engine.js");

function buildPlaybookHTML({ ctx, brand, values }) {
  const safeBrand = {
    clientName: (brand && brand.clientName) || (ctx && ctx.company) || "Summit Mechanical",
    navy: (brand && brand.navy) || "#16242E",
    blue: (brand && brand.blue) || "#1F6FB2",
  };

  const docTitle = "Hiring & Talent Development Playbook";
  const vals = Array.isArray(values) ? values : [];
  const total = vals.length;

  const pages = [];

  // 1. SECTION-OPENER — reference Playbook p.5 (section 02 of 09, page 05 / 24)
  pages.push(P.sectionOpenerPage({
    brand: safeBrand,
    docTitle,
    sectionTitle: "Define the Seat — Role Scorecard",
    sectionNum: 2,
    sectionTotal: 9,
    headline: "Before Any Hiring Begins, Define the Seat.",
    subhead: "We do not hire people. We fill clearly defined seats.",
    pageNo: 5,
    pageTotal: 24,
  }));

  // 2. CORE-VALUE PAGES — looped from real values[]. Empty-state gate: if no
  //    values, emit a single honest placeholder instead of broken scaffolding.
  if (!total) {
    pages.push(P.coreValuePage({
      brand: safeBrand, docTitle,
      value: { name: "Define your core values to complete this playbook" },
      idx: 0, total: 0, pageNo: 16, pageTotal: 24,
    }));
  } else {
    // reference core-value pages start at absolute page 16 in the Summit deck
    vals.forEach((value, i) => {
      pages.push(P.coreValuePage({
        brand: safeBrand,
        docTitle,
        value,
        idx: i + 1,
        total,
        pageNo: 16 + i,
        pageTotal: 24,
      }));
    });
  }

  return `<!doctype html><html><head><meta charset="utf-8"><style>
    ${T.ARIMO_FONT_FACE}
    :root{ ${E.DS_TOKENS} }
    *{ margin:0; padding:0; box-sizing:border-box; }
    body{ font-family:${T.DELIVERABLE_FONT_STACK}; -webkit-print-color-adjust:exact; print-color-adjust:exact; }
    .page{ page-break-after:always; break-after:page; }
    .page:last-child{ page-break-after:auto; break-after:auto; }
    @page{ size:816px 1056px; margin:0; }
  </style></head><body>${pages.join("")}</body></html>`;
}

module.exports = { buildPlaybookHTML };
