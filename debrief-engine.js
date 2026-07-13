// ════════════════════════════════════════════════════════════════════════
//  TRUESEAT — Candidate Debrief PDF engine
//  Renders the locked design standard (DEBRIEF_STANDARD.md) from live data.
//  Input:  report (app's synthesis object) + ctx (candidate/role/panel) + brand
//  Output: self-contained HTML string -> Playwright -> PDF
//
//  Design contract (from the standard):
//   - 816×1056 px pages (US Letter @96dpi), @page margin:0, one section/page
//   - Dark archetype (cover, closing): cover-grad bg, white text, knockout logo
//   - Light archetype (interiors): cream bg, ink text, pinned footer @ bottom:30px
//   - Status colors (good/mixed/danger) are FUNCTIONAL, kept distinct from accent
//   - Overflow: when rows exceed a page, paginate with "(cont.)", never shrink type
// ════════════════════════════════════════════════════════════════════════

const esc = (s) => String(s == null ? "" : s)
  .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// Resolved design-system tokens (flattened from the RAC token sheets, so the
// output is self-contained — no external CSS at render time).
const DS_TOKENS = `
  --font-sans:'Helvetica Neue',Helvetica,Arial,'Segoe UI',sans-serif;
  --rac-cream:#FAF8F4; --rac-off-white:#F5F3EF; --rac-white:#FFFFFF;
  --text-strong:#0F1A27; --text-body:#16222F; --text-muted:#555555; --text-faint:#7A7A7A;
  --border-subtle:#E7E3DC; --border-default:#D8D3CA; --border-strong:#1B2A3B;
  --shadow-card:0 2px 8px rgba(15,26,39,0.08);
`;

// ── status semantics: app signal/verdict values → standard's color tokens ──
const SIGNAL_TOKEN = {
  strong: "good", mixed: "mixed", concern: "danger", insufficient: "muted",
};
const SIGNAL_LABEL = {
  strong: "Strong signal", mixed: "Mixed", concern: "Concern", insufficient: "Insufficient",
};
const VALUE_VERDICT_TOKEN = {
  aligned: "good", watch: "mixed", veto: "danger",
};
const VALUE_VERDICT_LABEL = {
  aligned: "Aligned", watch: "Watch", veto: "Veto",
};
const RATING_TOKEN = (n) => (n >= 3 ? "good" : n === 2 ? "mixed" : "danger");

const VERDICT_TITLE = {
  veto: "Do Not Advance",
  watch: "Advance With Reservations",
  aligned: "Advance",
  probe: "Advance to Probe Further",
};

const TOKEN_HEX = { good: "#2F7D54", mixed: "#BE8A2E", danger: "#B0201A", muted: "#7A7A7A" };
// translucent backgrounds for status pills
const TOKEN_BG = {
  good: "rgba(47,125,84,0.12)", mixed: "rgba(190,138,46,0.14)",
  danger: "rgba(176,32,26,0.12)", muted: "rgba(122,122,122,0.12)",
};

// ── shared page chrome ──
function footer(brand, pageNo, total) {
  return `<div style="position:absolute; left:64px; right:64px; bottom:30px; display:flex; justify-content:space-between; align-items:center; border-top:1px solid var(--border-subtle); padding-top:12px; font-size:10px; font-weight:600; letter-spacing:0.1em; text-transform:uppercase; color:var(--text-faint);"><span>${esc(brand.clientName)} · Candidate Debrief</span><span>${String(pageNo).padStart(2, "0")}</span></div>`;
}

// title block reused atop every light page (eyebrow → h2 → accent rule → intro)
function titleBlock(eyebrow, title, opts = {}) {
  const cont = opts.cont ? ` <span style="color:var(--text-faint); font-weight:700;">(cont.)</span>` : "";
  const intro = opts.intro
    ? `<p style="margin:0; font-size:15px; line-height:1.6; color:var(--text-body); max-width:680px;">${opts.intro}</p>`
    : "";
  const h2size = opts.h2size || 38;
  return `
    <span style="font-size:12px; font-weight:700; letter-spacing:0.12em; text-transform:uppercase; color:var(--cd-accent);">${esc(eyebrow)}</span>
    <h2 style="margin:14px 0 0; font-weight:900; font-size:${h2size}px; line-height:1.02; letter-spacing:-0.02em; color:var(--text-strong);">${esc(title)}${cont}</h2>
    <div style="width:56px; height:4px; background:var(--cd-accent); margin:20px 0 ${intro ? 22 : 24}px;"></div>
    ${intro}`;
}

function lightPage(inner, brand, pageNo) {
  return `<section class="page" style="width:816px; height:1056px; position:relative; overflow:hidden; box-sizing:border-box; background:var(--rac-cream); color:var(--text-strong);">
    <div style="position:absolute; inset:0; padding:60px 64px;">${inner}</div>
    ${footer(brand, pageNo)}
  </section>`;
}

module.exports = {
  esc, DS_TOKENS, SIGNAL_TOKEN, SIGNAL_LABEL, VALUE_VERDICT_TOKEN, VALUE_VERDICT_LABEL,
  RATING_TOKEN, VERDICT_TITLE, TOKEN_HEX, TOKEN_BG, footer, titleBlock, lightPage,
};
