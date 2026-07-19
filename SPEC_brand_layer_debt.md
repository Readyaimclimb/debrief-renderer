# SPEC_brand_layer_debt.md — two defects the Trueseat migration exposed

**Status: SPEC, zero code. PARKED — neither blocks a client.**
**Owner: BUILD lane.**
**Created: 2026-07-18, Chat 71.**

Both items below were invisible while Ready Aim Climb the firm and the product
were the same thing. **The rebrand did not create them; it revealed them.** Both
become defects the moment a white-label coach resells the platform, which makes
HireVP the forcing function for both.

---

## D1 — A DELIVERY-VOICE TRAIT IS HARDCODED AS A PLATFORM CONSTANT

### The finding

`api/values-draft.js` line 37:

> "You are a world-class business guide for Trueseat, a **faith-friendly**
> people-strategy and hiring firm."

"Faith-friendly" is not branding. It is a live instruction that biases lexical
choice toward stewardship, calling, service, and integrity-as-character rather
than integrity-as-compliance. It shapes the **depth beneath a client's approved
core values** — definitions, interview questions, probes, what-to-listen-for,
rubrics — and that output lands in Culture Codified and the behavioral interview
guide. **A client reads it.**

### Why it is a defect now

Every other client-varying attribute in this system lives on the client record:
`assessment`, `compareEnabled`, `rampCeiling`, branding, values. Faith-friendliness
is the only voice attribute hardcoded into a prompt that runs for **every tenant**.

While RAC was both the firm and the delivery, this was correct — it described how
Brian coaches. Under a white-label it is not yours to apply. **A coach in Portland
reselling Trueseat did not sign up to have their client's values drafted
faith-friendly, and their client never chose it.** HireVP has ten downstream
clients inbound in sixty days.

### The unresolved question this spec does NOT answer

Nobody has measured what removing it does. Both positions are currently
assertions:

- Keeping it may impose an unrequested voice on clients it does not fit.
- Removing it may flatten output into generic corporate values language, which
  is arguably worse.

**Do the measurement before the build.** Draft values on a throwaway client with
the trait in, save the output, remove it, run again, diff. That is the Chat-61
AI-drift-check discipline applied here, and it converts opinion into evidence.

### The shape of the fix

A per-client **voice attribute** on the client record, defaulting to neutral,
set at onboarding. Same four-allowlist-homes discipline as `partnerCode` — see
`SPEC_partner_hierarchy.md` for the exact homes (`getClient`, `normalize`,
`inCodeClientList`, plus the `api/config.js` response). `compareEnabled` is the
working precedent.

Open design questions, deliberately not resolved here:
- Is it a boolean (`faithFriendly`) or an enum (`voice: neutral | faith-friendly | ...`)?
  An enum is more honest and does not need a migration when a third voice appears.
- Who sets it — the owner during onboarding, or the coach provisioning the tenant?
  Under a white-label the **coach** is the one who knows their client.
- Does it reach only `values-draft.js`, or every AI surface (job ads, 30/60/90,
  company-context)? Consistency argues for all; blast radius argues for one first.

### Sequencing

**Gated behind `SPEC_partner_hierarchy.md` Brick 1.** Both add a field to the
client record through the same four homes. Doing them in one pass is cheaper and
halves the chance of a silent field drop.

---

## D2 — THE MAGIC-LINK EMAIL TEMPLATE IS TRIPLICATED

### The finding

`api/auth-request.js`, `api/team-manage.js`, and `api/admin.js` each carry a
**byte-identical** copy of the sign-in email — verified by md5 during the Chat-71
rebrand, all three hashing to `f8655f9e0b7a9653992b0f650d382840`.

Tonight's brand pass therefore required the same five edits **three times**:
subject line, body line, plain-text footer, HTML footer, and the button colour
(`#C0392B` RAC red → `#2E7D32` Go Green — a Chat-61 miss that survived because
the template was never looked at).

### Why it is a defect

This is the **parallel-copy pattern** already banked as a permanent deploy scar
in governance. The failure mode is specific and silent: change one file, miss the
other two, and **two-thirds of your login emails keep the old branding with no
error, no test failure, and no way to notice** short of triggering each path by
hand — a magic-link sign-in, a team invite, and an admin-sent invite are three
different user journeys.

Login email is the single highest-stakes client-facing surface on the platform.
Every person who ever uses the product reads it.

### The shape of the fix

Extract to `api/_lib/authEmail.js` exporting a builder — roughly
`buildSignInEmail({ link, brandName })` returning `{ subject, text, html }`.
Three call sites import it. One future brand change becomes one edit.

⚠️ **Parallel-copy trap applies to the fix itself.** `api/_lib/` versus any
frontend mirror — check the folder every time. Precedents: `pace.js`,
`readinessChecks.js`, `jobtarget.js`.

### Why it was NOT done in Chat 71

Explicit five-lens verdict: **a refactor of three live auth routes during a domain
migration stacks two unverified changes**, which the iron rules forbid. The
duplication is real debt but *cheap* debt — a login template changes roughly once
a decade. Fix in place first, extract later, never both at once.

### Sequencing

Any time there is slack. **Not urgent.** The one condition that would raise it:
if the white-label work makes the sender brand per-coach, the template stops
being a constant and the triplication becomes a live bug rather than latent debt.

---

## THE PATTERN WORTH REMEMBERING

Both defects share a root: **something that varies per client was frozen as a
platform constant, because at the time there was only one client-facing brand.**

That is the same class as the finding in `SPEC_partner_hierarchy.md` (no partner
relationship exists on a client record) and the same class as
`api/_lib/featureGate.js`'s tier labels, which now read "Trueseat w/ PI Hire" —
correct for a direct client, **wrong under a coach's brand**, and not fixable by
renaming.

Expect more of these as the channel opens. The diagnostic question when one
appears: *would this still be right if a coach in another state resold it to a
client I have never met?*
