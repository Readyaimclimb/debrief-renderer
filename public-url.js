// Decide whether /site-colors may fetch a URL. Fail closed: only http(s),
// and only when every resolved address is a public unicast host.
const dns = require("dns");
const net = require("net");

function defaultLookup(hostname) {
  return dns.promises.lookup(hostname, { all: true, verbatim: true });
}

function stripHost(hostname) {
  let h = String(hostname || "").trim().toLowerCase();
  h = h.replace(/\.+$/, "");
  if (h.startsWith("[") && h.endsWith("]")) h = h.slice(1, -1);
  const zone = h.indexOf("%");
  if (zone !== -1) h = h.slice(0, zone);
  return h;
}

function blockedName(host) {
  if (host === "localhost" || host.endsWith(".localhost")) return true;
  if (host.endsWith(".local") || host.endsWith(".internal")) return true;
  return false;
}

function blockedV4(ip) {
  const p = ip.split(".").map((n) => Number(n));
  if (p.length !== 4 || p.some((n) => !Number.isInteger(n) || n < 0 || n > 255)) return true;
  const a = p[0];
  const b = p[1];
  if (a === 0) return true;                         // 0.0.0.0/8
  if (a === 10) return true;                        // RFC1918
  if (a === 127) return true;                       // loopback
  if (a === 169 && b === 254) return true;          // link-local, incl. 169.254.169.254
  if (a === 172 && b >= 16 && b <= 31) return true; // RFC1918
  if (a === 192 && b === 168) return true;          // RFC1918
  if (a === 100 && b >= 64 && b <= 127) return true; // CGNAT 100.64.0.0/10
  return false;
}

function ipv6Bytes(ip) {
  let s = ip.toLowerCase();
  const v4 = s.match(/^(.*:)(\d{1,3}(?:\.\d{1,3}){3})$/);
  if (v4) {
    const oct = v4[2].split(".").map((n) => Number(n));
    if (oct.length !== 4 || oct.some((n) => !Number.isInteger(n) || n > 255)) return null;
    const hi = ((oct[0] << 8) | oct[1]).toString(16);
    const lo = ((oct[2] << 8) | oct[3]).toString(16);
    s = v4[1] + hi + ":" + lo;
  }
  const halves = s.split("::");
  if (halves.length > 2) return null;
  const head = halves[0] ? halves[0].split(":") : [];
  const tail = halves.length === 2 && halves[1] ? halves[1].split(":") : [];
  if (halves.length === 1 && head.length !== 8) return null;
  const missing = 8 - head.length - tail.length;
  if (halves.length === 2 && missing < 1) return null;
  const groups = halves.length === 2 ? [...head, ...Array(missing).fill("0"), ...tail] : head;
  if (groups.length !== 8) return null;
  const bytes = [];
  for (const g of groups) {
    if (!/^[0-9a-f]{1,4}$/.test(g)) return null;
    const n = parseInt(g, 16);
    bytes.push((n >> 8) & 255, n & 255);
  }
  return bytes;
}

function blockedV6(bytes) {
  if (bytes.every((b) => b === 0)) return true; // ::
  if (bytes.slice(0, 15).every((b) => b === 0) && bytes[15] === 1) return true; // ::1
  if ((bytes[0] & 0xfe) === 0xfc) return true; // fc00::/7 ULA
  // fe80::/10 link-local and fec0::/10 deprecated site-local
  if (bytes[0] === 0xfe && (bytes[1] & 0xc0) !== 0) return true;
  const mapped = bytes.slice(0, 10).every((b) => b === 0) && bytes[10] === 0xff && bytes[11] === 0xff;
  if (mapped) return blockedV4(bytes[12] + "." + bytes[13] + "." + bytes[14] + "." + bytes[15]);
  const compat = bytes.slice(0, 12).every((b) => b === 0);
  if (compat) return blockedV4(bytes[12] + "." + bytes[13] + "." + bytes[14] + "." + bytes[15]);
  return false;
}

function isBlockedIp(ip) {
  const host = stripHost(ip);
  if (net.isIPv4(host)) return blockedV4(host);
  const bytes = ipv6Bytes(host);
  if (!bytes) return true;
  return blockedV6(bytes);
}

function withHttpScheme(trimmed) {
  const m = trimmed.match(/^([a-z][a-z0-9+.-]*):/i);
  if (m) {
    const scheme = m[1].toLowerCase();
    // Real schemes have no dot. "example.com:8080" is a host and a port.
    if (!scheme.includes(".")) {
      if (scheme !== "http" && scheme !== "https") return null;
      return trimmed;
    }
  }
  return "https://" + trimmed;
}

function recordsOf(records) {
  const list = Array.isArray(records) ? records : (records ? [records] : []);
  return list.map((rec) => (typeof rec === "string" ? rec : rec && rec.address)).filter(Boolean);
}

// lookup(hostname) -> [{ address, family }, ...] or a single address string.
// Returns { ok:true, href } or { ok:false, reason:"blocked_host"|"bad_url"|"unreachable" }.
async function checkPublicHttpUrl(raw, lookup = defaultLookup) {
  const trimmed = String(raw == null ? "" : raw).trim();
  if (!trimmed) return { ok: false, reason: "bad_url" };
  const toParse = withHttpScheme(trimmed);
  if (!toParse) return { ok: false, reason: "blocked_host" };

  let parsed;
  try {
    parsed = new URL(toParse);
  } catch {
    return { ok: false, reason: "bad_url" };
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return { ok: false, reason: "blocked_host" };
  }

  const host = stripHost(parsed.hostname);
  if (!host || blockedName(host)) return { ok: false, reason: "blocked_host" };
  if (net.isIP(host)) {
    if (isBlockedIp(host)) return { ok: false, reason: "blocked_host" };
    return { ok: true, href: parsed.href };
  }

  let records;
  try {
    records = await lookup(host);
  } catch {
    return { ok: false, reason: "unreachable" };
  }
  const addrs = recordsOf(records);
  if (!addrs.length) return { ok: false, reason: "unreachable" };
  for (const addr of addrs) {
    if (isBlockedIp(addr)) return { ok: false, reason: "blocked_host" };
  }
  return { ok: true, href: parsed.href };
}

module.exports = { checkPublicHttpUrl, defaultLookup, isBlockedIp };
