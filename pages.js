// ════════════════════════════════════════════════════════════════════════
//  Page builders — each returns one or more <section> pages from data.
//  The criteria & values pages PAGINATE: they pack rows until the page is full,
//  then start a fresh page repeating the title with "(cont.)".
// ════════════════════════════════════════════════════════════════════════
const E = require("./debrief-engine.js");
const { esc, TOKEN_HEX, TOKEN_BG, titleBlock, lightPage, footer,
        SIGNAL_TOKEN, SIGNAL_LABEL, VALUE_VERDICT_TOKEN, VALUE_VERDICT_LABEL,
        RATING_TOKEN, VERDICT_TITLE } = E;

// ── geometry budget (px). Page is 1056 tall; usable content height between the
//    title block and the pinned footer. These are conservative so we never
//    collide with the footer at bottom:30px. ──
const PAGE_H = 1056;
const CONTENT_TOP = 60;          // padding-top
const FOOTER_RESERVE = 92;       // footer band + breathing gap above it
const USABLE_BOTTOM = PAGE_H - FOOTER_RESERVE;

// rough measured heights (px) for row types — calibrated against the standard.
// evidence text wraps ~78 chars/line at 13.5px in the ~688px content column.
function estLines(text, perLine = 78) { return Math.max(1, Math.ceil(String(text || "").length / perLine)); }

// ── PAGE 1 · COVER (dark) ──
function coverPage(report, ctx, brand, logoDark) {
  return `<section class="page" style="width:816px; height:1056px; position:relative; overflow:hidden; box-sizing:border-box; background:var(--cover-grad); color:#fff;">
    <div style="position:absolute; top:-150px; right:-180px; width:540px; height:540px; border-radius:50%; background:radial-gradient(circle, transparent 0%, transparent 38%, rgba(255,255,255,0.045) 38.4%, transparent 39%, transparent 50%, rgba(255,255,255,0.045) 50.4%, transparent 51%, transparent 62%, rgba(255,255,255,0.045) 62.4%, transparent 63%, transparent 74%, rgba(255,255,255,0.045) 74.4%, transparent 75%); z-index:0;"></div>
    <div style="position:absolute; left:0; right:0; bottom:0; height:320px; background:linear-gradient(180deg, transparent 0%, rgba(234,107,71,0.12) 100%); z-index:0;"></div>
    <div style="position:absolute; inset:0; padding:64px; display:flex; flex-direction:column; z-index:1;">
      <div style="display:flex; align-items:center; justify-content:space-between;">
        <div style="display:flex; align-items:center; gap:18px;">
          ${logoDark
            ? `<img src="${logoDark}" alt="${esc(brand.clientName)}" style="height:74px; width:auto;">`
            : `<div style="font-weight:900; font-size:34px; letter-spacing:-0.01em; color:#fff;">${esc(brand.clientName)}</div>`}
          <div style="border-left:1px solid rgba(255,255,255,0.22); padding-left:18px; font-weight:700; font-size:9px; letter-spacing:0.24em; text-transform:uppercase; color:var(--cd-accent); line-height:1.7;">Structured<br>Hiring</div>
        </div>
        <span style="font-size:11px; font-weight:700; letter-spacing:0.2em; text-transform:uppercase; color:rgba(255,255,255,0.5);">Confidential</span>
      </div>
      <div style="flex:1;"></div>
      <span style="font-size:12px; font-weight:700; letter-spacing:0.18em; text-transform:uppercase; color:var(--cd-accent);">Candidate Debrief</span>
      <h1 style="margin:16px 0 0; font-weight:900; font-size:88px; line-height:0.92; letter-spacing:-0.03em;">${esc(ctx.candidate)}</h1>
      <div style="width:72px; height:4px; background:var(--cd-accent); margin:26px 0 22px;"></div>
      <p style="margin:0; max-width:560px; font-size:18px; line-height:1.5; color:rgba(255,255,255,0.82);">Panel synthesis of ${esc(numWord(ctx.interviewers.length))} independent interviewer scorecards, resolved into one recommendation for the ${esc(ctx.role)} role.</p>
      <div style="flex:1;"></div>
      <div style="display:flex; border-top:1px solid rgba(255,255,255,0.16); padding-top:22px;">
        ${coverMeta("Role", ctx.role, 1.1, "0 24px 0 0")}
        <div style="width:1px; background:rgba(255,255,255,0.16);"></div>
        ${coverMeta("Panel", ctx.interviewers.join(" · "), 1.6, "0 24px")}
        <div style="width:1px; background:rgba(255,255,255,0.16);"></div>
        ${coverMeta("Date", brand.date, 1, "0 0 0 24px")}
      </div>
      <div style="margin-top:26px; font-size:11px; letter-spacing:0.04em; color:rgba(255,255,255,0.5);">Powered by Ready Aim Climb · Hire2Scale</div>
    </div>
  </section>`;
}
function coverMeta(label, val, flex, pad) {
  return `<div style="flex:${flex}; padding:${pad};">
    <div style="font-size:10px; font-weight:700; letter-spacing:0.12em; text-transform:uppercase; color:rgba(255,255,255,0.45); margin-bottom:9px;">${esc(label)}</div>
    <div style="font-size:14.5px; line-height:1.5; color:rgba(255,255,255,0.92);">${esc(val)}</div>
  </div>`;
}
function numWord(n){ return ({1:"one",2:"two",3:"three",4:"four",5:"five",6:"six"})[n] || String(n); }

// ── PAGE 2 · PANEL VERDICT (light) ──
function verdictPage(report, ctx, brand, pageNo) {
  const title = VERDICT_TITLE[report.recommendation] || VERDICT_TITLE.probe;
  const vetoBadge = report.vetoTriggered
    ? `<div style="margin-top:14px; display:inline-flex; align-items:center; gap:9px; background:${TOKEN_HEX.danger}; color:#fff; padding:8px 15px; border-radius:2px;"><span style="font-size:14px; line-height:1;">&#9873;</span><span style="font-size:12px; font-weight:700; letter-spacing:0.08em; text-transform:uppercase;">Values veto triggered</span></div>`
    : "";
  // case-for / case-against: use report fields if present, else derive sensible defaults
  const caseFor = report.caseFor || deriveCaseFor(report);
  const caseAgainst = report.caseAgainst || deriveCaseAgainst(report);
  const inner = `
    <span style="font-size:12px; font-weight:700; letter-spacing:0.12em; text-transform:uppercase; color:var(--cd-accent);">Panel Verdict · ${esc(ctx.candidate)}</span>
    <h2 style="margin:14px 0 0; font-weight:900; font-size:46px; line-height:1.0; letter-spacing:-0.025em; color:var(--text-strong);">${esc(title)}</h2>
    ${vetoBadge}
    <div style="width:56px; height:4px; background:var(--cd-accent); margin:26px 0 24px;"></div>
    <p style="margin:0; font-size:17px; line-height:1.6; color:var(--text-body); max-width:680px;">${esc(report.recommendationRationale)}</p>
    <div style="margin-top:34px; background:var(--rac-navy); color:#fff; padding:30px 34px; border-left:4px solid ${report.vetoTriggered ? TOKEN_HEX.danger : "var(--cd-accent)"};">
      <div style="font-size:11px; font-weight:700; letter-spacing:0.12em; text-transform:uppercase; color:var(--cd-accent); margin-bottom:14px;">What the panel actually established</div>
      <p style="margin:0; font-size:17px; line-height:1.55; color:rgba(255,255,255,0.92);">${esc(report.candidateSummary)}</p>
    </div>
    <div style="margin-top:26px; display:grid; grid-template-columns:1fr 1fr; gap:18px;">
      <div style="background:#fff; border:1px solid var(--border-subtle); border-top:3px solid ${TOKEN_HEX.good}; padding:22px 24px; box-shadow:var(--shadow-card);">
        <div style="font-size:10.5px; font-weight:700; letter-spacing:0.1em; text-transform:uppercase; color:${TOKEN_HEX.good}; margin-bottom:10px;">The case for</div>
        <p style="margin:0; font-size:14px; line-height:1.55; color:var(--text-body);">${esc(caseFor)}</p>
      </div>
      <div style="background:#fff; border:1px solid var(--border-subtle); border-top:3px solid ${TOKEN_HEX.danger}; padding:22px 24px; box-shadow:var(--shadow-card);">
        <div style="font-size:10.5px; font-weight:700; letter-spacing:0.1em; text-transform:uppercase; color:${TOKEN_HEX.danger}; margin-bottom:10px;">The case against</div>
        <p style="margin:0; font-size:14px; line-height:1.55; color:var(--text-body);">${esc(caseAgainst)}</p>
      </div>
    </div>`;
  return lightPage(inner, brand, pageNo);
}
// derive a one-liner from the strongest positive / negative criteria if synthesis didn't supply
function deriveCaseFor(report) {
  const s = (report.criteria || []).find((c) => c.signal === "strong");
  return s ? s.evidence : "The panel found verifiable strengths in the candidate's track record.";
}
function deriveCaseAgainst(report) {
  const c = (report.criteria || []).find((x) => x.signal === "concern")
        || (report.valuesLane || []).find((v) => v.verdict === "veto");
  return c ? c.evidence : "The panel surfaced concerns that warrant resolution before advancing.";
}

// ── PAGE 3 · OUTCOMES & COMPETENCIES (light, PAGINATES) ──
function competencyRow(c) {
  const tok = SIGNAL_TOKEN[c.signal] || "muted";
  const who = (c.interviewers || []).join(", ");
  const whoLabel = (c.interviewers || []).length === 1 ? "Interviewer" : "Interviewers";
  return `<div style="background:#fff; border:1px solid var(--border-subtle); border-left:4px solid ${TOKEN_HEX[tok]}; box-shadow:var(--shadow-card); padding:20px 24px;">
    <div style="display:flex; align-items:flex-start; justify-content:space-between; gap:16px;">
      <div><div style="font-weight:900; font-size:18px; color:var(--text-strong); letter-spacing:-0.01em;">${esc(c.name)}</div><div style="margin-top:5px; font-size:11.5px; font-weight:600; letter-spacing:0.04em; color:var(--text-faint);">${whoLabel}: ${esc(who)}</div></div>
      <span style="flex:none; background:${TOKEN_BG[tok]}; color:${TOKEN_HEX[tok]}; font-size:10px; font-weight:700; letter-spacing:0.08em; text-transform:uppercase; padding:6px 11px; border-radius:2px;">${SIGNAL_LABEL[c.signal] || "—"}</span>
    </div>
    <p style="margin:12px 0 0; font-size:13.5px; line-height:1.55; color:var(--text-body);">${esc(c.evidence)}</p>
  </div>`;
}
function competencyRowHeight(c) {
  // header(~46) + padding(40) + evidence lines
  return 86 + estLines(c.evidence) * 21 + 14;
}
const LEGEND = `<div style="margin-top:24px; display:flex; align-items:center; gap:24px; font-size:11.5px; font-weight:600; letter-spacing:0.04em; color:var(--text-muted);">
  <span style="display:flex; align-items:center; gap:8px;"><span style="width:12px; height:12px; background:${TOKEN_HEX.good}; border-radius:2px;"></span>Strong signal</span>
  <span style="display:flex; align-items:center; gap:8px;"><span style="width:12px; height:12px; background:${TOKEN_HEX.mixed}; border-radius:2px;"></span>Mixed</span>
  <span style="display:flex; align-items:center; gap:8px;"><span style="width:12px; height:12px; background:${TOKEN_HEX.danger}; border-radius:2px;"></span>Concern</span>
</div>`;

function competencyPages(report, ctx, brand, startPage) {
  return paginateRows({
    rows: report.criteria || [],
    renderRow: competencyRow,
    rowHeight: competencyRowHeight,
    rowGap: 14,
    eyebrow: "Outcomes & Competencies",
    title: "Where the signal is, and isn't",
    titleHeight: 150,
    legend: LEGEND, legendHeight: 56,
    brand, startPage,
  });
}

// ── PAGE 4 · CORE VALUES LANE (light, PAGINATES) ──
function valueRow(v) {
  const tok = VALUE_VERDICT_TOKEN[v.verdict] || "muted";
  const chips = String(v.ratings || "").split(/[,\s]+/).filter(Boolean).map((r) => {
    const n = parseInt(r, 10);
    const ct = RATING_TOKEN(n);
    return `<span style="width:26px; height:26px; background:${TOKEN_HEX[ct]}; color:#fff; font-weight:900; font-size:14px; display:flex; align-items:center; justify-content:center; border-radius:2px;">${esc(r)}</span>`;
  }).join("");
  const badgeBg = tok === "good" ? TOKEN_BG.good : TOKEN_HEX[tok];
  const badgeColor = tok === "good" ? TOKEN_HEX.good : "#fff";
  return `<div style="background:#fff; border:1px solid var(--border-subtle); border-left:4px solid ${TOKEN_HEX[tok]}; box-shadow:var(--shadow-card); padding:22px 26px;">
    <div style="display:flex; align-items:flex-start; justify-content:space-between; gap:16px;">
      <div>
        <div style="font-weight:900; font-size:20px; color:var(--text-strong); letter-spacing:-0.01em;">${esc(v.name)}</div>
        <div style="margin-top:9px; display:flex; align-items:center; gap:8px;">
          <span style="font-size:10.5px; font-weight:700; letter-spacing:0.08em; text-transform:uppercase; color:var(--text-faint);">Ratings</span>${chips}
        </div>
      </div>
      <span style="flex:none; background:${badgeBg}; color:${badgeColor}; font-size:12px; font-weight:900; letter-spacing:0.1em; text-transform:uppercase; padding:8px 16px; border-radius:2px;">${VALUE_VERDICT_LABEL[v.verdict] || "—"}</span>
    </div>
    <p style="margin:14px 0 0; font-size:13.5px; line-height:1.55; color:var(--text-body);">${esc(v.evidence)}</p>
  </div>`;
}
function valueRowHeight(v) { return 96 + estLines(v.evidence) * 21 + 14; }
function piNoteBlock(report) {
  if (!report.piNote) return "";
  return `<div style="margin-top:22px; background:var(--rac-off-white); border:1px dashed var(--border-strong); padding:20px 24px;">
    <div style="font-size:10.5px; font-weight:700; letter-spacing:0.1em; text-transform:uppercase; color:var(--cd-accent); margin-bottom:10px;">PI Job Target note</div>
    <p style="margin:0; font-size:13.5px; line-height:1.56; color:var(--text-body);">${esc(report.piNote)}</p>
  </div>`;
}
function valuesPages(report, ctx, brand, startPage) {
  const intro = report.valuesSummary ? esc(report.valuesSummary) : "";
  const piHeight = report.piNote ? (60 + estLines(report.piNote) * 21) : 0;
  return paginateRows({
    rows: report.valuesLane || [],
    renderRow: valueRow,
    rowHeight: valueRowHeight,
    rowGap: 14,
    eyebrow: `Core Values Lane · ${brand.clientShort || brand.clientName} Non-Negotiables`,
    title: report.vetoTriggered ? "Veto-level evidence found" : "Values alignment",
    titleHeight: intro ? 200 : 150,
    intro,
    tail: piNoteBlock(report), tailHeight: piHeight,  // PI note rides the LAST page only
    brand, startPage,
  });
}

// ── PAGE 5 · PANEL SPLITS + HALO CHECK (light) ──
function splitsPage(report, ctx, brand, pageNo) {
  const d = (report.disagreements || [])[0];
  const splitBlock = d ? `
    <p style="margin:0; font-size:16px; font-weight:700; line-height:1.45; color:var(--text-strong); max-width:680px;">${esc(d.topic)}</p>
    <div style="margin-top:20px; display:grid; grid-template-columns:1fr 1fr; gap:16px;">
      ${(d.positions || []).slice(0, 2).map((p, i) => `
        <div style="background:#fff; border:1px solid var(--border-subtle); border-top:3px solid ${i === 0 ? TOKEN_HEX.mixed : TOKEN_HEX.danger}; box-shadow:var(--shadow-card); padding:20px 22px;">
          <div style="font-size:11px; font-weight:700; letter-spacing:0.08em; text-transform:uppercase; color:var(--text-faint); margin-bottom:9px;">${esc(p.interviewer)}</div>
          <p style="margin:0; font-size:13.5px; line-height:1.55; color:var(--text-body);">${esc(p.view)}</p>
        </div>`).join("")}
    </div>
    <div style="margin-top:16px; background:var(--rac-navy); color:#fff; padding:22px 28px; border-left:4px solid var(--cd-accent);">
      <div style="font-size:11px; font-weight:700; letter-spacing:0.12em; text-transform:uppercase; color:var(--cd-accent); margin-bottom:10px;">Why it matters</div>
      <p style="margin:0; font-size:15px; line-height:1.55; color:rgba(255,255,255,0.92);">${esc(d.whyItMatters)}</p>
    </div>` : `<p style="margin:0; font-size:15px; color:var(--text-muted);">The panel did not surface material disagreements.</p>`;

  const halo = (report.haloRisks || []);
  const haloBlock = halo.length ? `
    <div style="margin-top:34px; height:1px; background:var(--border-subtle);"></div>
    <span style="display:block; margin-top:30px; font-size:12px; font-weight:700; letter-spacing:0.12em; text-transform:uppercase; color:var(--cd-accent);">Halo check</span>
    <h2 style="margin:12px 0 0; font-weight:900; font-size:30px; line-height:1.05; letter-spacing:-0.02em; color:var(--text-strong);">Where liking them outruns the evidence</h2>
    <div style="margin-top:20px; display:grid; gap:13px;">
      ${halo.map((r) => `<div style="display:flex; gap:14px; align-items:flex-start; background:#fff; border:1px solid var(--border-subtle); box-shadow:var(--shadow-card); padding:18px 22px;"><span style="width:9px; height:9px; background:var(--cd-accent); flex:none; transform:translateY(6px);"></span><p style="margin:0; font-size:13.5px; line-height:1.55; color:var(--text-body);">${esc(r)}</p></div>`).join("")}
    </div>` : "";

  const inner = titleBlock("Where the panel splits", "Resolve out loud, with new evidence", { h2size: 34 }) + splitBlock + haloBlock;
  return lightPage(inner, brand, pageNo);
}

// ── PAGE 6 · STILL UNTESTED + CLOSING (dark) ──
function closingPage(report, ctx, brand, logoDark, pageNo) {
  const gaps = (report.unknowns || []).map((u) => `
    <div style="background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.14); border-left:3px solid var(--cd-accent); padding:24px 28px;">
      <div style="font-weight:900; font-size:18px; line-height:1.3; letter-spacing:-0.01em; color:#fff;">${esc(u.gap)}</div>
      <div style="margin-top:14px; font-size:10.5px; font-weight:700; letter-spacing:0.1em; text-transform:uppercase; color:var(--cd-accent); margin-bottom:7px;">Ask next</div>
      <p style="margin:0; font-size:14.5px; line-height:1.55; color:rgba(255,255,255,0.88); font-style:italic;">&ldquo;${esc(u.suggestedQuestion)}&rdquo;</p>
    </div>`).join("");
  return `<section class="page" style="width:816px; height:1056px; position:relative; overflow:hidden; box-sizing:border-box; background:var(--cover-grad); color:#fff;">
    <div style="position:absolute; top:-120px; left:-160px; width:500px; height:500px; border-radius:50%; background:radial-gradient(circle, transparent 0%, transparent 40%, rgba(255,255,255,0.04) 40.4%, transparent 41%, transparent 54%, rgba(255,255,255,0.04) 54.4%, transparent 55%, transparent 68%, rgba(255,255,255,0.04) 68.4%, transparent 69%); z-index:0;"></div>
    <div style="position:absolute; inset:0; padding:60px 64px; z-index:1; display:flex; flex-direction:column;">
      <div style="display:flex; align-items:flex-start; justify-content:space-between;">
        <div>
          <span style="font-size:12px; font-weight:700; letter-spacing:0.14em; text-transform:uppercase; color:var(--cd-accent);">Still untested</span>
          <h2 style="margin:12px 0 0; font-weight:900; font-size:44px; line-height:0.98; letter-spacing:-0.025em;">What nobody asked,<br>ask next</h2>
        </div>
        ${logoDark
          ? `<img src="${logoDark}" alt="${esc(brand.clientName)}" style="height:66px; width:auto; margin-top:6px;">`
          : `<div style="font-weight:900; font-size:30px; letter-spacing:-0.01em; color:#fff; margin-top:6px; text-align:right;">${esc(brand.clientName)}</div>`}
      </div>
      <div style="width:72px; height:4px; background:var(--cd-accent); margin:26px 0 30px;"></div>
      <div style="display:grid; gap:18px;">${gaps}</div>
      <div style="flex:1;"></div>
      <div style="background:var(--cd-accent); color:#fff; padding:24px 30px; display:flex; align-items:center; justify-content:space-between; gap:24px;">
        <p style="margin:0; font-weight:900; font-size:19px; line-height:1.3; letter-spacing:-0.01em;">A synthesis tool, not a decision-maker. The hiring team owns the call.</p>
      </div>
      <div style="display:flex; justify-content:space-between; align-items:center; border-top:1px solid rgba(255,255,255,0.16); padding-top:16px; margin-top:22px;">
        <span style="font-size:12px; line-height:1.5; color:rgba(255,255,255,0.7);">${esc(brand.clientName)} · Candidate Debrief · Generated ${esc(brand.date)}</span>
        <span style="font-size:11px; line-height:1.5; color:rgba(255,255,255,0.5);">Powered by Ready Aim Climb · Hire2Scale</span>
      </div>
    </div>
  </section>`;
}

// ════════════════════════════════════════════════════════════════════════
//  THE PAGINATOR — packs rows onto pages by measured height, splitting to a
//  new page (title repeated, "(cont.)") when the next row would overflow.
// ════════════════════════════════════════════════════════════════════════
function paginateRows(cfg) {
  const { rows, renderRow, rowHeight, rowGap, eyebrow, title, titleHeight,
          intro, legend, legendHeight = 0, tail, tailHeight = 0, brand, startPage } = cfg;
  const pages = [];
  let i = 0, pageIdx = 0;
  const usable = USABLE_BOTTOM - CONTENT_TOP;

  while (i < rows.length) {
    const cont = pageIdx > 0;
    let budget = usable - titleHeight;
    let body = "";
    let placed = 0;

    while (i < rows.length) {
      const h = rowHeight(rows[i]) + (placed > 0 ? rowGap : 0);
      // reserve room for tail (PI note) / legend only when this is the final batch
      const isLastRow = i === rows.length - 1;
      const reserve = isLastRow ? Math.max(legendHeight, tailHeight) : 0;
      if (placed > 0 && budget - h - reserve < 0) break;   // overflow -> new page
      body += (placed > 0 ? `<div style="height:${rowGap}px"></div>` : "") + renderRow(rows[i]);
      budget -= h;
      i++; placed++;
    }

    const isFinal = i >= rows.length;
    const titleHTML = titleBlock(eyebrow, title, {
      cont, intro: pageIdx === 0 ? intro : undefined,
    });
    const tailHTML = isFinal ? (tail || "") : "";
    const legendHTML = (isFinal && legend) ? legend : "";
    const inner = `${titleHTML}<div style="display:grid; gap:0;">${body}</div>${legendHTML}${tailHTML}`;
    pages.push(lightPage(inner, brand, startPage + pageIdx));
    pageIdx++;
  }
  return { html: pages.join("\n"), pageCount: pageIdx };
}

module.exports = {
  coverPage, verdictPage, competencyPages, valuesPages, splitsPage, closingPage,
};
