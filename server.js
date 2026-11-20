// ════════════════════════════════════════════════════════════════════════
//  Trueseat — Debrief PDF Rendering Service
//
//  A standalone rendering service that runs REAL Chrome (installed in the
//  Docker container) to turn debrief data into a branded PDF. Deployed on
//  Render. The Vercel app forwards portal requests here and streams the PDF
//  back, so this service stays invisible to the client.
//
//  Endpoints:
//    GET  /health        → { status: "ok" }   (Render health check)
//    POST /debrief-pdf   → application/pdf     (the real work)
//    POST /roadmap-pdf   → application/pdf
//    POST /definition-pdf → application/pdf
//    POST /site-colors   → { colors: ["#..", ...] }   (brand colors from a URL)
//
//  Why this exists: headless Chromium on Vercel's serverless runtime is
//  library-fragile (the libnss3 saga). Here, Chrome is installed the normal
//  Linux way via the Dockerfile, so it just works — permanently.
// ════════════════════════════════════════════════════════════════════════
const express = require("express");
const puppeteer = require("puppeteer");
const fs = require("fs");
const { buildDebriefHTML } = require("./assemble.js");
const { buildRoadmapHTML } = require("./roadmap-engine.js");
const { buildDefinitionHTML } = require("./definition-engine.js");
const { buildJobAdHTML } = require("./jobad-engine.js");
const { buildOneSheetHTML } = require("./assemble-onesheet.js");
const { buildPlaybookHTML } = require("./assemble-playbook.js");
const { buildCultureHTML } = require("./assemble-culture.js");
const { extractDominantColors } = require("./sampler.js");
const { checkPublicHttpUrl, defaultLookup } = require("./public-url.js");

const app = express();
app.use(express.json({ limit: "2mb" }));

// White-label safety: there is NO baked-in fallback logo. If a request does not
// supply brand.logoDark, we pass an empty value downstream and the page builders
// render the client's NAME as a styled wordmark instead. A missing logo must
// never cause one client's PDF to borrow another client's (or RAC's) logo.
// (The old CD_FALLBACK_LOGO_DARK was removed for exactly this reason.)

// ── shared secret. Set RENDER_SHARED_SECRET on Render; the Vercel forwarder
//    sends it as x-render-secret. Unset or empty fails closed: protected
//    routes refuse the request instead of serving it. ──
const SHARED_SECRET = process.env.RENDER_SHARED_SECRET || null;

// keep one browser warm across requests (faster; Render service stays up)
let browserPromise = null;
function getBrowser() {
  if (!browserPromise) {
    browserPromise = puppeteer.launch({
      headless: "new",
      args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
    });
  }
  return browserPromise;
}

// True when the response has already been ended.
function denyUnauthed(req, res) {
  if (!SHARED_SECRET) {
    res.status(503).json({ error: "unauthorized" });
    return true;
  }
  if (req.get("x-render-secret") !== SHARED_SECRET) {
    res.status(401).json({ error: "unauthorized" });
    return true;
  }
  return false;
}

app.get("/health", (req, res) => res.json({ status: "ok" }));

app.post("/debrief-pdf", async (req, res) => {
  // auth check (if a secret is configured)
  if (denyUnauthed(req, res)) return;
  try {
    const { report, ctx, brand } = req.body || {};
    if (!report || !ctx || !brand) {
      return res.status(400).json({ error: "report, ctx, and brand are required" });
    }
    const logoDark = brand.logoDark || "";
    const safeBrand = {
      clientName: brand.clientName || ctx.company || "Client",
      clientShort: brand.clientShort || undefined,
      navy: brand.navy || "#171758",
      navyDark: brand.navyDark || "#0A0A34",
      accent: brand.accent || "#EA6B47",
      blue: brand.blue || "#4F79C2",
      date: brand.date || new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }),
    };
    const html = buildDebriefHTML({ report, ctx, brand: safeBrand, logoDark });
    const browser = await getBrowser();
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });
    const pdf = await page.pdf({ width: "8.5in", height: "11in", printBackground: true });
    await page.close();

    // page.pdf() returns a Uint8Array in modern Puppeteer. Express's res.send()
    // only treats a true Node Buffer as binary — a bare Uint8Array falls through
    // to its object path and gets JSON-serialized ({"0":37,"1":80,...}), which
    // is a corrupt "PDF" no viewer can open. Wrap it so it streams as real bytes.
    const pdfBuffer = Buffer.isBuffer(pdf) ? pdf : Buffer.from(pdf);

    const fname = `${(ctx.candidate || "candidate").replace(/[^a-z0-9]+/gi, "_")}_Debrief.pdf`;
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${fname}"`);
    res.setHeader("Content-Length", pdfBuffer.length);
    res.status(200).end(pdfBuffer);
  } catch (err) {
    console.error("debrief-pdf error:", err);
    res.status(500).json({ error: "PDF generation failed", detail: String(err && err.message || err) });
  }
});

// ── /onesheet-pdf ──────────────────────────────────────────────────────────
//  The One Sheet interview guide. Same shape as /debrief-pdf: takes the refined
//  prep_blocks (from the app's /api/onesheet-draft), builds the HTML via the
//  One Sheet assembler (which reuses debrief-engine.js for one shared styling
//  system), renders with the same warm Chrome, streams the PDF back.
app.post("/onesheet-pdf", async (req, res) => {
  if (denyUnauthed(req, res)) return;
  try {
    const { prep_blocks, ctx, brand } = req.body || {};
    if (!prep_blocks || !ctx || !brand) {
      return res.status(400).json({ error: "prep_blocks, ctx, and brand are required" });
    }
    const logoDark = brand.logoDark || "";
    const safeBrand = {
      clientName: brand.clientName || ctx.company || "Client",
      navy: brand.navy || "#171758",
      navyDark: brand.navyDark || "#0A0A34",
      accent: brand.accent || "#EA6B47",
      contact: brand.contact || "Powered by Trueseat",
    };
    const html = buildOneSheetHTML({ prep_blocks, ctx, brand: safeBrand, logoDark });
    const browser = await getBrowser();
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });
    const pdf = await page.pdf({ width: "8.5in", height: "11in", printBackground: true });
    await page.close();
    const pdfBuffer = Buffer.isBuffer(pdf) ? pdf : Buffer.from(pdf);
    const who = (ctx.candidate || "candidate").replace(/[^a-z0-9]+/gi, "_");
    const fname = `${who}_OneSheet.pdf`;
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${fname}"`);
    res.setHeader("Content-Length", pdfBuffer.length);
    res.status(200).end(pdfBuffer);
  } catch (err) {
    console.error("onesheet-pdf error:", err);
    res.status(500).json({ error: "PDF generation failed", detail: String(err && err.message || err) });
  }
});

// ── /culture-pdf ─────────────────────────────────────────────────────────
//  The app's forwarder (api/culture-pdf.js)
//  POSTs { code }; we look up the client's REAL stored values[] + culture from
//  clients.js (resolveClient → Redis, getClient fallback) and render the Culture
//  Codified deck. Same warm Chrome, same 8.5×11, streamed back as a download.
//  The renderer NEVER calls a model — it renders what the tenant already stored.
app.post("/culture-pdf", async (req, res) => {
  if (denyUnauthed(req, res)) return;
  try {
    const { code } = req.body || {};
    if (!code) return res.status(400).json({ error: "code is required" });
    const clientsMod = await import("./clients.js");
    const client = await clientsMod.resolveClient(code);
    if (!client) return res.status(404).json({ error: "client not found" });

    const values = Array.isArray(client.values) ? client.values : [];
    const culture = client.culture || {};
    if (values.length === 0 && !culture.purpose) {
      return res.status(422).json({ error: "no_content", detail: "Add core values or a purpose before generating the Culture Codified." });
    }

    const b = client.branding || {};
    const brand = {
      code,
      clientName: client.company || b.clientName || "Client",
      navy: b.brandNavy || b.navy || "#171758",
      blue: b.blue || b.accent || "#1F6FB2",
      logoDark: b.logoDark || "",
    };
    const html = buildCultureHTML({ ctx: { company: brand.clientName }, brand, values, culture });

    const browser = await getBrowser();
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });
    const pdf = await page.pdf({ width: "8.5in", height: "11in", printBackground: true });
    await page.close();
    const pdfBuffer = Buffer.isBuffer(pdf) ? pdf : Buffer.from(pdf);
    const slug = (brand.clientName || "company").replace(/[^a-z0-9]+/gi, "-").toLowerCase();
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${slug}-culture.pdf"`);
    res.setHeader("Content-Length", pdfBuffer.length);
    res.status(200).end(pdfBuffer);
  } catch (err) {
    console.error("culture-pdf error:", err);
    res.status(500).json({ error: "PDF generation failed", detail: String(err && err.message || err) });
  }
});

// ── /playbook-pdf ────────────────────────────────────────────────────────
//  Same { code } → resolveClient → render
//  contract as /culture-pdf. The Hiring Playbook is built from the tenant's core
//  values[] (buildPlaybookHTML derives the interview system + deck length from
//  values.length). Streamed back as a download.
app.post("/playbook-pdf", async (req, res) => {
  if (denyUnauthed(req, res)) return;
  try {
    const { code } = req.body || {};
    if (!code) return res.status(400).json({ error: "code is required" });
    const clientsMod = await import("./clients.js");
    const client = await clientsMod.resolveClient(code);
    if (!client) return res.status(404).json({ error: "client not found" });

    const values = Array.isArray(client.values) ? client.values : [];
    if (values.length === 0) {
      return res.status(422).json({ error: "no_content", detail: "Add core values before generating the Hiring Playbook." });
    }

    const b = client.branding || {};
    const brand = {
      code,
      clientName: client.company || b.clientName || "Client",
      navy: b.brandNavy || b.navy || "#171758",
      blue: b.blue || b.accent || "#1F6FB2",
      logoDark: b.logoDark || "",
    };
    const html = buildPlaybookHTML({ ctx: { company: brand.clientName }, brand, values });

    const browser = await getBrowser();
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });
    const pdf = await page.pdf({ width: "8.5in", height: "11in", printBackground: true });
    await page.close();
    const pdfBuffer = Buffer.isBuffer(pdf) ? pdf : Buffer.from(pdf);
    const slug = (brand.clientName || "company").replace(/[^a-z0-9]+/gi, "-").toLowerCase();
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${slug}-hiring-playbook.pdf"`);
    res.setHeader("Content-Length", pdfBuffer.length);
    res.status(200).end(pdfBuffer);
  } catch (err) {
    console.error("playbook-pdf error:", err);
    res.status(500).json({ error: "PDF generation failed", detail: String(err && err.message || err) });
  }
});

app.post("/roadmap-pdf", async (req, res) => {
  if (denyUnauthed(req, res)) return;
  try {
    const { roadmap, ctx, brand } = req.body || {};
    if (!roadmap || !ctx || !brand) {
      return res.status(400).json({ error: "roadmap, ctx, and brand are required" });
    }
    const logoDark = brand.logoDark || "";
    const safeBrand = {
      clientName: brand.clientName || ctx.company || "Client",
      navy: brand.navy || "#171758",
      navyDark: brand.navyDark || "#0A0A34",
      accent: brand.accent || "#EA6B47",
      blue: brand.blue || "#4F79C2",
      date: brand.date || new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }),
    };
    const html = buildRoadmapHTML({ roadmap, ctx, brand: safeBrand, logoDark });
    const browser = await getBrowser();
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });
    const pdf = await page.pdf({ width: "8.5in", height: "11in", printBackground: true });
    await page.close();
    const pdfBuffer = Buffer.isBuffer(pdf) ? pdf : Buffer.from(pdf);
    const fname = `${(ctx.role || "role").replace(/[^a-z0-9]+/gi, "_")}_Roadmap.pdf`;
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${fname}"`);
    res.setHeader("Content-Length", pdfBuffer.length);
    res.status(200).end(pdfBuffer);
  } catch (err) {
    console.error("roadmap-pdf error:", err);
    res.status(500).json({ error: "PDF generation failed", detail: String(err && err.message || err) });
  }
});

// ── /definition-pdf ────────────────────────────────────────────────────────
//  The branded Role Definition PDF. Same shape as the other endpoints: takes
//  the role's resolved Definition object (the app's forwarder resolves the
//  same fallbacks RolesHub.jsx uses — goalLine, great, legacyOwns — so the PDF
//  mirrors the on-screen Definition), builds the HTML via the definition engine
//  (which reuses debrief-engine.js for one shared styling system), renders with
//  the same warm Chrome, streams the PDF back.
app.post("/definition-pdf", async (req, res) => {
  if (denyUnauthed(req, res)) return;
  try {
    const { definition, ctx, brand } = req.body || {};
    if (!definition || !ctx || !brand) {
      return res.status(400).json({ error: "definition, ctx, and brand are required" });
    }
    const logoDark = brand.logoDark || "";
    const safeBrand = {
      clientName: brand.clientName || ctx.company || "Client",
      navy: brand.navy || "#171758",
      navyDark: brand.navyDark || "#0A0A34",
      accent: brand.accent || "#EA6B47",
      blue: brand.blue || "#4F79C2",
      date: brand.date || new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }),
    };
    const html = buildDefinitionHTML({ definition, ctx, brand: safeBrand, logoDark });
    const browser = await getBrowser();
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });
    const pdf = await page.pdf({ width: "8.5in", height: "11in", printBackground: true });
    await page.close();
    const pdfBuffer = Buffer.isBuffer(pdf) ? pdf : Buffer.from(pdf);
    const fname = `${(ctx.role || "role").replace(/[^a-z0-9]+/gi, "_")}_Definition.pdf`;
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${fname}"`);
    res.setHeader("Content-Length", pdfBuffer.length);
    res.status(200).end(pdfBuffer);
  } catch (err) {
    console.error("definition-pdf error:", err);
    res.status(500).json({ error: "PDF generation failed", detail: String(err && err.message || err) });
  }
});
//  The branded Job Ad PDF. Same shape as the other endpoints: takes the
//  assembled jobad (from the app's buildJobAd()), builds the HTML via the job
//  ad engine, renders with the same warm Chrome, streams the PDF back.
app.post("/jobad-pdf", async (req, res) => {
  if (denyUnauthed(req, res)) return;
  try {
    const { jobad, ctx, brand } = req.body || {};
    if (!jobad || !ctx || !brand) {
      return res.status(400).json({ error: "jobad, ctx, and brand are required" });
    }
    const logoDark = brand.logoDark || "";
    const safeBrand = {
      clientName: brand.clientName || ctx.company || "Client",
      navy: brand.navy || "#171758",
      navyDark: brand.navyDark || "#0A0A34",
      accent: brand.accent || "#EA6B47",
      blue: brand.blue || "#4F79C2",
      date: brand.date || new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }),
    };
    const html = buildJobAdHTML({ jobad, ctx, brand: safeBrand, logoDark });
    const browser = await getBrowser();
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });
    const pdf = await page.pdf({ width: "8.5in", height: "11in", printBackground: true });
    await page.close();
    const pdfBuffer = Buffer.isBuffer(pdf) ? pdf : Buffer.from(pdf);
    const fname = `${(ctx.role || "role").replace(/[^a-z0-9]+/gi, "_")}_JobAd.pdf`;
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${fname}"`);
    res.setHeader("Content-Length", pdfBuffer.length);
    res.status(200).end(pdfBuffer);
  } catch (err) {
    console.error("jobad-pdf error:", err);
    res.status(500).json({ error: "PDF generation failed", detail: String(err && err.message || err) });
  }
});

// ── /site-colors ─────────────────────────────────────────────────────────
//  Load a URL in REAL Chrome (so JS-applied color, image logos, and external
//  stylesheets all render), screenshot the above-the-fold view, and sample the
//  dominant BRAND colors a human actually sees. This is the reliable version of
//  "pull colors from the website" — it sees the rendered page, not the raw HTML,
//  so it gets a brand's true green/purple instead of structural framework hexes.
//
//  Request:  { url }                       (plus x-render-secret)
//  Response: { colors: ["#aabbcc", ...], readable: true }
//            { colors: [], readable: false, reason }   on failure (never throws
//            up the stack so the caller can fall back to logo-color extraction).
//  Private, loopback, link-local, and internal hosts are refused before Chrome
//  fetches. The same check runs again on every request, including redirects.
const deps = {
  lookup: defaultLookup,
  screenshot: screenshotPublicPage,
};

function colorFailure(res, reason) {
  const status = reason === "blocked_host" ? 400 : 200;
  return res.status(status).json({ colors: [], readable: false, reason });
}

async function reviewBrowserRequest(request, guard) {
  let verdict;
  try {
    verdict = await guard(request.url());
  } catch (err) {
    try { await request.abort("failed"); } catch (_) {}
    return { blockedNav: !!request.isNavigationRequest() };
  }
  if (!verdict || !verdict.ok) {
    try { await request.abort("blockedbyclient"); } catch (_) {}
    return { blockedNav: !!request.isNavigationRequest() && verdict && verdict.reason === "blocked_host" };
  }
  await request.continue();
  return { blockedNav: false };
}

async function screenshotPublicPage(target, guard) {
  const browser = await getBrowser();
  const page = await browser.newPage();
  let blockedNav = false;
  try {
    await page.setViewport({ width: 1280, height: 900 });
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36"
    );
    await page.setRequestInterception(true);
    page.on("request", async (request) => {
      const decision = await reviewBrowserRequest(request, guard);
      if (decision.blockedNav) blockedNav = true;
    });
    await page.goto(target, { waitUntil: "networkidle2", timeout: 15000 });
    if (blockedNav) {
      const err = new Error("blocked_host");
      err.reason = "blocked_host";
      throw err;
    }
    await new Promise((r) => setTimeout(r, 600));
    return await page.screenshot({ type: "png", fullPage: false });
  } catch (err) {
    const msg = String((err && err.message) || err);
    if (blockedNav || (err && err.reason === "blocked_host") || /ERR_BLOCKED_BY_CLIENT|blockedbyclient/i.test(msg)) {
      const blocked = new Error("blocked_host");
      blocked.reason = "blocked_host";
      throw blocked;
    }
    throw err;
  } finally {
    try { await page.close(); } catch (_) {}
  }
}

app.post("/site-colors", async (req, res) => {
  if (denyUnauthed(req, res)) return;
  const { url } = req.body || {};
  if (!url || typeof url !== "string") {
    return res.status(400).json({ error: "url is required" });
  }

  const guard = (nextUrl) => checkPublicHttpUrl(nextUrl, deps.lookup);
  const verdict = await guard(url);
  if (!verdict.ok) return colorFailure(res, verdict.reason);

  try {
    const shot = await deps.screenshot(verdict.href, guard);
    const colors = await extractDominantColors(shot, 6);
    if (!colors.length) {
      return res.status(200).json({ colors: [], readable: false, reason: "empty" });
    }
    return res.status(200).json({ colors, readable: true });
  } catch (err) {
    if (err && err.reason === "blocked_host") return colorFailure(res, "blocked_host");
    const msg = String((err && err.message) || err);
    let reason = "unreachable";
    if (/timeout/i.test(msg)) reason = "timeout";
    else if (/net::ERR_NAME_NOT_RESOLVED|ENOTFOUND/i.test(msg)) reason = "unreachable";
    else if (/net::ERR_CONNECTION|ECONNREFUSED/i.test(msg)) reason = "server_down";
    console.error("site-colors error:", msg);
    return res.status(200).json({ colors: [], readable: false, reason });
  }
});

if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  const server = app.listen(PORT, () => {
    const addr = server.address();
    console.log(`Debrief PDF service listening on ${addr && addr.port || PORT}`);
  });
}

module.exports = { app, deps, reviewBrowserRequest };
