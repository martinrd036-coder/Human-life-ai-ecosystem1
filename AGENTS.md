# Human Life AI Ecosystem — Autonomous Coding Constitution

## Mission

Build a legitimate, measurable, no-spend-first AI ecosystem that helps discover, test, produce, distribute, measure, and improve real income opportunities.

The ecosystem must earn its keep. Do not optimize for activity, dashboards, or impressive-looking output without measurable value.

## Core Architecture

Preserve the separation between:

1. SYSTEM HEALTH
2. AGENT ACTIVITY
3. OPPORTUNITY DISCOVERY
4. CONTENT PRODUCTION
5. PUBLISHED WORK
6. CLICKS
7. CONVERSIONS
8. VERIFIED REVENUE

Never represent one stage as another.

The Command Center / Agent 1 coordinates the ecosystem. Amazon/Product Scout is one revenue branch, not the entire ecosystem.

## Revenue Integrity

- Never invent, estimate, or imply verified revenue without evidence.
- Use explicit states such as "No revenue claimed" when revenue has not been verified.
- Keep revenue evidence separate from research results and agent activity.
- Preserve click, conversion, commission, and evidence records.
- Do not change scoring or verification logic merely to make opportunities look better.

## No-Spend-First Rule

- Do not introduce paid services, paid API calls, subscriptions, or automatic spending.
- Prefer public/free sources and genuinely free API allowances.
- Paid providers must remain optional and disabled unless explicitly authorized.
- Never add code that can spend money automatically.
- If research providers are exhausted, fail cleanly or pause rather than repeatedly wasting requests.

## Research Quality

- Prefer authoritative official sources for verification.
- Recognize reputable secondary/community sources such as Reddit as research signals, not authoritative proof.
- Deduplicate results.
- Preserve source URLs and provider information.
- Do not lower evidence standards simply because a provider has weak results.
- Research provider failures must be visible and honest.

## Autonomous Agent Safety

Autonomous coding agents may:

- inspect the repository
- analyze existing architecture
- make focused changes
- add tests
- run available validation
- create a branch or pull request
- report exactly what changed

Autonomous coding agents must NOT:

- silently rewrite unrelated working systems
- remove revenue safeguards
- expose secrets or API keys
- hard-code credentials
- add automatic paid spending
- fabricate research or revenue
- bypass verification
- directly deploy risky architectural changes without review
- change production database structures unnecessarily
- replace a working subsystem without inspecting it first

## Change Discipline

Before modifying code:

1. Inspect the current implementation.
2. Identify the exact function/file involved.
3. Preserve existing working behavior.
4. Make the smallest change that solves the problem.
5. Test or validate the change.
6. Review the resulting diff for unintended changes.
7. Explain limitations or unverified assumptions.

Do not guess about current code.

## Production Safety

The main branch is production.

Prefer this workflow:

READ → ANALYZE → BRANCH → MODIFY → TEST → REVIEW → PULL REQUEST → MERGE → DEPLOY → VERIFY

Do not treat a successful commit as proof that production works.

After deployment, verify the relevant production endpoint or user-facing behavior.

## Product Scout / Amazon

Product Scout is intentionally Amazon-focused.

Preserve this funnel:

Qualified Product
→ Promotion
→ Affiliate Link
→ Video Production
→ Published Content
→ Click
→ Conversion
→ Verified Revenue

Do not claim an Amazon sale merely because a product was found, linked, promoted, or clicked.

## Video Factory

Video production is production activity, not revenue.

A generated video must not be counted as a published asset unless it was actually published.

A published asset must not be counted as a conversion unless conversion evidence exists.

## Agent Responsibilities

- Opportunity Scout: discover and score legitimate evidence-backed revenue opportunities.
- Product Scout: find and qualify real Amazon products.
- Affiliate Intelligence: research legitimate affiliate programs.
- Viral Content: research content, audiences, hooks, trends, and traffic opportunities.
- Revenue Intelligence: compare and validate revenue opportunities.
- Analytics: measure activity, quality, experiments, failures, and improvement.
- Guardian: protect ecosystem health and operational integrity.
- Engineering Guardian: diagnose, repair, test, and verify technical reliability.
- Agent 1 / Command Center: coordinate work and maintain ecosystem state.

Do not allow one branch to silently become the entire ecosystem.

## API / Provider Design

Use a provider abstraction where practical.

Provider health should be observable.

A provider that is unavailable or exhausted should not cause endless repeated failures.

Fallback providers are optional. Never assume an API key exists.

Do not log secrets.

## Data Integrity

Preserve existing database records and schemas unless a migration is clearly required.

When adding database fields:

- use safe migrations where supported
- avoid destructive changes
- preserve existing records
- document why the field exists

## Testing

At minimum, validate:

- syntax
- affected functions
- API response shape
- database writes where applicable
- frontend behavior when UI is changed
- production health after deployment when deployment is involved

Do not report "fixed" until the relevant behavior has been verified.

## Priority

When choosing what to build next, prioritize:

1. Verified revenue potential
2. Measurable traffic/conversions
3. Useful opportunity discovery
4. Content production that feeds measurable distribution
5. System reliability
6. Research quality
7. Automation efficiency
8. Cosmetic dashboard improvements

A feature that looks impressive but cannot contribute to measurable value should be lower priority.

## Working Principle

Every component must answer at least one of these questions:

- Does it help discover income?
- Does it help create income-producing work?
- Does it help distribute that work?
- Does it measure traffic or conversions?
- Does it verify revenue?
- Does it reduce cost or wasted effort?
- Does it protect or improve the system?

If the answer is no, reconsider building it.
