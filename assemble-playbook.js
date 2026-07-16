// ════════════════════════════════════════════════════════════════════════
//  TRUESEAT — Hiring & Talent Development Playbook assembler (FULL 24-page deck)
//  Composes the proven primitives (playbook-pages.js) with tenant data + brand.
//  The renderer NEVER calls a model — it renders stored values[] + config text.
//
//  PAGE MAP (physical page → footer counter; cover + back cover UNCOUNTED):
//    phys 01  cover                                    (no counter)
//    phys 02  TOC                                      footer 01 / 24
//    phys 03  section-opener 01/09 Philosophy          footer 02 / 24
//    phys 04  light: We Hold a Standard (callout+3)     footer 03 / 24
//    phys 05  light: Process Metrics table              footer 04 / 24
//    phys 06  section-opener 02/09 Define the Seat      footer 05 / 24
//    phys 07  light: No Scorecard No Search             footer 06 / 24
//    phys 08  section-opener 03/09 Internal Talent      footer 07 / 24
//    phys 09  light: Talent Bench Review                footer 08 / 24
//    phys 10  section-opener 04/09 Developing Leaders   footer 09 / 24
//    phys 11  light: Development Track (1-4)             footer 10 / 24
//    phys 12  section-opener 05/09 8-Stage Funnel       footer 11 / 24
//    phys 13  light: Funnel stages 1-4                  footer 12 / 24
//    phys 14  light: Funnel stages 5-8                  footer 13 / 24
//    phys 15  section-opener 06/09 Interview System     footer 14 / 24
//    phys 16  light: Every Value Gets Evaluated         footer 15 / 24
//    phys 17  core-value 1/N                            footer 16 / 24
//    phys 18  core-value 2/N                            footer 17 / 24
//    phys 19  core-value 3/N                            footer 18 / 24
//    phys 20  section-opener 07/09 Decision Matrix      footer 19 / 24
//    phys 21  light: Final Decision Framework           footer 20 / 24
//    phys 22  section-opener 08/09 Offer & 90-Day       footer 21 / 24
//    phys 23  light: 90-Day Success Framework           footer 22 / 24
//    phys 24  section-opener 09/09 Principles/RedFlags  footer 23 / 24
//    phys 25  light: Commitments Not Guidelines         footer 24 / 24
//    phys 26  back cover (CTA + brand lockup)           (no counter)
//
//  NOTE: core-value pages (17-19) and the scored-rubric table (16) derive their
//  count from values.length. If a tenant has != 3 values, the deck length and
//  the "N of N" counters shift accordingly — footers for pages AFTER the value
//  block are recomputed from the actual value count, never hard-coded.
// ════════════════════════════════════════════════════════════════════════
const fs = require("fs");
const path = require("path");
const T = require("./deliverable-tokens.js");
const E = require("./debrief-engine.js"); // DS_TOKENS only (light palette)
const P = require("./playbook-pages.js");

const DOC = "Hiring & Talent Development Playbook";

// ── logo loader ──────────────────────────────────────────────────────────
//  Brand marks are stored as base64 .txt sidecar files (same pattern as the
//  existing cdlogo_dark_t.png.txt). loadLogo reads one and returns a ready
//  data: URI, or "" if the file is missing — callers treat "" as "fall back
//  to the text/SVG wordmark", so a missing file NEVER breaks a render.
//  Loaded ONCE per build (module-cached by the OS/page cache anyway).
function loadLogo(file) {
  try {
    const b64 = fs.readFileSync(path.join(__dirname, file), "utf8").trim();
    return b64 ? "data:image/png;base64," + b64 : "";
  } catch (e) {
    return "";
  }
}

// Fixed base-brand marks — identical on EVERY tenant's playbook (Trueseat is the
// product, RAC is the partner). These are not themeable and not per-client.
const BRAND_LOGOS = {
  trueseat:     loadLogo("trueseat-logo.txt"),   // full "▢ Trueseat" lockup (reversed, for dark)
  trueseatMark: loadLogo("trueseat-mark.txt"),   // compact chair mark only
  rac:          loadLogo("rac-logo.txt"),        // Ready Aim Climb mountain (white knocked out)
};

// Per-client logo resolver. A real client passes brand.branding.logo (light-bg
// art) and brand.branding.logoDark (art tuned for dark pages) as base64 data
// URIs from the app, EXACTLY as Contractor Dynamics already does. For the built
// -in demo tenants that have sidecar files in this repo, we also fall back to a
// named .txt so the Summit proof renders its real mark with no app round-trip.
// Resolution order: explicit brand.branding.* → named demo sidecar → "".
function resolveClientLogos(brand) {
  const bd = (brand && brand.branding) || {};
  const norm = (v) => {
    const s = String(v || "").trim();
    if (!s) return "";
    return /^data:/i.test(s) ? s : "data:image/png;base64," + s;
  };
  // demo sidecars keyed by client code (only present for seeded demo tenants)
  const code = String((brand && brand.code) || "").toLowerCase();
  const demoLight = { "summit-2026": "summit-light.txt" }[code] || "";
  const demoDark  = { "summit-2026": "summit-dark.txt"  }[code] || "";
  return {
    light: norm(bd.logo)     || loadLogo(demoLight),
    dark:  norm(bd.logoDark) || loadLogo(demoDark) || norm(bd.logo) || loadLogo(demoLight),
  };
}

// numberWord — spell a small count as a word for body prose ("three values"),
// matching the reference. Falls back to the numeral above 12. Used where the
// value count appears in a sentence (the P16 scoring rule).
function numberWord(n) {
  const W = ["zero", "one", "two", "three", "four", "five", "six", "seven",
             "eight", "nine", "ten", "eleven", "twelve"];
  return (n >= 0 && n <= 12) ? W[n] : String(n);
}

function buildPlaybookHTML({ ctx, brand, values }) {
  const clientLogos = resolveClientLogos(brand);
  const b = {
    clientName: (brand && brand.clientName) || (ctx && ctx.company) || "Summit Mechanical",
    navy: (brand && brand.navy) || "#16242E",
    blue: (brand && brand.blue) || "#1F6FB2",
    // logos: fixed base-brand marks + the resolved per-client mark. Pages read
    // these off `brand`; any that are "" fall back to the prior text/SVG wordmark
    // so nothing ever renders blank.
    logos: {
      trueseat:     BRAND_LOGOS.trueseat,
      trueseatMark: BRAND_LOGOS.trueseatMark,
      rac:          BRAND_LOGOS.rac,
      clientLight:  clientLogos.light,
      clientDark:   clientLogos.dark,
    },
  };
  // shortName — the CONVERSATIONAL name used in body prose ("Summit's own core
  // values", "all Summit core values"), matching how the reference deck reads.
  // The reference keeps the client's SHORT name literal in prose; the code was
  // either dropping the name entirely (P2/P13) or interpolating the FULL legal
  // name (P15/P21: "Summit Mechanical's own core values"). Both are the same
  // class of copy-drift bug. This derives the short name generically so Summit
  // renders "Summit", Contractor Dynamics renders "Contractor Dynamics", etc. —
  // white-label-safe, never hard-coded to one tenant. Rule: drop a trailing
  // generic business word (Mechanical, HVAC, Inc, LLC, Co, Company, Group,
  // Services, Heating, Cooling, Plumbing, Electric, Contractors) so a two-token
  // "First Generic" name collapses to "First"; multi-word or non-generic names
  // are left whole (e.g. "Contractor Dynamics" stays "Contractor Dynamics").
  const shortName = (() => {
    const full = String(b.clientName || "").trim();
    if (!full) return "";
    const parts = full.split(/\s+/);
    if (parts.length < 2) return full;
    const GENERIC = new Set([
      "mechanical", "hvac", "inc", "inc.", "llc", "l.l.c.", "co", "co.",
      "company", "corp", "corp.", "group", "services", "service", "heating",
      "cooling", "controls", "plumbing", "electric", "electrical", "contractors",
      "contracting", "solutions", "systems", "industries", "enterprises",
    ]);
    const last = parts[parts.length - 1].toLowerCase().replace(/[.,]/g, "");
    // only trim when the name is EXACTLY two tokens and the 2nd is generic —
    // avoids over-trimming a real multi-word brand ("Contractor Dynamics").
    if (parts.length === 2 && GENERIC.has(last)) return parts[0];
    return full;
  })();
  const tagline = (brand && brand.tagline) || "Heating · Cooling · Controls";
  const url = (brand && brand.url) || "www.gettrueseat.com";
  const vals = Array.isArray(values) ? values.filter(Boolean) : [];
  const vCount = vals.length;

  // Counted interior pages = 24 in the reference (which has 3 values). Each
  // value renders one page; the empty state renders one placeholder page. So the
  // counted total shifts by (renderedValuePages - 3) from the 24 baseline. This
  // is the count-from-data rule: the /NN denominator is NEVER hard-coded.
  const renderedValuePages = vCount || 1; // empty state = 1 placeholder page
  const PT = 24 + (renderedValuePages - 3);

  // footer counter helper (physical→counter offset: cover uncounted, so
  // counter = physical - 1 for interiors up to the value block)
  const pages = [];
  const push = (html) => pages.push(html);

  // ── phys 01: COVER (no counter) ──
  push(P.coverPage({
    brand: b,
    eyebrow: "Hiring & Internal Talent Development",
    title: DOC,
    subtitle: "A structured, values-driven system for finding, developing, and placing the right people in the right seats — every time.",
    tagline, url,
  }));

  // ── phys 02: TOC (footer 01 / 24) ──
  push(P.lightContentPage({
    brand: b, docTitle: DOC, eyebrow: "Inside This Playbook", title: "Table of Contents",
    inner: P.tocList({ brand: b, entries: [
      { n: 1, title: "Hiring Philosophy & Core Values", desc: "The beliefs that drive every hiring decision we make.", page: 2 },
      { n: 2, title: "Define the Seat — Role Scorecard", desc: "We do not hire people. We fill clearly defined seats.", page: 5 },
      { n: 3, title: "Internal Talent First", desc: "Before we look outside, we look inside.", page: 7 },
      { n: 4, title: "Developing Future Leaders", desc: "Prepare team members to step up before the need arises.", page: 9 },
      { n: 5, title: "The 8-Stage Recruiting Funnel", desc: "No shortcuts. Consistency produces better hiring decisions.", page: 11 },
      { n: 6, title: "Interview System", desc: "Questions built from " + shortName + "'s own core values — scored the same way, every time.", page: 14 },
      { n: 7, title: "The Hiring Decision Matrix", desc: "Objective scoring. No gut-feel shortcuts.", page: 19 },
      { n: 8, title: "Offer & 90-Day Success Plan", desc: "Success must be defined before the first day of work.", page: 21 },
      { n: 9, title: "Hiring Principles & Red Flags", desc: "Our non-negotiables and the warning signs we never ignore.", page: 23 },
    ] }),
    pageNo: 1, pageTotal: PT,
  }));

  // ── phys 03: section-opener 01/09 (footer 02 / 24) ──
  push(P.sectionOpenerPage({
    brand: b, docTitle: DOC, sectionTitle: "Hiring Philosophy & Core Values",
    sectionNum: 1, sectionTotal: 9,
    headline: "The Standard Is the Product.",
    subhead: "The beliefs that drive every hiring decision we make.",
    pageNo: 2, pageTotal: PT,
  }));

  // ── phys 04: We Hold a Standard (footer 03 / 24) ──
  push(P.lightContentPage({
    brand: b, docTitle: DOC, eyebrow: "Our Foundation", title: "We Hold a Standard.",
    intro: "At " + b.clientName + " we hold a standard most companies only talk about. Commitments mean something here, and execution is a discipline, not a hope.",
    inner:
      P.navyCallout({ brand: b, eyebrow: "Our Hiring Philosophy", headline: "We hire slow and hold the line.",
        body: "We never compromise on culture or character to fill a seat fast. When internal talent is not yet ready, we bring in outside expertise to raise the bar — not lower it." })
      + `<div style="font-size:11px; font-weight:700; letter-spacing:0.1em; text-transform:uppercase; color:var(--text-faint); margin:0 0 16px;">Three Core Principles</div>`
      + P.leadInBullets({ brand: b, items: [
          { lead: "Develop First.", body: "Internal growth and promotion is always the priority. We invest in our people before we look outside." },
          { lead: "Hire for Character.", body: "Skills can be trained. Core values cannot. We hire people who strengthen our culture." },
          { lead: "Only Place People to Win.", body: "Every hire is set up for success. We define the seat, the expectations, and the support before day one." },
        ] }),
    pageNo: 3, pageTotal: PT,
  }));

  // ── phys 05: Process Metrics (footer 04 / 24) ──
  push(P.lightContentPage({
    brand: b, docTitle: DOC, eyebrow: "Process Metrics", title: "How We Measure the Hiring Discipline",
    intro: "These are process metrics — they measure how well we run the system, not any one role. A healthy hiring discipline moves all of these in the right direction over time.",
    inner: P.metricTable({ brand: b,
      columns: ["Metric", "What It Measures", "Target"],
      colWidths: ["215px", "auto", "150px"],
      rows: [
        ["Scorecard Coverage", "% of open roles with a completed scorecard before posting", "100%"],
        ["Process Adherence", "% of hires that completed every funnel stage with no skips", "100%"],
        ["90-Day Success Rate", "% of new hires meeting scorecard outcomes at 90 days", "> 85%"],
        ["12-Month Retention", "% of hires still active after one year", "> 80%"],
        ["Internal Promotion Rate", "% of roles filled from the internal bench", "Track & Improve"],
        ["Time to Fill", "Days from open role to accepted offer (tracked, not rushed)", "Benchmark"],
        ["Quality of Hire", "Hiring-manager satisfaction + performance at 6 months", "> 4 / 5"],
      ] }),
    pageNo: 4, pageTotal: PT,
  }));

  // ── phys 06: section-opener 02/09 (footer 05 / 24) ──
  push(P.sectionOpenerPage({
    brand: b, docTitle: DOC, sectionTitle: "Define the Seat — Role Scorecard",
    sectionNum: 2, sectionTotal: 9,
    headline: "Before Any Hiring Begins, Define the Seat.",
    subhead: "We do not hire people. We fill clearly defined seats.",
    pageNo: 5, pageTotal: PT,
  }));

  // ── phys 07: No Scorecard No Search (footer 06 / PT) — proven proof page ──
  push(P.scorecardNoSearchPage(b, 6, PT));

  // ── phys 08: section-opener 03/09 (footer 07 / 24) ──
  push(P.sectionOpenerPage({
    brand: b, docTitle: DOC, sectionTitle: "Internal Talent First",
    sectionNum: 3, sectionTotal: 9,
    headline: "Every Open Role Starts Here.",
    subhead: "Before we look outside, we look inside.",
    pageNo: 7, pageTotal: PT,
  }));

  // ── phys 09: Talent Bench Review (footer 08 / 24) ──
  push(P.lightContentPage({
    brand: b, docTitle: DOC, eyebrow: "The Talent Bench Review", title: "Ready Now, or Ready Next?",
    intro: "When a role opens, leadership conducts a Talent Bench Review before any external recruiting begins. Internal promotion is always the priority when quality allows.",
    inner: P.metricTable({ brand: b,
      columns: ["Bench Rating", "Definition", "Action Required"],
      colWidths: ["150px", "auto", "230px"],
      rows: [
        ["Ready Now", "Can step into the role within 30 days with minimal ramp.", "Promote when the role opens. Keep engaged with stretch work."],
        ["Ready Next", "Could step in within 6–18 months with development support.", "Activate development plan. Review progress quarterly."],
        ["No Bench", "No internal candidate exists. Role is a critical gap.", "Begin external pipeline development immediately."],
      ] })
      + `<div style="margin-top:26px; font-size:11px; font-weight:700; letter-spacing:0.1em; text-transform:uppercase; color:var(--text-faint); margin-bottom:14px;">What Bench Candidates Must Demonstrate</div>`
      + P.leadInBullets({ brand: b, items: [
          { lead: "Performance.", body: "Consistent results in their current role, backed by numbers and track record." },
          { lead: "Core value alignment.", body: "They live the values and protect the culture; others look to them as a model." },
          { lead: "Leadership potential.", body: "Ownership, initiative, and a growth mindset; they raise the team around them." },
        ] }),
    pageNo: 8, pageTotal: PT,
  }));

  // ── phys 10: section-opener 04/09 (footer 09 / 24) ──
  push(P.sectionOpenerPage({
    brand: b, docTitle: DOC, sectionTitle: "Developing Future Leaders",
    sectionNum: 4, sectionTotal: 9,
    headline: "Bench Candidates Receive Structured Growth.",
    subhead: "Prepare team members to step up before the need arises.",
    pageNo: 9, pageTotal: PT,
  }));

  // ── phys 11: Development Track 1-4 (footer 10 / 24) ──
  push(P.lightContentPage({
    brand: b, docTitle: DOC, eyebrow: "The Development Track", title: "Recognition, Not a Guarantee.",
    intro: "Being identified as a bench candidate is a recognition of potential — not a promise of promotion. Candidates must actively participate in their development track.",
    inner: P.numberedStageList({ brand: b, items: [
      { title: "Stretch Assignments", body: "Real projects outside their current role — low-stakes chances to show leadership before a formal promotion." },
      { title: "Project Leadership", body: "Lead cross-functional initiatives with clear deliverables and deadlines. Own the outcome, report results to leadership." },
      { title: "Mentorship Pairing", body: "Paired with a senior leader for monthly 1:1 coaching. Honest feedback, modeled behavior, accelerated growth." },
      { title: "Temporary Role Coverage", body: "Cover for a manager during PTO or absence — the closest simulation of the next-level role and the clearest read on readiness." },
    ] }),
    pageNo: 10, pageTotal: PT,
  }));

  // ── phys 12: section-opener 05/09 (footer 11 / 24) ──
  push(P.sectionOpenerPage({
    brand: b, docTitle: DOC, sectionTitle: "The 8-Stage Recruiting Funnel",
    sectionNum: 5, sectionTotal: 9,
    headline: "All Candidates Move Through the Same Gate.",
    subhead: "No shortcuts. Consistency produces better hiring decisions.",
    pageNo: 11, pageTotal: PT,
  }));

  // ── phys 13: Funnel stages 1-4 (footer 12 / 24) ──
  push(P.lightContentPage({
    brand: b, docTitle: DOC, eyebrow: "The Hiring Process", title: "Skipping Stages Is Not Permitted.",
    intro: "Whether a candidate comes from within our organization or from outside, every person moves through the same structured funnel. Consistency eliminates bias and protects our culture.",
    inner: P.numberedStageList({ brand: b, items: [
      { title: "Application & Resume Review", body: "Evaluate written evidence of performance, role progression, and stability. Red flags: frequent job changes, vague roles, no measurable outcomes." },
      { title: "Initial Phone Screen (15–20 min)", body: "Confirm role alignment, compensation, timeline, and basic qualifications. Filter for minimum viability before a full interview." },
      { title: "Structured Interview", body: "Focus exclusively on real performance evidence. What were they measured on, what did they accomplish, what did they fail at." },
      { title: "Core Values Interview", body: "Each " + shortName + " core value evaluated with behavioral questions, scored 5 / 3 / 1 — no 2s or 4s. A high skill score cannot offset a low values score." },
    ] })
      + `<div style="margin-top:22px; font-size:11px; font-weight:700; letter-spacing:0.08em; text-transform:uppercase; color:var(--text-faint);">Stages 5–8 continue &rarr;</div>`,
    pageNo: 12, pageTotal: PT,
  }));

  // ── phys 14: Funnel stages 5-8 (footer 13 / 24) ──
  push(P.lightContentPage({
    brand: b, docTitle: DOC, eyebrow: "The Hiring Process, Continued", title: "Human Judgment First. Then the Data.",
    intro: "The back half of the funnel validates what the interviews surfaced — behavioral data, references, and the WOW Standard — before any offer is made.",
    inner: P.numberedStageList({ brand: b, startAt: 5, items: [
      { title: "Predictive Index Behavioral Assessment", body: "Administered after the values interview so human judgment comes first. PI validates observations against the job target. PI informs the decision — it does not make it." },
      { title: "Reference or Internal Performance Review", body: "External candidates: minimum two professional references with structured questions. Internal candidates: review formal performance history, manager feedback, and peer input. Verify what the candidate told you during the interview." },
      { title: "WOW Standard Assessment", body: "Before advancing to the Decision Matrix, the hiring team runs the WOW Standard — a gut-check discipline, not a metric: Will this person raise team energy? Will they strengthen our culture? Will they represent the company well? If leadership is not genuinely excited, the answer is no." },
      { title: "Final Decision Matrix & Offer", body: "Score all candidates objectively using the Decision Matrix. The highest qualified scorer wins — internal or external. During the offer, review the role scorecard, key metrics, and 90-day expectations. Success is defined from day one." },
    ] }),
    pageNo: 13, pageTotal: PT,
  }));

  // ── phys 15: section-opener 06/09 (footer 14 / 24) ──
  push(P.sectionOpenerPage({
    brand: b, docTitle: DOC, sectionTitle: "Interview System",
    sectionNum: 6, sectionTotal: 9,
    headline: "Evaluate Results, Not Opinions.",
    subhead: "Questions built from " + shortName + "'s own core values — scored the same way, every time.",
    pageNo: 14, pageTotal: PT,
  }));

  // ── phys 16: Every Value Gets Evaluated (footer 15 / 24) ──
  push(P.lightContentPage({
    brand: b, docTitle: DOC, eyebrow: "Core Values Interview", title: "Every Value Gets Evaluated. Every Time.",
    intro: "Core values are not decoration — they are the operating system of our culture. Each value is evaluated with a behavioral question and scored 5 / 3 / 1 — no 2s or 4s. A rating forces a clear position, and a high skill score cannot offset a low values score.",
    inner: P.scoredRubricTable({ brand: b, values: vals })
      + `<div style="margin-top:24px; font-size:11px; font-weight:700; letter-spacing:0.1em; text-transform:uppercase; color:var(--text-faint); margin-bottom:8px;">How to Use This Section</div>`
      + `<p style="margin:0 0 26px; font-size:13.5px; line-height:1.6; color:var(--text-body); max-width:700px;">Ask the primary question, then let the candidate talk. Use the follow-up probes only after they've given their first answer — they surface the difference between a rehearsed story and a real one. Score against the rubric, not your gut. The pages that follow give the full script for each value.</p>`
      + P.navyCallout({ brand: b, eyebrow: "The Scoring Rule", headline: "A 3 is not a pass.",
          body: "A candidate must score 5 on at least " + (vCount >= 2 ? "two" : "one") + " of the " + numberWord(vCount || 3) + " values to advance, with no 1s anywhere — the same gate we hold for promotions. Values are the one place we do not average away a weakness: a single 1 is a stop, not a rounding error." }),
    pageNo: 15, pageTotal: PT,
  }));

  // ── phys 17..N: core-value pages (footer 16 / 24 onward). Empty-state gate. ──
  let counter = 16; // footer counter for the first value page
  if (!vCount) {
    push(P.coreValuePage({
      brand: b, docTitle: DOC,
      value: { name: "Define your core values to complete this playbook" },
      idx: 0, total: 0, pageNo: counter, pageTotal: PT,
    }));
    counter += 1;
  } else {
    vals.forEach((value, i) => {
      push(P.coreValuePage({
        brand: b, docTitle: DOC, value, idx: i + 1, total: vCount,
        pageNo: counter, pageTotal: PT,
      }));
      counter += 1;
    });
  }
  // after the value block, `counter` is the footer number for the next page.

  // ── section-opener 07/09 Decision Matrix ──
  push(P.sectionOpenerPage({
    brand: b, docTitle: DOC, sectionTitle: "The Hiring Decision Matrix",
    sectionNum: 7, sectionTotal: 9,
    headline: "The Best Qualified Candidate Wins.",
    subhead: "Objective scoring. No gut-feel shortcuts.",
    pageNo: counter, pageTotal: PT,
  }));
  counter += 1;

  // ── Final Decision Framework ──
  push(P.lightContentPage({
    brand: b, docTitle: DOC, eyebrow: "The Final Decision Framework", title: "Every Category Stands on Its Own.",
    intro: "All candidates — internal and external — are scored on the same matrix. Scores are assigned independently by each interviewer, then compared in the debrief. There is no single passing number: a weak category is a stop-and-discuss, and a strong Role Fit cannot paper over a Core Values miss.",
    inner: P.metricTable({ brand: b,
      columns: ["Category", "What We're Measuring", "Max", "Score"],
      colWidths: ["165px", "auto", "62px", "88px"],
      rows: [
        ["Role Fit", "Skills, experience, and competencies match the scorecard.", "10", "__ / 10"],
        ["PI Alignment", "Behavioral profile aligns with the defined job target.", "10", "__ / 10"],
        ["Core Values", "Demonstrated alignment with all " + shortName + " core values.", "10", "__ / 10"],
        ["Skills & Experience", "Track record of measurable results in relevant roles.", "10", "__ / 10"],
        ["Culture Impact", "Will this person raise team energy and strengthen culture?", "10", "__ / 10"],
        ["TOTAL", "Context for the debrief — not a pass / fail line", "50", "__ / 50"],
      ], darkRows: [5] })
      + P.navyCallout({ brand: b, eyebrow: "The WOW Standard — Final Gate",
          headline: "Before making any offer, answer three questions:",
          bullets: [
            "Will this person raise the energy and performance of the team?",
            "Will they actively strengthen our culture — not just fit in?",
            "Will they represent " + shortName + " with pride and professionalism?",
          ],
          closer: "If leadership is not genuinely excited about this hire — the answer is no." }),
    pageNo: counter, pageTotal: PT,
  }));
  counter += 1;

  // ── section-opener 08/09 Offer & 90-Day ──
  push(P.sectionOpenerPage({
    brand: b, docTitle: DOC, sectionTitle: "Offer & 90-Day Success Plan",
    sectionNum: 8, sectionTotal: 9,
    headline: "Clarity From Day One.",
    subhead: "Success must be defined before the first day of work.",
    pageNo: counter, pageTotal: PT,
  }));
  counter += 1;

  // ── 90-Day Success Framework ──
  push(P.lightContentPage({
    brand: b, docTitle: DOC, eyebrow: "The 90-Day Success Framework", title: "The Offer Is the Starting Line.",
    intro: "During the offer conversation we align on expectations, not just compensation. The new hire must understand exactly what success looks like before they accept.",
    inner: P.threeBucketBlock({ brand: b, items: [
      { eyebrow: "Days 1–30", title: "Learn", bullets: ["Orientation & observation", "Master the basics", "Understand the culture", "Build trust with the team"] },
      { eyebrow: "Days 31–60", title: "Apply", bullets: ["Begin independent work", "Apply learning to real jobs", "Identify early wins", "Flag early obstacles"] },
      { eyebrow: "Days 61–90", title: "Contribute", bullets: ["Operate with confidence", "Deliver measurable results", "Ready for 90-day review", "Own the scorecard"] },
    ] })
      + `<div style="margin-top:28px; font-size:11px; font-weight:700; letter-spacing:0.1em; text-transform:uppercase; color:var(--text-faint); margin-bottom:14px;">The 90-Day Review</div>`
      + P.metricTable({ brand: b,
          columns: ["Review Area", "What to Assess", "Outcome"],
          colWidths: ["185px", "auto", "175px"],
          rows: [
            ["Performance vs. Scorecard", "Are the 90-day metrics being met? Where are the gaps?", "On Track / Needs Support / At Risk"],
            ["Core Value Alignment", "Is this person living the values? What does the team say?", "Strong / Developing / Concern"],
            ["Right Person, Right Seat?", "Final confirmation: is this the right person for this role?", "Confirmed / Reassess"],
          ] }),
    pageNo: counter, pageTotal: PT,
  }));
  counter += 1;

  // ── section-opener 09/09 Principles & Red Flags ──
  push(P.sectionOpenerPage({
    brand: b, docTitle: DOC, sectionTitle: "Hiring Principles & Red Flags",
    sectionNum: 9, sectionTotal: 9,
    headline: "How We Hire. Every Time. No Exceptions.",
    subhead: "Our non-negotiables and the warning signs we never ignore.",
    pageNo: counter, pageTotal: PT,
  }));
  counter += 1;

  // ── Commitments, Not Guidelines + Red Flags ──
  push(P.lightContentPage({
    brand: b, docTitle: DOC, eyebrow: "The Hiring Principles", title: "Commitments, Not Guidelines.",
    intro: "These principles apply to every role, every candidate, and every hiring manager at " + b.clientName + ".",
    inner: P.leadInBullets({ brand: b, items: [
      { lead: "People decisions first.", body: "We place people where they can succeed, not just where we have a need." },
      { lead: "Develop internal talent first.", body: "External hires supplement internal development; they never replace it." },
      { lead: "Promote from within whenever qualified.", body: "Advancing from within tells the whole team growth is real here." },
      { lead: "Hire slow, develop fast.", body: "We do not rush to fill a seat; once hired, we invest aggressively." },
      { lead: "Never skip the process.", body: "Timeline pressure is not a reason to cut corners. A bad hire costs more than a slow search." },
    ] })
      + `<div style="margin-top:26px; font-size:11px; font-weight:700; letter-spacing:0.1em; text-transform:uppercase; color:#B0201A; margin-bottom:14px;">Red Flags — Never Ignore These</div>`
      + P.redFlagBlock({ items: [
          { title: "Frequent unexplained job changes", note: "More than 3 in 5 years without a growth trajectory." },
          { title: "Can't articulate what they were measured on", note: "No numbers, no accountability, no clarity on past results." },
          { title: "Consistent blame of employers or teammates", note: "Every past problem is someone else's fault." },
          { title: "WOW Standard fails", note: "If the team is not energized by this candidate — stop." },
        ] }),
    pageNo: counter, pageTotal: PT,
  }));

  // ── back cover: CTA + brand lockup (no counter) ──
  push(P.closingCtaPage({
    brand: b, docTitle: DOC,
    eyebrow: "The Standard We Hold",
    headline: "Ready to Build a World-Class Team?",
    body: "This playbook is the standard for how " + b.clientName + " builds its team. Every hire should strengthen our people, our culture, and our future leadership.",
    ctaLabel: "Open Your Hiring Cockpit", ctaUrl: url,
    pageNo: counter, pageTotal: PT,
  }));

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
