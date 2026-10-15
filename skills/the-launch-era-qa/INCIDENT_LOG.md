# INCIDENT_LOG.md

## 2026-10-15 — Bundle preparation missing on dedicated Command Center
- Verified root cause: dedicated deployment pinned the older October 14 portal, omitting newer owner bundle queue/rendering. Updated pin to 44b5edc with existing owner dashboard, compact assistant, practice studio and client overlays preserved. Added an owner-only Prepare bundles shortcut; no orders, payment, intake, approval or email data modified.
- Public Jessie avatar/name synchronized separately. Static and browser deployment gates required; authenticated owner purchase-to-delivery acceptance remains pending.
