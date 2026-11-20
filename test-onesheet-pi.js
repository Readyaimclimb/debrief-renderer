#!/usr/bin/env node
// The PI page may describe the seat and offer questions. It may not label,
// rank, or predict the candidate. Builds HTML only. No Chrome, no network.
const { buildOneSheetHTML } = require("./assemble-onesheet");

let failed = 0;
function assert(name, cond) {
  if (cond) console.log("  ok   " + name);
  else { failed++; console.log("  FAIL " + name); }
}

const brand = { clientName: "Summit", navy: "#171758", accent: "#2E7D32" };
const ctx = { candidate: "Maria Chen", role: "Operations Manager" };

function page(block) {
  return buildOneSheetHTML({ prep_blocks: [block], ctx, brand });
}

const seat = {
  id: "pi-job-fit",
  lane: "pi",
  name: "Seat range",
  live: false,
  seatOnly: true,
  intro: "These lines are the behavioral range Operations Manager is built for, and questions to explore in the interview.",
  purpose: "Hear how this person has worked. The ranges describe the seat. You decide what you heard.",
  questions: ["Tell me about a time you had to take charge before anyone asked you to. What did you do?"],
  green: [],
  red: [],
  drives: [{
    factor: "A",
    label: "How hard they push",
    band: [-0.5, 0.5],
    range: "How hard they push: this seat's target range is -0.5 to 0.5.",
    questions: ["Tell me about a time you had to take charge before anyone asked you to. What did you do?"],
  }],
};

const oldLive = {
  id: "pi-job-fit",
  lane: "pi",
  name: "PI job-fit",
  live: true,
  locked: false,
  intro: "PI measures how this candidate is naturally wired.",
  purpose: "We are testing whether this person's natural behavior fits the role.",
  questions: [],
  green: [{ id: "pi-job-fit:green:01", text: "How hard they push: Pushes at about the level this seat needs." }],
  red: [{ id: "pi-job-fit:red:01", text: "How outgoing they are: Is more reserved than this seat calls for." }],
  drives: [
    { factor: "D", label: "How they handle rules & detail", direction: "stretch", side: "low", read: "Is looser with rules and detail than this seat wants.", probe: "Walk me through how you keep things from slipping.", first90: "They'll wait for permission unless you hand it over." },
    { factor: "A", label: "How hard they push", direction: "align", read: "Pushes at about the level this seat needs.", probe: null, first90: null },
  ],
};

const seatHtml = page(seat);
const oldHtml = page(oldLive);

function banned(html) {
  return /natural fit|worth probing|do it well|they'll do it well|strong natural fit|green flag|red flag|\bstretch/i.test(html);
}

assert("seat page keeps the target range", seatHtml.includes("this seat's target range is -0.5 to 0.5"));
assert("seat page keeps the interview question", seatHtml.includes("take charge before anyone asked"));
assert("seat page does not judge", !banned(seatHtml) && !/fits the role/i.test(seatHtml));
assert("old live payload does not print the candidate read", !oldHtml.includes("looser with rules") && !oldHtml.includes("Pushes at about the level"));
assert("old live payload does not print a first-90 prediction", !oldHtml.includes("wait for permission"));
assert("old live payload still offers the question", oldHtml.includes("keep things from slipping"));
assert("old live payload does not paint fit or stretch", !banned(oldHtml));
assert("divider no longer predicts", !seatHtml.includes("Will the fit last") && !oldHtml.includes("Will the fit last"));

console.log(failed ? failed + " failed" : "all passed");
process.exit(failed ? 1 : 0);
