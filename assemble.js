const fs = require("fs");
const E = require("./debrief-engine.js");
const P = require("./pages.js");

// Assemble the full debrief document HTML from data.
function buildDebriefHTML({ report, ctx, brand, logoDark }) {
  // page numbering is sequential; paginated sections can add pages, so we thread
  // a running counter through and let each section report how many it produced.
  let pageNo = 1;
  const out = [];

  // 1 · cover (page 01 — but cover shows no footer number; interior numbering
  //     in the standard starts the footer at 02 on the verdict page, matching
  //     the cover being "01"). We count the cover as page 1.
  out.push(P.coverPage(report, ctx, brand, logoDark));
  pageNo++; // -> 2

  // 2 · verdict
  out.push(P.verdictPage(report, ctx, brand, pageNo));
  pageNo++;

  // 3 · competencies (paginates)
  const comp = P.competencyPages(report, ctx, brand, pageNo);
  out.push(comp.html); pageNo += comp.pageCount;

  // 4 · values (paginates)
  const vals = P.valuesPages(report, ctx, brand, pageNo);
  out.push(vals.html); pageNo += vals.pageCount;

  // 5 · splits + halo
  out.push(P.splitsPage(report, ctx, brand, pageNo));
  pageNo++;

  // 6 · closing (dark, no footer number)
  out.push(P.closingPage(report, ctx, brand, logoDark, pageNo));

  return `<!DOCTYPE html><html><head><meta charset="utf-8">
<style>
  html, body { margin:0; background:#E7E4DE; }
  .doc { display:flex; flex-direction:column; align-items:center; gap:28px; padding:28px 0 60px; }
  .page { box-shadow:0 14px 40px rgba(20,16,12,0.18); }
  @page { size:8.5in 11in; margin:0; }
  @media print {
    html, body { background:#fff; }
    .doc { gap:0; padding:0; }
    .page { box-shadow:none !important; break-after:page; page-break-after:always; }
    .page:last-child { break-after:auto; page-break-after:auto; }
  }
  :root{ ${E.DS_TOKENS} }
</style></head><body>
<div id="cd-doc" class="doc" style="--cd-accent:${brand.accent}; --cd-navy:${brand.navy}; --rac-navy:${brand.navy}; --cd-blue:${brand.blue || "#4F79C2"}; --cover-grad:linear-gradient(180deg,${brand.navy} 0%,${brand.navyDark} 100%); font-family:var(--font-sans);">
${out.join("\n")}
</div></body></html>`;
}


module.exports = { buildDebriefHTML };
