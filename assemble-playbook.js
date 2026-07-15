// PROOF assembler: wrap the one page in the document shell with embedded Arimo.
const E = require("./debrief-engine.js");
const T = require("./deliverable-tokens.js");
const P = require("./playbook-pages.js");

function buildPlaybookHTML({ ctx, brand }) {
  const safeBrand = {
    clientName: (brand && brand.clientName) || (ctx && ctx.company) || "Summit Mechanical",
    navy: (brand && brand.navy) || "#16242E",
    blue: (brand && brand.blue) || "#1F6FB2",
  };
  const out = [ P.scorecardNoSearchPage(safeBrand) ];

  return `<!doctype html><html><head><meta charset="utf-8"><style>
    ${T.ARIMO_FONT_FACE}
    :root{ ${E.DS_TOKENS} }
    *{ margin:0; padding:0; box-sizing:border-box; }
    body{ font-family:${T.DELIVERABLE_FONT_STACK}; -webkit-print-color-adjust:exact; print-color-adjust:exact; }
    .page{ page-break-after:always; break-after:page; }
    .page:last-child{ page-break-after:auto; break-after:auto; }
    @page{ size:816px 1056px; margin:0; }
  </style></head><body>${out.join("")}</body></html>`;
}
module.exports = { buildPlaybookHTML };
