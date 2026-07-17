// ════════════════════════════════════════════════════════════════════════
//  TRUESEAT — Culture Codified assembler (FULL 24-page manager's playbook)
//  Sister deck to assemble-playbook.js. Shares every primitive in
//  playbook-pages.js + the same brand/values contract. The renderer NEVER calls
//  a model — it renders stored values[] + config text.
//
//  Reference: Summit_Mechanical_Culture_Codified.pdf (24 physical pages;
//  cover + back cover UNCOUNTED, interiors footer /24).
//
//  PAGE MAP (physical page → footer counter):
//    phys 01  cover                                       (no counter)
//    phys 02  section-opener 01/09 Our Foundation         footer 01 / 24
//    phys 03  light: Purpose / Mission / Core Values       footer 02 / 24
//    phys 04  section-opener  Introduction                 footer 03 / 24
//    phys 05  light: From Words to Behavior                footer 04 / 24
//    phys 06  section-opener  Core Values Defined           footer 05 / 24
//    phys 07  light: How to Read the Ladder                footer 06 / 24
//    phys 08  behavior-ladder value 1/N                     footer 07 / 24
//    phys 09  behavior-ladder value 2/N                     footer 08 / 24
//    phys 10  behavior-ladder value 3/N                     footer 09 / 24
//    phys 11  light: The 4-Week Rotation                    footer 10 / 24
//    phys 12  light: Core Values Scorecard                  footer 11 / 24
//    phys 13  light: Coaching & Accountability (escalation) footer 12 / 24
//    phys 14  section-opener  Hiring for Core Values        footer 13 / 24
//    phys 15  light: Character Is Not Trainable             footer 14 / 24
//    phys 16  hiring-questions value 1/N                    footer 15 / 24
//    phys 17  hiring-questions value 2/N                    footer 16 / 24
//    phys 18  hiring-questions value 3/N                    footer 17 / 24
//    phys 19  light: Promotions & People Decisions          footer 18 / 24
//    phys 20  light: Field Execution                        footer 19 / 24
//    phys 21  light: Manager Expectations                   footer 20 / 24
//    phys 22  section-opener  The Standard Is Set           footer 21 / 24
//    phys 23  light: The Behavior You Celebrate             footer 22 / 24
//    phys 24  back cover (CTA + brand lockup)               (no counter)
//
//  TWO value-driven blocks (behavior ladders pp.8-10 + hiring questions
//  pp.16-18), so the counted total scales by 2·(renderedValuePages - 3) from
//  the 24 baseline. count-from-data: the /NN denominator is NEVER hard-coded.
// ════════════════════════════════════════════════════════════════════════
const T = require("./deliverable-tokens.js");
const E = require("./debrief-engine.js"); // DS_TOKENS only (light palette)
const P = require("./playbook-pages.js");

const DOC = "Culture Codified";

function numberWord(n) {
  const W = ["zero", "one", "two", "three", "four", "five", "six", "seven",
             "eight", "nine", "ten", "eleven", "twelve"];
  return (n >= 0 && n <= 12) ? W[n] : String(n);
}

// ── defensive value adapter ─────────────────────────────────────────────
//  clients.js stores values in the interview-scoring shape: { name, definition,
//  behaviors[], question, anchor1, anchor4 }. This deck's richer fields —
//  phrase, standards{aPlayer,meets,unacceptable}, hiringQuestions[] — land
//  later via the onboarding expander (schema step 2 of the Culture feature
//  arc). Until a value carries them, this adapter DERIVES them from the stored
//  shape so the deck renders complete from live tenant data today, and
//  upgrades automatically the moment richer fields exist. Rules:
//    • explicit fields ALWAYS win — derivation only fills gaps
//    • pure function, no mutation of the caller's object
//    • a value with neither shape degrades exactly as before (primitives
//      already render "" / skip empty rows — nothing new breaks)
function adaptValue(v) {
  if (!v) return v;
  const out = { ...v };

  // phrase — the punchy defining line. Derived as the FIRST SENTENCE of the
  // stored definition; the remainder becomes the description so the ladder-
  // page intro ("phrase" + definition) never repeats the first sentence.
  // This reproduces the reference deck's split exactly ("The team's win
  // outranks personal credit." + the rest as body).
  if (!out.phrase && out.definition) {
    const full = String(out.definition).trim();
    const m = /^(.+?[.!?])\s+(\S[\s\S]*)$/.exec(full);
    if (m) { out.phrase = m[1]; out.definition = m[2]; }
    else { out.phrase = full; out.definition = ""; }
  }

  // standards ladder — anchor4 (the top scoring anchor) IS the A-Player
  // behavior, behaviors[] are the meets-standard observables, anchor1 (the
  // bottom anchor) IS the floor. Sparser than expander-authored ladders
  // (one rung line vs four) but truthful to captured data.
  if (!out.standards) {
    const aPlayer = out.anchor4 ? [out.anchor4] : [];
    const meets = Array.isArray(out.behaviors) ? out.behaviors.filter(Boolean) : [];
    const unacceptable = out.anchor1 ? [out.anchor1] : [];
    if (aPlayer.length || meets.length || unacceptable.length) {
      out.standards = { aPlayer, meets, unacceptable };
    }
  }

  // hiring questions — the stored interview question; listen-for prefers
  // anchor4 (what a great answer sounds like — this is literally how the
  // reference deck's Listen For lines read), falling back to behaviors[].
  if (!Array.isArray(out.hiringQuestions) || !out.hiringQuestions.length) {
    const listenFor = out.anchor4
      || (Array.isArray(out.behaviors) ? out.behaviors.filter(Boolean).join("; ") : "");
    if (out.question) out.hiringQuestions = [{ question: out.question, listenFor }];
  }

  return out;
}

function buildCultureHTML({ ctx, brand, values, culture }) {
  // culture — client-level identity fields { acronym, purpose, mission } from
  // clients.js (the `culture` allowlist field). Optional: every read below has
  // a white-label-safe generic fallback, so a tenant that hasn't set them still
  // renders a complete page — in Trueseat voice, never another tenant's prose.
  const cult = (culture && typeof culture === "object") ? culture : {};
  const b = {
    clientName: (brand && brand.clientName) || (ctx && ctx.company) || "Summit Mechanical",
    navy: (brand && brand.navy) || "#16242E",
    blue: (brand && brand.blue) || "#1F6FB2",
  };
  // shortName — conversational client name for body prose ("Summit is built on
  // three core values"), matching the reference. Same derivation as the playbook
  // assembler: trim a trailing generic business word only on a two-token name,
  // so Summit Mechanical → Summit while Contractor Dynamics stays whole.
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
    if (parts.length === 2 && GENERIC.has(last)) return parts[0];
    return full;
  })();

  const tagline = (brand && brand.tagline) || "Heating · Cooling · Controls";
  const url = (brand && brand.url) || "www.gettrueseat.com";
  const vals = (Array.isArray(values) ? values.filter(Boolean) : []).map(adaptValue);
  const vCount = vals.length;
  const renderedValuePages = vCount || 1;         // empty state = 1 placeholder
  // TWO value-driven blocks, so the delta from the 24-page baseline is doubled.
  const PT = 24 + 2 * (renderedValuePages - 3);

  const pages = [];
  const push = (html) => pages.push(html);

  // Brand-standard page map, extended: 17 counted interior pages for a 3-value
  // tenant (the T&C-depth rotation with labeled sub-steps + manager prompts
  // needs TWO pages — Weeks 1-2 and Weeks 3-4 — exactly as the T&C reference
  // spreads it). Cover + back cover uncounted. Counted total scales by ONE per
  // value beyond the ladders' baseline. TOC page numbers below are computed
  // from R = renderedValuePages so they always match actual render positions
  // (fixes a prior off-by-one where TOC arithmetic drifted from the counter).
  const R = renderedValuePages;
  const PT16 = 14 + R; // 3 values → 17 counted

  // ── phys 01: COVER (no counter) ──
  push(P.coverPage({
    brand: b,
    eyebrow: "A Manager's Playbook for Living Our Core Values",
    title: DOC,
    subtitle: "How we lead, coach, hire, and promote by the values that make "
      + b.clientName + " who we are.",
    tagline, url,
  }));

  // ── phys 02: TABLE OF CONTENTS (footer 01) ──
  push(P.lightContentPage({
    brand: b, docTitle: DOC, eyebrow: "Inside This Playbook", title: "Table of Contents",
    inner: P.tocList({ brand: b, entries: [
      { n: "\u25B2", title: "Our Foundation — People Are the Product", desc: "The purpose and mission every core value serves.", page: 2 },
      { n: 1, title: "What This Playbook Is", desc: "How we protect the culture as we grow.", page: 3 },
      { n: 2, title: "Core Values Defined", desc: "Each value, with clear A-Player, Meets, and Unacceptable behavior.", page: 4 },
      { n: 3, title: "Weekly System", desc: "The 4-week rotation for huddles and team meetings.", page: 5 + R },
      { n: 4, title: "Scorecard System", desc: "Rate culture, not just output.", page: 7 + R },
      { n: 5, title: "Coaching & Accountability", desc: "Coach the behavior, not the person.", page: 8 + R },
      { n: 6, title: "Hiring for Core Values", desc: "Never hire someone who fails the values screen.", page: 10 + R },
      { n: 7, title: "People Decisions", desc: "Values are hard gates.", page: 11 + R },
      { n: 8, title: "Field Execution", desc: "How the values become daily life.", page: 12 + R },
      { n: 9, title: "Manager Expectations", desc: "Not HR's job. Not the owner's job. Yours.", page: 13 + R },
      { n: "\u2022", title: "The Standard Is Set", desc: numberWord(vCount || 3).replace(/^\w/, c => c.toUpperCase()) + " values. One standard. Every seat, every day.", page: 14 + R },
    ] }),
    pageNo: 1, pageTotal: PT16,
  }));

  // ── phys 03: OUR FOUNDATION — People Are the Product (footer 02 / 16) ──
  //  Light page (NOT a dark opener — brand standard). Purpose + Mission from the
  //  tenant `culture` field, white-label-safe generic fallbacks. Purpose block
  //  only renders when set.
  push(P.lightContentPage({
    brand: b, docTitle: DOC, eyebrow: "Our Foundation", title: "People Are the Product.",
    intro: "The purpose and mission every core value serves.",
    inner:
      (cult.purpose
        ? `<div style="font-size:11px; font-weight:700; letter-spacing:0.1em; text-transform:uppercase; color:var(--text-faint); margin:22px 0 8px;">Our Purpose</div>`
          + `<p style="margin:0 0 22px; font-size:14.5px; line-height:1.6; color:var(--text-body); max-width:690px;">${P.esc(cult.purpose)}</p>`
        : "")
      + (cult.mission
        ? `<div style="font-size:11px; font-weight:700; letter-spacing:0.1em; text-transform:uppercase; color:var(--text-faint); margin:0 0 8px;">Our Mission</div>`
          + `<p style="margin:0 0 24px; font-size:14.5px; line-height:1.6; color:var(--text-body); max-width:690px;">${P.esc(cult.mission)}</p>`
        : "")
      + P.navyCallout({ brand: b, eyebrow: "Why This Playbook Exists",
          headline: "Our core values are not goals to achieve.",
          body: "They are the principles that give our goals meaning. This is who we are. This playbook turns them from words on a wall into the daily behavior of every person on the team." }),
    pageNo: 2, pageTotal: PT16,
  }));

  // ── phys 04: 01 · WHAT THIS PLAYBOOK IS — Culture Is How We Operate (footer 03) ──
  push(P.lightContentPage({
    brand: b, docTitle: DOC, eyebrow: "01 · What This Playbook Is", title: "Culture Is How We Operate.",
    intro: b.clientName + " is built on core values that shape our actions and guide our direction. As we grow, we protect our culture by keeping our values consistent — on every job, in every customer interaction, in every conversation between teammates.",
    inner:
      `<div style="font-size:11px; font-weight:700; letter-spacing:0.1em; text-transform:uppercase; color:var(--text-faint); margin:0 0 14px;">Purpose</div>`
      + P.leadInBullets({ brand: b, items: [
          { lead: "", body: "Translate core values into specific, observable behaviors." },
          { lead: "", body: "Give managers practical tools to coach, recognize, and hold accountability." },
          { lead: "", body: "Create consistency across every crew, office, and customer interaction." },
          { lead: "", body: "Ensure our culture stays strong as we grow." },
        ] })
      + `<div style="margin:20px 0 26px; border-left:4px solid ${b.blue}; padding:4px 0 4px 18px; font-size:15px; font-weight:700; line-height:1.45; color:var(--text-strong); max-width:700px;">This is not optional. Culture is not a feel-good extra — it is how we operate. Every manager is responsible for bringing these values to life.</div>`
      + `<div style="font-size:11px; font-weight:700; letter-spacing:0.1em; text-transform:uppercase; color:var(--text-faint); margin:0 0 10px;">The Manager's Role</div>`
      + `<p style="margin:0 0 16px; font-size:13.5px; line-height:1.6; color:var(--text-body); max-width:700px;">Culture is built in the field, in one-on-ones, and in the way a manager responds when a mistake happens — or when someone goes above and beyond. As a manager at ${P.esc(shortName)}, you are the culture. Own it.</p>`
      + P.threeBucketBlock({ brand: b, items:
          (Array.isArray(cult.managerRoles) && cult.managerRoles.length
            ? cult.managerRoles
            : [
                { title: "Model", body: "Live the values yourself, every day." },
                { title: "Reinforce", body: "Recognize when values are lived. Name it and celebrate it." },
                { title: "Coach", body: "Address behavior misses quickly, directly, and with care." },
              ]
          ).map((r) => ({ eyebrow: "", title: r.title, bullets: [r.body] })) }),
    pageNo: 3, pageTotal: PT16,
  }));

  // ── phys 05: section-opener 02/09 Core Values Defined (dark) ──
  push(P.sectionOpenerPage({
    brand: b, docTitle: DOC, sectionTitle: "Core Values Defined",
    sectionNum: 2, sectionTotal: 9,
    headline: "The Behavior Standards.",
    subhead: "Each value has a defining phrase and clear behavioral standards — A-Player, Meets Standard, and Unacceptable. Use this section as your reference for coaching and performance conversations.",
    pageNo: 4, pageTotal: PT16,
  }));

  // ── behavior-ladder pages, one per value (three-column brand-standard format) ──
  let counter = 5;
  if (!vCount) {
    push(P.lightContentPage({
      brand: b, docTitle: DOC, eyebrow: "Core Values Defined",
      title: "Define your core values to complete this playbook.",
      intro: "Once your core values are captured in onboarding, each one renders here with its A-Player, Meets Standard, and Unacceptable behavior ladder.",
      pageNo: counter, pageTotal: PT16,
    }));
    counter += 1;
  } else {
    vals.forEach((value, i) => {
      const v = value || {};
      push(P.lightContentPage({
        brand: b, docTitle: DOC,
        eyebrow: "02 · Behavior Standards · Value " + (i + 1) + " of " + vCount,
        title: v.name || "Core Value",
        intro: v.phrase
          ? "\u201c" + v.phrase + "\u201d " + (v.definition || "")
          : (v.definition || ""),
        inner: P.behaviorLadderColumns({ brand: b, standards: v.standards }),
        pageNo: counter, pageTotal: PT16,
      }));
      counter += 1;
    });
  }

  // ── 03 · WEEKLY SYSTEM — two pages (Weeks 1-2, Weeks 3-4), T&C depth ──
  //  Each week is a labeled four-step WORKFLOW (the sub-steps are the tap-through
  //  checklist when this becomes software) + a scripted Manager Prompt. The
  //  sub-step labels are fixed Trueseat methodology; examples interpolate the
  //  tenant's own value names. Two pages because four weeks at this depth
  //  cannot fit one — matches the T&C reference layout.
  const wk = (i) => (cult.rotationPrompts || [])[i];
  const v1name = (vals[0] && vals[0].name) || "our first value";
  push(P.lightContentPage({
    brand: b, docTitle: DOC, eyebrow: "03 · Weekly System · 4-Week Rotation", title: "Consistency Is the Goal.",
    intro: "Run this system in your weekly team meetings or job huddles. Each format takes 5–10 minutes maximum. Rotate through all four each month, every month, without exception.",
    inner: P.numberedStageList({ brand: b, items: [
      { title: "Caught in the Act", tag: "Week 1 · Recognition", prompt: wk(0), substeps: [
        { label: "Identify", text: "Name someone who clearly lived a value this week." },
        { label: "Describe", text: "Be specific: what did they do, when, where, and why it mattered." },
        { label: "Connect", text: "Tie it to the value by name: \u201cThat is exactly what " + v1name + " looks like.\u201d" },
        { label: "Reinforce", text: "Say out loud: \u201cThis is the standard. This is who we are.\u201d" },
      ] },
      { title: "Anti-Value", tag: "Week 2 · Accountability", prompt: wk(1), substeps: [
        { label: "Identify", text: "Describe a behavior where a value was NOT followed (no names if it's ongoing)." },
        { label: "Name It", text: "State which value was missed and what it looked like." },
        { label: "Reset", text: "Describe exactly what should have happened instead." },
        { label: "Close", text: "Restate the expectation: \u201cGoing forward, here is what we need.\u201d" },
      ] },
    ] }),
    pageNo: counter, pageTotal: PT16,
  }));
  counter += 1;
  push(P.lightContentPage({
    brand: b, docTitle: DOC, eyebrow: "03 · Weekly System · 4-Week Rotation", title: "Weeks Three and Four.",
    inner: P.numberedStageList({ brand: b, startAt: 3, items: [
      { title: "Under Pressure", tag: "Week 3 · Scenario Training", prompt: wk(2), substeps: [
        { label: "Present", text: "Give a real scenario from a recent job or customer call." },
        { label: "Ask", text: "\u201cWhat does this value look like here? What does the A-Player do?\u201d" },
        { label: "Discuss", text: "Let the team respond — build the answer together." },
        { label: "Lock In", text: "Agree on the standard response: \u201cWhen this happens, we do this.\u201d" },
      ] },
      { title: "Raise the Bar", tag: "Week 4 · A-Player Definition", prompt: wk(3), substeps: [
        { label: "Pick", text: "Choose one value for the week." },
        { label: "Define", text: "Walk through A-Player, Meets Standard, and Unacceptable behavior." },
        { label: "Ask", text: "\u201cWhere are we as a team right now? Where do we want to be?\u201d" },
        { label: "Commit", text: "Set one specific behavior to improve before next month." },
      ] },
    ] }),
    pageNo: counter, pageTotal: PT16,
  }));
  counter += 1;

  // ── 04 · SCORECARD SYSTEM — Rate Culture, Not Just Output (5/3/1 ONLY) ──
  push(P.lightContentPage({
    brand: b, docTitle: DOC, eyebrow: "04 · Scorecard System", title: "Rate Culture, Not Just Output.",
    intro: "Use this scorecard in mentor meetings. It creates a shared language for evaluating culture alongside performance metrics.",
    inner:
      `<div style="font-size:11px; font-weight:700; letter-spacing:0.1em; text-transform:uppercase; color:var(--text-faint); margin:0 0 12px;">The Rating Scale</div>`
      + P.metricTable({ brand: b,
          columns: ["Rating", "Level", "What It Means"],
          colWidths: ["80px", "150px", "auto"],
          rows: [
            ["5", "A-Player", "Consistently exceeds the standard. Others learn from this person. Elevates the team."],
            ["3", "Meets Standard", "Reliably performs to expectation. Solid contributor. Room to grow."],
            ["1", "Below Standard", "Behavior does not reflect the value. Requires coaching, reset, or escalation."],
          ] })
      + `<p style="margin:14px 0 26px; font-size:13px; line-height:1.6; color:var(--text-body); max-width:700px;"><strong style="color:var(--text-strong);">No 2s or 4s.</strong> A rating forces a clear position — no hiding in the middle.</p>`
      + `<div style="font-size:11px; font-weight:700; letter-spacing:0.1em; text-transform:uppercase; color:var(--text-faint); margin:0 0 12px;">The Scorecard</div>`
      + P.metricTable({ brand: b,
          columns: ["Core Value", "Self", "Manager", "Coaching Focus"],
          colWidths: ["auto", "88px", "100px", "175px"],
          rows: vals.length
            ? vals.map((v) => [ (v && v.name) || "Core Value", "5 / 3 / 1", "5 / 3 / 1", "" ])
            : [["Core Value", "5 / 3 / 1", "5 / 3 / 1", ""]] })
      + P.navyCallout({ brand: b, eyebrow: "How to Use in Mentor Meetings",
          headline: "Complete it independently. Compare openly.",
          body: "Both manager and team member complete the scorecard independently before the meeting. Compare openly — the gaps reveal the most important conversations. Focus on one value for improvement per quarter, set one concrete behavior change, and revisit next session." }),
    pageNo: counter, pageTotal: PT16,
  }));
  counter += 1;

  // ── 05 · COACHING & ACCOUNTABILITY — Coach the Behavior, Not the Person ──
  push(P.lightContentPage({
    brand: b, docTitle: DOC, eyebrow: "05 · Coaching & Accountability", title: "Coach the Behavior, Not the Person.",
    intro: "Tie every coaching conversation to a value, not to a personality. You're not saying \u201cyou're a problem.\u201d You're saying \u201cthis behavior doesn't match who we are.\u201d",
    inner:
      `<div style="font-size:11px; font-weight:700; letter-spacing:0.1em; text-transform:uppercase; color:var(--text-faint); margin:0 0 14px;">1-on-1 Values Check-In Questions</div>`
      + P.leadInBullets({ brand: b, items: [
          { lead: "Opening.", body: "\u201cWhich value did you live well this week? Walk me through it.\u201d" },
          { lead: "Growth.", body: "\u201cWhere did you fall short of our values? What would you do differently?\u201d" },
          { lead: "Peer.", body: "\u201cWho on the team is living our values at the highest level right now?\u201d" },
          { lead: "Raise.", body: "\u201cWhat's one thing in the next 30 days to raise your game on a value?\u201d" },
        ] })
      + `<div style="font-size:11px; font-weight:700; letter-spacing:0.1em; text-transform:uppercase; color:var(--text-faint); margin:22px 0 12px;">Coaching Script Examples</div>`
      + (Array.isArray(cult.coachingScripts) && cult.coachingScripts.length
          ? P.coachingScriptCards({ brand: b, items: cult.coachingScripts })
          : `<div style="margin:0 0 24px; border-left:3px solid ${b.blue}; padding:10px 0 10px 16px;"><div style="font-size:12.5px; line-height:1.6; color:var(--text-body); font-style:italic;">Use each value's own language. For ` + P.esc((vals[0] && vals[0].name) || "a value") + `: \u201cI want to talk about what happened on that job. Our standard is that we ` + P.esc(((vals[0] && vals[0].phrase) || "live this value").replace(/\.$/, "").toLowerCase()) + `. What I saw was [specific behavior]. That's not who we are. Going forward, I need [specific change]. Can I count on that?\u201d</div></div>`)
      + `<div style="font-size:11px; font-weight:700; letter-spacing:0.1em; text-transform:uppercase; color:var(--text-faint); margin:0 0 12px;">The Escalation Framework</div>`
      + P.metricTable({ brand: b,
          columns: ["Step", "Action", "What It Looks Like"],
          colWidths: ["70px", "200px", "auto"],
          rows: [
            ["1st", "Coaching Conversation", "Private, direct. Name the value missed. Set the expectation. Document it."],
            ["2nd", "Reset & Written Agreement", "Formal reset. Specific behavior change required. Timeline defined. Both sign off."],
            ["3rd", "Role-Fit Discussion", "Is this person a fit for " + shortName + "? Involve leadership. Values violations are a disqualifier."],
          ] }),
    pageNo: counter, pageTotal: PT16,
  }));
  counter += 1;

  // ── section-opener 06/09 Hiring for Core Values (dark) ──
  push(P.sectionOpenerPage({
    brand: b, docTitle: DOC, sectionTitle: "Hiring for Core Values",
    sectionNum: 6, sectionTotal: 9,
    headline: "Train Skills. Screen Character.",
    subhead: "Never hire someone who fails the values screen.",
    pageNo: counter, pageTotal: PT16,
  }));
  counter += 1;

  // ── 06 · HIRING FOR VALUES — one page, all values as stacked cards ──
  push(P.lightContentPage({
    brand: b, docTitle: DOC, eyebrow: "06 · Hiring for Core Values", title: "We Can Train Skills. We Cannot Train Character.",
    intro: "Do not hire someone who does not align with our values — no matter how strong they look on paper. Use these questions and listen-fors in every interview.",
    inner:
      (vCount
        ? P.multiHiringCards({ brand: b, values: vals })
        : `<p style="margin:0; font-size:14px; color:var(--text-faint);">Your interview questions and listen-fors render here once your core values are captured.</p>`)
      + `<p style="margin:8px 0 0; font-size:12px; line-height:1.55; color:var(--text-faint); max-width:700px;">The full interview system — funnel, scoring rubrics, and decision matrix — lives in the Hiring &amp; Talent Development Playbook.</p>`,
    pageNo: counter, pageTotal: PT16,
  }));
  counter += 1;

  // ── 07 · PEOPLE DECISIONS — Values Are Hard Gates (5/3/1 tied gates) ──
  push(P.lightContentPage({
    brand: b, docTitle: DOC, eyebrow: "07 · People Decisions", title: "Values Are Hard Gates.",
    intro: "Our values are not soft criteria. They are hard gates on every people decision we make. A promotion is a statement that this person represents " + shortName + " at a higher level. You cannot promote someone who does not demonstrate A-Player behavior in our values.",
    inner:
      `<div style="margin:0 0 26px; border-left:4px solid ${b.blue}; padding:4px 0 4px 18px;">`
        + `<div style="font-size:20px; font-weight:700; line-height:1.3; color:var(--text-strong);">\u201cTechnical skill earns compensation. Character earns leadership.\u201d</div>`
        + `<div style="font-size:12px; color:var(--text-faint); margin-top:6px;">The Rule</div>`
      + `</div>`
      + `<div style="font-size:11px; font-weight:700; letter-spacing:0.1em; text-transform:uppercase; color:var(--text-faint); margin:0 0 12px;">The Gates</div>`
      + P.metricTable({ brand: b,
          columns: ["Decision", "Values Requirement"],
          colWidths: ["255px", "auto"],
          rows: [
            ["Promote to Lead / Manager", "Must score 5 on at least " + (vCount >= 2 ? (vCount - 1) + " of " + vCount : "the") + " values in the last scorecard. No 1s."],
            ["Retain after a performance issue", "Ongoing values violations = exit. Skill gaps are trainable; values misalignment is not."],
            ["Extend probationary period", "Any score of 1 in the first 90 days triggers an automatic reset and review."],
            ["Re-hire / bring back", "Previous values violations = disqualification, regardless of technical skill."],
          ] }),
    pageNo: counter, pageTotal: PT16,
  }));
  counter += 1;

  // ── 08 · FIELD EXECUTION — How the Values Become Daily Life (6 rows) ──
  push(P.lightContentPage({
    brand: b, docTitle: DOC, eyebrow: "08 · Field Execution", title: "How the Values Become Daily Life.",
    intro: "Here is how the values become part of daily life — from the field to the office to every customer interaction.",
    inner: P.leadInBullets({ brand: b, items: [
      { lead: "In every vehicle.", body: "Keep the values one-pager in every service vehicle. Reference it when coaching in the field — it should feel as natural as checking the equipment list." },
      { lead: "In onboarding.", body: "Every new hire completes a values orientation in week one. By the end of the week they can name all " + numberWord(vCount || 3) + " and give a real example of each." },
      { lead: "In weekly huddles.", body: "Run the 4-week rotation (Section 03) every single week without exception. 5–10 minutes. Non-negotiable." },
      { lead: "In daily conversation.", body: "Use the language. Call values out by name: \u201cThat's " + ((vals[0] && vals[0].name) || "our value") + ".\u201d \u201cThat's what " + ((vals[1] && vals[1].name) || (vals[0] && vals[0].name) || "our value") + " looks like.\u201d The more it's said, the more it's real." },
      { lead: "In customer interactions.", body: "When someone goes above and beyond, name the value out loud: \u201cYou just lived " + ((vals[0] && vals[0].name) || "our value") + ".\u201d Make it visible and celebrated." },
      { lead: "In performance reviews.", body: "The scorecard (Section 04) is a required part of every formal review. Behavior carries equal weight to output." },
    ] }),
    pageNo: counter, pageTotal: PT16,
  }));
  counter += 1;

  // ── 09 · MANAGER EXPECTATIONS — Not HR's Job. Not the Owner's Job. Yours. (6) ──
  push(P.lightContentPage({
    brand: b, docTitle: DOC, eyebrow: "09 · Manager Expectations", title: "Not HR's Job. Not the Owner's Job. Yours.",
    intro: "These are the minimum expectations for every person who leads a team at " + b.clientName + ".",
    inner: P.numberedStageList({ brand: b, items: [
      { title: "Run the weekly system", body: "Every week, no exceptions. Even short huddles count." },
      { title: "Use the language daily", body: "Name the values in real conversations, not just meetings." },
      { title: "Complete scorecards every quarter", body: "For every direct report. On time. With honest ratings." },
      { title: "Coach in the moment", body: "Don't let behavior misses slide. Address them the same day where possible." },
      { title: "Model the values yourself", body: "You cannot hold others to a standard you don't keep." },
      { title: "Hire and fire by the values", body: "Never hire someone who fails the values screen. Never retain someone who consistently violates them." },
      ...(cult.managerExpectationExtra ? [cult.managerExpectationExtra] : []),
    ] })
    + (cult.closingLine
        ? `<div style="margin-top:24px; padding-top:18px; border-top:1px solid var(--border-subtle); font-size:13.5px; line-height:1.6; color:var(--text-body); font-weight:600; max-width:700px;">${P.esc(cult.closingLine)}</div>`
        : ""),
    pageNo: counter, pageTotal: PT16,
  }));
  counter += 1;

  // ── section-opener 09/09 The Standard Is Set (dark) + optional acronym tiles ──
  // Acronym tiles render ONLY when culture.acronym is explicitly set AND its
  // length matches the value count (guard against near-words / mismatched
  // acronyms). Non-acronym tenants (Summit) get the clean closer, no gap.
  const acronym = cult.acronym && typeof cult.acronym === "string" ? cult.acronym.trim() : "";
  const tilesOk = acronym && vCount && acronym.replace(/[^A-Za-z]/g, "").length === vCount;
  const acronymExtra = tilesOk
    ? P.letterTileRow({ brand: b, dark: true,
        tiles: acronym.replace(/[^A-Za-z]/g, "").split("").map((letter, i) => ({
          letter, name: (vals[i] && vals[i].name) || "",
        })) })
    : "";
  push(P.sectionOpenerPage({
    brand: b, docTitle: DOC, sectionTitle: "The Standard Is Set",
    sectionNum: 9, sectionTotal: 9,
    headline: "This Is Our Standard.",
    subhead: (tilesOk ? acronym : (numberWord(vCount || 3).replace(/^\w/, (c) => c.toUpperCase()) + " values")) + ". One standard. Every seat, every day.",
    extra: acronymExtra,
    pageNo: counter, pageTotal: PT16,
  }));
  counter += 1;

  // ── back cover: CTA + brand lockup (no counter) ──
  push(P.closingCtaPage({
    brand: b, docTitle: DOC,
    eyebrow: "People Are the Product",
    headline: "The Standard Is Set. Now Go Live It.",
    body: "This is how " + b.clientName + " builds a team most companies only talk about. Lead the values. Coach the values. Recognize the values — every week.",
    ctaLabel: "Open Your Leadership Tools", ctaUrl: url,
    pageNo: counter, pageTotal: PT16,
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

module.exports = { buildCultureHTML };
