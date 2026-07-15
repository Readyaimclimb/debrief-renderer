// ════════════════════════════════════════════════════════════════════════
//  TRUESEAT — Hiring Playbook page builders  [PROOF: one page only]
//  Matches the RAC-standard light-page geometry from debrief-engine.js
//  (816×1056, cream bg, 60/64 padding, pinned footer) and pulls the embedded
//  Arimo @font-face from deliverable-tokens.js. This proof renders page 6 of
//  Hiring_Playbook_and_Development_Standard.pdf ("No Scorecard. No Search.")
//  to confirm font + table + callout fidelity before building the full deck.
// ════════════════════════════════════════════════════════════════════════
const esc = (s) => String(s == null ? "" : s)
  .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// Page-6 content, verbatim from the reference PDF.
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

module.exports = { scorecardNoSearchPage };
