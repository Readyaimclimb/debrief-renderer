// debrief-pi-block.js  (debrief-renderer)
// ════════════════════════════════════════════════════════════════════════
//  DEBRIEF — PI Ramp Read block (locked FOMO teaser + live seat read)
// ════════════════════════════════════════════════════════════════════════
//  Two states, same slot in the debrief decision document:
//
//    lockedRampReadBlock()  → FOMO teaser when PI is NOT on. Shows the owner
//                             what PI would add at the decision moment, framed
//                             as ramp-planning (never "you're missing a verdict").
//
//    liveSeatReadBlock()    → when PI IS on: a NEUTRAL seat read (3rd person,
//                             role-only) + the candidate's Ramp Read (runway,
//                             never a grade). A lens for the panel's conversation,
//                             never a verdict on the person.
//
//  ⚠️ DESIGN NOTE: the debrief is the hire/no-hire document. We deliberately keep
//  the FOMO upsell SOFT here and the live content STRICTLY non-verdict — cognitive
//  is shown as a runway ("time to full stride"), never a pass/fail. This is the
//  most load-bearing place for the "lens, not a verdict" rule.
//
//  ⚠️ COPYRIGHT: all copy is OURS. No PI descriptor vocabulary, no PI prose. The
//  seat read comes from piTargetLanguage.seatProfile(); the ramp framing from the
//  ±50 comfort-zone model. Numbers-only inputs, our-voice output.
//
//  Uses the debrief engine's own primitives so it matches every other debrief
//  page exactly: E.titleBlock, E.lightPage, E.TOKEN_HEX, E.TOKEN_BG.
//
//  DROP-IN: require this from the debrief assembler and route by PI state:
//     const RR = require("./debrief-pi-block.js");
//     out.push(piOn ? RR.liveSeatReadBlock(seatRead, ramp, eyebrow, brand, pageNo)
//                   : RR.lockedRampReadBlock(roleTitle, eyebrow, brand, pageNo));
// ════════════════════════════════════════════════════════════════════════

const E = require("./debrief-engine.js");

// ── LOCKED: FOMO teaser (PI off) ────────────────────────────────────────────
function lockedRampReadBlock(roleTitle, eyebrowLabel, brand, pageNo) {
  const accent = (brand && brand.accent) || "#EA6B47";
  const role = E.esc(roleTitle || "this role");
  const inner = `
    ${E.titleBlock(eyebrowLabel || "Ramp Read", "Will the fit last — and how fast will they ramp?", {
      intro: "At the decision moment, two questions decide whether a hire sticks: does their wiring fit the seat, and how quickly will they get to full stride? With PI, the debrief answers both.",
      h2size: 28,
    })}
    <div style="margin-top:10px; background:var(--rac-off-white); border:1px dashed var(--border-default); border-radius:12px; padding:22px 26px;">
      <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:10px;">
        <span style="font-size:11px; font-weight:700; letter-spacing:0.1em; text-transform:uppercase; color:${accent};">What PI adds to this decision</span>
        <span style="font-size:10.5px; font-weight:700; letter-spacing:0.08em; text-transform:uppercase; color:var(--text-faint);">&#128274; PI only</span>
      </div>
      <div style="font-size:19px; font-weight:900; letter-spacing:-0.01em; color:var(--text-strong); margin-bottom:12px;">See the fit and the ramp — before you commit</div>
      ${teaserRow(accent, "How ${role} is actually wired — and whether this candidate's natural behavior fits the seat, so the fit lasts past the interview")}
      ${teaserRow(accent, "The Ramp Read: how fast they'll get to full stride — a runway to plan, never a score to pass")}
      ${teaserRow(accent, "A First-90 coaching plan built from the same data — so the manager knows how to bring this specific person on")}
      <div style="margin-top:16px; padding-top:14px; border-top:1px solid var(--border-subtle); font-size:12.5px; line-height:1.5; color:var(--text-muted);">
        Turn on Predictive Index to unlock the Ramp Read on every debrief.
      </div>
    </div>`.replace(/\$\{role\}/g, role);
  return E.lightPage(inner, brand, pageNo);
}

function teaserRow(accent, text) {
  return `<div style="display:flex; gap:11px; margin-bottom:10px; font-size:13.5px; line-height:1.5; color:var(--text-body);">
    <span style="flex:0 0 auto; color:${accent}; font-weight:900; padding-top:1px;">+</span>
    <span>${text}</span>
  </div>`;
}

// ── LIVE: neutral seat read + Ramp Read (PI on) ─────────────────────────────
//  seatRead : string[] from piTargetLanguage.seatProfile(target) — 3rd person,
//             role-only, neutral ("This seat rewards a steady pace…").
//  ramp     : { side:"in"|"below"|"above", label, runway, plan } — the Ramp Read.
//             side "in" = inside the ±50 zone; "below"/"above" = outside it.
function liveSeatReadBlock(seatRead, ramp, eyebrowLabel, brand, pageNo) {
  const good = E.TOKEN_HEX.good, mixed = E.TOKEN_HEX.mixed;
  const seat = Array.isArray(seatRead) ? seatRead.filter(Boolean) : [];
  const seatHtml = seat.length
    ? seat.map((s) => `<div style="display:flex; gap:10px; margin-bottom:9px; font-size:13.5px; line-height:1.5; color:var(--text-body);"><span style="flex:0 0 auto; color:var(--text-faint);">•</span><span>${E.esc(s)}</span></div>`).join("")
    : `<div style="font-size:13px; color:var(--text-muted);">No clear behavioral lean for this seat — wiring fit is flexible here.</div>`;

  // Ramp Read card — runway, never a grade. Inside the zone = green; outside = amber.
  let rampHtml = "";
  if (ramp && ramp.side) {
    const inZone = ramp.side === "in";
    const c = inZone ? good : mixed;
    const bg = inZone ? E.TOKEN_BG.good : E.TOKEN_BG.mixed;
    rampHtml = `
      <div style="margin-top:18px; background:#fff; border:1px solid var(--border-subtle); border-left:4px solid ${c}; border-radius:9px; padding:16px 20px;">
        <div style="display:flex; align-items:center; justify-content:space-between; gap:12px; margin-bottom:8px;">
          <span style="font-weight:700; font-size:14px; color:var(--text-strong);">The Ramp Read</span>
          <span style="flex:0 0 auto; font-size:10.5px; font-weight:700; letter-spacing:0.06em; text-transform:uppercase; color:${c}; background:${bg}; padding:4px 11px; border-radius:20px;">${E.esc(ramp.label || (inZone ? "Typical ramp" : "Extended ramp"))}</span>
        </div>
        <div style="font-size:13.5px; line-height:1.55; color:var(--text-body);">${E.esc(ramp.runway || "")}</div>
        ${ramp.plan ? `<div style="margin-top:11px; display:flex; gap:9px; background:var(--rac-off-white); border-radius:6px; padding:11px 14px;">
          <span style="flex:0 0 auto; font-size:11px; font-weight:700; letter-spacing:0.06em; text-transform:uppercase; color:var(--text-muted); padding-top:1px;">First 90</span>
          <span style="font-size:12.5px; line-height:1.45; color:var(--text-body);">${E.esc(ramp.plan)}</span>
        </div>` : ""}
      </div>`;
  }

  const inner = `
    ${E.titleBlock(eyebrowLabel || "Ramp Read", "How this seat is wired — and how fast they'll ramp", {
      intro: "A lens for the panel's conversation, not a verdict. This describes what the seat needs and how quickly this person is likely to reach full stride — never whether they belong.",
      h2size: 26,
    })}
    <div style="font-size:11px; font-weight:700; letter-spacing:0.08em; text-transform:uppercase; color:var(--text-faint); margin-bottom:10px;">What this seat rewards</div>
    ${seatHtml}
    ${rampHtml}
    <div style="margin-top:16px; font-size:11.5px; line-height:1.45; color:var(--text-faint); font-style:italic;">
      The Ramp Read predicts how fast someone learns a new role — a runway to plan, never a score to pass. A wider gap is a reason to plan, not a reason to pass.
    </div>`;
  return E.lightPage(inner, brand, pageNo);
}

module.exports = { lockedRampReadBlock, liveSeatReadBlock };
