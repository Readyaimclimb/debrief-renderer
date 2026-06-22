// ════════════════════════════════════════════════════════════════════════
//  sampler.js — extract the BRAND colors a human actually sees from a
//  screenshot. Used by the /site-colors endpoint: Chrome renders the page
//  fully (logo, buttons, JS-applied color and all), we screenshot it, and
//  this samples the dominant *saturated* colors — the real brand palette,
//  not the structural noise (white backgrounds, grey text, framework defaults)
//  that a raw-HTML hex scrape picks up by mistake.
//
//  Approach: resize to a small thumbnail (fast, averages noise), read raw RGB
//  pixels, drop near-white/black/grey, then score each remaining color by
//  frequency × saturation — brand colors are BOTH common and vivid. De-dupe
//  perceptually so we return distinct hues, not four shades of one blue.
// ════════════════════════════════════════════════════════════════════════
const sharp = require("sharp");

async function extractDominantColors(pngBuffer, max = 6) {
  const W = 160, H = 100; // small thumbnail — enough signal, cheap
  const { data, info } = await sharp(pngBuffer)
    .resize(W, H, { fit: "fill" })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const ch = info.channels; // 3 (RGB after removeAlpha)
  const buckets = new Map(); // quantized color -> { count, r, g, b sums }

  for (let i = 0; i < data.length; i += ch) {
    const r = data[i], g = data[i + 1], b = data[i + 2];
    if (isStructural(r, g, b)) continue; // skip white/grey/black
    // quantize to 16-level buckets per channel so near-identical pixels merge
    const key = (Math.round(r / 16) << 10) | (Math.round(g / 16) << 5) | Math.round(b / 16);
    const e = buckets.get(key);
    if (e) { e.count++; e.r += r; e.g += g; e.b += b; }
    else buckets.set(key, { count: 1, r, g, b });
  }

  // score = count × (0.4 + saturation) — favors colors that are common AND vivid
  const scored = [];
  for (const e of buckets.values()) {
    const r = Math.round(e.r / e.count), g = Math.round(e.g / e.count), b = Math.round(e.b / e.count);
    const sat = saturation(r, g, b);
    if (sat < 0.18) continue; // too washed out to be a brand color
    scored.push({ r, g, b, score: e.count * (0.4 + sat) });
  }
  scored.sort((a, b) => b.score - a.score);

  // de-dupe perceptually-close colors so we don't return 4 tints of one hue
  const out = [];
  for (const c of scored) {
    if (out.every((o) => colorDist(o, c) > 90)) out.push(c);
    if (out.length >= max) break;
  }
  return out.map((c) => rgbToHex(c.r, c.g, c.b));
}

function isStructural(r, g, b) {
  if (r > 238 && g > 238 && b > 238) return true; // near-white
  if (r < 22 && g < 22 && b < 22) return true;    // near-black
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  if (max - min < 20) return true;                // grey (low saturation)
  return false;
}
function saturation(r, g, b) {
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  if (max === 0) return 0;
  return (max - min) / max;
}
function colorDist(a, b) {
  return Math.sqrt((a.r - b.r) ** 2 + (a.g - b.g) ** 2 + (a.b - b.b) ** 2);
}
function rgbToHex(r, g, b) {
  const h = (n) => n.toString(16).padStart(2, "0");
  return "#" + h(r) + h(g) + h(b);
}

module.exports = { extractDominantColors };
