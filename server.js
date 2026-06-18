// ════════════════════════════════════════════════════════════════════════
//  Hire2Scale — Debrief PDF Rendering Service
//
//  A standalone rendering service that runs REAL Chrome (installed in the
//  Docker container) to turn debrief data into a branded PDF. Deployed on
//  Render. The Vercel app forwards portal requests here and streams the PDF
//  back, so this service stays invisible to the client.
//
//  Endpoints:
//    GET  /health        → { status: "ok" }   (Render health check)
//    POST /debrief-pdf   → application/pdf     (the real work)
//
//  Why this exists: headless Chromium on Vercel's serverless runtime is
//  library-fragile (the libnss3 saga). Here, Chrome is installed the normal
//  Linux way via the Dockerfile, so it just works — permanently.
// ════════════════════════════════════════════════════════════════════════
const express = require("express");
const puppeteer = require("puppeteer");
const fs = require("fs");
const { buildDebriefHTML } = require("./assemble.js");

const app = express();
app.use(express.json({ limit: "2mb" }));

// Baked CD fallback logo (transparent on-dark knockout) — used when the
// request doesn't supply brand.logoDark. Real clients pass their own.
const CD_FALLBACK_LOGO_DARK = "data:image/png;base64," +
  fs.readFileSync(__dirname + "/cdlogo_dark_t.png.txt", "utf8").trim();

// ── optional shared secret: only requests that know this token are served.
//    Set RENDER_SHARED_SECRET on Render; the Vercel forwarder sends it. ──
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

app.get("/health", (req, res) => res.json({ status: "ok" }));

app.post("/debrief-pdf", async (req, res) => {
  // auth check (if a secret is configured)
  if (SHARED_SECRET && req.get("x-render-secret") !== SHARED_SECRET) {
    return res.status(401).json({ error: "unauthorized" });
  }

  try {
    const { report, ctx, brand } = req.body || {};
    if (!report || !ctx || !brand) {
      return res.status(400).json({ error: "report, ctx, and brand are required" });
    }

    const logoDark = brand.logoDark || CD_FALLBACK_LOGO_DARK;
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

    const fname = `${(ctx.candidate || "candidate").replace(/[^a-z0-9]+/gi, "_")}_Debrief.pdf`;
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${fname}"`);
    res.status(200).send(pdf);
  } catch (err) {
    console.error("debrief-pdf error:", err);
    res.status(500).json({ error: "PDF generation failed", detail: String(err && err.message || err) });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Debrief PDF service listening on ${PORT}`));
