// ════════════════════════════════════════════════════════════════════════
//  TRUESEAT — Hiring Playbook / Culture Codified page builders
//  Light-page geometry matches debrief-engine.js (816×1056, cream bg, 60/64
//  padding, pinned footer @ bottom:30px). Arimo @font-face is embedded by the
//  assembler (deliverable-tokens.js). navy/blue come off `brand` ONLY — never a
//  token; DS_TOKENS has no navy/blue and debrief-engine's --cd-accent is NOT in
//  DS_TOKENS (silent-invisible-heading landmine), so nothing here references it.
//
//  Primitives:
//    sectionOpenerPage(...)      dark full-bleed divider (Playbook ×8, Culture ×4)
//    coreValuePage(...)          light per-value interview page (loops values[])
//    scorecardNoSearchPage(...)  PROVEN proof page (Playbook p.6) — untouched
// ════════════════════════════════════════════════════════════════════════
const esc = (s) => String(s == null ? "" : s)
  .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// ── shared: footer for a LIGHT page (three-span: client · doc · NN / TT) ──
//  Matches the reference light-page footer exactly (SUMMIT MECHANICAL ·
//  HIRING & TALENT DEVELOPMENT PLAYBOOK · 06 / 24). pageNo/pageTotal are the
//  ABSOLUTE page counters (/24 or /16), owned by the assembler.
function lightFooter(brand, docTitle, pageNo, pageTotal) {
  const num = pageTotal
    ? `${String(pageNo).padStart(2, "0")} / ${String(pageTotal).padStart(2, "0")}`
    : String(pageNo).padStart(2, "0");
  return `<div style="position:absolute; left:64px; right:64px; bottom:30px; display:flex; justify-content:space-between; align-items:center; border-top:1px solid var(--border-subtle); padding-top:12px; font-size:10px; font-weight:600; letter-spacing:0.1em; text-transform:uppercase; color:var(--text-faint);">
    <span>${esc(brand.clientName || "")}</span>
    <span>${esc(docTitle || "")}</span>
    <span>${esc(num)}</span>
  </div>`;
}

// ── shared: footer for a DARK page (same geometry, muted-white on navy) ──
function darkFooter(brand, docTitle, pageNo, pageTotal) {
  const num = pageTotal
    ? `${String(pageNo).padStart(2, "0")} / ${String(pageTotal).padStart(2, "0")}`
    : String(pageNo).padStart(2, "0");
  return `<div style="position:absolute; left:64px; right:64px; bottom:30px; display:flex; justify-content:space-between; align-items:center; border-top:1px solid rgba(255,255,255,0.10); padding-top:12px; font-size:10px; font-weight:600; letter-spacing:0.1em; text-transform:uppercase; color:rgba(255,255,255,0.42);">
    <span style="color:rgba(255,255,255,0.72);">${esc(brand.clientName || "")}</span>
    <span>${esc(docTitle || "")}</span>
    <span>${esc(num)}</span>
  </div>`;
}

// ── shared: light-page title pattern (OWN pattern, keyed off brand.blue) ──
//  Deliberately NOT debrief-engine's titleBlock() — that one uses --cd-accent,
//  which is absent from DS_TOKENS and would render an invisible eyebrow + rule.
function lightTitle(brand, eyebrow, title, opts = {}) {
  const blue = brand.blue || "#1F6FB2";
  const h2size = opts.h2size || 38;
  const intro = opts.intro
    ? `<p style="margin:0; font-size:15px; line-height:1.6; color:var(--text-body); max-width:680px;">${esc(opts.intro)}</p>`
    : "";
  return `
    <span style="font-size:12px; font-weight:700; letter-spacing:0.12em; text-transform:uppercase; color:${blue};">${esc(eyebrow)}</span>
    <h2 style="margin:14px 0 0; font-weight:700; font-size:${h2size}px; line-height:1.04; letter-spacing:-0.02em; color:var(--text-strong);">${esc(title)}</h2>
    <div style="width:56px; height:4px; background:${blue}; margin:20px 0 ${intro ? 22 : 24}px;"></div>
    ${intro}`;
}

// ════════════════════════════════════════════════════════════════════════
//  SECTION-OPENER PRIMITIVE  (dark full-bleed divider)
//  Reference: Playbook pp.2,5,7,9,11,14,19,21,23 · Culture pp.4,11,16
//
//  Two DISTINCT counters on the same page (confirmed off the reference):
//    • top-right   = SECTION counter, e.g. "01 / 09"   (sectionNum / sectionTotal)
//    • footer      = ABSOLUTE page counter, e.g. "02 / 24" (pageNo / pageTotal)
//
//  Motifs bleed off-page: concentric rings clipped by the top-right corner,
//  mountain-line clipped by the bottom-left corner. Both authored as inline SVG
//  off the reference; stroke is a translucent tint of brand.blue so it reads on
//  any client navy.
// ════════════════════════════════════════════════════════════════════════
function sectionOpenerPage({
  brand, docTitle, sectionTitle, sectionNum, sectionTotal,
  headline, subhead, pageNo, pageTotal,
}) {
  const navy = brand.navy || "#16242E";
  const blue = brand.blue || "#1F6FB2";

  // concentric rings, top-right, bleeding off the corner. Reference draws a
  // dense stack of ~10 fine, near-circular ellipses that read as a radar/ripple
  // echo anchored into the corner (outermost rings clip off the top and right
  // edges). rx/ry ~1.12 keeps them near-circular (not the flattened loops of v1).
  const ringStroke = "rgba(120,170,220,0.20)";
  const rings = `
    <svg width="620" height="520" viewBox="0 0 620 520" fill="none"
         style="position:absolute; top:-120px; right:-140px; overflow:visible;">
      ${[26, 52, 80, 110, 143, 179, 218, 260, 305, 353].map((r) =>
        `<ellipse cx="430" cy="200" rx="${Math.round(r * 1.12)}" ry="${r}" stroke="${ringStroke}" stroke-width="1"/>`
      ).join("")}
    </svg>`;

  // mountain-line motif, bottom-left, bleeding off the corner. Reference shows
  // two overlapping ranges: a front range with a distinct TALL central peak and
  // a lower back range offset behind it, both bleeding off the left and bottom.
  // Vertex rhythm matches the reference silhouette (sharp central summit, not a
  // uniform zigzag).
  const mtnStroke = "rgba(150,175,200,0.15)";
  const mountains = `
    <svg width="1000" height="360" viewBox="0 0 1000 360" fill="none"
         style="position:absolute; bottom:70px; left:-60px; overflow:visible;">
      <polyline points="-60,360 120,250 240,300 430,120 560,250 700,180 860,290 1000,230"
                stroke="${mtnStroke}" stroke-width="1.2" fill="none"/>
      <polyline points="-60,360 180,300 340,330 470,210 650,320 800,260 1000,310"
                stroke="rgba(150,175,200,0.10)" stroke-width="1.2" fill="none"/>
    </svg>`;

  // top bar: mini mountain-mark + section title (left) · section counter (right)
  const mark = `
    <span style="display:inline-flex; align-items:center; justify-content:center; width:26px; height:26px; border-radius:50%; background:${blue}; margin-right:14px; vertical-align:middle;">
      <svg width="14" height="12" viewBox="0 0 14 12" fill="none"><path d="M1 11 L5 3 L7 6 L9 1 L13 11 Z" fill="#FFFFFF"/></svg>
    </span>`;

  const topBar = `
    <div style="position:absolute; top:60px; left:64px; right:64px; display:flex; justify-content:space-between; align-items:center;">
      <div style="display:flex; align-items:center;">
        ${mark}
        <span style="font-size:11px; font-weight:700; letter-spacing:0.16em; text-transform:uppercase; color:rgba(255,255,255,0.55);">${esc(sectionTitle)}</span>
      </div>
      ${sectionNum && sectionTotal
        ? `<span style="font-size:13px; font-weight:700; letter-spacing:0.08em; color:${blue};">${String(sectionNum).padStart(2, "0")} / ${String(sectionTotal).padStart(2, "0")}</span>`
        : ""}
    </div>`;

  // headline block, vertically centered low (reference sits it ~55% down)
  const sub = subhead
    ? `<p style="margin:26px 0 0; font-size:17px; line-height:1.5; color:rgba(255,255,255,0.62); max-width:560px;">${esc(subhead)}</p>`
    : "";
  const headlineBlock = `
    <div style="position:absolute; left:64px; right:64px; top:52%;">
      <h1 style="margin:0; font-weight:700; font-size:64px; line-height:1.05; letter-spacing:-0.02em; color:#FFFFFF; max-width:660px;">${esc(headline)}</h1>
      <div style="width:64px; height:4px; background:${blue}; margin:28px 0 0;"></div>
      ${sub}
    </div>`;

  return `<section class="page" style="width:816px; height:1056px; position:relative; overflow:hidden; box-sizing:border-box; background:${navy}; color:#FFFFFF;">
    ${rings}
    ${mountains}
    ${topBar}
    ${headlineBlock}
    ${darkFooter(brand, docTitle, pageNo, pageTotal)}
  </section>`;
}

// ════════════════════════════════════════════════════════════════════════
//  CORE-VALUE PAGE PRIMITIVE  (light interview page — loops values[])
//  Reference: Playbook pp.16–18 (CORE VALUE · N OF N)
//
//  Layout: eyebrow "CORE VALUE · {i} OF {N}"  →  value name (h2) → blue rule →
//  definition (grey line)  →  navy question callout  →  two-column split
//  (FOLLOW-UP PROBES | WHAT TO LISTEN FOR)  →  SCORING RUBRIC (1·3·5 fixed).
//
//  Resilience (schema-spec gates):
//   • idx/total drive "N OF N" from values.length — NEVER hard-coded.
//   • every [String] length-guarded before its block emits (no empty scaffolding).
//   • partial value (name + definition only) renders what it has; missing lists
//     drop cleanly.
//   • rubric renders exactly Concern/Developing/Strong at 1/3/5 — no 2/4 row ever.
// ════════════════════════════════════════════════════════════════════════
function coreValuePage({ brand, docTitle, value, idx, total, pageNo, pageTotal }) {
  const navy = brand.navy || "#16242E";
  const blue = brand.blue || "#1F6FB2";
  const v = value || {};

  const eyebrow = `Core Value · ${idx} of ${total}`;

  // navy question callout (only if a question exists)
  const questionCallout = v.question
    ? `<div style="position:relative; background:${navy}; border-radius:2px; padding:22px 26px; margin:0 0 30px;">
         <div style="position:absolute; left:0; top:0; bottom:0; width:4px; background:${blue};"></div>
         <div style="font-size:11px; font-weight:700; letter-spacing:0.12em; text-transform:uppercase; color:${blue}; margin-bottom:10px;">The Question</div>
         <div style="font-size:19px; font-weight:700; line-height:1.35; color:#FFFFFF;">\u201c${esc(v.question)}\u201d</div>
       </div>`
    : "";

  // two-column split: probes (blue squares) | listenFor (dark squares)
  const bullet = (color) => `<span style="display:inline-block; width:7px; height:7px; background:${color}; margin:6px 10px 0 0; flex:0 0 auto;"></span>`;
  const listCol = (label, items, sqColor) => {
    const arr = Array.isArray(items) ? items.filter(Boolean) : [];
    if (!arr.length) return "";
    const rows = arr.map((t) =>
      `<div style="display:flex; align-items:flex-start; margin:0 0 12px;">
        ${bullet(sqColor)}
        <span style="font-size:13.5px; line-height:1.5; color:var(--text-body);">${esc(t)}</span>
      </div>`).join("");
    return `<div style="flex:1 1 0; min-width:0;">
      <div style="font-size:11px; font-weight:700; letter-spacing:0.1em; text-transform:uppercase; color:var(--text-faint); margin:0 0 14px;">${esc(label)}</div>
      ${rows}
    </div>`;
  };
  const probesCol = listCol("Follow-up Probes", v.probes, blue);
  const listenCol = listCol("What to Listen For", v.listenFor, "#1B2A3B");
  const splitBlock = (probesCol || listenCol)
    ? `<div style="display:flex; gap:44px; margin:0 0 30px;">${probesCol}${listenCol}</div>`
    : "";

  // scoring rubric — fixed 1 / 3 / 5, no 2 or 4, ever
  const r = v.rubric || {};
  const rubricRow = (score, label, scoreColor, text) => {
    if (!text) return "";
    return `<tr style="border-top:1px solid var(--border-default);">
      <td style="padding:16px 18px; vertical-align:top; width:160px; white-space:nowrap;">
        <span style="font-weight:700; font-size:14px; color:${scoreColor};">${score}</span>
        <span style="font-weight:700; font-size:12px; letter-spacing:0.04em; text-transform:uppercase; color:var(--text-muted); margin-left:6px;">${esc(label)}</span>
      </td>
      <td style="padding:16px 18px; vertical-align:top; font-size:13.5px; line-height:1.55; color:var(--text-body);">${esc(text)}</td>
    </tr>`;
  };
  const rubricRows = [
    rubricRow("1", "Concern", "#B0201A", r.concern),
    rubricRow("3", "Developing", "#555555", r.developing),
    rubricRow("5", "Strong", (brand.blue || "#1F6FB2"), r.strong),
  ].join("");
  const rubricBlock = rubricRows
    ? `<div style="font-size:11px; font-weight:700; letter-spacing:0.1em; text-transform:uppercase; color:var(--text-faint); margin:0 0 12px;">Scoring Rubric</div>
       <table style="width:100%; border-collapse:collapse; border:1px solid var(--border-default);">
         <thead><tr style="background:var(--rac-off-white);">
           <td style="padding:12px 18px; font-weight:700; font-size:11px; letter-spacing:0.06em; text-transform:uppercase; color:var(--text-muted);">Score</td>
           <td style="padding:12px 18px; font-weight:700; font-size:11px; letter-spacing:0.06em; text-transform:uppercase; color:var(--text-muted);">What It Sounds Like</td>
         </tr></thead>
         <tbody>${rubricRows}</tbody>
       </table>`
    : "";

  const definition = v.definition
    ? `<p style="margin:0 0 28px; font-size:15px; line-height:1.6; color:var(--text-body); max-width:680px;">${esc(v.definition)}</p>`
    : "";

  const inner = `
    ${lightTitle(brand, eyebrow, v.name || "Core Value")}
    ${definition}
    ${questionCallout}
    ${splitBlock}
    ${rubricBlock}
  `;

  return `<section class="page" style="width:816px; height:1056px; position:relative; overflow:hidden; box-sizing:border-box; background:var(--rac-cream); color:var(--text-strong);">
    <div style="position:absolute; inset:0; padding:60px 64px;">${inner}</div>
    ${lightFooter(brand, docTitle, pageNo, pageTotal)}
  </section>`;
}

// ════════════════════════════════════════════════════════════════════════
//  PROVEN PROOF PAGE — untouched (Playbook p.6 "No Scorecard. No Search.")
// ════════════════════════════════════════════════════════════════════════
const SCORECARD_ROWS = [
  { c: "Role Title", weak: "\u201cOps person, kind of a catch-all.\u201d", strong: "Operations Manager \u2014 specific title and department." },
  { c: "Role Purpose", weak: "\u201cHelp keep things running.\u201d", strong: "One sentence: why the role exists and what problem it solves." },
  { c: "Top Outcomes", weak: "\u201cManage a territory well.\u201d", strong: "Complete 95%+ of scheduled stops with zero re-service in 60 days." },
  { c: "Behavioral Target", weak: "\u201cGood attitude.\u201d", strong: "The Predictive Index pattern that best fits this role, set before posting." },
];

function scorecardNoSearchPage(brand) {
  const navy = brand.navy || "#16242E";
  const blue = brand.blue || "#1F6FB2";
  const eyebrow = "The non-negotiable first step";

  const rows = SCORECARD_ROWS.map((r, i) => `
    <tr style="border-top:1px solid var(--border-default);">
      <td style="padding:16px 18px; vertical-align:top; font-weight:700; font-size:13px; color:var(--text-strong); width:150px;">${esc(r.c)}</td>
      <td style="padding:16px 18px; vertical-align:top; font-style:italic; font-size:13px; line-height:1.5; color:var(--text-muted); width:230px;">${esc(r.weak)}</td>
      <td style="padding:16px 18px; vertical-align:top; font-weight:700; font-size:13px; line-height:1.5; color:var(--text-strong); background:rgba(31,111,178,0.05);">${esc(r.strong)}</td>
    </tr>`).join("");

  const inner = `
    <span style="font-size:12px; font-weight:700; letter-spacing:0.12em; text-transform:uppercase; color:${blue};">${esc(eyebrow)}</span>
    <h2 style="margin:14px 0 0; font-weight:700; font-size:38px; line-height:1.04; letter-spacing:-0.02em; color:var(--text-strong);">No Scorecard. No Search.</h2>
    <div style="width:56px; height:4px; background:${blue}; margin:20px 0 24px;"></div>
    <p style="margin:0 0 26px; font-size:15px; line-height:1.6; color:var(--text-body); max-width:680px;">Every open role must have a completed Role Scorecard before a job posting is written, before a candidate is called, and before a recruiter is engaged.</p>

    <div style="border-left:4px solid ${blue}; padding:2px 0 2px 20px; margin:0 0 30px;">
      <div style="font-weight:700; font-size:22px; line-height:1.2; color:var(--text-strong);">\u201cNo scorecard. No search. No exceptions.\u201d</div>
      <div style="font-size:12px; color:var(--text-faint); margin-top:6px;">The Rule</div>
    </div>

    <div style="font-size:11px; font-weight:700; letter-spacing:0.1em; text-transform:uppercase; color:var(--text-faint); margin:0 0 12px;">Role Scorecard Template</div>
    <table style="width:100%; border-collapse:collapse; border:1px solid var(--border-default); font-size:13px;">
      <thead>
        <tr style="background:var(--rac-off-white);">
          <td style="padding:12px 18px; font-weight:700; font-size:11px; letter-spacing:0.06em; text-transform:uppercase; color:var(--text-muted);">Component</td>
          <td style="padding:12px 18px; font-weight:700; font-size:11px; letter-spacing:0.06em; text-transform:uppercase; color:var(--text-muted);">What Weak Looks Like</td>
          <td style="padding:12px 18px; font-weight:700; font-size:11px; letter-spacing:0.06em; text-transform:uppercase; color:${blue}; background:rgba(31,111,178,0.08);">What Strong Looks Like</td>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>

    <div style="margin-top:30px; background:${navy}; border-radius:2px; padding:22px 26px; position:relative;">
      <div style="position:absolute; left:0; top:0; bottom:0; width:4px; background:${blue};"></div>
      <div style="font-size:11px; font-weight:700; letter-spacing:0.1em; text-transform:uppercase; color:${blue}; margin-bottom:8px;">What a Strong Outcome Looks Like</div>
      <div style="font-size:14px; line-height:1.6; color:#E8EDF2;">Outcomes must be <strong style="color:#fff;">Specific, Measurable, and Time-Bound</strong>. If you cannot measure it, it is not an outcome \u2014 it is a hope.</div>
    </div>
  `;

  return `<section class="page" style="width:816px; height:1056px; position:relative; overflow:hidden; box-sizing:border-box; background:var(--rac-cream); color:var(--text-strong);">
    <div style="position:absolute; inset:0; padding:60px 64px;">${inner}</div>
    <div style="position:absolute; left:64px; right:64px; bottom:30px; display:flex; justify-content:space-between; align-items:center; border-top:1px solid var(--border-subtle); padding-top:12px; font-size:10px; font-weight:600; letter-spacing:0.1em; text-transform:uppercase; color:var(--text-faint);">
      <span>${esc(brand.clientName || "Summit Mechanical")}</span>
      <span>Hiring &amp; Talent Development Playbook</span>
      <span>06 / 24</span>
    </div>
  </section>`;
}

module.exports = {
  esc, lightFooter, darkFooter, lightTitle,
  sectionOpenerPage, coreValuePage, scorecardNoSearchPage,
};
