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

function buildCultureHTML({ ctx, brand, values }) {
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

  // ── phys 01: COVER (no counter) ──
  push(P.coverPage({
    brand: b,
    eyebrow: "A Manager's Playbook for Living Our Core Values",
    title: DOC,
    subtitle: "How we lead, coach, hire, and promote by the values that make "
      + b.clientName + " who we are.",
    tagline, url,
  }));

  // ── phys 02: section-opener 01/09 Our Foundation (footer 01 / 24) ──
  push(P.sectionOpenerPage({
    brand: b, docTitle: DOC, sectionTitle: "Our Foundation",
    sectionNum: 1, sectionTotal: 9,
    headline: "People Are the Product.",
    subhead: "Our purpose and mission — the ground everything else stands on.",
    pageNo: 1, pageTotal: PT,
  }));

  // ── phys 03: Purpose / Mission / Core Values (footer 02 / 24) ──
  push(P.lightContentPage({
    brand: b, docTitle: DOC, eyebrow: "Our Foundation", title: "Why We Exist.",
    intro: "At " + b.clientName + " we hold a standard most companies only talk about. Commitments mean something here, and execution is a discipline, not a hope.",
    inner:
      P.navyCallout({ brand: b, eyebrow: "Our Mission", headline: "The work, and who does it.",
        body: "To keep our community comfortable and safe through heating, cooling, and controls done right the first time — delivered by a team that takes ownership, keeps its word, and puts the crew before the individual." })
      + `<div style="font-size:11px; font-weight:700; letter-spacing:0.1em; text-transform:uppercase; color:var(--text-faint); margin:0 0 14px;">Our Core Values</div>`
      + P.behaviorLadderCoreList({ brand: b, values: vals }),
    pageNo: 2, pageTotal: PT,
  }));

  // ── phys 04: section-opener Introduction (footer 03 / 24) ──
  push(P.sectionOpenerPage({
    brand: b, docTitle: DOC, sectionTitle: "Introduction",
    sectionNum: 2, sectionTotal: 9,
    headline: "What This Playbook Is.",
    subhead: "Turning values from words on a wall into daily behavior.",
    pageNo: 3, pageTotal: PT,
  }));

  // ── phys 05: From Words to Behavior (footer 04 / 24) ──
  push(P.lightContentPage({
    brand: b, docTitle: DOC, eyebrow: "What This Playbook Is", title: "From Words to Behavior.",
    intro: shortName + " is built on " + numberWord(vCount || 3) + " core values. As we grow, we protect our culture by keeping those values consistent — on every job, in every customer interaction, in every conversation between teammates.",
    inner:
      `<p style="margin:0 0 22px; font-size:14.5px; line-height:1.6; color:var(--text-body); max-width:690px;">This playbook turns our values from words on a wall into daily behaviors every person on the team lives. It exists to do three things:</p>`
      + P.leadInBullets({ brand: b, items: [
          { lead: "Translate.", body: "Turn core values into specific, observable behaviors." },
          { lead: "Equip.", body: "Give managers practical tools to coach, recognize, and hold accountability." },
          { lead: "Create consistency.", body: "Hold the same standard across every crew, office, and customer interaction." },
        ] })
      + P.navyCallout({ brand: b, eyebrow: "The Manager's Job", headline: "You are the culture.",
          body: "The team does not live the values because they are written down. They live them because their manager notices, coaches, and rewards them — every week." }),
    pageNo: 4, pageTotal: PT,
  }));

  // ── phys 06: section-opener Core Values Defined (footer 05 / 24) ──
  push(P.sectionOpenerPage({
    brand: b, docTitle: DOC, sectionTitle: "Core Values Defined",
    sectionNum: 3, sectionTotal: 9,
    headline: "The Behavior Standards.",
    subhead: "Each value, with clear A-Player / Meets / Unacceptable standards.",
    pageNo: 5, pageTotal: PT,
  }));

  // ── phys 07: How to Read the Ladder (footer 06 / 24) ──
  push(P.lightContentPage({
    brand: b, docTitle: DOC, eyebrow: "Behavior Standards", title: "How to Read the Ladder.",
    intro: "Each value has a defining phrase and clear behavioral standards. Use this section as your reference for coaching and performance conversations — where is this person on the ladder, and what's the next rung?",
    pageNo: 6, pageTotal: PT,
  }));

  // ── phys 08..N: behavior-ladder pages, one per value (footer 07 onward) ──
  let counter = 7;
  if (!vCount) {
    push(P.lightContentPage({
      brand: b, docTitle: DOC, eyebrow: "Behavior Standards",
      title: "Define your core values to complete this playbook.",
      intro: "Once your core values are captured in onboarding, each one renders here with its A-Player, Meets Standard, and Unacceptable behavior ladder.",
      pageNo: counter, pageTotal: PT,
    }));
    counter += 1;
  } else {
    vals.forEach((value) => {
      const v = value || {};
      push(P.lightContentPage({
        brand: b, docTitle: DOC, eyebrow: "Core Values Defined",
        title: v.name || "Core Value",
        intro: v.phrase
          ? "\u201c" + v.phrase + "\u201d " + (v.definition || "")
          : (v.definition || ""),
        inner: P.behaviorLadderTable({ brand: b, standards: v.standards }),
        pageNo: counter, pageTotal: PT,
      }));
      counter += 1;
    });
  }

  // ── The 4-Week Rotation ──
  push(P.lightContentPage({
    brand: b, docTitle: DOC, eyebrow: "Weekly Core Values System", title: "The 4-Week Rotation.",
    intro: "Run this system in your weekly team meetings or crew huddles. Each format takes 5–10 minutes. Rotate through all four each month — consistency is the goal.",
    inner: P.numberedStageList({ brand: b, items: [
      { title: "Caught in the Act", tag: "Week 1 · Recognition", body: "Name someone who clearly lived a value this week. Be specific: what did they do, when, where, and why it mattered. Connect it back to the value out loud." },
      { title: "Real Talk", tag: "Week 2 · Scenario", body: "Pose a real situation the crew hit this week. Ask: which value was on the line, and what did living it look like? Debate it together." },
      { title: "Self-Check", tag: "Week 3 · Where Am I?", body: "Each person picks one value and rates themselves honestly against the ladder. One thing to keep doing, one thing to improve." },
      { title: "Raise the Bar", tag: "Week 4 · A-Player Definition", body: "Pick one value. Walk through A-Player / Meets / Unacceptable as a team. Ask: where are we now, where do we want to be? Commit to one behavior to improve before next month." },
    ] }),
    pageNo: counter, pageTotal: PT,
  }));
  counter += 1;

  // ── Core Values Scorecard ──
  push(P.lightContentPage({
    brand: b, docTitle: DOC, eyebrow: "Core Values Scorecard", title: "Rate Culture, Not Just Metrics.",
    intro: "Use this scorecard in monthly or quarterly mentor meetings. It creates a shared language for evaluating culture — separate from performance metrics.",
    inner: P.metricTable({ brand: b,
      columns: ["Rating", "Level", "What It Means"],
      colWidths: ["80px", "150px", "auto"],
      rows: [
        ["5", "A-Player", "Consistently models the value and raises it in others."],
        ["4", "Strong", "Lives the value reliably without prompting."],
        ["3", "Meets", "Meets the standard; still needs occasional reminders."],
        ["2", "Developing", "Inconsistent; the value is not yet a habit."],
        ["1", "Concern", "Behavior actively conflicts with the value."],
      ] })
      + P.navyCallout({ brand: b, eyebrow: "The Coaching Trigger", headline: "An average below 3.5 is not a footnote.",
          body: "An average below 3.5 across values is a coaching trigger. Culture scores are discussed openly in the mentor meeting — the goal is a shared read, not a surprise." }),
    pageNo: counter, pageTotal: PT,
  }));
  counter += 1;

  // ── Manager Coaching & Accountability (escalation ladder) ──
  push(P.lightContentPage({
    brand: b, docTitle: DOC, eyebrow: "Manager Coaching & Accountability", title: "This Behavior Doesn't Match Who We Are.",
    intro: "Tie every coaching conversation to a value — not to a personality. You're not saying \u201cyou're a problem.\u201d You're saying \u201cthis behavior doesn't match who we are.\u201d",
    inner:
      `<div style="font-size:11px; font-weight:700; letter-spacing:0.1em; text-transform:uppercase; color:var(--text-faint); margin:0 0 14px;">In 1-on-1s — Values Check-In Questions</div>`
      + P.leadInBullets({ brand: b, items: [
          { lead: "Opening.", body: "\u201cWhich value did you live well this week? Walk me through it.\u201d" },
          { lead: "Growth.", body: "\u201cWhere did you fall short of our values? What would you do differently?\u201d" },
          { lead: "Peer.", body: "\u201cWho on the crew lived a value this week in a way worth calling out?\u201d" },
        ] })
      + `<div style="margin-top:22px; font-size:11px; font-weight:700; letter-spacing:0.1em; text-transform:uppercase; color:var(--text-faint); margin-bottom:14px;">When Behavior Doesn't Change — The Escalation Ladder</div>`
      + P.numberedStageList({ brand: b, items: [
          { title: "First Coaching Conversation", body: "Private, direct. Name the value missed. Set the expectation. Document it." },
          { title: "Reset & Written Agreement", body: "Formal reset. Specific behavior change required. Timeline defined. Both parties sign off." },
          { title: "Final Decision", body: "If the value gap persists after a genuine chance to change, the person is not the right fit — no matter how skilled. Character earns a place on the team." },
        ] }),
    pageNo: counter, pageTotal: PT,
  }));
  counter += 1;

  // ── section-opener Hiring for Core Values ──
  push(P.sectionOpenerPage({
    brand: b, docTitle: DOC, sectionTitle: "Hiring for Core Values",
    sectionNum: 6, sectionTotal: 9,
    headline: "We Can Train Skills. Not Character.",
    subhead: "Do not hire someone who does not align — no matter how qualified.",
    pageNo: counter, pageTotal: PT,
  }));
  counter += 1;

  // ── Character Is Not Trainable ──
  push(P.lightContentPage({
    brand: b, docTitle: DOC, eyebrow: "Hiring for Values", title: "Character Is Not Trainable.",
    intro: "We can train skills. We cannot train character. Do not hire someone who does not align with our values — no matter how qualified they look on paper.",
    inner: P.navyCallout({ brand: b, eyebrow: "The Hiring Rule", headline: "Alignment first. Always.",
      body: "The pages that follow give the interview questions for each value, and exactly what to listen for in the answer. Ask the question, then let the candidate talk — the story tells you whether the value is real." }),
    pageNo: counter, pageTotal: PT,
  }));
  counter += 1;

  // ── hiring-questions pages, one per value ──
  if (!vCount) {
    push(P.lightContentPage({
      brand: b, docTitle: DOC, eyebrow: "Hiring for Values",
      title: "Define your core values to complete this section.",
      intro: "Each value renders its interview questions and what to listen for once your values are captured.",
      pageNo: counter, pageTotal: PT,
    }));
    counter += 1;
  } else {
    vals.forEach((value) => {
      const v = value || {};
      push(P.lightContentPage({
        brand: b, docTitle: DOC, eyebrow: "Hiring for Values",
        title: v.name || "Core Value",
        intro: v.phrase ? "\u201c" + v.phrase + "\u201d" : "",
        inner: P.hiringQuestionTable({ brand: b, pairs: v.hiringQuestions || [] }),
        pageNo: counter, pageTotal: PT,
      }));
      counter += 1;
    });
  }

  // ── Promotions & People Decisions ──
  push(P.lightContentPage({
    brand: b, docTitle: DOC, eyebrow: "Promotions & People Decisions", title: "Not Soft Criteria — Hard Gates.",
    intro: "At " + shortName + ", our values are not soft criteria. They are hard gates on every people decision we make.",
    inner:
      P.navyCallout({ brand: b, eyebrow: "The Rule", headline: "A promotion is a statement.",
        body: "A promotion says this person represents " + shortName + " at a higher level. You cannot promote someone who does not demonstrate A-Player behavior in our values. Technical skill earns compensation. Character earns leadership." })
      + P.metricTable({ brand: b,
          columns: ["Decision", "Values Requirement"],
          colWidths: ["215px", "auto"],
          rows: [
            ["Promote to Lead", "A-Player on at least two values; no value below Meets."],
            ["Give more responsibility", "Meets or better on all values; trending up."],
            ["Put in front of customers", "A-Player on the customer-facing value; no Concern anywhere."],
            ["Move on from someone", "Persistent Concern after a genuine chance to change."],
          ] }),
    pageNo: counter, pageTotal: PT,
  }));
  counter += 1;

  // ── Field Execution ──
  push(P.lightContentPage({
    brand: b, docTitle: DOC, eyebrow: "Field Execution", title: "From Binder to Daily Life.",
    intro: "A playbook that lives in a binder is useless. Here is how our values become part of daily life — from the field to the office to every customer interaction.",
    inner: P.numberedStageList({ brand: b, items: [
      { title: "In Every Vehicle", body: "Keep the one-page values card in every service vehicle. Reference it when coaching in the field — it should feel as natural as checking the equipment list." },
      { title: "In Onboarding", body: "Every new hire completes a values orientation in week one. By the end of the week they can name all values and give a real example of each." },
      { title: "In Every Meeting", body: "Open or close team meetings with a value moment — a recognition, a scenario, or a self-check. Thirty seconds keeps it alive." },
      { title: "In Customer Reviews", body: "When a customer praises the crew, tie it back to a value out loud. When something goes wrong, do the same. The values explain both." },
    ] }),
    pageNo: counter, pageTotal: PT,
  }));
  counter += 1;

  // ── Manager Expectations ──
  push(P.lightContentPage({
    brand: b, docTitle: DOC, eyebrow: "Manager Expectations", title: "Not HR's Job. Not the Owner's. Yours.",
    intro: "Culture is not HR's job. It is not the owner's job. Culture is YOUR job — every manager, every week, every conversation. These are the minimum expectations for every leader at " + shortName + ".",
    inner: P.numberedStageList({ brand: b, items: [
      { title: "Run the Weekly Values System", body: "Every week, no exceptions. Even a short huddle counts." },
      { title: "Use the Language Daily", body: "Name the value in the moment — in praise and in correction. The words have to live in normal conversation, not just meetings." },
      { title: "Coach to the Ladder", body: "Every performance conversation ties to a value and a rung. Behavior, not personality." },
      { title: "Model It Yourself", body: "The team calibrates to you, not the poster. Where you set the bar is where the bar is." },
    ] }),
    pageNo: counter, pageTotal: PT,
  }));
  counter += 1;

  // ── section-opener The Standard Is Set ──
  push(P.sectionOpenerPage({
    brand: b, docTitle: DOC, sectionTitle: "The Standard Is Set",
    sectionNum: 9, sectionTotal: 9,
    headline: "Now Go Lead It.",
    subhead: "You have the language. The culture is what you do with it this week.",
    pageNo: counter, pageTotal: PT,
  }));
  counter += 1;

  // ── The Behavior You Celebrate (values recap) ──
  push(P.lightContentPage({
    brand: b, docTitle: DOC, eyebrow: "The Standard Is Set", title: "The Behavior You Celebrate Is the Culture You Get.",
    intro: "Culture is not an annual event. It is a weekly habit — built one recognition, one coaching conversation, one modeled moment at a time.",
    inner:
      P.navyCallout({ brand: b, eyebrow: "The " + shortName + " Standard", headline: "The behavior you celebrate is the culture you get.",
        body: "The behavior you tolerate is the culture you keep." })
      + `<div style="font-size:11px; font-weight:700; letter-spacing:0.1em; text-transform:uppercase; color:var(--text-faint); margin:0 0 14px;">Our Values, One More Time</div>`
      + P.behaviorLadderCoreList({ brand: b, values: vals, phraseOnly: true }),
    pageNo: counter, pageTotal: PT,
  }));

  // ── back cover: CTA + brand lockup (no counter) ──
  push(P.closingCtaPage({
    brand: b, docTitle: DOC,
    eyebrow: "People Are the Product",
    headline: "The Standard Is Set. Now Go Live It.",
    body: "This is how " + b.clientName + " builds a team most companies only talk about. Lead the values. Coach the values. Hire and promote by the values — every week.",
    ctaLabel: "Open Your Leadership Tools", ctaUrl: url,
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

module.exports = { buildCultureHTML };
