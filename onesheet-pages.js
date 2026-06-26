// ════════════════════════════════════════════════════════════════════════
//  HIRE2SCALE — One Sheet PDF page builders
//
//  Sibling to the debrief renderer: reuses debrief-engine.js for brand tokens,
//  the cream lightPage shell, titleBlock header, footer, and functional status
//  colors — so the One Sheet and the Debrief share ONE styling system.
//
//  Input:  prep_blocks[] (from /api/onesheet-draft) + ctx (candidate/role) + brand
//  Output: array of page HTML strings -> assemble-onesheet.js -> Chrome -> PDF
//
//  Design contract (inherited): 816×1056 px pages, one block per page, cream
//  interiors with pinned footer, dark cover + CTA. Each block is break-inside:
//  avoid so the green/red flags NEVER orphan from their questions.
// ════════════════════════════════════════════════════════════════════════
const E = require("./debrief-engine.js");
const { esc, TOKEN_HEX } = E;

const GUARDRAIL = "A lens for conversation, not a verdict.";

// ── dark archetype (cover + CTA) — self-contained navy, matches the standard ──
function darkShell(inner, brand) {
  const navy = brand.navy || "#171758";
  const navyDark = brand.navyDark || "#0A0A34";
  return `<section class="page" style="width:816px; height:1056px; position:relative; overflow:hidden; box-sizing:border-box;
      background:linear-gradient(160deg, ${navy} 0%, ${navyDark} 100%); color:#fff;">
    <div style="position:absolute; inset:0; padding:64px;">${inner}</div>
  </section>`;
}

function coverPage(ctx, brand, logoDark) {
  const accent = brand.accent || "#EA6B47";
  const logo = logoDark
    ? `<img src="${logoDark}" alt="${esc(brand.clientName || "")}" style="height:64px; margin-bottom:40px;"/>`
    : `<div style="font-weight:900; font-size:30px; letter-spacing:-0.01em; color:#fff; margin-bottom:40px;">${esc(brand.clientName || "")}</div>`;
  return darkShell(`
    <div style="height:100%; display:flex; flex-direction:column;">
      <div style="text-align:center; padding-top:40px;">
        ${logo}
        <div style="font-size:13px; font-weight:700; letter-spacing:0.18em; text-transform:uppercase; color:rgba(255,255,255,0.6);">
          Interview Guide
        </div>
      </div>
      <div style="flex:1; display:flex; flex-direction:column; justify-content:center; align-items:center; text-align:center;">
        <h1 style="margin:0; font-weight:900; font-size:54px; line-height:1.05; letter-spacing:-0.02em;">
          ${esc(ctx.candidate || "Candidate")}
        </h1>
        <div style="font-size:28px; font-weight:600; color:rgba(255,255,255,0.85); margin-top:10px;">
          ${esc(ctx.role || "")}
        </div>
        <div style="width:72px; height:4px; background:${accent}; margin:28px 0;"></div>
        <p style="max-width:520px; font-size:17px; line-height:1.6; color:rgba(255,255,255,0.75); margin:0;">
          One candidate. Values, role competencies, and the STAR method — woven into a single interview guide.
        </p>
      </div>
      <div style="text-align:center; font-size:12px; color:rgba(255,255,255,0.5);">
        ${esc(brand.contact || "Powered by Ready Aim Climb · readyaimclimb.com")}
      </div>
    </div>`, brand);
}

// ── how-to-use + STAR primer (light page) ──
function howToPage(ctx, brand, pageNo) {
  const accent = brand.accent || "#EA6B47";
  const star = [
    ["S", "Situation", "What was the context? What was going on around them?"],
    ["T", "Task", "What was their specific role or responsibility?"],
    ["A", "Action", "What did they actually do? This is the most important part."],
    ["R", "Result", "What happened? Was it measurable?"],
  ].map(([k, t, d]) => `
    <div style="flex:1; background:var(--rac-white); border:1px solid var(--border-subtle); border-radius:10px; padding:16px;">
      <div style="font-weight:900; font-size:22px; color:${accent}; line-height:1;">${k}</div>
      <div style="font-weight:700; font-size:13px; margin:6px 0 4px; color:var(--text-strong);">${t}</div>
      <div style="font-size:12px; line-height:1.45; color:var(--text-muted);">${d}</div>
    </div>`).join("");

  const inner = `
    ${E.titleBlock("The STAR method", "Listen for all four parts", {
      intro: "Every behavioral question should be answered through STAR. Train yourself to hear all four — the Action is the part that matters most.",
      h2size: 34,
    })}
    <div style="display:flex; gap:12px; margin:8px 0 26px;">${star}</div>
    <div style="font-size:14px; line-height:1.65; color:var(--text-body); margin-bottom:22px;">
      <strong>Digging deeper.</strong> When answers go vague, collective ("we did this"), or hypothetical
      ("I would typically…"), push back: "Can you give me a specific example?" · "What was <em>your</em> role?"
      · "What was the actual outcome — can you put a number on it?"
    </div>
    <div style="background:${brand.navy || "#171758"}; border-top:4px solid ${accent}; border-radius:8px; padding:20px 24px; color:#fff;">
      <div style="font-size:11px; font-weight:700; letter-spacing:0.12em; text-transform:uppercase; color:${accent}; margin-bottom:8px;">
        The win for this role
      </div>
      <div style="font-size:15px; line-height:1.55; color:rgba(255,255,255,0.92);">
        ${esc(ctx.theWin || ctx.jobTarget || "")}
      </div>
    </div>`;
  return E.lightPage(inner, brand, pageNo);
}

// ── the block page (one value or competency) — break-inside: avoid ──
function blockPage(block, eyebrowLabel, brand, pageNo) {
  const good = TOKEN_HEX.good, danger = TOKEN_HEX.danger;
  const intro = (block.intro || "").split(". ")[0].replace(/\.$/, "") + ".";

  const questions = (block.questions || [])
    .map((q, i) => `<div style="font-size:13px; line-height:1.5; color:var(--text-body); margin-bottom:7px;">
        <strong>${i + 1}.</strong> ${esc(q)}</div>`).join("");

  const flagCol = (items, color, title, glyph) => `
    <div style="flex:1;">
      <div style="background:${color}; color:#fff; font-weight:700; font-size:12px; letter-spacing:0.04em;
          padding:10px 14px; border-radius:8px 8px 0 0;">${glyph}&nbsp; ${title}</div>
      <div style="background:var(--rac-off-white); border:1px solid var(--border-subtle); border-top:none;
          border-radius:0 0 8px 8px; padding:14px 16px;">
        ${items.map((f) => `<div style="display:flex; gap:9px; margin-bottom:11px; font-size:12.5px; line-height:1.45; color:var(--text-body);">
            <span style="flex:0 0 9px; width:9px; height:9px; border-radius:2px; background:${color}; margin-top:4px;"></span>
            <span>${esc(f.text)}</span></div>`).join("")}
      </div>
    </div>`;

  const inner = `
    <div style="break-inside:avoid;">
      ${E.titleBlock(eyebrowLabel, block.name, { intro, h2size: 30 })}
      <div style="font-size:13px; line-height:1.5; color:var(--text-muted); margin:6px 0 16px;">
        <strong style="color:var(--text-body);">Purpose:</strong> ${esc(block.purpose)}
      </div>
      <div style="font-size:11px; font-weight:700; letter-spacing:0.1em; text-transform:uppercase; color:var(--cd-accent); margin-bottom:8px;">
        Interview questions
      </div>
      ${questions}
      <div style="display:flex; gap:16px; margin-top:18px;">
        ${flagCol(block.green || [], good, "GREEN FLAGS — strong answers", "✓")}
        ${flagCol(block.red || [], danger, "RED FLAGS — watch out for", "✗")}
      </div>
    </div>`;
  return E.lightPage(inner, brand, pageNo);
}

// ── section divider (light, big statement) ──
function dividerPage(eyebrow, headline, lead, brand, pageNo) {
  const accent = brand.accent || "#EA6B47";
  const inner = `
    <div style="height:100%; display:flex; flex-direction:column; justify-content:center;">
      <span style="font-size:13px; font-weight:700; letter-spacing:0.14em; text-transform:uppercase; color:${accent};">${esc(eyebrow)}</span>
      <h2 style="margin:16px 0 0; font-weight:900; font-size:52px; line-height:1.02; letter-spacing:-0.02em; color:var(--text-strong);">${esc(headline)}</h2>
      <div style="width:64px; height:4px; background:${accent}; margin:24px 0;"></div>
      <p style="margin:0; font-size:17px; line-height:1.6; color:var(--text-body); max-width:600px;">${esc(lead)}</p>
    </div>`;
  return E.lightPage(inner, brand, pageNo);
}

// ── debrief decision page ──
function debriefPage(brand, pageNo) {
  const accent = brand.accent || "#EA6B47";
  const mixed = TOKEN_HEX.mixed;
  const qs = [
    ["Trust under pressure", "Would I trust this person to handle a hard situation without supervision?"],
    ["Raise or lower the bar", "Would this person raise the standard on our team — or lower it?"],
    ["Respect of the best", "Would our strongest performers respect working alongside this person?"],
  ].map(([t, d], i) => `
    <div style="background:var(--rac-white); border:1px solid var(--border-subtle); border-left:4px solid ${accent};
        border-radius:8px; padding:16px 20px; margin-bottom:12px;">
      <div style="display:flex; align-items:baseline; gap:12px;">
        <span style="font-weight:900; font-size:22px; color:${accent};">${i + 1}</span>
        <span style="font-weight:700; font-size:15px; color:var(--text-strong);">${t}</span>
      </div>
      <div style="font-size:13px; line-height:1.5; color:var(--text-muted); margin-top:6px; padding-left:34px;">${d}</div>
    </div>`).join("");

  const inner = `
    ${E.titleBlock("Three decision questions", "Answer these honestly", {
      intro: "Before you finalize, each interviewer should be able to answer all three — on evidence, not a feeling.",
      h2size: 32,
    })}
    ${qs}
    <div style="background:${E.TOKEN_BG.mixed}; border:1px solid ${mixed}; border-radius:8px; padding:16px 20px; margin-top:8px;">
      <div style="font-weight:700; font-size:13px; color:${mixed}; letter-spacing:0.06em; text-transform:uppercase; margin-bottom:6px;">The rule</div>
      <div style="font-size:14px; line-height:1.55; color:var(--text-body);">
        If you can't answer yes to all three, the decision should wait — or go the other direction.
        A wrong hire costs far more than a delayed one.
      </div>
    </div>`;
  return E.lightPage(inner, brand, pageNo);
}

function ctaPage(ctx, brand, logoDark) {
  const accent = brand.accent || "#EA6B47";
  const logo = logoDark ? `<img src="${logoDark}" alt="${esc(brand.clientName || "")}" style="height:54px; margin-bottom:36px;"/>` : `<div style="font-weight:900; font-size:26px; letter-spacing:-0.01em; color:#fff; margin-bottom:36px;">${esc(brand.clientName || "")}</div>`;
  return darkShell(`
    <div style="height:100%; display:flex; flex-direction:column; justify-content:center;">
      ${logo}
      <h2 style="margin:0; font-weight:900; font-size:42px; line-height:1.08; letter-spacing:-0.02em;">
        Run the interview from one sheet.
      </h2>
      <p style="font-size:16px; line-height:1.6; color:rgba(255,255,255,0.75); max-width:520px; margin:20px 0 0;">
        Everything for ${esc(ctx.candidate || "this candidate")} — values, competencies, STAR, debrief — in one place.
      </p>
      <div style="margin-top:36px; display:inline-block; align-self:flex-start; background:${accent}; color:#fff;
          font-weight:700; font-size:15px; padding:15px 28px; border-radius:6px;">
        Book a Discovery Call&nbsp;&nbsp;→
      </div>
      <div style="position:absolute; left:64px; right:64px; bottom:40px; border-top:1px solid rgba(255,255,255,0.15);
          padding-top:14px; font-size:11px; color:rgba(255,255,255,0.5);">
        ${esc(brand.contact || "Powered by Ready Aim Climb · readyaimclimb.com")}
      </div>
    </div>`, brand);
}

module.exports = {
  coverPage, howToPage, blockPage, dividerPage, debriefPage, ctaPage, GUARDRAIL,
};
