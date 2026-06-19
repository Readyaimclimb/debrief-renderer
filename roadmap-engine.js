// ════════════════════════════════════════════════════════════════════════
//  HIRE2SCALE — 30/60/90 Roadmap PDF engine
//  Matched to the debrief cover treatment exactly: logo at 74px in a flex row
//  with the accent divider, concentric rings, base glow, structured meta row.
//  Interior pages reuse the debrief's lightPage/titleBlock, with a roadmap-
//  specific footer label.
// ════════════════════════════════════════════════════════════════════════
const E = require("./debrief-engine.js");
const { esc, DS_TOKENS, titleBlock } = E;

// Roadmap-specific footer (the shared footer() says "Candidate Debrief").
function rmFooter(brand, pageNo) {
  return `<div style="position:absolute; left:64px; right:64px; bottom:30px; display:flex; justify-content:space-between; align-items:center; border-top:1px solid var(--border-subtle); padding-top:12px; font-size:10px; font-weight:600; letter-spacing:0.1em; text-transform:uppercase; color:var(--text-faint);"><span>${esc(brand.clientName)} · Onboarding Roadmap</span><span>${String(pageNo).padStart(2, "0")}</span></div>`;
}
function rmLightPage(inner, brand, pageNo) {
  return `<section class="page" style="width:816px; height:1056px; position:relative; overflow:hidden; box-sizing:border-box; background:var(--rac-cream); color:var(--text-strong);">
    <div style="position:absolute; inset:0; padding:60px 64px;">${inner}</div>
    ${rmFooter(brand, pageNo)}
  </section>`;
}

const PHASES = [
  { key: "learn",      band: "Days 1–30",  title: "Learn",      tag: "Understand the business, team, tools, and role" },
  { key: "contribute", band: "Days 31–60", title: "Contribute", tag: "Execute with growing independence" },
  { key: "own",        band: "Days 61–90", title: "Own",        tag: "Fully ramped and on pace toward the 12-month goal" },
];

// ── COVER — matched to the debrief cover (rings, glow, 74px logo, meta row) ──
function coverPage(brand, ctx, logoDark) {
  const logo = logoDark
    ? `<img src="${logoDark}" alt="${esc(brand.clientName)}" style="height:74px; width:auto;">`
    : `<div style="height:74px;"></div>`;
  const meta = (label, val, flex, pad) => `<div style="flex:${flex}; padding:${pad};">
    <div style="font-size:10px; font-weight:700; letter-spacing:0.12em; text-transform:uppercase; color:rgba(255,255,255,0.45); margin-bottom:9px;">${esc(label)}</div>
    <div style="font-size:14.5px; line-height:1.5; color:rgba(255,255,255,0.92);">${esc(val)}</div>
  </div>`;
  return `<section class="page" style="width:816px; height:1056px; position:relative; overflow:hidden; box-sizing:border-box; background:var(--cover-grad); color:#fff;">
    <div style="position:absolute; top:-150px; right:-180px; width:540px; height:540px; border-radius:50%; background:radial-gradient(circle, transparent 0%, transparent 38%, rgba(255,255,255,0.045) 38.4%, transparent 39%, transparent 50%, rgba(255,255,255,0.045) 50.4%, transparent 51%, transparent 62%, rgba(255,255,255,0.045) 62.4%, transparent 63%, transparent 74%, rgba(255,255,255,0.045) 74.4%, transparent 75%); z-index:0;"></div>
    <div style="position:absolute; left:0; right:0; bottom:0; height:320px; background:linear-gradient(180deg, transparent 0%, rgba(234,107,71,0.12) 100%); z-index:0;"></div>
    <div style="position:absolute; inset:0; padding:64px; display:flex; flex-direction:column; z-index:1;">
      <div style="display:flex; align-items:center; justify-content:space-between;">
        <div style="display:flex; align-items:center; gap:18px;">
          ${logo}
          <div style="border-left:1px solid rgba(255,255,255,0.22); padding-left:18px; font-weight:700; font-size:9px; letter-spacing:0.24em; text-transform:uppercase; color:var(--cd-accent); line-height:1.7;">Onboarding<br>Roadmap</div>
        </div>
        <span style="font-size:11px; font-weight:700; letter-spacing:0.2em; text-transform:uppercase; color:rgba(255,255,255,0.5);">The First 90 Days</span>
      </div>
      <div style="flex:1;"></div>
      <span style="font-size:12px; font-weight:700; letter-spacing:0.18em; text-transform:uppercase; color:var(--cd-accent);">Onboarding Roadmap</span>
      <h1 style="margin:16px 0 0; font-weight:900; font-size:72px; line-height:0.96; letter-spacing:-0.03em;">The First<br>90 Days</h1>
      <div style="width:72px; height:4px; background:var(--cd-accent); margin:26px 0 22px;"></div>
      <p style="margin:0; max-width:560px; font-size:18px; line-height:1.5; color:rgba(255,255,255,0.82);">A milestone-driven ramp for the <b style="color:#fff; font-weight:700;">${esc(ctx.role || "new hire")}</b> — from learning the business to fully owning the role, built to the Ready Aim Climb standard.</p>
      <div style="flex:1;"></div>
      <div style="display:flex; border-top:1px solid rgba(255,255,255,0.16); padding-top:22px;">
        ${meta("Role", ctx.role || "New Hire", 1.2, "0 24px 0 0")}
        <div style="width:1px; background:rgba(255,255,255,0.16);"></div>
        ${meta("Company", brand.clientName, 1.2, "0 24px")}
        <div style="width:1px; background:rgba(255,255,255,0.16);"></div>
        ${meta("Date", brand.date, 1, "0 0 0 24px")}
      </div>
      <div style="margin-top:26px; font-size:11px; letter-spacing:0.04em; color:rgba(255,255,255,0.5);">Powered by Ready Aim Climb · Hire2Scale</div>
    </div>
  </section>`;
}

// ── PHASE PAGE — bordered cards with left-accent bars, more breathing room ──
function phasePage(phase, data, brand, pageNo) {
  const v = data || {};
  const m = v.milestone || {};
  const NAVY = "var(--cd-navy)", ACCENT = "var(--cd-accent)", GOOD = "#2F7D54";

  // milestone: navy block (mirrors the debrief's "what the panel established")
  const milestoneCard = `
    <div style="background:var(--rac-navy); color:#fff; padding:26px 30px; border-left:4px solid ${ACCENT}; margin-bottom:24px;">
      <div style="font-size:11px; font-weight:700; letter-spacing:0.12em; text-transform:uppercase; color:${ACCENT}; margin-bottom:12px;">The Milestone</div>
      <p style="margin:0; font-size:18px; font-weight:700; line-height:1.45; color:#fff;">${esc(m.outcome)}</p>
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:22px; margin-top:20px; padding-top:18px; border-top:1px solid rgba(255,255,255,0.16);">
        ${m.hireKnows ? `<div><div style="font-size:10px; font-weight:700; letter-spacing:0.08em; text-transform:uppercase; color:#7FD4A6; margin-bottom:6px;">Hire knows they're winning</div><div style="font-size:13.5px; line-height:1.5; color:rgba(255,255,255,0.9);">${esc(m.hireKnows)}</div></div>` : ""}
        ${m.managerKnows ? `<div><div style="font-size:10px; font-weight:700; letter-spacing:0.08em; text-transform:uppercase; color:#9FB4D4; margin-bottom:6px;">Manager knows they're on track</div><div style="font-size:13.5px; line-height:1.5; color:rgba(255,255,255,0.9);">${esc(m.managerKnows)}</div></div>` : ""}
      </div>
    </div>`;

  // a white bordered card with left-accent bar (the debrief's row treatment)
  const card = (heading, bodyHTML, accent = ACCENT) => bodyHTML ? `
    <div style="background:#fff; border:1px solid var(--border-subtle); border-left:4px solid ${accent}; box-shadow:var(--shadow-card); padding:18px 22px; margin-bottom:14px;">
      <div style="font-size:10.5px; font-weight:700; letter-spacing:0.1em; text-transform:uppercase; color:${accent}; margin-bottom:10px;">${heading}</div>
      ${bodyHTML}
    </div>` : "";

  const rels = (v.relationships || []).length
    ? `<div style="font-size:13.5px; line-height:1.7; color:var(--text-body);">${(v.relationships || []).map(r => `<div style="margin-bottom:3px;"><b style="color:var(--text-strong);">${esc(r.who)}</b>${r.why ? ` — ${esc(r.why)}` : ""}</div>`).join("")}</div>`
    : "";
  const ul = (arr) => (arr || []).length
    ? `<ul style="margin:0; padding-left:20px; font-size:13.5px; line-height:1.7; color:var(--text-body);">${(arr || []).map(x => `<li style="margin-bottom:5px;">${esc(x)}</li>`).join("")}</ul>`
    : "";
  const line = (txt) => txt ? `<div style="font-size:13.5px; line-height:1.6; color:var(--text-body);">${esc(txt)}</div>` : "";

  // two-up row for learning + deliverables, as side-by-side bordered cards
  const learnDeliv = `
    <div style="display:grid; grid-template-columns:1fr 1fr; gap:14px; margin-bottom:14px;">
      <div style="background:#fff; border:1px solid var(--border-subtle); border-left:4px solid ${NAVY}; box-shadow:var(--shadow-card); padding:18px 22px;">
        <div style="font-size:10.5px; font-weight:700; letter-spacing:0.1em; text-transform:uppercase; color:${NAVY}; margin-bottom:10px;">Learning Requirements</div>${ul(v.learning)}
      </div>
      <div style="background:#fff; border:1px solid var(--border-subtle); border-left:4px solid ${NAVY}; box-shadow:var(--shadow-card); padding:18px 22px;">
        <div style="font-size:10.5px; font-weight:700; letter-spacing:0.1em; text-transform:uppercase; color:${NAVY}; margin-bottom:10px;">First Deliverables</div>${ul(v.deliverables)}
      </div>
    </div>`;

  // check-in + escalation as a two-up of compact cards
  const checkEsc = `
    <div style="display:grid; grid-template-columns:1fr 1fr; gap:14px;">
      ${card("Check-in Rhythm", line(v.checkInRhythm))}
      ${card("When Stuck", line(v.escalation))}
    </div>`.replace(/margin-bottom:14px;/g, "margin-bottom:0;");

  const inner = `
    ${titleBlock(phase.band, phase.title, { intro: esc(phase.tag), h2size: 40 })}
    ${milestoneCard}
    ${card("Key Relationships", rels)}
    ${learnDeliv}
    ${checkEsc}`;
  return rmLightPage(inner, brand, pageNo);
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
