# INCIDENT_LOG.md

## 2026-10-15 — Bundle preparation missing on dedicated Command Center
- Verified root cause: dedicated deployment pinned the older October 14 portal, omitting newer owner bundle queue/rendering. Updated pin to 44b5edc with existing owner dashboard, compact assistant, practice studio and client overlays preserved. Added an owner-only Prepare bundles shortcut; no orders, payment, intake, approval or email data modified.
- Public Jessie avatar/name synchronized separately. Static and browser deployment gates required; authenticated owner purchase-to-delivery acceptance remains pending.


## 2026-10-21 — Sales tools missing from dedicated portal sidebar
- **Symptom:** Owner saw the Sales tools header shortcut but no matching sidebar entry.
- **Verified root cause:** the pinned overlay entry script created only a header button; the pinned base portal intentionally remained unchanged.
- **Safe resolution:** update only the reviewed sales overlay pin to `7f5584ae5187b294c448a4bfff368bd735765492`; inject an owner-gated sidebar link before More tools and route it to the Clara section. Preserve base portal, AI Team, buyer navigation and the protected demo boundary.
- **Verification status:** source/browser QA passed upstream; dedicated overlay CI and live Pages verification pending.


### Owner sidebar production verification — 2026-10-21
- PR #22 merged at `0c96541bde4f325b4570071308992c3441dc5f2b`; isolated overlay QA 39583392290 and Pages deployment 39583670560 succeeded.
- Live deployment metadata reports Sales tools source `7f5584ae5187b294c448a4bfff368bd735765492` and preserves base portal `44b5edc6e32ee850be1f5e6fca441dd17e0a4d4c` plus AI Team `827d044f0c23e8bb85b3d7b2e5cbf133752b9128`.
- Live root loads `sales-tools-entry.js?v=20261021-sidebar1`; `/sales-tools.html#demos` is live and retains the owner sign-in gate. Signed-in owner-device visual acceptance is still separate; no customer data or actions were used.
