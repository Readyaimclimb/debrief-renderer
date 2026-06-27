// ════════════════════════════════════════════════════════════════════════
//  HIRE2SCALE — Job Ad PDF engine (PAGINATED)
//  Renders the "Perfect Job Ad" framework as a branded PDF in the suite's
//  design standard: debrief/roadmap cover treatment (rings, glow, wordmark
//  fallback, meta strip), cream interior pages with accent-bar cards, a navy
//  pay callout, and a dark CTA close. Like the roadmap engine it PAGINATES —
//  each section's blocks are measured and packed; when the next block would
//  overflow, the section continues on a fresh page. No overflow, ever.
//
//  Input shape (from JobAd.jsx buildJobAd()):
//    { role, source, sections: { why, values, candidate, role, cta } }
//    why       { headline, body }
//    values    { intro, values: [{ name, line }] }
//    candidate { summary, youThrive: [] }
//    role      { responsibilities: [], expectations: [], payRange, benefits: [], growthPath }
//    cta       { cta }
//  Plus ctx { role, company, location, type, applyUrl } + brand + logoDark.
// ════════════════════════════════════════════════════════════════════════
const E = require("./debrief-engine.js");
const { esc, DS_TOKENS, titleBlock } = E;

// ── geometry budget (px), mirroring roadmap-engine ──
const PAGE_H = 1056, CONTENT_TOP = 56, FOOTER_RESERVE = 80;
const USABLE = (PAGE_H - FOOTER_RESERVE) - CONTENT_TOP;
const TITLE_H = 128, TITLE_CONT_H = 104, BLOCK_GAP = 14;

function estLines(text, perLine) { return Math.max(1, Math.ceil(String(text || "").length / perLine)); }

const ACCENT = "var(--cd-accent)", NAVY = "var(--cd-navy)";
const GOOD = "#2F7D54";

// ── footer / light page chrome ──
function jaFooter(brand, pageNo) {
  return `<div style="position:absolute; left:64px; right:64px; bottom:30px; display:flex; justify-content:space-between; align-items:center; border-top:1px solid var(--border-subtle); padding-top:12px; font-size:10px; font-weight:600; letter-spacing:0.1em; text-transform:uppercase; color:var(--text-faint);"><span>${esc(brand.clientName)} · We're Hiring</span><span>${String(pageNo).padStart(2, "0")}</span></div>`;
}
function jaLightPage(inner, brand, pageNo) {
  return `<section class="page" style="width:816px; height:1056px; position:relative; overflow:hidden; box-sizing:border-box; background:var(--rac-cream); color:var(--text-strong);">
    <div style="position:absolute; inset:0; padding:60px 64px;">${inner}</div>
    ${jaFooter(brand, pageNo)}
  </section>`;
}

// ── COVER (navy, debrief treatment + meta strip) ──
function coverPage(ctx, brand, logoDark) {
  const wordmark = logoDark
    ? `<img src="${logoDark}" alt="${esc(brand.clientName)}" style="height:64px; width:auto;">`
    : `<div style="font-weight:900; font-size:34px; letter-spacing:-0.01em; color:#fff;">${esc(brand.clientName)}</div>`;
  const meta = (label, val, flex, pad) => val ? `<div style="flex:${flex}; padding:${pad};">
    <div style="font-size:10px; font-weight:700; letter-spacing:0.12em; text-transform:uppercase; color:rgba(255,255,255,0.45); margin-bottom:9px;">${esc(label)}</div>
    <div style="font-size:14.5px; line-height:1.5; color:rgba(255,255,255,0.92);">${esc(val)}</div>
  </div>` : "";
  const dividers = [ctx.location, ctx.type, ctx.payRange].filter(Boolean).length;
  return `<section class="page" style="width:816px; height:1056px; position:relative; overflow:hidden; box-sizing:border-box; background:var(--cover-grad); color:#fff;">
    <div style="position:absolute; top:-150px; right:-180px; width:540px; height:540px; border-radius:50%; background:radial-gradient(circle, transparent 0%, transparent 38%, rgba(255,255,255,0.045) 38.4%, transparent 39%, transparent 50%, rgba(255,255,255,0.045) 50.4%, transparent 51%, transparent 62%, rgba(255,255,255,0.045) 62.4%, transparent 63%, transparent 74%, rgba(255,255,255,0.045) 74.4%, transparent 75%); z-index:0;"></div>
    <div style="position:absolute; left:0; right:0; bottom:0; height:320px; background:linear-gradient(180deg, transparent 0%, rgba(31,111,178,0.14) 100%); z-index:0;"></div>
    <div style="position:absolute; inset:0; padding:64px; display:flex; flex-direction:column; z-index:1;">
      <div style="display:flex; align-items:center; justify-content:space-between;">
        <div style="display:flex; align-items:center; gap:18px;">
          ${wordmark}
          <div style="border-left:1px solid rgba(255,255,255,0.22); padding-left:18px; font-weight:700; font-size:9px; letter-spacing:0.24em; text-transform:uppercase; color:var(--cd-accent); line-height:1.7;">We're<br>Hiring</div>
        </div>
        <span style="font-size:11px; font-weight:700; letter-spacing:0.2em; text-transform:uppercase; color:rgba(255,255,255,0.5);">Now Open</span>
      </div>
      <div style="flex:1;"></div>
      <span style="font-size:12px; font-weight:700; letter-spacing:0.16em; text-transform:uppercase; color:var(--cd-accent);">Now Hiring</span>
      <h1 style="margin:14px 0 0; font-weight:900; font-size:68px; line-height:0.96; letter-spacing:-0.03em;">${esc(ctx.role || "Open Role")}</h1>
      <div style="width:72px; height:4px; background:var(--cd-accent); margin:24px 0 20px;"></div>
      <p style="margin:0; max-width:540px; font-size:18px; line-height:1.5; color:rgba(255,255,255,0.85);">${esc(ctx.hook || "Join a team that does it right the first time.")}</p>
      <div style="flex:1;"></div>
      ${dividers ? `<div style="display:flex; border-top:1px solid rgba(255,255,255,0.16); padding-top:20px;">
        ${meta("Location", ctx.location, 1.4, "0 24px 0 0")}
        ${ctx.location && (ctx.type || ctx.payRange) ? `<div style="width:1px; background:rgba(255,255,255,0.16);"></div>` : ""}
        ${meta("Type", ctx.type, 1, "0 24px")}
        ${ctx.type && ctx.payRange ? `<div style="width:1px; background:rgba(255,255,255,0.16);"></div>` : ""}
        ${meta("Pay", ctx.payRange, 1, "0 0 0 24px")}
      </div>` : ""}
      <div style="margin-top:22px; font-size:11px; letter-spacing:0.04em; color:rgba(255,255,255,0.5);">Powered by Ready Aim Climb · Hire2Scale</div>
    </div>
  </section>`;
}

// ════════════════════════════════════════════════════════════════════════
//  BLOCK BUILDERS — each returns { html, height }. The paginator packs these.
// ════════════════════════════════════════════════════════════════════════

// generic prose paragraph block
function proseBlock(text) {
  if (!text) return null;
  const lines = estLines(text, 78);
  const height = lines * 24 + 8;
  const html = `<p style="margin:0; font-size:14px; line-height:1.65; color:var(--text-body);">${esc(text)}</p>`;
  return { html, height };
}

// a hook headline (big) for the WHY section
function headlineBlock(text) {
  if (!text) return null;
  const lines = estLines(text, 46);
  const height = lines * 32 + 12;
  const html = `<p style="margin:0; font-weight:800; font-size:24px; line-height:1.25; letter-spacing:-0.01em; color:var(--text-strong);">${esc(text)}</p>`;
  return { html, height };
}

// one value card (name + behavior line), accent bar
function valueCard(name, line) {
  if (!name) return null;
  const lines = estLines(line, 70);
  const height = 40 + 12 + lines * 21 + 24;
  const html = `<div style="background:#fff; border:1px solid var(--border-subtle); border-left:4px solid ${ACCENT}; box-shadow:var(--shadow-card); padding:14px 18px;">
    <div style="font-weight:800; font-size:15px; color:var(--text-strong); margin-bottom:${line ? 4 : 0}px;">${esc(name)}</div>
    ${line ? `<div style="font-size:12.5px; line-height:1.5; color:var(--text-muted);">${esc(line)}</div>` : ""}
  </div>`;
  return { html, height };
}

// a labeled bullet list block (responsibilities, expectations, youThrive)
function listBlock(heading, items, accent = ACCENT) {
  const arr = (items || []).filter(Boolean);
  if (!arr.length) return null;
  const lineCount = arr.reduce((n, x) => n + estLines(x, 74), 0);
  const height = 30 + lineCount * 23 + 16;
  const lis = arr.map((x) => `<div style="display:flex; gap:9px; margin-bottom:6px; font-size:13px; line-height:1.5; color:var(--text-body);"><span style="flex:0 0 auto; color:${accent};">•</span><span>${esc(x)}</span></div>`).join("");
  const html = `<div>
    <div style="font-size:10.5px; font-weight:700; letter-spacing:0.1em; text-transform:uppercase; color:${accent}; margin-bottom:10px;">${esc(heading)}</div>
    ${lis}
  </div>`;
  return { html, height };
}

// the "you thrive when" panel (soft card)
function thrivePanel(items) {
  const arr = (items || []).filter(Boolean);
  if (!arr.length) return null;
  const lineCount = arr.reduce((n, x) => n + estLines(x, 64), 0);
  const height = 30 + lineCount * 24 + 28;
  const lis = arr.map((x) => `<div style="font-size:12.5px; line-height:1.8; color:var(--text-body);">• ${esc(x)}</div>`).join("");
  const html = `<div style="background:var(--rac-off-white); border-radius:8px; padding:14px 18px;">
    <div style="font-size:10px; font-weight:700; letter-spacing:0.1em; text-transform:uppercase; color:${ACCENT}; margin-bottom:8px;">You thrive when…</div>
    ${lis}
  </div>`;
  return { html, height };
}

// ── PI behavioral-fit panel (role target → attraction copy). Sourced from the
// role's PI target only — NO candidate, NO verdict. Speaks to the reader in 2nd
// person ("you're at your best when…") so the right person leans in and the
// wrong one self-selects out. Skipped entirely when no lines are supplied, so a
// non-PI ad is unchanged. All copy is OUR plain language (see piTargetLanguage).
function piFitPanel(lines) {
  const arr = (lines || []).filter(Boolean);
  if (!arr.length) return null;
  const lineCount = arr.reduce((n, x) => n + estLines(x, 60), 0);
  const height = 34 + lineCount * 26 + 30;
  const lis = arr.map((x) => `<div style="display:flex; gap:9px; margin-bottom:8px; font-size:13px; line-height:1.55; color:var(--text-body);"><span style="flex:0 0 auto; color:${ACCENT}; font-weight:900;">✓</span><span>${esc(x)}</span></div>`).join("");
  const html = `<div style="background:#fff; border:1px solid var(--border-subtle); border-left:4px solid ${ACCENT}; box-shadow:var(--shadow-card); padding:16px 20px;">
    <div style="font-size:10.5px; font-weight:700; letter-spacing:0.1em; text-transform:uppercase; color:${ACCENT}; margin-bottom:10px;">How this role is wired — and who fits it</div>
    ${lis}
  </div>`;
  return { html, height };
}

// the navy pay-range callout
function payCallout(payRange, growthPath) {
  if (!payRange) return null;
  const gLines = estLines(growthPath, 72);
  const height = 40 + 30 + (growthPath ? gLines * 19 + 8 : 0) + 24;
  const html = `<div style="background:var(--rac-navy); border-top:4px solid ${ACCENT}; padding:18px 24px;">
    <div style="font-size:10px; font-weight:700; letter-spacing:0.1em; text-transform:uppercase; color:var(--cd-accent); margin-bottom:6px;">Pay Range</div>
    <div style="font-size:22px; font-weight:900; color:#fff; letter-spacing:-0.01em;">${esc(payRange)}</div>
    ${growthPath ? `<div style="font-size:12px; line-height:1.5; color:rgba(255,255,255,0.72); margin-top:8px;">${esc(growthPath)}</div>` : ""}
  </div>`;
  return { html, height };
}

// benefits as a clean card
function benefitsBlock(benefits) {
  const arr = (benefits || []).filter(Boolean);
  if (!arr.length) return null;
  const lineCount = arr.reduce((n, x) => n + estLines(x, 70), 0);
  const height = 40 + 12 + lineCount * 21 + 24;
  const lis = arr.map((x) => `<div style="font-size:12.5px; line-height:1.6; color:var(--text-body); margin-bottom:4px;">• ${esc(x)}</div>`).join("");
  const html = `<div style="background:#fff; border:1px solid var(--border-subtle); border-left:4px solid ${GOOD}; box-shadow:var(--shadow-card); padding:14px 18px;">
    <div style="font-size:10px; font-weight:700; letter-spacing:0.08em; text-transform:uppercase; color:${GOOD}; margin-bottom:10px;">What You'll Get</div>
    ${lis}
  </div>`;
  return { html, height };
}

// ── build the ordered blocks per section ──
function sectionBlocks(key, data) {
  const d = data || {};
  if (key === "why") return [headlineBlock(d.headline), proseBlock(d.body)].filter(Boolean);
  if (key === "values") return [
    proseBlock(d.intro),
    ...(d.values || []).map((v) => valueCard(v.name, v.line)),
  ].filter(Boolean);
  if (key === "candidate") return [proseBlock(d.summary), thrivePanel(d.youThrive), piFitPanel(d.piFit)].filter(Boolean);
  if (key === "role") return [
    listBlock("Key Responsibilities", d.responsibilities),
    listBlock("What Success Looks Like", d.expectations),
    benefitsBlock(d.benefits),
    payCallout(d.payRange, d.growthPath),
  ].filter(Boolean);
  return [];
}

const SECTIONS = [
  { key: "why",       band: "Part 1 · The Why",     title: "Why this matters" },
  { key: "values",    band: "Part 2 · Culture",     title: "What we believe" },
  { key: "candidate", band: "Part 3 · Is This You?", title: "The person we're looking for" },
  { key: "role",      band: "Part 4 · The Role",    title: "What you'll do, what you'll earn" },
];

// ── paginator (mirrors roadmap-engine) ──
function paginateSection(section, data, brand, startPage) {
  const blocks = sectionBlocks(section.key, data);
  if (!blocks.length) return { html: "", pageCount: 0 };
  const pages = [];
  let i = 0, pageIdx = 0;
  while (i < blocks.length) {
    const cont = pageIdx > 0;
    const titleH = cont ? TITLE_CONT_H : TITLE_H;
    let budget = USABLE - titleH;
    let body = "";
    let placed = 0;
    while (i < blocks.length) {
      const h = blocks[i].height + (placed > 0 ? BLOCK_GAP : 0);
      if (placed > 0 && budget - h < 0) break;
      body += (placed > 0 ? `<div style="height:${BLOCK_GAP}px"></div>` : "") + blocks[i].html;
      budget -= h;
      i++; placed++;
    }
    const title = titleBlock(section.band, section.title, { cont, h2size: 32 });
    pages.push(jaLightPage(title + body, brand, startPage + pageIdx));
    pageIdx++;
  }
  return { html: pages.join("\n"), pageCount: pageIdx };
}

// ── CTA close (dark) ──
function ctaPage(ctx, brand, logoDark) {
  const ctaLine = (ctx.cta || "Ready to apply? We'd love to meet you.");
  const apply = ctx.applyUrl
    ? `<div style="margin-top:32px; align-self:flex-start; background:var(--cd-accent); color:#fff; font-weight:700; font-size:15px; padding:14px 28px; border-radius:6px;">Apply now&nbsp;&nbsp;→</div>
       <div style="margin-top:14px; font-size:12px; color:rgba(255,255,255,0.6); word-break:break-all;">${esc(ctx.applyUrl)}</div>`
    : `<div style="margin-top:32px; align-self:flex-start; background:var(--cd-accent); color:#fff; font-weight:700; font-size:15px; padding:14px 28px; border-radius:6px;">Apply now&nbsp;&nbsp;→</div>`;
  return `<section class="page" style="width:816px; height:1056px; position:relative; overflow:hidden; box-sizing:border-box; background:var(--cover-grad); color:#fff;">
    <div style="position:absolute; top:-120px; left:-160px; width:500px; height:500px; border-radius:50%; background:radial-gradient(circle, transparent 0%, transparent 40%, rgba(255,255,255,0.04) 40.4%, transparent 41%, transparent 54%, rgba(255,255,255,0.04) 54.4%, transparent 55%, transparent 68%, rgba(255,255,255,0.04) 68.4%, transparent 69%); z-index:0;"></div>
    <div style="position:absolute; inset:0; padding:64px; z-index:1; display:flex; flex-direction:column; justify-content:center;">
      <span style="font-size:12px; font-weight:700; letter-spacing:0.14em; text-transform:uppercase; color:var(--cd-accent);">Ready?</span>
      <h2 style="margin:14px 0 0; font-weight:900; font-size:44px; line-height:1.05; letter-spacing:-0.02em;">${esc(ctaLine)}</h2>
      ${apply}
      <div style="position:absolute; left:64px; right:64px; bottom:40px; border-top:1px solid rgba(255,255,255,0.15); padding-top:14px; font-size:11px; color:rgba(255,255,255,0.5);">
        ${esc(brand.clientName)} · Powered by Ready Aim Climb · Hire2Scale
      </div>
    </div>
  </section>`;
}

function buildJobAdHTML({ jobad, ctx, brand, logoDark }) {
  const sections = (jobad && jobad.sections) || {};
  // Merge any cover meta the app passes through ctx with section-derived fields.
  const role = sections.role || {};
  const coverCtx = {
    role: ctx.role || jobad.role || "Open Role",
    company: ctx.company || brand.clientName,
    location: ctx.location || "",
    type: ctx.type || "",
    payRange: role.payRange || ctx.payRange || "",
    hook: (sections.why && sections.why.headline) || ctx.hook || "",
    cta: (sections.cta && sections.cta.cta) || "",
    applyUrl: ctx.applyUrl || "",
  };

  let pageNo = 1;
  const out = [coverPage(coverCtx, brand, logoDark)];
  pageNo++;
  for (const s of SECTIONS) {
    if (sections[s.key]) {
      const res = paginateSection(s, sections[s.key], brand, pageNo);
      if (res.pageCount) { out.push(res.html); pageNo += res.pageCount; }
    }
  }
  out.push(ctaPage(coverCtx, brand, logoDark));

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
  :root{ ${DS_TOKENS} }
</style></head><body>
<div id="cd-doc" class="doc" style="--cd-accent:${brand.accent}; --cd-navy:${brand.navy}; --rac-navy:${brand.navy}; --cd-blue:${brand.blue || "#4F79C2"}; --cover-grad:linear-gradient(180deg,${brand.navy} 0%,${brand.navyDark} 100%); font-family:var(--font-sans);">
${out.join("\n")}
</div></body></html>`;
}

module.exports = { buildJobAdHTML };
