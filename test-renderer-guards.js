#!/usr/bin/env node
// Fail closed when RENDER_SHARED_SECRET is unset, 404 the deleted proof
// routes, and refuse private hosts on /site-colors. No Chrome and no network:
// DNS and the screenshot are mocked where a public host has to succeed.
const http = require("http");
const { spawn } = require("child_process");
const sharp = require("sharp");
const { checkPublicHttpUrl } = require("./public-url");

process.env.RENDER_SHARED_SECRET = "test-secret";
const { app, deps, reviewBrowserRequest } = require("./server");

const SECRET = "test-secret";
let failed = 0;
function assert(name, cond) {
  if (cond) console.log("  ok   " + name);
  else { failed++; console.log("  FAIL " + name); }
}

const PROTECTED = [
  "/debrief-pdf",
  "/onesheet-pdf",
  "/culture-pdf",
  "/playbook-pdf",
  "/roadmap-pdf",
  "/definition-pdf",
  "/jobad-pdf",
  "/site-colors",
];

function request(port, method, path, { headers, body } = {}) {
  return new Promise((resolve, reject) => {
    const payload = body == null ? null : Buffer.from(JSON.stringify(body));
    const h = Object.assign({}, headers || {});
    if (payload) {
      h["content-type"] = "application/json";
      h["content-length"] = payload.length;
    }
    const req = http.request({ hostname: "127.0.0.1", port, method, path, headers: h }, (res) => {
      const chunks = [];
      res.on("data", (c) => chunks.push(c));
      res.on("end", () => {
        const text = Buffer.concat(chunks).toString("utf8");
        let json = null;
        try { json = JSON.parse(text); } catch (_) {}
        resolve({ status: res.statusCode, json, text });
      });
    });
    req.on("error", reject);
    req.end(payload || undefined);
  });
}

function spawnServer(envPatch) {
  return new Promise((resolve, reject) => {
    const env = Object.assign({}, process.env);
    for (const [k, v] of Object.entries(envPatch || {})) {
      if (v == null) delete env[k];
      else env[k] = v;
    }
    env.PORT = "0";
    const child = spawn(process.execPath, ["server.js"], {
      cwd: __dirname,
      env,
      stdio: ["ignore", "pipe", "pipe"],
    });
    let out = "";
    let settled = false;
    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      child.kill("SIGTERM");
      reject(new Error("server did not listen\n" + out));
    }, 20000);
    const onData = (buf) => {
      out += buf.toString();
      const m = out.match(/listening on (\d+)/);
      if (!m || settled) return;
      settled = true;
      clearTimeout(timer);
      resolve({
        port: Number(m[1]),
        stop() {
          return new Promise((done) => {
            child.once("exit", () => done());
            child.kill("SIGTERM");
          });
        },
      });
    };
    child.stdout.on("data", onData);
    child.stderr.on("data", (buf) => { out += buf.toString(); });
    child.on("exit", (code) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      reject(new Error("server exited " + code + "\n" + out));
    });
  });
}

function auth(secret) {
  return { "x-render-secret": secret };
}

async function expectRefused(port, label) {
  for (const path of PROTECTED) {
    const res = await request(port, "POST", path, { body: { url: "https://example.com" } });
    assert(label + " " + path + " refuses (" + res.status + ")", res.status === 503 && res.json && res.json.error === "unauthorized");
  }
  const health = await request(port, "GET", "/health");
  assert(label + " /health stays up", health.status === 200 && health.json && health.json.status === "ok");
}

async function redPng() {
  return sharp({
    create: { width: 32, height: 32, channels: 3, background: { r: 220, g: 32, b: 32 } },
  }).png().toBuffer();
}

(async () => {
  console.log("unset secret, fresh process");
  const unset = await spawnServer({ RENDER_SHARED_SECRET: null });
  try {
    await expectRefused(unset.port, "unset");
    const proof = await request(unset.port, "GET", "/playbook-proof");
    const culture = await request(unset.port, "GET", "/culture-proof");
    assert("unset /playbook-proof is 404", proof.status === 404);
    assert("unset /culture-proof is 404", culture.status === 404);
  } finally {
    await unset.stop();
  }

  console.log("empty secret, fresh process");
  const empty = await spawnServer({ RENDER_SHARED_SECRET: "" });
  try {
    await expectRefused(empty.port, "empty");
  } finally {
    await empty.stop();
  }

  console.log("set secret, fresh process");
  const live = await spawnServer({ RENDER_SHARED_SECRET: SECRET });
  try {
    const missing = await request(live.port, "POST", "/debrief-pdf", { body: {} });
    assert("set secret, no header is 401", missing.status === 401 && missing.json && missing.json.error === "unauthorized");

    const opened = await request(live.port, "POST", "/debrief-pdf", { headers: auth(SECRET), body: {} });
    assert(
      "set secret, valid header reaches the handler",
      opened.status === 400 && opened.json && opened.json.error === "report, ctx, and brand are required"
    );

    const blockedUrls = [
      ["127.0.0.1", "http://127.0.0.1/"],
      ["10.x", "http://10.9.8.7/latest"],
      ["169.254.169.254", "http://169.254.169.254/latest/meta-data/"],
      ["localhost", "http://localhost/"],
      ["[::1]", "http://[::1]/"],
      ["decimal loopback", "http://2130706433/"],
      ["mapped loopback", "http://[::ffff:127.0.0.1]/"],
    ];
    for (const [name, url] of blockedUrls) {
      const res = await request(live.port, "POST", "/site-colors", {
        headers: auth(SECRET),
        body: { url },
      });
      assert(
        "live /site-colors refuses " + name,
        res.status === 400 && res.json && res.json.readable === false && res.json.reason === "blocked_host" && !(res.json.colors || []).length
      );
    }

    const play = await request(live.port, "GET", "/playbook-proof");
    const cult = await request(live.port, "GET", "/culture-proof");
    assert("set secret /playbook-proof is 404", play.status === 404);
    assert("set secret /culture-proof is 404", cult.status === 404);
  } finally {
    await live.stop();
  }

  console.log("mocked DNS and screenshot");
  const lookups = [];
  deps.lookup = async (hostname) => {
    lookups.push(hostname);
    const table = {
      "example.com": ["93.184.216.34"],
      "private.test": ["10.2.3.4"],
      "mixed.test": ["93.184.216.34", "192.168.1.9"],
      "public.example": ["2606:4700:4700::1111"],
    };
    if (!table[hostname]) {
      const err = new Error("ENOTFOUND " + hostname);
      err.code = "ENOTFOUND";
      throw err;
    }
    return table[hostname].map((address) => ({ address, family: address.includes(":") ? 6 : 4 }));
  };

  const png = await redPng();
  let shots = 0;
  deps.screenshot = async (target, guard) => {
    shots++;
    const hop = await guard(target);
    if (!hop.ok) {
      const err = new Error("blocked_host");
      err.reason = "blocked_host";
      throw err;
    }
    return png;
  };

  const server = await new Promise((resolve) => {
    const s = app.listen(0, () => resolve(s));
  });
  const port = server.address().port;
  const stop = () => new Promise((resolve, reject) => server.close((err) => err ? reject(err) : resolve()));
  try {
    const noHeader = await request(port, "POST", "/site-colors", { body: { url: "https://example.com" } });
    assert("in-process missing header is 401", noHeader.status === 401);
    assert("missing header does not fetch", shots === 0);

    shots = 0;
    const ok = await request(port, "POST", "/site-colors", {
      headers: auth(SECRET),
      body: { url: "https://example.com/brand" },
    });
    assert(
      "public host returns colors",
      ok.status === 200 && ok.json && ok.json.readable === true && Array.isArray(ok.json.colors) && /^#[0-9a-f]{6}$/.test(ok.json.colors[0])
    );
    assert("public host was fetched once", shots === 1);
    assert("public host was resolved", lookups.includes("example.com"));

    shots = 0;
    const rebind = await request(port, "POST", "/site-colors", {
      headers: auth(SECRET),
      body: { url: "http://private.test/admin" },
    });
    assert(
      "hostname resolving to a private IP is refused",
      rebind.status === 400 && rebind.json && rebind.json.reason === "blocked_host"
    );
    assert("private resolution was not fetched", shots === 0);

    const mixed = await checkPublicHttpUrl("http://mixed.test/", deps.lookup);
    assert("mixed public+private DNS is refused", mixed.ok === false && mixed.reason === "blocked_host");

    const more = [
      ["CGNAT", "http://100.64.1.1/"],
      ["ULA", "http://[fd12:3456::1]/"],
      ["link-local v6", "http://[fe80::1]/"],
      [".local", "http://printer.local/"],
      [".internal", "http://metadata.google.internal/"],
      ["file", "file:///etc/passwd"],
    ];
    for (const [name, url] of more) {
      const before = shots;
      const res = await request(port, "POST", "/site-colors", {
        headers: auth(SECRET),
        body: { url },
      });
      assert(
        "/site-colors refuses " + name,
        res.status === 400 && res.json && res.json.reason === "blocked_host" && shots === before
      );
    }

    shots = 0;
    deps.screenshot = async (target, guard) => {
      const hop = await guard("http://169.254.169.254/latest/meta-data/");
      if (!hop.ok) {
        const err = new Error("blocked_host");
        err.reason = "blocked_host";
        throw err;
      }
      shots++;
      return png;
    };
    const redirected = await request(port, "POST", "/site-colors", {
      headers: auth(SECRET),
      body: { url: "https://example.com" },
    });
    assert(
      "redirect to the metadata IP is refused",
      redirected.status === 400 && redirected.json && redirected.json.reason === "blocked_host" && shots === 0
    );

    const pubLog = [];
    const pubReq = {
      url: () => "https://example.com/after-redirect",
      isNavigationRequest: () => true,
      abort: async (why) => pubLog.push("abort:" + why),
      continue: async () => pubLog.push("continue"),
    };
    const pubDecision = await reviewBrowserRequest(pubReq, (u) => checkPublicHttpUrl(u, deps.lookup));
    assert("public redirect is allowed through", pubDecision.blockedNav === false && pubLog.join() === "continue");

    const privLog = [];
    const privReq = {
      url: () => "http://10.0.0.5/",
      isNavigationRequest: () => true,
      abort: async (why) => privLog.push("abort:" + why),
      continue: async () => privLog.push("continue"),
    };
    const privDecision = await reviewBrowserRequest(privReq, (u) => checkPublicHttpUrl(u, deps.lookup));
    assert(
      "private redirect is aborted",
      privDecision.blockedNav === true && privLog.join() === "abort:blockedbyclient"
    );

    const bare = await checkPublicHttpUrl("example.com:8080", deps.lookup);
    assert("bare host:port stays http(s) and public", bare.ok === true && bare.href === "https://example.com:8080/");

    const v4public = await checkPublicHttpUrl("http://172.15.255.255/", deps.lookup);
    const v4edge = await checkPublicHttpUrl("http://172.16.0.1/", deps.lookup);
    const cgnatEdge = await checkPublicHttpUrl("http://100.127.255.255/", deps.lookup);
    const cgnatOk = await checkPublicHttpUrl("http://100.128.0.1/", deps.lookup);
    assert("172.15 is public", v4public.ok === true);
    assert("172.16 is private", v4edge.ok === false);
    assert("100.127 is CGNAT", cgnatEdge.ok === false);
    assert("100.128 is public", cgnatOk.ok === true);

    const v6public = await checkPublicHttpUrl("https://public.example/", deps.lookup);
    assert("public IPv6 DNS is allowed", v6public.ok === true);
  } finally {
    await stop();
  }

  console.log(failed ? failed + " failed" : "all passed");
  process.exit(failed ? 1 : 0);
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
