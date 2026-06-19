// ════════════════════════════════════════════════════════════════════════
//  HIRE2SCALE — 30/60/90 Roadmap PDF engine
//  Matches the debrief PDF design standard exactly: same DS_TOKENS, same
//  --cd-accent / --cd-navy / --cover-grad variable contract, same .doc
//  print wrapper, same cream interior pages + footer. The two documents are
//  one product family.
//
//  Input:  roadmap (saved roadmap object) + ctx (role/company) + brand
//  Output: self-contained HTML string -> Puppeteer -> PDF
// ════════════════════════════════════════════════════════════════════════
const E = require("./debrief-engine.js");
const { esc, DS_TOKENS, footer, titleBlock, lightPage } = E;

const PHASES = [
  { key: "learn",      band: "Days 1–30",  title: "Learn",      tag: "Understand the business, team, tools, and role" },
  { key: "contribute", band: "Days 31–60", title: "Contribute", tag: "Execute with growing independence" },
  { key: "own",        band: "Days 61–90", title: "Own",        tag: "Fully ramped and on pace toward the 12-month goal" },
];

// ── dark cover — same archetype/vars as the debrief cover (uses --cover-grad) ──
function coverPage(brand, ctx, logoDark) {
  const logo = logoDark
    ? `<img src="${logoDark}" alt="" style="height:46px; margin-bottom:48px;" />`
    : `<div style="height:46px; margin-bottom:48px;"></div>`;
  return `<section class="page" style="width:816px; height:1056px; position:relative; overflow:hidden; box-sizing:border-box; background:var(--cover-grad); color:#fff;">
    <div style="position:absolute; inset:0; padding:84px 64px; display:flex; flex-direction:column;">
      ${logo}
      <span style="font-size:12px; font-weight:700; letter-spacing:0.16em; text-transform:uppercase; color:var(--cd-accent);">Onboarding Roadmap</span>
      <h1 style="margin:18px 0 0; font-weight:900; font-size:54px; line-height:1.0; letter-spacing:-0.03em; max-width:620px;">The First 90 Days</h1>
      <div style="width:64px; height:4px; background:var(--cd-accent); margin:28px 0 26px;"></div>
      <p style="margin:0; font-size:19px; font-weight:600; line-height:1.4; color:#E8ECF1; max-width:560px;">${esc(ctx.role || "New Hire")}</p>
      <p style="margin:6px 0 0; font-size:15px; line-height:1.5; color:#9FB0C2; max-width:560px;">A milestone-driven ramp from learning the business to owning the role — built to the Ready Aim Climb standard.</p>
      <div style="margin-top:auto; display:flex; justify-content:space-between; align-items:flex-end;">
        <div>
          <div style="font-size:13px; font-weight:700; color:#fff;">${esc(brand.clientName)}</div>
          <div style="font-size:11px; color:#8294A6; margin-top:3px;">${esc(brand.date)}</div>
        </div>
        <div style="font-size:10px; font-weight:600; letter-spacing:0.1em; text-transform:uppercase; color:#6E8198;">Powered by Ready Aim Climb · Hire2Scale</div>
      </div>
    </div>
  </section>`;
}

function phasePage(phase, data, brand, pageNo) {
  const v = data || {};
  const m = v.milestone || {};
  const milestoneCard = `
    <div style="background:#F1F5F4; border-left:5px solid var(--cd-navy); border-radius:0 10px 10px 0; padding:20px 22px; margin-bottom:22px;">
      <div style="font-size:11px; font-weight:700; letter-spacing:0.1em; text-transform:uppercase; color:var(--cd-navy); margin-bottom:8px;">The Milestone</div>
      <div style="font-size:19px; font-weight:800; line-height:1.3; color:var(--text-strong);">${esc(m.outcome)}</div>
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:18px; margin-top:16px;">
        ${m.hireKnows ? `<div><div style="font-size:10.5px; font-weight:700; letter-spacing:0.06em; color:#2F7D54; margin-bottom:4px;">HIRE KNOWS THEY'RE WINNING</div><div style="font-size:13.5px; line-height:1.5; color:var(--text-body);">${esc(m.hireKnows)}</div></div>` : ""}
        ${m.managerKnows ? `<div><div style="font-size:10.5px; font-weight:700; letter-spacing:0.06em; color:var(--cd-navy); margin-bottom:4px;">MANAGER KNOWS THEY'RE ON TRACK</div><div style="font-size:13.5px; line-height:1.5; color:var(--text-body);">${esc(m.managerKnows)}</div></div>` : ""}
      </div>
    </div>`;
  const block = (heading, inner) => inner ? `
    <div style="margin-bottom:18px;">
      <div style="font-size:11px; font-weight:700; letter-spacing:0.08em; text-transform:uppercase; color:var(--cd-accent); margin-bottom:7px;">${heading}</div>
      ${inner}
    </div>` : "";
  const rels = (v.relationships || []).length
    ? `<div style="font-size:13.5px; line-height:1.65; color:var(--text-body);">${(v.relationships || []).map(r => `<div><b style="color:var(--text-strong);">${esc(r.who)}</b>${r.why ? ` — ${esc(r.why)}` : ""}</div>`).join("")}</div>`
    : "";
  const ul = (arr) => (arr || []).length
    ? `<ul style="margin:0; padding-left:20px; font-size:13.5px; line-height:1.65; color:var(--text-body);">${(arr || []).map(x => `<li>${esc(x)}</li>`).join("")}</ul>`
    : "";
  const twoCol = `
    <div style="display:grid; grid-template-columns:1fr 1fr; gap:24px;">
      <div>${block("Learning Requirements", ul(v.learning))}</div>
      <div>${block("First Deliverables", ul(v.deliverables))}</div>
    </div>`;
  const line = (txt) => txt ? `<div style="font-size:13.5px; line-height:1.6; color:var(--text-body);">${esc(txt)}</div>` : "";
  const inner = `
    ${titleBlock(phase.band, phase.title, { intro: esc(phase.tag), h2size: 38 })}
    ${milestoneCard}
    ${block("Key Relationships", rels)}
    ${twoCol}
    ${block("Check-in Rhythm", line(v.checkInRhythm))}
    ${block("When Stuck", line(v.escalation))}`;
  return lightPage(inner, brand, pageNo);
}

function buildRoadmapHTML({ roadmap, ctx, brand, logoDark }) {
  const phases = (roadmap && roadmap.phases) || {};
  let pageNo = 1;
  const out = [coverPage(brand, ctx, logoDark)];
  pageNo++;
  for (const p of PHASES) {
    if (phases[p.key]) { out.push(phasePage(p, phases[p.key], brand, pageNo)); pageNo++; }
  }
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

module.exports = { buildRoadmapHTML };
