// ════════════════════════════════════════════════════════════════════════
//  TRUESEAT — Role Definition PDF engine (PAGINATED)
//  Renders the full role Definition (the on-screen RolesHub Definition view)
//  to a branded PDF at the locked 30/60/90 / debrief design standard:
//  debrief cover treatment (rings, glow, 74px logo, meta row), a navy purpose
//  hero, bordered accent-bar cards, and the same manual paginator the roadmap
//  engine uses — each section's blocks are measured and packed onto pages; when
//  the next block would overflow, the section continues on a fresh page with the
//  title repeated "(cont.)". No overflow, ever; type never shrinks.
//
//  Input contract (the role's Definition object, mirroring RolesHub.jsx):
//    {
//      rolePurpose,                                   // string
//      primaryGoal:    { statement, metric, target, timeframe },
//      obsessionsFull: [ { name, behaviors:[..] }, .. ],
//      winTheWeekKpis: [ { metric, definition, target }, .. ],
//      whatGreatLooksLike: [ "..", .. ],
//      playbooks:      [ { name, mode, notes }, .. ],   // mode: "own" | "execute"
//      reportsTo,                                      // string
//      crossFunctional: [ "..", .. ],
//    }
//  Any empty section is skipped gracefully (the paginator .filter(Boolean)s them).
// ════════════════════════════════════════════════════════════════════════
const E = require("./debrief-engine.js");
const { esc, DS_TOKENS, titleBlock } = E;

// ── geometry budget (px), mirroring roadmap-engine.js / pages.js ──
const PAGE_H = 1056, CONTENT_TOP = 56, FOOTER_RESERVE = 80;
const USABLE = (PAGE_H - FOOTER_RESERVE) - CONTENT_TOP;
const TITLE_H = 128;          // title block with intro
const TITLE_CONT_H = 104;     // continued pages: title, no intro
const BLOCK_GAP = 12;

function estLines(text, perLine) { return Math.max(1, Math.ceil(String(text || "").length / perLine)); }

const NAVY = "var(--cd-navy)", ACCENT = "var(--cd-accent)";

// ── page chrome (local, so the footer reads "Role Definition" — same move the
//    roadmap engine makes with rmFooter/rmLightPage) ──
function defFooter(brand, pageNo) {
  return `<div style="position:absolute; left:64px; right:64px; bottom:30px; display:flex; justify-content:space-between; align-items:center; border-top:1px solid var(--border-subtle); padding-top:12px; font-size:10px; font-weight:600; letter-spacing:0.1em; text-transform:uppercase; color:var(--text-faint);"><span>${esc(brand.clientName)} · Role Definition</span><span>${String(pageNo).padStart(2, "0")}</span></div>`;
}
function defLightPage(inner, brand, pageNo) {
  return `<section class="page" style="width:816px; height:1056px; position:relative; overflow:hidden; box-sizing:border-box; background:var(--rac-cream); color:var(--text-strong);">
    <div style="position:absolute; inset:0; padding:60px 64px;">${inner}</div>
    ${defFooter(brand, pageNo)}
  </section>`;
}

// ── COVER (debrief treatment — mirrors roadmap-engine.coverPage) ──
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
          <div style="border-left:1px solid rgba(255,255,255,0.22); padding-left:18px; font-weight:700; font-size:9px; letter-spacing:0.24em; text-transform:uppercase; color:var(--cd-accent); line-height:1.7;">Role<br>Definition</div>
        </div>
        <span style="font-size:11px; font-weight:700; letter-spacing:0.2em; text-transform:uppercase; color:rgba(255,255,255,0.5);">The Seat, Defined</span>
      </div>
      <div style="flex:1;"></div>
      <span style="font-size:12px; font-weight:700; letter-spacing:0.18em; text-transform:uppercase; color:var(--cd-accent);">Role Definition</span>
      <h1 style="margin:16px 0 0; font-weight:900; font-size:64px; line-height:0.98; letter-spacing:-0.03em;">${esc(ctx.role || "The Role")}</h1>
      <div style="width:72px; height:4px; background:var(--cd-accent); margin:26px 0 22px;"></div>
      <p style="margin:0; max-width:560px; font-size:18px; line-height:1.5; color:rgba(255,255,255,0.82);">What this seat is for, what great looks like, and how it wins — defined to the <b style="color:#fff; font-weight:700;">Trueseat</b> standard so the role is clear before anyone fills it.</p>
      <div style="flex:1;"></div>
      <div style="display:flex; border-top:1px solid rgba(255,255,255,0.16); padding-top:22px;">
        ${meta("Role", ctx.role || "The Role", 1.2, "0 24px 0 0")}
        <div style="width:1px; background:rgba(255,255,255,0.16);"></div>
        ${meta("Company", brand.clientName, 1.2, "0 24px")}
        <div style="width:1px; background:rgba(255,255,255,0.16);"></div>
        ${meta("Date", brand.date, 1, "0 0 0 24px")}
      </div>
      <div style="margin-top:26px; font-size:11px; letter-spacing:0.04em; color:rgba(255,255,255,0.5);">Powered by Trueseat</div>
    </div>
  </section>`;
}

// ════════════════════════════════════════════════════════════════════════
//  BLOCK BUILDERS — each returns { html, height }. The paginator packs these.
// ════════════════════════════════════════════════════════════════════════

// Navy purpose hero: rolePurpose + the 12-month primary goal w/ target/timeframe.
function purposeHero(rolePurpose, goal) {
  goal = goal || {};
  const hasGoal = goal.statement || goal.line || goal.metric || goal.target || goal.timeframe;
  if (!rolePurpose && !hasGoal) return null;

  // Screen contract (RolesHub.jsx): the hero shows the goal STATEMENT, then a
  // single muted line "Target: {target} · {timeframe}". There is NO metric pill
  // on screen — the PDF must mirror the screen, so we don't invent one.
  const goalLine = (goal.statement && goal.statement.trim()) || goal.line || "";
  const goalMeta = [goal.target && `Target: ${goal.target}`, goal.timeframe && goal.timeframe].filter(Boolean).join(" · ");
  const showGoal = !!(goalLine || goalMeta);

  const purposeLines = estLines(rolePurpose, 64);
  const goalStmtLines = estLines(goalLine, 62);
  // header(~38) + purpose(@26/line) + [divider+goal label(~50) + stmt(@24/line) + meta(~24)]
  let height = 38 + purposeLines * 26 + 24;
  if (showGoal) height += 50 + goalStmtLines * 24 + (goalMeta ? 24 : 0);

  const goalBlock = showGoal ? `
      <div style="margin-top:20px; padding-top:18px; border-top:1px solid rgba(255,255,255,0.16);">
        <div style="font-size:10px; font-weight:700; letter-spacing:0.12em; text-transform:uppercase; color:rgba(255,255,255,0.55); margin-bottom:8px;">12-Month Goal</div>
        <div style="font-size:16px; font-weight:700; line-height:1.45; color:#fff;">${esc(goalLine || "Not defined yet.")}</div>
        ${goalMeta ? `<div style="font-size:13px; color:rgba(255,255,255,0.66); margin-top:6px;">${esc(goalMeta)}</div>` : ""}
      </div>` : "";

  const html = `
    <div style="background:var(--rac-navy); color:#fff; padding:26px 30px; border-left:4px solid ${ACCENT};">
      <div style="font-size:11px; font-weight:700; letter-spacing:0.12em; text-transform:uppercase; color:${ACCENT}; margin-bottom:12px;">Why This Seat Exists</div>
      ${rolePurpose ? `<p style="margin:0; font-size:18px; font-weight:700; line-height:1.45; color:#fff;">${esc(rolePurpose)}</p>` : ""}
      ${goalBlock}
    </div>`;
  return { html, height };
}

// A full-width white accent-bar card with arbitrary inner body + measured height.
function fullCard(heading, bodyHTML, contentHeight, accent = ACCENT) {
  if (!bodyHTML) return null;
  const height = 40 + 12 + contentHeight + 28;
  const html = `
    <div style="background:#fff; border:1px solid var(--border-subtle); border-left:4px solid ${accent}; box-shadow:var(--shadow-card); padding:18px 22px;">
      <div style="font-size:10.5px; font-weight:700; letter-spacing:0.1em; text-transform:uppercase; color:${accent}; margin-bottom:10px;">${heading}</div>
      ${bodyHTML}
    </div>`;
  return { html, height };
}

// The Obsessions — ONE section; each obsession is its own item-card so the
// section can split between cards ONLY if it's taller than a full page.
function obsessionsSection(obsessions) {
  const list = (obsessions || []).filter(o => o && (o.name || (o.behaviors || []).length));
  if (!list.length) return null;
  const items = list.map((o, idx) => {
    const behaviors = (o.behaviors || []).filter(Boolean);
    const bulletLines = behaviors.reduce((n, b) => n + estLines(b, 70), 0);
    const body = behaviors.length
      ? `<ul style="margin:0; padding-left:20px; font-size:13.5px; line-height:1.7; color:var(--text-body);">${behaviors.map(b => `<li style="margin-bottom:5px;">${esc(b)}</li>`).join("")}</ul>`
      : `<div style="font-size:13.5px; color:var(--text-faint);">—</div>`;
    const height = 28 + 10 + bulletLines * 23 + 28;
    const html = `
      <div style="background:#fff; border:1px solid var(--border-subtle); border-left:4px solid ${NAVY}; box-shadow:var(--shadow-card); padding:18px 22px;">
        <div style="font-size:10.5px; font-weight:700; letter-spacing:0.1em; text-transform:uppercase; color:${NAVY}; margin-bottom:10px;">Obsession ${idx + 1} · ${esc(o.name || "")}</div>
        ${body}
      </div>`;
    return { html, height };
  });
  return groupSection("The 3 Obsessions", items, NAVY);
}

// Win-the-Week scorecard: ONE section; each KPI its own item-card.
function winTheWeekSection(kpis) {
  const list = (kpis || []).filter(k => k && (k.metric || k.definition || k.target));
  if (!list.length) return null;
  const items = list.map((k) => {
    const targetPill = k.target ? `<span style="display:inline-block; background:rgba(47,125,84,0.12); border:1px solid rgba(47,125,84,0.28); border-radius:999px; padding:3px 11px; font-size:11.5px; font-weight:700; color:#2F7D54; margin-left:10px;">${esc(k.target)}</span>` : "";
    const html = `<div style="background:#fff; border:1px solid var(--border-subtle); border-left:4px solid ${ACCENT}; box-shadow:var(--shadow-card); padding:14px 18px;">
      <div style="display:flex; align-items:center; margin-bottom:${k.definition ? "6px" : "0"};"><span style="font-size:14.5px; font-weight:700; color:var(--text-strong);">${esc(k.metric || "")}</span>${targetPill}</div>
      ${k.definition ? `<div style="font-size:13px; line-height:1.55; color:var(--text-body);">${esc(k.definition)}</div>` : ""}
    </div>`;
    const height = 30 + estLines(k.definition, 66) * 22 + 28;
    return { html, height };
  });
  return groupSection("Win the Week — Scorecard", items, ACCENT);
}

// What Great Looks Like: ONE section; each statement its own item-card.
function whatGreatSection(items) {
  const list = (items || []).filter(Boolean);
  if (!list.length) return null;
  const built = list.map((txt) => {
    const html = `<div style="background:#fff; border:1px solid var(--border-subtle); border-left:4px solid ${NAVY}; box-shadow:var(--shadow-card); padding:14px 18px; display:flex; gap:12px; align-items:flex-start;">
      <span style="flex:0 0 auto; color:#2F7D54; font-weight:900; font-size:15px; line-height:1.5;">✓</span>
      <span style="font-size:13.5px; line-height:1.55; color:var(--text-body);">${esc(txt)}</span>
    </div>`;
    const height = estLines(txt, 64) * 22 + 28;
    return { html, height };
  });
  return groupSection("What Great Looks Like", built, NAVY);
}

// Playbooks: ONE section; each play its own item-card.
function playbooksSection(playbooks) {
  const list = (playbooks || []).filter(p => p && p.name);
  if (!list.length) return null;
  const built = list.map((p) => {
    const owned = String(p.mode || "").toLowerCase() === "own";
    const tag = owned
      ? `<span style="display:inline-block; background:rgba(47,125,84,0.12); border:1px solid rgba(47,125,84,0.28); border-radius:999px; padding:3px 11px; font-size:11px; font-weight:700; letter-spacing:0.04em; color:#2F7D54;">OWNED</span>`
      : `<span style="display:inline-block; background:rgba(79,121,194,0.12); border:1px solid rgba(79,121,194,0.30); border-radius:999px; padding:3px 11px; font-size:11px; font-weight:700; letter-spacing:0.04em; color:#3A5F9E;">EXECUTED</span>`;
    const caption = owned ? `<div style="font-size:12px; line-height:1.5; color:var(--text-muted); margin-top:7px;">Owns the improve loop — observe → audit → improve → update → train.</div>` : "";
    const notes = p.notes ? `<div style="font-size:12.5px; line-height:1.55; color:var(--text-body); margin-top:6px;">${esc(p.notes)}</div>` : "";
    const html = `<div style="background:#fff; border:1px solid var(--border-subtle); border-left:4px solid ${ACCENT}; box-shadow:var(--shadow-card); padding:14px 18px;">
      <div style="display:flex; align-items:center; justify-content:space-between; gap:12px;"><span style="font-size:14.5px; font-weight:700; color:var(--text-strong);">${esc(p.name)}</span>${tag}</div>
      ${caption}${notes}
    </div>`;
    const height = 30 + (owned ? 24 : 0) + (p.notes ? estLines(p.notes, 64) * 20 + 6 : 0) + 28;
    return { html, height };
  });
  return groupSection("Playbooks &amp; Processes", built, ACCENT);
}

// Scope & Structure: reports-to + cross-functional partners (single self-contained card).
function scopeBlock(reportsTo, crossFunctional) {
  const cross = (crossFunctional || []).filter(Boolean);
  if (!reportsTo && !cross.length) return null;
  const reportsHTML = reportsTo
    ? `<div style="margin-bottom:${cross.length ? "12px" : "0"};"><span style="font-size:11px; font-weight:700; letter-spacing:0.06em; text-transform:uppercase; color:var(--text-muted);">Reports to</span><div style="font-size:14px; font-weight:700; color:var(--text-strong); margin-top:3px;">${esc(reportsTo)}</div></div>`
    : "";
  const crossHTML = cross.length
    ? `<div><span style="font-size:11px; font-weight:700; letter-spacing:0.06em; text-transform:uppercase; color:var(--text-muted);">Works closely with</span><div style="font-size:13.5px; line-height:1.7; color:var(--text-body); margin-top:3px;">${cross.map(c => esc(c)).join(" · ")}</div></div>`
    : "";
  const body = reportsHTML + crossHTML;
  const lines = (reportsTo ? 2 : 0) + cross.reduce((n, c) => n + estLines(c, 88), 0);
  return fullCard("Scope &amp; Structure", body, lines * 22 + 24, NAVY);
}

// Legacy "What this seat owns" — ONE section; each outcome its own item-card.
function legacyOwnsSection(items) {
  const list = (items || []).filter(Boolean);
  if (!list.length) return null;
  const built = list.map((txt) => {
    const html = `<div style="background:#fff; border:1px solid var(--border-subtle); border-left:4px solid ${NAVY}; box-shadow:var(--shadow-card); padding:14px 18px; display:flex; gap:12px; align-items:flex-start;">
      <span style="flex:0 0 auto; color:#2F7D54; font-weight:900; font-size:15px; line-height:1.5;">✓</span>
      <span style="font-size:13.5px; line-height:1.55; color:var(--text-body);">${esc(txt)}</span>
    </div>`;
    const height = estLines(txt, 64) * 22 + 28;
    return { html, height };
  });
  return groupSection("What This Seat Owns", built, NAVY);
}

// ════════════════════════════════════════════════════════════════════════
//  SECTION MODEL — the unit of pagination is a SECTION, never a single card.
//  A section = { label, items:[{html,height}], headerH, height }. The paginator
//  keeps a section WHOLE on one page; if it can't fit in the room left, the whole
//  section moves to the next page (two whole sections may share a page when they
//  both fit). A section only ever splits if it is physically taller than a full
//  page — and then it breaks BETWEEN items, carrying a "(cont.)" section header.
// ════════════════════════════════════════════════════════════════════════
const SECTION_HEADER_H = 30;   // the small uppercase section label + its gap
const ITEM_GAP = 10;           // vertical gap between cards within a section

// Wrap a built {html,height} block as a single-item section with no inner header
// (used for the navy purpose hero and scope — they're self-contained cards).
function soloSection(block) {
  if (!block) return null;
  return { label: null, items: [block], headerH: 0, height: block.height };
}

// A multi-item section: an uppercase label + N item-cards. Height = header + items.
function groupSection(label, items, accent) {
  const list = (items || []).filter(Boolean);
  if (!list.length) return null;
  const itemsH = list.reduce((n, it, idx) => n + it.height + (idx > 0 ? ITEM_GAP : 0), 0);
  return { label, labelAccent: accent || ACCENT, items: list, headerH: SECTION_HEADER_H, height: SECTION_HEADER_H + itemsH };
}

// Render a section (or a continued slice of one) to HTML.
function renderSection(sec, sliceItems, cont) {
  const labelHTML = sec.label
    ? `<div style="font-size:10.5px; font-weight:700; letter-spacing:0.1em; text-transform:uppercase; color:${sec.labelAccent}; margin-bottom:12px;">${sec.label}${cont ? ' <span style="color:var(--text-faint);">(cont.)</span>' : ""}</div>`
    : "";
  const itemsHTML = sliceItems.map((it, idx) =>
    (idx > 0 ? `<div style="height:${ITEM_GAP}px"></div>` : "") + it.html
  ).join("");
  return `<div>${labelHTML}${itemsHTML}</div>`;
}

// build the ordered list of SECTIONS for the definition
function definitionSections(def) {
  const v = def || {};
  return [
    soloSection(purposeHero(v.rolePurpose, v.primaryGoal)),
    obsessionsSection(v.obsessionsFull),
    winTheWeekSection(v.winTheWeekKpis),
    whatGreatSection(v.whatGreatLooksLike),
    playbooksSection(v.playbooks),
    soloSection(scopeBlock(v.reportsTo, v.crossFunctional)),
    legacyOwnsSection(v.legacyOwns),
  ].filter(Boolean);
}

// ════════════════════════════════════════════════════════════════════════
//  PAGINATOR — packs whole SECTIONS onto pages. A section stays intact unless it
//  is taller than a full page, in which case it splits between items with a
//  "(cont.)" header. Multiple whole sections share a page when they both fit.
// ════════════════════════════════════════════════════════════════════════
function paginate(def, ctx, brand, startPage) {
  const sections = definitionSections(def);
  const pages = [];
  let pageIdx = 0;

  // Defensive: nothing captured → one honest page.
  if (!sections.length) {
    const title = titleBlock("The Seat, Defined", "The Role, Defined", {
      cont: false, intro: esc("This role's definition is still being built."), h2size: 40,
    });
    pages.push(defLightPage(title, brand, startPage));
    return { html: pages.join("\n"), pageCount: 1 };
  }

  const intro = `The full definition of the ${esc(ctx.role || "role")} — its purpose, the behaviors that matter, how it's scored week to week, and what great looks like.`;

  // Open a fresh page; returns its running budget + collected body.
  function newPageState() {
    const cont = pageIdx > 0;
    const titleH = cont ? TITLE_CONT_H : TITLE_H;
    return { cont, budget: USABLE - titleH, body: "", placed: 0 };
  }
  function flush(st) {
    const title = titleBlock("The Seat, Defined", "The Role, Defined", {
      cont: st.cont, intro: st.cont ? undefined : intro, h2size: 40,
    });
    pages.push(defLightPage(title + st.body, brand, startPage + pageIdx));
    pageIdx++;
  }

  let st = newPageState();

  for (const sec of sections) {
    const need = sec.height + (st.placed > 0 ? BLOCK_GAP : 0);

    // Case A — the whole section fits in the room left on this page: place it.
    if (need <= st.budget) {
      st.body += (st.placed > 0 ? `<div style="height:${BLOCK_GAP}px"></div>` : "") + renderSection(sec, sec.items, false);
      st.budget -= need;
      st.placed++;
      continue;
    }

    // Case B — it doesn't fit here. Does it fit on a FRESH page as a whole? If so,
    // move the entire section to a new page (this is the core "no split" rule).
    const freshBudget = USABLE - TITLE_CONT_H;
    if (sec.height <= freshBudget) {
      if (st.placed > 0) { flush(st); st = newPageState(); }
      st.body += renderSection(sec, sec.items, false);
      st.budget -= sec.height;
      st.placed++;
      continue;
    }

    // Case C — the section is taller than a full page: it MUST split. Break only
    // between items, carrying the section header with "(cont.)" on each page.
    if (st.placed > 0) { flush(st); st = newPageState(); }
    let idx = 0, first = true;
    while (idx < sec.items.length) {
      let pageBudget = USABLE - (st.cont ? TITLE_CONT_H : TITLE_H) - sec.headerH;
      const slice = [];
      while (idx < sec.items.length) {
        const itH = sec.items[idx].height + (slice.length > 0 ? ITEM_GAP : 0);
        if (slice.length > 0 && itH > pageBudget) break; // at least one item per page
        slice.push(sec.items[idx]);
        pageBudget -= itH;
        idx++;
      }
      st.body += renderSection(sec, slice, !first);
      st.placed++;
      first = false;
      if (idx < sec.items.length) { flush(st); st = newPageState(); }
    }
  }

  if (st.placed > 0 || pages.length === 0) flush(st);
  return { html: pages.join("\n"), pageCount: pageIdx };
}

function buildDefinitionHTML({ definition, ctx, brand, logoDark }) {
  let pageNo = 1;
  const out = [coverPage(brand, ctx, logoDark)];
  pageNo++;
  const res = paginate(definition || {}, ctx || {}, brand, pageNo);
  out.push(res.html);

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

module.exports = { buildDefinitionHTML };
